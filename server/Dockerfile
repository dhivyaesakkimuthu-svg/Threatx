# ThreatX Central API - Production Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and server package files for workspace resolution
COPY package.json package-lock.json ./
COPY server/package.json ./server/

# Install dependencies
RUN npm ci --workspace=server

# Copy server source code
COPY server/ ./server/

WORKDIR /app/server
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app/server

ENV NODE_ENV=production
ENV PORT=3001
ENV THREATX_VERSION=1.0.0

COPY --from=builder /app/package.json /app/package-lock.json ../
COPY --from=builder /app/server/package.json ./
COPY --from=builder /app/node_modules ../node_modules
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/src ./src

EXPOSE 3001

CMD ["node", "dist/index.js"]
