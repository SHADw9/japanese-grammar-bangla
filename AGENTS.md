# AGENTS.md

Offline-first Japanese-grammar course in Bengali, shipped as a static site and wrapped as an Android app with Capacitor. No framework, no bundler, no tests, no lint/format config.

## Layout

- `index.html` — the whole app: ~10 chapters of hand-authored content (explanations, tables, dialogues, drills, 25 homework items per chapter) plus all UI. `<article class="chapter" id="ch-N">` holds prose; the following `<section class="homework" id="ch-N-hw">` holds exercises.
- `styles.css` — all styling. Theming is CSS variables on `:root` (`--paper` etc.), overridden per palette via `:root[data-palette="ai|sumi|sakura|matcha"]` and per mode via `[data-theme="light|dark"]`.
- `app.js` — one IIFE, ES5-style (`var`, no modules) for old Android WebViews. Handles theme, furigana toggle, nav, reading progress, TTS, kana quiz, and the Gemini "AI Lab".
- `assets/logo.svg` — app mark (ensō ring + torii, no lettering). The topbar uses an inline copy of it with `currentColor` + `var(--shu-solid)` so it follows the theme; `assets/icon.png` (1024²) is the Android source icon.
- `scripts/build-www.mjs` — copies sources into `www/` and hash-stamps asset URLs.
- `scripts/patch-android.mjs` — adds the TTS `<queries>` entry and sets app version.
- `.github/workflows/android-release.yml` — APK build/release CI.

## Commands

```sh
npm run build:www                 # node scripts/build-www.mjs -> www/
npx cap add android               # generate android/ (gitignored, not committed)
node scripts/patch-android.mjs    # patch manifest + versionName/versionCode
npx cap sync android              # copy www/ + plugins into the Android project
```

To preview locally, serve or open `index.html` directly. There is no dev server, test suite, or typecheck. Verify changes manually in a browser; the TTS native path only works on-device.

## Gotchas

- **Never edit `www/` or `android/`** — both are generated and ignored by `.gitignore`. Edit root sources, then rebuild.
- **Cache-busting is automatic.** Source `index.html` references bare `styles.css` / `app.js`; `build-www.mjs` rewrites them in `www/index.html` to `?v=<content hash>`. Don't hand-edit query strings or add `?v=` in the source.
- **Theme init is split by design.** The inline `<script>` in `<head>` parses localStorage before first paint (avoiding flash) and exposes `window.__JP_THEME__`; `app.js` consumes that instead of re-parsing. Change defaults/validation in both places when touching theme state.
- **CI auto-releases on every push to `main`** (docs-only pushes skipped). It versions the build as `package.json` major.minor + `GITHUB_RUN_NUMBER`, then `softprops/action-gh-release` creates the tag and Release. **Do not add a `tags:` trigger** — the release action pushes a tag, which would re-trigger the workflow in a loop.
- **CI requires repo secrets**: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` (already set). Without the keystore secret it builds a debug APK instead.
- `android-release.yml` calls `scripts/*.mjs` and `npm run build:www` from the repo root; keep helper scripts under `scripts/`.
- **Changing `assets/icon.png` does not change the APK launcher icon.** Android mipmaps live in the generated `android/` project; regenerate them with `npx @capacitor/assets generate --android` after `cap add android`.

## Content conventions

- All learner-facing prose, labels, and status messages are in Bengali. Japanese examples get `<ruby>漢字<rt>かな</rt></ruby>` furigana; inline Japanese uses `<span class="ja-inline" lang="ja">`, dialogue lines use `.line .ja` / `.romaji` / `.bn`.
- Bengali digits in UI come from the `bn()` helper in `app.js` — don't hardcode Latin digits.
- `data-speak="…"` on any element makes it clickable for TTS; `app.js` auto-injects buttons for dialogue lines and `.ja-inline` sentences.
- Persisted `localStorage` keys: `jp-theme`, `jp-furi`, `jp-read`, `jp-rate`, `jp-gemini`, `jp-hint`, `jp-update`. New state should follow the same `jp-*` JSON pattern.
- **App version has one source at build time.** `build-www.mjs` stamps `<meta name="app-version">` in `www/index.html` from `APP_VERSION` (CI derives it from `package.json` + run number) or `package.json`; `app.js` reads that meta for the GitHub release update check. The CI step order matters: version → `build:www` → `cap add` → `patch-android`.
- The update checker targets `SHADw9/japanese-grammar-bangla` (`UPDATE_REPO` in `app.js`); change it there if the repo moves.
- Homework vocabulary hints (`.hw-hint`) are opt-in: `:root.no-hint` hides them, the class is set in the head boot script, and every `[data-hw-hint]` button toggles the same global state.
- The AI Lab calls the Gemini API directly from the client with a user-supplied key stored in `localStorage`; there is no backend. Don't introduce secrets or a server dependency.
