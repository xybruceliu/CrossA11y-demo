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
    visual_segs = VisualSeg.objects.all().filter(video_id=video_id)
    audio_segs = AudioSeg.objects.all().filter(video_id=video_id)

    transcript_list = [audio_seg.transcript for audio_seg in audio_segs]
    transcript = ". ".join(transcript_list)

    context = {
        'video_id': video_id,
        'visual_segs': visual_segs,
        'audio_segs': audio_segs, 
        'transcript': transcript
    }

    return render(request, 'prototype/video.html', context)


# get video detail
def video_detail(request, video_id):
    pass


# Process and add a video's info to db
def add(request, video_id):

    # get df visual seg and audio seg to find start and end times
    df_visual_seg = pd.read_csv("prototype/test/"+video_id+"_visual_segments.csv")
    df_audio_seg = pd.read_csv("prototype/test/"+video_id+"_audio_segments.csv")

    df_vt_matches = pd.read_csv("prototype/test/" + video_id + "_combined_vt_scores_matrix_filtered.csv", index_col=0)
    arr_vt_matches = df_vt_matches.to_numpy()

    df_va_matches = pd.read_csv("prototype/test/" + video_id + "_mmv_va_scores_matrix_filtered.csv", index_col=0)
    arr_va_matches = df_va_matches.to_numpy()

    # get video length to compute % of segment
    video_length = max(np.max(df_visual_seg["end"]), np.max(df_audio_seg["end"]))

    # add all visual segs
    vt_all_scores = np.sum(arr_vt_matches, axis=1)
    vt_norm_socres = normalize(vt_all_scores)
    for i, row in df_visual_seg.iterrows():
        VisualSeg.objects.create(video_id=video_id,
                                 seg_id=row["visual_seg_id"],
                                 start_time=row["start"],
                                 end_time=row["end"],
                                 length = row["end"]-row["start"],
                                 norm_length = 100*(row["end"]-row["start"])/video_length,
                                 importance = 1,
                                 match_scores = json.dumps(list(arr_vt_matches[i,:])),
                                 score = vt_all_scores[i],
                                 norm_score = vt_norm_socres[i]
                                 )

    # add all audio segs
    
    va_all_scores = np.sum(arr_va_matches, axis=0)
    va_norm_socres = normalize(va_all_scores)
    for i, row in df_audio_seg.iterrows():

        # if it's non-speech, use va score to see how much does the sound makes sense
        if (row["subject"] == "NON-SPEECH"):
            AudioSeg.objects.create(video_id=video_id,
                                    seg_id=row["audio_seg_id"],
                                    start_time=row["start"],
                                    end_time=row["end"],
                                    length = row["end"]-row["start"],
                                    norm_length = 100*(row["end"]-row["start"])/video_length,
                                    importance = 1,
                                    match_scores = json.dumps(list(arr_vt_matches[:,i])),
                                    score = va_all_scores[i],
                                    norm_score = va_norm_socres[i],
                                    transcript = row["subject"]
                                    )
                
        # if has speech, give weight 1
        else:
            AudioSeg.objects.create(video_id=video_id,
                                    seg_id=row["audio_seg_id"],
                                    start_time=row["start"],
                                    end_time=row["end"],
                                    length = row["end"]-row["start"],
                                    norm_length = 100*(row["end"]-row["start"])/video_length,
                                    importance = 1,
                                    match_scores = json.dumps(list(arr_vt_matches[:,i])),
                                    score = va_all_scores[i],
                                    norm_score = 1,
                                    transcript = row["subject"]
                                    )
            

    return HttpResponse(video_id + " successfully added!")



# Helper: normalizaiton
def normalize(data):
    return (data - np.min(data)) / (np.max(data) - np.min(data))