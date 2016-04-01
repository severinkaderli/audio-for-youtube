/**
 * Player Object
 */
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
     * Gets fired when the YTPlayer has finished loading
     */
    onReady: function() {

        Player.YTPlayer.unMute();
        Player.YTPlayer.setVolume(100);

        // The timeout is needed to set the shuffle correctly. This is a bug
        // in the YouTube iFrame-API.
        setTimeout(function() {
            Player.YTPlayer.setShuffle(true);
            Player.YTPlayer.setLoop(true);
        }, 2000);

        // Remove preloader
        // Using classes .hide/.show for this
        Player.GUI.preloader.style.display = "none";
        Player.GUI.gui.style.display = "block";

        // Add event listeners for the GUI
        Player.GUI.controls.play.addEventListener("click", Player.changeVideoState);
        Player.GUI.controls.prev.addEventListener('click', Player.playPrevious);
        Player.GUI.controls.next.addEventListener('click', Player.playNext);
        Player.GUI.controls.volumeSlider.addEventListener('input', Player.updateVolume);

        // Add keyboard listener
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
            const videoId = Player.getParameterByName("v", Player.YTPlayer.getVideoUrl());
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
    
    loadVideo: function() {
        Player.clearPlayer();
        Player.YTPlayer = new YT.Player('player', {
            events: {
                'onReady': Player.onReady,
                'onStateChange': Player.onStateChange
            }
        });
    },
    /**
     * Clears the player, removes the YTPlayer object and clear
     * intervals.
     * 
     * @return {void}
     */
    clearPlayer: function() {
        // Clearing intervals
        clearInterval(Player.updateTimeInterval);
        clearInterval(Player.updateMetaInterval);

        // Removing event listener
        Player.GUI.controls.play.removeEventListener("click", Player.changeVideoState);
        Player.GUI.controls.prev.removeEventListener('click', Player.playPrevious);
        Player.GUI.controls.next.removeEventListener('click', Player.playNext);
        Player.GUI.controls.volumeSlider.removeEventListener('input', Player.updateVolume);

        // If a YTPlayer exists stop the video and destroy the player.
        if (Player.YTPlayer !== undefined && Player.YTPlayer !== null) {
            Player.pause();
            Player.YTPlayer.stopVideo().clearVideo().destroy();
            Player.YTPlayer = undefined;
        }

        // Hide the gui and show the preloader.
        // TODO: Using classes for this .hide/.show
        Player.GUI.gui.style.display = "none";
        Player.GUI.preloader.style.display = "block";

        // Resetting the progress bar
        document.getElementById("trackbar").style.width = 0;

        

        // Removing keyboard listener
        window.addEventListener("keydown", Player.keydown, false);
        window.addEventListener("keyup", Player.keyup, false);

        

        // Create new player element
        let body = document.getElementsByTagName("body")[0];
        let tmp = document.getElementById("player");
        if (tmp !== undefined && tmp !== null) {
            body.removeChild(document.getElementById("player"));
        }
        const iframe = document.createElement("iframe");
        iframe.id = "player";
        iframe.width = "1";
        iframe.height = "1";
        let playlistId = Player.getParameterByName("list", Player.GUI.searchField.value);
        //Check if playlist id is valid
        if(playlistId == null) {
            console.log("Bad id");
        }
        iframe.src = 'https://www.youtube.com/embed/videoseries?list=' + playlistId + '&enablejsapi=1';
        body.appendChild(iframe);  
    },
    /**
     * Pad a string to the wanted size.
     * @param  {[type]} string [description]
     * @param  {[type]} pad    [description]
     * @param  {[type]} length [description]
     * @return {[type]}        [description]
     */
    str_pad_left: function(string, pad, length) {
        return (new Array(length + 1).join(pad) + string).slice(-length);
    },
    /**
     * Formats the seconds in the style mm:ss
     * @param {number} seconds
     * @return {string} The formatted time as string
     */
    formatTime: function(seconds) {
        seconds = Math.floor(seconds);
        let minutes = Math.floor(seconds / 60);
        seconds = seconds - minutes * 60;
        return Player.str_pad_left(minutes, "0", 2) + ':' + Player.str_pad_left(seconds, "0", 2);
    },
    /**
     * Gets the value of a specific parameter from an url.
     * 
     * @param  {string} name
     * @param  {string} url  
     * @return {string} The value of the parameter.      
     */
    getParameterByName: function(name, url = window.location.href) {
        name = name.replace(/[\[\]]/g, "\\$&");
        const results = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)").exec(url);
        if (!results || !results[2]) {
            return null;
        }
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }
};