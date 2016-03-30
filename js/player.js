/**
 * Player Object
 */
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
const Player = {
    YTPlayer: undefined,
    updateTimeInterval: undefined,
    updateMetaInterval: undefined,
    videoHasEnded: false,
    activeKeys: {},
    GUI: {
        gui: document.getElementById("gui"),
        title: document.getElementById("title"),
        time: document.getElementById("currentTime"),
        duration: document.getElementById("duration"),
        controls: {
            play: document.getElementById("play"),
            prev: document.getElementById("prev"),
            next: document.getElementById("next"),
            volumeSlider: document.getElementById("volumeSlider")
        },
        searchField: document.getElementById("searchField"),
        preloader: document.getElementById("preloader")
    },
    /**
     * Gets fired when the YT Player is Loaded
     */
    onReady: function(event) {

        Player.YTPlayer.unMute();
        Player.YTPlayer.setVolume(100);

        // The timeout is needed to set the shuffle correctly this is a bug
        // in the YouTube iFrame-API.
        setTimeout(function() {
            Player.YTPlayer.setShuffle(true);
            Player.YTPlayer.setLoop(true);
        }, 2000);

        //Remove preloader
        Player.GUI.preloader.style.display = "none";
        Player.GUI.gui.style.display = "block";
        Player.GUI.controls.prev.addEventListener('click', Player.playPrevious);
        Player.GUI.controls.next.addEventListener('click', Player.playNext);
        Player.GUI.controls.volumeSlider.addEventListener('input', Player.updateVolume);

        //Add Keyboard Shortcuts
        window.addEventListener("keydown", Player.keydown, false);
        window.addEventListener("keyup", Player.keyup, false);
        Player.updateTimeInterval = setInterval(Player.updateTime, 500);
        Player.updateMetaInterval = setInterval(Player.displayMeta, 500);

        // TODO: On mobile devices we can't start the player this way, the user
        // needs to initiate the player. I need to figure how to deactivate
        // the autoplay on mobile devices, so the play button doesn't turn
        // into a pause one. Till then I deactivate autostart alltogether.     
        // Player.play();
    },

    /**
     * Gets called when the state of the player gets changed
     */
    onStateChange: function(event) {
        const state = event.target.getPlayerState();

        if(state == YT.PlayerState.ENDED) {
            Player.videoHasEnded = true;
        }

        if(Player.videoHasEnded && (state == YT.PlayerState.PLAYING)) {
            const videoId = getParameterByName("v", Player.YTPlayer.getVideoUrl());
            console.log(videoId);
            const notification = new Notification(Player.YTPlayer.getVideoData().title, {
                icon: "https://i1.ytimg.com/vi/" + videoId + "/hqdefault.jpg"
            });
            setTimeout(function() {
                notification.close()
            }, 5000);
            Player.videoHasEnded = false;
        }
        
    },
    keydown: function(e) {
        console.log(e.keyCode);
        if (Player.activeKeys[e.keyCode] == null) {
            switch (e.keyCode) {
                case 37:
                case 74:
                    Player.playPrevious();
                    break;
                case 39:
                case 75:
                    Player.playNext();
                    break;
                case 32:
                    Player.changeVideoState();
                    break;
            }
            Player.activeKeys[e.keyCode] = true;
        }
    },
    keyup: function(e) {
        Player.activeKeys[e.keyCode] = null;
    },
    /**
     * Switches between playing and pausing
     */
    changeVideoState: function() {
        if (Player.YTPlayer.getPlayerState() == YT.PlayerState.PLAYING) {
            clearInterval(Player.updateTimeInterval);
            Player.pause();
        } else {
            Player.updateTimeInterval = setInterval(Player.updateTime, 500);
            Player.play();
        }
    },
    displayMeta: function() {
        let title = Player.YTPlayer.getVideoData().title;
        Player.GUI.title.innerText = title;
        document.getElementsByTagName('title')[0].innerText = title;
        //Add event listeners for the GUI
        Player.GUI.controls.play.addEventListener("click", Player.changeVideoState);
    },

    updateVolume: function(e) {
        Player.YTPlayer.setVolume(e.target.value);
    },
    playNext: function() {
        Player.YTPlayer.nextVideo();
        Player.play();
    },
    playPrevious: function() {
        Player.YTPlayer.previousVideo();
        Player.play();
    },
    /**
     * Formats the seconds in the style mm:ss
     * @param {number} seconds
     * @return {string} The formatted time as string
     */
    formatTime: function(seconds) {
        seconds = Math.round(seconds);
        let minutes = Math.floor(seconds / 60);
        seconds = seconds - minutes * 60;
        let time = Player.str_pad_left(minutes, "0", 2) + ':' + Player.str_pad_left(seconds, "0", 2);
        return time;
    },
    /**
     * This function is used to update the time correctly
     * @return {[type]} [description]
     */
    updateTime: function() {
        let currentTime = Player.YTPlayer.getCurrentTime();
        Player.GUI.time.innerText = Player.formatTime(currentTime);
        let duration = Player.YTPlayer.getDuration();
        Player.GUI.duration.innerText = Player.formatTime(duration);
        let progress = currentTime / duration;
        document.getElementById("trackbar").style.width = progress * 100 + "%";
    },
    /**
     * Start/continue playback of video
     */
    play: function() {
        Player.GUI.controls.play.innerText = "pause_circle_filled";
        Player.YTPlayer.playVideo();
    },
    /**
     * Pause the playback of the video
     */
    pause: function() {
        Player.GUI.controls.play.innerText = "play_circle_filled";
        Player.YTPlayer.pauseVideo();
    },
    loadVideoById: function(id) {
        Player.YTPlayer.loadVideoByid(id);
    },
    /**
     * Used the pad the time correctly
     */
    str_pad_left: function(string, pad, length) {
        return (new Array(length + 1).join(pad) + string).slice(-length);
    },
    loadByUrl: function(url) {
        console.log("This should get printed to the console...");
        Player.YTPlayer.loadVideoByUrl(url);
        Player.play();
    },
    loadVideo: function() {
        Player.clearPlayer();
        Player.YTPlayer = new YT.Player('player', {
            events: {
                'onReady': Player.onReady,
                'onStateChange': Player.onStateChange
            }
        });
    },
    clearPlayer: function() {
        if (Player.YTPlayer !== undefined && Player.YTPlayer !== null) {
            Player.pause();
            Player.YTPlayer.stopVideo();
            Player.YTPlayer.clearVideo();
            Player.YTPlayer.destroy();
        }
        Player.GUI.gui.style.display = "none";
        Player.GUI.preloader.style.display = "block";
        //Remove Event Listener
        Player.GUI.controls.play.removeEventListener("click", Player.changeVideoState);
        //Create new player element
        let body = document.getElementsByTagName("body")[0];
        let tmp = document.getElementById("player");
        if (tmp !== undefined && tmp !== null) {
            body.removeChild(document.getElementById("player"));
        }
        let iframe = document.createElement("iframe");
        iframe.id = "player";
        iframe.width = "1";
        iframe.height = "1";
        //TODO: Get the url from the box and filter out the list parameter
        let playlistId = getParameterByName("list", Player.GUI.searchField.value);
        iframe.src = 'https://www.youtube.com/embed/videoseries?list=' + playlistId + '&enablejsapi=1';
        body.appendChild(iframe);
        //var player '<iframe id="player" width="560" height="315" src="https://www.youtube.com/embed/videoseries?list=FLxoPKKKHEIIH-1wB1XFcypw&enablejsapi=1" ></iframe>';
        //Clear intervals and the YT.Player object
        clearInterval(Player.updateTimeInterval);
        clearInterval(Player.updateMetaInterval);
        Player.YTPlayer = undefined;
    }
};