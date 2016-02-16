// Insert the JS-API on the site
let tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
let firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);


/**
 * Player Object
 */
const Player = {

  YTPlayer: undefined,

  /**
   * Gets fired when the YT Player is Loaded
   */
  onReady: function(event) {
    console.log("Player is ready");
    let player = event.target;
    console.log("Starting video...");
    $("#meta-information").text(player.getVideoData().title);

    //Display time
    let duration = Player.formatTime(player.getDuration());
    $('#duration').text(duration);
    $("#time-elapsed").text("00:00");
    Player.play();

    //Add event listeners for the gui
    
    setInterval(Player.updateTime, 1000);
    $("#play").on("click", Player.changeVideoState);
  },

  /**
   * Gets called when
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
      Player.pause();
    } else {
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
    let time = Player.str_pad_left(minutes,'0',2)+':'+Player.str_pad_left(seconds,'0',2);
    return time;
  },

  /**
   * This function is used to update the time correctly
   * @return {[type]} [description]
   */
  updateTime: function() {
    console.log("Updating Time");
    let currentTime = Player.formatTime(Player.YTPlayer.getCurrentTime());
    $("#time-elapsed").text(currentTime);
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
    console.log("Loading Video");
    Player.YTPlayer = undefined;
    Player.YTPlayer = new YT.Player('player', {
      height: 1,
      width: 1,
      videoId: $("#searchField").val(),
      events: {
        'onReady': Player.onReady,
        'onStateChange': Player.onStateChange
      }
    });
  }
}



//Create the player object if API is ready
function onYouTubeIframeAPIReady() {
  console.log("API ready");

  $("#searchButton").on("click", Player.loadVideo);
}
