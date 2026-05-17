# Stage 1: Build Angular app
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve with Apache
FROM httpd:2.4

COPY --from=builder /app/dist/lifegoals/browser/ /usr/local/apache2/htdocs/
RUN printf '%s\n' '<Directory "/usr/local/apache2/htdocs">' '  FallbackResource /index.html' '</Directory>' > /usr/local/apache2/conf/extra/spa.conf && \
    printf '%s\n' 'Include conf/extra/spa.conf' >> /usr/local/apache2/conf/httpd.conf

RUN cat > /usr/local/bin/docker-entrypoint.sh <<'EOF'
#!/bin/sh
set -eu

sanitize() {
    printf '%s' "$1" | sed -e "s/^[\"']*//" -e "s/[\"']*,*$//"
}

cat > /usr/local/apache2/htdocs/runtime-env.js <<EOF_RUNTIME
window.__env = {
    apiKey: "$(sanitize "${API_KEY:-}")",
    authDomain: "$(sanitize "${AUTH_DOMAIN:-}")",
    projectId: "$(sanitize "${PROJECT_ID:-}")",
    storageBucket: "$(sanitize "${STORAGE_BUCKET:-}")",
    messagingSenderId: "$(sanitize "${MESSAGING_SENDER_ID:-}")",
    appId: "$(sanitize "${APP_ID:-}")"
};
EOF_RUNTIME

exec httpd-foreground
EOF

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

CMD ["/usr/local/bin/docker-entrypoint.sh"]