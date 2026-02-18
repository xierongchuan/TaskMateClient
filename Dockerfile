# Multi-stage build for React + Vite app

# Stage 1: Build the application
FROM docker.io/library/node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Accept build-time arguments for Vite environment variables
# These will be embedded into the built JavaScript at build time
ARG VITE_API_BASE_URL=http://localhost:8007/api/v1
ARG VITE_APP_NAME=TaskMate

# Set as environment variable so Vite can access it during build
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_APP_NAME=${VITE_APP_NAME}

# Build the application
RUN npm run build

# Stage 2: Serve the application with nginx
FROM docker.io/library/nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration for SPA routing support
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
