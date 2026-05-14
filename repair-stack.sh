#!/bin/bash
echo "🛠️  STARTING TSM UNIVERSAL REPAIR..."

# 1. Update Dockerfile to be Bulletproof
cat <<'DOCKER' > Dockerfile
FROM node:20-alpine
RUN apk add --no-cache bash
WORKDIR /app
COPY package*.json ./
RUN npm install
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
DOCKER

# 2. Fix fly.toml Port Mapping (Common crash cause)
if [ -f "fly.toml" ]; then
    sed -i 's/internal_port = .*/internal_port = 8080/g' fly.toml
fi

# 3. Clean up any local entrypoint.sh that might be blocking the build
rm -f entrypoint.sh

# 4. Trigger Nuclear Deploy
echo "🚀 Deploying with Cache-Bust..."
fly deploy --remote-only --no-cache --strategy rolling

echo "✅ Repair Attempt Complete."
