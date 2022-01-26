from django.shortcuts import render
from django.http import HttpResponse

import numpy as np
import pandas as pd
import json

from .models import VisualSeg, AudioSeg, Word, Problem, DescriptionVisual, DescriptionAudio

from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.csrf import csrf_protect

def index(request):
    return HttpResponse("Hello, world.")

# another view video_detail
def video(request, video_id):
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

    return render(request, 'prototype/video.html', context)


# get video detail
def video_detail(request, video_id):
    pass


# Process and add a video's info to db
def add(request, video_id):

    # get df visual seg and audio seg to find start and end times
    df_visual_seg = pd.read_csv("prototype/static/test/"+video_id+"_visual_segments.csv")
    df_audio_seg = pd.read_csv("prototype/static/test/"+video_id+"_audio_segments.csv")
    df_words = pd.read_csv("prototype/static/test/"+video_id+"_words.csv")

    df_vt_matches = pd.read_csv("prototype/static/test/" + video_id + "_combined_vt_scores_matrix_filtered.csv", index_col=0)
    arr_vt_matches = df_vt_matches.to_numpy()

    df_va_matches = pd.read_csv("prototype/static/test/" + video_id + "_mmv_va_scores_matrix_filtered.csv", index_col=0)
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
            


    # # add all words
    # for i, row in df_words.iterrows():
    #     Word.objects.create(video_id=video_id,
    #                         visual_seg_id=row["visual_seg_id"],
    #                         audio_seg_id=row["audio_seg_id"],
    #                         start_time=row["start"],
    #                         end_time=row["end"],
    #                         length=row["length"],
    #                         word=row["word"]
    #                         )


    # # add all problems
    # visual_segs = VisualSeg.objects.all().filter(video_id=video_id)
    # audio_segs = AudioSeg.objects.all().filter(video_id=video_id)

    # for visual_seg in visual_segs:
    #     if visual_seg.norm_score < 0.25:
    #         Problem.objects.create(
    #             video_id = video_id,
    #             problem_description = "Needs a description of the visual.",
    #             visual_seg_id = visual_seg.seg_id,
    #             audio_seg_id = -1,
    #             start_time = visual_seg.start_time,
    #             end_time = visual_seg.end_time,
    #             length = visual_seg.length,
    #             describe_visual = True,
    #             describe_audio = False,
    #             is_ignored = False,
    #             is_fixed = False
    #         )
    
    # for audio_seg in audio_segs:
    #     if audio_seg.norm_score < 0.25:
    #         Problem.objects.create(
    #             video_id = video_id,
    #             problem_description = "Needs a description of the audio.",
    #             visual_seg_id = -1,
    #             audio_seg_id = audio_seg.seg_id,
    #             start_time = audio_seg.start_time,
    #             end_time = audio_seg.end_time,
    #             length = audio_seg.length,
    #             describe_visual = False,
    #             describe_audio = True,
    #             is_ignored = False,
    #             is_fixed = False
    #         )

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
    return (data - np.min(data)) / (np.max(data) - np.min(data))