# ---- Stage 1: Build ----
# Node is only a build tool here: it turns JSX into plain HTML/CSS/JS.
# Nothing from this stage runs in production.
FROM node:20-alpine AS build

WORKDIR /app

# package files first, so the dependency install layer stays cached and is
# only redone when dependencies actually change -- not on every source edit.
COPY package*.json ./

# `npm ci` rather than `npm install`: it installs exactly what package-lock.json
# pins and fails if the lockfile is out of sync, so an image built today matches
# one built next month. `npm install` may quietly resolve newer versions.
RUN npm ci

COPY . .

# Vite inlines VITE_* vars into the bundle at build time, so the backend URL has
# to be chosen HERE, not at container start. Left unset it falls back to
# localhost:8080, which is what docker compose needs. For a deployed image:
#   docker build --build-arg VITE_API_URL=https://your-backend.onrender.com .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---- Stage 2: Serve ----
# Nginx serves the built files. Node, npm and the source tree are all left
# behind in stage 1 -- production never "runs React".
FROM nginx:alpine

# Without this, client-side routes 404 on refresh. See the comments in nginx.conf.
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
