/**
 * Player Object
 */
const Player = {
    /**
     * Instance of the YTPlayer object.
     * 
     * @type {object}
     */
    YTPlayer: undefined,
    /**
     * Function for updating the time.
     * 
     * @type {function}
     */
    updateTimeInterval: undefined,
    /**
     * Function for updating the meta-informationen in the GUI.
     * 
     * @type {function}
     */
    updateMetaInterval: undefined,
    /**
     * Set to true if a video has ended.
     * 
     * @type {boolean}
     */
    videoHasEnded: false,
    /**
     * Keeps track of currently active keys.
     * 
     * @type {object}
     */
    activeKeys: {},
    /**
     * The last set volume. This is used for unmuting.
     * 
     * @type {Number}
     */
    lastVolume: 100,
    /**
     * DOM-Elements for the GUI.
     * 
     * @type {object}
     */
    elements: {
        gui: document.getElementById("gui"),
        title: document.getElementById("title"),
        siteTitle: document.getElementsByTagName('title')[0],
        time: document.getElementById("currentTime"),
        duration: document.getElementById("duration"),
        progress: document.getElementById("progress"),
        controls: {
            play: document.getElementById("play"),
            prev: document.getElementById("prev"),
            next: document.getElementById("next"),
            volumeBtn: document.getElementById("volume-btn"),
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
     * Clears intervals, removes event-listener, and clears the YTPlayer
     * object.
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
        Player.elements.controls.volumeBtn.removeEventListener('click', Player.changeMuteState);
        Player.elements.controls.volumeSlider.removeEventListener('input', Player.updateVolume);

        // Removing keyboard listener
        window.addEventListener("keydown", Player.keydown, false);
        window.addEventListener("keyup", Player.keyup, false);

        // If a YTPlayer exists stop the video and destroy the player.
        if (Player.YTPlayer !== undefined && Player.YTPlayer !== null) {
            Player.pause();
            Player.YTPlayer.stopVideo().clearVideo().destroy();
            Player.YTPlayer = undefined;
        }

        // Hide the gui and show the preloader.
        Player.hideGUI();
        Player.hideError();
        Player.showPreloader();

        // Remove old player object if one exist.
        const body = document.getElementsByTagName("body")[0];
        let oldPlayer = document.getElementById("player");
        if (oldPlayer !== undefined && oldPlayer !== null) {
            body.removeChild(oldPlayer);
        }

        // Create new iframe-element.
        const iframe = document.createElement("iframe");
        iframe.id = "player";
        
        // Check if playlist id is valid
        const playlistId = Player.getParameterByName("list", Player.elements.searchField.value);
        if(playlistId == null) {
            Player.showError("Please enter a correct playlist URL.");
            return false;
        }

        // Add the iframe to the DOM.
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

        // In case the user muted his YouTube-Player we unmute it and turn
        // the volume up.
        Player.unMute();
        Player.setVolume(100);

        // The timeout is needed to set the shuffle correctly. This is a bug
        // in the YouTube iFrame-API.
        setTimeout(function() {
            Player.YTPlayer.setShuffle(true);
            Player.YTPlayer.setLoop(true);
        }, 2000);

        // Remove preloader and show the GUI.
        Player.hidePreloader();
        Player.showGUI();

        // Add event listeners for the GUI
        Player.elements.controls.play.addEventListener("click", Player.changeVideoState);
        Player.elements.controls.prev.addEventListener('click', Player.playPrevious);
        Player.elements.controls.next.addEventListener('click', Player.playNext);
        Player.elements.controls.volumeBtn.addEventListener('click', Player.changeMuteState);
        Player.elements.controls.volumeSlider.addEventListener('input', Player.updateVolume);

        // Add keyboard listener
        window.addEventListener("keydown", Player.keydown, false);
        window.addEventListener("keyup", Player.keyup, false);

        // Creating intervals
        Player.updateTimeInterval = setInterval(Player.updateTime, 500);
        Player.updateMetaInterval = setInterval(Player.updateMeta, 500);

        // We try to automatically start the video. If it doesn't work we
        // stop it again. This is to prevent GUI problems on most mobile
        // browsers.
        Player.play(); 
        if(Player.YTPlayer.getPlayerState() != YT.PlayerState.PLAYING) {
            Player.pause();
        }
    },
    /**
     * Gets fired when an error occurs.
     * 
     * @param  {object} event - The event object
     * @return {void}
     */
    onError: function(event) {
        const errorCode = event.data;

        switch(errorCode) {
            case 150:
                Player.showError("This playlist is private or doesn't exist.");
        }
        console.error("The YouTube Player returned an Error-Code: " + errorCode);
    },
    /**
     * Gets called when the state of the player gets changed.
     * 
     * @param  {object} event - The event object
     * @return {void}
     */
    onStateChange: function(event) {
        const state = event.target.getPlayerState();

        // Set videoHasEnded to true if a video has finished playing.
        if(state == YT.PlayerState.ENDED) {
            Player.videoHasEnded = true;
        }

        // If a video has ended and a new one starts playing, display a
        // notification.
        if(Player.videoHasEnded && (state == YT.PlayerState.PLAYING)) {
            // TODO: Only show notifications if the setting is set.
            // Fetch the video thumbnail and display the notification
            const videoId = Player.getParameterByName("v", Player.YTPlayer.getVideoUrl());
            const notification = new Notification(Player.YTPlayer.getVideoData().title, {
                icon: "https://i1.ytimg.com/vi/" + videoId + "/hqdefault.jpg"
            });

            // Close the notification automatically after 5 seconds
            setTimeout(function() {
                notification.close()
            }, 5000);

            Player.videoHasEnded = false;
        }   
    },
    /**
     * Display the preloader.
     * 
     * @return {void}
     */
    showPreloader: function() {
        Player.elements.preloader.classList.remove("hide");
    },
    /**
     * Hide the preloader.
     * 
     * @return {void}
     */
    hidePreloader: function() {
        Player.elements.preloader.classList.add("hide");
    },
    /**
     * Display the GUI.
     * 
     * @return {void}
     */
    showGUI: function() {
        Player.elements.gui.classList.remove("hide");
    },
    /**
     * Hide the GUI.
     * 
     * @return {void}
     */
    hideGUI: function() {
        Player.elements.gui.classList.add("hide");
    },
    /**
     * Display an error message.
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
     * 
     * @return {void}
     */
    hideError: function() {
        Player.elements.error.classList.remove("show");
        Player.elements.error.innerHTML = "";
    },
    /**
     * This function is used to update the time and the progress bar
     * correctly.
     * 
     * @return {void}
     */
    updateTime: function() {
        // Update the current time
        const currentTime = Player.YTPlayer.getCurrentTime();
        Player.elements.time.innerText = Player.formatTime(currentTime);

        //Update the duration
        const duration = Player.YTPlayer.getDuration();
        Player.elements.duration.innerText = Player.formatTime(duration);

        //Update the progressbar
        const progress = currentTime / duration;
        Player.elements.progress.value = progress * 1000;
    },
    /**
     * Update the meta-information of videos.
     * 
     * @return {void}
     */
    updateMeta: function() {
        // Update the GUI title and the site title with the name of the
        // video.
        const title = Player.YTPlayer.getVideoData().title;
        Player.elements.title.innerText = title;
        Player.elements.siteTitle.innerText = title;
    },
    /**
     * Gets called on the keydown event.
     * 
     * @param  {object} event - The event object
     * @return {void}
     */
    keydown: function(event) {
        // Only execute the key command when to key is not active. This is
        // used to prevent spamming of keys.
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
                case 77:
                    Player.changeMuteState();
                    break;
            }
            Player.activeKeys[event.keyCode] = true;
        }
    },
    /**
     * Gets called on the keyup event.
     * 
     * @param  {object} event - The event object
     * @return {void}
     */
    keyup: function(event) {
        // Remove the key from the active keys object.
        Player.activeKeys[event.keyCode] = null;
    },
    /**
     * Pause/Play the video depending on its state.
     * 
     * @return {void}
     */
    changeVideoState: function() {
        if (Player.YTPlayer.getPlayerState() == YT.PlayerState.PLAYING) {
            clearInterval(Player.updateTimeInterval);
            clearInterval(Player.updateMetaInterval);
            Player.pause();
        } else {
            Player.updateTimeInterval = setInterval(Player.updateTime, 500);
            Player.updateMetaInterval = setInterval(Player.updateMeta, 500);
            Player.play();
        }
    },
    /**
     * Starts the previous video of the playlist.
     * 
     * @return {void}
     */
    playPrevious: function() {
        Player.YTPlayer.previousVideo();
        Player.play();
    },
    /**
     * Starts the next video of the playlist.
     * 
     * @return {void}
     */
    playNext: function() {
        Player.YTPlayer.nextVideo();
        Player.play();
    },

    /**
     * Gets called when the volume is updated.
     * 
     * @param  {object} event - The event object.
     * @return {void}
     */
    updateVolume: function(event) {
        // Keep track of the last volume
        Player.lastVolume = event.target.value;
        Player.unMute(false);
        Player.setVolume(event.target.value);
    },
    /**
     * Sets the volume of the player
     *
     * @param {number} volume - The new volume value.
     * @return {void}
     */
    setVolume: function(volume) {
        Player.YTPlayer.setVolume(volume);
        Player.elements.controls.volumeSlider.value = volume;
    },
    /**
     * Switch between mute and unmute.
     * 
     * @param  {object} event - The event object.
     * @return {void}
     */
    changeMuteState: function(event) {
        if(Player.YTPlayer.isMuted()) {
            Player.unMute();
        } else {
            Player.mute();
        }
    },
    /**
     * Mutes the player.
     *
     * @param {boolean} setVolume - Sets the volume to 0 if true.
     * @return {void}
     */
    mute: function(setVolume = true) {
        Player.elements.controls.volumeBtn.innerText = "volume_mute";
        Player.YTPlayer.mute();
        if(setVolume) {
            Player.setVolume(0);  
        }  
    },
    /**
     * Unmutes the player
     *
     * @param {boolean} setVolume - Sets the volume to the last value if true.
     * @return {void}
     */
    unMute: function(setVolume = true) {
        Player.elements.controls.volumeBtn.innerText = "volume_up";
        Player.YTPlayer.unMute();
        if(setVolume) {
           Player.setVolume(Player.lastVolume); 
        }   
    },
    /**
     * Play the video.
     * 
     * @return {void}
     */
    play: function() {
        Player.elements.controls.play.innerText = "pause_circle_filled";
        Player.YTPlayer.playVideo();
    },
    /**
     * Pause the video.
     * 
     * @return {void}
     */
    pause: function() {
        Player.elements.controls.play.innerText = "play_circle_filled";
        Player.YTPlayer.pauseVideo();
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

/**
 * Gets called when the iFrame-Api is ready.
 * 
 * @return {void}
 */
function onYouTubeIframeAPIReady() {
    document.getElementById("search-form").addEventListener("submit", function(event) {
        event.preventDefault();
        Player.loadPlayer();
        return false;
    });
}

// Request permission for notifications.
Notification.requestPermission();