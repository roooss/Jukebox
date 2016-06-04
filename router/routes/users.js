var express = require('express');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var SpotifyStrategy = require('passport-spotify').Strategy;
var router = express.Router();

var authConfig = require('../../config/auth');

var User = require('../../models/user');

// As with any middleware it is quintessential to call next()
// if the user is authenticated
var isAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) {
  	return next();
  }

  req.flash('error_msg', 'You are not logged in.');

  res.redirect('/users/login');
}

router.get('/register', function (req, res) {
	res.render('register');
});

router.post('/register', function (req, res) {
	var firstName = req.body.firstName;
	var lastName = req.body.lastName;
	var emailAddress = req.body.emailAddress;
	var gender = req.body.gender;
	var password = req.body.password;
	var repeatPassword = req.body.repeatPassword;
	var dateOfBirth = req.body.dateOfBirth;

	req.checkBody('emailAddress', 'Email address is required.').notEmpty();
	req.checkBody('emailAddress', 'Email address is not valid.').isEmail();
	req.checkBody('firstName', 'First name is required.').notEmpty();
	req.checkBody('lastName', 'Last name is required.').notEmpty();
	req.checkBody('dateOfBirth', 'Date of birth is required.').notEmpty();

	req.checkBody('password', 'password is required.').notEmpty();
	req.checkBody('password','Password must be Minimum 8 characters at least 1 Uppercase Alphabet, 1 Lowercase Alphabet and 1 Number').passwordStrength();
	req.checkBody('repeatPassword', 'Please repeat your password.').equals(req.body.password);

	var errors = req.validationErrors();

	if (errors) {
		res.render('register', {
			errors: errors
		});
	} else {
		var newUser = new User({
			firstName: firstName,
			lastName: lastName,
			emailAddress: emailAddress,
			gender: gender,
			password: password,
			dateOfBirth: dateOfBirth,
			createdOn: Date.now()
		});
 
		User.createUser(newUser, function (err, user) {
			if (err) {
				console.log(err);
				throw err;
			}

			console.log(user);	
		});

		req.flash('success_msg', 'You are now registered and can log in.');

		res.redirect('/users/login');
	}
});

router.get('/account', isAuthenticated, function (req, res) {
	User.findOne({ _id: req.user.id }, function (err, user) {
			if (err) {
				res.redirect('/users/login', { message: 'Something bad happened.' });
			}

			if (!user) {
				res.redirect('/users/login', { message: 'User not found.' });
			}

			var model = {
				emailAddress: user.emailAddress,
				firstName: user.firstName,
				lastName: user.lastName,
				gender: user.gender,
				dateOfBirth: user.dateOfBirth
			};

			res.render('users/edit', { model: model });
		});
});

router.post('/account', isAuthenticated, function (req, res) {
	var firstName = req.body.firstName;
	var lastName = req.body.lastName;
	var emailAddress = req.body.emailAddress;
	var gender = req.body.gender;
	var password = req.body.password;
	var repeatPassword = req.body.repeatPassword;
	var dateOfBirth = req.body.dateOfBirth;

	req.checkBody('emailAddress', 'Email address is required.').notEmpty();
	req.checkBody('emailAddress', 'Email address is not valid.').isEmail();
	req.checkBody('firstName', 'First name is required.').notEmpty();
	req.checkBody('lastName', 'Last name is required.').notEmpty();
	req.checkBody('dateOfBirth', 'Date of birth is required.').notEmpty();

	if (password.length > 0) {
		req.checkBody('password','Password must be Minimum 8 characters at least 1 Uppercase Alphabet, 1 Lowercase Alphabet and 1 Number').passwordStrength();
		req.checkBody('repeatPassword', 'Please repeat your password.').equals(req.body.password);
	}

	User.findOne({ _id: req.user.id }, function (err, user) {
			if (err) {
				res.redirect('/users/login', { message: 'Something bad happened.' });
			}

			if (!user) {
				res.redirect('/users/login', { message: 'User not found.' });
			}

			user.emailAddress = emailAddress;
			user.firstName = firstName;
			user.lastName = lastName;
			user.gender = gender;
			user.dateOfBirth = dateOfBirth;

			User.updateAccountInfo(user, password, function (err, user) {
				if (err) {
					res.redirect('/users/login', { message: 'Something bad happened.' });
				}

				if (!user) {
					res.redirect('/users/login', { message: 'User not found.' });
				}

				var model = {
					emailAddress: user.emailAddress,
					firstName: user.firstName,
					lastName: user.lastName,
					gender: user.gender,
					dateOfBirth: user.dateOfBirth
				};

				res.render('users/edit', { model: model, success_msg: 'Saved' });
			});
		});
});

router.get('/login', function (req, res) {
	res.render('login');
});

router.post('/login',
	passport.authenticate('local', { successRedirect: '/', failureRedirect: '/users/login', failureFlash: true }),
	function (req, res) {
		User.findOne({ _id: req.user.id }, function (err, user) {
			if (err) {
				res.redirect('/users/login', { message: 'Something bad happened.' });
			}

			if (!user) {
				res.redirect('/users/login', { message: 'User not found.' });
			}

			res.session.user = user;

			res.redirect('/');	
		});
	});

router.get('/logout', function (req, res) {
	req.logout();

	req.flash('success_msg', 'Logged out.');
	req.session.destroy();

	res.redirect('/');
});

router.get('/facebook', passport.authenticate('facebook'));

router.get('/facebook/callback', passport.authenticate('facebook', {
	successRedirect: '/',
	failureRedirect: '/users/login'
}));

router.get('/spotify', passport.authenticate('spotify', { scope: ['user-read-email', 'user-read-birthdate', 'user-read-private', 'streaming'] }));

router.get('/spotify/callback', passport.authenticate('spotify', {
	successRedirect: '/',
	failureRedirect: '/users/login'
}));

passport.use(new LocalStrategy(
	function (username, password, done) {
		User.findOne({ emailAddress: username }, function (err, user) {
			if (err) {
				return done(err);
			}

			if (!user) {
				return done(null, false, { message: 'Incorrect login details.' });
			}

			User.comparePassword(password, user.password, function(err, isMatch) {
				if (err) {
					return done(err);		
				}

				if (isMatch) {
					return done(null, user);
				} else {
					return done(null, false, { message: 'Incorrect login details.' });
				}
			});
		});
	}
));

passport.use(new FacebookStrategy({
		clientID: authConfig.facebookAuth.clientId,
		clientSecret: authConfig.facebookAuth.clientSecret,
		callbackURL: authConfig.facebookAuth.callbackUrl,
		profileFields: ['id', 'email', 'gender', 'link', 'locale', 'name', 'timezone', 'updated_time', 'verified']
	},
	function (accessToken, refreshToken, profile, done) {
		User.findOne({ 'facebook.id': profile.id }, function (err, user) {
			if (err) {
				return done(err);
			}

			if (user) {
				return done(null, user);
			} else {
				var newUser = new User();
				newUser.facebook.id = profile.id;
				newUser.facebook.token = accessToken;
				newUser.facebook.name = profile.name.givenName + ' ' + profile.name.lastName;
				newUser.firstName = profile.name.givenName;
				newUser.lastName = profile.name.lastName;

				newUser.facebook.email = profile.emails[0].value;
				//newUser.emailAddress = profile.emails[0].value;

				newUser.gender = 0;
				newUser.dateOfBirth = Date.now();
				newUser.createdOn = Date.now();

				newUser.save(function (err) {
					if (err) {
						return done(err);
					} else {
						return done(null, newUser)
					}		
				});
			}
		});
	}
));

passport.use(new SpotifyStrategy({
		clientID: authConfig.spotifyAuth.clientId,
		clientSecret: authConfig.spotifyAuth.clientSecret,
		callbackURL: authConfig.spotifyAuth.callbackUrl
	},
	function (accessToken, refreshToken, profile, done) {
		User.findOne({ 'spotify.id': profile.id }, function (err, user) {
			if (err) {
				return done(err);
			}

			if (user) {
				return done(null, user);
			} else {
				var newUser = new User();
				newUser.spotify.id = profile.id;
				newUser.spotify.token = accessToken;
				newUser.spotify.name = profile.displayName;

				var firstName = profile.displayName.split(' ').slice(0, -1).join(' ');
				var lastName = profile.displayName.split(' ').slice(-1).join(' ');

				newUser.firstName = firstName;
				newUser.lastName = lastName;

				newUser.spotify.email = profile.emails[0].value;
				//newUser.emailAddress = profile.emails[0].value;

				newUser.gender = 0;
				newUser.dateOfBirth = Date.now();
				newUser.createdOn = Date.now();

				newUser.save(function (err) {
					if (err) {
						return done(err);
					} else {
						return done(null, newUser)
					}		
				});
			}
		});
	}
));

passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	User.findById(id, function (err, user) {
		done(err, user);
	});
});

module.exports = router;