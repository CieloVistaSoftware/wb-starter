/**
 * SEARCH INDEX GENERATOR
 * ======================
 * Generates data/search.json for client-side search.
 * 
 * Usage:
 *   npm run generate:search
 *   node scripts/generate-search-index.js [--verbose]
 * 
 * Schema: src/wb-models/search-index.schema.json
 * Docs:   docs/guides/search-index.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Configuration
const CONFIG = {
  sources: [
    { path: 'pages', type: 'page', urlPattern: '?page={name}' },
    { path: 'docs', type: 'doc', urlPattern: '/docs/{path}' },
    { path: 'demos', type: 'demo', urlPattern: '/demos/{path}' }
  ],
  exclude: [
    '**/node_modules/**',
    '**/_*.html',
    '**/partials/**',
    '**/templates/**'
  ],
  output: 'data/search.json',
  minWordLength: 2,
  stopWords: new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'this', 'that',
    'these', 'those', 'it', 'its', 'they', 'them', 'their', 'we', 'us', 'our',
    'you', 'your', 'he', 'him', 'his', 'she', 'her', 'who', 'which', 'what',
    'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
    'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
    'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here'
  ])
};

const VERBOSE = process.argv.includes('--verbose');

/**
 * Strip HTML tags and normalize whitespace
 */
function stripHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract title from HTML
 */
function extractTitle(html, filename) {
  // Try <title> first
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) return titleMatch[1].trim();
  
  // Try first <h1>
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) return stripHtml(h1Match[1]).trim();
  
  // Fallback to filename
  return path.basename(filename, path.extname(filename));
}

/**
 * Extract meta description
 */
function extractDescription(html) {
  const match = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  return match ? match[1].trim() : null;
}

/**
 * Extract headings with IDs
 */
function extractHeadings(html) {
  const headings = [];
  const regex = /<h([1-6])([^>]*)>([^<]+)<\/h\1>/gi;
  let match;
  
  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1]);
    const attrs = match[2];
    const text = stripHtml(match[3]).trim();
    
    // Extract ID if present
    const idMatch = attrs.match(/id=["']([^"']+)["']/i);
    const id = idMatch ? idMatch[1] : null;
    
    if (text && level <= 3) {
      headings.push({ level, text, ...(id && { id }) });
    }
  }
  
  return headings;
}

/**
 * Extract keywords from meta tag
 */
function extractKeywords(html) {
  const match = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
  if (!match) return [];
  return match[1].split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
}

/**
 * Tokenize content into words
 */
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => 
      word.length >= CONFIG.minWordLength && 
      !CONFIG.stopWords.has(word)
    );
}

/**
 * Scan a directory for files
 */
function scanDirectory(dir, type, urlPattern) {
  const documents = [];
  const fullPath = path.join(ROOT, dir);
  
  if (!fs.existsSync(fullPath)) {
    if (VERBOSE) console.log(`  Skipping ${dir} (not found)`);
    return documents;
  }
  
  const files = fs.readdirSync(fullPath, { recursive: true });
  
  for (const file of files) {
    const filePath = path.join(fullPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) continue;
    if (!file.endsWith('.html') && !file.endsWith('.md')) continue;
    if (file.startsWith('_')) continue;
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const name = path.basename(file, path.extname(file));
      const relativePath = file.replace(/\\/g, '/').replace(/\.[^.]+$/, '');
      
      const doc = {
        id: `${dir}/${relativePath}`,
        url: urlPattern.replace('{name}', name).replace('{path}', relativePath),
        title: extractTitle(content, file),
        description: extractDescription(content),
        headings: extractHeadings(content),
        content: stripHtml(content).slice(0, 5000), // Limit content length
        keywords: extractKeywords(content),
        type,
        modified: stat.mtime.toISOString()
      };
      
      documents.push(doc);
      if (VERBOSE) console.log(`  ✓ ${doc.id}`);
      
    } catch (err) {
      console.error(`  ✗ Error parsing ${file}:`, err.message);
    }
  }
  
  return documents;
}

/**
 * Build inverted index
 */
function buildIndex(documents) {
  const index = new Map();
  
  function addToIndex(word, docId) {
    if (!index.has(word)) {
      index.set(word, new Set());
    }
    index.get(word).add(docId);
  }
  
  for (const doc of documents) {
    // Index title (boosted)
    const titleWords = tokenize(doc.title);
    for (const word of titleWords) {
      addToIndex(word, doc.id);
    }
    
    // Index keywords (boosted)
    for (const keyword of doc.keywords) {
      const words = tokenize(keyword);
      for (const word of words) {
        addToIndex(word, doc.id);
      }
    }
    
    // Index content
    const contentWords = tokenize(doc.content);
    for (const word of contentWords) {
      addToIndex(word, doc.id);
    }
  }
  
  // Convert Map/Set to plain object/arrays for JSON
  const result = {};
  for (const [word, docIds] of index) {
    result[word] = Array.from(docIds);
  }
  
  return result;
}

/**
 * Main generator
 */
async function generate() {
  console.log('🔍 Generating search index...\n');
  
  const documents = [];
  const stats = { sources: {} };
  
  // Scan each source directory
  for (const source of CONFIG.sources) {
    console.log(`Scanning ${source.path}/`);
    const docs = scanDirectory(source.path, source.type, source.urlPattern);
    documents.push(...docs);
    stats.sources[source.path] = docs.length;
  }
  
  // Build inverted index
  console.log('\nBuilding index...');
  const index = buildIndex(documents);
  
  // Calculate stats
  stats.totalDocuments = documents.length;
  stats.totalWords = Object.keys(index).length;
  
  // Create output
  const output = {
    $generated: new Date().toISOString(),
    $version: '1.0.0',
    $stats: stats,
    documents,
    index
  };
  
  // Write file
  const outputPath = path.join(ROOT, CONFIG.output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  
  console.log(`\n✅ Search index generated!`);
  console.log(`   Documents: ${stats.totalDocuments}`);
  console.log(`   Words: ${stats.totalWords}`);
  console.log(`   Output: ${CONFIG.output}`);
}

// Run
generate().catch(console.error);
