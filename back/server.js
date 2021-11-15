#!/usr/bin/env nodejs
require('dotenv').config();
// dont need to place it in env file - it will be bad decision for me
const IS_DEBUG = process.env.DEBUG ? true : false;
const CACHE_TIME = 3600 * 12;
const HOW_MANY_REPOS = 20;
const APP_PORT = process.env.APP_PORT ? process.env.APP_PORT : 8080;
const PAYLOAD_CACHE_KEY = 'githubpayload';
const NECESSARY_FIELDS = ['name', 'html_url', 'description', 'language', 'forks_count', 'stargazers_count']
const SKIP_REPOS = ['django-elfinderfs', 'django-haystack', 'django-media-manager',
    'django-search-hide', 'django-xflatpages', 'django-suit-sortable',
    'ionic-conference-app',];
const githubClient = require('octonode').client(process.env.GIT_API_KEY);
const memoryCacheClient = new (require( "node-cache" ))({stdTTL: CACHE_TIME});
const fastify = require('fastify')({ logger: true });
const closeGracefully = async (signal) => {
    console.log(`Received signal to terminate: ${signal}`)
    await fastify.close();
    process.exit();
};

fastify.get('/api/githubrepos/', async (_, serverReply) => {
    const cachedResult = IS_DEBUG ? undefined : memoryCacheClient.get(PAYLOAD_CACHE_KEY);
    serverReply.type('application/json');
    if(IS_DEBUG) {
        serverReply.header('Access-Control-Allow-Origin', '*');
    }
    if (cachedResult !== undefined) {
        serverReply.code(200).send(cachedResult);
    } else {
        githubClient.get(
            '/users/xfenix/repos',
            {per_page: HOW_MANY_REPOS, order: 'desc'},
            (error, status, originalPayload, _) => {
                if(!error && status === 200) {
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
                    memoryCacheClient.set(PAYLOAD_CACHE_KEY, returnResult);
                    serverReply.code(200).send(returnResult);
                } else {
                    serverReply.code(500).send({ 'error': error });
                }
            }
        )
    }
    await serverReply;
})

fastify.listen(APP_PORT, (err, address) => {
    if (err) throw err;
    fastify.log.info(`server listening on ${address}`);
})

process.on('SIGINT', closeGracefully)
process.on('SIGTERM', closeGracefully)
