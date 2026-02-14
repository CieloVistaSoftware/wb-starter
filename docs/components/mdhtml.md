# WB mdhtml User Guide

> **Updated:** 2026-02-13

## Overview
`mdhtml` is a Web Behaviors (WB) component that converts Markdown to HTML in the browser. It is used via the `<wb-mdhtml>` custom element and supports both inline markdown and external markdown files.

---

## Basic Usage

### 1. Inline Markdown
```html
<wb-mdhtml>
  # Hello World
  This is **bold** and *italic*.
</wb-mdhtml>
```

### 2. Load Markdown from File
```html
<wb-mdhtml src="./docs/readme.md"></wb-mdhtml>
```
- `src` can be a relative or absolute path, or a full URL.

---

## Features
- **Automatic Markdown to HTML conversion** using [marked.js](https://marked.js.org/)
- **Sanitization**: Removes script tags and inline event handlers by default
- **GFM, breaks, header IDs**: All supported via attributes or options
- **Code block captions**: Auto-numbers code blocks by section
- **Events**: Emits `wb:mdhtml:loaded`, `wb:mdhtml:error`, `wb:mdhtml:hydrated`
- **Styling**: Uses `.wb-mdhtml` CSS class (see `src/styles/behaviors/mdhtml.css`)

---

## Attributes & Options
> **Note:** Only standard attributes (no data-*) are allowed. Use `src`, `sanitize`, `breaks`, `gfm`, `header-ids`, `highlight`, and `size`.

| Attribute      | Description                                      | Default   |
|---------------|--------------------------------------------------|-----------|
| `src`         | Path/URL to markdown file                        | (inline)  |
| `sanitize`    | Enable XSS protection (true/false)               | true      |
| `breaks`      | Enable GFM line breaks (true/false)              | true      |
| `gfm`         | Enable GitHub Flavored Markdown (true/false)     | true      |
| `header-ids`  | Add IDs to headings (true/false)                 | true      |
| `highlight`   | Enable code highlighting (if supported)          |           |
| `size`        | Font size: xs, sm, md, lg, xl                    | xs        |

---

## Example: Full Options
```html
<wb-mdhtml 
  src="/docs/guide.md" 
  sanitize="true" 
  breaks="true" 
  gfm="true" 
  header-ids="true" 
  size="md">
</wb-mdhtml>
```

---

## Events
- `wb:mdhtml:loaded` — Fired when content is loaded and rendered
- `wb:mdhtml:error` — Fired on load or parse error
- `wb:mdhtml:hydrated` — Fired when element is fully hydrated

---

## Styling
- All content is wrapped in `.wb-mdhtml` for easy CSS targeting
- See `src/styles/behaviors/mdhtml.css` for default styles

---

## Troubleshooting
- If loading from file fails, check the path and browser console for errors
- Ensure [marked.js](https://cdn.jsdelivr.net/npm/marked/marked.min.js) is accessible (auto-loaded if missing)

---

## Advanced
- You can use the `wbMdhtml.reload()` and `wbMdhtml.load(src)` methods on the element for manual reloads
- All code/pre blocks are auto-enhanced for WB code behaviors

---


---


## Backend Integration: Markdown to HTML

### API: Convert Markdown File to HTML

You can now fetch HTML for any Markdown file using:

- **GET /api/markdown?file=docs/readme.md** — Returns the HTML-rendered version of the specified .md file.

**Example:**

Add this to your HTML:
```html {numberLines}
<div id="output"></div>
```

Then use this JavaScript to fetch and display the HTML:
```js {numberLines}
fetch('/api/markdown?file=docs/readme.md')
  .then(res => res.text())
  .then(html => {
    document.getElementById('output').innerHTML = html;
  });
```

**How the conversion works (server-side):**
In your `server.js`, the server reads the Markdown file, converts it to HTML using marked, and sends the HTML to the browser:
```js {numberLines}
// server.js (excerpt)
app.get('/api/markdown', (req, res) => {
  const file = req.query.file;
  // ...security checks...
  const mdContent = fs.readFileSync(fullPath, 'utf8');
  const html = marked(mdContent);
  res.type('text/html').send(html);
});
```
---

### Adding a Custom API Endpoint (Optional)
If you want to POST raw Markdown and get HTML (not just serve files), add this to server.js:

```js {numberLines}
// Add to server.js
app.post('/api/markdown', express.text({ type: '*/*' }), (req, res) => {
  try {
    const html = marked.parse(req.body || '');
    res.type('text/html').send(html);
  } catch (err) {
    res.status(500).send('Markdown conversion error');
  }
});
```

**Frontend usage:**
```js {numberLines}
fetch('/api/markdown', {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain' },
  body: '# Hello from backend!\nThis is **Markdown**.'
})
  .then(res => res.text())
  .then(html => {
    document.getElementById('output').innerHTML = html;
  });
```

---

---

## See Also
- [Behaviors Reference](../behaviors-reference.md)
- [mdhtml Source Code](../../src/wb-viewmodels/mdhtml.js)
- [mdhtml Styles](../../src/styles/behaviors/mdhtml.css)
