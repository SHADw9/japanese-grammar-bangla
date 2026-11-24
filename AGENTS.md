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
- **`ANDROID_KEY_PASSWORD` must equal `ANDROID_KEYSTORE_PASSWORD`.** The keystore is PKCS12, which protects the key with the store password; a distinct key password makes `apksigner` fail *after* a successful Gradle build.
- `android-release.yml` calls `scripts/*.mjs` and `npm run build:www` from the repo root; keep helper scripts under `scripts/`.
- **Launcher icons come from `android-res/`, not `assets/icon.png`.** `cap add android` writes the stock Capacitor icon on every CI build, so `scripts/apply-android-icons.mjs` copies our pre-rendered PNGs in afterwards **and overwrites `mipmap-anydpi-v26/ic_launcher*.xml`** — Android 8+ uses the adaptive icon, so replacing only the PNGs changes nothing. Re-render the PNGs from `assets/logo.svg` / `assets/logo-mark.svg` with ImageMagick if the logo changes.
- **Book mode is a native snap scroller, not a transform.** `:root.book-mode main` uses `overflow-x: auto` + `scroll-snap-type: x mandatory`, and `app.js` scrolls with `book.scrollLeft`/`scrollTo` and mirrors the position from the `scroll` event. Don't go back to translating `main`: with `overflow: hidden` every page past the first is clipped away (blank screen). Page-turn animation is a short decorative `rotateY` applied to the arriving page only.
- **The notch is handled once, in `--topbar-h`.** `--topbar-h: calc(var(--bar-h) + var(--safe-top))` and the topbar pads itself with `--safe-top`, so every offset (hero padding, scroll margin, rail top, book main margin) already includes the safe area. Don't add `env(safe-area-inset-top)` to those offsets again.
- **Print overrides for book mode live in a separate `@media print` block at the very end of `styles.css`**, after the book rules, so they win on source order. Keep them last if you append CSS.
- The `<head>` boot script applies `book-mode` before first paint from `jp-view`; `app.js` must therefore treat an already-present class as the source of truth (`setBookMode(true, false)` on init, no re-save).

## Content conventions

- All learner-facing prose, labels, and status messages are in Bengali. Japanese examples get `<ruby>漢字<rt>かな</rt></ruby>` furigana; inline Japanese uses `<span class="ja-inline" lang="ja">`, dialogue lines use `.line .ja` / `.romaji` / `.bn`.
- Bengali digits in UI come from the `bn()` helper in `app.js` — don't hardcode Latin digits.
- `data-speak="…"` on any element makes it clickable for TTS; `app.js` auto-injects buttons for dialogue lines and `.ja-inline` sentences.
- Persisted `localStorage` keys: `jp-theme`, `jp-furi`, `jp-read`, `jp-rate`, `jp-gemini`, `jp-hint`, `jp-update`, `jp-view`. New state should follow the same `jp-*` JSON pattern.
- **App version has one source at build time.** `build-www.mjs` stamps `<meta name="app-version">` in `www/index.html` from `APP_VERSION` (CI derives it from `package.json` + run number) or `package.json`; `app.js` reads that meta for the GitHub release update check. The CI step order matters: version → `build:www` → `cap add` → `patch-android`.
- The update checker targets `SHADw9/japanese-grammar-bangla` (`UPDATE_REPO` in `app.js`); change it there if the repo moves.
- Homework vocabulary hints (`.hw-hint`) are opt-in: `:root.no-hint` hides them, the class is set in the head boot script, and every `[data-hw-hint]` button toggles the same global state.
- The AI Lab calls the Gemini API directly from the client with a user-supplied key stored in `localStorage`; there is no backend. Don't introduce secrets or a server dependency.
