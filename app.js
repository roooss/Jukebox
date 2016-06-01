var express = require('express');
var favicon = require('serve-favicon');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressHandlebars = require('express-handlebars');
var expressValidator = require('express-validator');
var session = require('express-session');
var passport = require('passport');
var flash = require('connect-flash');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var mongo = require('mongodb');
var mongoose = require('mongoose');
var _   = require('lodash');
var url     = require('url');
var version = require('./package.json').version;

mongoose.connect('mongodb://127.0.0.1:27017/authtest')

var db = mongoose.connection;
var app = express();

var http = require('http').createServer(app);
var io = require('socket.io').listen(http);

var User = require('./models/user');
var Jukebox = require('./models/jukebox');
var SongInfo = require('./models/songInfo');

var connectedSockets = [];
	 
io.on('connection', function (socket) {
	console.log('a user connected');

	if (connectedSockets.indexOf(socket) == -1) {
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
});

function objToKeyval(obj) {
	var returnPairs = [];

	for (key in obj) {
		if (obj.hasOwnProperty(key)) {
			returnPairs.push({key: key, val: obj[key]});
		}
	}

	return returnPairs;
}

function renderTag(obj) {
    var tag = '';
    tag = '<' + obj.name + ' ';
    _.each(obj.opts, function (opt) {
    	if (obj.name === 'script' && opt.key === 'src' && !url.parse(opt.val, false, true).host) {
    		opt.val = opt.val + '?v=' + version;
    	}

        tag += opt.key + '="' + opt.val + '" ';
    });

    tag += '></' + obj.name + '>';
    return tag;
}

var hbs = expressHandlebars.create({
	defaultLayout: 'layout',
	partialsDir: [
        'views/partials/'
    ],
    helpers: {
    	debug: function(optionalValue) {
    		if (optionalValue) {
				console.log("Value");
				console.log("====================");
				console.log(optionalValue);
			} else {
				console.log("Current Context");
				console.log("====================");
				console.log(this);
			}
		},
		math: function(lvalue, operator, rvalue, options) {
			lvalue = parseFloat(lvalue);
		    rvalue = parseFloat(rvalue);

		    return {
		    	"+": lvalue + rvalue,
        		"-": lvalue - rvalue,
        		"*": lvalue * rvalue,
        		"/": lvalue / rvalue,
        		"%": lvalue % rvalue
    		}[operator];
		},
		ifCond: function (v1, operator, v2, options) {
			switch (operator) {
				case '==':
					return (v1 == v2) ? options.fn(this) : options.inverse(this);
        		case '===':
            		return (v1 === v2) ? options.fn(this) : options.inverse(this);
        		case '<':
            		return (v1 < v2) ? options.fn(this) : options.inverse(this);
        		case '<=':
            		return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        		case '>':
            		return (v1 > v2) ? options.fn(this) : options.inverse(this);
        		case '>=':
            		return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        		case '&&':
            		return (v1 && v2) ? options.fn(this) : options.inverse(this);
        		case '||':
            		return (v1 || v2) ? options.fn(this) : options.inverse(this);
        		default:
            		return options.inverse(this);
    		}
		},
		renderJS: function(files) {
			var out = '';

        	_.each(files, function (js) {
            	out = out + renderTag({
                	'name': 'script',
                	'opts': objToKeyval({
                    	'type': 'text/javascript',
                    	'src': js
                	})
            	});
        	});

        	return out;
    	},
		paginate: require('handlebars-paginate')
	}
});

app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser('keyboard cat'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
	secret: 'somereallylongnmumbberdsecrestthingety',
	saveUninitialized: true,
	resave: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(expressValidator({
	expressFormatter: function (param, msg, value) {
		var namespace = param.split('.'),
			root = namespace.shift(),
			formParam = root;

		while (namespace.length) {
			formParam += '[' + namespace.shift() + ']';
		}

		return {
			param: formParam,
			msg: msg,
			value: value
		};
	}
}));

app.use(flash());






app.use(function (req, res, next) {
	res.locals.success_msg = req.flash('success_msg');
	res.locals.error_msg = req.flash('error_msg');
	res.locals.error = req.flash('error');
	res.locals.user = req.user || null;
	next();
});

var router = require('./router')(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.set('port', (process.env.PORT || 3000));

http.listen(app.get('port'), function() {
	console.log('Server listening on port ' + app.get('port'));
});

module.exports = app;