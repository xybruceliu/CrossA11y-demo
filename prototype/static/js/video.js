// interactively control video via visual timestamps
var player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player("youtube-video", {
    events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
    },
    });
}

function onPlayerReady() {
    console.log("hey Im ready");
    console.log(player.getDuration());
    startInterval();
}

function onPlayerStateChange() {
    console.log("my state changed");
} 


// timeline pointer
function startInterval() {
    //checks every 100ms 
    setInterval(function() {
        var cur_time = player.getCurrentTime();
        var duration = player.getDuration();
        var percentage = 100*cur_time/duration;

        var pointer = document.getElementById("vl-parent");
        pointer.style.left = percentage.toString()+"%";
    }, 100)
}
 



// gradient color change
// c1, c2 = [r,g,b]
// val 0-1
function gradient_color(val, c1, c2){
    color = [0,0,0];
    color[0] = c1[0] + val * (c2[0] - c1[0]);
    color[1] = c1[1] + val * (c2[1] - c1[1]);
    color[2] = c1[2] + val * (c2[2] - c1[2]);
    color_str = "rgb(" + color[0].toString() + "," + color[1].toString() + "," + color[2].toString() + ")"
    return color_str
}


// for visual segments
var visual_seg_rects = document.getElementsByClassName("v-timeline-rect");
for (var i = 0; i < visual_seg_rects.length; i++) {

    // assign color based on accessibility score
    var visual_seg_rect = visual_seg_rects[i];
    var norm_score = visual_seg_rect.getAttribute("norm_score");
    var c1 = [255,27,33]
    var c2 = [0, 122, 255]

    visual_seg_rect.style.fill = gradient_color(norm_score, c1, c2);

    // click time of each question to jump to video time
    visual_seg_rects.item(i).addEventListener("click", (e) => {
        var start_time = e.target.getAttribute("start_time");
        var end_time = e.target.getAttribute("end_time");
        player.seekTo(Math.max(start_time, 0));
    });

    // hover to show matched segments
    visual_seg_rects.item(i).addEventListener("mouseover", (e) => {
        var match_scores = e.target.getAttribute("match_scores");
        match_scores = JSON.parse(match_scores);
        for (let j = 0; j < match_scores.length; j++){
            var audio_seg_rect = document.getElementById("a" + j);
            audio_seg_rect.style.opacity = match_scores[j]/3;
        }
    });

    // hover out
    visual_seg_rects.item(i).addEventListener("mouseout", (e) => {
        var match_scores = e.target.getAttribute("match_scores");
        match_scores = JSON.parse(match_scores);
        for (let j = 0; j < match_scores.length; j++){
            var audio_seg_rect = document.getElementById("a" + j);
            audio_seg_rect.style.opacity = 1;
        }
    });
}


// for audio segments
var audio_seg_rects = document.getElementsByClassName("a-timeline-rect");
for (var i = 0; i < audio_seg_rects.length; i++) {

    // assign color based on accessibility score
    var audio_seg_rect = audio_seg_rects[i];
    var norm_score = audio_seg_rect.getAttribute("norm_score");
    var c1 = [255,27,33]
    var c2 = [0, 122, 255]
    
    audio_seg_rect.style.fill = gradient_color(norm_score, c1, c2);

    // click time of each question to jump to video time
    audio_seg_rects.item(i).addEventListener("click", (e) => {
        var start_time = e.target.getAttribute("start_time");
        var end_time = e.target.getAttribute("end_time");
        player.seekTo(Math.max(start_time, 0));
    });

    // hover to show matched segments
    audio_seg_rects.item(i).addEventListener("mouseover", (e) => {
        // highlight matched visual segments
        var match_scores = e.target.getAttribute("match_scores");
        match_scores = JSON.parse(match_scores);
        for (let j = 0; j < match_scores.length; j++){
            var audio_seg_rect = document.getElementById("v" + j);
            audio_seg_rect.style.opacity = match_scores[j];
        }

        var transcript = document.getElementById("t" + e.target.getAttribute("id"));
        transcript.style.backgroundColor = "#ffc107";
    });

    // hover out
    audio_seg_rects.item(i).addEventListener("mouseout", (e) => {
        var match_scores = e.target.getAttribute("match_scores");
        match_scores = JSON.parse(match_scores);
        for (let j = 0; j < match_scores.length; j++){
            var audio_seg_rect = document.getElementById("v" + j);
            audio_seg_rect.style.opacity = 1;
        }

        var temp_ta = document.getElementById("t" + e.target.getAttribute("id"));
        temp_ta.style.backgroundColor = "white";
    });


    
    // Description
    // if audio segment is non-speech, visualize in description
    var ta = document.getElementById("ta"+i);
    if (ta.getAttribute("transcript") == "NON-SPEECH"){
        ta.classList.add("problem-non-speech");
        ta.classList.add("badge");
        ta.classList.add("bg-danger");
        ta.innerHTML = "NON-SPEECH";
    }

    // if it is a transcript
    if (ta.classList.contains("transcript")){

        ta.addEventListener("mouseover", (e) => {
            e.target.style.backgroundColor = "#ffc107";
        });

        ta.addEventListener("mouseout", (e) => {
            e.target.style.backgroundColor = "white";
        });

        ta.addEventListener("click", (e) => {
            var start_time = e.target.getAttribute("start_time");
            player.seekTo(Math.max(start_time, 0));
        });
    }

}