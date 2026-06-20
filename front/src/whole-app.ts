import $, { Cash } from "cash-dom";
import LazyLoad from "vanilla-lazyload";

// warn about old ie (before all other things)
if (/Trident\/|MSIE/.test(window.navigator.userAgent)) {
  $("body").addClass("outdated");
}

// initial things — scrollTo({ behavior: "smooth" }) is native in every browser we
// support (IE gets the "outdated" banner above), so no smooth-scroll polyfill.
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
    const originalHref: string | null = $(this).attr("href");
    if (originalHref !== null) {
      if (originalHref.replace("#", "").length === 0) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const possibleOffset = $(originalHref).offset();
        if (possibleOffset !== undefined) {
          window.scrollTo({
            top: possibleOffset.top - $(".top-head").height(),
            behavior: "smooth",
          });
        }
      }
    }
  },
);

// email obfuscation (hard-coded as hell)
$(".contacts__link_email").one("click", function () {
  const rot13New = (inputStr: string) => {
    return inputStr.replace(
      /[A-Z]/gi,
      (char: string) =>
        "NOPQRSTUVWXYZABCDEFGHIJKLMnopqrstuvwxyzabcdefghijklm"[
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".indexOf(char)
        ],
    );
  };
  $(this).attr(
    "href",
    rot13New("znvygb:") +
      rot13New("nq") +
      rot13New("--ksravk-eh").replace("--", "@").replace("-", "."),
  );
});

// ripple effect on interactive elements
$(document).on(
  "pointerdown",
  ".top-head__menulink, .contacts__link, .skills-switch__tab, .details__summary",
  function (event: PointerEvent) {
    const $rippleTarget = $(this);
    $rippleTarget.addClass("ripple");

    const boundingRect = (this as HTMLElement).getBoundingClientRect();
    const $rippleCircle = $('<span class="ripple__circle"></span>');
    $rippleCircle.css({
      left: `${event.clientX - boundingRect.left}px`,
      top: `${event.clientY - boundingRect.top}px`,
    });

    $rippleTarget.append($rippleCircle);
    $rippleCircle.on("animationend", () => $rippleCircle.remove());
  },
);

// cookie consent + yandex.metrika (loads only after explicit consent)
const METRIKA_ID = 24364567;
const CONSENT_KEY = "xfenix-consent-v1";

const loadMetrika = (): void => {
  (function (m: any, e: Document, t: string, r: string, i: string) {
    m[i] =
      m[i] ||
      function () {
        (m[i].a = m[i].a || []).push(arguments);
      };
    m[i].l = 1 * (new Date() as unknown as number);
    for (let j = 0; j < e.scripts.length; j++) {
      if (e.scripts[j].src === r) {
        return;
      }
    }
    const k = e.createElement(t) as HTMLScriptElement;
    const a = e.getElementsByTagName(t)[0];
    k.async = true;
    k.src = r;
    a.parentNode?.insertBefore(k, a);
  })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
  (window as any).ym(METRIKA_ID, "init", {
    webvisor: true,
    clickmap: true,
    referrer: document.referrer,
    url: location.href,
    accurateTrackBounce: true,
    trackLinks: true,
  });
};

const $cookieConsent: Cash = $(".cookie-consent");
const consentChoice: string | null = localStorage.getItem(CONSENT_KEY);

if (consentChoice === "accepted") {
  loadMetrika();
} else if (consentChoice !== "declined") {
  $cookieConsent.addClass("cookie-consent_visible");
}

$(".cookie-consent__accept").on("click", function () {
  localStorage.setItem(CONSENT_KEY, "accepted");
  $cookieConsent.removeClass("cookie-consent_visible");
  loadMetrika();
});

$(".cookie-consent__decline").on("click", function () {
  localStorage.setItem(CONSENT_KEY, "declined");
  $cookieConsent.removeClass("cookie-consent_visible");
});

// github repos rendering with cache
const CACHE_KEY = "xfenix-github-cache-v2";
const API_KEY = "xfenix-apiaddr";
const BYPASS_KEY = "xfenix-bypasscache";
const GITHUB_CACHE_SECONDS = 12 * 3600;
const SHOW_REPOS = 6;
const API_DESTINATION = String(
  localStorage.getItem(API_KEY)
    ? localStorage.getItem(API_KEY)
    : "/api/githubrepos/",
);
const localStorageWithExpiration = {
  set: (cacheKey: string, inputValue: Object, ttlSeconds: number): void => {
    localStorage.setItem(
      cacheKey.toString(),
      JSON.stringify({
        value: inputValue,
        expires_at: new Date().getTime() + (ttlSeconds * 1000) / 1,
      }),
    );
  },
  get: (cacheKey: string): Object | null => {
    if (localStorage.getItem(BYPASS_KEY)) {
      return null;
    }
    const fetchedData = localStorage.getItem(cacheKey.toString());
    if (fetchedData === null) {
      return null;
    }
    const storageData: { value: Object; expires_at: number } =
      JSON.parse(fetchedData);
    if (storageData === null) {
      return null;
    }
    if (
      storageData.expires_at !== null &&
      storageData.expires_at < new Date().getTime()
    ) {
      localStorage.removeItem(cacheKey.toString());
    } else {
      return storageData.value;
    }
    return null;
  },
};
const cachedPayload = localStorageWithExpiration.get(CACHE_KEY);
const destinationNode = document.querySelector(".github-wannabe");
const templateElement: HTMLTemplateElement | null = document.querySelector(
  "#github-wannabe-tpl",
);
const renderOneRepo = (oneRepoPayload: {
  name: string;
  html_url: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
}) => {
  const newNode: HTMLElement = templateElement?.content.cloneNode(
    true,
  ) as HTMLElement;
  const titleNode: HTMLAnchorElement | null = newNode.querySelector(
    ".github-wannabe__title > a",
  );
  const starsNode: HTMLElement | null = newNode.querySelector(
    ".github-wannabe__stars",
  );
  const forkNode: HTMLElement | null = newNode.querySelector(
    ".github-wannabe__fork",
  );
  const languageNode: HTMLElement | null = newNode.querySelector(
    ".github-wannabe__language",
  );

  if (titleNode) {
    titleNode.textContent = oneRepoPayload.name;
    titleNode.href = oneRepoPayload.html_url;
  }

  if (newNode) {
    const innerNode: HTMLElement | null = newNode.querySelector(
      ".github-wannabe__descr",
    );
    if (innerNode) {
      innerNode.textContent = oneRepoPayload.description;
    }
  }

  if (starsNode && starsNode.parentNode) {
    starsNode.textContent = String(oneRepoPayload.stargazers_count);
    (starsNode.parentNode as HTMLAnchorElement).href =
      `${oneRepoPayload.html_url}/stargazers`;
  }

  if (forkNode) {
    const forkParent = forkNode.parentNode as HTMLAnchorElement;
    if (oneRepoPayload.forks_count > 0) {
      forkNode.textContent = String(oneRepoPayload.forks_count);
      forkParent.href = `${oneRepoPayload.html_url}/network/members`;
    } else {
      forkParent.remove();
    }
  }

  if (languageNode) {
    const colorNode: HTMLElement | null =
      languageNode.querySelector(".github-repo-color");
    if (colorNode) {
      colorNode.classList.add(
        "github-repo-color_" +
          (oneRepoPayload.language
            ? oneRepoPayload.language
            : "nolanguage"
          ).toLowerCase(),
      );
    }
    languageNode.appendChild(
      document.createTextNode(
        oneRepoPayload.language ? oneRepoPayload.language : "No language",
      ),
    );
  }

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
  if (destinationNode) {
    destinationNode.appendChild(tmpFragment);
  }
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
