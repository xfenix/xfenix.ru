import $, { Cash } from "cash-dom";
import LazyLoad from "vanilla-lazyload";
import smoothscroll from "smoothscroll-polyfill";

// warn about old ie (before all other things)
if (/Trident\/|MSIE/.test(window.navigator.userAgent)) {
  $("body").addClass("outdated");
}

// initial things
smoothscroll.polyfill();
new LazyLoad().update();

// burger animation + on click improvements
const $burger: Cash = $(".burger");
const $topHeadMenu: Cash = $(".top-head__aside");

$burger.on("click", function (eventObj: Event) {
  eventObj.preventDefault();
  $(this).toggleClass("active");
  $topHeadMenu.toggleClass("active");
});

$(".top-head__menulink").on("click", function (eventObj: Event) {
  eventObj.preventDefault();
  if ($burger.hasClass("active")) {
    $burger.removeClass("active");
    $topHeadMenu.removeClass("active");
  }
});

// skills tabs
[".skills-switch__tab", ".skills-group"].map((oneGroup: string) => {
  $(oneGroup).each(function (index: number) {
    $(this).attr("data-index", String(index));
  });
});

$(".skills-switch__tab").on("click", function (eventObj: Event) {
  eventObj.preventDefault();
  $(".skills-switch__tab.active,.skills-group.active").removeClass("active");
  $(this).addClass("active");
  $(`.skills-group[data-index="${$(this).data("index")}"]`).addClass("active");
});

// scrolls support
$(".top-head__menulink, .top-head__logolink").on(
  "click",
  function (eventObj: Event) {
    eventObj.preventDefault();
    const originalHref: string = $(this).attr("href");
    window.scrollTo({
      top: originalHref.replace("#", "")
        ? $(originalHref).offset().top - $(".top-head").height()
        : 0,
      behavior: "smooth",
    });
  }
);

// email obfuscation (hard-coded as hell)
$(".contacts__link_email").one("click", function () {
  const rot13New = (inputStr: string) => {
    return inputStr.replace(
      /[A-Z]/gi,
      (char: string) =>
        "NOPQRSTUVWXYZABCDEFGHIJKLMnopqrstuvwxyzabcdefghijklm"[
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".indexOf(char)
        ]
    );
  };
  $(this).attr(
    "href",
    rot13New("znvygb:") +
      rot13New("nq") +
      rot13New("--ksravk-eh").replace("--", "@").replace("-", ".")
  );
});

// github repos rendering with cache
const CACHE_KEY = "xfenix-github-cache";
const API_KEY = "xfenix-apiaddr";
const BYPASS_KEY = "xfenix-bypasscache";
const GITHUB_CACHE_SECONDS = 12 * 3600;
const SHOW_REPOS = 6;
const API_DESTINATION = localStorage.getItem(API_KEY)
  ? localStorage.getItem(API_KEY)
  : "/api/githubrepos/";
const localStorageWithExpiration = {
  set: (cacheKey: string, inputValue: Object, ttlSeconds: number): void => {
    localStorage.setItem(
      cacheKey.toString(),
      JSON.stringify({
        value: inputValue,
        expires_at: new Date().getTime() + (ttlSeconds * 1000) / 1,
      })
    );
  },
  get: (cacheKey: string): Object | null => {
    if (localStorage.getItem(BYPASS_KEY)) {
      return null;
    }
    const storageData: { value: Object; expires_at: number } = JSON.parse(
      localStorage.getItem(cacheKey.toString())
    );
    if (storageData !== null) {
      if (
        storageData.expires_at !== null &&
        storageData.expires_at < new Date().getTime()
      ) {
        localStorage.removeItem(cacheKey.toString());
      } else {
        return storageData.value;
      }
    }
    return null;
  },
};
const cachedPayload = localStorageWithExpiration.get(CACHE_KEY);
const destinationNode = document.querySelector(".github-wannabe");
const templateElement: HTMLTemplateElement = document.querySelector(
  "#github-wannabe-tpl"
);
const renderOneRepo = (oneRepoPayload: {
  name: string;
  html_url: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
}) => {
  const newNode: HTMLElement = templateElement.content.cloneNode(
    true
  ) as HTMLElement;
  const titleNode: HTMLAnchorElement = newNode.querySelector(
    ".github-wannabe__title > a"
  );
  const starsNode: HTMLElement = newNode.querySelector(
    ".github-wannabe__stars"
  );
  const forkNode: HTMLElement = newNode.querySelector(".github-wannabe__fork");
  const languageNode: HTMLElement = newNode.querySelector(
    ".github-wannabe__language"
  );

  titleNode.textContent = oneRepoPayload.name;
  titleNode.href = oneRepoPayload.html_url;

  newNode.querySelector(".github-wannabe__descr").textContent =
    oneRepoPayload.description;

  starsNode.textContent = String(oneRepoPayload.stargazers_count);
  (
    starsNode.parentNode as HTMLAnchorElement
  ).href = `${oneRepoPayload.html_url}/stargazers`;

  const forkParent = forkNode.parentNode as HTMLAnchorElement;
  if (oneRepoPayload.forks_count > 0) {
    forkNode.textContent = String(oneRepoPayload.forks_count);
    forkParent.href = `${oneRepoPayload.html_url}/network/members`;
  } else {
    forkParent.remove();
  }

  languageNode
    .querySelector(".github-repo-color")
    .classList.add(
      "github-repo-color_" +
        (oneRepoPayload.language
          ? oneRepoPayload.language
          : "nolanguage"
        ).toLowerCase()
    );
  languageNode.appendChild(
    document.createTextNode(
      oneRepoPayload.language ? oneRepoPayload.language : "No language"
    )
  );

  return newNode;
};
const renderMultipleRepo = (multiplePayload) => {
  const tmpFragment = document.createDocumentFragment();
  let counter = 1;
  for (const oneRepoPayload of multiplePayload) {
    tmpFragment.appendChild(renderOneRepo(oneRepoPayload));
    counter++;
    if (counter > SHOW_REPOS) {
      break;
    }
  }
  destinationNode.appendChild(tmpFragment);
};
if (!cachedPayload) {
  fetch(API_DESTINATION)
    .then((response: Response) => response.json())
    .then((result: Object) => {
      renderMultipleRepo(result);
      localStorageWithExpiration.set(CACHE_KEY, result, GITHUB_CACHE_SECONDS);
    });
} else {
  renderMultipleRepo(cachedPayload);
}
