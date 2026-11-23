// Copies the website files into www/ (the folder Capacitor packs into the APK)
// and stamps the CSS/JS references in www/index.html with a content hash so
// WebView and browser caches can never serve stale assets.
import { cpSync, mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const at = (p) => join(root, p);
const www = at("www");

rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });
for (const f of ["index.html", "styles.css", "app.js"]) {
  if (!existsSync(at(f))) throw new Error("Missing " + f);
  cpSync(at(f), join(www, f));
}
// Optional folders (images, fonts, etc.) are copied if present.
for (const d of ["assets", "fonts", "img"]) {
  if (existsSync(at(d))) cpSync(at(d), join(www, d), { recursive: true });
}

// Cache-busting: rewrite the copied index.html only; source stays stable.
let html = readFileSync(join(www, "index.html"), "utf8");
for (const f of ["styles.css", "app.js"]) {
  const hash = createHash("sha256").update(readFileSync(join(www, f))).digest("hex").slice(0, 8);
  // Only rewrite actual href/src attributes, never prose mentioning the filename.
  const ref = new RegExp('(href|src)="' + f.replace(/\./g, "\\.") + '(?:\\?v=[^"]*)?"', "g");
  html = html.replace(ref, (_, attr) => attr + '="' + f + "?v=" + hash + '"');
}
writeFileSync(join(www, "index.html"), html);

console.log("www/ ready");
