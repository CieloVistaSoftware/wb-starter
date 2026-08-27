/**
 * Page & Site Schema Validation
 * 
 * Source of truth: page.schema.json → $defs/pageSchemaJSON, $defs/pageSection,
 *                  $defs/demoItem, $defs/siteSchema
 * 
 * Validates page schema JSON files and site schema JSON files ONLY.
 * Demo file validation → demo-file-validation.spec.ts
 * Fragment validation → page-fragment-compliance.spec.ts
 * Fragment registration → fragment-registration.spec.ts
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const PAGES_DIR = path.resolve('src/wb-models/pages');
const SCHEMAS_DIR = path.resolve('src/wb-models');

// ============================================================
// LOADERS
// ============================================================

function loadPageFiles(): { name: string; data: any }[] {
  return fs.readdirSync(PAGES_DIR)
    .filter(f => f.endsWith('.page.json'))
    // Skip .composed.page.json — pre-composition templates with
    // $generate, $ref, $extends directives that get resolved into
    // regular .page.json files which ARE validated.
    .filter(f => !f.includes('.composed.'))
    .map(f => ({
      name: f,
      data: JSON.parse(fs.readFileSync(path.join(PAGES_DIR, f), 'utf-8'))
    }));
}

function loadSiteFiles(): { name: string; data: any }[] {
  return fs.readdirSync(PAGES_DIR)
    .filter(f => f.endsWith('.site.json'))
    .map(f => ({
      name: f,
      data: JSON.parse(fs.readFileSync(path.join(PAGES_DIR, f), 'utf-8'))
    }));
}

function loadComponentSchema(behaviorName: string): any | null {
  const p = path.join(SCHEMAS_DIR, `${behaviorName}.schema.json`);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : null;
}

function tagToBehavior(tag: string): string {
  return tag.replace(/^wb-/, '');
}

/** Get all property names from a schema, including kebab-case aliases */
function getSchemaProperties(schema: any): Set<string> {
  const props = new Set<string>();
  if (schema?.properties) {
    for (const key of Object.keys(schema.properties)) {
      if (!key.startsWith('$')) {
        props.add(key);
        // HTML attrs are kebab-case, schema props are camelCase
        // trendValue → trend-value, fileType → file-type
        const kebab = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        if (kebab !== key) props.add(kebab);
      }
    }
  }
  return props;
}

const pageFiles = loadPageFiles();
const siteFiles = loadSiteFiles();


// ################################################################
//  PAGE SCHEMAS (*.page.json)
// ################################################################

test.describe('Page Schema — Required Fields ($defs/pageSchemaJSON)', () => {
  for (const { name, data } of pageFiles) {
    test(`${name} — has title (string, non-empty)`, () => {
      expect(data.title, `missing "title"`).toBeTruthy();
      expect(typeof data.title).toBe('string');
      expect(data.title.trim().length).toBeGreaterThan(0);
    });

    test(`${name} — has description (string, non-empty)`, () => {
      expect(data.description, `missing "description"`).toBeTruthy();
      expect(typeof data.description).toBe('string');
      expect(data.description.trim().length).toBeGreaterThan(0);
    });

    test(`${name} — has sections (array, minItems 1)`, () => {
      expect(Array.isArray(data.sections), `"sections" must be an array`).toBe(true);
      expect(data.sections.length, `must have at least 1 section`).toBeGreaterThan(0);
    });
  }
});

test.describe('Page Schema — Header Structure', () => {
  for (const { name, data } of pageFiles) {
    if (data.header) {
      test(`${name} — header has tag + content`, () => {
        expect(data.header.tag, `header missing "tag"`).toBeTruthy();
        expect(data.header.content, `header missing "content"`).toBeTruthy();
        expect(typeof data.header.content).toBe('string');
      });

      if (data.header?.subtitle) {
        test(`${name} — header.subtitle has tag + content`, () => {
          expect(data.header.subtitle.tag, `subtitle missing "tag"`).toBeTruthy();
          expect(data.header.subtitle.content, `subtitle missing "content"`).toBeTruthy();
        });
      }
    }
  }
});

test.describe('Page Schema — Section Structure ($defs/pageSection)', () => {
  for (const { name, data } of pageFiles) {
    for (let i = 0; i < (data.sections?.length ?? 0); i++) {
      const section = data.sections[i];
      const label = `${name} section[${i}] "${section.heading || '(no heading)'}"`;

      test(`${label} — has heading (string, non-empty)`, () => {
        expect(section.heading, `missing "heading"`).toBeTruthy();
        expect(typeof section.heading).toBe('string');
        expect(section.heading.trim().length).toBeGreaterThan(0);
      });

      test(`${label} — has demos (array, minItems 1)`, () => {
        expect(Array.isArray(section.demos), `"demos" must be an array`).toBe(true);
        expect(section.demos.length, `must have at least 1 demo`).toBeGreaterThan(0);
      });

      test(`${label} — columns in range 1-6 (if present)`, () => {
        if (section.columns !== undefined) {
          expect(section.columns).toBeGreaterThanOrEqual(1);
          expect(section.columns).toBeLessThanOrEqual(6);
        }
      });

      if (section.tag) {
        test(`${label} — section tag starts with wb-`, () => {
          expect(section.tag.startsWith('wb-'), `tag "${section.tag}" must start with "wb-"`).toBe(true);
        });
      }
    }
  }
});

test.describe('Page Schema — Demo Items ($defs/demoItem)', () => {
  const ALLOWED_DEMO_KEYS = new Set(['tag', 'attrs', 'content']);

  for (const { name, data } of pageFiles) {
    for (let si = 0; si < (data.sections?.length ?? 0); si++) {
      const section = data.sections[si];
      for (let di = 0; di < (section.demos?.length ?? 0); di++) {
        const demo = section.demos[di];
        const label = `${name} s[${si}].d[${di}] <${demo.tag || '?'}>`;

        test(`${label} — has required tag`, () => {
          expect(demo.tag, `missing "tag"`).toBeTruthy();
          expect(typeof demo.tag).toBe('string');
        });

        test(`${label} — tag starts with wb-`, () => {
          expect(demo.tag.startsWith('wb-'), `"${demo.tag}" must start with "wb-"`).toBe(true);
        });

        test(`${label} — has required attrs (object)`, () => {
          expect(demo.attrs, `missing "attrs"`).toBeTruthy();
          expect(typeof demo.attrs).toBe('object');
          expect(Array.isArray(demo.attrs)).toBe(false);
        });

        test(`${label} — only allowed keys: tag, attrs, content`, () => {
          const bad = Object.keys(demo).filter(k => !ALLOWED_DEMO_KEYS.has(k));
          expect(bad, `unknown keys: [${bad.join(', ')}] — use "content" not "children"`).toEqual([]);
        });
      }
    }
  }
});

test.describe('Page Schema — Attribute Cross-Validation', () => {
  const schemaCache = new Map<string, any>();

  for (const { name, data } of pageFiles) {
    for (let si = 0; si < (data.sections?.length ?? 0); si++) {
      const section = data.sections[si];
      for (let di = 0; di < (section.demos?.length ?? 0); di++) {
        const demo = section.demos[di];
        if (!demo.tag || !demo.attrs) continue;

        const behavior = tagToBehavior(demo.tag);
        if (!schemaCache.has(behavior)) {
          schemaCache.set(behavior, loadComponentSchema(behavior));
        }
        const schema = schemaCache.get(behavior);
        if (!schema) continue;

        const schemaProps = getSchemaProperties(schema);
        if (schemaProps.size === 0) continue;

        const unknownAttrs = Object.keys(demo.attrs).filter(a => !schemaProps.has(a));

        if (unknownAttrs.length > 0) {
          test(`${name} s[${si}].d[${di}] <${demo.tag}> — attrs match schema`, () => {
            expect(unknownAttrs, `attrs not in ${behavior}.schema.json: [${unknownAttrs.join(', ')}]`).toEqual([]);
          });
        }
      }
    }
  }
});

test.describe('Page Schema — Metadata Consistency', () => {
  for (const { name, data } of pageFiles) {
    if (!data._metadata) continue;

    if (data._metadata.sectionCount !== undefined) {
      test(`${name} — _metadata.sectionCount matches actual`, () => {
        const actual = data.sections?.length ?? 0;
        expect(data._metadata.sectionCount, `says ${data._metadata.sectionCount}, actual ${actual}`).toBe(actual);
      });
    }

    if (data._metadata.totalDemos !== undefined) {
      test(`${name} — _metadata.totalDemos matches actual`, () => {
        const actual = (data.sections ?? []).reduce((sum: number, s: any) => sum + (s.demos?.length ?? 0), 0);
        expect(data._metadata.totalDemos, `says ${data._metadata.totalDemos}, actual ${actual}`).toBe(actual);
      });
    }
  }
});

test.describe('Page Schema — Page Config', () => {
  for (const { name, data } of pageFiles) {
    if (!data.page) continue;

    if (data.page.stylesheets) {
      test(`${name} — stylesheets are strings ending in .css`, () => {
        expect(Array.isArray(data.page.stylesheets)).toBe(true);
        for (const s of data.page.stylesheets) {
          expect(typeof s).toBe('string');
          expect(s.endsWith('.css'), `"${s}" must end with .css`).toBe(true);
        }
      });

      test(`${name} — stylesheets include themes.css and site.css`, () => {
        const joined = data.page.stylesheets.join(' ');
        expect(joined).toContain('themes.css');
        expect(joined).toContain('site.css');
      });
    }

    if (data.page.scripts) {
      test(`${name} — scripts have type + src`, () => {
        for (const script of data.page.scripts) {
          expect(script.type, `script missing "type"`).toBeTruthy();
          expect(script.src, `script missing "src"`).toBeTruthy();
        }
      });
    }
  }
});

test.describe('Page Schema — No Duplicate Section Headings', () => {
  for (const { name, data } of pageFiles) {
    test(`${name} — unique section headings`, () => {
      const headings = (data.sections ?? []).map((s: any) => s.heading);
      const dupes = headings.filter((h: string, i: number) => headings.indexOf(h) !== i);
      expect(dupes, `duplicate headings: [${dupes.join(', ')}]`).toEqual([]);
    });
  }
});


// ################################################################
//  SITE SCHEMAS (*.site.json)
// ################################################################

test.describe('Site Schema — Required Fields ($defs/siteSchema)', () => {
  for (const { name, data } of siteFiles) {
    test(`${name} — has title`, () => {
      expect(data.title, `missing "title"`).toBeTruthy();
      expect(typeof data.title).toBe('string');
    });

    test(`${name} — has pages (array, minItems 1)`, () => {
      expect(Array.isArray(data.pages), `"pages" must be an array`).toBe(true);
      expect(data.pages.length, `must have at least 1 page`).toBeGreaterThan(0);
    });
  }
});

test.describe('Site Schema — Page Entries', () => {
  for (const { name, data } of siteFiles) {
    for (let i = 0; i < (data.pages?.length ?? 0); i++) {
      const page = data.pages[i];
      const label = `${name} pages[${i}] "${page.id || '(no id)'}"`;

      test(`${label} — has required id`, () => {
        expect(page.id, `missing "id"`).toBeTruthy();
        expect(typeof page.id).toBe('string');
      });

      test(`${label} — has required title`, () => {
        expect(page.title, `missing "title"`).toBeTruthy();
        expect(typeof page.title).toBe('string');
      });

      test(`${label} — has required behaviors (array)`, () => {
        expect(Array.isArray(page.behaviors), `"behaviors" must be an array`).toBe(true);
        expect(page.behaviors.length, `must list at least 1 behavior`).toBeGreaterThan(0);
      });
    }
  }
});

test.describe('Site Schema — Behavior References Exist', () => {
  for (const { name, data } of siteFiles) {
    for (let i = 0; i < (data.pages?.length ?? 0); i++) {
      const page = data.pages[i];
      if (!Array.isArray(page.behaviors)) continue;

      for (const comp of page.behaviors) {
        test(`${name} pages[${i}] "${page.id}" — behavior "${comp}" has a schema`, () => {
          const schema = loadComponentSchema(comp);
          expect(schema, `${comp}.schema.json not found`).toBeTruthy();
        });
      }
    }
  }
});


// ################################################################
//  Inventory
// ################################################################

test.describe('Inventory', () => {
  test('page and site schema counts', () => {
    console.log(`\n📊 Schema Inventory:`);
    console.log(`   Page schemas (*.page.json): ${pageFiles.length}`);
    console.log(`   Site schemas (*.site.json): ${siteFiles.length}\n`);
    expect(true).toBe(true);
  });
});
