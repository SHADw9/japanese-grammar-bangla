// Run after `cap add android`: lets the app find the phone's TTS engine (Android 11+)
// and sets versionName / versionCode from the CI environment.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(root, "android/app/src/main/AndroidManifest.xml");
let m = readFileSync(manifestPath, "utf8");
if (!m.includes("android.intent.action.TTS_SERVICE")) {
  m = m.replace(
    "<application",
    '<queries>\n        <intent>\n            <action android:name="android.intent.action.TTS_SERVICE" />\n        </intent>\n    </queries>\n\n    <application'
  );
  writeFileSync(manifestPath, m);
}

const gradlePath = join(root, "android/app/build.gradle");
let g = readFileSync(gradlePath, "utf8");
const version = process.env.APP_VERSION || "1.0.0";
const code = process.env.APP_VERSION_CODE || "1";
g = g.replace(/versionCode\s+\d+/, "versionCode " + code).replace(/versionName\s+"[^"]*"/, 'versionName "' + version + '"');
writeFileSync(gradlePath, g);
console.log("Android patched:", version, code);
