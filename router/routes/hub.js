module.exports = function (app) {

	var http = require('http').createServer(app);
	var io = require('socket.io').listen(http);

	http.listen(app.get('port'));

	var User = require('../../models/user');
	var Jukebox = require('../../models/jukebox');

	var connectedSockets = [];
	 
	io.on('connection', function (socket) {
		console.log('a user connected');

		if (connectedSockets.indexOf(socket) == -1 && req.isAuthenticated()) {
			connectedSockets.push(socket);
		}

		socket.on('joinJukebox', function(jukeboxId) {
			socket.jukeboxId = jukeboxId;
			socket.join(jukeboxId);
				
			console.log('connected to ' + jukeboxId);

			// TODO: Add user to the listeners collection in the jukebox
			var connectedUsersList = connectedSockets.map(function (item) {
				return {
					id: item.id,
					jukeboxId: item.jukeboxId
				}
			});
		});

		socket.on('addSongToQueue', function(song) {
			Jukebox.findOne({ _id: socket.jukeboxId }, function (err, jukebox) {
				if (err) {
					throw err;
				}

				if (!jukebox) {
					req.flash('error_msg', 'Unable to find the jukebox.');
					res.redirect('/jukebox');
				}

				var songInfo = new SongInfo();
				songInfo.value = song.value;
				songInfo.label = song.label;
				songInfo.description = song.description;
				songInfo.thumbnail = song.thumbnail;
				songInfo.duration = song.duration;
				songInfo.createdOn = Date.now();
				songInfo.parentJukebox = socket.jukeboxId;
				// songInfo.createdBy = req.user.id;

				songInfo.save(function (err, res) {
					if (err) {
						throw err;
					}

					jukebox.songQueue.push(songInfo.id);
					jukebox.save(function (err, res) {
						if (err) {
							throw err;
						}

						socket.to(socket.jukeboxId).broadcast.emit('addSongToQueue', song);
					});
				});
			});
  		});
		
		// Load the jukebox song queue
		socket.on('askForSongQueue', function(err, callback) {
			Jukebox.findOne({ _id: socket.jukeboxId }, function(err, jukebox) {
				if (err) {
					throw err;
				}

				if (!jukebox) {
					req.flash('error_msg', 'Unable to find the jukebox.');
					res.redirect('/jukebox');
				}

				if (jukebox.songQueue && jukebox.songQueue.length > 0) {
					callback(jukebox.songQueue);
				} else {
					callback(null);
				}
			});
		});
	});
}