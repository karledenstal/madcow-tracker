# Madcow 5x5 Tracker

A mobile-first web app for tracking your Madcow 5x5 workouts. Built with Next.js, TypeScript, and SQLite.

## Features

- **Flexible scheduling**: Workouts progress through Volume (A) → Light (B) → Intensity (C) automatically
- **Smart weight suggestions**: Auto-calculates next weights (+2.5 kg progression)
- **Deload tracking**: Automatic deload week every 4th cycle
- **Exercise history**: View progression charts and logs for each exercise
- **Custom exercises**: Add your own exercises to track alongside the core Madcow lifts
- **Mobile-first**: Optimized for phone use with bottom navigation and large touch targets
- **Dark mode only**: Easy on the eyes during gym sessions
- **PWA support**: Install to home screen for app-like experience

## Madcow 5x5 Structure

- **Volume Day (A)**: Squat 5x5, Bench Press 5x5, Barbell Row 5x5
- **Light Day (B)**: Squat 4x5 @ 50% of last Volume, Overhead Press 5x5, Deadlift 1x5
- **Intensity Day (C)**: Squat 5x5, Bench Press 5x5, Barbell Row 5x5

Progression: Add 2.5 kg to top sets each cycle. Deload every 4 cycles (~85% of normal weight).

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **node:sqlite** (built-in, no native compilation)
- **Tailwind CSS v4**
- **shadcn/ui** components

## Getting Started

### Prerequisites

- Node.js 22+ (for stable `node:sqlite`)
- npm

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd madcow-tracker

# Install dependencies
npm install

# Set environment variables (optional)
cp .env.example .env
# Edit .env and set APP_TOKEN for authentication
```

### Environment Variables

Create a `.env` file:

```env
# Optional: Set a token for API authentication
# If not set, authentication is disabled (development only)
APP_TOKEN=your-secret-token-here

# Optional: Custom database path
# Default: ./data/madcow.db
DB_PATH=./data/madcow.db

# Port (default: 3000)
PORT=3000
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# Build the app
npm run build

# Start the production server
npm start
```

The app will be available at `http://localhost:3000` (or your configured PORT).

## Self-Hosting

### Option 1: Direct Node.js

```bash
# Build
npm run build

# Set environment variables
export APP_TOKEN="your-secret-token"
export PORT=3000

# Start
npm start
```

### Option 2: systemd Service

Create `/etc/systemd/system/madcow-tracker.service`:

```ini
[Unit]
Description=Madcow 5x5 Tracker
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/madcow-tracker
Environment="NODE_ENV=production"
Environment="PORT=3000"
Environment="APP_TOKEN=your-secret-token-here"
ExecStart=/usr/bin/node /var/www/madcow-tracker/.next/standalone/server.js
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable madcow-tracker
sudo systemctl start madcow-tracker
sudo systemctl status madcow-tracker
```

### Option 3: Docker (Coming Soon)

A Dockerfile will be added in a future update.

### Reverse Proxy (Recommended)

Use nginx or Caddy to proxy to the app and add HTTPS:

**nginx example:**

```nginx
server {
    listen 80;
    server_name workout.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then add HTTPS with Let's Encrypt:

```bash
sudo certbot --nginx -d workout.yourdomain.com
```

## Database

- SQLite database stored at `./data/madcow.db` (configurable via `DB_PATH`)
- Schema automatically migrated on first run
- Default exercises (Squat, Bench, Row, OHP, Deadlift) seeded automatically
- Backup: just copy the `data/` directory

### Manual Backup

```bash
# Backup
cp -r data data-backup-$(date +%Y%m%d)

# Restore
cp -r data-backup-20260804/madcow.db data/
```

## Authentication

Set `APP_TOKEN` in your environment. The app requires this token for all API requests.

On first visit, you'll be prompted to enter the token. It's stored in browser localStorage.

**Security notes:**
- Use a strong random token (e.g., `openssl rand -hex 32`)
- Always use HTTPS in production
- This is single-user auth; not suitable for multi-user deployments

## Development

### Run Tests

```bash
npm test
```

Tests cover the Madcow progression logic (weight calculations, cycle progression, deload timing).

### Project Structure

```
madcow-tracker/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── history/           # History page
│   ├── log/               # Log workout page
│   ├── exercises/         # Exercise management page
│   ├── layout.tsx         # Root layout with bottom nav
│   └── page.tsx           # Today/home page
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Core logic
│   ├── db.ts             # Database schema & connection
│   ├── madcow.ts         # Progression logic
│   ├── auth.ts           # Authentication
│   └── api/
│       └── client.ts     # Client-side API wrapper
├── data/                  # SQLite database (gitignored)
└── public/               # Static assets
```

## Roadmap / Future Enhancements

- [ ] Workout notes per session
- [ ] Export data to CSV/JSON
- [ ] Progressive web app offline mode
- [ ] Graphs with more detail (reps, volume tracking)
- [ ] Rest timer between sets
- [ ] Plate calculator (suggest bar loading)

## License

MIT

## Contributing

This is a personal project, but PRs are welcome!

## Acknowledgments

- Madcow 5x5 program by Bill Starr / Madcow
- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
