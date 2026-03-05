# Dockerfile для NES Emulator

FROM oven/bun:1 AS base
WORKDIR /app

# Установка зависимостей
FROM base AS install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Генерация Prisma клиента
COPY prisma ./prisma
RUN bun run db:generate

# Сборка приложения
FROM base AS build
COPY --from=install /app/node_modules ./node_modules
COPY --from=install /app/prisma ./prisma
COPY . .
RUN bun run build

# Production образ
FROM base AS release
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

CMD ["bun", "server.js"]
