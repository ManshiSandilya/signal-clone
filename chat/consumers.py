import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone

from .models import Conversation, ConversationParticipant, Message, MessageStatus, Reaction
from .serializers import MessageSerializer


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.group_name = f"conversation_{self.conversation_id}"

        if self.user.is_anonymous:
            await self.close(code=4401)
            return

        is_member = await self._is_participant()
        if not is_member:
            await self.close(code=4403)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self._set_online(True)

        # Offline delivery: any message sent to me while I was disconnected
        # is still sitting at status="sent". Flip it to "delivered" now that
        # I'm live, and tell the room so the sender's tick updates.
        newly_delivered = await self._mark_undelivered_as_delivered()
        if newly_delivered:
            await self.channel_layer.group_send(
                self.group_name, {"type": "delivery.receipt", "user_id": str(self.user.id)}
            )

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        if hasattr(self, "user") and not self.user.is_anonymous:
            await self._set_online(False)

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get("action")

        if action == "send_message":
            await self._handle_send_message(data)
        elif action == "typing":
            await self._handle_typing(data)
        elif action == "mark_read":
            await self._handle_mark_read()
        elif action == "react":
            await self._handle_react(data)
        elif action == "remove_react":
            await self._handle_remove_react(data)

    async def _handle_send_message(self, data):
        message = await self._save_message(data.get("body", ""), data.get("reply_to"))
        payload = await database_sync_to_async(lambda: MessageSerializer(message).data)()
        await self.channel_layer.group_send(
            self.group_name, {"type": "chat.message", "payload": payload}
        )

    async def _handle_typing(self, data):
        await self.channel_layer.group_send(
            self.group_name,
            {"type": "typing.indicator", "user_id": str(self.user.id),
             "display_name": self.user.display_name, "is_typing": data.get("is_typing", True)},
        )

    async def _handle_mark_read(self):
        await self._mark_read_db()
        await self.channel_layer.group_send(
            self.group_name, {"type": "read.receipt", "user_id": str(self.user.id)}
        )

    async def _handle_react(self, data):
        message_id = data.get("message_id")
        emoji = data.get("emoji")
        if not message_id or not emoji:
            return
        message = await self._save_reaction(message_id, emoji)
        if message is None:
            return
        payload = await database_sync_to_async(lambda: MessageSerializer(message).data)()
        await self.channel_layer.group_send(
            self.group_name, {"type": "chat.message", "payload": payload}
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(
            {"type": "message", "data": event["payload"]}, cls=DjangoJSONEncoder))

    async def typing_indicator(self, event):
        if event["user_id"] == str(self.user.id):
            return
        await self.send(text_data=json.dumps({
            "type": "typing", "user_id": event["user_id"],
            "display_name": event["display_name"], "is_typing": event["is_typing"],
        }, cls=DjangoJSONEncoder))

    async def read_receipt(self, event):
        await self.send(text_data=json.dumps(
            {"type": "read_receipt", "user_id": event["user_id"]}, cls=DjangoJSONEncoder))

    async def delivery_receipt(self, event):
        await self.send(text_data=json.dumps(
            {"type": "delivery_receipt", "user_id": event["user_id"]}, cls=DjangoJSONEncoder))

    async def settings_update(self, event):
        await self.send(text_data=json.dumps(
            {"type": "settings_update", "disappearing_seconds": event["disappearing_seconds"]},
            cls=DjangoJSONEncoder))

    @database_sync_to_async
    def _is_participant(self):
        return ConversationParticipant.objects.filter(
            conversation_id=self.conversation_id, user=self.user
        ).exists()

    @database_sync_to_async
    def _set_online(self, is_online):
        self.user.is_online = is_online
        self.user.last_seen = timezone.now()
        self.user.save(update_fields=["is_online", "last_seen"])

    @database_sync_to_async
    def _save_message(self, body, reply_to_id):
        conv = Conversation.objects.get(id=self.conversation_id)
        msg = Message.objects.create(
            conversation=conv, sender=self.user, body=body, reply_to_id=reply_to_id
        )
        conv.last_message = msg
        conv.last_activity_at = timezone.now()
        conv.save(update_fields=["last_message", "last_activity_at"])

        others = conv.participants.exclude(user=self.user)
        MessageStatus.objects.bulk_create([
            MessageStatus(message=msg, user=p.user, status="sent") for p in others
        ])
        return msg

    @database_sync_to_async
    def _mark_read_db(self):
        ConversationParticipant.objects.filter(
            conversation_id=self.conversation_id, user=self.user
        ).update(last_read_at=timezone.now())
        MessageStatus.objects.filter(
            message__conversation_id=self.conversation_id, user=self.user
        ).update(status="read")

    @database_sync_to_async
    def _mark_undelivered_as_delivered(self):
        qs = MessageStatus.objects.filter(
            message__conversation_id=self.conversation_id, user=self.user, status="sent"
        )
        count = qs.count()
        qs.update(status="delivered")
        return count > 0

    @database_sync_to_async
    def _save_reaction(self, message_id, emoji):
        try:
            msg = Message.objects.get(id=message_id, conversation_id=self.conversation_id)
        except Message.DoesNotExist:
            return None
        Reaction.objects.update_or_create(
            message=msg, user=self.user, defaults={"emoji": emoji}
        )
        return msg

    async def _handle_remove_react(self, data):
        message_id = data.get("message_id")
        if not message_id:
            return
        message = await self._remove_reaction(message_id)
        if message is None:
            return
        payload = await database_sync_to_async(lambda: MessageSerializer(message).data)()
        await self.channel_layer.group_send(
            self.group_name, {"type": "chat.message", "payload": payload}
        )

    @database_sync_to_async
    def _remove_reaction(self, message_id):
        try:
            msg = Message.objects.get(id=message_id, conversation_id=self.conversation_id)
        except Message.DoesNotExist:
            return None
        Reaction.objects.filter(message=msg, user=self.user).delete()
        return msg