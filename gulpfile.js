var
	gulp = require('gulp'),
	babelify = require('babelify'),
	browserify = require('browserify'),
	buffer = require('vinyl-buffer'),
	source = require('vinyl-source-stream'),
	clean = require('gulp-clean'),
	sass = require('gulp-sass'),
	imagemin = require('gulp-imagemin'),
	connect = require('gulp-connect'),
	sequence = require('run-sequence'),
	autoprefixer = require('gulp-autoprefixer'),
	sourcemaps = require('gulp-sourcemaps'),
	uglify = require('gulp-uglify'),
	uglifycss = require('gulp-uglifycss'),
	open = require('gulp-open'),
	fileinclude = require('gulp-file-include');

var paths = {
	html: 'src/**/*.html',
	images: 'src/images/**/*',
	includes: 'src/includes/**/*.html',
	scripts: 'src/scripts/',
	static: ['src/**/*', '!src/**/*.html', '!src/scripts/**/*', '!src/styles/**/*', '!src/images/**/*'],
	styles: 'src/styles/**/*',

	output: 'dist/'
};

var ports = {
	public: 8000,
	livereload: 35729
};

var host = 'localhost';


gulp.task('clean', function() {
	return gulp
		.src(paths.output)
		.pipe(clean());
});

gulp.task('copy-static', function() {
	return gulp
		.src(paths.static)
		.pipe(gulp.dest(paths.output));
});

gulp.task('copy-images', function() {
	return gulp
		.src(paths.images)
		.pipe(gulp.dest(paths.output + 'images'));
});

gulp.task('imagemin', function() {
	return gulp
		.src(paths.images)
		.pipe(imagemin())
		.pipe(gulp.dest(paths.output + 'images'));
});

gulp.task('fileinclude', function() {
	return gulp
		.src(paths.html)
		.pipe(fileinclude({
			prefix: '@@',
			basepath: '@file',
			indent: true,
			context: {
				task: 'develop'
			}
		}))
		.pipe(gulp.dest(paths.output));
});

gulp.task('fileinclude-build', function() {
	return gulp
		.src(paths.html)
		.pipe(fileinclude({
			prefix: '@@',
			basepath: '@file',
			indent: true,
			context: {
				task: 'build'
			}
		}))
		.pipe(gulp.dest(paths.output));
});

gulp.task('sass', function() {
	return gulp
		.src(paths.styles)
		.pipe(sourcemaps.init())
		.pipe(sass({errLogToConsole: true}).on('error', sass.logError))
		.pipe(autoprefixer())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(paths.output + 'styles'));
});

gulp.task('sass-build', function() {
	return gulp
		.src(paths.styles)
		.pipe(sass({errLogToConsole: true}).on('error', sass.logError))
		.pipe(autoprefixer())
		.pipe(uglifycss())
		.pipe(gulp.dest(paths.output + 'styles'));
});

gulp.task('babelify', function() {
	return browserify(paths.scripts + 'main.js', { debug: true })
		.transform(babelify, { presets: ['es2015', 'react'], compact: false })
		.bundle()
		.on('error', function (err) { console.error(err); })
		.pipe(source('main.js'))
		.pipe(buffer())
		.pipe(gulp.dest(paths.output + 'scripts'));
});

gulp.task('babelify-build', function() {
	return browserify(paths.scripts + 'main.js', { debug: false })
		.transform(babelify, { presets: ['es2015', 'react'], compact: false })
		.bundle()
		.on('error', function (err) { console.error(err); })
		.pipe(source('main.js'))
		.pipe(buffer())
		.pipe(uglify())
		.pipe(gulp.dest(paths.output + 'scripts'));
});

gulp.task('connect', function() {
	return connect.server({
		root: 'dist/',
		host: host,
		port: ports.public,
		livereload: {
			hostname: host,
			port: ports.livereload
		}
	});
});

gulp.task('open', function() {
	return gulp
		.src(__filename)
		.pipe(open({uri: 'http://' + host + ':' + ports.public}));
});

gulp.task('watch', function() {
	gulp.watch(paths.html, function() { sequence('fileinclude', 'reload'); });
	gulp.watch(paths.images, function() { sequence('copy-images', 'reload'); });
	gulp.watch(paths.scripts + '**/*', function() { sequence('babelify', 'reload'); });
	gulp.watch(paths.static, function() { sequence('copy-static', 'reload'); });
	gulp.watch(paths.styles, function() { sequence('sass', 'reload'); });
});

gulp.task('reload', function() {
	return gulp
		.src(paths.output + '**/*')
		.pipe(connect.reload());
});



gulp.task('develop', function(callback) {
	sequence('clean', 'copy-static', 'copy-images', 'fileinclude', 'sass', 'babelify', 'connect', 'open', 'watch', callback);
});

gulp.task('build', function(callback) {
	sequence('clean', 'copy-static', 'imagemin', 'fileinclude-build', 'sass-build', 'babelify-build', callback);
});

gulp.task('default', ['develop']);