# Stage 1: Builder
FROM node:lts-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock if used)
COPY package.json ./
COPY package-lock.json ./
# If you use yarn, uncomment the next line and comment out the npm install line
# COPY yarn.lock ./

# Install all dependencies
RUN npm install
# If you use yarn, uncomment the next line and comment out the npm install line
# RUN yarn install

# Copy the rest of the application code
COPY . .

# Build the TypeScript project
RUN npm run build

# Stage 2: Runtime
FROM node:lts-alpine

WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock) for production dependencies
COPY package.json ./
COPY package-lock.json ./
# If you use yarn, uncomment the next line and comment out the npm install --omit=dev line
# COPY yarn.lock ./

# Install only production dependencies
RUN npm install --omit=dev
# If you use yarn, uncomment the next line and comment out the npm install --omit=dev line
# RUN yarn install --production

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the port the app runs on
# Default to 3000 if PORT environment variable is not set
ENV PORT 3000
EXPOSE ${PORT}

# Healthcheck
# Waits 10s for startup, then checks every 30s, times out after 5s, retries 3 times
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT}/events || exit 1

# Command to run the application
CMD ["node", "dist/index.js"]
