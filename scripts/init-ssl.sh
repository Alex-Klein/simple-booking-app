#!/bin/sh
# ---------------------------------------------------------------------------
# init-ssl.sh — First-time SSL certificate issuance via Let's Encrypt
#
# Run this ONCE on a fresh server before starting the full nginx stack.
# Your domain must already point to this server's IP.
#
# Usage:
#   chmod +x scripts/init-ssl.sh
#   ./scripts/init-ssl.sh
# ---------------------------------------------------------------------------

set -e

# Load DOMAIN and CERTBOT_EMAIL from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | grep -E '^(DOMAIN|CERTBOT_EMAIL)=' | xargs)
fi

if [ -z "$DOMAIN" ]; then
  echo "ERROR: DOMAIN is not set. Add DOMAIN=yourcabin.com to your .env file."
  exit 1
fi

if [ -z "$CERTBOT_EMAIL" ]; then
  echo "ERROR: CERTBOT_EMAIL is not set. Add CERTBOT_EMAIL=you@example.com to your .env file."
  exit 1
fi

echo "Requesting certificate for: $DOMAIN"
echo "Notification email:         $CERTBOT_EMAIL"
echo ""

# Create the webroot directory certbot will write its challenge files to
mkdir -p ./data/certbot/www
mkdir -p ./data/certbot/conf

# Step 1 — Start nginx in HTTP-only mode so certbot can complete the challenge.
#           We use a temporary inline config that only serves the ACME path.
docker run --rm -d \
  --name tmp-nginx \
  -p 80:80 \
  -v "$(pwd)/data/certbot/www:/var/www/certbot" \
  nginx:alpine \
  sh -c "mkdir -p /etc/nginx/conf.d && printf 'server { listen 80; location /.well-known/acme-challenge/ { root /var/www/certbot; } location / { return 200 \"ok\"; } }' > /etc/nginx/conf.d/default.conf && nginx -g \"daemon off;\""

echo "Temporary nginx started. Requesting certificate..."

# Step 2 — Run certbot to obtain the certificate
docker run --rm \
  -v "$(pwd)/data/certbot/www:/var/www/certbot" \
  -v "$(pwd)/data/certbot/conf:/etc/letsencrypt" \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$CERTBOT_EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN"

# Step 3 — Stop the temporary nginx
docker stop tmp-nginx

echo ""
echo "Certificate issued successfully!"
echo "You can now start the full stack:"
echo "  docker compose -f docker-compose.yml up -d --build"
