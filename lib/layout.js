import { navbar } from '../components/navbar.js';
import { footer } from '../components/footer.js';

export function page({ site, tools, path, head, body, scripts = [] }) {
  const scriptTags = ['/assets/core.js', ...scripts].map((src) => `    <script src="${src}" defer></script>`).join('\n');

  return `<!doctype html>
<html lang="en" data-theme="dark">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="dark">
    <meta name="theme-color" content="#000000">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400..800&family=JetBrains+Mono:wght@400..600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/assets/site.css?v=6">
    <link rel="icon" href="/assets/favicon.png" type="image/png">
    <meta name="google-adsense-account" content="ca-pub-1455389319625277">
    <script src="/assets/consent.js" defer></script>
    ${head}
  </head>
  <body>
    <div class="site-glow" aria-hidden="true"></div>
    <a class="skip-link" href="#main">Skip to content</a>
    ${navbar(site, path)}
    <main id="main" class="container">
${body}
    </main>
    ${footer(site, tools)}
    <div class="consent-banner" data-consent-banner hidden role="dialog" aria-modal="false" aria-labelledby="consent-title" aria-describedby="consent-desc">
  <div class="consent-inner">
    <div class="consent-copy">
      <strong id="consent-title">Cookies and advertising</strong>
      <p id="consent-desc">ToolNova uses local storage for your theme and, with your permission, Google AdSense cookies to show and measure ads. Tool input stays in your browser. Read the <a href="/cookies">Cookie Policy</a> and <a href="/privacy">Privacy Policy</a>.</p>
    </div>
    <div class="consent-actions">
      <button type="button" class="btn btn-ghost btn-small" data-consent-action="reject">Reject non-essential</button>
      <button type="button" class="btn btn-ghost btn-small" data-consent-preferences-toggle aria-expanded="false" aria-controls="consent-preferences">Preferences</button>
      <button type="button" class="btn btn-primary btn-small" data-consent-action="accept">Accept all</button>
    </div>
    <div class="consent-preferences" id="consent-preferences" data-consent-preferences hidden>
      <label class="consent-check">
        <input type="checkbox" data-pref="ads">
        <span><strong>Advertising cookies</strong><small>Allows Google AdSense to serve, cap and measure ads. Required to keep the site free.</small></span>
      </label>
      <label class="consent-check">
        <input type="checkbox" data-pref="personalize">
        <span><strong>Personalized ads</strong><small>Allows ads to be tailored using your interests and previous activity.</small></span>
      </label>
      <label class="consent-check">
        <input type="checkbox" data-pref="analytics">
        <span><strong>Analytics</strong><small>Allows aggregate measurement of page usage. ToolNova does not currently run a separate analytics product.</small></span>
      </label>
      <div class="consent-actions">
        <button type="button" class="btn btn-primary btn-small" data-consent-action="save">Save preferences</button>
      </div>
    </div>
  </div>
</div>
${scriptTags}
  </body>
</html>
`;
}
