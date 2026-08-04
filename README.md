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
```

### Environment Variables (Optional)

Create a `.env` file if you need custom settings:

```env
# Database path (optional, defaults to ./data/madcow.db)
DB_PATH=./data/madcow.db

# Server port (optional, defaults to 3000)
PORT=3000
```

**Note:** This app has no authentication. It's designed for private networks (Tailscale, home LAN). Keep it on a trusted network only.

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

## Self-Hosting with Tailscale (Recommended)

Tailscale creates a secure private network between your devices. Your phone and server both join the Tailscale network, and you access the app via your private Tailscale hostname — no public exposure, no auth needed.

### Setup

1. **Install Tailscale** on both your server and phone:
   - Server: https://tailscale.com/download
   - Phone: Install the Tailscale app from your app store

2. **Connect both devices:**
   ```bash
   # On server
   sudo tailscale up
   ```
   Sign in with the same account on your phone.

3. **Build and run the app:**
   ```bash
   npm run build
   PORT=3000 npm start
   ```

4. **Access from your phone:**
   - Via MagicDNS: `http://<server-hostname>:3000`
   - Via Tailscale IP: `http://100.x.y.z:3000`
   
   Find your server's hostname/IP with `tailscale status` on the server.

5. **Optional - HTTPS on Tailnet:**
   ```bash
   tailscale serve https / http://127.0.0.1:3000
   ```
   Then access via `https://<server-hostname>`

### systemd Service (Auto-start on boot)

Create `/etc/systemd/system/madcow-tracker.service`:

```ini
[Unit]
Description=Madcow 5x5 Tracker
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/home/youruser/madcow-tracker
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable madcow-tracker
sudo systemctl start madcow-tracker
```

## Alternative: Local LAN Only

If you don't use Tailscale, you can run it on your home network. The app binds to all interfaces by default, so any device on your LAN can reach it at `http://<server-ip>:3000`.

**Security warning:** Without Tailscale or auth, anyone on your network can modify your workout data. Tailscale is recommended.

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

## Security

**No authentication by design.** This app is meant for private networks only (Tailscale, home LAN). Anyone who can reach the server can use the app.

**Recommendations:**
- Use Tailscale for secure private access
- Never expose port 3000 to the public internet
- Keep backups of your `data/` directory

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
│   ├── exercises/         # Exercise management page
│   ├── layout.tsx         # Root layout with bottom nav
│   └── page.tsx           # Today/home page (interactive log)
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── today-workout.tsx # Interactive workout log component
├── lib/                   # Core logic
│   ├── db.ts             # Database schema & connection
│   ├── madcow.ts         # Progression logic
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
