from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('<str:video_id>/v1', views.v1, name='v1'),
    path('<str:video_id>/v2', views.v2, name='v2'),
    path('<str:video_id>/v3', views.v3, name='v3'),
    path('<str:video_id>/add/', views.add, name='add'),
    path('<str:video_id>/<str:seg_id>/describe_audio/', views.describe_audio, name="describe_audio"),
    path('<str:video_id>/<str:seg_id>/describe_visual/', views.describe_visual, name="describe_visual"),
]