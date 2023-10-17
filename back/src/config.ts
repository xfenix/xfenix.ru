import { fileURLToPath } from "url";
import { dirname } from "path";

// common
export const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
export const IS_DEBUG = process.env.DEBUG ? true : false;
export const APP_PORT = process.env.APP_PORT ? process.env.APP_PORT : 8080;
export const MY_GITHUB_USERNAME = "xfenix";
export const READS_STORE_PATH = process.env.DEBUG
  ? "./reads.lmdb"
  : "/var/lib/xfenix.ru/reads.lmdb";
// 1978 bytes maximum key size in lmdb, so in utf8 at max 494 symbols (max for utf8)
// probably, we will be safe
export const MAX_URL_FOR_READS_LENGTH = 200;
export const MIN_URL_FOR_READS_LENGTH = 20;

// github things
export const CACHE_TIME = 3600 * 12;
export const HOW_MANY_REPOS = 100;
export const PAYLOAD_CACHE_KEY = "githubpayload2";
export const SKIP_REPOS = [
  "django-elfinderfs",
  "django-haystack",
  "django-media-manager",
  "django-search-hide",
  "django-xflatpages",
  "django-suit-sortable",
  "ionic-conference-app",
];

// social media things
export const FONT_FILE = CURRENT_DIR + "/../Inter-Regular.ttf";
export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 630;
export const TEXT_COLOR = "#ffffff";
export const BACKGROUND_COLOR1 = "#7000d1";
export const BACKGROUND_COLOR2 = "#007a33";
export const MEDIA_PADDING = 30;
export const FONT_SIZE = 60;
export const LINE_HEIGHT = 1.3;
export const MAX_TEXT_LENGTH = 140;
export const IMAGE_MIME = "image/png";
export const LRU_SIZE = 100;
export const SITE_NAME = "xfenix.ru";
export const SITE_NAME_FONT_SIZE = 30;
