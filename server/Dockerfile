FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY server/package.json ./server/package.json
RUN npm install --omit=dev --prefix server

FROM node:22-bookworm-slim
ENV NODE_ENV=production
ENV PORT=80
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends libcap2-bin \
  && setcap cap_net_bind_service=+ep /usr/local/bin/node \
  && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/server/node_modules ./server/node_modules
COPY worker ./worker
COPY server ./server
RUN mkdir -p /app/server/data && chown -R node:node /app
USER node
EXPOSE 80
CMD ["node", "server/index.js"]
