
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


function main(){

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
        document.getElementById("text-add-cc").value = "";
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
                caption.style.top = window.scrollY + cur_top+"px";
            }
        }

        // click to delete
        btn_delete_caption.addEventListener("click", (e)=>{
            caption.remove();
            let preview_captions = document.getElementById("preview-captions");
            preview_captions.innerText = "";
        })
    });



    // Add descriptions
    let btn_add_ad = document.getElementById("btn-add-ad");
    btn_add_ad.addEventListener("click", (e)=>{

        let text_custom_ad = document.getElementById("text-add-ad").value;
        document.getElementById("text-add-ad").value = "";
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
                description.style.top = window.scrollY + cur_top+"px";
            }
        }
        
        // click to delete
        btn_delete_description.addEventListener("click", (e)=>{
            description.remove();
        })
    });
    
}

