from django.shortcuts import render
from django.http import HttpResponse

import numpy
import pandas as pd

from .models import VisualSeg, AudioSeg



def index(request):
    return HttpResponse("Hello, world.")

def video(request, video_id):

    all_visual_segs = VisualSeg.objects.all().filter(video_id=video_id)
    all_audio_segs = AudioSeg.objects.all().filter(video_id=video_id)

    context = {'video_id': video_id,
                'all_visual_segs': all_visual_segs,
                'all_audio_segs': all_audio_segs}
                
    return render(request, 'prototype/video.html', context)

# Process and add a video's info to db
def add(request, video_id):

    # wezZVZXFO3U

    df_visual_segs = pd.read_csv("prototype/test/"+ video_id + "_visual_segments.csv")
    df_audio_segs = pd.read_csv("prototype/test/"+ video_id + "_audio_segments.csv")

    # add all visual segs
    for index, row in df_visual_segs.iterrows():
        VisualSeg.objects.create(video_id = video_id,
                                seg_id = row["visual_seg_id"],
                                start_time = row["start"],
                                end_time = row["end"],
                                clip_score = row["clip_score"],
                                clip_matched_audio_seg_ids = row["matched_audio_seg_ids"],
                                clip_explanations = row["matches_explanations"])

    for index, row in df_audio_segs.iterrows():
        AudioSeg.objects.create(video_id = video_id,
                                seg_id = row["audio_seg_id"],
                                start_time = int(row["start"]),
                                end_time = int(row["end"]),
                                transcript = row["subject"],
                                clip_score=-1)

    return HttpResponse(video_id + " successfully added!")