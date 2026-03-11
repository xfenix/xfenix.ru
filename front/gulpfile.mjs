import gulp from "gulp";
// CSS
import gulpSass from "gulp-sass";
import * as sassEngine from "sass";
import gulpPostcss from "gulp-postcss";
import cssMinify from "cssnano";
import autoprefixer from "gulp-autoprefixer";
import postcssPresetEnv from "postcss-preset-env";
// HTML
import htmlMinifier from "gulp-htmlmin";
import minifyInline from "gulp-minify-inline";
import minifyInlineJSON from "gulp-minify-inline-json";
import typograf from "gulp-typograf";
import pleaseReplace from "gulp-replace";
import { HtmlValidate } from "html-validate";
import through2Stream from "through2";
// Assets
import jsonminify from "gulp-jsonminify";
import svgminify from "gulp-svgmin";
// JS/TS
import gulpEsbuild from "gulp-esbuild";
// Rev
import assetRevision from "gulp-rev";
import revReplace from "gulp-rev-replace";
// Dev
import browserSync from "browser-sync";
import { spawn as spawnProc } from "child_process";
import { existsSync } from "fs";
import { rm } from "fs/promises";

const sassCompiler = gulpSass(sassEngine);
const syncServer = browserSync.create();

const ROOT_DIR = new URL("src", import.meta.url).pathname;
const DESTINATION_DIR = `${ROOT_DIR}/build`;
const PATTERNS = {
  html: `${ROOT_DIR}/*.html`,
  sass: `${ROOT_DIR}/*.scss`,
  ts: `${ROOT_DIR}/*.ts`,
  assets: `${ROOT_DIR}/assets/**`,
};

gulp.task("clean", () =>
  rm(DESTINATION_DIR, { recursive: true, force: true }),
);

gulp.task("process-styles", () => {
  return gulp
    .src(PATTERNS.sass)
    .pipe(sassCompiler().on("error", sassCompiler.logError))
    .pipe(autoprefixer())
    .pipe(
      gulpPostcss([
        postcssPresetEnv(),
        cssMinify({
          preset: ["default", { discardComments: { removeAll: true } }],
        }),
      ]),
    )
    .pipe(gulp.dest(DESTINATION_DIR));
});

gulp.task("process-ts", () => {
  return gulp
    .src(`${ROOT_DIR}/whole-app.ts`)
    .pipe(
      gulpEsbuild({
        outfile: "whole-app.js",
        bundle: true,
        minify: true,
        target: ["es2015"],
        platform: "browser",
      }),
    )
    .pipe(gulp.dest(DESTINATION_DIR));
});

gulp.task("validate-html", () => {
  const htmlValidator = new HtmlValidate();
  return gulp.src(PATTERNS.html).pipe(
    through2Stream.obj(function (vinylFile, encoding, callback) {
      if (vinylFile.isNull()) {
        callback(null, vinylFile);
        return;
      }
      const validationResult = htmlValidator.validateStringSync(
        vinylFile.contents.toString(),
        vinylFile.path,
      );
      if (!validationResult.valid) {
        const errorMessages = validationResult.results
          .flatMap((validationEntry) => validationEntry.messages)
          .map(
            (validationMsg) =>
              `${validationMsg.ruleId}: ${validationMsg.message} (line ${validationMsg.line}, col ${validationMsg.column})`,
          )
          .join("\n");
        callback(
          new Error(
            `HTML validation failed in ${vinylFile.relative}:\n${errorMessages}`,
          ),
        );
        return;
      }
      callback(null, vinylFile);
    }),
  );
});

gulp.task("process-html", () => {
  return gulp
    .src(PATTERNS.html)
    .pipe(
      htmlMinifier({
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        sortAttributes: true,
        sortClassName: true,
        removeComments: true,
      }),
    )
    .pipe(typograf({ locale: ["ru", "en-US"], htmlEntity: { type: "name" } }))
    .pipe(minifyInline())
    .pipe(minifyInlineJSON())
    .pipe(pleaseReplace("</li>", ""))
    .pipe(pleaseReplace("</p>", ""))
    .pipe(gulp.dest(DESTINATION_DIR));
});

gulp.task("process-rev", () => {
  return gulp
    .src([
      `${DESTINATION_DIR}/index.css`,
      `${DESTINATION_DIR}/whole-app.js`,
      `${DESTINATION_DIR}/logo.svg`,
    ])
    .pipe(assetRevision())
    .pipe(gulp.dest(DESTINATION_DIR))
    .pipe(assetRevision.manifest())
    .pipe(gulp.dest(DESTINATION_DIR));
});

gulp.task("process-rev-replace", () => {
  const revManifest = gulp.src(`${DESTINATION_DIR}/rev-manifest.json`);
  return gulp
    .src(`${DESTINATION_DIR}/*.html`)
    .pipe(revReplace({ manifest: revManifest }))
    .pipe(gulp.dest(DESTINATION_DIR));
});

gulp.task("copy-assets", () => {
  return gulp.src(PATTERNS.assets, { encoding: false }).pipe(gulp.dest(DESTINATION_DIR, { encoding: false }));
});

gulp.task("process-sitemap", () => {
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "+00:00");
  return gulp
    .src(`${DESTINATION_DIR}/sitemap.xml`)
    .pipe(pleaseReplace(/<lastmod>[^<]+<\/lastmod>/, `<lastmod>${now}</lastmod>`))
    .pipe(gulp.dest(DESTINATION_DIR));
});

gulp.task("minify-json-assets", () => {
  return gulp
    .src(`${DESTINATION_DIR}/*.json`)
    .pipe(jsonminify())
    .pipe(gulp.dest(DESTINATION_DIR));
});

gulp.task("minify-svg-assets", () => {
  return gulp
    .src(`${DESTINATION_DIR}/*.svg`)
    .pipe(svgminify())
    .pipe(gulp.dest(DESTINATION_DIR));
});

gulp.task(
  "process-assets",
  gulp.series(
    "copy-assets",
    gulp.parallel("minify-json-assets", "minify-svg-assets", "process-sitemap"),
  ),
);

gulp.task(
  "build",
  gulp.series(
    "clean",
    "validate-html",
    gulp.parallel(
      "process-ts",
      "process-styles",
      "process-html",
      "process-assets",
    ),
    "process-rev",
    "process-rev-replace",
  ),
);

gulp.task(
  "watch",
  gulp.series("build", (doneCallback) => {
    process.env.DEVEL = true;
    syncServer.init({ server: { baseDir: DESTINATION_DIR } });
    if (existsSync("../back/server.js")) {
      spawnProc("node", ["../back/server.js"], {
        stdio: "inherit",
        env: { ...process.env, DEBUG: 1 },
      });
    }
    const reloadBrowser = (done) => { syncServer.reload(); done(); };
    gulp.watch(
      PATTERNS.sass,
      gulp.series("process-styles", "process-html", "process-rev", "process-rev-replace", reloadBrowser),
    );
    gulp.watch(
      PATTERNS.html,
      gulp.series("validate-html", "process-html", "process-rev", "process-rev-replace", reloadBrowser),
    );
    gulp.watch(
      PATTERNS.ts,
      gulp.series("process-ts", "process-rev", "process-rev-replace", reloadBrowser),
    );
    gulp.watch(PATTERNS.assets, gulp.series("process-assets", reloadBrowser));
    doneCallback();
  }),
);
