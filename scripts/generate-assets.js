const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true }).catch(() => chromium.launch({ channel: 'chrome', headless: true }));
  const page = await browser.newPage();

  // 1. Generate 512x512 Icon
  const icon512Html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: 512px;
          height: 512px;
          background: #070D18;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .container {
          position: relative;
          width: 512px;
          height: 512px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at 50% 35%, #15243B 0%, #070D18 80%);
        }
        .glow {
          position: absolute;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(14, 165, 164, 0.35) 0%, rgba(6, 182, 212, 0) 70%);
          filter: blur(20px);
        }
        .shield {
          position: relative;
          width: 360px;
          height: 360px;
          border-radius: 80px;
          background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(14, 165, 164, 0.15) 50%, rgba(0,0,0,0.4) 100%);
          border: 3px solid rgba(14, 165, 164, 0.6);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.3), 0 0 30px rgba(14, 165, 164, 0.25);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .car-svg {
          width: 140px;
          height: 140px;
          fill: none;
          stroke: #0EA5A4;
          stroke-width: 2.2;
          stroke-linecap: round;
          stroke-linejoin: round;
          filter: drop-shadow(0 4px 12px rgba(14, 165, 164, 0.6));
        }
        .logo-text {
          margin-top: 12px;
          font-size: 38px;
          font-weight: 900;
          letter-spacing: -1px;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .brand-highlight {
          color: #0EA5A4;
        }
        .sub-text {
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 4px;
          color: #38BDF8;
          text-transform: uppercase;
          margin-top: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="glow"></div>
        <div class="shield">
          <svg class="car-svg" viewBox="0 0 24 24">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <path d="M9 17h6" />
            <circle cx="17" cy="17" r="2" />
          </svg>
          <div class="logo-text">
            <span>SR</span>
            <span class="brand-highlight">Logística</span>
          </div>
          <div class="sub-text">MOTORISTA</div>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setViewportSize({ width: 512, height: 512 });
  await page.setContent(icon512Html);
  await page.screenshot({ path: path.join(__dirname, '../public/icon-512.png') });
  console.log('OK icon-512');

  // 2. Generate 192x192 Icon
  const icon192Html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: 192px;
          height: 192px;
          background: #070D18;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .container {
          position: relative;
          width: 192px;
          height: 192px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at 50% 35%, #15243B 0%, #070D18 80%);
        }
        .shield {
          position: relative;
          width: 156px;
          height: 156px;
          border-radius: 36px;
          background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(14, 165, 164, 0.18) 50%, rgba(0,0,0,0.4) 100%);
          border: 2px solid rgba(14, 165, 164, 0.7);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.3), 0 0 16px rgba(14, 165, 164, 0.3);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .car-svg {
          width: 68px;
          height: 68px;
          fill: none;
          stroke: #0EA5A4;
          stroke-width: 2.2;
          stroke-linecap: round;
          stroke-linejoin: round;
          filter: drop-shadow(0 2px 6px rgba(14, 165, 164, 0.6));
        }
        .logo-text {
          margin-top: 4px;
          font-size: 17px;
          font-weight: 900;
          letter-spacing: -0.5px;
          color: #FFFFFF;
        }
        .brand-highlight {
          color: #0EA5A4;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="shield">
          <svg class="car-svg" viewBox="0 0 24 24">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <path d="M9 17h6" />
            <circle cx="17" cy="17" r="2" />
          </svg>
          <div class="logo-text">
            <span>SR</span> <span class="brand-highlight">Logística</span>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setViewportSize({ width: 192, height: 192 });
  await page.setContent(icon192Html);
  await page.screenshot({ path: path.join(__dirname, '../public/icon-192.png') });
  console.log('OK icon-192');

  // 3. Generate 512x512 Maskable Icon
  const iconMaskableHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: 512px;
          height: 512px;
          background: #070D18;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .container {
          position: relative;
          width: 512px;
          height: 512px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at 50% 40%, #111F33 0%, #070D18 90%);
        }
        .car-svg {
          width: 140px;
          height: 140px;
          fill: none;
          stroke: #0EA5A4;
          stroke-width: 2.2;
          stroke-linecap: round;
          stroke-linejoin: round;
          filter: drop-shadow(0 4px 16px rgba(14, 165, 164, 0.8));
        }
        .logo-text {
          margin-top: 14px;
          font-size: 34px;
          font-weight: 900;
          letter-spacing: -0.5px;
          color: #FFFFFF;
        }
        .brand-highlight {
          color: #0EA5A4;
        }
        .sub-text {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 4px;
          color: #38BDF8;
          margin-top: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <svg class="car-svg" viewBox="0 0 24 24">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <path d="M9 17h6" />
          <circle cx="17" cy="17" r="2" />
        </svg>
        <div class="logo-text">
          <span>SR</span> <span class="brand-highlight">Logística</span>
        </div>
        <div class="sub-text">MOTORISTA</div>
      </div>
    </body>
    </html>
  `;

  await page.setViewportSize({ width: 512, height: 512 });
  await page.setContent(iconMaskableHtml);
  await page.screenshot({ path: path.join(__dirname, '../public/icon-512-maskable.png') });
  console.log('OK icon-512-maskable');

  // 4. Generate Mobile Showcase Screenshot (1080x1920)
  const screenshotMobileHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: 1080px;
          height: 1920px;
          background: #070D18;
          display: flex;
          flex-direction: column;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #FFFFFF;
          padding: 80px 60px;
          justify-content: space-between;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .badge {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .badge-icon {
          width: 72px;
          height: 72px;
          border-radius: 24px;
          background: rgba(14, 165, 164, 0.2);
          border: 2px solid rgba(14, 165, 164, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0EA5A4;
        }
        .badge-title { font-size: 36px; font-weight: 900; }
        .hero {
          margin: 60px 0;
          text-align: center;
        }
        .hero h1 {
          font-size: 60px;
          font-weight: 900;
          line-height: 1.15;
          margin-bottom: 24px;
        }
        .hero p {
          font-size: 26px;
          color: #94A3B8;
          line-height: 1.5;
        }
        .card-grid {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 32px;
          padding: 36px;
          display: flex;
          align-items: center;
          gap: 28px;
        }
        .card-icon {
          width: 72px;
          height: 72px;
          border-radius: 22px;
          background: rgba(14, 165, 164, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
        }
        .card-title { font-size: 28px; font-weight: 800; color: #FFF; margin-bottom: 8px; }
        .card-desc { font-size: 20px; color: #94A3B8; }
        .actions {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: 40px;
        }
        .btn-primary {
          background: #0EA5A4;
          color: #070D18;
          padding: 32px;
          border-radius: 28px;
          font-size: 30px;
          font-weight: 900;
          text-align: center;
        }
        .btn-secondary {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #FFF;
          padding: 30px;
          border-radius: 28px;
          font-size: 28px;
          font-weight: 800;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="badge">
          <div class="badge-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0EA5A4" stroke-width="2.5"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
          </div>
          <div class="badge-title">SR <span style="color:#0EA5A4">Logística</span></div>
        </div>
      </div>

      <div class="hero">
        <h1>Central Oficial do Motorista</h1>
        <p>Receba corridas corporativas e particulares com rentabilidade transparente e repasses imediatos.</p>
      </div>

      <div class="card-grid">
        <div class="card">
          <div class="card-icon">⚡</div>
          <div>
            <div class="card-title">Repasses Imediatos</div>
            <div class="card-desc">Transferências via PIX com extrato e saldo em tempo real.</div>
          </div>
        </div>
        <div class="card">
          <div class="card-icon">📍</div>
          <div>
            <div class="card-title">Despacho Inteligente</div>
            <div class="card-desc">Filtros de rentabilidade e radar de demanda nas melhores regiões.</div>
          </div>
        </div>
        <div class="card">
          <div class="card-icon">🛡️</div>
          <div>
            <div class="card-title">Segurança 24 Horas</div>
            <div class="card-desc">Monitoramento e suporte direto com a central operacional da frota.</div>
          </div>
        </div>
      </div>

      <div class="actions">
        <div class="btn-primary">Entrar na Minha Conta</div>
        <div class="btn-secondary">Cadastrar Nova Conta</div>
      </div>
    </body>
    </html>
  `;

  await page.setViewportSize({ width: 1080, height: 1920 });
  await page.setContent(screenshotMobileHtml);
  await page.screenshot({ path: path.join(__dirname, '../public/screenshot-mobile.png') });
  console.log('OK screenshot-mobile');

  // 5. Generate Desktop Showcase Screenshot (1920x1080)
  const screenshotDesktopHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: 1920px;
          height: 1080px;
          background: #070D18;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #FFFFFF;
          padding: 80px;
        }
        .container {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 80px;
          width: 100%;
          align-items: center;
        }
        .left-content h1 {
          font-size: 64px;
          font-weight: 900;
          line-height: 1.15;
          margin-bottom: 24px;
        }
        .left-content p {
          font-size: 22px;
          color: #94A3B8;
          line-height: 1.6;
          margin-bottom: 40px;
        }
        .stats-row {
          display: flex;
          gap: 32px;
        }
        .stat-box {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 24px 32px;
        }
        .stat-num { font-size: 36px; font-weight: 900; color: #0EA5A4; }
        .stat-label { font-size: 14px; color: #94A3B8; margin-top: 4px; }
        .right-preview {
          background: rgba(14, 165, 164, 0.05);
          border: 2px solid rgba(14, 165, 164, 0.3);
          border-radius: 36px;
          padding: 48px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.6);
        }
        .preview-title { font-size: 28px; font-weight: 900; margin-bottom: 20px; color: #FFF; }
        .preview-list { display: flex; flex-direction: column; gap: 16px; }
        .preview-item {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 18px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="left-content">
          <div style="font-size: 16px; font-weight: 800; color: #0EA5A4; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 12px;">
            Plataforma Corporativa de Despacho
          </div>
          <h1>SR Logística<br/><span style="color:#0EA5A4">App do Motorista</span></h1>
          <p>O ecossistema definitivo para corridas executivas, fretamento e transporte sob demanda com acompanhamento em tempo real.</p>
          <div class="stats-row">
            <div class="stat-box">
              <div class="stat-num">100%</div>
              <div class="stat-label">Corridas Seguras</div>
            </div>
            <div class="stat-box">
              <div class="stat-num">24/7</div>
              <div class="stat-label">Suporte Central</div>
            </div>
            <div class="stat-box">
              <div class="stat-num">PIX</div>
              <div class="stat-label">Repasse Imediato</div>
            </div>
          </div>
        </div>
        <div class="right-preview">
          <div class="preview-title">Painel Operacional</div>
          <div class="preview-list">
            <div class="preview-item">
              <span>Status Operacional</span>
              <strong style="color: #10B981;">Online &amp; Conectado</strong>
            </div>
            <div class="preview-item">
              <span>Radar de Demanda</span>
              <strong style="color: #0EA5A4;">Ativo na Região</strong>
            </div>
            <div class="preview-item">
              <span>Filtro de Rentabilidade</span>
              <strong style="color: #F59E0B;">Otimizado</strong>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.setContent(screenshotDesktopHtml);
  await page.screenshot({ path: path.join(__dirname, '../public/screenshot-desktop.png') });
  console.log('OK screenshot-desktop');

  await browser.close();
  console.log('ALL DONE');
}

run().catch(console.error);
