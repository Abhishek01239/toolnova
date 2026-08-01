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
      
      const screenshotPaths = [];
      const screenshotDir = path.join(ROOT, 'public', 'assets', 'tools');
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }

      // --- SCREENSHOT 1: Header + Workspace ---
      await page.evaluate(() => {
        document.querySelector('.prose').style.display = 'none';
        document.querySelector('.tool-page > .section').style.display = 'none';
        document.querySelector('footer').style.display = 'none';
      });
      const p1Path = path.join(screenshotDir, `${toolId}-social-1.png`);
      const toolPageEl = await page.$('.tool-page');
      await toolPageEl.screenshot({ path: p1Path });
      screenshotPaths.push(p1Path);

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
      const p2Path = path.join(screenshotDir, `${toolId}-social-2.png`);
      const proseEl = await page.$('.prose');
      await proseEl.screenshot({ path: p2Path });
      screenshotPaths.push(p2Path);

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
      const p3Path = path.join(screenshotDir, `${toolId}-social-3.png`);
      await proseEl.screenshot({ path: p3Path });
      screenshotPaths.push(p3Path);

      // --- SCREENSHOT 4: Related Tools ---
      await page.evaluate(() => {
        document.querySelector('.tool-page > .section').style.display = 'block';
      });
      const p4Path = path.join(screenshotDir, `${toolId}-social-4.png`);
      const relatedEl = await page.$('.tool-page > .section');
      await relatedEl.screenshot({ path: p4Path });
      screenshotPaths.push(p4Path);

      // --- SCREENSHOT 5: Footer ---
      await page.evaluate(() => {
        document.querySelector('footer').style.display = 'block';
      });
      const p5Path = path.join(screenshotDir, `${toolId}-social-5.png`);
      const footerEl = await page.$('footer');
      await footerEl.screenshot({ path: p5Path });
      screenshotPaths.push(p5Path);

      await browser.close();
      
      // --- UPLOAD ALL 5 IMAGES TO LITTERBOX ---
      const rawImageUrls = [];
      for (let i = 0; i < screenshotPaths.length; i++) {
        console.log(`📤 Uploading screenshot ${i+1}/5 to Litterbox...`);
        const fileBuffer = fs.readFileSync(screenshotPaths[i]);
        const fileBlob = new Blob([fileBuffer], { type: 'image/png' });
        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('time', '1h');
        formData.append('fileToUpload', fileBlob, `${toolId}-social-${i+1}.png`);
        
        const uploadRes = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
          method: 'POST',
          body: formData
        });
        
        if (!uploadRes.ok) {
          throw new Error(`Upload failed: ${uploadRes.statusText}`);
        }
        
        const rawImageUrl = await uploadRes.text();
        console.log(`🔗 Photo ${i+1} URL: ${rawImageUrl}`);
        rawImageUrls.push(rawImageUrl.trim());
      }
      
      // Prepare templates
      const site = JSON.parse(fs.readFileSync(SITE_JSON, 'utf8'));
      const siteUrl = site.url.replace(/\/$/, ''); // Remove trailing slash
      const toolLink = `${siteUrl}/tools/${toolId}`;
      const captionText = `🚀 New Tool Release: [ ${tool.title.toUpperCase()} ]! 🚀\n\nCheck out our brand new utility, live now and 100% free!\n\n👉 Try it here: ${toolLink}\n\n${tool.blurb || tool.description}\n\n🔒 Private by design: runs entirely in your browser — your data never leaves your device.\n\n#toolnova #freewebtools #productivity #developer #utilities #freeapps`;
      const igCaption = `🚀 NEW TOOL RELEASE: [ ${tool.title.toUpperCase()} ]! 🚀\n\nWe just added a brand-new tool to ToolNova!\n\n${tool.blurb || tool.description}\n\n👉 Try it now! Link in bio: @toolnova_home\n\n🔒 100% Private: runs entirely in your browser. No sign-up, no cost.\n\n#toolnova #developer #productivity #webapps #designer #usefulwebsites #freeonlineapps #coder`;
      
      // --- 1. PUBLISH TO FACEBOOK AS A MULTI-PHOTO CAROUSEL ---
      console.log(`📣 Uploading carousel images to Facebook Page...`);
      const fbPhotoIds = [];
      for (const url of rawImageUrls) {
        const fbPhotoRes = await fetch(`https://graph.facebook.com/v20.0/${process.env.FB_PAGE_ID}/photos`, {
          method: 'POST',
          body: new URLSearchParams({
            url: url,
            published: 'false', // Keep unpublished until feed post is made
            access_token: process.env.FB_PAGE_ACCESS_TOKEN
          })
        });
        const fbPhotoJson = await fbPhotoRes.json();
        if (fbPhotoJson.id) {
          fbPhotoIds.push(fbPhotoJson.id);
        } else {
          console.error("❌ Facebook Photo Upload Error:", fbPhotoJson.error);
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
      for (const url of rawImageUrls) {
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

      if (igItemIds.length === rawImageUrls.length) {
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
