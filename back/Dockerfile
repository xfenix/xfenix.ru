FROM node:20.8.0-alpine as builder
# possibly for future usage
# RUN apt-get update -y
# RUN apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
WORKDIR /srv/www
COPY . .
RUN npm i
RUN npm run build-prod

FROM node:20.8.0-alpine
WORKDIR /srv/www
COPY --chown=node:node --from=builder /srv/www/build/ ./
RUN npm i --omit=dev
USER node
CMD ["npm", "start"]
