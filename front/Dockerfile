FROM node:22-alpine AS builder
WORKDIR /tmp/
RUN mkdir -p /tmp/src/build/.well-known/
COPY . .
RUN npm i
RUN npx gulp build


# macbre/nginx-http3 ships nginx with HTTP/3, brotli and zstd compiled in
# (statically -- no load_module needed). Saves us compiling ngx_brotli ourselves.
FROM macbre/nginx-http3:latest AS runtime
# macbre sets USER nginx; revert to root so the master can bind :443 (TCP+UDP).
# Workers still drop to the unprivileged user via `user nginx;` in nginx.conf.
USER root
ENV WORKDIR=/srv/www
WORKDIR $WORKDIR
COPY nginx.conf /etc/nginx
COPY --chown=nginx:nginx --from=builder /tmp/src/build ./
# RUN mkdir -p /srv/letsencrypt && chown -R nginx:nginx /srv/letsencrypt &&\
#     chown -R nginx:nginx $WORKDIR && chmod -R 755 $WORKDIR && \
#     chown -R nginx:nginx /var/cache/nginx && \
#     chown -R nginx:nginx /etc/nginx/
# USER nginx
