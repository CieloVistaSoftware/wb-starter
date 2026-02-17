/**
 * Demo File Validation
 * 
 * Source of truth: demofile.schema.json
 * 
 * Validates ALL demo HTML files in demos/ against the demo file contract.
 * Demos are self-contained full HTML documents that run 100% on their own.
 *
 * Checks:
 *   1. Full document structure: <!DOCTYPE html>, <html lang data-theme>, 
 *      charset, viewport, title, <head>, <body>, </html>
 *   2. Stylesheet loading: themes.css + site.css required
 *   3. WB loader: wb-lazy.js or wb-bootstrap.js if using wb-* components
 *   4. Partial detection: fragments must declare parent via <!-- Parent: filename.html -->
 *   5. No orphan partials: declared parent must exist and be a full document
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const DEMOS_DIR = path.resolve('demos');

/** Recursively find all .html files under demos/ */
function loadDemoFiles(): { name: string; relPath: string; html: string }[] {
  const results: { name: string; relPath: string; html: string }[] = [];

  function walk(dir: string, prefix: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), prefix ? `${prefix}/${entry.name}` : entry.name);
      } else if (entry.name.endsWith('.html')) {
        const fullPath = path.join(dir, entry.name);
        results.push({
          name: entry.name,
          relPath: prefix ? `${prefix}/${entry.name}` : entry.name,
          html: fs.readFileSync(fullPath, 'utf-8')
        });
      }
    }
  }

  walk(DEMOS_DIR, '');
  return results;
}

const demoFiles = loadDemoFiles();
const fullDemos = demoFiles.filter(d => /<!doctype\s+html>/i.test(d.html));
const partialDemos = demoFiles.filter(d => !/<!doctype\s+html>/i.test(d.html));


// ============================================================
// Full Document Structure (demofile.schema.json → required)
// ============================================================

test.describe('Demo Files — Required Document Structure', () => {
  for (const { relPath, html } of fullDemos) {
    test(`${relPath} — has <!DOCTYPE html>`, () => {
      expect(html.toLowerCase()).toContain('<!doctype html>');
    });

    test(`${relPath} — has <html lang="en">`, () => {
      expect(html).toMatch(/<html[^>]*\slang=["']en["']/i);
    });

    test(`${relPath} — has data-theme on <html>`, () => {
      expect(html).toMatch(/<html[^>]*\sdata-theme=["'][^"']+["']/i);
    });

    test(`${relPath} — has <meta charset="UTF-8">`, () => {
      expect(html).toMatch(/<meta[^>]*charset=["']UTF-8["']/i);
    });

    test(`${relPath} — has <meta name="viewport">`, () => {
      expect(html).toMatch(/<meta[^>]*name=["']viewport["']/i);
    });

    test(`${relPath} — has <title> with descriptive text`, () => {
      const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      expect(match, `missing <title> tag`).toBeTruthy();
      if (match) {
        const text = match[1].trim();
        expect(text.length, `<title> must have descriptive text`).toBeGreaterThanOrEqual(3);
        const generic = ['untitled', 'document', 'page', 'test', 'demo'];
        expect(generic.includes(text.toLowerCase()), `title "${text}" is too generic`).toBe(false);
      }
    });

    test(`${relPath} — has <head> section`, () => {
      expect(html).toMatch(/<head[\s>]/i);
    });

    test(`${relPath} — has <body> section`, () => {
      expect(html).toMatch(/<body[\s>]/i);
    });

    test(`${relPath} — has closing </html>`, () => {
      expect(html).toMatch(/<\/html>/i);
    });
  }
});


// ============================================================
// Stylesheet Loading (demofile.schema.json → stylesheets)
// ============================================================

test.describe('Demo Files — Stylesheet Loading', () => {
  for (const { relPath, html } of fullDemos) {
    test(`${relPath} — loads themes.css`, () => {
      expect(html).toMatch(/href=["'][^"']*themes\.css["']/i);
    });

    test(`${relPath} — loads site.css`, () => {
      expect(html).toMatch(/href=["'][^"']*site\.css["']/i);
    });
  }
});


// ============================================================
// WB Loader (demofile.schema.json → scripts)
// ============================================================

test.describe('Demo Files — WB Loader', () => {
  for (const { relPath, html } of fullDemos) {
    const usesWB = /<wb-[a-z]/i.test(html) || /data-wb=/i.test(html);

    if (usesWB) {
      test(`${relPath} — loads WB (wb-lazy.js, wb-bootstrap.js, or wb.js)`, () => {
        const loadsWB = /wb-lazy\.js|wb-bootstrap\.js|wb\.js/i.test(html);
        expect(loadsWB, `uses WB components but doesn't load WB`).toBe(true);
      });
    }
  }
});


// ============================================================
// Partial/Fragment Validation (demofile.schema.json → partials)
// ============================================================

test.describe('Demo Files — Partial/Fragment Validation', () => {
  if (partialDemos.length === 0) {
    test('no partial demos found (all are full documents)', () => {
      expect(true).toBe(true);
    });
    return;
  }

  for (const { relPath, html } of partialDemos) {
    test(`${relPath} — PARTIAL: must declare parent via <!-- Parent: filename.html -->`, () => {
      const parentMatch = html.match(/<!--\s*Parent:\s*([^\s->]+\.html)\s*-->/i);
      expect(parentMatch, `partial "${relPath}" has no <!-- Parent: filename.html --> declaration`).toBeTruthy();
    });

    test(`${relPath} — PARTIAL: declared parent must exist`, () => {
      const parentMatch = html.match(/<!--\s*Parent:\s*([^\s->]+\.html)\s*-->/i);
      if (!parentMatch) return;

      const parentName = parentMatch[1];
      const partialDir = path.dirname(path.join(DEMOS_DIR, relPath));
      const sameDirPath = path.join(partialDir, parentName);
      const rootDirPath = path.join(DEMOS_DIR, parentName);

      const parentExists = fs.existsSync(sameDirPath) || fs.existsSync(rootDirPath);
      expect(parentExists, `parent "${parentName}" does not exist`).toBe(true);
    });

    test(`${relPath} — PARTIAL: parent must be a full document`, () => {
      const parentMatch = html.match(/<!--\s*Parent:\s*([^\s->]+\.html)\s*-->/i);
      if (!parentMatch) return;

      const parentName = parentMatch[1];
      const partialDir = path.dirname(path.join(DEMOS_DIR, relPath));
      const sameDirPath = path.join(partialDir, parentName);
      const rootDirPath = path.join(DEMOS_DIR, parentName);

      const parentPath = fs.existsSync(sameDirPath) ? sameDirPath : rootDirPath;
      if (!fs.existsSync(parentPath)) return;

      const parentHtml = fs.readFileSync(parentPath, 'utf-8');
      expect(/<!doctype\s+html>/i.test(parentHtml), `parent "${parentName}" is also a partial`).toBe(true);
    });
  }
});


// ============================================================
// Self-Contained Structure Check
// ============================================================

test.describe('Demo Files — Self-Contained Structure', () => {
  for (const { relPath, html } of fullDemos) {
    test(`${relPath} — has <head> section`, () => {
      expect(html).toMatch(/<head[\s>]/i);
    });

    test(`${relPath} — has <body> section`, () => {
      expect(html).toMatch(/<body[\s>]/i);
    });

    test(`${relPath} — has closing </html>`, () => {
      expect(html).toMatch(/<\/html>/i);
    });
  }
});


// ============================================================
// Inventory
// ============================================================

test.describe('Demo Inventory', () => {
  test('demo file counts', () => {
    console.log(`\n📊 Demo Inventory:`);
    console.log(`   Full documents: ${fullDemos.length}`);
    console.log(`   Partials: ${partialDemos.length}`);
    console.log(`   Total: ${demoFiles.length}\n`);
    expect(true).toBe(true);
  });
});
