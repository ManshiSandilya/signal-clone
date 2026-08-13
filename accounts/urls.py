from django.urls import path
from . import views

urlpatterns = [
    path("auth/send-otp", views.send_otp),
    path("auth/register", views.register),
    path("auth/login", views.login),
    path("auth/me", views.me),
    path("contacts", views.contacts),
    path("contacts/search", views.search_users),
]