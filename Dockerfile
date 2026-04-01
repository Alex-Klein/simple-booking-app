FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_APP_NAME must be available at build time (Vite bakes it into the bundle)
ARG VITE_APP_NAME
ENV VITE_APP_NAME=${VITE_APP_NAME}

# Build the Vue frontend
RUN npm run build

EXPOSE 3001

CMD ["npx", "tsx", "backend/index.ts"]
