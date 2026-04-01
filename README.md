# Simple Booking App

A self-hosted booking system for a private cabin, chalet, or any shared space. Guests can browse availability, request a stay, and receive email confirmations. An admin reviews and approves or declines requests via a password-protected dashboard.

---

## Features

### For guests
- **Availability calendar** — color-coded per person, showing who has booked which dates; pending (unconfirmed) bookings are shown with a striped pattern so they are visually distinct
- **Multi-step booking form** — pick dates, fill in name, email, guest count and optional notes
- **Minimum stay** of 2 nights enforced on the frontend
- **Email notification** on submission — guests receive a "request received" email immediately, and a confirmation or decline email once the admin acts
- **Self-service cancellation** — every confirmation email contains a personal cancel link; no account needed
- **Trusted email allowlist** — email addresses listed in `TRUSTED_EMAILS` are auto-confirmed without admin review
- **Dark mode** support
- **English / German** interface (auto-detected, switchable)

### For admins
- **Password-protected dashboard** at `/admin`
- **Approve or decline** pending bookings; when declining, an optional reason can be entered and is included in the email sent to the guest
- **Edit or delete** any booking directly from the dashboard
- **Status badges** — bookings are shown as Pending (amber) or Confirmed (green)

### Technical
- Conflict detection — overlapping dates are rejected at the API level
- Email delivery via [Resend](https://resend.com)
- SQLite database — simple, zero-config, file-based
- JWT-based admin authentication (7-day tokens)

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3, Vite, Tailwind CSS, vue-i18n, Pinia, v-calendar |
| Backend | Node.js, Express 5, TypeScript (tsx) |
| Database | SQLite via better-sqlite3 |
| Email | Resend |
| Auth | JWT |

---

## Configuration

Create a `.env` file in the project root (never commit this — use `.env.example` as a template):

```env
# App name — appears in the UI, browser tab, and all outgoing emails.
# Both lines must be set to the same value. This is a technical requirement:
# the backend (Node.js) reads APP_NAME, and the frontend build tool (Vite)
# only exposes variables prefixed with VITE_ to the browser.
APP_NAME=My Cabin
VITE_APP_NAME=My Cabin

# Resend API key — get one at https://resend.com
RESEND_API_KEY=re_your_key_here

# Where admin notification emails are sent
ADMIN_EMAIL=admin@example.com

# The "from" address on all outgoing emails
FROM_EMAIL=noreply@yourcabin.com

# Password for the /admin dashboard
ADMIN_PASSWORD=changeme

# Secret used to sign JWT tokens
JWT_SECRET=change-this-to-a-long-random-string

# Public URL of the app — used to generate cancel links in emails
APP_URL=https://yourcabin.com

# Comma-separated list of email addresses that are auto-confirmed without admin approval
# Leave empty to require approval for everyone
TRUSTED_EMAILS=alice@example.com,bob@example.com
```

### Hero background image

Drop a `bg.jpg` into the `data/` folder — it is served automatically with no rebuild required. If no file is present, a default landscape photo is used as fallback.

- **Without Docker:** place the image at `data/bg.jpg` in the project root
- **With Docker:** place the image at `./data/bg.jpg` on the server (same folder as the database)

---

## Installation — without Docker

### Requirements
- Node.js 20+
- npm

### Development

```bash
git clone https://github.com/yourname/cabin-reserve.git
cd cabin-reserve
npm install
cp .env.example .env   # then fill in your values
npm run dev
```

The app is available at `http://localhost:5173`. The backend API runs on port 3001 and is proxied automatically by Vite.

### Production (on a server)

**1. Install dependencies and build the frontend:**
```bash
npm install
npm run build
```

**2. Start the backend with PM2:**
```bash
npm install -g pm2
NODE_ENV=production pm2 start --name cabin -- npx tsx backend/index.ts
pm2 save
pm2 startup   # follow the printed command to enable auto-start on reboot
```

**3. Configure Nginx** as a reverse proxy (`/etc/nginx/sites-available/cabin`):
```nginx
server {
    listen 80;
    server_name yourcabin.com;

    root /path/to/cabin-reserve/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
    }
}
```
```bash
ln -s /etc/nginx/sites-available/cabin /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

**4. HTTPS with Certbot (recommended):**
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d yourcabin.com
```

**Deploying updates:**
```bash
git pull
npm install       # only if dependencies changed
npm run build     # only if frontend changed
pm2 restart cabin
```

---

## Installation — with Docker

### Requirements
- Docker and Docker Compose

### First deploy

**1. Clone the repo on the server:**
```bash
mkdir ~/simple-booking-app
git clone (https://github.com/Alex-Klein/simple-booking-app.git ~/simple-booking-app
cd ~/simple-booking-app
```

**2. Create the `.env` file:**
```bash
nano .env   # fill in all variables from the Environment variables section above
```

**3. Build and start:**
```bash
docker compose up -d --build
```

The app is now running on port 80. The SQLite database is stored in a Docker volume (`cabin-data`) and is never affected by redeployments.

### Deploying updates

```bash
cd /srv/cabin
git pull
docker compose up -d --build
```

### Useful commands

```bash
# View logs
docker compose logs -f

# Stop the app
docker compose down

# Open a shell inside the container
docker compose exec app sh

# Backup the database
cp data/cabin.db data/cabin-backup-$(date +%Y%m%d).db
```

---

## Project structure

```
cabin-reserve/
├── backend/
│   ├── index.ts          # Express entry point
│   ├── db.ts             # SQLite schema and migrations
│   ├── email.ts          # Resend email functions
│   ├── middleware/
│   │   └── auth.ts       # JWT middleware
│   └── routes/
│       ├── auth.ts       # POST /api/auth/login
│       ├── bookings.ts   # Booking CRUD + approve/decline
│       └── cancel.ts     # Token-based self-service cancellation
├── src/
│   ├── views/
│   │   ├── HomeView.vue      # Hero image configured here
│   │   ├── BookView.vue      # Date picker + guest form
│   │   ├── ConfirmView.vue   # Review and submit
│   │   ├── CancelView.vue    # Self-service cancellation
│   │   ├── LoginView.vue
│   │   └── AdminView.vue     # Admin dashboard
│   ├── stores/
│   │   ├── booking.ts    # Booking state (Pinia)
│   │   └── auth.ts       # Auth state (Pinia)
│   └── i18n/
│       ├── en.ts
│       └── de.ts
├── Dockerfile
├── docker-compose.yml
├── .env.example          # Copy to .env and fill in your values
└── .env                  # Not committed
```

---

## Admin access

Navigate to `/login` and enter the password set in `ADMIN_PASSWORD`. The session lasts 7 days.
