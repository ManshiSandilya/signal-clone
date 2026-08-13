from rest_framework import serializers
from .models import Attachment, Conversation, ConversationParticipant, Message, MessageStatus, Reaction
from accounts.serializers import UserSerializer


class MessageStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageStatus
        fields = ["user", "status", "updated_at"]


class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ["id", "file", "file_name", "file_type", "file_size", "uploaded_at"]


class ReactionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Reaction
        fields = ["id", "user", "emoji", "created_at"]


class MessageSerializer(serializers.ModelSerializer):
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
    body = serializers.CharField(allow_blank=True)
    reply_to = serializers.UUIDField(required=False, allow_null=True)


class ParticipantSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = ConversationParticipant
        fields = ["id", "user", "role", "joined_at"]


class ConversationListSerializer(serializers.ModelSerializer):
    """Used for the LEFT SIDEBAR — needs last message preview + unread count."""
    last_message = MessageSerializer(read_only=True)
    unread_count = serializers.SerializerMethodField()
    participants = ParticipantSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ["id", "type", "name", "avatar_url", "last_message", "last_activity_at",
                   "unread_count", "participants", "disappearing_seconds"]

    def get_unread_count(self, obj):
        request_user = self.context["request"].user
        my_participant = obj.participants.filter(user=request_user).first()
        if not my_participant:
            return 0
        return obj.messages.filter(created_at__gt=my_participant.last_read_at).count()


class CreateConversationSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=["direct", "group"])
    name = serializers.CharField(required=False, allow_blank=True)
    participant_ids = serializers.ListField(child=serializers.UUIDField())


class DisappearingSettingSerializer(serializers.Serializer):
    disappearing_seconds = serializers.IntegerField(min_value=0)


class ReactToMessageSerializer(serializers.Serializer):
    emoji = serializers.CharField(max_length=8)