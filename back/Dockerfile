FROM node:20.1.0-alpine3.17

WORKDIR /srv/www
COPY . .
RUN npm i
USER node
CMD ["npm", "start"]
