var express = require('express');
var router = express.Router();
var google = require('googleapis');
var authConfig = require('../../config/auth');
var util = require('util');

var youtubeClient = google.youtube({ version: 'v3', auth: authConfig.googleApis.apiKey });

var User = require('../../models/user');
var Jukebox = require('../../models/jukebox');

// As with any middleware it is quintessential to call next()
// if the user is authenticated
var isAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) {
  	return next();
  }

  req.flash('error_msg', 'You are not logged in.');

  res.redirect('/users/login');
}

var convertTime = function (duration) {
    var match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)

  var hours = (parseInt(match[1]) || 0);
  var minutes = (parseInt(match[2]) || 0);
  var seconds = (parseInt(match[3]) || 0);

  var returnTime = 00;

  if (seconds > 0) {
  	returnTime = seconds;
  }

  if (minutes > 0) {
  	returnTime = minutes + ':' + returnTime;
  }  else {
  	returnTime = '00:' + returnTime;
  }
  
  if (hours > 0) {
  	returnTime = hours * 3600 + ':' + returnTime;
  }

  return returnTime;
}

router.post('/create', isAuthenticated, function (req, res) {
	var name = req.body.jukeboxName;
	var desc = req.body.description;
	var isPublic = req.body.isPublic;
	var queueLevel = req.body.queueLevel;
	var password = req.body.password;

	req.checkBody('jukeboxName', 'Jukebox name is required.').notEmpty();
	req.checkBody('description', 'Jukebox description is required.').notEmpty();

	var errors = req.validationErrors();

	if (errors) {
		res.render('jukebox-create', {
			errors: errors
		});
	} else {
		var newJukebox = new Jukebox({
			name: name,
			description: desc,
			isPublic: isPublic,
			queueLevel: queueLevel,
			password: password,
			isAvailable: true,
			createdOn: Date.now(),
			createdBy: req.user.id
		});
 
		Jukebox.createJukebox(newJukebox, function (err, jukebox) {
			if (err) {
				throw err;
			}

			User.addJukeboxToUser(req.user, jukebox, function(err, user) {
				if (err) {
					throw err;
				}				
			});
		});

		req.flash('success_msg', 'Jukebox created.');

		res.redirect('/jukebox');
	}
});

router.post('/song/search', function(req, res) {
	var searchTerm = req.body.term;
	var encodedTerm = encodeURIComponent(searchTerm);

	youtubeClient.search.list({ part: 'id,snippet', maxResults: 10, q: searchTerm, type: 'video' }, 
		function (err, data) {
			if (err) {
				console.error('Error: ' + err);
			}

			if (data) {
				var returnList = [];

				var total = data.items.length;
				var count = 0;

				for(var i = 0; i < total; i++){
					(function(foo){
						
						youtubeClient.videos.list({ part: 'contentDetails', id: data.items[foo].id.videoId }, 
							function (err, details) {
								if (err) {
									console.error('Error: ' + err);
								}

								if (details) {
									var returnItem = {
										duration: convertTime(details.items[0].contentDetails.duration),
										value: data.items[foo].id.videoId,
										label: data.items[foo].snippet.title,
										description: data.items[foo].snippet.description,
										thumbnail: data.items[foo].snippet.thumbnails.default.url
									};

									// returnItem.duration = convertTime(details.items[0].contentDetails.duration);

									returnList.push(returnItem);
								}

								count++;
								if (count > total - 1) {
									res.json(returnList);
								}
						});

					}(i));
				}
			}
		});
});

router.get('/view/:id', isAuthenticated, function (req, res) {
	var jukeboxId = req.params.id

	Jukebox.findOne({ _id: jukeboxId }, function (err, jukebox) {
		if (err) {
			throw err;
		}

		if (!jukebox) {
			req.flash('error_msg', 'Unable to find the jukebox.');
			res.redirect('/jukebox');
		}

		var viewModel = {
			name: jukebox.name,
			description: jukebox.description,
			numberOfListeners: 0
		}

		res.render('jukebox-view', {'js': ['/js/youtube-app.js', '/js/app.js'], model: viewModel});
	});
});

router.get('/create', isAuthenticated, function (req, res) {
	res.render('jukebox-create');
});

router.get('/:p?', isAuthenticated, function (req, res) {
	var perPage = 10; // req.params('perPage') > 10 ? req.params('perPage') : 10;
    var page = req.params.p > 1 ? req.params.p : 1;

    Jukebox.find()
    		.limit(perPage)
    		.skip(perPage * (page - 1))
    		.sort({createdOn: 'desc'})
    		.exec(function (err, jukeboxes) {
    			if (err) {
    				throw err;
    			}

    			Jukebox.count().exec(function (err, count) {
    				if (err) {
    					throw err;
    				}

    				if (count <= 0) {
    					res.redirect('/');
    				} else {
	    				res.render('jukebox-index', {
	    					jukeboxes: jukeboxes,
	    					pagination: {
    							page: page,
    							pageCount: count / perPage
							}
	    				});
    				}
    			});
    		});
});

module.exports = router;