from django.shortcuts import render
from django.http import HttpResponse

import numpy as np
import pandas as pd
import json

from .models import VisualSeg, AudioSeg


def index(request):
    return HttpResponse("Hello, world.")

# another view video_detail
def video(request, video_id):
    all_visual_segs = VisualSeg.objects.all().filter(video_id=video_id)
    all_audio_segs = AudioSeg.objects.all().filter(video_id=video_id)

    visual_segs_dict = {}  # key: seg id, value: dict of fields
    audio_segs_dict = {}

    video_seg_ids = [seg.seg_id for seg in all_visual_segs]
    video_seg_ids.sort()

    # get video length 
    video_length = 0
    for seg in all_visual_segs:
        duration = seg.end_time
        if duration > video_length:
            video_length = duration

    # construct a VISUAL seg dictionary {id -> d}
    for seg in all_visual_segs:
        clip_matched_audio_seg_ids = get_audio_seg_set(seg.clip_matched_audio_seg_ids)
        accessible = 1 if clip_matched_audio_seg_ids else 0
        d = {
            'seg_id': seg.seg_id,
            'start_time': seg.start_time,
            'end_time': seg.end_time,
            'clip_score': seg.clip_score,
            'clip_matched_audio_seg_ids': json.dumps(clip_matched_audio_seg_ids),
            'accessible': accessible,
            'clip_explanations': seg.clip_explanations,
            'duration': seg.end_time - seg.start_time,
            'normalized_duration': 100*(seg.end_time - seg.start_time)/video_length,
        }
        visual_segs_dict[seg.seg_id] = d

    # construct a AUDIO seg dict
    for seg in all_audio_segs:
        accessible = 0 if (seg.transcript == "NON-SPEECH") else 1
        d = {
            'seg_id': seg.seg_id,
            'start_time': seg.start_time,
            'end_time': seg.end_time,
            'transcript': seg.transcript,
            'clip_score': seg.clip_score,
            'accessible': accessible,
            'clip_explanations': seg.clip_explanations,
            'duration': seg.end_time - seg.start_time,
            'normalized_duration': 100*(seg.end_time - seg.start_time)/video_length,
        }
        audio_segs_dict[seg.seg_id] = d


    context = {
        'video_id': video_id,
        'video_seg_ids': video_seg_ids,
        'visual_segs_dict': visual_segs_dict,
        'audio_segs_dict': audio_segs_dict
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

    # get df visual seg and audio seg to find start and end times
    df_visual_seg = pd.read_csv("prototype/test/"+video_id+"_visual_segments.csv")
    df_audio_seg = pd.read_csv("prototype/test/"+video_id+"_audio_segments.csv")

    df_vt_matches = pd.read_csv("prototype/test/" + video_id + "_combined_vt_scores_matrix_filtered.csv", index_col=0)
    arr_vt_matches = df_vt_matches.to_numpy()


    # add all visual segs
    for i, row in df_visual_seg.iterrows():
        VisualSeg.objects.create(video_id=video_id,
                                 seg_id=row["visual_seg_id"],
                                 start_time=row["start"],
                                 end_time=row["end"],
                                 importance = 1,
                                 vt_scores = json.dumps(list(arr_vt_matches[i,:])),
                                 score = np.sum(arr_vt_matches[i,:]))


    # add all audio segs
    for i, row in df_audio_seg.iterrows():
        AudioSeg.objects.create(video_id=video_id,
                                seg_id=row["audio_seg_id"],
                                start_time=row["start"],
                                end_time=row["end"],
                                importance = 1,
                                tv_scores = json.dumps(list(arr_vt_matches[:,i])),
                                score = np.sum(arr_vt_matches[:,i]))

    return HttpResponse(video_id + " successfully added!")
