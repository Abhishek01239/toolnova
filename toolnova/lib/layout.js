import { navbar } from '../components/navbar.js';
import { footer } from '../components/footer.js';

// Full HTML document shell. `head` comes from lib/seo.js buildHead().
export function page({ site, tools, path, head, body, scripts = [] }) {
  // Set the saved theme before first paint to avoid a light/dark flash.
  const themeInit = `<script>(function(){try{var t=localStorage.getItem('tn-theme');if(!t){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>`;

  const scriptTags = ['/assets/core.js', ...scripts]
    .map((src) => `    <script src="${src}" defer></script>`)
    .join('\n');

  return `<!doctype html>
<html lang="en" data-theme="light">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${themeInit}
    <link rel="stylesheet" href="/assets/site.css">
    <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
    ${head}
  </head>
  <body>
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
