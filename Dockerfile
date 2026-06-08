FROM node:20-alpine
RUN apk add --no-cache bash
WORKDIR /app
COPY package*.json ./
RUN npm install
ARG CACHE_BUST=2
COPY . .
RUN printf '#!/bin/bash\n\
echo "--- Initializing TSM Suite Persistence ---"\n\
mkdir -p /app/data\n\
[ ! -f /app/data/bpo-tasks.json ] && echo "{\"tasks\":[]}" > /app/data/bpo-tasks.json\n\
[ ! -f /app/data/hc-strategist-memory.json ] && echo "{\"items\":[]}" > /app/data/hc-strategist-memory.json\n\
[ ! -f /app/data/wip-master.json ] && echo "{\"jobs\":[]}" > /app/data/wip-master.json\n\
echo "--- Starting Node Server ---"\n\
exec node server.js' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
ENV PORT=8080
EXPOSE 8080
