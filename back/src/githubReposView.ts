import { FastifyReply, FastifyRequest } from "fastify";
import { Octokit } from "@octokit/rest";
import NodeCache from "node-cache";
import * as config from "./config.js";

const githubClient = new Octokit({
  auth: process.env.GIT_API_KEY,
});
const memoryCacheClient = new NodeCache({ stdTTL: config.CACHE_TIME });

export default async function fetchGitlabRepos(
  _: FastifyRequest,
  serverReply: FastifyReply
) {
  const cachedResult = config.IS_DEBUG
    ? undefined
    : memoryCacheClient.get(config.PAYLOAD_CACHE_KEY);
  serverReply.type("application/json");
  if (config.IS_DEBUG) {
    serverReply.header("Access-Control-Allow-Origin", "*");
  }
  if (cachedResult !== undefined) {
    serverReply.code(200).send(cachedResult);
  } else {
    const rawReposResponse = await githubClient.rest.repos.listForUser({
      username: config.MY_GITHUB_USERNAME,
      per_page: config.HOW_MANY_REPOS,
      direction: "desc",
    });
    const preparedResult = rawReposResponse.data
      .filter((oneItem) => !config.SKIP_REPOS.includes(oneItem.name))
      .map(
        ({
          name,
          html_url,
          description,
          language,
          forks_count,
          stargazers_count,
          ..._
        }) => ({
          name,
          html_url,
          description,
          language,
          forks_count,
          stargazers_count,
        })
      )
      .sort(
        (oneRepo, secondRepo) =>
          (secondRepo.stargazers_count ?? 0) - (oneRepo.stargazers_count ?? 0)
      );
    memoryCacheClient.set(config.PAYLOAD_CACHE_KEY, preparedResult);
    serverReply.code(200).send(preparedResult);
  }
  await serverReply;
}
