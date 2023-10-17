FROM node:20.8.0-alpine

# possibly for future usage
# RUN apt-get update -y
# RUN apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
WORKDIR /srv/www
COPY . .
RUN npm i
USER node
CMD ["npm", "start"]
