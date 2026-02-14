import { WB_DOC_MAP } from './demo-docmap.js';
/**
 * Demo Container Behavior
 * -----------------------------------------------------------------------------
 * <wb-demo> is a parent container. It:
 *   1. Renders its children normally (in a CSS grid)
 *   2. Shows the raw HTML as a colored code sample below
 *
 * Raw source is fetched from the page file to avoid post-render inflation.
 * Code block uses textContent to prevent the browser from parsing raw HTML
 * into real custom elements.
 *
 * Attributes:
 *   columns — grid columns (default 3)
 *
 * CSS: src/styles/behaviors/demo.css
 * Zero inline styles.
 * -----------------------------------------------------------------------------
 */

let _pageSource = null;
let _pageSourcePromise = null;

function getPageSource() {
    if (_pageSource) return Promise.resolve(_pageSource);
    if (_pageSourcePromise) return _pageSourcePromise;
    _pageSourcePromise = fetch(location.href).then(r => r.text()).then(text => {
        _pageSource = text;
        return text;
    });
    return _pageSourcePromise;
}

function extractDemoBlock(source, idx) {
    const regex = /<wb-demo[^>]*>([\s\S]*?)<\/wb-demo>/gi;
    let match;
    let i = 0;
    while ((match = regex.exec(source)) !== null) {
        if (i === idx) return formatHtml(match[1]);
        i++;
    }
    return '';
}

function formatHtml(raw) {
    // Split into lines, drop blank leading/trailing
    const lines = raw.replace(/\r\n/g, '\n').split('\n');

    // Trim blank lines top and bottom
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    if (!lines.length) return '';

    // Find minimum indent (ignoring blank lines)
    let minIndent = Infinity;
    for (const line of lines) {
        if (!line.trim()) continue;
        const indent = line.match(/^(\s*)/)[1].length;
        if (indent < minIndent) minIndent = indent;
    }

    // Strip common indent, re-indent with 2 spaces per level
    const stripped = lines.map(line => {
        if (!line.trim()) return '';
        return line.slice(minIndent);
    });

    // Auto-indent based on tags
    const result = [];
    let depth = 0;
    const indent = '  ';
    const voidTags = new Set(['br','hr','img','input','meta','link','area','base','col','embed','source','track','wbr']);

    for (const line of stripped) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Closing tag first — dedent before writing
        const closingOnly = /^<\/[^>]+>/.test(trimmed) && !/<[^/][^>]*>/.test(trimmed);
        if (closingOnly) depth = Math.max(0, depth - 1);

        result.push(indent.repeat(depth) + trimmed);

        // Self-closing, void, or closing-only — no indent change
        const selfClosing = /\/>\s*$/.test(trimmed);
        if (selfClosing || closingOnly) continue;

        // Check for opening tags (increase depth)
        const opens = trimmed.match(/<([a-z][a-z0-9-]*)/gi) || [];
        const closes = trimmed.match(/<\/[a-z][a-z0-9-]*/gi) || [];

        let delta = 0;
        for (const o of opens) {
            const tag = o.slice(1).toLowerCase();
            if (!voidTags.has(tag)) delta++;
        }
        delta -= closes.length;
        depth = Math.max(0, depth + delta);
    }

    return result.join('\n');
}

function findWbComponents(html) {
    const regex = /<wb-([a-z0-9-]+)/gi;
    const matches = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
        matches.push(match[1]);
    }
    return [...new Set(matches)]; // unique
}

export async function demo(element, options = {}) {
    element.classList.add('wb-demo');

    const pageSource = await getPageSource();
    const allDemos = document.querySelectorAll('wb-demo');
    const idx = Array.from(allDemos).indexOf(element);
    const rawBlock = extractDemoBlock(pageSource, idx);

    const cols = options.columns || element.getAttribute('columns') || '3';

    // Add doc links
    const wbComponents = findWbComponents(rawBlock);
    if (wbComponents.length > 0) {
        const linksDiv = document.createElement('div');
        linksDiv.className = 'wb-demo__links';
        linksDiv.textContent = 'Docs: ';
        wbComponents.forEach((comp, i) => {
            const link = document.createElement('a');
            link.href = WB_DOC_MAP[comp] || `/docs/components/${comp}.md`;
            link.textContent = `wb-${comp}`;
            link.target = '_blank';
            linksDiv.appendChild(link);
            if (i < wbComponents.length - 1) {
                linksDiv.appendChild(document.createTextNode(', '));
            }
        });
        element.appendChild(linksDiv);
    }

    // Wrap children in a grid
    const grid = document.createElement('div');
    grid.className = 'wb-demo__grid wb-demo__grid--cols-' + cols;
    while (element.firstChild) {
        grid.appendChild(element.firstChild);
    }
    element.appendChild(grid);

    // Create code block directly — textContent prevents browser from
    // parsing raw HTML into real custom elements that get inflated
    const pre = document.createElement('pre');
    pre.className = 'wb-demo__code';
    pre.setAttribute('x-behavior', 'pre');
    pre.dataset.language = 'html';
                link.href = WB_DOC_MAP[comp] || `/docs/components/${comp}.md`;
    pre.dataset.showCopy = 'true';

    const code = document.createElement('code');
    code.className = 'language-html';
    code.setAttribute('x-behavior', 'code');
    code.dataset.language = 'html';
    code.textContent = rawBlock;
    pre.appendChild(code);
    element.appendChild(pre);

    // Syntax highlight
    if (window.WB) {
        window.WB.scan(element);
    }

    element.classList.add('wb-ready');
    return () => {};
}

export default demo;
