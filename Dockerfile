FROM node:24.22.3-alpine AS base

RUN npm install --global npm@11.19.1

FROM base AS builder

WORKDIR /usr/src/nuxt-app

ARG VERSION

# Copy necessary files
COPY package*.json ./
RUN npm ci

# Copy the rest of the app & build
COPY . .
# The cached install ran prepare before the app/config existed. Regenerate its types.
RUN npm exec nuxt prepare && npm run check


FROM base AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0

COPY --from=builder /usr/src/nuxt-app/.output  ./

USER node

EXPOSE 3000

CMD [ "node", "server/index.mjs" ]