from django.db import models

# Create your models here.
class VisualSeg(models.Model):
    video_id = models.CharField(max_length=200)
    seg_id = models.IntegerField()

    start_time = models.FloatField()
    end_time = models.FloatField()
    length = models.FloatField()
    norm_length = models.FloatField()

    importance = models.FloatField()
    match_scores = models.CharField(max_length=1000) # list of visual-text matching 0-3 scores for all text segments w.r.t. to this visual segment
    score = models.FloatField() 
    norm_score = models.FloatField() # normalized score 0-1 within the video

    def is_grounded(self):
        return self.score > 0

    def toString(self):
        return self.video_id + "&" + str(self.seg_id)

    def __str__(self):
        return self.video_id + "&" + str(self.seg_id)


class AudioSeg(models.Model):
    video_id = models.CharField(max_length=200)
    seg_id = models.IntegerField()

    start_time = models.FloatField()
    end_time = models.FloatField()
    length = models.FloatField()
    norm_length = models.FloatField()
    
    transcript = models.TextField()

    importance = models.FloatField()
    match_scores = models.CharField(max_length=1000) # list of visual-text matching 0-3 scores for all visual segments w.r.t. to this audio segment
    score = models.FloatField()
    norm_score = models.FloatField() # normalized score 0-1 within the video
    
    def is_grounded(self):
        return self.score > 0

    def toString(self):
        return self.video_id + "&" + str(self.seg_id)
        
    def __str__(self):
        return self.video_id + "&" + str(self.seg_id)