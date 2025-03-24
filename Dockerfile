FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript files
RUN npm run build

# Expose the port specified in the .env file (default: 3000)
EXPOSE 3000

# Run the application
CMD ["node", "dist/server.js"] 