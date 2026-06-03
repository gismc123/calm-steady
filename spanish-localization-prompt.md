# Spanish Localization — Claude Code Prompt

> Review this file before pasting into Claude Code.
> When ready, copy everything under the horizontal rule below and paste it as a prompt.

---

## Goal
Add a full Spanish (es) translation to this PWA ("Calm Down") so Spanish-speaking
users can use the app in their language. English stays the default. Whenever English
content changes, a local script using Ollama detects the drift and updates the
Spanish files automatically — no paid API keys, no external services.

---

## Project context

This is a plain static PWA with no build system or bundler:
- `index.html` — all UI markup, English strings hardcoded
- `app.js` — all app logic, additional English strings hardcoded
- `style.css` — styles (do not change unless layout breaks for Spanish text)
- `sw.js` — service worker
- `manifest.json` — PWA manifest
- Served by nginx inside Docker (see `Dockerfile`, `nginx.conf`, `docker-compose.yml`)

---

## Architecture: locale JSON + language toggle

Do NOT create a duplicate HTML file or a separate deployment. Use this approach:

1. Extract every user-visible string from `index.html` and `app.js` into
   `locales/en.json` using flat dot-notation keys, e.g.:
   ```json
   {
     "header.title": "Calm Down",
     "checkin.question": "How are you feeling right now?",
     "stress.label.low": "Uneasy",
     ...
   }
   ```

2. Create `locales/es.json` with a complete Spanish translation of every key.

3. Create `i18n.js` — a small standalone module (no dependencies) that:
   - Reads `localStorage.getItem('lang')` first; falls back to `navigator.language`;
     falls back to `'en'`
   - Fetches the correct `locales/<lang>.json` file
   - Replaces every element that has a `data-i18n="key"` attribute with the
     translated string
   - Exposes a global `t('key')` function for use in `app.js`
   - Falls back gracefully to the English value if a key is missing in Spanish

4. Update `index.html`:
   - Add `<script src="i18n.js"></script>` before `app.js`
   - Replace every hardcoded English string with `data-i18n="key"` attributes
   - Add a language toggle button (EN / ES) in the top-right header area,
     styled to match the existing header buttons (see `.btn-install-guide` class)
   - When toggled, save choice to `localStorage` and re-apply translations without
     a full page reload

5. Update `app.js`:
   - Replace every hardcoded English string with `t('key')` calls
   - Ensure dynamically rendered elements (stress scale numbers, descriptions,
     etc.) also use `t()` so they render in the active language

---

## Translation quality

- This app is for people experiencing anxiety and relationship stress. Use warm,
  natural, emotionally appropriate Spanish — not robotic literal translation.
- "Calm Down" as the app name: use "Cálmate" in Spanish contexts.
- Translate all `aria-label` values and accessibility text too.
- Preserve any placeholders like `{{name}}` or `{value}` exactly as-is.

---

## Ollama sync script

Create `scripts/translate-sync.js` (Node.js, no npm dependencies — use only
built-in `http`, `fs`, `path` modules):

### What it does:
1. Loads `locales/en.json` and `locales/es.json`
2. Finds every key present in `en.json` but missing from `es.json`
3. For each missing key, calls the Ollama API to translate the value:

```js
// Ollama OpenAI-compatible endpoint
POST http://localhost:11434/v1/chat/completions
{
  "model": "qwen3:8b",
  "messages": [
    {
      "role": "system",
      "content": "You are a professional Spanish translator. This app helps people manage anxiety and relationship stress. Translate naturally and warmly. Return ONLY the translated text with no explanation, no quotes, no extra formatting."
    },
    {
      "role": "user",
      "content": "Translate to Spanish: <english text here>"
    }
  ],
  "stream": false
}
```

4. Writes all newly translated keys back into `locales/es.json`
5. Prints a summary: how many keys were added
6. If Ollama is unreachable (connection refused), prints a clear warning and exits
   with code 0 (non-blocking) — do NOT fail silently

### CLI usage:
```bash
node scripts/translate-sync.js           # sync all missing keys
node scripts/translate-sync.js --check  # dry run: report drift only, no writes
```

---

## Git pre-commit hook

Create `scripts/install-hooks.sh`:
```bash
#!/bin/bash
cp scripts/pre-commit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
echo "Pre-commit hook installed."
```

Create `scripts/pre-commit.sh` (this is what gets copied to `.git/hooks/pre-commit`):
- Check if any staged files match `locales/en.json`
- If yes, run `node scripts/translate-sync.js`
- If Ollama is offline, print a warning but do NOT block the commit
- If Ollama is online and translation succeeds, `git add locales/es.json`
  so the Spanish updates are included in the same commit

---

## Service worker and manifest updates

- Update `sw.js` cache list to include `locales/en.json` and `locales/es.json`
  so the Spanish version works offline
- Update `manifest.json`: add a `lang` field set to `"en"` (the default);
  optionally add a Spanish `manifest.es.json` with `"lang": "es"` and
  `"name": "Cálmate"` if PWA manifest localization is feasible without a build step

---

## Constraints

- No npm packages, no bundler, no build step — everything must work as plain
  static files served by nginx
- Do not break the existing Docker deployment (`Dockerfile`, `nginx.conf`,
  `docker-compose.yml`)
- The English UX must remain pixel-identical to what it is today — this is
  purely additive
- The language toggle must work on both desktop and mobile (the app is a PWA
  installed on home screens)
- Run `node scripts/translate-sync.js --check` at the end and show me the output
  so I can confirm nothing was missed

---

## Order of operations

1. Extract strings → create `locales/en.json`
2. Update `index.html` with `data-i18n` attributes
3. Create `i18n.js`
4. Update `app.js` with `t()` calls
5. Create `locales/es.json` (full translation)
6. Create `scripts/translate-sync.js`
7. Create `scripts/pre-commit.sh` and `scripts/install-hooks.sh`
8. Update `sw.js` cache list
9. Run `--check` and confirm output is clean
