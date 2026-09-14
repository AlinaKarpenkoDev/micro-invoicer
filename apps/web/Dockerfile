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

RUN --mount=type=secret,id=env_prod,target=.env.production \
    npx turbo run build --filter=web


ENV NODE_ENV=production
EXPOSE 3000

CMD sh -c "cd apps/web && npm run start -- --hostname 0.0.0.0 --port ${PORT:-3000}"