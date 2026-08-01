#!/usr/bin/env node
// Automated social media publisher.
// Starts a local server, uses Playwright to screenshot the tool,
// uploads the image to tmpfiles.org, and posts to Facebook & Instagram.

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const TOOLS_JSON = path.join(ROOT, 'data', 'tools.json');
const SITE_JSON = path.join(ROOT, 'data', 'site.json');

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
      
      console.log(`📸 Taking screenshot of tool: ${tool.title}...`);
      const browser = await chromium.launch();
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1080, height: 1080 }); // Square size for Instagram posts
      
      await page.goto(`http://localhost:${PORT}/tools/${toolId}`);
      await page.waitForSelector('#tool-app');
      
      // Wait for layout rendering and fonts
      await page.waitForTimeout(1000);
      
      const screenshotPath = path.join(ROOT, `${toolId}-social.png`);
      const appEl = await page.$('#tool-app');
      if (appEl) {
        await appEl.screenshot({ path: screenshotPath });
      } else {
        await page.screenshot({ path: screenshotPath });
      }
      
      await browser.close();
      
      console.log(`📤 Uploading screenshot to tmpfiles.org...`);
      const fileBuffer = fs.readFileSync(screenshotPath);
      const fileBlob = new Blob([fileBuffer], { type: 'image/png' });
      const formData = new FormData();
      formData.append('file', fileBlob, `${toolId}-social.png`);
      
      const uploadRes = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadRes.ok) {
        throw new Error(`Upload failed: ${uploadRes.statusText}`);
      }
      
      const uploadJson = await uploadRes.json();
      const rawImageUrl = uploadJson.data.url.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/');
      console.log(`🔗 Public temporary image URL: ${rawImageUrl}`);
      
      // Prepare templates
      const site = JSON.parse(fs.readFileSync(SITE_JSON, 'utf8'));
      const siteUrl = site.url.replace(/\/$/, ''); // Remove trailing slash
      const toolLink = `${siteUrl}/tools/${toolId}`;
      const captionText = `🚀 New Tool Release: [ ${tool.title.toUpperCase()} ]! 🚀\n\nCheck out our brand new utility, live now and 100% free!\n\n👉 Try it here: ${toolLink}\n\n${tool.blurb || tool.description}\n\n🔒 Private by design: runs entirely in your browser — your data never leaves your device.\n\n#toolnova #freewebtools #productivity #developer #utilities #freeapps`;
      const igCaption = `🚀 NEW TOOL RELEASE: [ ${tool.title.toUpperCase()} ]! 🚀\n\nWe just added a brand-new tool to ToolNova!\n\n${tool.blurb || tool.description}\n\n👉 Try it now! Link in bio: @toolnova_home\n\n🔒 100% Private: runs entirely in your browser. No sign-up, no cost.\n\n#toolnova #developer #productivity #webapps #designer #usefulwebsites #freeonlineapps #coder`;
      
      // 1. Post to Facebook
      console.log(`📣 Posting to Facebook Page...`);
      const fbRes = await fetch(`https://graph.facebook.com/v20.0/${process.env.FB_PAGE_ID}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: captionText,
          link: toolLink,
          access_token: process.env.FB_PAGE_ACCESS_TOKEN
        })
      });
      const fbJson = await fbRes.json();
      if (fbJson.error) {
        console.error("❌ Facebook Post Error:", fbJson.error);
      } else {
        console.log(`✅ Facebook post published! ID: ${fbJson.id}`);
      }
      
      // 2. Post to Instagram
      console.log(`📸 Uploading container to Instagram...`);
      const igContainerRes = await fetch(`https://graph.facebook.com/v20.0/${process.env.IG_BUSINESS_ID}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: rawImageUrl,
          caption: igCaption,
          access_token: process.env.FB_PAGE_ACCESS_TOKEN
        })
      });
      const igContainerJson = await igContainerRes.json();
      
      if (igContainerJson.error) {
        console.error("❌ Instagram Container Error:", igContainerJson.error);
      } else {
        const creationId = igContainerJson.id;
        console.log(`📣 Publishing Instagram container: ${creationId}...`);
        const igPublishRes = await fetch(`https://graph.facebook.com/v20.0/${process.env.IG_BUSINESS_ID}/media_publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: creationId,
            access_token: process.env.FB_PAGE_ACCESS_TOKEN
          })
        });
        const igPublishJson = await igPublishRes.json();
        if (igPublishJson.error) {
          console.error("❌ Instagram Publish Error:", igPublishJson.error);
        } else {
          console.log(`✅ Instagram post published! ID: ${igPublishJson.id}`);
        }
      }
      
      // Cleanup local temp screenshot file
      try {
        fs.unlinkSync(screenshotPath);
      } catch (err) {
        // ignore
      }
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
