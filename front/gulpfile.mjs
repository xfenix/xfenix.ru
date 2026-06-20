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
// FontAwesome → inline SVG sprite (icon data via package API, no node_modules paths)
import {
  findIconDefinition,
  icon as renderIconToSvg,
  library as iconLibrary,
} from "@fortawesome/fontawesome-svg-core";
import { fas as solidIconDefinitions } from "@fortawesome/free-solid-svg-icons";
import { fab as brandIconDefinitions } from "@fortawesome/free-brands-svg-icons";
import SVGSpriter from "svg-sprite";
// Dev
import browserSync from "browser-sync";
import { spawn as spawnProc } from "child_process";
import { existsSync } from "fs";
import { rm, readdir, readFile, writeFile, mkdir } from "fs/promises";

const sassCompiler = gulpSass(sassEngine);
const syncServer = browserSync.create();

const ROOT_DIR = new URL("src", import.meta.url).pathname;
const NODE_MODULES = new URL("node_modules", import.meta.url).pathname;
const DESTINATION_DIR = `${ROOT_DIR}/build`;
const VENDOR_DEST = `${DESTINATION_DIR}/vendor`;
const PATTERNS = {
  html: `${ROOT_DIR}/*.html`,
  sass: `${ROOT_DIR}/*.scss`,
  ts: `${ROOT_DIR}/*.ts`,
  assets: `${ROOT_DIR}/assets/**`,
};

// Self-hosted third-party static (fonts), sourced from npm.
// Versions are managed via package.json; run `npm update` to refresh.
const FONT_FILES = `${NODE_MODULES}/@fontsource/{inter,nunito}/files/{inter-{cyrillic,latin}-{400,700},nunito-{cyrillic,latin}-400}-normal.woff2`;

// FontAwesome: only icons actually used in markup are baked into an SVG sprite.
// Authoring stays `<i class="fa-solid fa-name"></i>`; build resolves + inlines.
iconLibrary.add(solidIconDefinitions, brandIconDefinitions);

const ICON_SPRITE_FILENAME = "icons.svg";
const ICON_STYLE_TO_PREFIX = {
  "fa-solid": "fas",
  "fa-brands": "fab",
  "fa-regular": "far",
};
// Matches only empty icon placeholders `<i class="...">< /i>`, never italic text.
// A fresh RegExp is built per use: a shared /g object carries lastIndex state and
// would race between the parallel `build-icons` and `process-html` tasks.
const ICON_TAG_SOURCE = '<i\\b[^>]*class="([^"]*)"[^>]*>\\s*<\\/i>';
const buildIconTagMatcher = () => new RegExp(ICON_TAG_SOURCE, "g");

const resolveIconFromClasses = (classAttribute) => {
  const classTokens = classAttribute.split(/\s+/);
  const styleToken = classTokens.find((classToken) => ICON_STYLE_TO_PREFIX[classToken]);
  const nameToken = classTokens.find(
    (classToken) => classToken.startsWith("fa-") && !ICON_STYLE_TO_PREFIX[classToken],
  );
  if (!styleToken || !nameToken) {
    return null;
  }
  const iconPrefix = ICON_STYLE_TO_PREFIX[styleToken];
  const iconName = nameToken.slice("fa-".length);
  return { iconPrefix, iconName, symbolIdentifier: `${iconPrefix}-${iconName}` };
};

const assertIconExists = (resolvedIcon) => {
  if (!findIconDefinition({ prefix: resolvedIcon.iconPrefix, iconName: resolvedIcon.iconName })) {
    throw new Error(
      `FontAwesome icon not found: ${resolvedIcon.iconPrefix} ${resolvedIcon.iconName}`,
    );
  }
};

const renderIconReference = (resolvedIcon) =>
  `<i><svg width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false">` +
  `<use href="/${ICON_SPRITE_FILENAME}#${resolvedIcon.symbolIdentifier}"></use></svg></i>`;

const inlineFaIconsInHtml = (htmlContent) =>
  htmlContent.replace(buildIconTagMatcher(), (originalTag, classAttribute) => {
    const resolvedIcon = resolveIconFromClasses(classAttribute);
    if (!resolvedIcon) {
      return originalTag;
    }
    assertIconExists(resolvedIcon);
    return renderIconReference(resolvedIcon);
  });

const collectUsedIcons = async () => {
  const sourceFilenames = (await readdir(ROOT_DIR)).filter((sourceFilename) =>
    sourceFilename.endsWith(".html"),
  );
  const discoveredIcons = new Map();
  for (const sourceFilename of sourceFilenames) {
    const htmlContent = await readFile(`${ROOT_DIR}/${sourceFilename}`, "utf8");
    for (const tagMatch of htmlContent.matchAll(buildIconTagMatcher())) {
      const resolvedIcon = resolveIconFromClasses(tagMatch[1]);
      if (resolvedIcon) {
        discoveredIcons.set(resolvedIcon.symbolIdentifier, resolvedIcon);
      }
    }
  }
  return [...discoveredIcons.values()];
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
      through2Stream.obj((vinylFile, encoding, streamCallback) => {
        if (vinylFile.isBuffer()) {
          vinylFile.contents = Buffer.from(
            inlineFaIconsInHtml(vinylFile.contents.toString()),
          );
        }
        streamCallback(null, vinylFile);
      }),
    )
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
      `${DESTINATION_DIR}/${ICON_SPRITE_FILENAME}`,
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

gulp.task("copy-vendor-fonts", () => {
  return gulp
    .src(FONT_FILES, { encoding: false })
    .pipe(
      through2Stream.obj((vinylFile, encoding, callback) => {
        vinylFile.dirname = vinylFile.base;
        callback(null, vinylFile);
      }),
    )
    .pipe(gulp.dest(`${VENDOR_DEST}/fonts`, { encoding: false }));
});

gulp.task("build-icons", async () => {
  const usedIcons = await collectUsedIcons();
  const spriteCompiler = new SVGSpriter({
    mode: { symbol: true },
    shape: { id: { generator: "%s" } },
    svg: { namespaceClassnames: false },
  });
  for (const usedIcon of usedIcons) {
    assertIconExists(usedIcon);
    const iconDefinition = findIconDefinition({
      prefix: usedIcon.iconPrefix,
      iconName: usedIcon.iconName,
    });
    spriteCompiler.add(
      `${usedIcon.symbolIdentifier}.svg`,
      null,
      renderIconToSvg(iconDefinition).html[0],
    );
  }
  const spriteContents = await new Promise((resolve, reject) => {
    spriteCompiler.compile((compileError, compileResult) => {
      if (compileError) {
        reject(compileError);
        return;
      }
      resolve(
        compileResult.symbol.sprite.contents
          .toString()
          .replace(/ class="svg-inline--fa[^"]*"/g, ""),
      );
    });
  });
  await mkdir(DESTINATION_DIR, { recursive: true });
  await writeFile(`${DESTINATION_DIR}/${ICON_SPRITE_FILENAME}`, spriteContents);
});

gulp.task("copy-vendor", gulp.parallel("copy-vendor-fonts"));

gulp.task("process-sitemap", () => {
  const currentDatetime = new Date(Date.now() + 3 * 3600 * 1000).toISOString().replace(/\.\d{3}Z$/, "+03:00");
  return gulp
    .src(`${DESTINATION_DIR}/sitemap.xml`)
    .pipe(pleaseReplace(/<lastmod>[^<]+<\/lastmod>/, `<lastmod>${currentDatetime}</lastmod>`))
    .pipe(gulp.dest(DESTINATION_DIR));
});

gulp.task("minify-json-assets", () => {
  return gulp
    .src(`${DESTINATION_DIR}/*.json`)
    .pipe(jsonminify())
    .pipe(gulp.dest(DESTINATION_DIR));
});

gulp.task("minify-svg-assets", () => {
  // icons.svg is the FontAwesome sprite — already optimized by svg-sprite, and
  // svgo would strip its <symbol> defs (no local refs) and empty the sprite.
  return gulp
    .src([`${DESTINATION_DIR}/*.svg`, `!${DESTINATION_DIR}/${ICON_SPRITE_FILENAME}`])
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
    "build-icons",
    gulp.parallel(
      "process-ts",
      "process-styles",
      "process-html",
      "process-assets",
      "copy-vendor",
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
    const rebuildRev = gulp.series("clean", "build-icons", gulp.parallel("process-ts", "process-styles", "process-html", "process-assets", "copy-vendor"), "process-rev", "process-rev-replace");
    gulp.watch(
      PATTERNS.sass,
      gulp.series(rebuildRev, reloadBrowser),
    );
    gulp.watch(
      PATTERNS.html,
      gulp.series("validate-html", rebuildRev, reloadBrowser),
    );
    gulp.watch(
      PATTERNS.ts,
      gulp.series(rebuildRev, reloadBrowser),
    );
    gulp.watch(PATTERNS.assets, gulp.series(rebuildRev, reloadBrowser));
    doneCallback();
  }),
);
