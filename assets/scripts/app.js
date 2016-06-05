var socket = io();

$( "#searchBox" ).autocomplete({
  source: function (request, response) {
        $.ajax({
                type: "POST",
                url: "/jukebox/song/search",
                dataType: "json",
                data: {
                    term: request.term
                },
                error: function(xhr, textStatus, errorThrown) {
                    alert('Error: ' + xhr.responseText);
                    },
                success: function(data) {
                    response(data);
                }
              });
      },
  minLength: 3,
  appendTo: ".autocomplete-list-items",
  focus: function( event, ui ) {
    $( "#searchBox" ).val('');
      return false;
    },
  select: function( event, ui ) {
      // Add the song to the queue
      var htmlOutput = Handlebars.templates["songDetailItem"]( getSongHandlebarContext( ui.item ) );

      $('#songQueue #emptyListRow').remove();
      $('#songQueue').append('<div class="songDetailItemRow">' + htmlOutput + '</div>');

      var href = location.href;
      var jukeboxId = href.substr(href.lastIndexOf('/') + 1);

      // emit songAddedToQueue socket event
      socket.emit('addSongToQueue', ui.item);
      // From the server, save it to db and broadcast to other clients
      $( "#searchBox" ).focus();
      return false;
    }
})
.autocomplete( "instance" )._renderItem = function( ul, item ) {
    var tempString = $( "<li>" )
      .append( Handlebars.templates["songSearchResultItem"]( getSongHandlebarContext( item ) ) )
      .appendTo( ul );

    return tempString;
};

$( "#searchBox" ).addClass('f-dropdown');

var getSongHandlebarContext = function (item) {
    var handlebarContext = {
        value: item.value,
        thumbnail: item.thumbnail,
        label: item.label,
        description: item.description,
        duration: item.duration,
        addedBy: item.addedBy
      };

      return handlebarContext;
}

socket.on('connect', function() {
  var href = location.href;
  var jukeboxId = href.substr(href.lastIndexOf('/') + 1);
  var userId = '';
  socket.emit('joinJukebox', jukeboxId, userId);

  socket.emit('askForSongQueue', null, function(songQueue) {
      if (songQueue && songQueue.length > 0) {
        $('#songQueue').empty();

        $.each(songQueue, function () {
          var htmlOutput = Handlebars.templates["songDetailItem"]( getSongHandlebarContext( this ) );
          $('#songQueue').append('<div class="songDetailItemRow">' + htmlOutput + '</div>');
        });

        // get current song playing
        // if there is one
        // move all previous items to songHistory
      }
    });
});

socket.on('addSongToQueue', function(song) {
  var htmlOutput = Handlebars.templates["songDetailItem"]( getSongHandlebarContext( song ) );

  $('#emptyListRow').remove();
  $('#songQueue').append('<tr  class="songDetailItemRow"><td>' + htmlOutput + '</td></tr>');
});

$('.songTabButton').on('click', function (e) {
  e.preventDefault();
  $('.songTabButton').toggleClass('hollow');
  $('.songList').toggleClass('hide');
});
