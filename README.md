# Steady — Grounding & Breathing PWA

A mobile-first, Progressive Web App that walks you through evidence-based grounding, breathing, and imagery exercises during moments of stress or emotional overwhelm. No account. No login. No app store. Just open the link and use it.

---

## What It Does

When you're overwhelmed, the hardest part is knowing where to start. Steady removes that barrier. It asks how stressed you are and which areas of your life feel most affected, then hands you a short, focused plan of exercises tailored to your answers.

The app guides you through each exercise — breathing animations, step-by-step prompts, visualization exercises, reflection questions — tracks your stress before and after, and shows a session summary when you're done. Everything stays on your device.

---

## How It Works

The app is a four-screen guided flow:

**1. Stress Check-In**
Pick a number from 1–10. You don't have to know why — just pick what feels closest. At levels 8–10, a gentle interstitial surfaces the 988 Lifeline as a non-clinical reminder.

**2. Wellness Dimensions**
Select which areas feel most affected right now:
- **Body** — tension, fatigue, sleep, physical discomfort
- **Mind** — racing thoughts, mental fog, rumination
- **Feelings** — fear, sadness, anger, or emotional overwhelm
- **Spirit** — loss of meaning, purpose, or inner peace

**3. Your Plan**
The app recommends tools based on your stress level and selected dimensions, weighted so the most relevant exercises surface first.

**4. Tool Experience**
Each tool has a unique guided experience:
- **Breathing tools** — animated visual timers (Box Breathing, Full Trunk Breathing)
- **Grounding tools** — sensory anchoring and body-awareness exercises
- **Imagery tools** — Safe Place Visualization, Mindfulness Check-In
- **Cognitive tools** — Growth Mindset Reframe, Name the Lie, Habit Loop Audit
- **Affirmation tools** — Mantra, Prayer Prompts
- **Lifestyle tools** — Sleep hygiene, Movement, Nutrition prompts

After each tool, you can check in on your stress level. The app tracks your progress from start to finish and shows a full session summary when you're done.

---

## The Tools

| Tool | Dimension | What it does |
|---|---|---|
| Box Breathing | Body | 4-count animated breathing cycle |
| Full Trunk Breathing | Body | Diaphragmatic breathing guide |
| Safe Place Visualization | Feelings | Guided imagery — build a calming mental space |
| 5-Senses Grounding | Mind / Body | Present-moment anchoring exercise |
| Mindfulness Check-In | Mind / Feelings | Notice and ride the emotional wave |
| Growth Mindset Reframe | Mind | Reframe a fixed-mindset thought |
| Habit Loop Audit | Mind | Identify cue / routine / reward patterns |
| Name the Lie | Feelings / Mind | Surface and challenge anxious self-talk |
| Gratitude | Feelings | Three-item guided gratitude prompt |
| Mantra / Affirmation | Spirit | Select or write a personal mantra |
| Prayer Prompts | Spirit | Guided prayer structure |
| Values Alignment | Spirit | Reconnect to what matters most |
| Sleep Hygiene | Body | Practical sleep reset checklist |
| Movement | Body | Short movement break guidance |
| Nutrition | Body | Eating tips to stabilize body and mood |

---

## Privacy

**Privacy is a core principle of this app — not an afterthought.**

- **No data collection.** The app does not collect, store, log, or transmit any personal information. Your stress levels, written responses, and session activity never leave your device.
- **Session-only.** All data lives only in your browser tab. Close or refresh the tab and everything is gone. Nothing is written to any server.
- **Optional demographic data stays local.** If you fill in the optional onboarding profile (name, age range, gender), it is stored in your device's `localStorage` only and is never transmitted.
- **Advertising.** A non-intrusive banner ad (Google AdSense) appears at the bottom of the screen to help keep the app free. The ad is hidden on the crisis/safety screen.

---

## Tech Stack

Pure HTML, CSS, and vanilla JavaScript. No frameworks, no build tools, no npm dependencies. The entire app is static files served by nginx inside a Docker container.

- **No server-side code** — no application server, no database, no API
- **Works fully offline** — once loaded, the app functions without an internet connection (via a Service Worker)
- **Installable** — can be added to the iOS or Android home screen and launched like a native app (PWA)
- **Auditable** — anyone can open DevTools and read every line of code the app runs

---

## Running with Docker

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed on your server

### Quick start

```bash
git clone https://github.com/gismc123/calm.git
cd calm
docker compose up -d
```

The app will be available at `http://localhost:906`.

### What the container does

The `Dockerfile` copies all static files into an `nginx:alpine` image and serves them on port 80. Docker Compose maps that to port `906` on the host.

```
Host port 906  →  Container port 80  →  nginx serves static files
```

To change the host port, edit `docker-compose.yml`:

```yaml
ports:
  - "906:80"   # change 906 to whatever port you want on the host
```

---

## Serving behind a reverse proxy (subdomain)

The container exposes port `906` on the host. A reverse proxy sitting in front routes your subdomain to that port.

### Nginx Proxy Manager (GUI)

1. Go to **Proxy Hosts → Add Proxy Host**
2. **Domain Names:** `steady.yourdomain.com`
3. **Scheme:** `http` · **Forward Hostname:** `localhost` · **Forward Port:** `906`
4. Enable **Block Common Exploits** and request an SSL certificate under the **SSL** tab

### Traefik (Docker label-based)

```yaml
services:
  steady-app:
    build: .
    container_name: steady-app
    restart: unless-stopped
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.calm.rule=Host(`steady.yourdomain.com`)"
      - "traefik.http.routers.calm.entrypoints=websecure"
      - "traefik.http.routers.calm.tls.certresolver=letsencrypt"
      - "traefik.http.services.calm.loadbalancer.server.port=80"
```

Remove the `ports` block — Traefik handles routing through the Docker network.

### Caddy

```
steady.yourdomain.com {
    reverse_proxy localhost:906
}
```

---

## Deploying updates

```bash
git pull
docker compose up -d --build
```

Or use the included `deploy.sh` script, which stamps a build date into the service worker (forcing clients to pick up fresh files) and optionally purges a Cloudflare cache:

```bash
./deploy.sh
```

Create a `.env` file from `.env.example` and fill in your Cloudflare credentials if you use that CDN.

---

## PWA / Install to Home Screen

- **Android (Chrome):** A banner appears on first visit. Tap **Install**.
- **iOS (Safari):** Tap the Share icon → **Add to Home Screen**.

Once installed, the app launches in standalone mode and works fully offline.

---

## File Structure

```
steady/
├── index.html          # App shell — all screens and modals
├── style.css           # All styles, CSS custom properties, three color themes
├── app.js              # Screen logic, tool timers, session state
├── i18n.js             # Internationalization module (English / Spanish)
├── manifest.json       # PWA manifest (icons, display mode, theme color)
├── sw.js               # Service worker — caches assets for offline use
├── locales/
│   ├── en.json         # English strings
│   └── es.json         # Spanish strings
├── Dockerfile          # nginx:alpine image, copies static files
├── docker-compose.yml  # Maps container port 80 to host port 906
├── nginx.conf          # Cache-control headers, SPA fallback routing
├── deploy.sh           # Build + deploy script with optional Cloudflare purge
├── .env.example        # Template for Cloudflare credentials
└── assets/
    ├── icon-192.png    # PWA icon (192×192)
    ├── icon-512.png    # PWA icon (512×512)
    └── icon-apple.png  # iOS touch icon (180×180)
```

---

## AdSense Setup

To activate advertising revenue, replace the placeholder publisher ID in two places:

1. `index.html` — the `<script>` tag in `<head>` and the `data-ad-client` attribute on the `<ins>` element
2. Replace `ca-pub-XXXXXXXXXXXXXXXXX` with your actual AdSense publisher ID

Look for `TODO` comments marking both locations.

---

## Legal

Steady is provided for personal wellness use only. It is not a medical service, mental health treatment, or clinical intervention. Nothing in this app constitutes medical advice, diagnosis, or treatment. If you are in crisis, please contact the **988 Suicide & Crisis Lifeline** (call or text 988).

The breathing, grounding, and imagery techniques in this app draw from widely-practiced methods in mindfulness, somatic therapy, and cognitive-behavioral approaches. These are established practices in the public domain — they are not proprietary.

© 2026 Steady.
