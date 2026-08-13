from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Contact, User
from .serializers import (AddContactSerializer, ContactSerializer, LoginSerializer,
                           RegisterSerializer, SendOTPSerializer, UserSerializer)


def _tokens_for(user):
    refresh = RefreshToken.for_user(user)
    return {"access_token": str(refresh.access_token), "refresh_token": str(refresh),
            "user": UserSerializer(user).data}


@api_view(["POST"])
@permission_classes([AllowAny])
def send_otp(request):
    serializer = SendOTPSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    print(f"[MOCK OTP] {serializer.validated_data['phone_or_username']} -> 123456")
    return Response({"message": "OTP sent (mocked)", "hint": "123456"})


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return Response(_tokens_for(user), status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def contacts(request):
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
    q = request.GET.get("q", "").strip()
    if not q:
        return Response([])
    results = User.objects.filter(
        Q(phone_or_username__icontains=q) | Q(display_name__icontains=q)
    ).exclude(id=request.user.id)[:20]
    return Response(UserSerializer(results, many=True).data)