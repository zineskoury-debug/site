// Usage: node scripts/scrollshots.mjs <url> <prefix> <width> <height> <y1,y2,...> (y in viewport heights)
import { chromium } from 'playwright-core'
const [url, prefix, w, h, ys] = process.argv.slice(2)
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, hasTouch: +w < 800, isMobile: +w < 800, reducedMotion: process.env.REDUCED ? 'reduce' : 'no-preference' })
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(4000)
const total = await page.evaluate(() => document.documentElement.scrollHeight / innerHeight)
console.log('page height (vh):', total.toFixed(1))
for (const y of ys.split(',').map(Number)) {
  await page.evaluate((y) => window.scrollTo(0, y * innerHeight), y)
  await page.waitForTimeout(2200)
  await page.screenshot({ path: `${prefix}-${String(y).replace('.', '_')}.png` })
}
console.log(errors.slice(0, 10).join('\n') || 'no errors')
await browser.close()
