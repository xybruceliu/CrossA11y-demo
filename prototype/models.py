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

    detected_visuals = models.CharField(max_length=1000) # list of visual entities detected in this visual segment

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


class Word(models.Model):
    video_id = models.CharField(max_length=200)

    visual_seg_id = models.IntegerField()
    audio_seg_id = models.IntegerField()

    start_time = models.FloatField()
    end_time = models.FloatField()
    length = models.FloatField()

    word = models.CharField(max_length=200)

    def is_non_speech(self):
        return self.word == "NON-SPEECH"

    def toString(self):
        return self.video_id + "&" + str(self.visual_seg_id) + "&" + str(self.audio_seg_id) + "&" + self.word
        
    def __str__(self):
        return self.video_id + "&" + str(self.visual_seg_id) + "&" + str(self.audio_seg_id) + "&" + self.word
    

class Problem(models.Model):
    class Meta:
        ordering = ['start_time']

    video_id = models.CharField(max_length=200)

    problem_description = models.CharField(max_length=1000)

    visual_seg_id = models.IntegerField()
    audio_seg_id = models.IntegerField()

    start_time = models.FloatField()
    end_time = models.FloatField()
    length = models.FloatField()

    describe_visual = models.BooleanField() 
    describe_audio = models.BooleanField()

    is_ignored = models.BooleanField()
    is_fixed = models.BooleanField()

    def toString(self):
        return self.video_id + "&" + str(self.visual_seg_id) + "&" + str(self.audio_seg_id) 
        
    def __str__(self):
        return self.video_id + "&" + str(self.visual_seg_id) + "&" + str(self.audio_seg_id)


class DescriptionVisual(models.Model):
    video_id = models.CharField(max_length=200)

    seg_id = models.IntegerField()

    start_time = models.FloatField()
    end_time = models.FloatField()
    length = models.FloatField()

    DESCRIPTION_CHOICES = [
        ('IN', 'Inline'),
        ('EX', 'Extended'),
    ]
    type = models.CharField(max_length=2,
                            choices=DESCRIPTION_CHOICES,
                            default='IN')

    description = models.CharField(max_length=1000) 

    def toString(self):
        return self.video_id + "&" + str(self.seg_id)
    def __str__(self):
        return self.video_id + "&" + str(self.seg_id)


class DescriptionAudio(models.Model):
    video_id = models.CharField(max_length=200)

    seg_id = models.IntegerField()

    start_time = models.FloatField()
    end_time = models.FloatField()
    length = models.FloatField()

    description = models.CharField(max_length=1000)

    def toString(self):
        return self.video_id + "&" + str(self.seg_id)
    def __str__(self):
        return self.video_id + "&" + str(self.seg_id)


