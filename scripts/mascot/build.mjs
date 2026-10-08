// Builds the sparrow mascot assets and the app icon from the professor sheet.
//
//   node scripts/mascot/build.mjs [path/to/sparrow-professor-sheet.png]
//
// The source sheet lives in mascot-inbox/ (git-ignored). Needs macOS: the
// subject cut-out uses Vision's foreground mask via cut.swift (no installs).
// Writes:
//   public/mascot/full/sparrow-<pose>.png   full-resolution transparent PNGs
//   public/mascot/sparrow-<pose>.png        web-sized copies (used by the app)
//   public/icons/*, public/apple-touch-icon.png, src/app/favicon.ico
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "../..");
const SHEET = path.resolve(process.argv[2] ?? path.join(ROOT, "mascot-inbox/sparrow-professor-sheet.png"));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "mascot-"));
const PUB = path.join(ROOT, "public");
const BRAND = "#0e9f7e"; // --primary / manifest theme_color

// Regions on the 1149×1369 sheet: [x, y, w, h]. `decor` is the area (cell
// coordinates) holding the sparkle / "z z z" marks, which the subject mask
// drops; they're recovered by colour distance from the sheet background.
const POSES = {
  main: { rect: [180, 40, 650, 790] },
  thinking: { rect: [714, 847, 211, 186] },
  happy: { rect: [929, 847, 218, 186], decor: [160, 25, 196, 76] },
  surprised: { rect: [714, 1037, 211, 178], decor: [8, 10, 60, 60] },
  waving: { rect: [929, 1037, 218, 178] },
  worried: { rect: [714, 1219, 211, 150] },
  sleeping: { rect: [929, 1219, 218, 150], decor: [153, 19, 189, 79] },
};

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

const cutter = path.join(TMP, "cut");
execFileSync("swiftc", ["-O", path.join(import.meta.dirname, "cut.swift"), "-o", cutter]);

async function cutOut(name, { rect, decor }) {
  const raw = path.join(TMP, `${name}-raw.png`), masked = path.join(TMP, `${name}.png`);
  execFileSync(cutter, [SHEET, ...rect.map(String), raw, "0"]);
  execFileSync(cutter, [SHEET, ...rect.map(String), masked, "1"]);
  const src = await sharp(raw).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const mask = await sharp(masked).ensureAlpha().raw().toBuffer();
  const { width: w, height: h } = src.info;
  const bg = [src.data[0], src.data[1], src.data[2]];
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      // Shave the soft edge slightly so no cream halo shows in dark mode.
      let a = clamp((mask[i + 3] / 255 - 0.12) / 0.88);
      if (decor && x >= decor[0] && x <= decor[2] && y >= decor[1] && y <= decor[3]) {
        const d = Math.hypot(src.data[i] - bg[0], src.data[i + 1] - bg[1], src.data[i + 2] - bg[2]);
        a = Math.max(a, clamp((d - 14) / 55));
      }
      // Un-blend edge pixels from the cream background.
      for (let c = 0; c < 3; c++) {
        const p = src.data[i + c];
        out[i + c] = a > 0 && a < 1 ? Math.round(clamp(bg[c] + (p - bg[c]) / a, 0, 255)) : p;
      }
      out[i + 3] = Math.round(a * 255);
    }
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (out[(y * w + x) * 4 + 3] > 8) [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
  return sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
    .png()
    .toBuffer();
}

const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };
fs.mkdirSync(path.join(PUB, "mascot/full"), { recursive: true });
let main;
for (const [name, pose] of Object.entries(POSES)) {
  let img = await cutOut(name, pose);
  if (name === "main") {
    main = img;
  } else {
    // Expressions are busts cut flat at the bottom: square canvas, art
    // bottom-centred, so they sit flush in a round avatar bubble.
    const S = 224;
    const fit = await sharp(img).resize(S, S, { fit: "inside", withoutEnlargement: true }).toBuffer({ resolveWithObject: true });
    img = await sharp({ create: { width: S, height: S, channels: 4, background: CLEAR } })
      .composite([{ input: fit.data, left: Math.round((S - fit.info.width) / 2), top: S - fit.info.height }])
      .png()
      .toBuffer();
  }
  await sharp(img).png({ compressionLevel: 9 }).toFile(path.join(PUB, `mascot/full/sparrow-${name}.png`));
  const web = name === "main" ? sharp(img).resize({ height: 400 }) : sharp(img).resize(160, 160);
  await web.png({ palette: true, quality: 92, effort: 10 }).toFile(path.join(PUB, `mascot/sparrow-${name}.png`));
}

// App icon: the main pose's face and bow tie on brand emerald, bust running
// off the bottom edge. The raised wing tip at the lower right is faded out.
async function icon(mode) {
  const crop = { left: 110, top: 0, width: 440, height: 462 };
  const { data, info } = await sharp(main).extract(crop).raw().toBuffer({ resolveWithObject: true });
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++) {
      const f = clamp(Math.min(x - 373, y - 350) / 10);
      if (f > 0) data[(y * info.width + x) * 4 + 3] *= 1 - f;
    }
  const S = 1024;
  const k = mode === "maskable" ? 0.66 : 0.86; // maskable: face inside the 80% safe circle
  const w = Math.round(S * k), h = Math.round((crop.height * w) / crop.width);
  const art = await sharp(data, { raw: info }).resize(w, h).png().toBuffer();
  return sharp({ create: { width: S, height: S, channels: 4, background: BRAND } })
    .composite([{ input: art, left: Math.round((S - w) / 2), top: S - h }])
    .flatten({ background: BRAND })
    .png()
    .toBuffer();
}
const square = await icon("any");
const maskable = await icon("maskable");
const rounded = async (size) => {
  const r = Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${size * 0.225}" fill="#fff"/></svg>`);
  return sharp(await sharp(square).resize(size, size).png().toBuffer()).composite([{ input: r, blend: "dest-in" }]).png().toBuffer();
};
await sharp(square).png({ compressionLevel: 9 }).toFile(path.join(PUB, "mascot/full/app-icon-1024.png"));
// iOS: opaque, full-bleed square; iOS rounds the corners itself.
for (const f of ["icons/apple-touch-icon.png", "apple-touch-icon.png"])
  await sharp(square).resize(180, 180).png({ palette: true, quality: 95 }).toFile(path.join(PUB, f));
await sharp(await rounded(192)).png({ palette: true, quality: 95 }).toFile(path.join(PUB, "icons/icon-192.png"));
await sharp(await rounded(512)).png({ palette: true, quality: 95 }).toFile(path.join(PUB, "icons/icon-512.png"));
await sharp(maskable).resize(512, 512).png({ palette: true, quality: 95 }).toFile(path.join(PUB, "icons/icon-maskable-512.png"));

// favicon.ico with PNG-encoded 16/32/48 entries.
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map((s) => rounded(s)));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((s, i) => {
  const e = 6 + i * 16;
  header.writeUInt8(s, e);
  header.writeUInt8(s, e + 1);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(pngs[i].length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += pngs[i].length;
});
fs.writeFileSync(path.join(ROOT, "src/app/favicon.ico"), Buffer.concat([header, ...pngs]));
fs.rmSync(TMP, { recursive: true, force: true });
console.log("mascot assets and icons written");
