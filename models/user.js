var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

var UserSchema = mongoose.Schema({
	firstName: {
		type: String
	},
	lastName: {
		type: String
	},
	password: {
		type: String
	},
	emailAddress: {
		type: String,
		index: true
	},
	gender: {
		type: Number
	},
	dateOfBirth: {
		type: Date
	},
	jukeboxes: [{
			type: mongoose.Schema.ObjectId,
			ref: 'Jukebox'
		}],
	createdOn: {
		type: Date
	},
	facebook: {
		Id: {
		type: String,
		index: true
		},
		token: {
			type: String
		},
		email: {
			type: String
		}		
	},
	spotify: {
		Id: {
		type: String,
		index: true
		},
		token: {
			type: String
		},
		email: {
			type: String
		}		
	}
});

var User = module.exports = mongoose.model('User', UserSchema);

module.exports.createUser = function (newUser, callback) {
	bcrypt.genSalt(10, function (err, salt) {
		bcrypt.hash(newUser.password, salt, function (err, hash) {
			newUser.password = hash;
			newUser.save(callback);
		});
	});
}

module.exports.comparePassword = function(candidatePassword, hash, callback) {
	bcrypt.compare(candidatePassword, hash, function (err, isMatch) {
		if (err) {
			throw err;
		}

		callback(null, isMatch);
	});
}

module.exports.addJukeboxToUser = function(user, newJukebox, callback) {
	user.jukeboxes.push(newJukebox._id);
	user.save(callback);
}