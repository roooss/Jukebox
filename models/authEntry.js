var mongoose = require('mongoose');
var crypto = require('crypto'); 

var AuthEntrySchema = mongoose.Schema({
	token: {
		type: String
	},
	ttl: {
		type: Number
	},
	expiresOn: {
		type: Date
	},
	createdOn: {
		type: Date
	},
	createdBy: {
		type: mongoose.Schema.ObjectId,
		ref: 'User'
	},
	connectedJukebox: {
		type: mongoose.Schema.ObjectId,
		ref: 'Jukebox'
	}
});

var AuthEntry = module.exports = mongoose.model('AuthEntry', AuthEntrySchema);


module.exports.createAuthEntry = function (jukeboxId, userId, ttl, callback) {
		var newToken = crypto.randomBytes(32).toString('base64');
		var newCreatedOn = new Date();
		var newExpiresOn = newCreatedOn.setHours(ttl-1);

		var newAuthEntry = new AuthEntry({
			token: newToken,
			ttl: ttl,
			createdOn: newCreatedOn,
			expiresOn: newExpiresOn,
			createdBy: userId,
			connectedJukebox: jukeboxId
		});

		newAuthEntry.save(callback);
}

module.exports.verifyAuthToken = function(authTokenCookie, jukeboxId, userId, callback) {
	AuthEntry.findOne({ token: authTokenCookie })
		.populate({ path: 'createdBy' })
		.populate({ path: 'connectedJukebox' })
  		.exec(function (err, authEntry) {
			if (err) {
				callback(false);
			}

			if (!authEntry) {
				callback(false);
			}

			if (authEntry.expiresOn > new Date() && authEntry.createdBy.id == userId && authEntry.connectedJukebox.id == jukeboxId) {
				authEntry.expiresOn = new Date().setHours(authEntry.ttl-1);
				authEntry.save(function(err, authEntry) {
					callback(true);
				});
				//res.cookie('thing-' + jukeboxId, token, { maxAge: 1800000, httpOnly: true });
			} else {
				callback(false);
			}			
		});
}