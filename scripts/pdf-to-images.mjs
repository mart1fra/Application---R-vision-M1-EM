import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { createCanvas } from 'canvas'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

const pdfPath = process.argv[2]
const prefix = process.argv[3] || 'page'
if (!pdfPath) { console.error('Usage: node pdf-to-images.mjs <pdf> [prefix]'); process.exit(1) }

const outDir = 'temporary screenshots'
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

const data = new Uint8Array(readFileSync(pdfPath))
const doc = await getDocument({ data }).promise
console.log(`${doc.numPages} pages`)

for (let i = 1; i <= doc.numPages; i++) {
  const page = await doc.getPage(i)
  const vp = page.getViewport({ scale: 2.0 })
  const canvas = createCanvas(vp.width, vp.height)
  await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise
  const out = `${outDir}/${prefix}-${i}.png`
  writeFileSync(out, canvas.toBuffer('image/png'))
  console.log(`Page ${i} saved`)
}
