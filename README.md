xfenix.ru
==
![CI](https://github.com/xfenix/xfenix.ru/workflows/CI/badge.svg)  

My small site and some developers shitty things.  
It consists of:
* `back` — written in fastify. Basically it's a small github adapter api with cache.
* `front` — frontend page, served from `public` directory, assets lives in `assets`. Manifest.json lives in `public`, because im kinda lazy
* `nginx.conf` — includes in main nginx config. Its simplier to store it in repository for many reasons. And i dont want to use docker for such small site
* `fabfile.py` — deployment script
* Github Actions — my small continious depoyment variant

## Developer flow
1. Run `DEBUG=1 node back/server.js`
1. Open `front/index.html` in browser
1. Set:
    * `xfenix-apiaddr` with value `http://127.0.0.1:8080/api/githubrepos/`
    * `xfenix-bypasscache` with value `1`
1. Run frontend watcher `cd front && npx gulp watch`


## Developer fixes
For `node-sass` trouble this helps: `CXXFLAGS="--std=c++14" npm i`
