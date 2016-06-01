module.exports = function (app) {
    app.use('/', require('./routes/index'));
    app.use('/users', require('./routes/users'));
    app.use('/jukebox', require('./routes/jukebox'));
    // var hub = require('./routes/hub')(app);
}