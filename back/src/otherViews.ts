import { FastifyReply, FastifyRequest } from "fastify";

type RedirectRequest = FastifyRequest<{
  Querystring: { where: string };
}>;

export async function redirectSomewhere(
  request: RedirectRequest,
  serverReply: FastifyReply
) {
  const preparedWhere = request.query.where?.trim();
  if (preparedWhere) {
    serverReply.redirect(preparedWhere, 301);
  } else {
    serverReply.code(400).send("Not provided place where to redirect");
  }
  await serverReply;
}
