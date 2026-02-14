// wizard/preview.js -- iframe rendering (full preview tab only)

import { state } from './state.js';
import { buildStackItemHtml } from './utils.js';

// Use origin to build absolute URLs so blob: iframes can load resources
var origin = window.location.origin;

function buildFullPage(bodyHtml) {
  return '<!DOCTYPE html>\n'
    + '<html lang="en" data-theme="dark">\n<head>\n'
    + '<meta charset="UTF-8">\n'
    + '<link rel="stylesheet" href="' + origin + '/src/styles/themes.css">\n'
    + '<link rel="stylesheet" href="' + origin + '/src/styles/site.css">\n'
    + '<link rel="stylesheet" href="' + origin + '/src/styles/components.css">\n'
    + '<style>*,*::before,*::after{box-sizing:border-box;}html,body{margin:0;padding:0;background:#0a0a0a;color:#e5e5e5;font-family:system-ui,sans-serif;}body{padding:2rem;}</style>\n'
    + '</head>\n<body data-theme="dark">\n'
    + bodyHtml + '\n'
    + '<script type="module">\n'
    + 'import WB from "' + origin + '/src/core/wb-lazy.js";\n'
    + 'window.WB = WB;\n'
    + 'await WB.init({ autoInject: true });\n'
    + '// Explicitly inject audio behavior for all wb-audio elements in case autoInject misses\n'
    + 'document.querySelectorAll("wb-audio").forEach(el => WB.inject(el, "audio"));\n'
    + 'window.__wbReady = true;\n'
    + '</script>\n'
    + '</body>\n</html>';
}

var currentBlobUrl = null;

export function renderFullPreview() {
  var frame = document.getElementById('fullPreviewFrame');
  if (!frame) return;

  // Revoke previous blob
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl);
    currentBlobUrl = null;
  }

  if (state.previewStack.length === 0) {
    var emptyPage = '<!DOCTYPE html><html data-theme="dark"><head>'
      + '<style>body{margin:0;background:#0a0a0a;color:#555;display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;}</style>'
      + '</head><body><p>Add components on the Build tab first</p></body></html>';
    var emptyBlob = new Blob([emptyPage], { type: 'text/html' });
    currentBlobUrl = URL.createObjectURL(emptyBlob);
    frame.src = currentBlobUrl;
    return;
  }

  var allHtml = state.previewStack.map(function(item) {
    return buildStackItemHtml(item);
  }).join('\n');

  var fullPage = buildFullPage(allHtml);
  var blob = new Blob([fullPage], { type: 'text/html' });
  currentBlobUrl = URL.createObjectURL(blob);
  frame.src = currentBlobUrl;
}
