#!/usr/bin/env nodejs
require('dotenv').config()
const IS_DEBUG = process.env.DEBUG ? true : false
// dont need to place it in env file - it will be bad decision for me
const CACHE_TIME = 3600 * 12
const HOW_MANY_REPOS = 20
const PORT = 8080
const PAYLOAD_CACHE_KEY = 'githubpayload'
const NECESSARY_FIELDS = ['name', 'html_url', 'description', 'language', 'forks_count', 'stargazers_count']
const SKIP_REPOS = ['django-elfinderfs', 'django-haystack', 'django-media-manager',
                    'django-search-hide', 'django-xflatpages', 'django-suit-sortable',
                    'ionic-conference-app', ]
const githubClient = require('octonode').client(process.env.GITHUB_API_KEY)
const memoryCache = new (require( "node-cache" ))({stdTTL: CACHE_TIME});
const fastify = require('fastify')({ logger: true })

fastify.get('/api/githubrepos/', async (_, serverReply) => {
    const cachedResult = IS_DEBUG ? undefined : memoryCache.get(PAYLOAD_CACHE_KEY)
    serverReply.type('application/json')
    if(IS_DEBUG) {
        serverReply.header('Access-Control-Allow-Origin', '*')
    }
    if (cachedResult !== undefined) {
        serverReply.code(200).send(cachedResult)
    } else {
        githubClient.get(
            '/users/xfenix/repos',
            {per_page: HOW_MANY_REPOS, order: 'desc'},
            (error, status, originalPayload, _) => {
                if(!error && status == 200) {
                    const returnResult = originalPayload
                        .sort((a, b) => b.stargazers_count - a.stargazers_count)
                        .filter((oneItem) => !SKIP_REPOS.includes(oneItem.name))
                        .map((oldItem) => {
                            const newItem = {};
                            for (let oneField of NECESSARY_FIELDS) {
                                newItem[oneField] = oldItem[oneField];
                            }
                            return newItem;
                        });
                    memoryCache.set(PAYLOAD_CACHE_KEY, returnResult)
                    serverReply.code(200).send(returnResult)
                } else {
                    serverReply.code(500).send({'error': error})
                }
            }
        )
    }
    await serverReply
})

fastify.listen(PORT, (err, address) => {
    if (err) throw err
    fastify.log.info(`server listening on ${address}`)
})
