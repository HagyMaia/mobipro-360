const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true }).catch(() => chromium.launch({ channel: 'chrome', headless: true }));
  const page = await browser.newPage();

  function buildDriverCarIconHtml(size) {
    const scale = size / 512;
    const borderRadius = 96 * scale;
    const borderWidth = Math.max(2, 4 * scale);
    const badgeW = 320 * scale;
    const badgeH = 54 * scale;
    const badgeRadius = 27 * scale;
    const fontSizeBadge = 22 * scale;
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
            background: radial-gradient(circle at 50% 38%, #0F1C32 0%, #070D18 85%);
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
            background: linear-gradient(135deg, #FFE066 0%, #FFC800 50%, #E5A800 100%);
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
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FFF08A" />
                <stop offset="35%" stop-color="#FFC800" />
                <stop offset="100%" stop-color="#D97706" />
              </linearGradient>
              <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#0A1628" />
                <stop offset="100%" stop-color="#050912" />
              </linearGradient>
              <linearGradient id="glowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#FFC800" stop-opacity="0.28" />
                <stop offset="100%" stop-color="#FFC800" stop-opacity="0" />
              </linearGradient>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.65"/>
              </filter>
            </defs>

            <!-- Dashed orbit ring -->
            <circle
              cx="256"
              cy="234"
              r="170"
              fill="none"
              stroke="#FFC800"
              stroke-width="12"
              stroke-dasharray="16 13"
              stroke-linecap="round"
              opacity="0.9"
            />

            <!-- Ambient glow behind car -->
            <circle cx="256" cy="225" r="120" fill="url(#glowGrad)" />

            <!-- EXECUTIVE CAR / TAXI -->
            <g filter="url(#shadow)">
              <!-- TAXI ROOF TOP SIGN -->
              <path
                d="M216 116 L296 116 L308 142 L204 142 Z"
                fill="url(#goldGrad)"
                filter="drop-shadow(0 4px 8px rgba(0,0,0,0.5))"
              />
              <rect x="220" y="122" width="72" height="16" rx="4" fill="#070D18" />
              <text
                x="256"
                y="134"
                fill="#FFC800"
                font-size="11"
                font-weight="900"
                text-anchor="middle"
                letter-spacing="1.5"
              >SR TAXI</text>

              <!-- Roof Base Support -->
              <rect x="238" y="142" width="36" height="6" rx="2" fill="#D97706" />

              <!-- Cabin Top & Pillars -->
              <path
                d="M168 226 L194 152 C198 146 206 142 214 142 L298 142 C306 142 314 146 318 152 L344 226 Z"
                fill="url(#goldGrad)"
              />

              <!-- Windshield Glass with Sleek Reflection -->
              <path
                d="M178 220 L201 156 C203 151 209 148 216 148 L296 148 C303 148 309 151 311 156 L334 220 Z"
                fill="url(#glassGrad)"
                stroke="#FFE066"
                stroke-width="1.5"
              />
              <!-- Windshield Diagonal Glare Line -->
              <line x1="220" y1="154" x2="192" y2="216" stroke="#FFF08A" stroke-width="3" stroke-linecap="round" opacity="0.4" />

              <!-- Side Mirrors -->
              <path d="M158 214 C144 214 138 220 140 228 C142 234 152 235 166 232 Z" fill="url(#goldGrad)" />
              <path d="M354 214 C368 214 374 220 372 228 C370 234 360 235 346 232 Z" fill="url(#goldGrad)" />

              <!-- Main Car Body Front -->
              <path
                d="M142 234 C132 238 126 248 128 260 L132 312 C134 322 142 330 152 330 L172 330 C178 330 184 324 184 318 L184 308 L328 308 L328 318 C328 324 334 330 340 330 L360 330 C370 330 378 322 380 312 L384 260 C386 248 380 238 370 234 C342 226 298 224 256 224 C214 224 170 226 142 234 Z"
                fill="url(#goldGrad)"
              />

              <!-- Aerodynamic Hood Curves -->
              <path d="M192 230 C210 248 216 260 216 268" fill="none" stroke="#D97706" stroke-width="2.5" stroke-linecap="round" opacity="0.7" />
              <path d="M320 230 C302 248 296 260 296 268" fill="none" stroke="#D97706" stroke-width="2.5" stroke-linecap="round" opacity="0.7" />

              <!-- Headlights (Aggressive Modern LED) -->
              <path
                d="M138 252 C146 252 174 256 182 268 C176 274 152 278 138 273 C134 266 134 256 138 252 Z"
                fill="#070D18"
                stroke="#FFF08A"
                stroke-width="2.5"
              />
              <path
                d="M374 252 C366 252 338 256 330 268 C336 274 360 278 374 273 C378 266 378 256 374 252 Z"
                fill="#070D18"
                stroke="#FFF08A"
                stroke-width="2.5"
              />

              <!-- LED DRL Brow Lights -->
              <path d="M140 255 Q165 256 180 266" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" />
              <path d="M372 255 Q347 256 332 266" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" />
              <circle cx="152" cy="265" r="4" fill="#FFE066" />
              <circle cx="360" cy="265" r="4" fill="#FFE066" />

              <!-- Central Honeycomb Grille -->
              <rect x="198" y="256" width="116" height="42" rx="8" fill="#070D18" stroke="#FFE066" stroke-width="2" />
              <line x1="206" y1="268" x2="306" y2="268" stroke="#FFC800" stroke-width="1.8" opacity="0.5" />
              <line x1="206" y1="278" x2="306" y2="278" stroke="#FFC800" stroke-width="1.8" opacity="0.5" />
              <line x1="212" y1="288" x2="300" y2="288" stroke="#FFC800" stroke-width="1.8" opacity="0.5" />

              <!-- SR Chrome Grille Badge -->
              <rect x="240" y="268" width="32" height="18" rx="5" fill="url(#goldGrad)" />
              <text x="256" y="281" fill="#070D18" font-size="11" font-weight="900" text-anchor="middle" letter-spacing="0.5">SR</text>

              <!-- Lower Bumper & Fog Lights -->
              <rect x="216" y="308" width="80" height="10" rx="4" fill="#070D18" />
              <circle cx="156" cy="310" r="5" fill="#FFE066" />
              <circle cx="356" cy="310" r="5" fill="#FFE066" />

              <!-- Tires Under Chassis -->
              <rect x="130" y="320" width="24" height="20" rx="5" fill="#030712" />
              <rect x="358" y="320" width="24" height="20" rx="5" fill="#030712" />
            </g>
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
  await page.setContent(buildDriverCarIconHtml(512));
  await page.screenshot({ path: path.join(__dirname, '../public/icon-512.png') });
  await page.screenshot({ path: path.join(__dirname, '../public/icon-512-maskable.png') });
  console.log('✓ icon-512.png updated');

  // Generate 192x192 Icon
  await page.setViewportSize({ width: 192, height: 192 });
  await page.setContent(buildDriverCarIconHtml(192));
  await page.screenshot({ path: path.join(__dirname, '../public/icon-192.png') });
  await page.screenshot({ path: path.join(__dirname, '../public/apple-touch-icon.png') });
  console.log('✓ icon-192.png updated');

  // Generate 32x32 Icon
  await page.setViewportSize({ width: 32, height: 32 });
  await page.setContent(buildDriverCarIconHtml(32));
  await page.screenshot({ path: path.join(__dirname, '../public/icon-32.png') });
  console.log('✓ icon-32.png updated');

  await browser.close();
}

run().catch(console.error);
