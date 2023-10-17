#!/usr/bin/env node
import fastify from "fastify";
import fetchGitlabRepos from "./src/githubReposView.js";
// import makeSocialMediaImage from "./src/socialMediaView.js";
import { redirectSomewhere } from "./src/otherViews.js";
import * as config from "./src/config.js";

// some prepare routines
const myFastifyApp = fastify({ logger: true });
const closeGracefully = async (signal: string) => {
  console.log(`Received signal to terminate: ${signal}`);
  await myFastifyApp.close();
  process.exit();
};

// api routes
myFastifyApp.get("/api/githubrepos/", fetchGitlabRepos);
// myFastifyApp.get("/rpc/social-media-image/", makeSocialMediaImage);
// myFastifyApp.get("/rpc/read-counter/", storeReadCount);
myFastifyApp.get("/rpc/redirect/", redirectSomewhere);

// and other tech things
myFastifyApp
  .listen({ port: config.APP_PORT, host: "0.0.0.0" } as any)
  .then((address) => console.log(`server listening on ${address}`))
  .catch((err) => {
    console.log("Error starting server:", err);
    process.exit(1);
  });

process.on("SIGINT", closeGracefully);
process.on("SIGTERM", closeGracefully);
