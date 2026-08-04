#!/usr/bin/env node
// Dynamic screenshot capture script using Playwright.
// Serves the built files locally and takes screenshots of new tools in dark mode
// for both Facebook and Instagram (1:1 square).

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const TOOLS_JSON = path.join(ROOT, 'data', 'tools.json');

const ADDED_TOOLS = process.env.ADDED_TOOLS || '';
if (!ADDED_TOOLS || ADDED_TOOLS === 'none') {
  console.log("ℹ️ No new tools added today. Skipping screenshot capture.");
  process.exit(0);
}

const toolIds = ADDED_TOOLS.split(',').map(id => id.trim()).filter(Boolean);

// Start a local static server to serve the built files in dist/
const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  let filePath = path.join(DIST, urlPath === '/' ? 'index.html' : urlPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not Found");
    } else {
      const ext = path.extname(filePath);
      const contentTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml'
      };
      res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
      res.end(data);
    }
  });
});

const PORT = 4173;
server.listen(PORT, async () => {
  console.log(`📡 Local server listening on http://localhost:${PORT}`);
  
  try {
    const { chromium } = await import('playwright');
    const tools = JSON.parse(fs.readFileSync(TOOLS_JSON, 'utf8'));
    
    for (const toolId of toolIds) {
      const tool = tools.find(t => t.id === toolId);
      if (!tool) {
        console.warn(`⚠️ Tool ID "${toolId}" not found in tools.json`);
        continue;
      }
      
      console.log(`📸 Taking screenshots of tool: ${tool.title}...`);
      const browser = await chromium.launch();
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 1200 }); // Square size for Instagram posts
      
      await page.goto(`http://localhost:${PORT}/tools/${toolId}`);
      await page.waitForSelector('#tool-app');
      
      // Force Dark Mode on target page
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
      });
      await page.waitForTimeout(1000); // Let layout transition finish
      
      const screenshotDir = path.join(ROOT, 'public', 'assets', 'tools');
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }

      // Helper function to pad a captured element screenshot into a 1:1 square image for Instagram
      const captureSquare = async (element, outPath) => {
        const box = await element.boundingBox();
        if (!box) {
          await element.screenshot({ path: outPath });
          return;
        }
        
        // Take a raw screenshot of the element first
        const rawPath = outPath.replace('.png', '-raw.png');
        await element.screenshot({ path: rawPath });
        
        // Use Playwright page evaluate to generate a square canvas loading the raw image,
        // center it vertically, and paint it on a dark theme backdrop background (#07060C)
        const size = Math.max(Math.ceil(box.width), Math.ceil(box.height), 600);
        const rawBase64 = fs.readFileSync(rawPath).toString('base64');
        fs.unlinkSync(rawPath);

        const canvasPage = await browser.newPage();
        await canvasPage.setContent(`
          <style>
            body {
              margin: 0;
              background-color: #07060C;
              display: flex;
              align-items: center;
              justify-content: center;
              width: ${size}px;
              height: ${size}px;
              overflow: hidden;
            }
            img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }
          </style>
          <body>
            <img src="data:image/png;base64,${rawBase64}" />
          </body>
        `);
        
        await canvasPage.setViewportSize({ width: size, height: size });
        await canvasPage.screenshot({ path: outPath });
        await canvasPage.close();
      };

      // --- SCREENSHOT 1: Header + Workspace ---
      await page.evaluate(() => {
        document.querySelector('.prose').style.display = 'none';
        document.querySelector('.tool-page > .section').style.display = 'none';
        document.querySelector('footer').style.display = 'none';
      });
      const p1PathFb = path.join(screenshotDir, `${toolId}-social-1.png`);
      const p1PathIg = path.join(screenshotDir, `${toolId}-social-1-ig.png`);
      const toolPageEl = await page.$('.tool-page');
      
      await toolPageEl.screenshot({ path: p1PathFb });
      await captureSquare(toolPageEl, p1PathIg);
      console.log(`✓ Saved Screenshot 1: ${p1PathFb} and ${p1PathIg}`);

      // --- SCREENSHOT 2: How it works + Examples ---
      await page.evaluate(() => {
        document.querySelector('.prose').style.display = 'block';
        document.querySelector('.tool-header').style.display = 'none';
        document.querySelector('#tool-app').style.display = 'none';
        
        // Hide FAQ part
        const h2s = document.querySelectorAll('.prose h2');
        if (h2s[2]) h2s[2].style.display = 'none';
        const faq = document.querySelector('.faq');
        if (faq) faq.style.display = 'none';
      });
      const p2PathFb = path.join(screenshotDir, `${toolId}-social-2.png`);
      const p2PathIg = path.join(screenshotDir, `${toolId}-social-2-ig.png`);
      const proseEl = await page.$('.prose');
      
      await proseEl.screenshot({ path: p2PathFb });
      await captureSquare(proseEl, p2PathIg);
      console.log(`✓ Saved Screenshot 2: ${p2PathFb} and ${p2PathIg}`);

      // --- SCREENSHOT 3: FAQ ---
      await page.evaluate(() => {
        const h2s = document.querySelectorAll('.prose h2');
        if (h2s[0]) h2s[0].style.display = 'none';
        const ol = document.querySelector('.prose ol');
        if (ol) ol.style.display = 'none';
        if (h2s[1]) h2s[1].style.display = 'none';
        const ul = document.querySelector('.prose ul');
        if (ul) ul.style.display = 'none';
        
        if (h2s[2]) h2s[2].style.display = 'block';
        const faq = document.querySelector('.faq');
        if (faq) faq.style.display = 'block';
      });
      const p3PathFb = path.join(screenshotDir, `${toolId}-social-3.png`);
      const p3PathIg = path.join(screenshotDir, `${toolId}-social-3-ig.png`);
      
      await proseEl.screenshot({ path: p3PathFb });
      await captureSquare(proseEl, p3PathIg);
      console.log(`✓ Saved Screenshot 3: ${p3PathFb} and ${p3PathIg}`);

      // --- SCREENSHOT 4: Related Tools ---
      await page.evaluate(() => {
        document.querySelector('.tool-page > .section').style.display = 'block';
      });
      const p4PathFb = path.join(screenshotDir, `${toolId}-social-4.png`);
      const p4PathIg = path.join(screenshotDir, `${toolId}-social-4-ig.png`);
      const relatedEl = await page.$('.tool-page > .section');
      
      await relatedEl.screenshot({ path: p4PathFb });
      await captureSquare(relatedEl, p4PathIg);
      console.log(`✓ Saved Screenshot 4: ${p4PathFb} and ${p4PathIg}`);

      // --- SCREENSHOT 5: Footer ---
      await page.evaluate(() => {
        document.querySelector('footer').style.display = 'block';
      });
      const p5PathFb = path.join(screenshotDir, `${toolId}-social-5.png`);
      const p5PathIg = path.join(screenshotDir, `${toolId}-social-5-ig.png`);
      const footerEl = await page.$('footer');
      
      await footerEl.screenshot({ path: p5PathFb });
      await captureSquare(footerEl, p5PathIg);
      console.log(`✓ Saved Screenshot 5: ${p5PathFb} and ${p5PathIg}`);

      await browser.close();
    }
  } catch (err) {
    console.error("❌ Screenshot generation failed:", err);
  } finally {
    server.close(() => {
      console.log("📡 Server stopped. Exiting.");
      process.exit(0);
    });
  }
});
