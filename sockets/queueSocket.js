var User = require('../models/user');
var Jukebox = require('../models/jukebox');
var SongInfo = require('../models/songInfo');

module.exports = function (io) {

	var connectedSockets = [];

	io.on('connection', function (socket) {
		if (connectedSockets.indexOf(socket) == -1) {
			connectedSockets.push(socket);
		}

		socket.on('joinJukebox', function(jukeboxId, userId) {
			socket.jukeboxId = jukeboxId;
			socket.join(jukeboxId);

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
			Jukebox.findOne({ _id: socket.jukeboxId })
	  			   .populate({ path: 'songQueue' })
	  			   .exec(function(err, jukebox) {
						if (err) {
							throw err;
						}

						if (!jukebox) {
							req.flash('error_msg', 'Unable to find the jukebox.');
							res.redirect('/jukebox');
						}

						if (jukebox.songQueue && jukebox.songQueue.length > 0) {
							var songList = jukebox.songQueue.map(function (item) {
								return {
									value: item.value,
									thumbnail: item.thumbnail,
	        						label: item.label,
	        						description: item.description,
	        						duration: item.duration
								}
							});

							callback(songList);
						} else {
							callback(null);
						}
					});
		});

		socket.on('disconnect', function() {
			var index = connectedSockets.indexOf(socket);

			connectedSockets.splice(index, 1);

			var connectedUsersList3 = connectedSockets.map(function (item) {
				return {
					id: item.id,
					jukeboxId: item.jukeboxId
				}
			});

			// socket.broadcast.emit('disconnectedUser', connectedUsersList3);
		});
	});
}