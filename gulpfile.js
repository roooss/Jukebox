
'use strict';

var gulp        = require('gulp');
var sass        = require('gulp-sass');
var concat      = require('gulp-concat');
var uglify      = require('gulp-uglify');
var cssnano     = require('gulp-cssnano');
var browserSync = require('browser-sync').create();
var spawn = require('child_process').spawn;
var node;

// Styles
gulp.task('styles', function () {
    return gulp.src([
        './assets/styles/main.scss'
    ])
    .pipe(concat('app.css'))
    .pipe(sass({includePaths: ['./node_modules/foundation-sites/']}).on('error', sass.logError))
    .pipe(cssnano())
    .pipe(gulp.dest('./public/css'))
    .pipe(browserSync.stream());
});

// Scripts
gulp.task('scripts', function () {
    gulp.src([
        './bower_components/jquery/dist/jquery.js',
        './bower_components/jquery-ui/jquery-ui.js',
        './node_modules/what-input/what-input.js',
        './node_modules/foundation-sites/dist/foundation.js',
        './node_modules/socket.io-client/socket.io.js',
        './node_modules/handlebars/dist/handlebars.js'
    ])
    //.pipe(concat('vendor.js'))
    //.pipe(uglify())
    .pipe(gulp.dest('./public/js'));

    gulp.src([
        './assets/scripts/**/*.js'
    ])
    //.pipe(concat('app.js'))
    //.pipe(uglify())
    .pipe(gulp.dest('./public/js'));

    return gulp;
});

// Build
gulp.task('build', ['styles', 'scripts']);

// Server
// Need running node before (npm start)
gulp.task('serve', ['build', 'server'], function() {

    browserSync.init({
        proxy: "localhost:3000",
        port: "7000"
    });

    gulp.watch('./assets/styles/**/*.scss', ['styles']);
    // gulp.watch('./assets/scripts/**/*.js', ['scripts']);
    gulp.watch(['./**/*.js', '!./public/**/*.js'], ['scripts', 'server']);
    gulp.watch("**/*.hbs").on('change', browserSync.reload);
    gulp.watch("**/*.handlebars").on('change', browserSync.reload);
});

/**
 * $ gulp server
 * description: launch the server. If there's a server already running, kill it.
 */
gulp.task('server', function() {
  if (node) node.kill()
  node = spawn('node', ['app.js'], {stdio: 'inherit'})
  node.on('close', function (code) {
    if (code === 8) {
      gulp.log('Error detected, waiting for changes...');
    }
  });
});

// clean up if an error goes unhandled.
process.on('exit', function() {
    if (node) node.kill()
});

// Default
gulp.task('default', ['serve']);

