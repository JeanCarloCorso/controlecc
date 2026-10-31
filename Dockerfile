FROM node:20.18.0-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20.18.0-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_RECAPTCHA_SITE
ENV NEXT_PUBLIC_RECAPTCHA_SITE=$NEXT_PUBLIC_RECAPTCHA_SITE
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20.18.0-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache libstdc++
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
USER node
EXPOSE 3000
CMD ["npm", "start"]
