
  var tag = document.createElement('script');

  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  // 3. This function creates an <iframe> (and YouTube player)
  //    after the API code downloads.
  var player;
  function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
      height: '200',
      width: '200',
      events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange
      },
      playerVars: {
        controls: 0
      }
    });
  }

  // 4. The API will call this function when the video player is ready.
  function onPlayerReady(event) {
    // event.target.playVideo();
    // player.loadVideoById('QohH89Eu5iM', 1);
    // player.cueVideoById('aYhOEaql5t4', 1);
    
  }

  // 5. The API calls this function when the player's state changes.
  //    The function indicates that when playing a video (state=1),
  //    the player should play for six seconds and then stop.
  var done = false;

  function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.ENDED) {
      // Play queued video
      loadVideo(false);
    }
  }

  function stopVideo() {
    player.stopVideo();
  }

  function pauseVideo() {
    player.pauseVideo();
  }

  function playVideo() {
    if(player.getVideoUrl().indexOf('?') == -1) {
        loadVideo(true);
    } else {
      player.playVideo();
    }
  }

  function loadVideo(isFirstLoad) {
    // Set it if not exists
    //use index to get hidden input of next song
    var soungCount = $('#songQueue > .songDetailItemRow #videoId').length;

    if (soungCount > 0) {
      if (!isFirstLoad) {
        var lastPlayed = $('#songQueue > .songDetailItemRow')[0];
        $('#songHistory #emptyListRow').remove();
        $('#songHistory').append(lastPlayed);
        $('#songQueue > .songDetailItemRow').splice(0, 1);

        // broadcast from server (move song to history)
        // if the client isn't playing music then update it
      }

      var hiddenInput = $('#songQueue > .songDetailItemRow #videoId')[0].value;
      player.loadVideoById(hiddenInput, 1);
      // set current playing song for jukebox server side
    }    
  }

$(document).ready(function () {

    $('#stop').on('click', function(e) {
      e.preventDefault();
      stopVideo();
    });

    $('#play').on('click', function(e) {
      e.preventDefault();
      playVideo();
    });

    $('#pause').on('click', function(e) {
      e.preventDefault();
      pauseVideo();
    });

    $('#load').on('click', function(e) {
      e.preventDefault();
      loadVideo(false);
    });
  });