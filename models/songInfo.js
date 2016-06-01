var mongoose = require('mongoose');

var SongInfoSchema = mongoose.Schema({
	value: {
		type: String
	},
	description: {
		type: String
	},
	duration: {
		type: String
	},
	label: {
		type: String
	},
	thumbnail: {
		type: String
	},
	createdOn: {
		type: Date
	},
	createdBy: {
		type: mongoose.Schema.ObjectId,
		ref: 'User'
	},
	parentJukebox: {
		type: mongoose.Schema.ObjectId,
		ref: 'Jukebox'
	}
});

var SongInfo = module.exports = mongoose.model('SongInfo', SongInfoSchema);