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
    $( "#searchBox" ).val( ui.item.label );
      return false;
    },
  select: function( event, ui ) {
    $( "#searchBox" ).val( ui.item.label );
      // Add the song to the queue
      var htmlOutput = Handlebars.templates["songDetailItem"]( getSongHandlebarContext( ui.item ) );

      $('#emptyListRow').remove();
      $('#songQueue').append('<tr><td>' + htmlOutput + '</td></tr>')

      var href = location.href;
      var jukeboxId = href.substr(href.lastIndexOf('/') + 1);

      // emit songAddedToQueue socket event
      socket.emit('addSongToQueue', ui.item);
      // From the server, save it to db and broadcast to other clients

      return false;
    }
})
.autocomplete( "instance" )._renderItem = function( ul, item ) {
    var tempString = $( "<li>" )
      .append( Handlebars.templates["songDetailItem"]( getSongHandlebarContext( item ) ) )
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
        duration: item.duration
      };

      return handlebarContext;
}

socket.on('connect', function() {
  console.log('a user connected');
  var href = location.href;
  var jukeboxId = href.substr(href.lastIndexOf('/') + 1);

  socket.emit('joinJukebox', jukeboxId);

  socket.emit('askForSongQueue', null, function(songQueue) {
      if (songQueue && songQueue.length > 0) {
        $('#songQueue').empty();

        $.each(songQueue, function () {
          var htmlOutput = Handlebars.templates["songDetailItem"]( getSongHandlebarContext( this ) );

          $('#songQueue').append('<tr><td>' + htmlOutput + '</td></tr>')
        });
      }
    });
});

socket.on('addSongToQueue', function(song) {
  var htmlOutput = Handlebars.templates["songDetailItem"]( getSongHandlebarContext( song ) );

  $('#emptyListRow').remove();
  $('#songQueue').append('<tr><td>' + htmlOutput + '</td></tr>')
});
