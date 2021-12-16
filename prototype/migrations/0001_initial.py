# Generated by Django 3.1.3 on 2021-11-19 09:11

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='AudioSeg',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('video_id', models.CharField(max_length=200)),
                ('seg_id', models.IntegerField()),
                ('start_time', models.FloatField()),
                ('end_time', models.FloatField()),
                ('length', models.FloatField()),
                ('norm_length', models.FloatField()),
                ('transcript', models.TextField()),
                ('importance', models.FloatField()),
                ('match_scores', models.CharField(max_length=1000)),
                ('score', models.FloatField()),
                ('norm_score', models.FloatField()),
            ],
        ),
        migrations.CreateModel(
            name='VisualSeg',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('video_id', models.CharField(max_length=200)),
                ('seg_id', models.IntegerField()),
                ('start_time', models.FloatField()),
                ('end_time', models.FloatField()),
                ('length', models.FloatField()),
                ('norm_length', models.FloatField()),
                ('importance', models.FloatField()),
                ('match_scores', models.CharField(max_length=1000)),
                ('score', models.FloatField()),
                ('norm_score', models.FloatField()),
            ],
        ),
        migrations.CreateModel(
            name='Word',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('video_id', models.CharField(max_length=200)),
                ('visual_seg_id', models.IntegerField()),
                ('audio_seg_id', models.IntegerField()),
                ('start_time', models.FloatField()),
                ('end_time', models.FloatField()),
                ('length', models.FloatField()),
                ('word', models.CharField(max_length=200)),
            ],
        ),
    ]
