from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('<str:video_id>/', views.video, name='video'),
    path('<str:video_id>/add/', views.add, name='add'),
]