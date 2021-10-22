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
}

function onPlayerStateChange() {
    console.log("my state changed");
}

var seekTimeLinks = document.getElementsByClassName("seekTimeLink");
for (var i = 0; i < seekTimeLinks.length; i++) {

    // click time of each question to jump to video time
    seekTimeLinks.item(i).addEventListener("click", (e) => {
    var start_time = parseInt(e.target.getAttribute("start_time"));
    var end_time = parseInt(e.target.getAttribute("end_time"));
    var audio_ids = e.target.getAttribute("related_audio");
    player.seekTo(parseInt(Math.max(start_time, 0)));
    });

    // hover to show matched segments
    seekTimeLinks.item(i).addEventListener("mouseover", (e) => {
    var start_time = parseInt(e.target.getAttribute("start_time"));
    var end_time = parseInt(e.target.getAttribute("end_time"));
    var audio_ids = e.target.getAttribute("related_audio");
    audio_ids = JSON.parse(audio_ids);
    for (var audio_id of audio_ids) {
        var audio_rect = document.getElementById("a" + audio_id);
        audio_rect.style.opacity = "0.5";
    }
    });

    // hover out
    seekTimeLinks.item(i).addEventListener("mouseout", (e) => {
    for (var i = 0; i < seekTimeLinks.length; i++) {
        if (seekTimeLinks.item(i).id.includes("a")) {
        seekTimeLinks.item(i).style.opacity = "1";
        }
     }
    });
}