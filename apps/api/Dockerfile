FROM node:22-alpine

RUN apk add --no-cache git openssh-client && \
    mkdir -p -m 0700 ~/.ssh && ssh-keyscan github.com >> ~/.ssh/known_hosts

WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

RUN --mount=type=secret,id=ssh_key \
    --mount=type=secret,id=npm_token \
    eval $(ssh-agent -s) && \
    [ -f /run/secrets/ssh_key ] && ssh-add /run/secrets/ssh_key || true && \
    [ -f /run/secrets/npm_token ] && echo "//registry.npmjs.org/:_authToken=$(cat /run/secrets/npm_token)" > ~/.npmrc || true && \
    npm ci && \
    rm -f ~/.npmrc

COPY . .

RUN npx turbo run build --filter=api

RUN npm prune --omit=dev

ENV NODE_ENV=production
EXPOSE 4000

CMD sh -c "cd apps/api && npm run start:prod"