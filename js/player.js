/**
 * Player Object
 */
const Player = {

    YTPlayer: undefined,
    updateTimeInterval: undefined,
    updateMetaInterval: undefined,
    activeKeys : {},

    GUI: {
        title: document.getElementById("title"),
        time: document.getElementById("time"),
        duration: document.getElementById("duration"),
        controls: {
            play: document.getElementById("play"),
            prev: document.getElementById("prev"),
            next: document.getElementById("next"),
        },
        searchField: document.getElementById("search")
    },

    /**
     * Gets fired when the YT Player is Loaded
     */
    onReady: function(event) {

        Player.YTPlayer.setShuffle(true);
        //if(isPlaylist){}
        Player.GUI.controls.prev.addEventListener('click', Player.playPrevious);
        Player.GUI.controls.next.addEventListener('click', Player.playNext);

        //Add Keyboard Shortcuts
        window.addEventListener("keydown", Player.keydown, false);
        window.addEventListener("keyup", Player.keyup, false);
        
        Player.updateTimeInterval = setInterval(Player.updateTime, 500);
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
        console.log("Keydown Event called");

        if(Player.activeKeys[e.keyCode] == null) {
           switch(e.keyCode) {
            case 37:
                Player.playPrevious();
                break;
            case 39:
                Player.playNext();
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
            clearInterval(Player.update);
            Player.pause();
        } else {
            Player.update = setInterval(Player.updateTime, 1000);
            Player.play();
        }
    },

    displayMeta: function() {
        Player.GUI.title.innerText = Player.YTPlayer.getVideoData().title;

        //Display time
        let duration = Player.formatTime(Player.YTPlayer.getDuration());
        Player.GUI.duration.innerText = duration;
        Player.GUI.time.innerText = "00:00";

        //Add event listeners for the GUI
        Player.GUI.controls.play.addEventListener("click", Player.changeVideoState);

        //Initialise updateTime function
       // Player.update = setInterval(Player.updateTime, 1000);
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
        console.log("Updating Time");
        let currentTime = Player.formatTime(Player.YTPlayer.getCurrentTime());
        Player.GUI.time.innerText = currentTime;
    },

    /**
     * Start/continue playback of video
     */
    play: function() {
        $("#play .icon").removeClass("fa-play");
        $("#play .icon").addClass("fa-pause");
        Player.YTPlayer.playVideo();
    },

    /**
     * Pause the playback of the video
     */
    pause: function() {
        $("#play .icon").removeClass("fa-pause");
        $("#play .icon").addClass("fa-play");
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
            //height: 1,
            //width: 1,
           // videoId: "dQw4w9WgXcQ",
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

        //Clear intervals and the YT.Player object
        clearInterval(Player.update);
        Player.update = undefined;
        Player.YTPlayer = undefined;
    }
};