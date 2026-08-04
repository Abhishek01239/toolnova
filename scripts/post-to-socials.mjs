#!/usr/bin/env node
// Automated social media publisher.
// Starts a local server, uses Playwright to screenshot the tool in dark mode,
// takes 5 screenshots of the page sections, uploads them to Litterbox,
// and posts them as a Carousel (multi-photo post) on Facebook & Instagram.

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const TOOLS_JSON = path.join(ROOT, 'data', 'tools.json');
const SITE_JSON = path.join(ROOT, 'data', 'site.json');

// Helper to poll the status of an Instagram media container until it is fully processed.
const waitForInstagramMediaReady = async (containerId, accessToken) => {
  const maxRetries = 20;
  const delayMs = 3000;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(`https://graph.facebook.com/v20.0/${containerId}?fields=status_code&access_token=${accessToken}`);
      const json = await res.json();
      if (json.status_code === 'FINISHED') {
        return true;
      }
      if (json.status_code === 'ERROR') {
        console.error(`❌ Instagram Media Container ${containerId} failed processing:`, json.error || json);
        return false;
      }
      console.log(`⏳ Instagram Media ${containerId} status is ${json.status_code || 'UNKNOWN'} (attempt ${attempt}/${maxRetries}). Waiting...`);
    } catch (err) {
      console.warn(`⚠️ Error checking status of ${containerId}:`, err);
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  console.error(`❌ Timeout waiting for Instagram Media ${containerId} to finish processing.`);
  return false;
};


// Graceful check for credentials
if (!process.env.FB_PAGE_ID || !process.env.FB_PAGE_ACCESS_TOKEN || !process.env.IG_BUSINESS_ID) {
  console.log("⚠️ Meta API credentials not found. Skipping automated posting.");
  process.exit(0);
}

const ADDED_TOOLS = process.env.ADDED_TOOLS || '';
if (!ADDED_TOOLS || ADDED_TOOLS === 'none') {
  console.log("ℹ️ No new tools added today. Skipping social posts.");
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
      
      const fbScreenshotPaths = [];
      const igScreenshotPaths = [];
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
      fbScreenshotPaths.push(p1PathFb);
      igScreenshotPaths.push(p1PathIg);

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
      fbScreenshotPaths.push(p2PathFb);
      igScreenshotPaths.push(p2PathIg);

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
      fbScreenshotPaths.push(p3PathFb);
      igScreenshotPaths.push(p3PathIg);

      // --- SCREENSHOT 4: Related Tools ---
      await page.evaluate(() => {
        document.querySelector('.tool-page > .section').style.display = 'block';
      });
      const p4PathFb = path.join(screenshotDir, `${toolId}-social-4.png`);
      const p4PathIg = path.join(screenshotDir, `${toolId}-social-4-ig.png`);
      const relatedEl = await page.$('.tool-page > .section');
      
      await relatedEl.screenshot({ path: p4PathFb });
      await captureSquare(relatedEl, p4PathIg);
      fbScreenshotPaths.push(p4PathFb);
      igScreenshotPaths.push(p4PathIg);

      // --- SCREENSHOT 5: Footer ---
      await page.evaluate(() => {
        document.querySelector('footer').style.display = 'block';
      });
      const p5PathFb = path.join(screenshotDir, `${toolId}-social-5.png`);
      const p5PathIg = path.join(screenshotDir, `${toolId}-social-5-ig.png`);
      const footerEl = await page.$('footer');
      
      await footerEl.screenshot({ path: p5PathFb });
      await captureSquare(footerEl, p5PathIg);
      fbScreenshotPaths.push(p5PathFb);
      igScreenshotPaths.push(p5PathIg);

      await browser.close();
      
      // --- UPLOAD IMAGES FOR INSTAGRAM TO LITTERBOX ---
      // (Instagram Graph API strictly requires public URLs for image media containers)
      const igImageUrls = [];
      for (let i = 0; i < igScreenshotPaths.length; i++) {
        console.log(`📤 Uploading Instagram screenshot ${i+1}/5 to Litterbox...`);
        const fileBuffer = fs.readFileSync(igScreenshotPaths[i]);
        const fileBlob = new Blob([fileBuffer], { type: 'image/png' });
        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('time', '1h');
        formData.append('fileToUpload', fileBlob, `${toolId}-social-${i+1}-ig.png`);
        
        const uploadRes = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
          method: 'POST',
          body: formData
        });
        if (!uploadRes.ok) throw new Error(`IG Upload failed: ${uploadRes.statusText}`);
        const rawImageUrl = await uploadRes.text();
        console.log(`🔗 IG Photo ${i+1} URL: ${rawImageUrl}`);
        igImageUrls.push(rawImageUrl.trim());
      }
      
      // Prepare templates
      const site = JSON.parse(fs.readFileSync(SITE_JSON, 'utf8'));
      const siteUrl = site.url.replace(/\/$/, ''); // Remove trailing slash
      const toolLink = `${siteUrl}/tools/${toolId}`;
      const captionText = `🚀 New Tool Release: [ ${tool.title.toUpperCase()} ]! 🚀\n\nCheck out our brand new utility, live now and 100% free!\n\n👉 Try it here: ${toolLink}\n\n${tool.blurb || tool.description}\n\n🔒 Private by design: runs entirely in your browser — your data never leaves your device.\n\n#toolnova #freewebtools #productivity #developer #utilities #freeapps`;
      const igCaption = `🚀 NEW TOOL RELEASE: [ ${tool.title.toUpperCase()} ]! 🚀\n\nWe just added a brand-new tool to ToolNova!\n\n${tool.blurb || tool.description}\n\n👉 Try it now! Link in bio: @toolnova_home\n\n🔒 100% Private: runs entirely in your browser. No sign-up, no cost.\n\n#toolnova #developer #productivity #webapps #designer #usefulwebsites #freeonlineapps #coder`;
      
      // --- 1. PUBLISH TO FACEBOOK AS A MULTI-PHOTO CAROUSEL (DIRECT BINARY UPLOAD) ---
      console.log(`📣 Uploading carousel images directly to Facebook Page...`);
      const fbPhotoIds = [];
      for (let i = 0; i < fbScreenshotPaths.length; i++) {
        try {
          const fileBuffer = fs.readFileSync(fbScreenshotPaths[i]);
          const fileBlob = new Blob([fileBuffer], { type: 'image/png' });
          const formData = new FormData();
          formData.append('source', fileBlob, `${toolId}-social-${i+1}.png`);
          formData.append('published', 'false');
          formData.append('access_token', process.env.FB_PAGE_ACCESS_TOKEN);

          const fbPhotoRes = await fetch(`https://graph.facebook.com/v20.0/${process.env.FB_PAGE_ID}/photos`, {
            method: 'POST',
            body: formData
          });
          const fbPhotoJson = await fbPhotoRes.json();
          if (fbPhotoJson.id) {
            fbPhotoIds.push(fbPhotoJson.id);
            console.log(`🔗 Facebook Photo ${i+1} uploaded. ID: ${fbPhotoJson.id}`);
          } else {
            console.error(`❌ Facebook Photo ${i+1} Upload Error:`, fbPhotoJson.error);
          }
        } catch (err) {
          console.error(`❌ Facebook Photo ${i+1} Upload Exception:`, err);
        }
      }

      if (fbPhotoIds.length > 0) {
        console.log(`📣 Publishing Facebook carousel post...`);
        const mediaList = fbPhotoIds.map(id => ({ media_fbid: id }));
        const fbFeedRes = await fetch(`https://graph.facebook.com/v20.0/${process.env.FB_PAGE_ID}/feed`, {
          method: 'POST',
          body: new URLSearchParams({
            message: captionText,
            attached_media: JSON.stringify(mediaList),
            access_token: process.env.FB_PAGE_ACCESS_TOKEN
          })
        });
        const fbFeedJson = await fbFeedRes.json();
        if (fbFeedJson.error) {
          console.error("❌ Facebook Feed Publish Error:", fbFeedJson.error);
        } else {
          console.log(`✅ Facebook carousel post published! ID: ${fbFeedJson.id}`);
        }
      }
      
      // --- 2. PUBLISH TO INSTAGRAM AS A CAROUSEL ---
      console.log(`📸 Creating Instagram carousel item containers...`);
      const igItemIds = [];
      for (const url of igImageUrls) {
        const igItemRes = await fetch(`https://graph.facebook.com/v20.0/${process.env.IG_BUSINESS_ID}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: url,
            is_carousel_item: true,
            access_token: process.env.FB_PAGE_ACCESS_TOKEN
          })
        });
        const igItemJson = await igItemRes.json();
        if (igItemJson.id) {
          igItemIds.push(igItemJson.id);
        } else {
          console.error("❌ Instagram Carousel Item Error:", igItemJson.error);
        }
      }

      if (igItemIds.length === igImageUrls.length) {
        console.log(`⏳ Waiting for Instagram carousel item containers to finish processing...`);
        const waitResults = await Promise.all(
          igItemIds.map(id => waitForInstagramMediaReady(id, process.env.FB_PAGE_ACCESS_TOKEN))
        );

        if (waitResults.every(res => res === true)) {
          console.log(`📣 Creating Instagram carousel parent container...`);
          const igParentRes = await fetch(`https://graph.facebook.com/v20.0/${process.env.IG_BUSINESS_ID}/media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              media_type: 'CAROUSEL',
              children: igItemIds,
              caption: igCaption,
              access_token: process.env.FB_PAGE_ACCESS_TOKEN
            })
          });
          const igParentJson = await igParentRes.json();
          if (igParentJson.error) {
            console.error("❌ Instagram Carousel Parent Error:", igParentJson.error);
          } else {
            const parentId = igParentJson.id;
            console.log(`⏳ Waiting for Instagram carousel parent container to finish processing...`);
            const parentReady = await waitForInstagramMediaReady(parentId, process.env.FB_PAGE_ACCESS_TOKEN);
            if (parentReady) {
              console.log(`📣 Publishing Instagram carousel container: ${parentId}...`);
              const igPublishRes = await fetch(`https://graph.facebook.com/v20.0/${process.env.IG_BUSINESS_ID}/media_publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  creation_id: parentId,
                  access_token: process.env.FB_PAGE_ACCESS_TOKEN
                })
              });
              const igPublishJson = await igPublishRes.json();
              if (igPublishJson.error) {
                console.error("❌ Instagram Publish Error:", igPublishJson.error);
              } else {
                console.log(`✅ Instagram carousel post published! ID: ${igPublishJson.id}`);
              }
            } else {
              console.error("❌ Instagram carousel parent container failed to become ready.");
            }
          }
        } else {
          console.error("❌ One or more Instagram carousel item containers failed to finish processing.");
        }
      }
      
      // Cleanup IG-specific padded image files from local disk to prevent repo bloat
      for (const igPath of igScreenshotPaths) {
        try {
          fs.unlinkSync(igPath);
        } catch (err) {
          // ignore
        }
      }
      
      // Keep screenshots in repo assets for static page og:image tags (Screenshot 1 acts as default)
    }
  } catch (err) {
    console.error("❌ Social media post automation failed:", err);
  } finally {
    server.close(() => {
      console.log("📡 Server stopped. Exiting.");
      process.exit(0);
    });
  }
});
