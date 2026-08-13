from django.urls import path
from . import views

urlpatterns = [
    path("conversations", views.conversations),
    path("conversations/<uuid:conversation_id>", views.conversation_detail),
    path("conversations/<uuid:conversation_id>/messages", views.messages),
    path("conversations/<uuid:conversation_id>/read", views.mark_read),
    path("conversations/<uuid:conversation_id>/members", views.group_members),
    path("conversations/<uuid:conversation_id>/disappearing", views.set_disappearing),
    path("messages/<uuid:message_id>/attachment", views.upload_attachment),
    path("messages/<uuid:message_id>/reactions", views.react_to_message),
]