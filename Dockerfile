FROM nginx:alpine

# Injected at build time by deploy.sh — changes every deploy so the SW detects an update
ARG BUILD_DATE=latest

COPY . /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Stamp the version into sw.js (triggers SW update) and index.html (makes version readable without SW)
RUN sed -i "s/__BUILD_DATE__/${BUILD_DATE}/g" /usr/share/nginx/html/sw.js && \
    sed -i "s/__APP_VERSION__/steady-v1.0-${BUILD_DATE}/g" /usr/share/nginx/html/index.html

EXPOSE 80
