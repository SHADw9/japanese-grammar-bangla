// Run after `cap add android`: replaces the stock Capacitor launcher icon with ours.
// `cap add android` regenerates android/ from scratch on every CI build, so the
// pre-rendered PNGs in android-res/ are copied in each time (no image tooling needed in CI).
import { cpSync, mkdirSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "android-res");
const res = join(root, "android/app/src/main/res");

if (!existsSync(res)) throw new Error("Run `npx cap add android` first (missing " + res + ")");

for (const dir of readdirSync(src)) {
  mkdirSync(join(res, dir), { recursive: true });
  cpSync(join(src, dir), join(res, dir), { recursive: true });
}

// Android 8+ ignores the plain PNGs when an adaptive icon exists, so point the
// adaptive icon at our foreground too — otherwise the stock logo still shows.
const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/jp_icon_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;
const anydpi = join(res, "mipmap-anydpi-v26");
mkdirSync(anydpi, { recursive: true });
writeFileSync(join(anydpi, "ic_launcher.xml"), adaptive);
writeFileSync(join(anydpi, "ic_launcher_round.xml"), adaptive);

// Distinct name so it can't collide with anything the Capacitor template defines.
const values = join(res, "values");
mkdirSync(values, { recursive: true });
writeFileSync(
  join(values, "jp_icon_background.xml"),
  `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="jp_icon_background">#E9EBE1</color>
</resources>
`
);

console.log("Android launcher icons applied");
