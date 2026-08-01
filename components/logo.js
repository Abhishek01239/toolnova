// Inline SVG brand mark — three sliders ("tools" glyph) on an indigo/violet tile.
export function logoSvg(size = 30) {
  return `<svg class="logo" width="${size}" height="${size}" viewBox="0 0 64 64" role="img" aria-label="ToolNova logo" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="tnlg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#a855f7"/>
  </linearGradient></defs>
  <rect width="64" height="64" rx="14" fill="url(#tnlg)"/>
  <g stroke="#fff" stroke-width="5" stroke-linecap="round">
    <line x1="16" y1="22" x2="48" y2="22"/><line x1="16" y1="32" x2="48" y2="32"/><line x1="16" y1="42" x2="48" y2="42"/>
  </g>
  <g fill="#fff">
    <circle cx="26" cy="22" r="6"/><circle cx="40" cy="32" r="6"/><circle cx="22" cy="42" r="6"/>
  </g>
</svg>`;
}
