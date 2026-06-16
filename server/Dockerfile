# ─────────────────────────────────────────────────────────────────
# Stage 1: Dependencies
# ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
LABEL maintainer="Stock Platform Team"

WORKDIR /app

# Copy package files first (layer caching optimization)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# ─────────────────────────────────────────────────────────────────
# Stage 2: Production Image
# ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Install dumb-init for proper PID 1 handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeapp -u 1001 -G nodejs

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps --chown=nodeapp:nodejs /app/node_modules ./node_modules

# Copy application source
COPY --chown=nodeapp:nodejs . .

# Create logs directory
RUN mkdir -p logs && chown nodeapp:nodejs logs

# Switch to non-root user
USER nodeapp

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
