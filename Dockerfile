FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_APP_NAME must be available at build time (Vite bakes it into the bundle)
ARG VITE_APP_NAME
ENV VITE_APP_NAME=${VITE_APP_NAME}

# Single MIN_STAY value — mapped to VITE_MIN_STAY so Vite picks it up at build time
ARG MIN_STAY=2
ENV VITE_MIN_STAY=${MIN_STAY}

# Build the Vue frontend
RUN npm run build

EXPOSE 3001

CMD ["npx", "tsx", "backend/index.ts"]
