FROM node:20.10.0 as builder
WORKDIR /tmp/
RUN mkdir -p /tmp/src/build/.well-known/
COPY . .
RUN npm i
RUN npx gulp build


FROM nginx:1.29.0-alpine as runtime
ENV WORKDIR=/srv/www
WORKDIR $WORKDIR
COPY nginx.conf /etc/nginx
COPY --chown=nginx:nginx --from=builder /tmp/src/build ./
# RUN mkdir -p /srv/letsencrypt && chown -R nginx:nginx /srv/letsencrypt &&\
#     chown -R nginx:nginx $WORKDIR && chmod -R 755 $WORKDIR && \
#     chown -R nginx:nginx /var/cache/nginx && \
#     chown -R nginx:nginx /etc/nginx/
# USER nginx
