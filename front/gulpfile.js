'use strict';

const gulp = require('gulp');
const sass = require('gulp-sass');
const postcss = require("gulp-postcss");
const cssMinify = require('cssnano');
const htmlmin = require('gulp-htmlmin');
const babelMinify = require('gulp-babel-minify');
const minifyInline = require('gulp-minify-inline');
const uncache = require('gulp-uncache');
const DIR_PREFIX = __dirname + '/src';
const ASSETS_DIR = `${DIR_PREFIX}/assets/`;
const PATTERNS = {
    html: `${DIR_PREFIX}/*.html`,
    sass: `${DIR_PREFIX}/*.scss`,
    js: `${DIR_PREFIX}/*.js`,
};

gulp.task('sass', () => {
    return gulp
      .src(PATTERNS.sass)
      .pipe(sass().on("error", sass.logError))
      .pipe(
        postcss([
          cssMinify({
            discardComments: {
              removeAll: true,
            },
          }),
        ])
      )
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

gulp.task('html', () => {
    return gulp.src(PATTERNS.html)
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeOptionalTags: true,
            removeRedundantAttributes: true,
            sortAttributes: true,
            sortClassName: true,
        }))
        .pipe(uncache({
            append: 'hash',
            srcDir: DIR_PREFIX,
            distDir: ASSETS_DIR
        }))
        .pipe(minifyInline())
        .pipe(gulp.dest(`${DIR_PREFIX}/public/`));
});

gulp.task('watch', () => {
    gulp.watch(PATTERNS.sass, gulp.series('sass', 'html'));
    gulp.watch(PATTERNS.html, gulp.series('html'));
    gulp.watch(PATTERNS.js, gulp.series('js'));
});

gulp.task('build', (cb) => {
    gulp.series('sass', 'html', 'js')();
    cb();
});
