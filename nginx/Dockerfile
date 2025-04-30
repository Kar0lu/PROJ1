FROM nginx:stable-alpine

COPY default.conf /etc/nginx/conf.d/default.conf

RUN mkdir -p /www/static

COPY ./static/. /www/static