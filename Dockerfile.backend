FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY packages/ packages/
COPY apps/backend/ apps/backend/

RUN npm install
RUN npm run build:backend

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY package*.json ./
COPY packages/ packages/
COPY apps/backend/package*.json ./apps/backend/

RUN npm install --omit=dev

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

EXPOSE 4000

CMD ["node", "apps/backend/dist/server.js"]
