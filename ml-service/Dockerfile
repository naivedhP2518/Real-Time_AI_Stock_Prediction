# ─────────────────────────────────────────────────────────────────
# Python Flask ML Service — Production Dockerfile
# ─────────────────────────────────────────────────────────────────
FROM python:3.11-slim AS production

LABEL maintainer="Stock Platform Team"
LABEL description="QUANTUMSTOCKS ML Forecasting Microservice"

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -g 1001 mlservice && \
    useradd -r -u 1001 -g mlservice mlapp

WORKDIR /app

# Copy requirements first (layer caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY --chown=mlapp:mlservice . .

# Create directories for model storage
RUN mkdir -p trained_models datasets && \
    chown -R mlapp:mlservice trained_models datasets

# Switch to non-root user
USER mlapp

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5001/ || exit 1

# Use Gunicorn for production WSGI serving
CMD ["python", "-m", "gunicorn", \
     "--bind", "0.0.0.0:5001", \
     "--workers", "2", \
     "--timeout", "120", \
     "--log-level", "info", \
     "app:app"]
