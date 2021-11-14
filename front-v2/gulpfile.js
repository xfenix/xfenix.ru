'use strict';

const gulp = require('gulp');
// some css & html things
const sass = require('gulp-sass')(require('sass'));
const postcss = require("gulp-postcss");
const cssMinify = require('cssnano');
const htmlmin = require('gulp-htmlmin');
const minifyInline = require('gulp-minify-inline');
const uncache = require('gulp-uncache');
const typograf = require('gulp-typograf');
// typescript things
const browserify = require("browserify");
const tsify = require("tsify");
const vinylSource = require("vinyl-source-stream");
const buffer = require("vinyl-buffer");
const uglify = require("gulp-uglify-es").default;
const sourcemaps = require("gulp-sourcemaps");
// configs
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
    return browserify({
            basedir: ".",
            debug: false,
            entries: ["src/whole-app.ts"],
            cache: {},
            packageCache: {},
        })
        .plugin(tsify, {
            esModuleInterop: true
        })
        .transform("babelify", {
            presets: ["@babel/preset-env"],
            extensions: [".ts"],
        })
        .bundle()
        .pipe(vinylSource("whole-app.js"))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(sourcemaps.write("./"))
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
        .pipe(typograf({
            locale: ['ru', 'en-US'],
            htmlEntity: { type: 'name' }
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

gulp.task('watch', (cb) => {
    gulp.watch(PATTERNS.sass, gulp.series('sass', 'html'));
    gulp.watch(PATTERNS.html, gulp.series('html'));
    gulp.watch(PATTERNS.ts, gulp.series('ts'));
    gulp.watch(PATTERNS.assets, gulp.series('assets'));
    cb();
});

gulp.task('build', (cb) => {
    gulp.series('sass', 'html', 'ts', 'assets')();
    cb();
});
