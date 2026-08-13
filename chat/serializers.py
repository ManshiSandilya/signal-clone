"""Serializers for the chat application.

Handles validation and representation of conversations, messages,
participants, attachments, reactions, and related settings.
"""

from rest_framework import serializers
from .models import Attachment, Conversation, ConversationParticipant, Message, MessageStatus, Reaction
from accounts.serializers import UserSerializer


class MessageStatusSerializer(serializers.ModelSerializer):
    """Read-only serializer for per-recipient delivery/read status."""

    class Meta:
        model = MessageStatus
        fields = ["user", "status", "updated_at"]


class AttachmentSerializer(serializers.ModelSerializer):
    """Read-only serializer for file attachments on a message."""

    class Meta:
        model = Attachment
        fields = ["id", "file", "file_name", "file_type", "file_size", "uploaded_at"]


class ReactionSerializer(serializers.ModelSerializer):
    """Read-only serializer for emoji reactions, nested under a message."""

    user = UserSerializer(read_only=True)

    class Meta:
        model = Reaction
        fields = ["id", "user", "emoji", "created_at"]


class MessageSerializer(serializers.ModelSerializer):
    """Full message representation including sender, statuses, attachment, and reactions."""

    sender = UserSerializer(read_only=True)
    statuses = MessageStatusSerializer(many=True, read_only=True)
    attachment = AttachmentSerializer(read_only=True)
    reactions = ReactionSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = ["id", "conversation", "sender", "body", "reply_to", "created_at", "is_deleted",
                   "statuses", "attachment", "reactions"]
        read_only_fields = ["sender", "created_at"]


class SendMessageSerializer(serializers.Serializer):
    """Validates the body of a new text message, with an optional reply reference."""

    body = serializers.CharField(max_length=10000, allow_blank=False)
    reply_to = serializers.UUIDField(required=False, allow_null=True)


class ParticipantSerializer(serializers.ModelSerializer):
    """Read-only serializer for a conversation participant (user + role)."""

    user = UserSerializer(read_only=True)

    class Meta:
        model = ConversationParticipant
        fields = ["id", "user", "role", "joined_at"]


class ConversationListSerializer(serializers.ModelSerializer):
    """Sidebar-ready conversation representation.

    Includes a last-message preview and an unread count computed relative
    to the requesting user's ``last_read_at`` timestamp.
    """

    last_message = MessageSerializer(read_only=True)
    unread_count = serializers.SerializerMethodField()
    participants = ParticipantSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ["id", "type", "name", "avatar_url", "last_message", "last_activity_at",
                   "unread_count", "participants", "disappearing_seconds"]

    def get_unread_count(self, obj):
        """Count messages created after the user's last read timestamp."""
        request_user = self.context["request"].user
        my_participant = obj.participants.filter(user=request_user).first()
        if not my_participant:
            return 0
        return obj.messages.filter(created_at__gt=my_participant.last_read_at).count()


class CreateConversationSerializer(serializers.Serializer):
    """Validates creation payload for both direct and group conversations."""

    type = serializers.ChoiceField(choices=["direct", "group"])
    name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    participant_ids = serializers.ListField(child=serializers.UUIDField())


class UpdateConversationSerializer(serializers.Serializer):
    """Validates PATCH payload for updating group conversation metadata.

    Both fields are optional — the consumer should pass ``partial=True``.
    """

    name = serializers.CharField(required=False, max_length=150)
    avatar_url = serializers.URLField(required=False, allow_null=True)


class DisappearingSettingSerializer(serializers.Serializer):
    """Validates the disappearing-messages timer value (0 = disabled)."""

    disappearing_seconds = serializers.IntegerField(min_value=0)


class ReactToMessageSerializer(serializers.Serializer):
    """Validates a reaction emoji (up to 8 chars to support compound emoji)."""

    emoji = serializers.CharField(max_length=8)