# Build stage
FROM node:22-slim AS builder

WORKDIR /app

# Copy package files and npmrc for registry config
COPY package*.json ./
COPY .npmrc ./

# Install dependencies using JFrog Artifactory
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage with gcloud and kubectl
FROM node:22-slim AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=2999
ENV HOSTNAME=0.0.0.0

# Install dependencies for gcloud SDK
RUN apt-get update && apt-get install -y \
    curl \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Install gcloud SDK
RUN echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | \
    tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | \
    gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg && \
    apt-get update && \
    apt-get install -y google-cloud-sdk google-cloud-sdk-gke-gcloud-auth-plugin && \
    rm -rf /var/lib/apt/lists/*

# Install kubectl
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
    chmod +x kubectl && \
    mv kubectl /usr/local/bin/

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./
COPY --from=builder --chown=nextjs:nodejs /app/config.json ./config.json
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/.npmrc ./

# Install production dependencies only using JFrog Artifactory
RUN npm install --only=production

# Create data directories with proper permissions
RUN mkdir -p data/secrets data/attachments data/cache && \
    chown -R nextjs:nodejs data

# Create .kube directory for kubectl config
RUN mkdir -p /home/nextjs/.kube && \
    chown -R nextjs:nodejs /home/nextjs/.kube

# Create .config directory for gcloud config
RUN mkdir -p /home/nextjs/.config/gcloud && \
    chown -R nextjs:nodejs /home/nextjs/.config/gcloud

# Switch to non-root user
USER nextjs

# Expose port 2999
EXPOSE 2999

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:2999', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application with next start
CMD ["npm", "start"]
