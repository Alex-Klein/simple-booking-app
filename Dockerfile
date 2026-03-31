FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build the Vue frontend
RUN npm run build

EXPOSE 3001

CMD ["npx", "tsx", "backend/index.ts"]
