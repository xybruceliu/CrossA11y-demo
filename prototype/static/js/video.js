// PARAMETERS
const COLOR1 = [255, 0, 0]
const COLOR2 = [240, 240, 240]


// 0 VIDEO CONTROL
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

        // move the cursor
        var pointer = document.getElementById("vl-parent");
        pointer.style.left = percentage.toString()+"%";
        
        // show position in description timeline
        timeRender(cur_time);
    }, 100)
}



var SPEAKING = false;
// give a timestamp, check which word it is at and return the word span
function timeRender(time){

    // add highlight vertical audio segs
    var aseg_v_rects = document.getElementsByClassName("aseg-v-rect");
    for (var i = 0; i < aseg_v_rects.length; i++) {
        var aseg_v_rect = aseg_v_rects[i];
        var start_time = aseg_v_rect.getAttribute("start_time");
        var end_time =aseg_v_rect.getAttribute("end_time");

        if ((time >= start_time) && (time <= end_time)){
            aseg_v_rect.style.borderLeft = "5px solid #FFDA6A";
        }
        else{
            aseg_v_rect.style.borderLeft = "";
        }
    }

    // add highlight vertical visual segs
    var vseg_v_rects = document.getElementsByClassName("vseg-v-rect");
    for (var i = 0; i < vseg_v_rects.length; i++) {
        var vseg_v_rect = vseg_v_rects[i];
        var start_time = vseg_v_rect.getAttribute("start_time");
        var end_time =vseg_v_rect.getAttribute("end_time");

        if ((time >= start_time) && (time <= end_time)){
            vseg_v_rect.style.borderLeft = "5px solid #FFDA6A";
        }
        else{
            vseg_v_rect.style.borderLeft = "";
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

        if ((time > start_time) && (time < (parseFloat(start_time) + 0.1)) && (SPEAKING==false)){
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


// 1 TIMELINE
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

    visual_seg_rect.style.fill = gradient_color(norm_score, COLOR1, COLOR2);

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

        // for vertical visual segments
        var vseg_id = e.target.getAttribute("id").substring(1,e.target.getAttribute("id").length)
        var vseg_v_rect = document.getElementById("vseg"+vseg_id);
        if (vseg_v_rect !== null){
            vseg_v_rect.style.transform = "scale(1.2)";
            vseg_v_rect.style.borderLeft = "5px solid #FFDA6A";
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

       // for vertical visual segments
       var vseg_id = e.target.getAttribute("id").substring(1,e.target.getAttribute("id").length)
        var vseg_v_rect = document.getElementById("vseg"+vseg_id);
        if (vseg_v_rect !== null){
            vseg_v_rect.style.transform = "";
            vseg_v_rect.style.borderLeft = "";
        }
    });
}


// for audio segments
var audio_seg_rects = document.getElementsByClassName("a-timeline-rect");
for (var i = 0; i < audio_seg_rects.length; i++) {

    // assign color based on accessibility score
    var audio_seg_rect = audio_seg_rects[i];
    var norm_score = audio_seg_rect.getAttribute("norm_score");
    
    audio_seg_rect.style.fill = gradient_color(norm_score, COLOR1, COLOR2);

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

        // for vertical audio segments
        var aseg_id = e.target.getAttribute("id").substring(1,e.target.getAttribute("id").length)
        var aseg_v_rect = document.getElementById("aseg"+aseg_id);
        if (aseg_v_rect !== null){
            aseg_v_rect.style.transform = "scale(1.2)";
            aseg_v_rect.style.borderLeft = "5px solid #FFDA6A";
        }
    });

    // hover out
    audio_seg_rects.item(i).addEventListener("mouseout", (e) => {
        var match_scores = e.target.getAttribute("match_scores");
        match_scores = JSON.parse(match_scores);
        for (let j = 0; j < match_scores.length; j++){
            var audio_seg_rect = document.getElementById("v" + j);
            audio_seg_rect.style.opacity = 1;
        }

        // for vertical audio segments
        var aseg_id = e.target.getAttribute("id").substring(1,e.target.getAttribute("id").length)
        var aseg_v_rect = document.getElementById("aseg"+aseg_id);
        if (aseg_v_rect !== null){
            aseg_v_rect.style.transform = "";
            aseg_v_rect.style.borderLeft = "";
        }
    });
}





// 2 CAPTIONS (AUDIO ACCESSIBILITY)

// load and process all audio segments
let captions = document.getElementsByClassName("captions");
for (var i = 0; i < captions.length; i++) {
    // adjust the number of rows according to the length of non-speech
    var caption = captions[i];
    if (caption.getAttribute("transcript") == "NON-SPEECH"){
        let textarea = caption.getElementsByTagName("textarea")[0];
        let length = caption.getAttribute("length");
        let n = Math.max(1, Math.round(length/5));
        textarea.setAttribute("rows", n);
    }
}

// audio vertical rectangles for timeline
var aseg_v_rects = document.getElementsByClassName("aseg-v-rect");
for (var i = 0; i < aseg_v_rects.length; i++) {

    // assign color based on accessibility score
    var aseg_v_rect = aseg_v_rects[i];
    var norm_score = aseg_v_rect.getAttribute("norm_score");
    
    aseg_v_rect.style.backgroundColor = gradient_color(norm_score, COLOR1, COLOR2);

    // on hover
    aseg_v_rect.addEventListener("mouseover", (e) => {
        e.target.style.transform = "scale(1.2)";
        var audio_seg_id = e.target.getAttribute("seg_id");
        var audio_seg_rect = document.getElementById("a"+audio_seg_id);
        var audio_seg_svg = audio_seg_rect.parentElement;
        audio_seg_svg.style.transform = "scale(1.2)";
    });

    aseg_v_rect.addEventListener("mouseout", (e) => {
        e.target.style.transform = "";
        var audio_seg_id = e.target.getAttribute("seg_id");
        var audio_seg_rect = document.getElementById("a"+audio_seg_id);
        var audio_seg_svg = audio_seg_rect.parentElement;
        audio_seg_svg.style.transform = "";
    });

    // on click
    aseg_v_rect.addEventListener("click", (e)=>{
        var start_time = e.target.getAttribute("start_time");
        var end_time = e.target.getAttribute("end_time");
        player.seekTo(Math.max(start_time, 0));
    });
}






// 3 VIDEO DESCRIPTION (VISUAL ACCESSIBILITY)

// load and process all visual segments
let descriptions = document.getElementsByClassName("description");

for (var i = 0; i < descriptions.length; i++) {
    // adjust the number of rows according to the length of visual clip
    var description = descriptions[i];
    
    let textarea = description.getElementsByTagName("textarea")[0];
    let length = description.getAttribute("length");
    let n = Math.max(1, Math.round(length/4));
    textarea.setAttribute("rows", n);
}

// visual vertical rectangles for timeline
var vseg_v_rects = document.getElementsByClassName("vseg-v-rect");
for (var i = 0; i < vseg_v_rects.length; i++) {

    // assign color based on accessibility score
    var vseg_v_rect = vseg_v_rects[i];
    var norm_score = vseg_v_rect.getAttribute("norm_score");
    
    vseg_v_rect.style.backgroundColor = gradient_color(norm_score, COLOR1, COLOR2);

    // on hover
    vseg_v_rect.addEventListener("mouseover", (e) => {
        e.target.style.transform = "scale(1.2)";
        var visual_seg_id = e.target.getAttribute("seg_id");
        var visual_seg_rect = document.getElementById("v"+visual_seg_id);
        var visual_seg_svg = visual_seg_rect.parentElement;
        visual_seg_svg.style.transform = "scale(1.2)";
    });

    vseg_v_rect.addEventListener("mouseout", (e) => {
        e.target.style.transform = "";
        var visual_seg_id = e.target.getAttribute("seg_id");
        var visual_seg_rect = document.getElementById("v"+visual_seg_id);
        var visual_seg_svg = visual_seg_rect.parentElement;
        visual_seg_svg.style.transform = "";
    });

    // on click
    vseg_v_rect.addEventListener("click", (e)=>{
        var start_time = e.target.getAttribute("start_time");
        var end_time = e.target.getAttribute("end_time");
        player.seekTo(Math.max(start_time, 0));
    });
}






// 4 REPAIRING ACCESSIBILITY ISSUES 

// Captions
let captions_edit_buttons = document.getElementById("captions-div").getElementsByClassName("btn-edit");
for (var i = 0; i < captions_edit_buttons.length; i++) {
    captions_edit_buttons[i].addEventListener("click", (e) =>{      
        let caption_div = e.target.parentNode;
        let textarea = caption_div.getElementsByTagName("textarea")[0];

        var video_id = caption_div.getAttribute("video_id");
        var seg_id = caption_div.getAttribute("seg_id");
        var start_time = caption_div.getAttribute("start_time");
        var end_time = caption_div.getAttribute("end_time");
        var length = caption_div.getAttribute("length");
        var norm_score = caption_div.getAttribute("norm_score");

        var description = document.getElementById("describe-audio-form-"+seg_id).value;

        let v_rect = document.getElementById("aseg"+seg_id);

        // if is editing
        if (caption_div.getAttribute("editing") == "true"){
            caption_div.setAttribute("editing", "false");
            e.target.classList.replace("btn-outline-secondary", "btn-secondary");
            e.target.innerHTML = "Edit";
            textarea.setAttribute("disabled", true);

            // Add to describe AUDIO db
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "/prototype/"+video_id+"/"+seg_id+"/describe_audio/", true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify({
                video_id: video_id,
                seg_id: seg_id,
                start_time: start_time,
                end_time: end_time,
                length: length,
                description: description
            }));

            // Change color
            v_rect.style.backgroundColor = "#CFE2FF";

            // Change color in the 1st col
            var rect = document.getElementById("a"+seg_id);
            rect.style.fill = "#CFE2FF";

        }
   
        // else if not editing
        else{
            caption_div.setAttribute("editing", "true");
            e.target.classList.replace("btn-secondary", "btn-outline-secondary");
            e.target.innerHTML = "Save";
            textarea.removeAttribute("disabled");

            // Change color
            v_rect.style.backgroundColor = gradient_color(norm_score, COLOR1, COLOR2);

            // Change color in the 1st col
            var rect = document.getElementById("a"+seg_id);
            rect.style.fill = gradient_color(norm_score, COLOR1, COLOR2);
        }
    });
}





// Description
let description_edit_buttons = document.getElementById("description-div").getElementsByClassName("btn-edit");
for (var i = 0; i < description_edit_buttons.length; i++) {
    description_edit_buttons[i].addEventListener("click", (e) =>{      
        let description_div = e.target.parentNode;
        let textarea = description_div.getElementsByTagName("textarea")[0];

        var video_id = description_div.getAttribute("video_id");
        var seg_id = description_div.getAttribute("seg_id");
        var start_time = description_div.getAttribute("start_time");
        var end_time = description_div.getAttribute("end_time");
        var length = description_div.getAttribute("length");
        var norm_score = description_div.getAttribute("norm_score");

        var description = document.getElementById("describe-visual-form-"+seg_id).value;

        let v_rect = document.getElementById("vseg"+seg_id);

        // if is editing
        if (description_div.getAttribute("editing") == "true"){
            description_div.setAttribute("editing", "false");
            e.target.classList.replace("btn-outline-secondary", "btn-secondary");
            e.target.innerHTML = "Edit";
            textarea.setAttribute("disabled", true);

            // determine if inline or not
            // placeholder for now
            var type = "EX"

            // Add to describe VISUAL db
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "/prototype/"+video_id+"/"+seg_id+"/describe_visual/", true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify({
                video_id: video_id,
                seg_id: seg_id,
                start_time: start_time,
                end_time: end_time,
                length: length,
                description: description,
                type: type
            }));

            // Change color
            v_rect.style.backgroundColor = "#CFE2FF";

            // Change color in the 1st col
            var rect = document.getElementById("v"+seg_id);
            rect.style.fill = "#CFE2FF";

        }
   
        // else if not editing
        else{
            description_div.setAttribute("editing", "true");
            e.target.classList.replace("btn-secondary", "btn-outline-secondary");
            e.target.innerHTML = "Save";
            textarea.removeAttribute("disabled");

            // Change color
            v_rect.style.backgroundColor = gradient_color(norm_score, COLOR1, COLOR2);

            // Change color in the 1st col
            var rect = document.getElementById("v"+seg_id);
            rect.style.fill = gradient_color(norm_score, COLOR1, COLOR2);
        }
    });
}

