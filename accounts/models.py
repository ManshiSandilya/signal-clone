import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, phone_or_username, password=None, **extra_fields):
        if not phone_or_username:
            raise ValueError("phone_or_username is required")
        user = self.model(phone_or_username=phone_or_username, **extra_fields)
        user.set_password(password)   # hashes with PBKDF2, never stores plaintext
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_or_username, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(phone_or_username, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone_or_username = models.CharField(max_length=150, unique=True)
    display_name = models.CharField(max_length=150)
    avatar_url = models.URLField(blank=True, null=True)
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()
    USERNAME_FIELD = "phone_or_username"
    REQUIRED_FIELDS = ["display_name"]


class Contact(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(User, related_name="contacts", on_delete=models.CASCADE)
    contact_user = models.ForeignKey(User, related_name="+", on_delete=models.CASCADE)
    nickname = models.CharField(max_length=150, blank=True, null=True)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("owner", "contact_user")