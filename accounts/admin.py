from django.contrib import admin
from .models import Contact, User

admin.site.register(User)
admin.site.register(Contact)