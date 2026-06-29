FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
ARG NEXT_PUBLIC_APP_ID
ARG NEXT_PUBLIC_APP_KEY
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_KNOWLEDGE_API_KEY
ARG NEXT_PUBLIC_KNOWLEDGE_BASE_ID
ENV NEXT_PUBLIC_APP_ID=${NEXT_PUBLIC_APP_ID}
ENV NEXT_PUBLIC_APP_KEY=${NEXT_PUBLIC_APP_KEY}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_KNOWLEDGE_API_KEY=${NEXT_PUBLIC_KNOWLEDGE_API_KEY}
ENV NEXT_PUBLIC_KNOWLEDGE_BASE_ID=${NEXT_PUBLIC_KNOWLEDGE_BASE_ID}
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
