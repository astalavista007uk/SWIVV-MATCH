# Migrate from Supabase Cloud (Lovable-managed) → Self-hosted Supabase

This guide migrates the **schema** (tables, policies, triggers, storage buckets) from your Lovable-managed cloud project to a self-hosted Supabase instance you fully control.

**What gets migrated**: schema, enums, RLS policies, triggers, storage bucket definitions.
**What does NOT get migrated**: existing user accounts (passwords are bcrypt-hashed and locked in `auth.users`), uploaded files, table data. Users re-register; data is re-seeded from your demo scripts.

---

## Phase 1: Install prerequisites (one-time, ~15 min)

### 1.1 Install Docker Desktop for Windows

Download from https://www.docker.com/products/docker-desktop/ and install.

**Requirements:**
- Windows 10/11 64-bit
- WSL 2 enabled (Docker installer will prompt to enable it — accept)
- 8 GB RAM minimum (16 GB recommended)

After install:
1. Launch Docker Desktop
2. Wait until the whale icon in the system tray says "Docker Desktop is running"
3. Open PowerShell and verify:
   ```powershell
   docker --version
   docker compose version
   ```

### 1.2 Verify Supabase CLI

Already installed (v2.109.1). Verify:
```powershell
cmd /c "supabase --version"
```

If you ever need to update: `npm install -g supabase@latest`

---

## Phase 2: Start local self-hosted Supabase (~10 min)

### 2.1 Stop the existing `supabase/` folder from conflicting

Your project already has `supabase/config.toml` and `supabase/migrations/`. That's good — we'll reuse them. We just need to initialize the docker setup.

From the project root:
```powershell
cmd /c "supabase start"
```

This command:
- Pulls all Supabase Docker images (~2 GB download, one-time)
- Starts ~10 containers (Postgres, GoTrue, PostgREST, Realtime, Storage, Studio, Kong, Redis, etc.)
- Prints a list of local URLs and credentials when done

**Expected output:**
```
         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: <generated-anon-key>
service_role key: <generated-service-role-key>
```

**COPY THESE KEYS** — you'll need them for `.env`.

### 2.2 Open Studio to verify

Go to http://127.0.0.1:54323 — this is your local Supabase dashboard. You should see an empty database (no tables yet).

---

## Phase 3: Apply all migrations (~5 min)

### 3.1 Reset and apply every migration in order

From the project root:
```powershell
cmd /c "supabase db reset"
```

This command:
- Wipes the local DB clean
- Runs every file in `supabase/migrations/` in alphabetical order
- Seeds anything in `supabase/seed.sql` if present

**If any migration fails**, note the error and fix the migration file. Most failures are due to:
- Non-idempotent statements (e.g. `CREATE TABLE` without `IF NOT EXISTS`)
- `ALTER TYPE ADD VALUE` inside a transaction (rare in modern Supabase CLI)

### 3.2 Verify in Studio

Refresh http://127.0.0.1:54323 — you should now see:
- All 13+ tables under Table Editor
- Enums under Database → Enums
- Storage buckets under Storage
- RLS policies under Authentication → Policies

### 3.3 (Optional) Seed demo data

If you have demo seed scripts, run them via Studio SQL Editor or:
```powershell
cmd /c "supabase db execute --file supabase/seed.sql"
```

---

## Phase 4: Point your app at local Supabase (~2 min)

### 4.1 Update `.env`

Replace the contents of `.env` with the local instance credentials (use the keys printed by `supabase start`):

```env
SUPABASE_PROJECT_ID="local"
SUPABASE_URL="http://127.0.0.1:54321"
SUPABASE_PUBLISHABLE_KEY="<anon-key-from-start-output>"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key-from-start-output>"

VITE_SUPABASE_PROJECT_ID="local"
VITE_SUPABASE_URL="http://127.0.0.1:54321"
VITE_SUPABASE_PUBLISHABLE_KEY="<anon-key-from-start-output>"
```

**Important:** Restart your Vite dev server after changing `.env`:
```powershell
# Stop current dev server (Ctrl+C), then:
npm run dev
```

### 4.2 Test the app

1. Open the app at your dev URL (usually http://localhost:3000 or similar)
2. Sign up a new account — should work, confirmation email arrives in Inbucket (http://127.0.0.1:54324)
3. Try creating a Grooming service — should succeed
4. Try favoriting something — heart should save and persist after refresh
5. Open Studio (http://127.0.0.1:54323) to watch rows appear in real time

If everything works, you have a fully functional local Supabase. **Migration complete for development.**

---

## Phase 5: (Optional) Migrate existing data

Skip this if your cloud project has only test data. Only do this if you have real users/content you can't lose.

### 5.1 Export table data from cloud (via publishable key)

The publishable key can read most tables (RLS permitting). Write a Node script to dump each table:

```javascript
// scripts/export-cloud-data.js (create this if needed)
import { createClient } from '@supabase/supabase-js';

const OLD_URL = 'https://vzrxbbobjzprsfeaznqw.supabase.co';
const OLD_KEY = 'sb_publishable_coUrC9YulPTjYHX6jFgX2A_H4jpPYzC';

const old = createClient(OLD_URL, OLD_KEY);

const TABLES = ['profiles', 'services', 'pets', 'pet_listings', 'kb_articles'];

for (const t of TABLES) {
  const { data, error } = await old.from(t).select('*').limit(10000);
  if (error) { console.error(`${t}:`, error.message); continue; }
  const { writeFileSync } = await import('fs');
  writeFileSync(`./exports/${t}.json`, JSON.stringify(data, null, 2));
  console.log(`${t}: ${data.length} rows exported`);
}
```

### 5.2 Import into local self-hosted

```javascript
// scripts/import-local-data.js
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const NEW_URL = 'http://127.0.0.1:54321';
const NEW_KEY = '<service-role-key>';  // use service_role to bypass RLS

const local = createClient(NEW_URL, NEW_KEY);

for (const t of ['profiles', 'services', 'pets', 'pet_listings', 'kb_articles']) {
  const rows = JSON.parse(readFileSync(`./exports/${t}.json`, 'utf8'));
  const { error } = await local.from(t).insert(rows);
  if (error) console.error(`${t}:`, error.message);
  else console.log(`${t}: ${rows.length} rows imported`);
}
```

### 5.3 Storage files

For each public-URL file (pet-photos, service-photos, contact-attachments):
1. Download from `https://vzrxbbobjzprsfeaznqw.supabase.co/storage/v1/object/public/<bucket>/<path>`
2. Re-upload to local: `local.storage.from('<bucket>').upload(path, fileBlob)`

For avatars (signed URLs) — can't be exported in bulk. Skip.

---

## Phase 6: Deploy self-hosted Supabase to Hostinger VPS

When you're ready to go live on your own infrastructure:

### 6.1 Get a Hostinger VPS

Minimum **KVM 4** (4 GB RAM, ~$10/mo). Ubuntu 22.04 LTS.

### 6.2 Initial server setup

```bash
# SSH in, then:
apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh
apt install -y git ufw

# Firewall
ufw allow 22,80,443/tcp
ufw enable

# Create app directory
mkdir -p /opt/supabase && cd /opt/supabase
```

### 6.3 Clone the official self-hosted repo

```bash
git clone --depth 1 https://github.com/supabase/supabase.git /tmp/sb
cp -r /tmp/sb/docker/* /opt/supabase/
cd /opt/supabase
```

### 6.4 Configure environment

```bash
cp .env.example .env
# Edit .env — generate strong values for:
#   POSTGRES_PASSWORD, JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY
# Use https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys
# to generate keys that match your JWT_SECRET
nano .env
```

Set these critical values:
- `POSTGRES_PASSWORD` — strong random string
- `JWT_SECRET` — at least 32 chars, random
- `ANON_KEY`, `SERVICE_ROLE_KEY`, `DASHBOARD_USERNAME`, `DASHBOARD_PASSWORD` — generated from JWT_SECRET
- `SITE_URL` — your app's production URL
- `ADDITIONAL_REDIRECT_URLS` — your app's URL
- `SMTP_*` — your transactional email provider (Resend, SendGrid, etc.)

### 6.5 Start it

```bash
docker compose up -d
```

Wait ~2 minutes for all services to be healthy:
```bash
docker compose ps
```

### 6.6 Reverse proxy + SSL

Use Caddy (simplest):
```bash
apt install -y caddy
```

Edit `/etc/caddy/Caddyfile`:
```
supabase.yourdomain.com {
    reverse_proxy localhost:8000
}
```

Reload: `systemctl reload caddy`

SSL is automatic via Let's Encrypt.

### 6.7 Apply migrations on the VPS

```bash
# On the VPS, in /opt/supabase:
docker compose exec db psql -U postgres -c "CREATE SCHEMA IF NOT EXISTS supabase_migrations;"

# Upload your supabase/migrations/ folder to the VPS, then:
for f in /path/to/migrations/*.sql; do
  echo "Applying $f..."
  docker compose exec -T db psql -U postgres -f - < "$f"
done
```

### 6.8 Point your app at production

Update your deployed app's environment variables:
```
VITE_SUPABASE_URL=https://supabase.yourdomain.com
VITE_SUPABASE_PUBLISHABLE_KEY=<your-generated-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-generated-service-role-key>
```

Redeploy the app.

---

## Phase 7: Backup strategy (don't skip)

### 7.1 Daily DB backups via cron

On the VPS:
```bash
# Create backup script
cat > /opt/supabase/backup.sh <<'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker compose -f /opt/supabase/docker-compose.yml exec -T db \
  pg_dump -U postgres -Fc postgres > /backups/db_$DATE.dump
# Keep last 30 days
find /backups -mtime +30 -delete
EOF

chmod +x /opt/supabase/backup.sh
mkdir -p /backups

# Daily at 3 AM
crontab -e
# Add: 0 3 * * * /opt/supabase/backup.sh
```

### 7.2 Offsite copies

Sync `/backups` to Backblaze B2 / S3 / Dropbox weekly. (rclone makes this easy.)

---

## Quick reference — common commands

| Action | Command |
|---|---|
| Start local Supabase | `cmd /c "supabase start"` |
| Stop local Supabase | `cmd /c "supabase stop"` |
| View status | `cmd /c "supabase status"` |
| Reset DB + apply all migrations | `cmd /c "supabase db reset"` |
| Apply new migration only | `cmd /c "supabase db push"` |
| Open Studio | http://127.0.0.1:54323 |
| View auth emails (local) | http://127.0.0.1:54324 |
| Connect to DB directly | `psql -h 127.0.0.1 -p 54322 -U postgres` (password: `postgres`) |

---

## When to ask for help

Stop and ask if:
- `supabase start` fails — paste the error
- Any migration fails on `db reset` — paste the failing SQL + error
- App can't connect after `.env` update — check the URL is exactly `http://127.0.0.1:54321` (not `localhost`)
- Realtime subscriptions don't work locally — usually a CORS issue, fixable in `supabase/config.toml`
