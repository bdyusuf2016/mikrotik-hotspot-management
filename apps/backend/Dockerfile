# ---- Build Stage ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY apps/backend/package*.json ./
RUN npm ci --omit=dev
COPY apps/backend/ .
# Install TypeScript and compile
RUN npm install -g ts-node typescript && tsc -p tsconfig.json

# ---- Runtime Stage ----
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 4000
ENV NODE_ENV=production
CMD ["node", "dist/src/main.js"]
