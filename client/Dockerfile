# ThreatX React Frontend - Production Multi-Stage Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json ./client/

RUN npm ci --workspace=client

COPY client/ ./client/

WORKDIR /app/client
ENV VITE_API_URL=http://localhost:3001
ENV VITE_SOCKET_URL=http://localhost:3001
RUN npm run build

# Stage 2: Serve with lightweight static web server
FROM nginx:alpine AS runner

COPY --from=builder /app/client/dist /usr/share/nginx/html

# Custom nginx configuration for SPA client-side routing
RUN echo 'server { \
    listen 5173; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://server:3001; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
    } \
    location /socket.io/ { \
        proxy_pass http://server:3001; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
