var gulp = require("gulp"),
	babel = require("gulp-babel"),
	jshint = require("gulp-jshint"),
	rename = require("gulp-rename"),
	uglify = require("gulp-uglify");

/**
 * JSHint, transpiling, uglifying and adding .min.js suffix
 */
gulp.task('js', function () {
    return gulp.src('js/player.js')
        .pipe(babel())
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(gulp.dest('js/'));
});

/**
 * Default task
 */
gulp.task('default', ['js']);