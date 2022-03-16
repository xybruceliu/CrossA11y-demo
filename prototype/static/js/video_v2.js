
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
    main();
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
        timeRender(cur_time);
    }, 100)
}


var SPEAKING = false;
// give a timestamp, check which word it is at and return the word span
function timeRender(time){

    let v_timestamps = document.getElementsByClassName("v-timestamp");
    for (let v_timestamp of v_timestamps){
        var start_time = parseFloat(v_timestamp.getAttribute("start_time"));
        var end_time = start_time + 5;
        if ((time >= start_time) && (time <= end_time)){
            v_timestamp.style.backgroundColor = "#FFDA6A";
        }
        else{
            v_timestamp.style.backgroundColor = "";
        }
    }


    let captions = document.getElementsByClassName("caption");
    let preview_captions = document.getElementById("preview-captions");

    for (let caption of captions){
        var start_time = parseFloat(caption.getAttribute("start_time"));
        var end_time = start_time + 5;

        if ((time >= start_time) && (time <= end_time)){
            let text = caption.innerText;
            preview_captions.innerText = text;
        }
        else{
            preview_captions.innerText = "";
        }
    }

    let descriptions = document.getElementsByClassName("description");
    for (let description of descriptions){
        var start_time = parseFloat(description.getAttribute("start_time"));

        if ((time >= start_time) && (time < (parseFloat(start_time) + 0.2)) && (SPEAKING==false)){
            let text = description.innerText;
            SPEAKING = true;
            player.pauseVideo();
            var msg = new SpeechSynthesisUtterance();
            msg.text = text;
            console.log(msg.text)
            window.speechSynthesis.speak(msg);
            msg.onend = function(event){
                player.playVideo();
                setTimeout(()=>{SPEAKING = false;}, 300)
            }
        }
    }
    
}


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

// Create vertical timestamps for reference
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


function main(){

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
                audio_seg_rect.style.opacity = match_scores[j];
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
        });

        // hover out
        audio_seg_rects.item(i).addEventListener("mouseout", (e) => {
            var match_scores = e.target.getAttribute("match_scores");
            match_scores = JSON.parse(match_scores);
            for (let j = 0; j < match_scores.length; j++){
                var audio_seg_rect = document.getElementById("v" + j);
                audio_seg_rect.style.opacity = 1;
            }
        });
    }

    let v_timestamps_col = document.getElementById("v-timestamps-col");
    for (let i=0; i < player.getDuration(); i+=5){
        let v_timestamp = document.createElement('div');
        v_timestamp.classList.add("v-timestamp");
        v_timestamp.classList.add("mb-5");
        v_timestamp.setAttribute("start_time", i);
        v_timestamp.innerHTML = sec2Time(i);

        v_timestamp.addEventListener("click", (e) => {
            player.seekTo(Math.max(i, 0));
        });

        v_timestamps_col.appendChild(v_timestamp);
    }


    // Add captions
    let btn_add_cc = document.getElementById("btn-add-cc");
    btn_add_cc.addEventListener("click", (e)=>{
        let text_custom_cc = document.getElementById("text-add-cc").value;
        let start_time = player.getCurrentTime();

        let captions_div = document.getElementById("captions-div");
        let caption = document.createElement("div");
        caption.classList.add("card")
        caption.classList.add("mx-2")
        caption.classList.add("caption");
        caption.style.width = "27rem";
        caption.setAttribute("start_time", start_time);
        
        let caption_body = document.createElement("div");
        caption.appendChild(caption_body);
        caption_body.classList.add("card-body");
        caption_body.style.position = "relative";
        caption_body.innerText = text_custom_cc;

        let btn_delete_caption = document.createElement("button");
        caption_body.append(btn_delete_caption);
        btn_delete_caption.setAttribute("type", "button");
        btn_delete_caption.classList.add('btn-close');
        btn_delete_caption.style.position = "absolute";
        btn_delete_caption.style.top = "5px";
        btn_delete_caption.style.right= "1px";
        

        // append to correct order
        if (captions_div.childElementCount == 0){
            captions_div.appendChild(caption);
        }
        else{
            // find the correct order
            let all_captions = document.getElementsByClassName("caption");
            let added = false;
            for (let temp_caption of all_captions){
                if ((!added) && parseFloat(temp_caption.getAttribute("start_time")) > parseFloat(caption.getAttribute("start_time"))){
                    captions_div.insertBefore(caption, temp_caption);
                    added = true;
                }
            }
            if (!added){
                captions_div.appendChild(caption);
            }
        }

        // adjust position
        let v_timestamps = document.getElementsByClassName("v-timestamp");
        for (let v_timestamp of v_timestamps){
            if ((start_time >= parseFloat(v_timestamp.getAttribute("start_time"))) && (start_time <= parseFloat(v_timestamp.getAttribute("start_time"))+5)){
                let v_timestamp_top = v_timestamp.getBoundingClientRect().top;
                let v_timestamp_bottom = v_timestamp.getBoundingClientRect().bottom;
                
                let cur_top = v_timestamp_top + (v_timestamp_bottom - v_timestamp_top) * ((start_time - parseFloat(v_timestamp.getAttribute("start_time"))) / 5);
                caption.style.position = 'absolute';
                caption.style.top = cur_top+"px";
            }
        }

        // click to delete
        btn_delete_caption.addEventListener("click", (e)=>{
            caption.remove();
        })
    });



    // Add descriptions
    let btn_add_ad = document.getElementById("btn-add-ad");
    btn_add_ad.addEventListener("click", (e)=>{
        let text_custom_ad = document.getElementById("text-add-ad").value;
        let start_time = player.getCurrentTime();

        let descriptions_div = document.getElementById("descriptions-div");
        let description = document.createElement("div");
        description.classList.add("card")
        description.classList.add("mx-2")
        description.classList.add("description");
        description.style.width = "27rem";
        description.setAttribute("start_time", start_time);
        
        let description_body = document.createElement("div");
        description.appendChild(description_body);
        description_body.classList.add("card-body");
        description_body.style.position = "relative";
        description_body.innerText = text_custom_ad;

        let btn_delete_description = document.createElement("button");
        description_body.append(btn_delete_description);
        btn_delete_description.setAttribute("type", "button");
        btn_delete_description.classList.add('btn-close');
        btn_delete_description.style.position = "absolute";
        btn_delete_description.style.top = "5px";
        btn_delete_description.style.right= "1px";
        

        // append to correct order
        if (descriptions_div.childElementCount == 0){
            descriptions_div.appendChild(description);
        }
        else{
            // find the correct order
            let all_descriptions = document.getElementsByClassName("description");
            let added = false;
            for (let temp_description of all_descriptions){
                if ((!added) && parseFloat(temp_description.getAttribute("start_time")) > parseFloat(description.getAttribute("start_time"))){
                    descriptions_div.insertBefore(description, temp_description);
                    added = true;
                }
            }
            if (!added){
                descriptions_div.appendChild(description);
            }
        }

        // adjust position
        let v_timestamps = document.getElementsByClassName("v-timestamp");
        for (let v_timestamp of v_timestamps){
            if ((start_time >= parseFloat(v_timestamp.getAttribute("start_time"))) && (start_time <= parseFloat(v_timestamp.getAttribute("start_time"))+5)){
                let v_timestamp_top = v_timestamp.getBoundingClientRect().top;
                let v_timestamp_bottom = v_timestamp.getBoundingClientRect().bottom;
                
                let cur_top = v_timestamp_top + (v_timestamp_bottom - v_timestamp_top) * ((start_time - parseFloat(v_timestamp.getAttribute("start_time"))) / 5);
                description.style.position = 'absolute';
                description.style.top = cur_top+"px";
            }
        }
        
        // click to delete
        btn_delete_description.addEventListener("click", (e)=>{
            description.remove();
        })
    });
    
}

