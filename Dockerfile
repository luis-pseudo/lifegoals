# Stage 1: Build Angular app with environment variables injected
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate environment.ts file from environment variables
RUN mkdir -p src/environments && \
    printf 'export const environment = {\n  production: true,\n  firebase: {\n    apiKey: "%s",\n    authDomain: "%s",\n    projectId: "%s",\n    storageBucket: "%s",\n    messagingSenderId: "%s",\n    appId: "%s"\n  }\n};\n' \
    "${API_KEY}" "${AUTH_DOMAIN}" "${PROJECT_ID}" "${STORAGE_BUCKET}" "${MESSAGING_SENDER_ID}" "${APP_ID}" > src/environments/environment.ts

# Build Angular app
RUN npm run build

# Stage 2: Serve with Apache
FROM httpd:2.4

COPY --from=builder /app/dist/lifegoals/browser/ /usr/local/apache2/htdocs/