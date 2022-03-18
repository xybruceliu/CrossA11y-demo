from django.shortcuts import render
from django.http import HttpResponse

import numpy as np
import pandas as pd
import json

from .models import VisualSeg, AudioSeg, Word, Problem, DescriptionVisual, DescriptionAudio

from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.csrf import csrf_protect

PRESENTER_THRESHOLD = 60000
SILENCE_THREHOLD = 0.001


def index(request):
    return HttpResponse("Hello, world.")


# level 1
def v1(request, video_id):
    visual_segs = VisualSeg.objects.all().filter(video_id=video_id)
    audio_segs = AudioSeg.objects.all().filter(video_id=video_id)
    words = Word.objects.all().filter(video_id=video_id)
    problems = Problem.objects.all().filter(video_id=video_id)

    transcript_list = [audio_seg.transcript for audio_seg in audio_segs]
    transcript = ". ".join(transcript_list)

    context = {
        'video_id': video_id,
        'visual_segs': visual_segs,
        'audio_segs': audio_segs, 
        'words': words,
        'problems': problems,
        'transcript': transcript
    }

    return render(request, 'prototype/video_v1.html', context)

# level 2
def v2(request, video_id):
    visual_segs = VisualSeg.objects.all().filter(video_id=video_id)
    audio_segs = AudioSeg.objects.all().filter(video_id=video_id)
    words = Word.objects.all().filter(video_id=video_id)
    problems = Problem.objects.all().filter(video_id=video_id)

    transcript_list = [audio_seg.transcript for audio_seg in audio_segs]
    transcript = ". ".join(transcript_list)

    context = {
        'video_id': video_id,
        'visual_segs': visual_segs,
        'audio_segs': audio_segs, 
        'words': words,
        'problems': problems,
        'transcript': transcript
    }

    return render(request, 'prototype/video_v2.html', context)


# level 3
def v3(request, video_id):
    visual_segs = VisualSeg.objects.all().filter(video_id=video_id)
    audio_segs = AudioSeg.objects.all().filter(video_id=video_id)
    words = Word.objects.all().filter(video_id=video_id)
    problems = Problem.objects.all().filter(video_id=video_id)

    transcript_list = [audio_seg.transcript for audio_seg in audio_segs]
    transcript = ". ".join(transcript_list)

    context = {
        'video_id': video_id,
        'visual_segs': visual_segs,
        'audio_segs': audio_segs, 
        'words': words,
        'problems': problems,
        'transcript': transcript
    }

    return render(request, 'prototype/video_v3.html', context)


# Process and add a video's info to db
def add(request, video_id):

    # get df visual seg and audio seg to find start and end times
    df_visual_seg = pd.read_csv("prototype/static/test/"+video_id+"_visual_segments.csv")
    df_audio_seg = pd.read_csv("prototype/static/test/"+video_id+"_audio_segments.csv")

    df_vt_matches = pd.read_csv("prototype/static/test/" + video_id + "_combined_vt_scores_matrix_filtered.csv", index_col=0)
    arr_vt_matches = df_vt_matches.to_numpy()

    df_va_matches = pd.read_csv("prototype/static/test/" + video_id + "_combined_va_scores_matrix_filtered.csv", index_col=0)
    arr_va_matches = df_va_matches.to_numpy()

    # get video length to compute % of segment
    video_length = max(np.max(df_visual_seg["end"]), np.max(df_audio_seg["end"]))


    # add all visual segs
    vt_all_scores = np.mean(arr_vt_matches, axis=1)
    # remove presenter
    for i in range(len(vt_all_scores)):
            if df_visual_seg["presenter_detection"][i] > PRESENTER_THRESHOLD:
                vt_all_scores[i] = np.max(vt_all_scores)

    vt_norm_socres = normalize(vt_all_scores)
    # print(vt_norm_socres)
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
                                 norm_score = vt_norm_socres[i],
                                #  detected_visuals = row["visual_feedback"],
                                #  detected_texts = row["text_detection"],
                                 presenter_detection = row["presenter_detection"],
                                 )

    # add all audio segs
    va_all_scores = np.mean(arr_va_matches, axis=0)
    
    # remove non-speech and silence
    for j in range(len(va_all_scores)):
            if (df_audio_seg["raw_subject"][j] != "NON-SPEECH") or (df_audio_seg["silence_detection"][j] < SILENCE_THREHOLD):
                va_all_scores[j] = np.max(va_all_scores)

    va_norm_socres = normalize(va_all_scores)
    # print(va_norm_socres)
    for i, row in df_audio_seg.iterrows():

        # if it's non-speech, use va score to see how much does the sound makes sense
        if (row["raw_subject"] == "NON-SPEECH"):
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
                                    transcript = row["raw_subject"],
                                    silence_detection = row["silence_detection"],
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
                                    transcript = row["raw_subject"],
                                    silence_detection = row["silence_detection"],
                                    )
            
    return HttpResponse(video_id + " successfully added!")

 
# Repair Accessibility Issue Describe Audio
@csrf_exempt
def describe_audio(request, video_id, seg_id):
    if request.method == 'POST':

        data=json.loads(request.body)


        if DescriptionAudio.objects.all().filter(video_id=video_id, seg_id=seg_id).exists():
            # at least one object satisfying query exists
            DescriptionAudio.objects.all().filter(video_id=video_id, seg_id=seg_id).update(
                    video_id = data["video_id"],
                    seg_id = data["seg_id"],
                    start_time = data["start_time"],
                    end_time = data["end_time"],
                    length = data["length"],
                    description = data["description"]
                )
            
            return HttpResponse("describe audio added!")

        else: 
            DescriptionAudio.objects.create(
                    video_id = data["video_id"],
                    seg_id = data["seg_id"],
                    start_time = data["start_time"],
                    end_time = data["end_time"],
                    length = data["length"],
                    description = data["description"],
                )
            
            return HttpResponse("describe audio added!")

    else:
        return HttpResponse("describe audio testing")


# Repair Accessibility Issue Describe Visual
@csrf_exempt
def describe_visual(request, video_id, seg_id):
    if request.method == 'POST':

        data=json.loads(request.body)


        if DescriptionVisual.objects.all().filter(video_id=video_id, seg_id=seg_id).exists():
            # at least one object satisfying query exists
            DescriptionVisual.objects.all().filter(video_id=video_id, seg_id=seg_id).update(
                    video_id = data["video_id"],
                    seg_id = data["seg_id"],
                    start_time = data["start_time"],
                    end_time = data["end_time"],
                    length = data["length"],
                    type = data["type"],
                    description = data["description"]
                )
            
            return HttpResponse("describe visual added!")

        else: 
            DescriptionVisual.objects.create(
                    video_id = data["video_id"],
                    seg_id = data["seg_id"],
                    start_time = data["start_time"],
                    end_time = data["end_time"],
                    length = data["length"],
                    type = data["type"],
                    description = data["description"],
                )
            
            return HttpResponse("describe visual added!")

    else:
        return HttpResponse("describe visual testing")

# Helper: normalizaiton
def normalize(data):
    if np.max(data) == np.min(data):
        return np.ones(len(data))
    else:
        return (data - np.min(data)) / (np.max(data) - np.min(data))