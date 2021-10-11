from django.contrib import admin

# Register your models here.
from .models import VisualSeg, AudioSeg

admin.site.register(VisualSeg)
admin.site.register(AudioSeg)