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
    activeKeys : {},

    GUI: {
        title: document.getElementById("title"),
        time: document.getElementById("currentTime"),
        duration: document.getElementById("duration"),
        controls: {
            play: document.getElementById("play"),
            prev: document.getElementById("prev"),
            next: document.getElementById("next"),
        },
        searchField: document.getElementById("searchField")
    },

    /**
     * Gets fired when the YT Player is Loaded
     */
    onReady: function(event) {

        Player.YTPlayer.setShuffle(true);
        Player.YTPlayer.unMute();
        Player.YTPlayer.setVolume(100);


        Player.GUI.controls.prev.addEventListener('click', Player.playPrevious);
        Player.GUI.controls.next.addEventListener('click', Player.playNext);

        //Add Keyboard Shortcuts
        window.addEventListener("keydown", Player.keydown, false);
        window.addEventListener("keyup", Player.keyup, false);
        
        Player.updateTimeInterval = setInterval(Player.updateTime, 500);
        console.log("Interval created");
        Player.updateMetaInterval = setInterval(Player.displayMeta, 1000);

        //Start the video
        Player.play();
    },

    /**
     * Gets called when the state of the player gets changed
     */
    onStateChange: function(event) {
        const player = event.target;
        console.log("State changed to: ", player.getPlayerState());
    },

    keydown: function(e) {
        console.log("Keydown Event called:", e.keyCode);

        if(Player.activeKeys[e.keyCode] == null) {
           switch(e.keyCode) {
            case 37:
                Player.playPrevious();
                break;
            case 39:
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
        if(Player.YTPlayer.getPlayerState() == YT.PlayerState.PLAYING) {
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

    playNext: function() {
        Player.YTPlayer.nextVideo();
    },

    playPrevious: function() {
        Player.YTPlayer.previousVideo();
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
        console.log("Progress:", progress);
        document.getElementById("trackbar").style.width = progress*100 + "%";
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
    str_pad_left: function(string,pad,length) {
        return (new Array(length+1).join(pad)+string).slice(-length);
    },

    loadByUrl: function(url) {
        console.log("Load Video By Url: ", url);
        Player.YTPlayer.loadVideoByUrl(url);
        Player.play();
    },

    loadVideo: function() {
        console.log("LOADING VIDEO");
        Player.clearPlayer();
        Player.YTPlayer = new YT.Player('player', {
            events: {
                'onReady': Player.onReady,
                'onStateChange': Player.onStateChange
            }
        });

        console.log("object created");
    },

    clearPlayer: function() {
        console.log("CLEARING VIDEO");
        if(Player.YTPlayer !== undefined && Player.YTPlayer !== null) {
            Player.YTPlayer.stopVideo();
            Player.YTPlayer.clearVideo();
            Player.YTPlayer.destroy();
        }

        //Remove Event Listener
        Player.GUI.controls.play.removeEventListener("click", Player.changeVideoState);

        //Create new player element
        let body = document.getElementsByTagName("body")[0];
        let tmp = document.getElementById("player");
        if(tmp !== undefined && tmp !== null) {
            
            console.log(tmp);
            body.removeChild(document.getElementById("player"));
        }

        let iframe = document.createElement("iframe");
        iframe.id = "player";
        iframe.width = "1";
        iframe.height = "1";

        //TODO: Get the url from the box and filter out the list parameter
        let playlistId = getParameterByName("list", Player.GUI.searchField.value);
        console.log("Playlist URL:", playlistId);
        iframe.src = 'https://www.youtube.com/embed/videoseries?list=' + playlistId + '&enablejsapi=1';
        console.log(iframe);
        body.appendChild(iframe);
        //var player '<iframe id="player" width="560" height="315" src="https://www.youtube.com/embed/videoseries?list=FLxoPKKKHEIIH-1wB1XFcypw&enablejsapi=1" ></iframe>';
        


        //Clear intervals and the YT.Player object
        clearInterval(Player.updateTimeInterval);
        clearInterval(Player.updateMetaInterval);
        Player.YTPlayer = undefined;
    }
};