// One-off icon generator. Run with: node scripts/gen-icons.mjs
// Renders scripts/icon.svg into the PNG sizes the web app + iOS need.
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const svg = readFileSync(join(here, 'icon.svg'))
const out = join(here, '..', 'public')

const targets = [
  { file: 'pwa-192.png', size: 192 },
  { file: 'pwa-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 }, // iOS home-screen icon
  { file: 'favicon-32.png', size: 32 },
]

// Maskable icon: same art on a teal background with safe padding so iOS/Android
// can crop it to any shape without clipping the pin.
async function maskable() {
  const inner = await sharp(svg).resize(410, 410).png().toBuffer()
  await sharp({
    create: { width: 512, height: 512, channels: 4, background: '#0f766e' },
  })
    .composite([{ input: inner, gravity: 'center' }])
    .png()
    .toFile(join(out, 'pwa-maskable-512.png'))
}

for (const { file, size } of targets) {
  await sharp(svg).resize(size, size).png().toFile(join(out, file))
  console.log('wrote', file)
}
await maskable()
console.log('wrote pwa-maskable-512.png')
