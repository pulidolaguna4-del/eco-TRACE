FROM node:22-slim

WORKDIR /app

# Prisma necesita OpenSSL
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

ENV NODE_ENV=production
ENV PRISMA_HIDE_UPDATE_MESSAGE=1
EXPOSE 8000

# Aplica migraciones pendientes y arranca la API
CMD ["sh", "-c", "node scripts/migrate.js && node src/server.js"]
