FROM node:20-slim

WORKDIR /app

# Copy package files first for Docker caching
COPY package.json package-lock.json ./

# Faster, deterministic install
RUN npm ci

# Copy application files
COPY . .

# Set production environment
ENV NODE_ENV=production

# Build Next.js app
RUN npm run build

# Expose app port
EXPOSE 3000

# Start application
CMD ["npm", "start"]