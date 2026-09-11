const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true }).catch(() => chromium.launch({ channel: 'chrome', headless: true }));
  const page = await browser.newPage();

  // Helper function to build icon HTML matching SR Passageiro style
  function buildIconHtml(size, subtitle = 'MOTORISTA') {
    const scale = size / 512;
    const borderRadius = 96 * scale;
    const borderWidth = Math.max(2, 4 * scale);
    const pinWidth = 210 * scale;
    const pinHeight = 240 * scale;
    const dashR = 175 * scale;
    const dashStroke = 10 * scale;
    const dashArray = `${14 * scale} ${12 * scale}`;
    const badgeW = 300 * scale;
    const badgeH = 54 * scale;
    const badgeRadius = 27 * scale;
    const fontSizeSR = 42 * scale;
    const fontSizeBadge = 23 * scale;
    const letterSpacing = 3.5 * scale;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: ${size}px;
            height: ${size}px;
            background: #070D18;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }
          .icon-box {
            position: relative;
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle at 50% 40%, #0D192C 0%, #070D18 85%);
            border-radius: ${borderRadius}px;
            border: ${borderWidth}px solid rgba(255, 200, 0, 0.45);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            box-shadow: inset 0 0 ${40 * scale}px rgba(0,0,0,0.8), 0 0 ${30 * scale}px rgba(255, 200, 0, 0.15);
          }
          .svg-layer {
            position: absolute;
            inset: 0;
            width: ${size}px;
            height: ${size}px;
          }
          .badge-pill {
            position: absolute;
            bottom: ${42 * scale}px;
            width: ${badgeW}px;
            height: ${badgeH}px;
            border-radius: ${badgeRadius}px;
            background: linear-gradient(135deg, #FFC800 0%, #F59E0B 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${fontSizeBadge}px;
            font-weight: 900;
            color: #070D18;
            letter-spacing: ${letterSpacing}px;
            text-transform: uppercase;
            box-shadow: 0 ${4 * scale}px ${16 * scale}px rgba(0,0,0,0.6), 0 0 ${12 * scale}px rgba(255, 200, 0, 0.4);
            z-index: 10;
          }
        </style>
      </head>
      <body>
        <div class="icon-box">
          <svg class="svg-layer" viewBox="0 0 512 512">
            <!-- Dashed orbit circle -->
            <circle
              cx="256"
              cy="236"
              r="170"
              fill="none"
              stroke="#FFC800"
              stroke-width="12"
              stroke-dasharray="16 13"
              stroke-linecap="round"
              opacity="0.9"
            />

            <!-- Yellow Map Pin with Navigation / Car Accent -->
            <path
              d="M256 90 C186 90 130 146 130 216 C130 300 256 385 256 385 C256 385 382 300 382 216 C382 146 326 90 256 90 Z"
              fill="url(#goldGrad)"
              filter="drop-shadow(0 6px 14px rgba(0,0,0,0.5))"
            />

            <!-- Inner dark circle inside pin -->
            <circle cx="256" cy="208" r="48" fill="#070D18" />

            <!-- SR Text in Center -->
            <text
              x="256"
              y="222"
              fill="#FFC800"
              font-size="44"
              font-weight="900"
              text-anchor="middle"
              font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              letter-spacing="1"
            >SR</text>

            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FFE066" />
                <stop offset="50%" stop-color="#FFC800" />
                <stop offset="100%" stop-color="#E5A800" />
              </linearGradient>
            </defs>
          </svg>

          <!-- Pill Badge MOTORISTA -->
          <div class="badge-pill">MOTORISTA</div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate 512x512 Icon
  await page.setViewportSize({ width: 512, height: 512 });
  await page.setContent(buildIconHtml(512, 'MOTORISTA'));
  await page.screenshot({ path: path.join(__dirname, '../public/icon-512.png') });
  await page.screenshot({ path: path.join(__dirname, '../public/icon-512-maskable.png') });
  console.log('✓ icon-512.png generated');

  // Generate 192x192 Icon
  await page.setViewportSize({ width: 192, height: 192 });
  await page.setContent(buildIconHtml(192, 'MOTORISTA'));
  await page.screenshot({ path: path.join(__dirname, '../public/icon-192.png') });
  await page.screenshot({ path: path.join(__dirname, '../public/apple-touch-icon.png') });
  console.log('✓ icon-192.png & apple-touch-icon.png generated');

  // Generate 32x32 Icon
  await page.setViewportSize({ width: 32, height: 32 });
  await page.setContent(buildIconHtml(32, 'MOTORISTA'));
  await page.screenshot({ path: path.join(__dirname, '../public/icon-32.png') });
  console.log('✓ icon-32.png generated');

  await browser.close();
  console.log('All icons successfully standardized with SR Passageiro!');
}

run().catch(console.error);
