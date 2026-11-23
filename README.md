# জাপানি ব্যাকরণ বাংলায় · Japanese Grammar in Bengali

A complete Japanese-grammar course written for Bengali speakers — 10 chapters, dialogues, self-check drills and **250 translation exercises**. Runs as a single static page in the browser and ships as an Android app via Capacitor.

No framework, no bundler, no build step for the web version: `index.html` + `styles.css` + `app.js`.

## Features

- **10 chapters** from sentence structure and particles to verb conjugation, keigo and counters, each split into N5 → N4 → N3/N2 levels.
- **250 homework sentences** (25 per chapter) with per-item answers, plus a "reveal all" button.
- **Optional vocabulary help** — Japanese meanings (`সকাল = 朝 / あさ`) are hidden until you press *শব্দার্থ দেখান*, so you can attempt the translation first.
- **Furigana toggle** and reading-progress tracking, both remembered on the device.
- **Kana chart + quiz** (hiragana / katakana / mixed) with score and streak.
- **Audio playback** of every example and dialogue line — native Android TTS in the app, Web Speech API in the browser, with adjustable speed.
- **AI practice lab** — generate MCQs, translation drills and dialogues, or get your own sentence corrected. Uses your own Gemini API key (default model `gemini-3.5-flash-lite`), stored only on your device and sent straight to Google.
- **App updates** — the app checks GitHub Releases for a newer version and shows a download banner; you can also check manually from the footer.
- **4 colour schemes** (আই / সুমি / সাকুরা / মাতচা) × light / dark / auto.

## Run locally

Open `index.html` directly, or serve the folder:

```sh
python3 -m http.server 8000    # then visit http://localhost:8000
```

There is no dev server, test suite or lint config. Webfonts load from Google Fonts; everything else works offline.

## Build the Android app

```sh
npm install
npm run build:www                 # copies sources into www/ and hash-stamps asset URLs
npx cap add android               # first time only
node scripts/apply-android-icons.mjs   # our launcher icon (stock Capacitor one otherwise)
node scripts/patch-android.mjs    # TTS <queries> entry + versionName/versionCode
npx cap sync android
cd android && ./gradlew assembleDebug
```

`www/` and `android/` are generated — edit the root sources, never those folders.

### Launcher icon

`assets/icon.png` is only the source artwork. The actual launcher icons are the pre-rendered PNGs in
`android-res/`, copied into the Android project by `scripts/apply-android-icons.mjs` (CI runs it right
after `cap add android`). It also replaces the adaptive-icon XML — without that, Android 8+ keeps
showing the stock icon no matter which PNGs you swap.

If the logo changes, re-render both sets from `assets/logo.svg` (full icon) and `assets/logo-mark.svg`
(transparent foreground) at mdpi→xxxhdpi, then commit `android-res/`.

## Releases

**Fully automatic.** Every push to `main` builds an APK, creates the tag, and publishes a GitHub Release with the APK attached — no manual tagging.

```sh
git add -A && git commit -m "…" && git push
```

- Version = `package.json` major.minor + the CI run number, e.g. `1.0.7`. It always increases, which is what the in-app update check relies on. Bump `package.json` to `1.1.0` when you want a new minor series.
- Docs-only pushes (`**.md`) are skipped.
- You can also run it from the Actions tab (*Run workflow*).
- Builds are serialised, so versions and releases stay in order.

Signing uses the repo secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`. Without them the workflow produces an unsigned debug APK instead.

Generate the key **once** and keep it outside the repo (`*.jks` is gitignored):

```sh
keytool -genkeypair -keystore release.jks -storetype PKCS12 \
  -alias japanese-bangla -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 release.jks    # paste into the ANDROID_KEYSTORE_BASE64 secret
```

> Back the keystore up. Android only accepts updates signed with the **same** key — lose it and existing users can never update, only uninstall and reinstall.

> Use the **same password for the store and the key**. PKCS12 encrypts the key with the store password, so a different `ANDROID_KEY_PASSWORD` makes `apksigner` fail with *"Failed to obtain key … Wrong password?"* even though the keystore itself opens fine.

### In-app update check

On launch (at most twice a day) and on demand via the footer button, the app calls
`api.github.com/repos/SHADw9/japanese-grammar-bangla/releases/latest`, compares the tag with its own
version, and shows a banner linking to the newest non-debug APK. Dismissing hides that release only.

The app's own version comes from `<meta name="app-version">`, which `build-www.mjs` stamps from
`APP_VERSION` (CI derives it from `package.json` + the run number) or `package.json`. Versions always
increase, so a stale build is never offered as an update.

## Layout

| Path | Purpose |
| --- | --- |
| `index.html` | All content and UI markup |
| `styles.css` | Styling, theme variables, palettes |
| `app.js` | Theme, furigana, nav, progress, TTS, kana quiz, hints, AI lab |
| `assets/` | `logo.svg` (app mark), `icon.png` (Android source icon) |
| `scripts/build-www.mjs` | Copies sources to `www/`, adds content-hash cache busting |
| `scripts/patch-android.mjs` | Patches the Android manifest and version |
| `capacitor.config.json` | App id `com.japanesebangla.grammar`, `webDir: www` |

See `AGENTS.md` for contributor/agent conventions and gotchas.
