from django.contrib import admin
from .models import Attachment, Conversation, ConversationParticipant, Message, MessageStatus, Reaction

admin.site.register(Conversation)
admin.site.register(ConversationParticipant)
admin.site.register(Message)
admin.site.register(MessageStatus)
admin.site.register(Attachment)
admin.site.register(Reaction)