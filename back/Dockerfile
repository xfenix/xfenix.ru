FROM node:17.1.0

WORKDIR /srv/www
COPY . .
RUN npm i
USER node
CMD ["npm", "start"]
