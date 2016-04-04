/**
 * Player Object
 */
const Player = {
    YTPlayer: undefined,
    updateTimeInterval: undefined,
    updateMetaInterval: undefined,
    videoHasEnded: false,
    activeKeys: {},
    elements: {
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
        preloader: document.getElementById("preloader"),
        error: document.getElementById("error")
    },
    /**
     * Creates a new YTPlayer object.
     * 
     * @return {void}
     */
    loadPlayer: function() {
        if(Player.clearPlayer()) {
            Player.YTPlayer = new YT.Player('player', {
                events: {
                    'onReady': Player.onReady,
                    'onError': Player.onError,
                    'onStateChange': Player.onStateChange
                }
            }); 
        }
       
    },
    /**
     * Clears the player, removes the YTPlayer object and clear
     * intervals.
     * 
     * @return {boolean} - False on error, true otherwise.
     */
    clearPlayer: function() {
        // Clearing intervals
        clearInterval(Player.updateTimeInterval);
        clearInterval(Player.updateMetaInterval);

        // Removing event listener
        Player.elements.controls.play.removeEventListener("click", Player.changeVideoState);
        Player.elements.controls.prev.removeEventListener('click', Player.playPrevious);
        Player.elements.controls.next.removeEventListener('click', Player.playNext);
        Player.elements.controls.volumeSlider.removeEventListener('input', Player.updateVolume);

        // If a YTPlayer exists stop the video and destroy the player.
        if (Player.YTPlayer !== undefined && Player.YTPlayer !== null) {
            Player.pause();
            Player.YTPlayer.stopVideo().clearVideo().destroy();
            Player.YTPlayer = undefined;
        }

        // Hide the gui and show the preloader.
        // TODO: Using classes for this .hide/.show
        Player.hideGUI();
        Player.hideError();
        Player.showPreloader();

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
        let playlistId = Player.getParameterByName("list", Player.elements.searchField.value);
        //Check if playlist id is valid
        if(playlistId == null) {
            Player.showError("Please enter a correct playlist URL.");
            return false;
        }
        iframe.src = 'https://www.youtube.com/embed/videoseries?list=' + playlistId + '&autoplay=1&enablejsapi=1';
        body.appendChild(iframe);
        return true; 
    },
    /**
     * Gets fired when the YTPlayer has finished loading
     *
     * @return {void}
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
        Player.hidePreloader();
        Player.showGUI();

        // Add event listeners for the GUI
        Player.elements.controls.play.addEventListener("click", Player.changeVideoState);
        Player.elements.controls.prev.addEventListener('click', Player.playPrevious);
        Player.elements.controls.next.addEventListener('click', Player.playNext);
        Player.elements.controls.volumeSlider.addEventListener('input', Player.updateVolume);

        // Add keyboard listener
        window.addEventListener("keydown", Player.keydown, false);
        window.addEventListener("keyup", Player.keyup, false);

        // Creating intervals
        Player.updateTimeInterval = setInterval(Player.updateTime, 500);
        Player.updateMetaInterval = setInterval(Player.displayMeta, 500);

        // Don't autoplay the music on mobile devices, because it's blocked
        if(!isMobile.any) {
            Player.play(); 
        }
    },
    /**
     * Gets fired when an error occurs.
     * @param  {object} event - The event object
     * @return {void}
     */
    onError: function(event) {
        const errorCode = event.data;

        switch(errorCode) {
            case 150:
                Player.showError("This playlist is private or doesn't exist.");
        }
        console.error("Errorcode: " + errorCode);
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
            const notification = new Notification(Player.YTPlayer.getVideoData().title, {
                icon: "https://i1.ytimg.com/vi/" + videoId + "/hqdefault.jpg"
            });
            setTimeout(function() {
                notification.close()
            }, 5000);
            Player.videoHasEnded = false;
        }
        
    },
    showGUI: function() {
        Player.elements.gui.classList.remove("hide");
    },
    hideGUI: function() {
        Player.elements.gui.classList.add("hide");
    },
    showPreloader: function() {
        Player.elements.preloader.classList.remove("hide");
    },
    hidePreloader: function() {
        Player.elements.preloader.classList.add("hide");
    },
    keydown: function(event) {
        if (Player.activeKeys[event.keyCode] == null) {
            switch (event.keyCode) {
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
            Player.activeKeys[event.keyCode] = true;
        }
    },
    keyup: function(event) {
        Player.activeKeys[event.keyCode] = null;
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
        Player.elements.title.innerText = title;
        document.getElementsByTagName('title')[0].innerText = title;
        
    },

    updateVolume: function(event) {
        Player.YTPlayer.setVolume(event.target.value);
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
     * Display a error message.
     * 
     * @param  {string} message - The error message that should be displayed.
     * @return {void}
     */
    showError: function(message) {
        Player.hideGUI();
        Player.hidePreloader();
        Player.elements.error.innerHTML = "Error: " + message;
        Player.elements.error.classList.add("show");
    },
    /**
     * Hide the current error message.
     * @return {void}
     */
    hideError: function() {
        Player.elements.error.classList.remove("show");
        Player.elements.error.innerHTML = "";
    },
    
    /**
     * This function is used to update the time correctly
     * @return {[type]} [description]
     */
    updateTime: function() {
        let currentTime = Player.YTPlayer.getCurrentTime();
        Player.elements.time.innerText = Player.formatTime(currentTime);
        let duration = Player.YTPlayer.getDuration();
        Player.elements.duration.innerText = Player.formatTime(duration);
        let progress = currentTime / duration;
        document.getElementById("trackbar").style.width = progress * 100 + "%";
    },
    /**
     * Start/continue playback of video
     */
    play: function() {
        Player.elements.controls.play.innerText = "pause_circle_filled";
        Player.YTPlayer.playVideo();
    },
    /**
     * Pause the playback of the video
     */
    pause: function() {
        Player.elements.controls.play.innerText = "play_circle_filled";
        Player.YTPlayer.pauseVideo();
    },
    loadVideoById: function(id) {
        Player.YTPlayer.loadVideoByid(id);
    },
    /**
     * Pad a string to the wanted size.
     * @param  {string} string
     * @param  {string} pad
     * @param  {number} length
     * @return {string}
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