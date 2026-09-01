const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')

async function run() {
  const outDir = path.join(__dirname, '..', 'logs')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  const results = []
  let browser
  try {
    // Tenta usar o Chrome instalado no sistema (evita baixar binários)
    browser = await chromium.launch({ headless: true, channel: 'chrome' })
  } catch (e) {
    // Fallback para o chromium embutido (pode requerer download)
    browser = await chromium.launch({ headless: true })
  }
  const context = await browser.newContext()
  const page = await context.newPage()

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      results.push({ type: 'console', text: msg.text(), location: msg.location(), url: page.url() })
      console.error('Console error:', msg.text())
    }
  })

  page.on('pageerror', (err) => {
    results.push({ type: 'pageerror', message: err.message, stack: err.stack, url: page.url() })
    console.error('Page error:', err.message)
  })

  const base = process.env.BASE_URL || 'http://localhost:3002'
  const routes = ['/', '/mapa', '/corridas/1', '/perfil', '/login']

  for (const route of routes) {
    const url = new URL(route, base).toString()
    try {
      console.log(`Visiting ${url}`)
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
      results.push({ type: 'navigation', url, status: response ? response.status() : 'no-response' })
      // wait briefly to allow any runtime errors to surface
      await page.waitForTimeout(2000)
    } catch (err) {
      results.push({ type: 'navigation-error', url, message: err.message })
      console.error(`Navigation failed ${url}:`, err.message)
    }
  }

  await browser.close()

  const outPath = path.join(outDir, 'console-errors.json')
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2))
  console.log('Saved results to', outPath)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
