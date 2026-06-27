FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

ARG CACHE_BUST=1
COPY . .

ENV NODE_PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
