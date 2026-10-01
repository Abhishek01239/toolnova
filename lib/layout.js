import { navbar } from '../components/navbar.js';
import { footer } from '../components/footer.js';

export function page({ site, tools, path, head, body, scripts = [] }) {
  const themeInit = `<script>(function(){try{document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();</script>`;
  const scriptTags = ['/assets/core.js', ...scripts].map((src) => `    <script src="${src}" defer></script>`).join('\n');

  return `<!doctype html>
<html lang="en" data-theme="dark">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="dark">
    <meta name="theme-color" content="#000000">
    ${themeInit}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400..800&family=JetBrains+Mono:wght@400..600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/assets/site.css?v=6">
    <link rel="icon" href="/assets/favicon.png" type="image/png">
    <meta name="google-adsense-account" content="ca-pub-1455389319625277">
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1455389319625277" crossorigin="anonymous"></script>
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
${scriptTags}
  </body>
</html>
`;
}
