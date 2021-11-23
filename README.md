xfenix.ru
==
[![My single and only CI/CD pipe](https://github.com/xfenix/xfenix.ru/actions/workflows/dockerized-v2.yml/badge.svg)](https://github.com/xfenix/xfenix.ru/actions/workflows/dockerized-v2.yml)  

My small site and some developers shitty things.  
It consists of:
* `back` — written in fastify. Basically it's a small github adapter api with cache. Dockerized
* `front` — frontend page, dockerized inside alpine nginx
    * `nginx.conf` — all-in-one nginx config, router for back and front, http2 support, etc
* Github Actions — my small continious depoyment variant

## Developer flow
1. Run backend:
    ```bash
    DEBUG=1 node back/server.js
    ```
1. Open [./front/src/build/index.html](./front/src/build/index.html) (build frontend at least once, then open markdown in code editor, press cmd/ctrl, focus on this link, then click)
1. Paste this code in browser console and run:
    ```javascript
    localStorage.setItem('xfenix-apiaddr', 'http://0.0.0.0:8080/api/githubrepos/')
    localStorage.setItem('xfenix-bypasscache', '1')
    ```
1. Run frontend watch reload:
    ```bash
    cd front && npx gulp watch
    ```
1. Develop.

## Developer fixes
For `node-sass` trouble this helps: `CXXFLAGS="--std=c++14" npm i`
