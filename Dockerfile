# Build and serve stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port 80
EXPOSE 80

# Start serve
CMD ["npx", "serve", "-s", "dist", "-l", "80"]
