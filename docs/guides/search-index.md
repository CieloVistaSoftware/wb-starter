# Search Index Generator

Generate a client-side search index for Web Behaviors (WB) Framework sites.

## Overview

The search index generator scans your site content and produces a `data/search.json` file that powers instant, client-side search without any server requirements.

## Quick Start

```bash
npm run generate:search
```

## Output

```
data/search.json     # Search index file
```

## How It Works

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   pages/    │────▶│              │     │             │
├─────────────┤     │   Scanner    │────▶│ search.json │
│   docs/     │────▶│   & Parser   │     │             │
├─────────────┤     │              │     └─────────────┘
│   demos/    │────▶│              │
└─────────────┘     └──────────────┘
```

### Scanning Process

1. **Discover** - Find all `.html` and `.md` files in configured directories
2. **Parse** - Extract title, headings, content, and metadata
3. **Normalize** - Strip HTML, normalize whitespace, extract keywords
4. **Index** - Build inverted index for fast lookups
5. **Output** - Write `search.json` with documents and index

## Configuration

In `config/site.json`:

```json
{
  "search": {
    "enabled": true,
    "sources": [
      { "path": "pages", "type": "page", "urlPattern": "?page={name}" },
      { "path": "docs", "type": "doc", "urlPattern": "/docs/{path}" },
      { "path": "demos", "type": "demo", "urlPattern": "/demos/{path}" }
    ],
    "exclude": [
      "**/node_modules/**",
      "**/_*.html",
      "**/partials/**"
    ],
    "boost": {
      "pages/home": 2,
      "docs/getting-started": 1.5
    }
  }
}
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable search indexing |
| `sources` | array | See above | Directories to scan |
| `exclude` | array | `[]` | Glob patterns to exclude |
| `boost` | object | `{}` | Document ID → boost factor |
| `minWordLength` | number | `2` | Minimum word length to index |
| `stopWords` | array | Common list | Words to exclude from index |

## Search Index Schema

See `src/wb-models/search-index.schema.json` for the complete schema.

### Document Structure

```json
{
  "id": "pages/home",
  "url": "?page=home",
  "title": "Home",
  "description": "Welcome to the WB Behaviors",
  "headings": [
    { "level": 1, "text": "Welcome", "id": "welcome" },
    { "level": 2, "text": "Getting Started", "id": "getting-started" }
  ],
  "content": "Plain text content...",
  "keywords": ["home", "welcome", "framework"],
  "type": "page",
  "category": "Main",
  "boost": 2
}
```

### Inverted Index

The `index` object maps words to document IDs for instant lookup:

```json
{
  "index": {
    "card": ["docs/components/card", "pages/components"],
    "button": ["docs/components/button", "demos/buttons"],
    "framework": ["pages/home", "docs/getting-started"]
  }
}
```

## Client-Side Usage

### Basic Search

```javascript
// Load the search index
const searchIndex = await fetch('/data/search.json').then(r => r.json());

// Search function
function search(query, options = {}) {
  const { limit = 10, type = null } = options;
  const terms = query.toLowerCase().split(/\s+/);
  
  // Find matching document IDs
  const matches = new Map();
  
  for (const term of terms) {
    const docIds = searchIndex.index[term] || [];
    for (const id of docIds) {
      matches.set(id, (matches.get(id) || 0) + 1);
    }
  }
  
  // Score and rank results
  const results = Array.from(matches.entries())
    .map(([id, termMatches]) => {
      const doc = searchIndex.documents.find(d => d.id === id);
      const score = termMatches * (doc.boost || 1);
      return { ...doc, score };
    })
    .filter(doc => !type || doc.type === type)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  
  return results;
}

// Example
const results = search('card component');
// → [{ id: 'docs/components/card', title: 'Card', score: 3 }, ...]
```

### With WB Search Component

```html
<wb-search 
  placeholder="Search docs..." 
  data-src="/data/search.json"
  data-limit="10">
</wb-search>
```

## Document Types

| Type | Icon | Description |
|------|------|-------------|
| `page` | 📄 | Main site pages |
| `doc` | 📖 | Documentation |
| `demo` | 🎮 | Interactive demos |
| `component` | 🧩 | Component reference |
| `api` | ⚡ | API documentation |

## Best Practices

### Improve Search Quality

1. **Use descriptive titles** - First `<h1>` or `<title>` becomes searchable
2. **Add meta descriptions** - `<meta name="description">` improves snippets
3. **Structure with headings** - `<h2>`, `<h3>` enable section jumping
4. **Add keywords** - Use `<meta name="keywords">` for important terms

### Optimize Index Size

1. **Exclude generated files** - Add patterns to `exclude`
2. **Skip partials** - Don't index reusable HTML fragments
3. **Compress output** - Enable gzip on your server

### Performance Tips

1. **Lazy load** - Load search.json only when search is focused
2. **Cache aggressively** - Use `$version` for cache busting
3. **Debounce input** - Wait for user to stop typing

## Integration with Build

Add to `package.json`:

```json
{
  "scripts": {
    "generate:search": "node scripts/generate-search-index.js",
    "build": "npm run generate:search && npm run build:css"
  }
}
```

## Troubleshooting

### Index is too large

- Add more patterns to `exclude`
- Increase `minWordLength`
- Add common words to `stopWords`

### Missing pages

- Check `sources` paths are correct
- Verify files aren't matching `exclude` patterns
- Run with `--verbose` flag for debug output

### Search returns wrong results

- Increase `boost` for important pages
- Add more specific `keywords` in page metadata
- Check for duplicate content across pages

## Related

- [Search Component](/docs/components/search.md) - UI component for search
- [Site Configuration](/docs/config/site.md) - Full config reference
- [Schema Reference](/src/wb-models/search-index.schema.json) - JSON Schema
