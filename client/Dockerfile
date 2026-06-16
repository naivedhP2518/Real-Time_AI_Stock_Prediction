# ─────────────────────────────────────────────────────────────────
# Stage 1: Build React App
# ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all deps (including dev for build)
RUN npm ci

# Copy source code
COPY . .

# Set build-time env vars
ARG VITE_API_URL=http://localhost:5000
ARG VITE_ML_URL=http://localhost:5001
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ML_URL=$VITE_ML_URL

# Build production bundle
RUN npm run build

# ─────────────────────────────────────────────────────────────────
# Stage 2: Serve with Nginx
# ─────────────────────────────────────────────────────────────────
FROM nginx:1.25-alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built React app
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S nginx-app && \
    adduser -S nginx-user -u 1001 -G nginx-app && \
    chown -R nginx-user:nginx-app /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost/index.html > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
