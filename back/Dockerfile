FROM node:20.8.0-alpine

WORKDIR /srv/www
COPY . .
# RUN apt-get update -y
# RUN apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
RUN npm i
RUN npm run build-prod
RUN mv package.json build/
RUN mv build/ ../
RUN rm -rf *
RUN mv ../build/ .
RUN rm -rf src/
USER node
CMD ["npm", "start"]
