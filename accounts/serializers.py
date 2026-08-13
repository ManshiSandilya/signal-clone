from rest_framework import serializers
from .models import Contact, User

MOCK_OTP = "123456"

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "phone_or_username", "display_name", "avatar_url", "is_online", "last_seen"]

class SendOTPSerializer(serializers.Serializer):
    phone_or_username = serializers.CharField()

class RegisterSerializer(serializers.Serializer):
    phone_or_username = serializers.CharField(max_length=150)
    otp = serializers.CharField(max_length=10)
    password = serializers.CharField(write_only=True, min_length=6, max_length=128)
    display_name = serializers.CharField(max_length=150)
    avatar_url = serializers.URLField(required=False, allow_null=True)

    def validate_otp(self, value):
        if value != MOCK_OTP:
            raise serializers.ValidationError("Invalid OTP")
        return value

    def validate_phone_or_username(self, value):
        if User.objects.filter(phone_or_username=value).exists():
            raise serializers.ValidationError("User already exists")
        return value

    def create(self, validated_data):
        validated_data.pop("otp")
        return User.objects.create_user(**validated_data)

class LoginSerializer(serializers.Serializer):
    phone_or_username = serializers.CharField()
    password = serializers.CharField(write_only=True)

class ContactSerializer(serializers.ModelSerializer):
    user = UserSerializer(source="contact_user", read_only=True)
    class Meta:
        model = Contact
        fields = ["id", "user", "nickname", "added_at"]

class AddContactSerializer(serializers.Serializer):
    phone_or_username = serializers.CharField()
    nickname = serializers.CharField(required=False, allow_blank=True)