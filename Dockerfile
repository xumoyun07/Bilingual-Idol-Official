# =============================================================================
#  BILC - production-образ приложения (multi-stage)
#
#  Версии сверены с манифестом зависимостей, а не взяты «по умолчанию»:
#    package.json -> engines.node = "^20.19.0 || >=22.12.0" (требование vite 7)
#    Локально сборка проверена на Node 24.21.0 -> берём именно её.
#
#  Сборка: docker build -t bilc-app:local .
# =============================================================================

ARG NODE_VERSION=24.21.0-alpine

# -----------------------------------------------------------------------------
# Этап 1: установка ВСЕХ зависимостей (нужны для сборки клиента и сервера)
# -----------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.7.0 --activate

# Манифест + lock + конфиг pnpm копируются ДО исходников: любое изменение кода
# не инвалидирует слой установки зависимостей.
# pnpm-workspace.yaml обязателен: в нём allowBuilds для esbuild.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# --trust-lockfile: lockfile закоммичен и является доверенной базой; без флага
# pnpm 11 отклоняет его по политике minimumReleaseAge (33 свежих пакета).
RUN pnpm install --frozen-lockfile --trust-lockfile

# -----------------------------------------------------------------------------
# Этап 2: сборка (vite build + esbuild для сервера)
# -----------------------------------------------------------------------------
FROM deps AS build
WORKDIR /app
COPY . .
RUN pnpm run build

# -----------------------------------------------------------------------------
# Этап 3: только production-зависимости для рантайма
# -----------------------------------------------------------------------------
FROM deps AS prod-deps
WORKDIR /app
RUN pnpm install --frozen-lockfile --trust-lockfile --prod

# -----------------------------------------------------------------------------
# Этап 4: рантайм
#   esbuild собирает сервер с флагом --packages=external, поэтому node_modules
#   обязателен и в финальном образе.
# -----------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Точные пути соответствуют WORKDIR этапов выше.
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build     --chown=node:node /app/dist         ./dist
COPY --from=build     --chown=node:node /app/package.json ./package.json

# Непривилегированный пользователь: процесс не должен иметь прав root.
USER node
EXPOSE 3000

# Healthcheck приложения: тот же эндпоинт, что опрашивает scripts/monitor-dev.ts.
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
