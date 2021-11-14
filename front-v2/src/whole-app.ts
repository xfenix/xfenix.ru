import $ from "cash-dom";
import LazyLoad from "vanilla-lazyload";

// some generic things
const CACHE_KEY = 'xfenix-github-cache';
const API_KEY = 'xfenix-apiaddr';
const BYPASS_KEY = 'xfenix-bypasscache';
const GITHUB_CACHE_SECONDS = 3600;
const SHOW_REPOS = 6;
const API_DESTINATION = localStorage.getItem(API_KEY) ? localStorage.getItem(API_KEY) : '/api/githubrepos/';
const localStorageWithExpiration = {
    set: (cacheKey, inputValue, ttlMs) => {
        localStorage.setItem(cacheKey.toString(), JSON.stringify({
            value: inputValue, expires_at: new Date().getTime() + ttlMs / 1
        }));
    },
    get: (cacheKey) => {
        if (localStorage.getItem(BYPASS_KEY)) {
            return null;
        }
        const storageData = JSON.parse(localStorage.getItem(cacheKey.toString()));
        if (storageData !== null) {
            if (storageData.expires_at !== null && storageData.expires_at < new Date().getTime()) {
                localStorage.removeItem(cacheKey.toString());
            } else {
                return storageData.value;
            }
        }
        return null;
    }
};

// skills tabs
for (const oneGroup of ['.skills-switch__tab', '.skills-group']) {
    $(oneGroup).each(function (index: number) {
        $(this).attr('data-index', String(index));
    });
}

$('.skills-switch__tab').on('click', function(eventObj: Event) {
    eventObj.preventDefault();
    $('.skills-switch__tab.active,.skills-group.active').removeClass('active');
    $(this).addClass('active');
    $(`.skills-group[data-index="${$(this).data('index')}"]`).addClass('active');
});

// scrolls support
$('.top-head__menulink, .top-head__logolink').on('click', function (eventObj: Event) {
    eventObj.preventDefault();
    const originalHref: string = $(this).attr('href');
    window.scrollTo({
        top: originalHref.replace('#', '') ? $(originalHref).offset().top - $('.top-head').height() : 0,
        behavior: 'smooth'
    });
});

// email obfuscation
$('.contacts__link_email').one('click', function () {
    const rot13New = (inputStr) => {
        return inputStr.replace(/[A-Z]/gi, char =>
            "NOPQRSTUVWXYZABCDEFGHIJKLMnopqrstuvwxyzabcdefghijklm"[
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".indexOf(char)]);
    };
    $(this).attr('href',
        rot13New('znvygb:') + rot13New('nq') +
        rot13New('--ksravk-eh').replace('--', '@').replace('-', '.'));
});

// warn about old ie
if (/Trident\/|MSIE/.test(window.navigator.userAgent)) {
    $('body').addClass('outdated');
}

// lazy load implementation
const lazyloadInstance = new LazyLoad();
lazyloadInstance.update();

// github repos rendering with cache
const cachedPayload = localStorageWithExpiration.get(CACHE_KEY);
const templateElement: HTMLTemplateElement = document.querySelector('#github-wannabe-tpl');
const destinationNode = document.querySelector('.github-wannabe');
const renderOneRepo = (oneRepoPayload) => {
    const newNode: HTMLElement = templateElement.content.cloneNode(true) as HTMLElement;
    const titleNode: HTMLAnchorElement = newNode.querySelector('.github-wannabe__title > a');
    const starsNode: HTMLElement = newNode.querySelector('.github-wannabe__stars');
    const forkNode: HTMLElement = newNode.querySelector('.github-wannabe__fork');
    const languageNode: HTMLElement = newNode.querySelector('.github-wannabe__language');
    titleNode.textContent = oneRepoPayload.name;
    titleNode.href = oneRepoPayload.html_url;
    newNode.querySelector('.github-wannabe__descr').textContent = oneRepoPayload.description;
    starsNode.textContent = oneRepoPayload.stargazers_count;
    (starsNode.parentNode as HTMLAnchorElement).href = `${oneRepoPayload.html_url}/stargazers`;
    forkNode.textContent = oneRepoPayload.forks_count;
    (forkNode.parentNode as HTMLAnchorElement).href = `${oneRepoPayload.html_url}/network/members`;
    languageNode.querySelector('.github-repo-color')
        .classList.add('github-repo-color_' + (oneRepoPayload.language ? oneRepoPayload.language : 'nolanguage').toLowerCase());
    languageNode.appendChild(document.createTextNode(oneRepoPayload.language ? oneRepoPayload.language : 'No language'));
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
        .then(response => response.json())
        .then(result => {
            renderMultipleRepo(result);
            localStorageWithExpiration.set(CACHE_KEY, result, GITHUB_CACHE_SECONDS * 1000);
        });
} else {
    renderMultipleRepo(cachedPayload);
}
