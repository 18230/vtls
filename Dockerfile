FROM ghcr.io/xtls/xray-core:latest AS xray

FROM node:22-alpine

COPY --from=xray /usr/local/bin/xray /usr/local/bin/xray
COPY --from=xray /usr/local/share/xray /usr/local/share/xray
COPY entrypoint.sh /entrypoint.sh
COPY server.js /server.js
RUN chmod +x /entrypoint.sh

EXPOSE 8080

CMD ["/entrypoint.sh"]
