"""Serializers for the accounts application.

Handles user registration, login, profile updates, contacts,
and OTP validation.
"""

from rest_framework import serializers
from .models import Contact, User

MOCK_OTP = "123456"


class UserSerializer(serializers.ModelSerializer):
    """Public user representation — excludes sensitive fields like password hash."""

    class Meta:
        model = User
        fields = ["id", "phone_or_username", "display_name", "avatar_url", "is_online", "last_seen"]


class SendOTPSerializer(serializers.Serializer):
    """Validates the phone/username for the OTP request endpoint."""

    phone_or_username = serializers.CharField()


class RegisterSerializer(serializers.Serializer):
    """Validates and creates a new user during registration.

    The OTP is checked against a mock value (``123456``) for demo purposes.
    """

    phone_or_username = serializers.CharField(max_length=150)
    otp = serializers.CharField(max_length=10)
    password = serializers.CharField(write_only=True, min_length=6, max_length=128)
    display_name = serializers.CharField(max_length=150)
    avatar_url = serializers.URLField(required=False, allow_null=True)

    def validate_otp(self, value):
        """Reject any OTP that doesn't match the mock value."""
        if value != MOCK_OTP:
            raise serializers.ValidationError("Invalid OTP")
        return value

    def validate_phone_or_username(self, value):
        """Ensure the phone/username is not already taken."""
        if User.objects.filter(phone_or_username=value).exists():
            raise serializers.ValidationError("User already exists")
        return value

    def create(self, validated_data):
        """Create the user, hashing the password via ``create_user``."""
        validated_data.pop("otp")
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    """Validates login credentials (phone_or_username + password)."""

    phone_or_username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class UpdateProfileSerializer(serializers.Serializer):
    """Validates PATCH payload for user profile updates.

    Both fields are optional — the view should call with ``partial=True``.
    """

    display_name = serializers.CharField(required=False, max_length=150)
    avatar_url = serializers.URLField(required=False, allow_null=True)


class ContactSerializer(serializers.ModelSerializer):
    """Read-only serializer for a user's contact entry."""

    user = UserSerializer(source="contact_user", read_only=True)

    class Meta:
        model = Contact
        fields = ["id", "user", "nickname", "added_at"]


class AddContactSerializer(serializers.Serializer):
    """Validates the payload for adding a new contact."""

    phone_or_username = serializers.CharField()
    nickname = serializers.CharField(required=False, allow_blank=True)