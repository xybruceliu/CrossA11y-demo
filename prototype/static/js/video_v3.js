// PARAMETERS
const COLOR1 = [255, 0, 0]
const COLOR2 = [220, 220, 220]


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
    // preview captions
    var aseg_v_rects = document.getElementsByClassName("aseg-v-rect");
    for (var i = 0; i < aseg_v_rects.length; i++) {
        var aseg_v_rect = aseg_v_rects[i];
        var start_time = aseg_v_rect.getAttribute("start_time");
        var end_time =aseg_v_rect.getAttribute("end_time");

        var preview_captions = document.getElementById("preview-captions");

        let v_timestamp = document.getElementById( "v-timestamp-"+aseg_v_rect.getAttribute("seg_id"));

        if ((time >= start_time) && (time <= end_time)){
            // highlight
            aseg_v_rect.style.borderLeft = "5px solid #FFDA6A";
            v_timestamp.style.backgroundColor = "#FFDA6A";

            if (aseg_v_rect.parentNode.getElementsByClassName("captions-edit").length > 0 ){
                // if described, preview captions
                let captions_edits = aseg_v_rect.parentNode.getElementsByClassName("captions-edit");
                let seg_id = aseg_v_rect.getAttribute("seg_id");

                if (captions_edits.length > 0){
                    let captions_edit = captions_edits[0];
                        if (captions_edit.getAttribute("editing") == "false"){
                            let description = document.getElementById("describe-audio-form-"+seg_id).value;
                            preview_captions.innerHTML = description;
                        }
                        else{
                            preview_captions.innerHTML = "";
                        }
                }
                else{
                    preview_captions.innerHTML = "";
                }
            }

            // if original captions
            else{
                let captions = aseg_v_rect.parentNode.getElementsByClassName("captions")[0];
                preview_captions.innerHTML = captions.getAttribute("transcript");
            }
        }
        else{
            aseg_v_rect.style.borderLeft = "";
            v_timestamp.style.backgroundColor = "";
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
       
            if ((time < (parseFloat(start_time) + 0.2)) && (SPEAKING==false)){
                // if described, preview video description
                let description_edits = vseg_v_rect.parentNode.getElementsByClassName("description-edit");
                let seg_id = vseg_v_rect.getAttribute("seg_id");

                if (description_edits.length > 0){
                    let description_edit = description_edits[0];
                    let description = document.getElementById("describe-visual-form-"+seg_id).value;
                        if ((description_edit.getAttribute("editing") == "false") && (description.length > 0) && (SPEAKING==false)){
                            SPEAKING = true;
                            player.pauseVideo();
                            var msg = new SpeechSynthesisUtterance();
                            msg.text = description;
                            console.log(msg.text)
                            window.speechSynthesis.speak(msg);
                            msg.onend = function(event){
                                player.playVideo();
                                setTimeout(()=>{SPEAKING = false;}, 300)
                            }
                        }
                }
            }
        }
        else{
            vseg_v_rect.style.borderLeft = "";
        }
    }
}


// 1 HORIZONTAL TIMELINE
// gradient color change
// c1, c2 = [r,g,b]
// val 0-1

function gradient_color(mix, c1, c2)
{
   //Invert sRGB gamma compression
   c1 = InverseSrgbCompanding(c1);
   c2 = InverseSrgbCompanding(c2);

   r = c1[0]*(1-mix) + c2[0]*(mix);
   g = c1[1]*(1-mix) + c2[1]*(mix);
   b = c1[2]*(1-mix) + c2[2]*(mix);

   //Reapply sRGB gamma compression
   result = SrgbCompanding([r,g,b]);

   return result;
}

function InverseSrgbCompanding(c)
{
    //Convert color from 0..255 to 0..1
    r = c[0] / 255;
    g = c[1] / 255;
    b = c[2] / 255;

    //Inverse Red, Green, and Blue
    if (r > 0.04045) {r = Math.pow((r+0.055)/1.055, 2.4)} else {r = r / 12.92;}
    if (g > 0.04045) {g = Math.pow((g+0.055)/1.055, 2.4)} else {g = g / 12.92;}
    if (b > 0.04045) {b = Math.pow((b+0.055)/1.055, 2.4)} else {b = b / 12.92;}

    //return new color. Convert 0..1 back into 0..255
    result_r = r*255;
    result_g = g*255;
    result_b = b*255;

    return [result_r, result_g, result_b];
}

function SrgbCompanding(c)
{
    //Convert color from 0..255 to 0..1
    r = c[0] / 255;
    g = c[1] / 255;
    b = c[2] / 255;

    //Apply companding to Red, Green, and Blue
    if (r > 0.0031308) {r = 1.055*Math.pow(r, 1/2.4)-0.055} else {r = r * 12.92};
    if (g > 0.0031308) {g = 1.055*Math.pow(g, 1/2.4)-0.055} else {g = g * 12.92};
    if (b > 0.0031308) {b = 1.055*Math.pow(b, 1/2.4)-0.055} else {b = b * 12.92};

    //return new color. Convert 0..1 back into 0..255
    result_r = r*255;
    result_g = g*255;
    result_b = b*255;

    return "rgb(" + 
    result_r.toString() + "," + 
    result_g.toString() + "," + 
    result_b.toString() + ")";
}




// for visual segments
var visual_seg_rects = document.getElementsByClassName("v-timeline-rect");
for (var i = 0; i < visual_seg_rects.length; i++) {

    // assign color based on accessibility score
    var visual_seg_rect = visual_seg_rects[i];
    var norm_score = visual_seg_rect.getAttribute("norm_score");

    // by default show the top 35% problems with color
    if (norm_score > 0.35){
        visual_seg_rect.style.fill = gradient_color(1, COLOR1, COLOR2);
    }
    else{
        visual_seg_rect.style.fill = gradient_color(norm_score, COLOR1, COLOR2);
    }

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
            audio_seg_rect.style.opacity = match_scores[j];
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


function sec2Time(sec_num) {
    var sec_num = parseInt(sec_num, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return minutes+':'+seconds;
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



    // Add vertical timestamps and align
    let top = aseg_v_rect.getBoundingClientRect().top;
    let start_time = aseg_v_rect.getAttribute("start_time");
    let v_timestamp = document.createElement('div');
    v_timestamp.classList.add("v-timestamp");
    v_timestamp.setAttribute("id", "v-timestamp-"+aseg_v_rect.getAttribute("seg_id"));
    v_timestamp.setAttribute("seg_id", aseg_v_rect.getAttribute("seg_id"));
    v_timestamp.setAttribute("start_time", start_time);
    v_timestamp.innerHTML = sec2Time(aseg_v_rect.getAttribute("start_time"));
    v_timestamp.style.position = 'absolute';
    v_timestamp.style.top = window.scrollY + top + "px";

    v_timestamp.addEventListener("click", (e) => {
        player.seekTo(Math.max(start_time, 0));
    });

    let v_timestamps_col = document.getElementById("v-timestamps-col");
    v_timestamps_col.appendChild(v_timestamp);
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

    // by default show the top 35% problems
    let norm_score = description.getAttribute("norm_score");
    if (norm_score > 0.35){
        description.parentNode.style.display = "none";
    }
    else{
        description.parentNode.style.display = "";
    }
}

// visual vertical rectangles for timeline
var vseg_v_rects = document.getElementsByClassName("vseg-v-rect");
for (var i = 0; i < vseg_v_rects.length; i++) {

    // assign color based on accessibility score
    var vseg_v_rect = vseg_v_rects[i];
    var norm_score = vseg_v_rect.getAttribute("norm_score");
    
    vseg_v_rect.style.backgroundColor = gradient_color(norm_score, COLOR1, COLOR2);

    // presenter detection
    if (vseg_v_rect.getAttribute("presenter_detection") > 350000){
        let form = vseg_v_rect.parentNode.getElementsByClassName("form-control")[0];
        form.setAttribute("placeholder", "Likely to be a host speaking")
    }

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

// default 35%
reloadDescriptionCol(0.35)






// 4 REPAIRING ACCESSIBILITY ISSUES 

// Captions
let captions_edit_buttons = document.getElementById("captions-div").getElementsByClassName("btn-edit");
for (var i = 0; i < captions_edit_buttons.length; i++) {
    // Save and Edit
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

            // disable dismiss button
            var dismiss_button = document.getElementById("describe-audio-dismiss-" + seg_id);
            dismiss_button.classList.add("disabled")
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

            // enable dismiss button
            var dismiss_button = document.getElementById("describe-audio-dismiss-" + seg_id);
            dismiss_button.classList.remove("disabled")
        }

        update_num_problems();
    });

    // Dismiss
    let dismiss_buttons = captions_edit_buttons[i].parentNode.getElementsByClassName("btn-dismiss");
    for (let dismiss_button of dismiss_buttons){
        
        dismiss_button.addEventListener("click", (e)=>{
            let captions_div = e.target.parentNode.parentNode.parentNode;

            // if not yet dismissed
            if (captions_div.getAttribute("dismissed") == "false"){
                let seg_id = captions_div.getAttribute("seg_id");

                // Set dismissed attribute to true
                captions_div.setAttribute("dismissed", "true");
                
                // Set editing attribute to false
                captions_div.setAttribute("editing", "false");

                // Change color of vertical timeline
                var v_rect = document.getElementById("aseg"+seg_id);
                v_rect.style.backgroundColor = "rgb(173,181,189)";

                // Change color in the 1st col
                var rect = document.getElementById("a"+seg_id);
                rect.style.fill = "rgb(173,181,189)";

                // Clear textarea text and disable it
                let textarea = captions_div.getElementsByTagName("textarea")[0];
                textarea.value = "";
                textarea.setAttribute("disabled", true);

                // Disable Save button
                let edit_button = captions_div.getElementsByClassName("btn-edit")[0];
                edit_button.setAttribute("disabled", true);

                // Change dismiss button to undismiss
                for (let dismiss_button_1 of dismiss_buttons){
                    dismiss_button_1.style.display = "none";
                }
                dismiss_button.parentNode.parentNode.getElementsByClassName("btn-undismiss")[0].style.display = "";

            }

            update_num_problems();
        });
    }


    // Undismiss
    let undismiss_buttons = captions_edit_buttons[i].parentNode.getElementsByClassName("btn-undismiss");
    for (let undismiss_button of undismiss_buttons){

        undismiss_button.addEventListener("click", (e)=>{
            let captions_div = e.target.parentNode.parentNode.parentNode;

            // if already dismissed
            if (captions_div.getAttribute("dismissed") == "true"){

                let seg_id = captions_div.getAttribute("seg_id");

                // Set dismissed attribute to true
                captions_div.setAttribute("dismissed", "false");
                
                // Set editing attribute to false
                captions_div.setAttribute("editing", "true");

                // Change color of vertical timeline
                var norm_score = captions_div.getAttribute("norm_score");
                var v_rect = document.getElementById("aseg"+seg_id);
                v_rect.style.backgroundColor = gradient_color(norm_score, COLOR1, COLOR2);

                // Change color in the 1st col
                var rect = document.getElementById("a"+seg_id);
                rect.style.fill = gradient_color(norm_score, COLOR1, COLOR2);

                // Clear textarea text and disable it
                let textarea = captions_div.getElementsByTagName("textarea")[0];
                textarea.removeAttribute("disabled");

                // Disable Save button
                let edit_button = captions_div.getElementsByClassName("btn-edit")[0];
                edit_button.removeAttribute("disabled");

                // Change undismiss button to dismiss
                for (let dismiss_button_1 of dismiss_buttons){
                    dismiss_button_1.style.display = "";
                }
                undismiss_button.style.display = "none";

            }
            update_num_problems();
        });
    }
}





// Description

// helper function to check if an entity is already covered by the description
function is_entity_mentioned(entity, description){

    let words = description.match(/\b(\w+)\b/g);
    for (word of words){
        if (levenshteinDistance(entity, word) < 3){
            return true;
        }
    }
    return false;
}

const levenshteinDistance = (str1 = '', str2 = '') => {
    const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null));
    for (let i = 0; i <= str1.length; i += 1) {
       track[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j += 1) {
       track[j][0] = j;
    }
    for (let j = 1; j <= str2.length; j += 1) {
       for (let i = 1; i <= str1.length; i += 1) {
          const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
          track[j][i] = Math.min(
             track[j][i - 1] + 1, // deletion
             track[j - 1][i] + 1, // insertion
             track[j - 1][i - 1] + indicator, // substitution
          );
       }
    }
    return track[str2.length][str1.length];
 };


let description_edit_buttons = document.getElementById("description-div").getElementsByClassName("btn-edit");
for (var i = 0; i < description_edit_buttons.length; i++) {
    // Save and Edit
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

            // disable dismiss button
            var dismiss_buttons = document.getElementsByClassName("btn-dismiss-visual-" + seg_id);
            for (let dismiss_button of dismiss_buttons){
                dismiss_button.classList.add("disabled");
            }


            // // Feedback
            // var alertPlaceholder = document.getElementById('vseg-feedback'+seg_id)

            // var wrapper = document.createElement('div');
            // wrapper.classList.add("alert");
            // wrapper.classList.add("alert-success");
            // wrapper.classList.add("alert-warning");
            // wrapper.setAttribute("role", "alert");
            // wrapper.innerHTML='<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';

            // var detected_visuals = v_rect.getAttribute("detected_visuals").split("),");

           

            // for (detected_visual of detected_visuals){
            //     detected_visual = detected_visual.substring(1, detected_visual.length-1)
            //     let entity = detected_visual.split(",")[0];
            //     entity = entity.substring(1, entity.length)
            //     let score = detected_visual.split(",")[1];
            //     // let timestamp = detected_visual.split(",")[1];

            //     if (entity == ""){
            //         continue;
            //     }

            //     // if not already mentioned/covered
            //     if (!is_entity_mentioned(entity, description)){
            //         var detected_visual_span = document.createElement('span')
            //         detected_visual_span.classList.add("detected-visual-entity")
            //         detected_visual_span.setAttribute("score", score);
            //         detected_visual_span.innerText = entity + ", ";
                    
            //         // add to feedback
            //         wrapper.appendChild(detected_visual_span);
                    
            //         // detected_visual_span.addEventListener("click", (e) => {
            //         //     var start_time = e.target.getAttribute("timestamp");
            //         //     player.seekTo(Math.max(start_time, 0));
            //         // });
            //     }
            // }

            // // if there's a previous alert, delete and update
            // var prev_wrapper = alertPlaceholder.getElementsByClassName("alert")[0];
            // if (prev_wrapper !== undefined){
            //     prev_wrapper.remove();
            // }

            // // if at least 1 entity detected, append
            // if (wrapper.childElementCount > 1){
            //     alertPlaceholder.append(wrapper);
            // }
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

            // enable dismiss button
            var dismiss_buttons = document.getElementsByClassName("btn-dismiss-visual-" + seg_id);
            for (let dismiss_button of dismiss_buttons){
                dismiss_button.classList.remove("disabled")
            }

        }

        update_num_problems();
    });
    
    // Dismiss
    let dismiss_buttons = description_edit_buttons[i].parentNode.getElementsByClassName("btn-dismiss");
    for (let dismiss_button of dismiss_buttons){
        
        dismiss_button.addEventListener("click", (e)=>{
            let description_div = e.target.parentNode.parentNode.parentNode;

            // if not yet dismissed
            if (description_div.getAttribute("dismissed") == "false"){
                let seg_id = description_div.getAttribute("seg_id");

                // Set dismissed attribute to true
                description_div.setAttribute("dismissed", "true");
                
                // Set editing attribute to false
                description_div.setAttribute("editing", "false");

                // Change color of vertical timeline
                var v_rect = document.getElementById("vseg"+seg_id);
                v_rect.style.backgroundColor = "rgb(173,181,189)";

                // Change color in the 1st col
                var rect = document.getElementById("v"+seg_id);
                rect.style.fill = "rgb(173,181,189)";

                // Clear textarea text and disable it
                let textarea = description_div.getElementsByTagName("textarea")[0];
                textarea.value = "";
                textarea.setAttribute("disabled", true);

                // Disable Save button
                let edit_button = description_div.getElementsByClassName("btn-edit")[0];
                edit_button.setAttribute("disabled", true);

                // Change dismiss button to undismiss
                for (let dismiss_button_1 of dismiss_buttons){
                    dismiss_button_1.style.display = "none";
                }
                dismiss_button.parentNode.parentNode.getElementsByClassName("btn-undismiss")[0].style.display = "";

            }

            update_num_problems();
        });
    }


    // Undismiss
    let undismiss_buttons = description_edit_buttons[i].parentNode.getElementsByClassName("btn-undismiss");
    for (let undismiss_button of undismiss_buttons){

        undismiss_button.addEventListener("click", (e)=>{
            let description_div = e.target.parentNode.parentNode.parentNode;

            // if already dismissed
            if (description_div.getAttribute("dismissed") == "true"){

                let seg_id = description_div.getAttribute("seg_id");

                // Set dismissed attribute to true
                description_div.setAttribute("dismissed", "false");
                
                // Set editing attribute to false
                description_div.setAttribute("editing", "true");

                // Change color of vertical timeline
                var norm_score = description_div.getAttribute("norm_score");
                var v_rect = document.getElementById("vseg"+seg_id);
                v_rect.style.backgroundColor = gradient_color(norm_score, COLOR1, COLOR2);

                // Change color in the 1st col
                var rect = document.getElementById("v"+seg_id);
                rect.style.fill = gradient_color(norm_score, COLOR1, COLOR2);

                // Clear textarea text and disable it
                let textarea = description_div.getElementsByTagName("textarea")[0];
                textarea.removeAttribute("disabled");

                // Disable Save button
                let edit_button = description_div.getElementsByClassName("btn-edit")[0];
                edit_button.removeAttribute("disabled");

                // Change undismiss button to dismiss
                for (let dismiss_button_1 of dismiss_buttons){
                    dismiss_button_1.style.display = "";
                }
                undismiss_button.style.display = "none";

            }
            update_num_problems();
        });
    }
}




// Filter and Align
function reloadDescriptionCol(threshold){
    let descriptions = document.getElementsByClassName("description");
    let last_bottom = document.getElementById("aseg0").getBoundingClientRect().top;


    for (var i = 0; i < descriptions.length; i++) {
        var description = descriptions[i];
        // Filter
        let norm_score = description.getAttribute("norm_score");
        if (norm_score > threshold){
            description.parentNode.style.display = "none";
        }

        else{
            description.parentNode.style.display = "";

            // Align
            let start_time = parseFloat(description.getAttribute("start_time"));
            // Find aseg position
            var aseg_v_rects = document.getElementsByClassName("aseg-v-rect");
            for (var j = 0; j < aseg_v_rects.length; j++) {
                var aseg_v_rect = aseg_v_rects[j];
                var aseg_start_time = parseFloat(aseg_v_rect.getAttribute("start_time"));
                var aseg_end_time = parseFloat(aseg_v_rect.getAttribute("end_time"));

                // position 
                if ((start_time >= aseg_start_time) && (start_time < aseg_end_time)){
                    let aseg_top = aseg_v_rect.getBoundingClientRect().top;
                    let aseg_bottom = aseg_v_rect.getBoundingClientRect().bottom;
                    let top = aseg_top + (aseg_bottom-aseg_top) * (start_time - aseg_start_time) / (aseg_end_time - aseg_start_time); 
                    
                    // adapt caption column if space not enough
                    let marginTop = top-last_bottom;
                    
                    if (marginTop < 0){
                        // force it to be 1px
                        let vseg = description.parentNode;
                        vseg.style.marginTop = "1px";
                        last_bottom = vseg.getBoundingClientRect().bottom;
                    }

                    // space ok
                    else{
                        let vseg = description.parentNode;
                        vseg.style.marginTop = marginTop+"px";
                        last_bottom = vseg.getBoundingClientRect().bottom;
                    }
                }
            }
        }
    }
}

// Select filter threshold
var slider = document.getElementById("myRange");
// Update the current slider value (each time you drag the slider handle)
slider.oninput = function() {
    // update video descripiton problems
    reloadDescriptionCol(this.value * 0.01);
    update_num_problems();

    // update horizontal visual timeline color
    // for visual segments
    var visual_seg_rects = document.getElementsByClassName("v-timeline-rect");
    for (var i = 0; i < visual_seg_rects.length; i++) {
        // assign color based on accessibility score
        var visual_seg_rect = visual_seg_rects[i];
        var norm_score = visual_seg_rect.getAttribute("norm_score");
        // by default show the top % problems with color
        if ((visual_seg_rect.style.fill != "rgb(207, 226, 255)") && (visual_seg_rect.style.fill != "rgb(173, 181, 189)")){
            if (norm_score > (this.value * 0.01)){
                visual_seg_rect.style.fill = gradient_color(1, COLOR1, COLOR2);
            }
            else{
                visual_seg_rect.style.fill = gradient_color(norm_score, COLOR1, COLOR2);
            }
        }
    }

    // update filter number
    let filter_num = document.getElementById("filter-num");
    filter_num.innerText = this.value;
}


// HELPER: insertAfter
function insertAfter(newNode, existingNode) {
    existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
}


// HELPER: find which aseg is currently highlighted
function find_highlight_aseg(){
    // find which aseg to add below
    var aseg_v_rects = document.getElementsByClassName("aseg-v-rect");
    for (var j = 0; j < aseg_v_rects.length; j++) {
        var aseg_v_rect = aseg_v_rects[j];
        if (aseg_v_rect.style.borderLeft == "5px solid rgb(255, 218, 106)"){
            return aseg_v_rect.parentNode;
        }
    }
    return null
}



// Update number of problems left
function update_num_problems(){
    let caption_num_problems = document.getElementById("number-caption-problems");
    let captions_edits = document.getElementById("captions-div");
    caption_num_problems.innerHTML = captions_edits.querySelectorAll('[editing="true"]').length;
    let description_num_problems = document.getElementById("number-description-problems");
    let description_edits = document.getElementsByClassName("description-edit");
    let v_count = 0;

    for (var i = 0; i < description_edits.length; i++) {
        if ((description_edits[i].getAttribute("editing") == "true") && (description_edits[i].parentNode.style.display !== "none")){
            v_count = v_count + 1;
        }
    }
    description_num_problems.innerHTML = v_count;
}
update_num_problems();




// press alt to pause/play
window.addEventListener('keydown', function (e) {
    if (e.keyCode == 18) {
        if ((player.getPlayerState() == 2) || (player.getPlayerState() == -1)){
            player.playVideo();
        }
        else if (player.getPlayerState() == 1){
            player.pauseVideo();
        }
    }
  });
