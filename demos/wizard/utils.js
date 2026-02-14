// wizard/utils.js -- Pure utility functions (no dependencies)

export function camelToKebab(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

export function buildHtmlString(tag, attrs) {
  var parts = [];
  for (var key in attrs) {
    var val = attrs[key];
    if (val === true) { parts.push(' ' + key); }
    else if (val === false || val === null || val === undefined || val === '') { continue; }
    else { parts.push(' ' + key + '="' + String(val).replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '"'); }
  }
  return '<' + tag + parts.join('') + '></' + tag + '>';
}

export function buildStackItemHtml(item) {
  var attrs = item.attrs || {};
  var parts = [];
  for (var key in attrs) {
    var val = attrs[key];
    if (val === true) parts.push(' ' + key);
    else if (val === false || val === null || val === undefined || val === '') continue;
    else parts.push(' ' + key + '="' + String(val).replace(/"/g, '&quot;') + '"');
  }
  var open = '<' + item.tag + parts.join('') + '>';
  var close = '</' + item.tag + '>';
  if (!item.children || item.children.length === 0) {
    return open + close;
  }
  return open + '\n'
    + item.children.map(function(c) { return '  ' + buildStackItemHtml(c); }).join('\n')
    + '\n' + close;
}

export function formatHtml(html) {
  // Simple HTML formatter: add newlines and indentation
  var result = '';
  var indent = 0;
  // Split on tags
  var tokens = html.replace(/(>)(<)/g, '$1\n$2').split('\n');
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i].trim();
    if (!token) continue;
    // Closing tag
    if (token.match(/^<\//) ) {
      indent = Math.max(0, indent - 1);
    }
    result += '  '.repeat(indent) + token + '\n';
    // Opening tag (not self-closing, not closing)
    if (token.match(/^<[^/]/) && !token.match(/\/>$/) && !token.match(/^<(br|hr|img|input|meta|link)/i)) {
      // Don't indent if it also closes on the same token
      if (!token.match(/<\/[^>]+>$/)) {
        indent++;
      }
    }
  }
  return result.trimEnd();
}

export function summarizeAttrs(attrs) {
  var parts = [];
  for (var k in attrs) {
    var v = attrs[k];
    if (v === true) parts.push(k);
    else if (v === false || v === null || v === undefined || v === '') continue;
    else parts.push(k + '=' + String(v));
  }
  return parts.join(', ');
}

export function getTodayString() {
  var d = new Date();
  return d.getFullYear() + '-'
    + String(d.getMonth() + 1).padStart(2, '0') + '-'
    + String(d.getDate()).padStart(2, '0');
}

export function showToast(msg) {
  var el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(function() { el.classList.remove('show'); }, 2000);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied');
  } catch (e) {
    showToast('Copy failed');
  }
}
