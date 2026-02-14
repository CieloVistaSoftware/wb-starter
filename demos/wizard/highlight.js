// wizard/highlight.js -- Simple HTML syntax highlighting

var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

function esc(str) {
  return str.replace(/[&<>"]/g, function(ch) { return ESC[ch]; });
}

export function highlightHtml(raw) {
  // Escape everything first, then colorize patterns
  var safe = esc(raw);

  // Tag names: <wb-alert> </wb-alert>
  safe = safe.replace(/(&lt;\/?)([\w-]+)/g,
    '<span class="hl-bracket">$1</span><span class="hl-tag">$2</span>');

  // Closing bracket
  safe = safe.replace(/(\/?&gt;)/g, '<span class="hl-bracket">$1</span>');

  // Attribute values: ="value"
  safe = safe.replace(/(&quot;)(.*?)(&quot;)/g,
    '<span class="hl-string">$1$2$3</span>');

  // Attribute names: word= (before a quote)
  safe = safe.replace(/([\w-]+)(=<span class="hl-string">)/g,
    '<span class="hl-attr">$1</span>$2');

  // Boolean attributes: standalone words between tag name and bracket
  // (already handled as plain text, which is fine)

  // Comments: <!-- ... -->
  safe = safe.replace(/(&lt;!--.*?--&gt;)/g,
    '<span class="hl-comment">$1</span>');

  return safe;
}
