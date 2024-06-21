FROM node:alpine AS deps

# Set working directory
WORKDIR /app

# Copy package.json to working directory
COPY package.json .
COPY yarn.lock .
COPY packages/nextjs/package.json ./packages/nextjs/package.json
COPY packages/hardhat/package.json ./packages/hardhat/package.json
COPY .yarnrc.yml .
COPY .yarn .yarn

# Install dependencies
RUN yarn install --frozen-lockfile

FROM node:alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/nextjs/node_modules ./packages/nextjs/node_modules

# Copy all files to working directory
COPY . .

RUN yarn prisma:generate
RUN yarn next:build

FROM node:alpine

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app

COPY --from=builder --chown=nextjs:nodejs /app/.yarnrc.yml /app
COPY --from=builder --chown=nextjs:nodejs /app/.yarn /app/.yarn
COPY --from=builder --chown=nextjs:nodejs /app/packages/nextjs/.next /app/packages/nextjs/.next
COPY --from=builder --chown=nextjs:nodejs /app/packages/nextjs/public /app/packages/nextjs/public
COPY --from=builder --chown=nextjs:nodejs /app/packages/nextjs/node_modules /app/packages/nextjs/node_modules
COPY --from=builder --chown=nextjs:nodejs /app/packages/nextjs/package.json /app/packages/nextjs
COPY --from=builder --chown=nextjs:nodejs /app/node_modules /app/node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json /app
COPY --from=builder --chown=nextjs:nodejs /app/yarn.lock /app

USER nextjs

EXPOSE 3000

CMD [ "yarn", "next:serve" ]
