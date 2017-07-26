var gulp = require('gulp');
var babelify = require('babelify');
var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');
var clean = require('gulp-clean');
var sass = require('gulp-sass');
var imagemin = require('gulp-imagemin');
var connect = require('gulp-connect');
var sequence = require('run-sequence');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var uglifycss = require('gulp-uglifycss');

var paths = {
	static: ['src/**/*', '!src/scripts/**/*', '!src/styles/**/*', '!src/images/**/*'],
	images: 'src/images/**/*',
	styles: 'src/styles/**/*',
	scripts: 'src/scripts/'
};

gulp.task('copy-static', function() {
	return gulp
		.src(paths.static)
		.pipe(gulp.dest('dist/'));
});

gulp.task('copy-images', function() {
	return gulp
		.src(paths.images)
		.pipe(gulp.dest('dist/images'));
});

gulp.task('babelify', function() {
	return browserify(paths.scripts + 'main.js', { debug: true })
		.transform(babelify, { presets: ['es2015', 'react'], compact: false })
		.bundle()
		.on('error', function (err) { console.error(err); })
		.pipe(source('main.js'))
		.pipe(buffer())
		.pipe(gulp.dest('dist/scripts'));
});

gulp.task('babelify-build', function() {
	return browserify(paths.scripts + 'main.js', { debug: false })
		.transform(babelify, { presets: ['es2015', 'react'], compact: false })
		.bundle()
		.on('error', function (err) { console.error(err); })
		.pipe(source('main.js'))
		.pipe(buffer())
		.pipe(uglify())
		.pipe(gulp.dest('dist/scripts'));
});

gulp.task('clean', function() {
	return gulp
		.src('dist/')
		.pipe(clean());
});

gulp.task('sass', function() {
	return gulp
		.src(paths.styles)
		.pipe(sourcemaps.init())
		.pipe(sass({errLogToConsole: true}).on('error', sass.logError))
		.pipe(autoprefixer())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('dist/styles/'));
});

gulp.task('sass-build', function() {
	return gulp
		.src(paths.styles)
		.pipe(sass({errLogToConsole: true}).on('error', sass.logError))
		.pipe(autoprefixer())
		.pipe(uglifycss())
		.pipe(gulp.dest('dist/styles/'));
});

gulp.task('imagemin', function() {
	return gulp
		.src(paths.images)
		.pipe(imagemin())
		.pipe(gulp.dest('dist/images'));
});

gulp.task('reload', function() {
	return gulp
		.src('dist/**/*')
		.pipe(connect.reload());
});

gulp.task('watch', function() {
	gulp.watch(paths.static, function() { sequence('copy-static', 'reload'); });
	gulp.watch(paths.images, function() { sequence('copy-images', 'reload'); });
	gulp.watch(paths.scripts + '**/*', function() { sequence('babelify', 'reload'); });
	gulp.watch(paths.styles, function() { sequence('sass', 'reload'); });
});

gulp.task('connect', function() {
	return connect.server({
		root: 'dist/',
		livereload: {
			hostname: 'localhost',
			port: 35729
		}
	});
});

gulp.task('dev', function(callback) {
	sequence('clean', 'copy-static', 'copy-images', 'sass', 'babelify', 'connect', 'watch', callback);
});

gulp.task('build', function(callback) {
	sequence('clean', 'copy-static', 'imagemin', 'sass-build', 'babelify-build', callback);
});

gulp.task('default', ['dev']);