#!/usr/bin/env nodejs
require('dotenv').config()
const IS_DEBUG = process.env.DEBUG ? true : false
// dont need to place it in env file - it will be bad decision for me
const CACHE_TIME = 3600 * 24
const HOW_MANY_REPOS = 20
const PORT = 8080
const PAYLOAD_CACHE_KEY = 'githubpayload'
const NECESSARY_FIELDS = ['name', 'html_url', 'description', 'language', 'forks_count', 'stargazers_count']
const SKIP_REPOS = ['django-elfinderfs', 'django-haystack', 'django-media-manager',
                    'django-search-hide', 'django-xflatpages', 'django-suit-sortable',
                    'ionic-conference-app', ]
const githubClient = require('octonode').client(process.env.GITHUB_API_KEY)
const cache = require('node-file-cache').create()
const fastify = require('fastify')({logger: true})

fastify.get('/api/githubrepos/', async (_, serverReply) => {
    const cachedResult = IS_DEBUG ? false : cache.get(PAYLOAD_CACHE_KEY)
    serverReply.type('application/json')
    if(IS_DEBUG) {
        serverReply.header('Access-Control-Allow-Origin', '*')
    }
    if(cachedResult) {
        serverReply.code(200).send(cachedResult)
    } else {
        githubClient.get(
            '/users/xfenix/repos',
            {per_page: HOW_MANY_REPOS, order: 'desc'},
            (error, status, payload, _) => {
                if(!error && status == 200) {
                    let returnResult = payload
                    returnResult.sort(function(a, b) {
                        return b.stargazers_count - a.stargazers_count
                    })
                    returnResult = returnResult.filter((oneItem) => {
                        return !SKIP_REPOS.includes(oneItem.name)
                    })
                    returnResult = returnResult.map((oldItem) => {
                        let newItem = {};
                        for(let oneField of NECESSARY_FIELDS) {
                            newItem[oneField] = oldItem[oneField]
                        }
                        return newItem
                    })
                    cache.set(PAYLOAD_CACHE_KEY, returnResult, {'life': CACHE_TIME})
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
