'use strict';

const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const postcss = require("gulp-postcss");
const cssMinify = require('cssnano');
const htmlmin = require('gulp-htmlmin');
const babelMinify = require('gulp-babel-minify');
const minifyInline = require('gulp-minify-inline');
const uncache = require('gulp-uncache');
const typescriptProc = require('gulp-typescript');
const browserSync = require('browser-sync').create();
const DIR_PREFIX = __dirname + '/src';
const DEST_DIR = DIR_PREFIX + "/build";
const PATTERNS = {
    html: `${DIR_PREFIX}/*.html`,
    sass: `${DIR_PREFIX}/*.scss`,
    js: `${DIR_PREFIX}/*.js`,
    ts: `${DIR_PREFIX}/*.ts`,
    assets: DIR_PREFIX + '/assets/**',
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
      .pipe(gulp.dest(DEST_DIR));
});

gulp.task('ts', function () {
    return gulp.src(PATTERNS.ts)
        .pipe(typescriptProc({
            noImplicitAny: true
        }))
        .pipe(babelMinify({
            mangle: {
                keepClassName: true
            }
        }))
        .pipe(gulp.dest(DEST_DIR));
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
            srcDir: DEST_DIR,
            distDir: DEST_DIR
        }))
        .pipe(minifyInline())
        .pipe(gulp.dest(DEST_DIR));
});

gulp.task('assets', () => {
    return gulp.src(PATTERNS.assets).pipe(gulp.dest(DEST_DIR));
});

gulp.task('watch', () => {
    gulp.watch(PATTERNS.sass, gulp.series('sass', 'html'));
    gulp.watch(PATTERNS.html, gulp.series('html'));
    gulp.watch(PATTERNS.ts, gulp.series('ts'));
    gulp.watch(PATTERNS.assets, gulp.series('assets'));
});

gulp.task('serve', function () {
    browserSync.init({DEST_DIR});
    gulp.watch("*.html").on("change", browserSync.reload);
});

gulp.task('build', (cb) => {
    gulp.series('sass', 'html', 'ts', 'assets')();
    cb();
});
