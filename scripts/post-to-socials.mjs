#!/usr/bin/env node
// Automated social media publisher.
// Posts new tools as a Carousel (multi-photo post) on Facebook & Instagram
// using local files for Facebook and raw GitHub CDN URLs for Instagram.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
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

async function main() {
  // Exchange System User Token for Page Access Token (needed for Facebook unpublished posts)
  let pageAccessToken = process.env.FB_PAGE_ACCESS_TOKEN;
  try {
    console.log("🔑 Exchanging System User Token for Page Access Token...");
    const pageInfoRes = await fetch(`https://graph.facebook.com/v20.0/${process.env.FB_PAGE_ID}?fields=access_token&access_token=${process.env.FB_PAGE_ACCESS_TOKEN}`);
    const pageInfoJson = await pageInfoRes.json();
    if (pageInfoJson.access_token) {
      pageAccessToken = pageInfoJson.access_token;
      console.log("🔑 Successfully obtained Page Access Token!");
    } else {
      console.warn("⚠️ Could not exchange token automatically. Using raw FB_PAGE_ACCESS_TOKEN directly.", pageInfoJson.error || pageInfoJson);
    }
  } catch (err) {
    console.warn("⚠️ Token exchange failed with exception, using raw FB_PAGE_ACCESS_TOKEN directly:", err);
  }

  try {
    const tools = JSON.parse(fs.readFileSync(TOOLS_JSON, 'utf8'));
    const screenshotDir = path.join(ROOT, 'public', 'assets', 'tools');
    const repo = process.env.GITHUB_REPOSITORY || 'Abhishek01239/toolnova';
    
    for (const toolId of toolIds) {
      const tool = tools.find(t => t.id === toolId);
      if (!tool) {
        console.warn(`⚠️ Tool ID "${toolId}" not found in tools.json`);
        continue;
      }

      console.log(`📣 Preparing posts for tool: ${tool.title}...`);

      const fbScreenshotPaths = [];
      const igImageUrls = [];

      for (let i = 1; i <= 5; i++) {
        fbScreenshotPaths.push(path.join(screenshotDir, `${toolId}-social-${i}.png`));
        igImageUrls.push(`https://raw.githubusercontent.com/${repo}/main/public/assets/tools/${toolId}-social-${i}-ig.png`);
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
          if (!fs.existsSync(fbScreenshotPaths[i])) {
            console.error(`❌ Facebook screenshot missing: ${fbScreenshotPaths[i]}`);
            continue;
          }
          const fileBuffer = fs.readFileSync(fbScreenshotPaths[i]);
          const fileBlob = new Blob([fileBuffer], { type: 'image/png' });
          const formData = new FormData();
          formData.append('source', fileBlob, `${toolId}-social-${i+1}.png`);
          formData.append('published', 'false');
          formData.append('access_token', pageAccessToken);

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
            access_token: pageAccessToken
          })
        });
        const fbFeedJson = await fbFeedRes.json();
        if (fbFeedJson.error) {
          console.error("❌ Facebook Feed Publish Error:", fbFeedJson.error);
        } else {
          console.log(`✅ Facebook carousel post published! ID: ${fbFeedJson.id}`);
        }
      }

      // --- 2. PUBLISH TO INSTAGRAM AS A CAROUSEL (USING GITHUB CDN URLS) ---
      console.log(`📸 Creating Instagram carousel item containers...`);
      const igItemIds = [];
      for (let i = 0; i < igImageUrls.length; i++) {
        const url = igImageUrls[i];
        console.log(`🔗 Instagram Carousel Item ${i+1}/5 URL: ${url}`);
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
          console.error(`❌ Instagram Carousel Item ${i+1} Error:`, igItemJson.error);
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
              // Meta throttles the Graph API ("Application request limit
              // reached", code 4). A short backoff often clears a transient
              // throttle, so retry the publish instead of dropping the post.
              let igPublishJson = null;
              for (let pubAttempt = 1; pubAttempt <= 3; pubAttempt++) {
                const igPublishRes = await fetch(`https://graph.facebook.com/v20.0/${process.env.IG_BUSINESS_ID}/media_publish`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    creation_id: parentId,
                    access_token: process.env.FB_PAGE_ACCESS_TOKEN
                  })
                });
                igPublishJson = await igPublishRes.json();
                if (!igPublishJson.error) break;
                const isThrottle = igPublishJson.error && (igPublishJson.error.code === 4 || /request limit reached/i.test(igPublishJson.error.message || ''));
                if (!isThrottle || pubAttempt === 3) {
                  console.error(`❌ Instagram Publish Error (attempt ${pubAttempt}):`, igPublishJson.error);
                  igPublishJson = { error: igPublishJson.error };
                  break;
                }
                const backoff = pubAttempt * 30000;
                console.warn(`⏳ Instagram publish throttled (code 4). Retrying in ${(backoff / 1000).toFixed(0)}s (attempt ${pubAttempt}/3)...`);
                await new Promise(resolve => setTimeout(resolve, backoff));
              }
              if (igPublishJson && !igPublishJson.error) {
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
    }
  } catch (err) {
    console.error("❌ Social media post automation failed:", err);
  }
}

main().then(() => {
  console.log("🏁 Social posting completed.");
  process.exit(0);
});
