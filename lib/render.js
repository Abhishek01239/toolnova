import fs from 'node:fs';
import nodePath from 'node:path';
import { esc, escAttr } from './html.js';
import { buildHead, webAppLD, faqLD, breadcrumbLD } from './seo.js';
import { breadcrumbs } from '../components/breadcrumbs.js';
import { toolGrid } from '../components/toolCard.js';
import { categoryEmoji, categorySlug } from './categories.js';

// Copy fields may contain `inline code` in backticks — render safely.
function inline(text) {
  return esc(text).replace(/`([^`]+)`/g, '<code>$1</code>');
}

function renderControl(c) {
  const domId = 'ctl-' + c.id;
  const common = `id="${domId}" data-control="${escAttr(c.id)}"`;

  switch (c.type) {
    case 'textarea': {
      return `<div class="field" data-field="${escAttr(c.id)}">
  <label for="${domId}">[ ${esc(c.label.toUpperCase())} ]</label>
  <textarea ${common} rows="${c.rows || 8}"${attr('placeholder', c.placeholder)} spellcheck="false"${c.mono === false ? '' : ' class="mono"'}>${c.value ? esc(c.value) : ''}</textarea>
  ${c.help ? `<span class="help">${esc(c.help)}</span>` : ''}
</div>`;
    }
    case 'text':
    case 'number':
    case 'date':
    case 'url':
    case 'email': {
      return `<div class="field" data-field="${escAttr(c.id)}">
  <label for="${domId}">[ ${esc(c.label.toUpperCase())} ]</label>
  <input type="${c.type}" ${common}${attr('value', c.value)}${attr('placeholder', c.placeholder)}${attr('min', c.min)}${attr('max', c.max)}${attr('step', c.step)}${attr('inputmode', c.inputmode)}>
  ${c.help ? `<span class="help">${esc(c.help)}</span>` : ''}
</div>`;
    }
    case 'select': {
      const options = c.options.map((o) =>
        `<option value="${escAttr(o.value)}"${o.value === c.value ? ' selected' : ''}>${esc(o.label)}</option>`
      ).join('');
      return `<div class="field" data-field="${escAttr(c.id)}">
  <label for="${domId}">[ ${esc(c.label.toUpperCase())} ]</label>
  <select ${common}>${options}</select>
  ${c.help ? `<span class="help">${esc(c.help)}</span>` : ''}
</div>`;
    }
    case 'checkbox': {
      return `<div class="field field-check" data-field="${escAttr(c.id)}">
  <input type="checkbox" ${common}${c.checked !== false ? ' checked' : ''}>
  <label for="${domId}"><span>[ ${esc(c.label.toUpperCase())} ]</span></label>
</div>`;
    }
    case 'range': {
      return `<div class="field" data-field="${escAttr(c.id)}">
  <label for="${domId}">[ ${esc(c.label.toUpperCase())} ] <span class="range-val" data-range-value="${escAttr(c.id)}">${escAttr(c.value ?? c.min)}</span></label>
  <div class="field-range">
    <input type="range" ${common} min="${escAttr(c.min)}" max="${escAttr(c.max)}" step="${escAttr(c.step || 1)}" value="${escAttr(c.value ?? c.min)}">
  </div>
  ${c.help ? `<span class="help">${esc(c.help)}</span>` : ''}
</div>`;
    }
    default:
      throw new Error(`Unknown control type: ${c.type}`);
  }
}

function attr(name, value) {
  if (value === undefined || value === null) return '';
  return ` ${name}="${escAttr(value)}"`;
}

function renderOutput(o) {
  const domId = 'out-' + o.id;
  const copyBtn = (target) =>
    `<button type="button" class="btn btn-small copy-btn" data-copy="${target}">[ COPY ]</button>`;

  switch (o.type) {
    case 'textarea':
      return `<div class="output-wrap${o.large ? ' output-lg' : ''}">
  <label for="${domId}">[ ${esc((o.label || 'Result').toUpperCase())} ]</label>
  <textarea id="${domId}" data-output="${escAttr(o.id)}" rows="${o.rows || 8}" readonly spellcheck="false" class="mono"></textarea>
  ${copyBtn('#' + domId)}
</div>`;
    case 'text':
      return `<div class="output-wrap">
  <label for="${domId}">[ ${esc((o.label || 'Result').toUpperCase())} ]</label>
  <input type="text" id="${domId}" data-output="${escAttr(o.id)}" readonly class="mono">
  ${copyBtn('#' + domId)}
</div>`;
    case 'pre':
      return `<div class="output-wrap">
  <span class="field-label" id="${domId}-label">[ ${esc((o.label || 'Result').toUpperCase())} ]</span>
  <pre id="${domId}" data-output="${escAttr(o.id)}" aria-labelledby="${domId}-label"></pre>
  ${copyBtn('#' + domId)}
</div>`;
    case 'stats':
      return `<div class="output-wrap">
  ${o.label ? `<span class="field-label">[ ${esc(o.label.toUpperCase())} ]</span>` : ''}
  <dl class="stats" data-output="${escAttr(o.id)}"></dl>
</div>`;
    default:
      throw new Error(`Unknown output type: ${o.type}`);
  }
}

function renderActions(actions) {
  if (!actions.length) return '';
  const buttons = actions.map((a) =>
    `<button type="button" class="btn ${a.primary ? 'btn-primary' : 'btn-ghost'}" data-action="${escAttr(a.id)}">[ ${esc(a.label.toUpperCase())} ]</button>`
  ).join('\n  ');
  return `<div class="actions">\n  ${buttons}\n</div>`;
}

function faqHtml(faq) {
  return `<div class="faq">
${faq.map((f) => `  <details>
    <summary>${esc(f.q)}</summary>
    <p>${inline(f.a)}</p>
  </details>`).join('\n')}
</div>`;
}

export function renderToolPage({ site, tool, related }) {
  const path = `/tools/${tool.id}`;
  const emoji = categoryEmoji(tool.category);
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: tool.category, path: `/category/${categorySlug(tool.category)}` },
    { name: tool.title }
  ];

  const screenshotPath = `public/assets/tools/${tool.id}-social-1.png`;
  const hasScreenshot = fs.existsSync(nodePath.join(process.cwd(), screenshotPath));

  const head = buildHead({
    site,
    title: tool.seoTitle,
    description: tool.description,
    path,
    type: 'website',
    image: hasScreenshot ? `/assets/tools/${tool.id}-social-1.png` : undefined,
    jsonLd: [webAppLD(site, tool), faqLD(tool.faq), breadcrumbLD(site, crumbs)]
  });

  const singleColumn = tool.ui.layout === 'single' ? ' tool-io-single' : '';
  const inputs = tool.ui.controls.map(renderControl).join('\n');
  const outputs = tool.ui.outputs.map(renderOutput).join('\n');

  const body = `${breadcrumbs(crumbs)}
<article class="tool-page">
  <header class="tool-header">
    <h1>${emoji} ${esc(tool.h1)}</h1>
    <p class="lead">${esc(tool.intro)}</p>
    <div class="meta-row">
      <a class="chip" href="/category/${categorySlug(tool.category)}">[ ${esc(tool.category.toUpperCase())} ]</a>
      <span class="chip chip-free">[ FREE · NO SIGN-UP ]</span>
      <span class="chip" title="Added to the collection">[ ADDED ${esc(tool.added.toUpperCase())} ]</span>
    </div>
  </header>

  <section class="tool-app" id="tool-app" data-tool="${escAttr(tool.id)}" aria-label="${escAttr(tool.title)}">
    <div class="tool-io${singleColumn}">
      <div class="tool-pane">
        <div class="pane-header">[ CONFIGURATION ]</div>
        ${inputs || ''}
        ${renderActions(tool.ui.actions)}
      </div>
      <div class="tool-pane">
        <div class="pane-header">[ RESULT ]</div>
        ${outputs}
        <p class="status" data-status role="status" aria-live="polite"></p>
      </div>
    </div>
    <div class="privacy-note">
      <span aria-hidden="true">🔒</span>
      <span><strong>[ PRIVATE BY DESIGN ]</strong> This tool runs entirely in your browser — nothing you type or paste is uploaded to any server.</span>
    </div>
  </section>

  <div class="prose">
    <h2>How it works</h2>
    <ol>
${tool.howItWorks.map((s) => `      <li>${inline(s)}</li>`).join('\n')}
    </ol>

    <h2>Examples</h2>
    <ul>
${tool.examples.map((s) => `      <li>${inline(s)}</li>`).join('\n')}
    </ul>

    <h2>Frequently asked questions</h2>
    ${faqHtml(tool.faq)}
  </div>

  <section class="section" aria-labelledby="related-heading">
    <div class="section-head">
      <h2 id="related-heading">Related tools</h2>
      <a href="/category/${categorySlug(tool.category)}">[ MORE ${esc(tool.category.toUpperCase())} TOOLS → ]</a>
    </div>
    ${toolGrid(related)}
  </section>
</article>`;

  return { path, head, body, scripts: [`/assets/tools/${tool.id}.js`] };
}
