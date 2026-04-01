#!/bin/sh
# ---------------------------------------------------------------------------
# renew-ssl.sh — Manual SSL certificate renewal
#
# Let's Encrypt certificates expire after 90 days. The certbot container in
# docker-compose.yml already attempts renewal every 12 hours automatically.
#
# Use this script only if you need to trigger a renewal manually, or to set up
# a cron job as a belt-and-suspenders fallback.
#
# Cron example (runs at 3am on the 1st and 15th of each month):
#   0 3 1,15 * * /path/to/simple-booking-app/scripts/renew-ssl.sh >> /var/log/cabin-renew.log 2>&1
# ---------------------------------------------------------------------------

set -e

cd "$(dirname "$0")/.."

echo "[$(date)] Starting certificate renewal..."

docker compose -f docker-compose.yml run --rm certbot renew

echo "[$(date)] Reloading nginx..."
docker compose -f docker-compose.yml exec nginx nginx -s reload

echo "[$(date)] Done."
