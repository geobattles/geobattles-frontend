FROM node:24.22.3-alpine

RUN apk add --no-cache bash git openssh-client \
    && npm install --global npm@11.19.1

USER node
CMD ["sleep", "infinity"]
