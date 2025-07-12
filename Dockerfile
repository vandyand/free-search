FROM ghcr.io/puppeteer/puppeteer:latest

# Set working directory
WORKDIR /home/pptruser/app

USER root

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create database directory
RUN mkdir -p database && chown -R pptruser:pptruser /home/pptruser/app

USER pptruser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"] 