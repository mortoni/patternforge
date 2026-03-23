/**
 * Generate App Router icons for a dark (#0b0b0f) tile.
 * Usage: pnpm run generate:icons
 *
 * Source (first match):
 *   - public/pattern-forge-icon.png — optional high-res light mark
 *   - public/pattern-forge.svg — default (light metallic strokes; same as in-app dark UI)
 *
 * Do not use pattern-forge-black.* here — dark-on-dark is illegible at favicon size.
 * Outputs: src/app/icon.png, apple-icon.png, favicon.ico; public/icon-1024.png (master).
 */

import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, "public");
const APP = path.join(ROOT, "src", "app");

/** ~22.5% padding on each side (logo uses ~55% of canvas). */
const PAD = 0.225;
/** App / PWA tile background (dark). */
const BG = { r: 11, g: 11, b: 15, alpha: 1 }; // #0b0b0f

function resolveSource(): string {
  const iconPng = path.join(PUBLIC, "pattern-forge-icon.png");
  const lightSvg = path.join(PUBLIC, "pattern-forge.svg");
  if (fs.existsSync(iconPng)) return iconPng;
  if (fs.existsSync(lightSvg)) return lightSvg;
  console.error(
    "Missing light logo for icons. Add public/pattern-forge.svg or public/pattern-forge-icon.png"
  );
  process.exit(1);
}

function sharpForSource(src: string): sharp.Sharp {
  const lower = src.toLowerCase();
  if (lower.endsWith(".svg")) {
    return sharp(src, { density: 450 });
  }
  return sharp(src);
}

/** Fit logo inside inner square, centered on size×size canvas with solid BG. */
async function renderPaddedPng(
  src: string,
  size: number
): Promise<Buffer> {
  const inner = Math.max(1, Math.round(size * (1 - 2 * PAD)));
  const logo = await sharpForSource(src)
    .resize(inner, inner, { fit: "inside" })
    .ensureAlpha()
    .png()
    .toBuffer();
  const meta = await sharp(logo).metadata();
  const w = meta.width ?? inner;
  const h = meta.height ?? inner;
  const left = Math.floor((size - w) / 2);
  const top = Math.floor((size - h) / 2);

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: logo, left, top }])
    .png()
    .toBuffer();
}

async function main() {
  const src = resolveSource();
  console.log("Source:", path.relative(ROOT, src));

  if (!fs.existsSync(APP)) {
    console.error("Missing src/app directory");
    process.exit(1);
  }

  const master = await renderPaddedPng(src, 1024);
  const icon512 = await renderPaddedPng(src, 512);
  const apple180 = await renderPaddedPng(src, 180);
  const fav32 = await renderPaddedPng(src, 32);
  const fav16 = await renderPaddedPng(src, 16);

  fs.writeFileSync(path.join(PUBLIC, "icon-1024.png"), master);
  fs.writeFileSync(path.join(APP, "icon.png"), icon512);
  fs.writeFileSync(path.join(APP, "apple-icon.png"), apple180);

  const ico = await pngToIco([fav16, fav32]);
  fs.writeFileSync(path.join(APP, "favicon.ico"), ico);

  console.log("Wrote public/icon-1024.png (master)");
  console.log("Wrote src/app/icon.png (512)");
  console.log("Wrote src/app/apple-icon.png (180)");
  console.log("Wrote src/app/favicon.ico (16+32)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
