from django.contrib import admin

# Register your models here.
from .models import VisualSeg, AudioSeg, Word, Problem, DescriptionVisual, DescriptionAudio

admin.site.register(VisualSeg)
admin.site.register(AudioSeg)
admin.site.register(Word)
admin.site.register(Problem)
admin.site.register(DescriptionAudio)
admin.site.register(DescriptionVisual)