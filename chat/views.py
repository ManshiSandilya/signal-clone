"""
chat/views.py

Endpoints:
    GET/POST  /api/conversations
    GET       /api/conversations/<id>
    GET/POST  /api/conversations/<id>/messages
    POST      /api/conversations/<id>/read
    GET/POST/DELETE /api/conversations/<id>/members
    POST      /api/conversations/<id>/disappearing
    POST      /api/messages/<id>/attachment
    POST/DELETE /api/messages/<id>/reactions
"""

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import User
from .models import Attachment, Conversation, ConversationParticipant, Message, MessageStatus, Reaction
from .serializers import (ConversationListSerializer, CreateConversationSerializer,
                            DisappearingSettingSerializer, MessageSerializer, ParticipantSerializer,
                            ReactToMessageSerializer, SendMessageSerializer)


def _user_conversations_qs(user):
    """Shared query: every conversation the user is a participant of.
    This is the authorization boundary — stops a user from reading a
    conversation they're not a member of, no matter what ID they guess."""
    return Conversation.objects.filter(participants__user=user).distinct()


def _broadcast(conversation_id, event):
    """Push an event to everyone connected to this conversation's WebSocket
    group. async_to_sync bridges Channels' async layer into this sync DRF
    view, so a REST action (e.g. adding a reaction) shows up live in an
    open chat window exactly like a WS-originated message would."""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(f"conversation_{conversation_id}", event)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def conversations(request):
    if request.method == "GET":
        qs = _user_conversations_qs(request.user).select_related("last_message").order_by("-last_activity_at")
        return Response(ConversationListSerializer(qs, many=True, context={"request": request}).data)

    serializer = CreateConversationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    conv_type = serializer.validated_data["type"]
    participant_ids = set(str(pid) for pid in serializer.validated_data["participant_ids"])
    participant_ids.add(str(request.user.id))

    if conv_type == "direct" and len(participant_ids) != 2:
        return Response({"detail": "Direct conversations need exactly 2 participants"},
                         status=status.HTTP_400_BAD_REQUEST)

    if conv_type == "direct":
        candidates = _user_conversations_qs(request.user).filter(type="direct")
        for c in candidates:
            ids = set(str(uid) for uid in c.participants.values_list("user_id", flat=True))
            if ids == participant_ids:
                return Response(ConversationListSerializer(c, context={"request": request}).data)

    with transaction.atomic():
        conv = Conversation.objects.create(
            type=conv_type,
            name=serializer.validated_data.get("name") if conv_type == "group" else None,
            created_by=request.user,
        )
        for uid in participant_ids:
            role = "admin" if (conv_type == "group" and uid == str(request.user.id)) else "member"
            ConversationParticipant.objects.create(conversation=conv, user_id=uid, role=role)

    return Response(ConversationListSerializer(conv, context={"request": request}).data,
                     status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def conversation_detail(request, conversation_id):
    conv = get_object_or_404(_user_conversations_qs(request.user), id=conversation_id)
    return Response(ConversationListSerializer(conv, context={"request": request}).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def messages(request, conversation_id):
    conv = get_object_or_404(_user_conversations_qs(request.user), id=conversation_id)

    if request.method == "GET":
        qs = (conv.messages.filter(is_deleted=False)
              .select_related("sender", "attachment")
              .prefetch_related("statuses", "reactions"))
        return Response(MessageSerializer(qs, many=True).data)

    serializer = SendMessageSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    with transaction.atomic():
        msg = Message.objects.create(
            conversation=conv,
            sender=request.user,
            body=serializer.validated_data["body"],
            reply_to_id=serializer.validated_data.get("reply_to"),
        )
        conv.last_message = msg
        conv.last_activity_at = timezone.now()
        conv.save(update_fields=["last_message", "last_activity_at"])

        other_participants = conv.participants.exclude(user=request.user)
        MessageStatus.objects.bulk_create([
            MessageStatus(message=msg, user=p.user, status="sent") for p in other_participants
        ])

    payload = MessageSerializer(msg).data
    _broadcast(conversation_id, {"type": "chat.message", "payload": payload})
    return Response(payload, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_read(request, conversation_id):
    participant = get_object_or_404(ConversationParticipant, conversation_id=conversation_id, user=request.user)
    participant.last_read_at = timezone.now()
    participant.save(update_fields=["last_read_at"])
    MessageStatus.objects.filter(message__conversation_id=conversation_id, user=request.user).update(status="read")
    _broadcast(conversation_id, {"type": "read.receipt", "user_id": str(request.user.id)})
    return Response({"status": "ok"})


@api_view(["GET", "POST", "DELETE"])
@permission_classes([IsAuthenticated])
def group_members(request, conversation_id):
    conv = get_object_or_404(Conversation, id=conversation_id, type="group")
    my_participant = get_object_or_404(ConversationParticipant, conversation=conv, user=request.user)

    if request.method == "GET":
        return Response(ParticipantSerializer(conv.participants.select_related("user"), many=True).data)

    if my_participant.role != "admin":
        return Response({"detail": "Only admins can manage members"}, status=status.HTTP_403_FORBIDDEN)

    target_id = request.data.get("user_id")
    if request.method == "POST":
        target = get_object_or_404(User, id=target_id)
        ConversationParticipant.objects.get_or_create(conversation=conv, user=target)
    elif request.method == "DELETE":
        ConversationParticipant.objects.filter(conversation=conv, user_id=target_id).delete()

    return Response(ParticipantSerializer(conv.participants.select_related("user"), many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def set_disappearing(request, conversation_id):
    """Bonus feature. 0 = off. Actual deletion is lazy (checked when messages
    are fetched) rather than a background cron — acceptable scope for a 24h
    assignment; production would use Celery beat instead."""
    conv = get_object_or_404(_user_conversations_qs(request.user), id=conversation_id)
    serializer = DisappearingSettingSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    conv.disappearing_seconds = serializer.validated_data["disappearing_seconds"]
    conv.save(update_fields=["disappearing_seconds"])
    _broadcast(conversation_id, {
        "type": "settings.update",
        "disappearing_seconds": conv.disappearing_seconds,
    })
    return Response(ConversationListSerializer(conv, context={"request": request}).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser])
def upload_attachment(request, message_id):
    """Attaches a file to an already-created message. Two-step flow (create
    message via /messages, then attach here) keeps the JSON message-send
    path simple and lets one Message model serve text-only and file
    messages without every field being conditional."""
    msg = get_object_or_404(Message, id=message_id, sender=request.user)
    file_obj = request.FILES.get("file")
    if not file_obj:
        return Response({"detail": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

    Attachment.objects.create(
        message=msg,
        file=file_obj,
        file_name=file_obj.name,
        file_type=file_obj.content_type or "application/octet-stream",
        file_size=file_obj.size,
    )
    payload = MessageSerializer(msg).data
    _broadcast(msg.conversation_id, {"type": "chat.message", "payload": payload})
    return Response(payload, status=status.HTTP_201_CREATED)


@api_view(["POST", "DELETE"])
@permission_classes([IsAuthenticated])
def react_to_message(request, message_id):
    """One reaction per user per message — re-reacting replaces the emoji
    instead of stacking a new one (matches Signal/WhatsApp behavior)."""
    msg = get_object_or_404(Message, id=message_id)
    is_member = ConversationParticipant.objects.filter(
        conversation_id=msg.conversation_id, user=request.user
    ).exists()
    if not is_member:
        return Response({"detail": "Not a participant"}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "DELETE":
        Reaction.objects.filter(message=msg, user=request.user).delete()
    else:
        serializer = ReactToMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        Reaction.objects.update_or_create(
            message=msg, user=request.user, defaults={"emoji": serializer.validated_data["emoji"]}
        )

    payload = MessageSerializer(msg).data
    _broadcast(msg.conversation_id, {"type": "chat.message", "payload": payload})
    return Response(payload)