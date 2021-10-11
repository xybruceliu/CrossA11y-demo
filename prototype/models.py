from django.db import models

# Create your models here.
class VisualSeg(models.Model):
    video_id = models.CharField(max_length=200)
    seg_id = models.IntegerField()

    start_time = models.IntegerField()
    end_time = models.IntegerField()

    clip_score = models.FloatField()
    clip_matched_audio_seg_ids = models.TextField()
    clip_explanations = models.TextField()

    def is_grounded(self):
        return self.clip_score > 0

    def toString(self):
        return self.video_id + "&" + str(self.seg_id)

    def __str__(self):
        return self.video_id + "&" + str(self.seg_id)


class AudioSeg(models.Model):
    video_id = models.CharField(max_length=200)
    seg_id = models.IntegerField()

    start_time = models.IntegerField()
    end_time = models.IntegerField()
    transcript = models.TextField()

    clip_score = models.FloatField()
    clip_matched_visual_seg_ids = models.TextField()
    clip_explanations = models.TextField()

    def is_grounded(self):
        return self.clip_score > 0

    def toString(self):
        return self.video_id + "&" + str(self.seg_id)
        
    def __str__(self):
        return self.video_id + "&" + str(self.seg_id)