// Insert the JS-API on the site
let tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
let firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

/**
 * Player Object
 */
class Player {
  /**
   * Creates the yt player
   */
  construct(id) {
    this.player = new YT.Player('player', {
      height: '1',
      width: '1',
      events: {
        'onReady': this.onReady,
        'onStateChange': this.onStateChange
      }
    });
  }

  /**
   * Gets fired when the YT Player is Loaded
   */
  onReady(event) {
    $("#meta-information").text(this.player.getVideoData());

    //Display time
    let duration = this.formatTime(this.player.getDuration());
    $('#duration').text(duration);
    $("#time-elapsed").text("00:00");
    this.play();

    //Add event listeners for the gui
    $("#play").on("click", changeVideoState);
    setInterval(this.updateTime(), 1000);
  }

  /**
   * Gets called when
   */
  onStateChange(event) {
    console.log("State changed");
    if (event.data == YT.PlayerState.PLAYING) {

    }
  }

  /**
   * Switches between playing and pausing
   */
  changeVideoState() {
    if(this.player.getPlayerState() == YT.PlayerState.PLAYING) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Formats the seconds in the style mm:ss
   * @param {number} seconds
   * @return {string} The formatted time as string
   */
  formatTime(seconds) {
    let minutes = Math.floor(seconds / 60);
    seconds = seconds - minutes * 60;
    let time = str_pad_left(minutes,'0',2)+':'+str_pad_left(seconds,'0',2);
    return time;
  }

  /**
   * This function is used to update the time correctly
   * @return {[type]} [description]
   */
  updateTime() {
    let currentTime = this.formatTime(player.getCurrentTime());
    $("#time-elapsed").text(currentTime);
  }

  /**
   * Start/continue playback of video
   */
  play() {
    $("#play .icon").removeClass("fa-play");
    $("#play .icon").addClass("fa-pause");
    this.player.playVideo();
  }

  /**
   * Pause the playback of the video
   */
  pause() {
    $("#play .icon").removeClass("fa-pause");
    $("#play .icon").addClass("fa-play");
    this.player.pauseVideo();
  }

  loadId(id) {
    this.player.loadVideoByid(id);
  }

  /**
   * Used the pad the time correctly
   */
  str_pad_left(string,pad,length) {
    return (new Array(length+1).join(pad)+string).slice(-length);
  }
}



//Create the player object if API is ready
function onYouTubeIframeAPIReady() {
  console.log("API ready");
  let the_player = new Player('player');
  the_player.loadId("bHQqvYy5KYo");
}
