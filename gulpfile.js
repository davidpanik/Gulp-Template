// === IMPORTS ======
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



// === SETTINGS ======
var settings = {
	host: 'localhost',

	paths: {
		input: {
			html: 'src/**/*.html',
			images: 'src/images/**/*',
			includes: 'src/includes/**/*.html',
			scripts: 'src/scripts/',
			static: ['src/**/*', '!src/**/*.html', '!src/scripts/**/*', '!src/styles/**/*', '!src/images/**/*'],
			styles: 'src/styles/**/*'
		},

		output: {
			root: 'dist',
			images: 'dist/images',
			scripts: 'dist/scripts',
			styles: 'dist/styles'
		}
	},

	ports: {
		public: 8000,
		livereload: 35729
	}
};



// === INDIVIDUAL TASKS ======
gulp.task('clean', function() {
	return gulp
		.src(settings.paths.output.root)
		.pipe(clean());
});

gulp.task('copy-static', function() {
	return gulp
		.src(settings.paths.input.static)
		.pipe(gulp.dest(settings.paths.output.root));
});

gulp.task('copy-images', function() {
	return gulp
		.src(settings.paths.input.images)
		.pipe(gulp.dest(settings.paths.output.images));
});

gulp.task('imagemin', function() {
	return gulp
		.src(settings.paths.input.images)
		.pipe(imagemin())
		.pipe(gulp.dest(settings.paths.output.images));
});

gulp.task('fileinclude', function() {
	return gulp
		.src(settings.paths.input.html)
		.pipe(fileinclude({
			prefix: '@@',
			basepath: '@file',
			indent: true,
			context: {
				task: 'develop'
			}
		}))
		.pipe(gulp.dest(settings.paths.output.root));
});

gulp.task('fileinclude-build', function() {
	return gulp
		.src(settings.paths.input.html)
		.pipe(fileinclude({
			prefix: '@@',
			basepath: '@file',
			indent: true,
			context: {
				task: 'build'
			}
		}))
		.pipe(gulp.dest(settings.paths.output.root));
});

gulp.task('sass', function() {
	return gulp
		.src(settings.paths.input.styles)
		.pipe(sourcemaps.init())
		.pipe(sass({errLogToConsole: true}).on('error', sass.logError))
		.pipe(autoprefixer())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(settings.paths.output.styles));
});

gulp.task('sass-build', function() {
	return gulp
		.src(settings.paths.input.styles)
		.pipe(sass({errLogToConsole: true}).on('error', sass.logError))
		.pipe(autoprefixer())
		.pipe(uglifycss())
		.pipe(gulp.dest(settings.paths.output.styles));
});

gulp.task('babelify', function() {
	return browserify(settings.paths.input.scripts + 'main.js', { debug: true })
		.transform(babelify, { presets: ['es2015', 'react'], compact: false })
		.bundle()
		.on('error', function (err) { console.error(err); })
		.pipe(source('main.js'))
		.pipe(buffer())
		.pipe(gulp.dest(settings.paths.output.scripts));
});

gulp.task('babelify-build', function() {
	return browserify(settings.paths.input.scripts + 'main.js', { debug: false })
		.transform(babelify, { presets: ['es2015', 'react'], compact: false })
		.bundle()
		.on('error', function (err) { console.error(err); })
		.pipe(source('main.js'))
		.pipe(buffer())
		.pipe(uglify())
		.pipe(gulp.dest(settings.paths.output.scripts));
});

gulp.task('connect', function() {
	return connect.server({
		root: settings.paths.output.root,
		host: settings.host,
		port: settings.ports.public,
		livereload: {
			hostname: settings.host,
			port: settings.ports.livereload
		}
	});
});

gulp.task('open', function() {
	return gulp
		.src(__filename)
		.pipe(open({uri: 'http://' + settings.host + ':' + settings.ports.public}));
});

gulp.task('watch', function() {
	gulp.watch(settings.paths.input.html, function() { sequence('fileinclude', 'reload'); });
	gulp.watch(settings.paths.input.images, function() { sequence('copy-images', 'reload'); });
	gulp.watch(settings.paths.input.scripts + '**/*', function() { sequence('babelify', 'reload'); });
	gulp.watch(settings.paths.input.static, function() { sequence('copy-static', 'reload'); });
	gulp.watch(settings.paths.input.styles, function() { sequence('sass', 'reload'); });
});

gulp.task('reload', function() {
	return gulp
		.src(settings.paths.output.root + '**/*')
		.pipe(connect.reload());
});



// === GROUPED TASKS ======
gulp.task('develop', function(callback) {
	sequence('clean', 'copy-static', 'copy-images', 'fileinclude', 'sass', 'babelify', 'connect', 'open', 'watch', callback);
});

gulp.task('build', function(callback) {
	sequence('clean', 'copy-static', 'imagemin', 'fileinclude-build', 'sass-build', 'babelify-build', callback);
});

gulp.task('default', ['develop']);