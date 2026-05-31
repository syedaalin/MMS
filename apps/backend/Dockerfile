# Stage 1: Build
FROM node:25-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

# Stage 2: Runtime
FROM node:25-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist

# SQLite storage directory (data.db will be placed here for persistence mounting)
RUN mkdir -p /app/data
ENV DATABASE_PATH=/app/data/data.db

EXPOSE 3000

CMD ["node", "dist/index.js"]
