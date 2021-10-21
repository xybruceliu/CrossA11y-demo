from django.shortcuts import render
from django.http import HttpResponse

import numpy
import pandas as pd
import json

from .models import VisualSeg, AudioSeg


def index(request):
    return HttpResponse("Hello, world.")

# another view video_detail
# def video(request, video_id)
def video(request, video_id):
    all_visual_segs = VisualSeg.objects.all().filter(video_id=video_id)
    all_audio_segs = AudioSeg.objects.all().filter(video_id=video_id)

    visual_segs_dict = {}  # key: seg id, value: dict of fields
    audio_segs_dict = {}
    video_seg_ids = [seg.seg_id for seg in all_visual_segs]
    video_seg_ids.sort()
    
    for seg in all_visual_segs:
        clip_matched_audio_seg_ids = get_audio_seg_set(seg.clip_matched_audio_seg_ids)
        accessible = 0 
        if clip_matched_audio_seg_ids:
            accessible = 1
        d = {
            'start_time': seg.start_time,
            'end_time': seg.end_time,
            'clip_score': seg.clip_score,
            'clip_matched_audio_seg_ids': json.dumps(clip_matched_audio_seg_ids),
            'accessible': accessible,
            'clip_explanations': seg.clip_explanations,
            'duration': (seg.end_time - seg.start_time) * 5
        }
        visual_segs_dict[seg.seg_id] = d

    context = {
        'video_id': video_id,
        'video_seg_ids': video_seg_ids,
        'visual_segs_dict': visual_segs_dict,
        'all_audio_segs': all_audio_segs,
        'audio_segs_dict': audio_segs_dict,
    }


    return render(request, 'prototype/video.html', context)


# get video detail
def video_detail(request, video_id):
    pass
# Process and add a video's info to db

# Get seg set from seg set string
def get_audio_seg_set(clip_matched_audio_seg_ids):
    if clip_matched_audio_seg_ids == 'set()':
        return []
    else:
        clip_matched_audio_seg_ids = clip_matched_audio_seg_ids.strip('{}')
        clip_matched_audio_seg_ids = clip_matched_audio_seg_ids.split(', ')
    return clip_matched_audio_seg_ids

# Process and add a video's info to db
def add(request, video_id):

    # wezZVZXFO3U

    df_visual_segs = pd.read_csv(
        "prototype/test/" + video_id + "_visual_segments.csv")
    df_audio_segs = pd.read_csv(
        "prototype/test/" + video_id + "_audio_segments.csv")

    # add all visual segs
    for index, row in df_visual_segs.iterrows():
        VisualSeg.objects.create(video_id=video_id,
                                 seg_id=row["visual_seg_id"],
                                 start_time=row["start"],
                                 end_time=row["end"],
                                 clip_score=row["clip_score"],
                                 clip_matched_audio_seg_ids=row["matched_audio_seg_ids"],
                                 clip_explanations=row["matches_explanations"])

    for index, row in df_audio_segs.iterrows():
        AudioSeg.objects.create(video_id=video_id,
                                seg_id=row["audio_seg_id"],
                                start_time=int(row["start"]),
                                end_time=int(row["end"]),
                                transcript=row["subject"],
                                clip_score=-1)

    return HttpResponse(video_id + " successfully added!")
