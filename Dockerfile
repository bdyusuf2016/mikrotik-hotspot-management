FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/backend/package*.json ./apps/backend/

RUN npm install

COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

RUN npm run build:backend

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/backend/package*.json ./apps/backend/

RUN npm install --omit=dev

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

CMD ["node", "apps/backend/dist/server.js"]
