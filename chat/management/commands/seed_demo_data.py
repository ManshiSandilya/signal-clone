"""
Usage: python manage.py seed_demo_data

Populates the DB with demo users, contacts, a direct chat, and a group chat
with message history. All demo users share password 'password123'.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import Contact, User
from chat.models import Conversation, ConversationParticipant, Message, MessageStatus, Reaction

DEMO_USERS = [
    {"phone_or_username": "manu", "display_name": "Manu"},
    {"phone_or_username": "simran", "display_name": "Simran"},
    {"phone_or_username": "riya", "display_name": "Riya Sharma"},
    {"phone_or_username": "amit", "display_name": "Amit Verma"},
]

DEMO_PASSWORD = "password123"


class Command(BaseCommand):
    help = "Seed the database with demo users, contacts, conversations, and messages."

    def handle(self, *args, **options):
        self.stdout.write("Seeding demo data...")

        users = {}
        for u in DEMO_USERS:
            user, created = User.objects.get_or_create(
                phone_or_username=u["phone_or_username"],
                defaults={"display_name": u["display_name"]},
            )
            if created:
                user.set_password(DEMO_PASSWORD)
                user.save()
            users[u["phone_or_username"]] = user
            self.stdout.write(f"  user: {u['phone_or_username']} ({'created' if created else 'exists'})")

        for owner in users.values():
            for other in users.values():
                if owner != other:
                    Contact.objects.get_or_create(owner=owner, contact_user=other)

        # Seed Note to Self for manu
        note_to_self = Conversation.objects.filter(type="direct", participants__user=users["manu"]).distinct()
        note_to_self_chat = None
        for c in note_to_self:
            if c.participants.count() == 1:
                note_to_self_chat = c
                break
        if not note_to_self_chat:
            note_to_self_chat = Conversation.objects.create(type="direct", created_by=users["manu"])
            ConversationParticipant.objects.create(conversation=note_to_self_chat, user=users["manu"])
        self._seed_messages(note_to_self_chat, [
            (users["manu"], "hi How are you"),
        ])

        # Seed Simran direct chat for manu
        self._get_or_create_direct(users["manu"], users["simran"])

        # Seed Riya direct chat
        direct = self._get_or_create_direct(users["manu"], users["riya"])
        self._seed_messages(direct, [
            (users["manu"], "Hey Riya! Kaisi ho?"),
            (users["riya"], "Good good, tum batao — placement prep kaisi chal rahi hai?"),
            (users["manu"], "Scaler ka round clear karna hai, backend bana raha hoon"),
            (users["riya"], "All the best!"),
        ])

        group = Conversation.objects.filter(type="group", name="College Squad").first()
        if not group:
            group = Conversation.objects.create(type="group", name="College Squad", created_by=users["manu"])
            for username in ["manu", "riya", "amit", "simran"]:
                ConversationParticipant.objects.create(
                    conversation=group, user=users[username],
                    role="admin" if username == "manu" else "member",
                )
        self._seed_messages(group, [
            (users["manu"], "Squad, placement season shuru ho gaya"),
            (users["amit"], "Bhai kaunsi companies aa rahi hain campus mein?"),
            (users["simran"], "TCS aur EPAM already ho chuke, Scaler abhi chal raha hai"),
            (users["riya"], "All the best everyone!"),
        ])

        self.stdout.write(self.style.SUCCESS(
            f"\nDone. Login with any of: {', '.join(users.keys())} / password: {DEMO_PASSWORD}"
        ))

    def _get_or_create_direct(self, user_a, user_b):
        candidates = Conversation.objects.filter(type="direct", participants__user=user_a)
        for c in candidates:
            ids = set(c.participants.values_list("user_id", flat=True))
            if ids == {user_a.id, user_b.id}:
                return c
        conv = Conversation.objects.create(type="direct", created_by=user_a)
        ConversationParticipant.objects.create(conversation=conv, user=user_a)
        ConversationParticipant.objects.create(conversation=conv, user=user_b)
        return conv

    def _seed_messages(self, conv, entries):
        if conv.messages.exists():
            return
        last_msg = None
        for sender, body in entries:
            msg = Message.objects.create(conversation=conv, sender=sender, body=body)
            others = conv.participants.exclude(user=sender)
            MessageStatus.objects.bulk_create([
                MessageStatus(message=msg, user=p.user, status="read") for p in others
            ])
            last_msg = msg
        conv.last_message = last_msg
        conv.last_activity_at = timezone.now()
        conv.save(update_fields=["last_message", "last_activity_at"])
        if entries:
            Reaction.objects.get_or_create(message=last_msg, user=entries[0][0], defaults={"emoji": "🔥"})