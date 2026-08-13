import uuid
from django.conf import settings
from django.db import models


class Conversation(models.Model):
    class Type(models.TextChoices):
        DIRECT = "direct", "Direct"
        GROUP = "group", "Group"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(max_length=10, choices=Type.choices)
    name = models.CharField(max_length=150, blank=True, null=True)
    avatar_url = models.URLField(blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="+", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    last_message = models.ForeignKey("Message", related_name="+", null=True, blank=True, on_delete=models.SET_NULL)
    last_activity_at = models.DateTimeField(auto_now_add=True, db_index=True)
    disappearing_seconds = models.PositiveIntegerField(default=0)

class ConversationParticipant(models.Model):
    class Role(models.TextChoices):
        MEMBER = "member", "Member"
        ADMIN = "admin", "Admin"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, related_name="participants", on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="participations", on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)
    last_read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("conversation", "user")


class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, related_name="messages", on_delete=models.CASCADE)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="+", on_delete=models.CASCADE)
    body = models.TextField()
    reply_to = models.ForeignKey("self", related_name="replies", null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        ordering = ["created_at"]


class MessageStatus(models.Model):
    class Status(models.TextChoices):
        SENT = "sent", "Sent"
        DELIVERED = "delivered", "Delivered"
        READ = "read", "Read"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(Message, related_name="statuses", on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="+", on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.SENT)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("message", "user")

class Attachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.OneToOneField(Message, related_name="attachment", on_delete=models.CASCADE)
    file = models.FileField(upload_to="attachments/%Y/%m/")
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100)
    file_size = models.PositiveIntegerField()
    uploaded_at = models.DateTimeField(auto_now_add=True)


class Reaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(Message, related_name="reactions", on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="+", on_delete=models.CASCADE)
    emoji = models.CharField(max_length=8)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("message", "user")