"""
accounts/views.py

Endpoints:
    POST    /api/auth/send-otp
    POST    /api/auth/register
    POST    /api/auth/login
    GET/PATCH /api/auth/me
    GET/POST  /api/contacts
    GET       /api/contacts/search
"""

from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Contact, User
from .serializers import (AddContactSerializer, ContactSerializer, LoginSerializer,
                           RegisterSerializer, SendOTPSerializer, UpdateProfileSerializer,
                           UserSerializer)


def _tokens_for(user):
    """Generate JWT access + refresh token pair for the given user."""
    refresh = RefreshToken.for_user(user)
    return {"access_token": str(refresh.access_token), "refresh_token": str(refresh),
            "user": UserSerializer(user).data}


@api_view(["POST"])
@permission_classes([AllowAny])
def send_otp(request):
    """Send a one-time password to the given phone/username.

    In this demo implementation, the OTP is always ``123456`` and is
    printed to the console.  A production system would integrate with
    an SMS gateway (e.g. Twilio).
    """
    serializer = SendOTPSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    print(f"[MOCK OTP] {serializer.validated_data['phone_or_username']} -> 123456")
    return Response({"message": "OTP sent (mocked)", "hint": "123456"})


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    """Register a new user account.

    Requires a valid (mocked) OTP, a password, and a display name.
    Returns JWT tokens on success so the client can immediately
    authenticate subsequent requests.

    Request body::

        {
            "phone_or_username": "john",
            "otp": "123456",
            "password": "securepass",
            "display_name": "John Doe",
            "avatar_url": "https://..."   // optional
        }
    """
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return Response(_tokens_for(user), status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    """Authenticate with phone/username + password and receive JWT tokens.

    Request body::

        {
            "phone_or_username": "john",
            "password": "securepass"
        }

    Returns 401 if credentials are invalid.
    """
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    phone_or_username = serializer.validated_data["phone_or_username"]
    password = serializer.validated_data["password"]
    try:
        user = User.objects.get(phone_or_username=phone_or_username)
    except User.DoesNotExist:
        return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
    if not user.check_password(password):
        return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
    return Response(_tokens_for(user))


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def me(request):
    """Retrieve or update the authenticated user's profile.

    **GET** — Returns the full user profile.

    **PATCH** — Update ``display_name`` and/or ``avatar_url``.
    Both fields are optional.

    Request body (PATCH)::

        {
            "display_name": "New Name",
            "avatar_url": "https://example.com/photo.jpg"
        }
    """
    if request.method == "PATCH":
        serializer = UpdateProfileSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = request.user
        for field, value in serializer.validated_data.items():
            setattr(user, field, value)
        user.save(update_fields=list(serializer.validated_data.keys()))

    return Response(UserSerializer(request.user).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def contacts(request):
    """List the user's contacts or add a new one.

    **GET** — Returns all contacts belonging to the authenticated user.

    **POST** — Add a contact by ``phone_or_username``.  Returns the existing
    contact if already added (idempotent).

    Request body (POST)::

        {
            "phone_or_username": "jane",
            "nickname": "Jane"   // optional
        }
    """
    if request.method == "GET":
        qs = Contact.objects.filter(owner=request.user).select_related("contact_user")
        return Response(ContactSerializer(qs, many=True).data)
    serializer = AddContactSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    handle = serializer.validated_data["phone_or_username"]
    try:
        target = User.objects.get(phone_or_username=handle)
    except User.DoesNotExist:
        return Response({"detail": "No user with that phone/username"}, status=status.HTTP_404_NOT_FOUND)
    if target.id == request.user.id:
        return Response({"detail": "Can't add yourself"}, status=status.HTTP_400_BAD_REQUEST)
    contact, created = Contact.objects.get_or_create(
        owner=request.user, contact_user=target,
        defaults={"nickname": serializer.validated_data.get("nickname", "")})
    return Response(ContactSerializer(contact).data,
                     status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def search_users(request):
    """Search for users by phone/username or display name.

    Query parameter ``q`` is matched case-insensitively against both
    ``phone_or_username`` and ``display_name``.  The requesting user
    is excluded from results.  Returns at most 20 matches.
    """
    q = request.GET.get("q", "").strip()
    if not q:
        return Response([])
    results = User.objects.filter(
        Q(phone_or_username__icontains=q) | Q(display_name__icontains=q)
    ).exclude(id=request.user.id)[:20]
    return Response(UserSerializer(results, many=True).data)