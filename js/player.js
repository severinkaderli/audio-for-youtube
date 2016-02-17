/**
 * Player Object
 */
const Player = {

    YTPlayer: undefined,
    update: undefined,

    GUI: {
        title: document.getElementById("title"),
        time: document.getElementById("time"),
        duration: document.getElementById("duration"),
        controls: {
            play: document.getElementById("play")
        },
        searchField: document.getElementById("search")
    },

    /**
     * Gets fired when the YT Player is Loaded
     */
    onReady: function(event) {
        console.log("PLAYER IS LOADED");
        let player = event.target;
        Player.GUI.title.innerText = player.getVideoData().title;

        //Display time
        let duration = Player.formatTime(player.getDuration());
        Player.GUI.duration.innerText = duration;
        Player.GUI.time.innerText = "00:00";

        //Add event listeners for the GUI
        Player.GUI.controls.play.addEventListener("click", Player.changeVideoState);

        //Initialise updateTime function
        Player.update = setInterval(Player.updateTime, 1000);

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

    loadVideo: function() {
        console.log("LOADING VIDEO");
        Player.clearPlayer();
        Player.YTPlayer = new YT.Player('player', {
            height: 1,
            width: 1,
            //videoId: Player.GUI.searchField.value,
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