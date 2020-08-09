'use strict';

const gulp = require('gulp');
const sass = require('gulp-sass');
const cssnano = require('gulp-cssnano');
const htmlmin = require('gulp-htmlmin');
const babelMinify = require('gulp-babel-minify');
const minifyInline = require('gulp-minify-inline');
const DIR_PREFIX = __dirname + '/front';
const ASSETS_DIR = `${DIR_PREFIX}/assets/`;
const PATTERNS = {
    html: `${DIR_PREFIX}/*.html`,
    sass: `${DIR_PREFIX}/src/*.scss`,
    js: `${DIR_PREFIX}/src/*.js`,
};

gulp.task('sass', () => {
    return gulp.src(PATTERNS.sass)
        .pipe(sass().on('error', sass.logError))
        .pipe(cssnano())
        .pipe(gulp.dest(ASSETS_DIR));
});

gulp.task('js', () => {
    return gulp.src(PATTERNS.js)
        .pipe(babelMinify({
            mangle: {
                keepClassName: true
            }
        }))
        .pipe(gulp.dest(ASSETS_DIR));
});

gulp.task('htmlmin', () => {
    return gulp.src(PATTERNS.html)
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeOptionalTags: true,
            removeRedundantAttributes: true,
            sortAttributes: true,
            sortClassName: true,
        }))
        .pipe(minifyInline())
        .pipe(gulp.dest(`${DIR_PREFIX}/public/`));
});

gulp.task('watch', () => {
    gulp.watch(PATTERNS.sass, gulp.series('sass'));
    gulp.watch(PATTERNS.html, gulp.series('htmlmin'));
    gulp.watch(PATTERNS.js, gulp.series('js'));
});

gulp.task('build', (cb) => {
    gulp.series('sass', 'htmlmin', 'js')();
    cb();
});
