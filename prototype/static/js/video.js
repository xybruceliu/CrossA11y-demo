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

var SPEAKING = false;
// give a timestamp, check which word it is at and return the word span
function time2Word(time){
    // add highlight
    var words = document.getElementsByClassName("word");
    for (var i = 0; i < words.length; i++) {
        var word = words[i];
        var start_time = words[i].getAttribute("start_time");
        var end_time = words[i].getAttribute("end_time");

        if ((time >= start_time) && (time <= end_time)){
            word.style.borderBottom = "5px solid #ffc107";
        }
        else{
            word.style.borderBottom = "";
        }
    }

    // preview captions
    var describe_audio_nodes = document.getElementsByClassName("describe_audio_node");
    for (var i = 0; i < describe_audio_nodes.length; i++){
        var describe_audio_node = describe_audio_nodes[i];
        var start_time =describe_audio_node.getAttribute("start_time");
        var end_time = describe_audio_node.getAttribute("end_time");

        var preview_captions = document.getElementById("preview-captions");
        if ((time >= start_time) && (time <= end_time)){
            preview_captions.innerHTML = describe_audio_node.getAttribute("description");
        }
        else{
            preview_captions.innerHTML = '';
        }
    }

    // preview AD
    var describe_visual_nodes = document.getElementsByClassName("describe_visual_node");
    for (var i = 0; i < describe_visual_nodes.length; i++){
        var describe_visual_node = describe_visual_nodes[i];
        var start_time =describe_visual_node.getAttribute("start_time");
        var end_time = describe_visual_node.getAttribute("end_time");

        if ((time > start_time) && (time <= (parseFloat(start_time) + 0.1)) && (SPEAKING==false)){
            SPEAKING = true;
            player.pauseVideo();
            var msg = new SpeechSynthesisUtterance();
            msg.text = describe_visual_node.getAttribute("description");
            console.log(msg.text)
            window.speechSynthesis.speak(msg);
            msg.onend = function(event){
                player.playVideo();
                SPEAKING = false;
            }
        }
    }

}


// timeline pointer
function startInterval() {
    //checks every 100ms 
    setInterval(function() {
        var cur_time = player.getCurrentTime();
        var duration = player.getDuration();
        var percentage = 100*cur_time/duration;

        // move the cursor
        var pointer = document.getElementById("vl-parent");
        pointer.style.left = percentage.toString()+"%";
        
        // show position in description timeline
        time2Word(cur_time);
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



// for words
var words = document.getElementsByClassName("word");
for (var i = 0; i < words.length; i++) {

    // visualize NON-SPEECH in description timeline
    var word = words[i];
    const non_speech_bar_ratio = 50;
    if (word.getAttribute("word") == "NON-SPEECH"){
        word.classList.add("inline-problem-non-speech");
        word.classList.add("badge");
        word.classList.add("bg-light");
        word.classList.add("text-dark");
        word.innerHTML = "NON-SPEECH";
        word.style.width = (word.getAttribute("length")*non_speech_bar_ratio).toString() + "px";
    }

    // hover to show corresponding segments
    word.addEventListener("mouseover", (e) => {
        e.target.style.backgroundColor = "#ffc107";
        e.target.style.transform = "scale(1.1)";

        var visual_seg_id = e.target.getAttribute("visual_seg_id");
        var audio_seg_id = e.target.getAttribute("audio_seg_id");
        var visual_seg_rect = document.getElementById(visual_seg_id);
        var audio_seg_rect = document.getElementById(audio_seg_id);
        var visual_seg_svg = visual_seg_rect.parentElement;
        var audio_seg_svg = audio_seg_rect.parentElement;

        visual_seg_svg.style.transform = "scale(1.2)";
        audio_seg_svg.style.transform = "scale(1.2)";

        var problem_a = document.getElementById("p"+audio_seg_id+"v-1")
        var problem_v = document.getElementById("p"+"a-1"+visual_seg_id)
        if (problem_a != null){ problem_a.classList.replace('bg-light', 'bg-warning') }
        if (problem_v != null){ problem_v.classList.replace('bg-light', 'bg-warning') }
    })

    // mouseout
    word.addEventListener("mouseout", (e) => {
        e.target.style.backgroundColor = "";
        e.target.style.transform = "";

        var visual_seg_id = e.target.getAttribute("visual_seg_id");
        var audio_seg_id = e.target.getAttribute("audio_seg_id");
        var visual_seg_rect = document.getElementById(visual_seg_id);
        var audio_seg_rect = document.getElementById(audio_seg_id);
        var visual_seg_svg = visual_seg_rect.parentElement;
        var audio_seg_svg = audio_seg_rect.parentElement;;

        visual_seg_svg.style.transform = "";
        audio_seg_svg.style.transform = "";

        var problem_a = document.getElementById("p"+audio_seg_id+"v-1")
        var problem_v = document.getElementById("p"+"a-1"+visual_seg_id)
        if (problem_a != null){ problem_a.classList.replace('bg-warning', 'bg-light') }
        if (problem_v != null){ problem_v.classList.replace('bg-warning', 'bg-light') }
    })


    // click to jump to video time 
    word.addEventListener("click", (e) => {
        var start_time = e.target.getAttribute("start_time");
        var end_time = e.target.getAttribute("end_time");
        player.seekTo(Math.max(start_time, 0));
    });
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

        var words = document.querySelectorAll('[visual_seg_id="'+e.target.getAttribute("id")+'"]');
        for (var word of words){
            word.style.backgroundColor = "#ffc107";
            word.style.transform = "scale(1.1)";
        }

        var problem_v = document.getElementById("p"+"a-1"+e.target.getAttribute("id"))
        if (problem_v != null){ problem_v.classList.replace('bg-light', 'bg-warning') }
    });

    // hover out
    visual_seg_rects.item(i).addEventListener("mouseout", (e) => {
        var match_scores = e.target.getAttribute("match_scores");
        match_scores = JSON.parse(match_scores);
        for (let j = 0; j < match_scores.length; j++){
            var audio_seg_rect = document.getElementById("a" + j);
            audio_seg_rect.style.opacity = 1;
        }

        var words = document.getElementsByClassName("word");
        for (var word of words){
            word.style.backgroundColor = "";
            word.style.transform = "";
        }
        
        var problem_v = document.getElementById("p"+"a-1"+e.target.getAttribute("id"))
        if (problem_v != null){ problem_v.classList.replace('bg-warning', 'bg-light') }
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

        var words = document.querySelectorAll('[audio_seg_id="'+e.target.getAttribute("id")+'"]');
        for (var word of words){
            word.style.backgroundColor = "#ffc107";
            word.style.transform = "scale(1.1)";
        }

        var problem_a = document.getElementById("p"+e.target.getAttribute("id")+"v-1")
        if (problem_a != null){ problem_a.classList.replace('bg-light', 'bg-warning') }
    });

    // hover out
    audio_seg_rects.item(i).addEventListener("mouseout", (e) => {
        var match_scores = e.target.getAttribute("match_scores");
        match_scores = JSON.parse(match_scores);
        for (let j = 0; j < match_scores.length; j++){
            var audio_seg_rect = document.getElementById("v" + j);
            audio_seg_rect.style.opacity = 1;
        }

        var words = document.getElementsByClassName("word");
        for (var word of words){
            word.style.backgroundColor = "";
            word.style.transform = "";
        }

        var problem_a = document.getElementById("p"+e.target.getAttribute("id")+"v-1")
        if (problem_a != null){ problem_a.classList.replace('bg-warning', 'bg-light') }
    });
}


// for problems
var problem_cards = document.getElementsByClassName("card-header");
for (var i = 0; i < problem_cards.length; i++) {

    // click to jump to video time 
    problem_cards.item(i).addEventListener("click", (e) => {
        var start_time = e.target.parentElement.getAttribute("start_time");
        player.seekTo(Math.max(start_time, 0));
    });

    // highlight rectangles
    problem_cards.item(i).addEventListener("mouseover", (e) => {
        var rectangle;
        var card = e.target.parentElement;
        card.classList.replace('bg-light', 'bg-warning');
        var audio_seg_id = card.getAttribute("audio_seg");
        var visual_seg_id = card.getAttribute("visual_seg");

        if (audio_seg_id != "-1"){
            rectangle = document.getElementById("a"+audio_seg_id);
        }
        else if (visual_seg_id != "-1"){
            rectangle = document.getElementById("v"+visual_seg_id);
        }

        if (rectangle != null){rectangle.parentElement.style.transform = "scale(1.2)"}
        
    })


    // hover out
    problem_cards.item(i).addEventListener("mouseout", (e) => {
        var rectangle;
        var card = e.target.parentElement;
        card.classList.replace('bg-warning', 'bg-light');
        var audio_seg_id = card.getAttribute("audio_seg");
        var visual_seg_id = card.getAttribute("visual_seg");

        if (audio_seg_id != "-1"){
            rectangle = document.getElementById("a"+audio_seg_id);
        }
        else if (visual_seg_id != "-1"){
            rectangle = document.getElementById("v"+visual_seg_id);
        }

        if (rectangle != null){rectangle.parentElement.style.transform = ""}
        
    })

}



// REPAIRING ACCESSIBILITY ISSUES 

// Add to describe AUDIO db
var describe_audio_buttons = document.getElementsByClassName("describe-audio-submit");
for (var i = 0; i < describe_audio_buttons.length; i++) {
    // click to add a description
    describe_audio_buttons.item(i).addEventListener("click", (e) => {

        // add to db 
        var video_id = e.target.getAttribute("video_id");
        var seg_id = e.target.getAttribute("seg_id");
        var start_time = e.target.getAttribute("start_time");
        var end_time = e.target.getAttribute("end_time");
        var length = e.target.getAttribute("length");
        var description = document.getElementById("describe-audio-form-"+seg_id).value;

        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/prototype/"+video_id+"/"+seg_id+"/describe_audio/", true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({
            video_id: video_id,
            seg_id: seg_id,
            start_time: start_time,
            end_time: end_time,
            length: length,
            description: description–
        }));
        
        // add to description timeline interface
        var words_div = document.getElementById("description-div");
        var word_node = words_div.querySelectorAll('[start_time="'+start_time+'"], [end_time="'+end_time+'"]')[0]

        // if description already added
        if (words_div.querySelectorAll('[seg_id="'+"a"+seg_id+'"]').length == 0){
            var description_node = document.createElement('div');
            description_node.classList.add("badge");
            description_node.classList.add("bg-secondary");
            description_node.classList.add("describe_audio_node")
            description_node.setAttribute("seg_id", "a"+seg_id)
            description_node.setAttribute("start_time", start_time)
            description_node.setAttribute("end_time", end_time)
            description_node.setAttribute("description", description)
            description_node.innerHTML = "[A] " + description;
            word_node.parentNode.insertBefore(description_node, word_node);
        }

        else{
            var description_node = words_div.querySelectorAll('[seg_id="'+"a"+seg_id+'"]')[0]
            description_node.setAttribute("description", description)
            description_node.innerHTML = "[A] " + description;
        }
    });
}



function find_closest_word_node(start_time, end_time){
    var words = document.getElementsByClassName("word");
    var start_time_diff = 99999;
    var closest_node;
    for (var i = 0; i < words.length; i++) {
        var word_node = words[i];
        var word_start_time = words[i].getAttribute("start_time");
        var word_end_time = words[i].getAttribute("end_time");
        
        if (Math.abs(start_time-word_start_time) < start_time_diff){
            start_time_diff = Math.abs(start_time-word_start_time);
            closest_node = word_node;
        }
    }
    return closest_node;
}

// Add to describe VISUAL db
var describe_visual_buttons = document.getElementsByClassName("describe-visual-submit");
for (var i = 0; i < describe_visual_buttons.length; i++) {
    // click to add a description
    describe_visual_buttons.item(i).addEventListener("click", (e) => {
        var video_id = e.target.getAttribute("video_id");
        var seg_id = e.target.getAttribute("seg_id");
        var start_time = e.target.getAttribute("start_time");
        var end_time = e.target.getAttribute("end_time");
        var length = e.target.getAttribute("length");
        var description = document.getElementById("describe-visual-form-"+seg_id).value;

        // determine if inline or not
        // placeholder for now
        var type = "EX"

        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/prototype/"+video_id+"/"+seg_id+"/describe_visual/", true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({
            video_id: video_id,
            seg_id: seg_id,
            start_time: start_time,
            end_time: end_time,
            length: length,
            type: type,
            description: description
        }));

        // add to description timeline interface
        var words_div = document.getElementById("description-div");
        
        // find the closest word node
        var word_node = find_closest_word_node(start_time, end_time);

        // if description already added
        if (words_div.querySelectorAll('[seg_id="'+"v"+seg_id+'"]').length == 0){
            var description_node = document.createElement('div');
            description_node.classList.add("badge");
            description_node.classList.add("bg-secondary");
            description_node.classList.add("describe_visual_node")
            description_node.setAttribute("seg_id", "v"+seg_id)
            description_node.setAttribute("start_time", start_time)
            description_node.setAttribute("end_time", end_time)
            description_node.setAttribute("description", description)
            description_node.innerHTML = "[V] " + description;
            word_node.parentNode.insertBefore(description_node, word_node);
        }

        else{
            var description_node = words_div.querySelectorAll('[seg_id="'+"v"+seg_id+'"]')[0]
            description_node.setAttribute("description", description)
            description_node.innerHTML = "[V] " + description;
        }
    });
}