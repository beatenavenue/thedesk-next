# syntax=docker/dockerfile:1

# Build container for TheDesk (Linux x64 packages: zip and deb)
#
# Usage:
#   docker build --platform linux/amd64 --output type=local,dest=dist .
#
# The zip and deb files are written to ./dist on the host.

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-bookworm AS build
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1 \
	COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable

# Install dependencies first, so this layer is reused until the lockfile changes.
# The Electron binary is not needed for packaging (electron-builder downloads its own copy).
COPY package.json pnpm-lock.yaml .npmrc ./
RUN --mount=type=cache,id=thedesk-pnpm-store,target=/pnpm/store \
	ELECTRON_SKIP_BINARY_DOWNLOAD=1 pnpm install --frozen-lockfile --store-dir /pnpm/store

COPY . .
RUN pnpm run build

RUN --mount=type=cache,id=thedesk-electron,target=/root/.cache/electron \
	--mount=type=cache,id=thedesk-electron-builder,target=/root/.cache/electron-builder \
	pnpm run pack:linux --publish never

# Only the packages are exported with "docker build --output".
FROM scratch AS artifacts
COPY --from=build /app/dist/*.zip /app/dist/*.deb /
