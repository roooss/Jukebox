
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
      loadVideo();
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
        loadVideo();
    } else {
      player.playVideo();
    }
  }

  function loadVideo() {
    // Go get the cookie holding the index of next song
    var index = 0;

    if ($.cookie('songPlayingIndex')) {
      index = $.cookie('songPlayingIndex');
    }

    // Set it if not exists
    //use index to get hidden input of next song
    var soungCount = $('#songQueue > tr #videoId').length;

    if (index >= soungCount) {
      index = 0;
    }

    var hiddenInput = $('#songQueue > tr #videoId')[index].value;

    index++;
    $.cookie('songPlayingIndex', index);

    player.loadVideoById(hiddenInput, 1);
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
      loadVideo();
    });
  });