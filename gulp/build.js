(function () {
    'use strict';

    var gulp = require('gulp');
    var rename = require('gulp-rename');
    var babel = require('gulp-babel');
    var uglify = require('gulp-uglify');

    gulp.task('build', ['es6', 'es5'], function () {
        return gulp.src('dist/cookie-manager.js')
            .pipe(uglify())
            .pipe(rename({
                    extname: '.min.js'
                }))
            .pipe(gulp.dest('dist/'));
    });

    gulp.task('es6', function () {
        return gulp.src('src/cookie-manager.js')
            .pipe(rename('cookie-manager.es6.js'))
            .pipe(gulp.dest('dist/'));
    });

    gulp.task('es5', function () {
        var babelOptions = {
            modules: 'ignore',
            blacklist: ['useStrict']
        };

        return gulp.src('src/cookie-manager.js')
            .pipe(babel(babelOptions))
            .pipe(gulp.dest('dist/'));
    });
}());

