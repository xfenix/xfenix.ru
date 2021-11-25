FROM node:17.1.0 as builder
WORKDIR /tmp/
RUN mkdir -p /tmp/src/build/.well-known/
COPY . .
RUN npm i
RUN npx gulp build


FROM nginx:1.21.4-alpine as runtime
ENV WORKDIR=/srv/www
WORKDIR $WORKDIR
COPY nginx.conf /etc/nginx
COPY --chown=nginx:nginx --from=builder /tmp/src/build ./
RUN mkdir -p /etc/letsencrypt/live/xfenix.ru && chown -R nginx:nginx /etc/letsencrypt/ &&\
    chown -R nginx:nginx $WORKDIR && chmod -R 755 $WORKDIR && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /etc/nginx/
USER nginx
