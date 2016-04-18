var gulp = require("gulp"),
	sass = require('gulp-sass'),
    cssnano = require('gulp-cssnano'),
	babel = require("gulp-babel"),
	jshint = require("gulp-jshint"),
	rename = require("gulp-rename"),
	uglify = require("gulp-uglify");

/**
 * JSHint, transpiling, uglifying and adding .min.js suffix
 */
gulp.task('js', function () {
    return gulp.src('js/app.js')
        .pipe(babel())
        .pipe(uglify())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('js/'));
});

gulp.task('sass', function() {
    return gulp.src('css/app.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(cssnano())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('css/'));
});

/**
 * Default task
 */
gulp.task('default', ['js']);