import { FastifyReply, FastifyRequest } from "fastify";
// import { open as openLmdb } from "lmdb";
// import * as config from "./config.js";

type RedirectRequest = FastifyRequest<{
  Querystring: { where: string };
}>;
// type StoreRequest = FastifyRequest<{
//   Querystring: { fullpath: string };
// }>;

// const lmdbHandler = openLmdb(config.READS_STORE_PATH, {});

// export async function storeReadCount(
//   request: StoreRequest,
//   serverReply: FastifyReply
// ) {
//   if (
//     !request.query.fullpath ||
//     !request.query.fullpath.startsWith("/") ||
//     request.query.fullpath.length < config.MIN_URL_FOR_READS_LENGTH
//   ) {
//     await serverReply.code(400).send("Not provided proper fullpath");
//   }
//   const preparedPath = request.query.fullpath
//     .substring(0, config.MAX_URL_FOR_READS_LENGTH)
//     .trim();
//   const previousCountRaw = parseInt(await lmdbHandler.get(preparedPath), 10);
//   const newCountValue = (isNaN(previousCountRaw) ? 0 : previousCountRaw) + 1;
//   await lmdbHandler.put(preparedPath, newCountValue);
//   serverReply.code(200).send({ count: newCountValue });
//   await serverReply;
// }

export async function redirectSomewhere(
  request: RedirectRequest,
  serverReply: FastifyReply
) {
  const preparedWhere = request.query.where.trim();
  if (preparedWhere) {
    serverReply.code(301).redirect(preparedWhere);
  } else {
    serverReply.code(400).send("Not provided place where to redirect");
  }
  await serverReply;
}
