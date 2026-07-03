/**
 * Regenerate share images + apple-touch-icon from og/template.html.
 *
 *   npm i -D playwright   (once, locally)
 *   node scripts/generate-og.mjs
 *
 * Outputs: og-image.png (1200×630), og-square.png (1080×1080),
 *          apple-touch-icon.png (180×180)
 *
 * Run with network access so the Google Fonts (Archivo + Instrument
 * Serif) load — offline the images fall back to system Georgia/Arial.
 */
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const tpl = pathToFileURL(path.join(root, 'og', 'template.html')).href;

const targets = [
  { v: 'og',   w: 1200, h: 630,  out: 'og-image.png' },
  { v: 'sq',   w: 1080, h: 1080, out: 'og-square.png' },
  { v: 'icon', w: 180,  h: 180,  out: 'apple-touch-icon.png' },
];

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});

for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: t.w, height: t.h } });
  await page.goto(`${tpl}?v=${t.v}`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(400); // font settle
  const card = page.locator('.card');
  await card.screenshot({ path: path.join(root, t.out) });
  console.log(`✓ ${t.out} (${t.w}×${t.h})`);
  await page.close();
}
await browser.close();
