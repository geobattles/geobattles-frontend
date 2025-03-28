FROM node:22-alpine AS builder

WORKDIR /usr/src/nuxt-app

ARG VERSION

# Copy necessary files
COPY package*.json ./
RUN npm ci

# Copy the rest of the app & build
COPY . .
RUN npm run build


FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0

COPY --from=builder /usr/src/nuxt-app/.output  ./

EXPOSE 3000

CMD [ "node", "server/index.mjs" ]