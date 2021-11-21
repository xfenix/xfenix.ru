FROM node:17.0.1 as builder
WORKDIR /tmp/
RUN mkdir -p /tmp/src/build/.well-known/
COPY . .
RUN npm i
RUN npx gulp build


FROM nginx:1.21.3-alpine as runtime
WORKDIR /srv/www
COPY nginx.conf /etc/nginx
COPY --chown=nginx:nginx --from=builder /tmp/src/build ./
