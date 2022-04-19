FROM node:17.9.0-alpine3.15

WORKDIR /srv/www
COPY . .
RUN npm i
USER node
CMD ["npm", "start"]
