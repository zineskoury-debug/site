// Renders every studio shot to public/images as WebP. Needs the dev server: `npm run dev`.
// Usage: node scripts/stills.mjs [shot ...]
import { chromium } from 'playwright-core'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const BASE = process.env.STUDIO_URL ?? 'http://localhost:5173/studio.html'
const OUT = {
  'flavor-pistacchio': 'flavors/pistacchio', 'flavor-vaniglia': 'flavors/vaniglia', 'flavor-cioccolato': 'flavors/cioccolato',
  'flavor-fragola': 'flavors/fragola', 'flavor-limone': 'flavors/limone', 'flavor-nocciola': 'flavors/nocciola',
  'product-uno': 'products/uno', 'product-due': 'products/due', 'product-tre': 'products/tre',
  story: 'story', craft: 'craft', hero: 'hero', tub: 'tub',
}
const SIZE = { craft: 1920 }
const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(OUT)

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
for (const shot of wanted) {
  const page = await browser.newPage({ viewport: { width: 2000, height: 1300 }, deviceScaleFactor: 2 })
  page.on('pageerror', (e) => console.error(shot, e.message))
  await page.goto(`${BASE}?shot=${shot}`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 })
  await page.waitForTimeout(500)
  const png = await page.locator('canvas').screenshot({ omitBackground: true })
  const file = `public/images/${OUT[shot]}.webp`
  mkdirSync(file.slice(0, file.lastIndexOf('/')), { recursive: true })
  const meta = await sharp(png).metadata()
  await sharp(png)
    .resize(Math.round((SIZE[shot] ?? meta.width / 2) * 1))
    .webp({ quality: 84, alphaQuality: 90, effort: 6 })
    .toFile(file)
  console.log('✓', file)
  await page.close()
}
await browser.close()
