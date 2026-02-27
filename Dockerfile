# Stage 1: Build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL


# Install build dependencies
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@10.28.0

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --no-frozen-lockfile

COPY . .

RUN npx prisma generate && npx prisma db push
RUN pnpm run build
RUN npx prisma migrate deploy

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN npm install -g pnpm@10.28.0

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma 

EXPOSE 5000

CMD ["npm", "run", "start"]