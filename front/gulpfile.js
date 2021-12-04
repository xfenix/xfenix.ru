'use strict';

const gulp = require('gulp');
// some css & html things
const sass = require('gulp-sass')(require('sass'));
const postcss = require("gulp-postcss");
const cssMinify = require('cssnano');
const htmlmin = require('gulp-htmlmin');
const htmlValidator = require('gulp-html');
const minifyInline = require('gulp-minify-inline');
const minifyInlineJSON = require('gulp-minify-inline-json');
const uncache = require('gulp-uncache');
const typograf = require('gulp-typograf');
const autoprefixer = require('gulp-autoprefixer');
const postcssPresetEnv = require('postcss-preset-env');
const jsonminify = require('gulp-jsonminify');
const svgminify = require('gulp-svgmin');
// typescript things
const browserify = require("browserify");
const tsify = require("tsify");
const vinylSource = require("vinyl-source-stream");
const buffer = require("vinyl-buffer");
const uglify = require("gulp-uglify-es").default;
const sourcemaps = require("gulp-sourcemaps");
// and something other
const browserSync = require('browser-sync').create();
const spawnProc = require('child_process').spawn;
// configs
const ROOT_DIR = `${__dirname}/src`;
const DESTINATION_DIR =  `${ROOT_DIR}/build`;
const PATTERNS = {
    html: `${ROOT_DIR}/*.html`,
    sass: `${ROOT_DIR}/*.scss`,
    js: `${ROOT_DIR}/*.js`,
    ts: `${ROOT_DIR}/*.ts`,
    assets: `${ROOT_DIR}/assets/**`,
};

gulp.task('process-styles', () => {
    return gulp.src(PATTERNS.sass)
        .pipe(sass().on("error", sass.logError))
        .pipe(autoprefixer())
        .pipe(
            postcss([
                postcssPresetEnv(),
                cssMinify({
                    discardComments: {
                        removeAll: true,
                    },
                }),
            ])
        )
        .pipe(gulp.dest(DESTINATION_DIR));
});

gulp.task('process-ts', function () {
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
        .pipe(gulp.dest(DESTINATION_DIR));
});

gulp.task('process-html', () => {
    let basicStream = gulp.src(PATTERNS.html);
    if (process.env.DEVEL) {
        basicStream = basicStream.pipe(htmlValidator());
    }
    return basicStream
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeOptionalTags: true,
            removeEmptyAttributes: true,
            removeEmptyElements: true,
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
            srcDir: DESTINATION_DIR,
            distDir: DESTINATION_DIR
        }))
        .pipe(minifyInline())
        .pipe(minifyInlineJSON())
        .pipe(gulp.dest(DESTINATION_DIR));
});

gulp.task('copy-assets', () => {
    return gulp.src(PATTERNS.assets)
        .pipe(gulp.dest(DESTINATION_DIR));
});

gulp.task('minify-json-assets', () => {
    return gulp.src(DESTINATION_DIR + '/*.json')
        .pipe(jsonminify())
        .pipe(gulp.dest(DESTINATION_DIR));
});

gulp.task('minify-svg-assets', () => {
    return gulp.src(DESTINATION_DIR + '/*.svg')
        .pipe(svgminify())
        .pipe(gulp.dest(DESTINATION_DIR));
});

gulp.task('process-assets', gulp.series(
    'copy-assets',
    gulp.parallel(
        'minify-json-assets',
        'minify-svg-assets'
    )
));

// Tasks for users starts here
gulp.task('build', gulp.parallel(
    'process-ts',
    'process-styles',
    'process-html',
    'process-assets'
));

gulp.task('watch', (cb) => {
    process.env.DEVEL = true;
    browserSync.init({
        server: {
            baseDir: DESTINATION_DIR
        }
    });
    spawnProc("node", ["../back/server.js"], { stdio: "inherit", env: {...process.env, ...{DEBUG: 1}}});
    gulp.watch(PATTERNS.sass, gulp.series('process-styles', 'process-html'));
    gulp.watch(PATTERNS.html, gulp.series('process-html'));
    gulp.watch(PATTERNS.ts, gulp.series('process-ts'));
    gulp.watch(PATTERNS.assets, gulp.series('process-assets'));
    cb();
});
