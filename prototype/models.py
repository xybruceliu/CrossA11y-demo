from django.db import models

# Create your models here.
class VisualSeg(models.Model):
    video_id = models.CharField(max_length=200)
    seg_id = models.IntegerField()

    start_time = models.IntegerField()
    end_time = models.IntegerField()

    importance = models.FloatField()
    vt_scores = models.CharField(max_length=1000) # list of visual-text matching scores for all text segments w.r.t. to this visual segment
    score = models.FloatField()

    def is_grounded(self):
        return self.score > 0

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

    importance = models.FloatField()
    tv_scores = models.CharField(max_length=1000) # list of visual-text matching scores for all visual segments w.r.t. to this audio segment (text)
    score = models.FloatField()
    
    def is_grounded(self):
        return self.score > 0

    def toString(self):
        return self.video_id + "&" + str(self.seg_id)
        
    def __str__(self):
        return self.video_id + "&" + str(self.seg_id)