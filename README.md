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
node scripts/patch-android.mjs    # TTS <queries> entry + versionName/versionCode
npx cap sync android
cd android && ./gradlew assembleDebug
```

`www/` and `android/` are generated — edit the root sources, never those folders.

To regenerate launcher icons after changing `assets/icon.png`:

```sh
npx @capacitor/assets generate --android
```

## Releases

`.github/workflows/android-release.yml` builds an APK on any `v*` tag (or manual dispatch) and attaches it to a GitHub Release.

```sh
git tag v1.0.1 && git push origin v1.0.1
```

Signing uses the repo secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`. Without them the workflow produces an unsigned debug APK instead.

Generate the key **once** and keep it outside the repo (`*.jks` is gitignored):

```sh
keytool -genkeypair -keystore release.jks -storetype PKCS12 \
  -alias japanese-bangla -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 release.jks    # paste into the ANDROID_KEYSTORE_BASE64 secret
```

> Back the keystore up. Android only accepts updates signed with the **same** key — lose it and existing users can never update, only uninstall and reinstall.

### In-app update check

On launch (at most twice a day) and on demand via the footer button, the app calls
`api.github.com/repos/SHADw9/japanese-grammar-bangla/releases/latest`, compares the tag with its own
version, and shows a banner linking to the newest non-debug APK. Dismissing hides that release only.

The app's own version comes from `<meta name="app-version">`, which `build-www.mjs` stamps from
`APP_VERSION` (CI sets it from the tag) or `package.json`. **Tag releases `vX.Y.Z` with increasing
numbers** — the comparison is numeric, so a lower tag will never be offered as an update.

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
