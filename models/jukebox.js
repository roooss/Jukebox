var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

var JukeboxSchema = mongoose.Schema({
	name: {
		type: String
	},
	description: {
		type: String
	},
	password: {
		type: String
	},
	isPublic: {
		type: Boolean,
		default: true
	},
	isAvailable: {
		type: Boolean,
		default: true
	},
	queueLevel: {
		type: Number,
		default: 0
	},
	createdOn: {
		type: Date
	},
	createdBy: {
		type: mongoose.Schema.ObjectId,
		ref: 'User'
	},
	songQueue: [{
		type: mongoose.Schema.ObjectId,
		ref: 'SongInfo'
	}]
});

var Jukebox = module.exports = mongoose.model('Jukebox', JukeboxSchema);

module.exports.createJukebox = function (newJukebox, callback) {
	if (newJukebox.password.length > 0) {
		bcrypt.genSalt(10, function (err, salt) {
			bcrypt.hash(newJukebox.password, salt, function (err, hash) {
				newJukebox.password = hash;
				newJukebox.save(callback);
			});
		});
	} else {
		newJukebox.save(callback);
	}
}



module.exports.comparePassword = function(candidatePassword, hash, callback) {
	bcrypt.compare(candidatePassword, hash, function (err, isMatch) {
		if (err) {
			throw err;
		}

		callback(null, isMatch);
	});
}