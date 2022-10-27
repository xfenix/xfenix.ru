FROM node:19.0.0-alpine3.16

WORKDIR /srv/www
COPY . .
RUN npm i
USER node
CMD ["npm", "start"]
