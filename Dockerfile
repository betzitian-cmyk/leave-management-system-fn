# syntax = docker/dockerfile:1

ARG NODE_VERSION=22.13.1

# ─── Base ────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# ─── Build stage ─────────────────────────────────────────────────────────────
FROM base AS build

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY . .

ENV NEXT_PUBLIC_API_URL=https://hr-employees-management-bn.andasy.dev/api

RUN npx next build

# ─── Final image ─────────────────────────────────────────────────────────────
FROM base AS runner

LABEL andasy_launch_runtime="Next.js"

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

USER nextjs

ENV HOSTNAME=::
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]