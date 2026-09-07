"""#1025 — the themes page renders every theme from the registry.

Steps, all idempotent enough to fail loudly rather than half-apply:
  1. lift the THEMES array out of themecontrol.js into src/core/themes-registry.js
  2. point themecontrol.js at it
  3. splice the 23 hand-written cards out of pages/themes.html, in favour of the
     generated grid
  4. give the new card parts their CSS (theme variables, no literals)
"""
import io, os, re

REPO = r'C:\Users\jwpmi\Downloads\AI\wb-starter'
SCRATCH = os.path.dirname(os.path.abspath(__file__))
NL = chr(10)


def read(p):
    return io.open(os.path.join(REPO, p), encoding='utf-8').read()


def write(p, s):
    io.open(os.path.join(REPO, p), 'w', encoding='utf-8').write(s)


# ── 1 + 2. the registry ──────────────────────────────────────────────────────
tc = read('src/wb-viewmodels/themecontrol.js')
m = re.search(r'// Available themes[^\n]*\nconst THEMES = \[(.*?)\n\];\n', tc, re.S)
assert m, 'THEMES array not found in themecontrol.js'
entries = m.group(1)

registry = (
    '/**' + NL
    + ' * Theme registry — the one list of themes the site ships.' + NL
    + ' * -----------------------------------------------------------------------------' + NL
    + ' * #1025. This lived inside themecontrol.js, so it was reachable only by the' + NL
    + ' * dropdown that rendered it. The themes page therefore kept its OWN copy as 23' + NL
    + ' * hand-written cards, which drifted to 23-of-50 without anything noticing:' + NL
    + ' * adding a theme to themes.css added no card, and the page went on claiming a' + NL
    + ' * number it no longer showed.' + NL
    + ' *' + NL
    + ' * Data only, no DOM, no behavior. Each entry is { id, name, description }, where' + NL
    + ' * `id` is exactly the value of [data-theme] in src/styles/themes.css.' + NL
    + ' *' + NL
    + ' * ADDING A THEME: declare it in themes.css, add it here. The compliance test' + NL
    + ' * tests/compliance/themes-page-lists-every-theme.spec.ts fails if the two ever' + NL
    + ' * disagree, which is the only reason the page can be trusted to be complete.' + NL
    + ' * -----------------------------------------------------------------------------' + NL
    + ' */' + NL
    + 'export const THEMES = [' + entries + NL + '];' + NL + NL
    + 'export default THEMES;' + NL
)
write('src/core/themes-registry.js', registry)

tc_new = tc.replace(
    m.group(0),
    '// #1025: the list moved to src/core/themes-registry.js so the themes page can' + NL
    + '// read the SAME one instead of keeping a hand-written copy that drifted to' + NL
    + '// 23 of 50. Import, do not re-declare.' + NL
    + "import { THEMES } from '../core/themes-registry.js';" + NL + NL,
    1,
)
# The import has to sit at the top of the module, not mid-file.
lines = tc_new.split(NL)
imp = "import { THEMES } from '../core/themes-registry.js';"
lines.remove(imp)
insert_at = 0
for i, line in enumerate(lines[:40]):
    if line.strip().startswith('*/'):
        insert_at = i + 1
        break
lines.insert(insert_at, NL.join(['', imp, '']))
tc_new = NL.join(lines)
write('src/wb-viewmodels/themecontrol.js', tc_new)
print('  src/core/themes-registry.js written; themecontrol.js imports it')

# ── 3. the page ──────────────────────────────────────────────────────────────
page = read('pages/themes.html')
start = page.index('<!-- THEME GRID -->')
end = page.index('<!-- LIVE PREVIEW SECTION -->')
block = io.open(os.path.join(SCRATCH, 'themes-grid-block.html'), encoding='utf-8').read()
page = page[:start] + block.rstrip() + NL + NL + page[end:]

# The hero and the stat cards carried the same stale 23. The script above sets
# them from the registry at render time; these are the pre-script values, so
# they should not be a number that was ever wrong.
page = page.replace(
    '<p>23 beautiful themes powered by the Harmonic Color System (HCS)</p>',
    '<p>Themes powered by the Harmonic Color System (HCS)</p>',
    1,
)
write('pages/themes.html', page)
print('  pages/themes.html: 23 hand-written cards replaced by the generated grid')

# ── 4. CSS for the generated card parts ──────────────────────────────────────
css = read('src/styles/pages/themes-showcase.css')
anchor = '/* Preview Section */'
addition = NL.join([
    '/* #1025 — the card parts the generated grid renders.',
    '   Every colour here comes from the card\'s OWN theme: the card carries',
    '   data-theme="<id>", so themes.css scopes that theme\'s variables to it and',
    '   the swatches ARE the theme. The markup this replaced painted three',
    '   hand-copied hsl() literals per card, which is both a standards violation',
    '   (11: zero hardcoded colours) and a second source of truth that could',
    '   disagree with the stylesheet -- and did. */',
    '.theme-card {',
    '  /* Was a <div onclick>. A control should be a button: keyboard reachable,',
    '     announced as pressable, and focusable without a tabindex patch. */',
    '  display: block;',
    '  width: 100%;',
    '  padding: 0;',
    '  text-align: left;',
    '  font: inherit;',
    '  color: inherit;',
    '}',
    '',
    '.theme-card__preview,',
    '.theme-card__info {',
    '  display: block;',
    '}',
    '',
    '.theme-card__preview {',
    '  display: flex;',
    '  gap: var(--space-md, 1rem);',
    '  align-items: center;',
    '  /* The preview area is painted by the theme it previews. */',
    '  background: var(--bg-primary);',
    '}',
    '',
    '.theme-card__colors {',
    '  display: flex;',
    '  flex-direction: column;',
    '  gap: var(--space-xs, 0.25rem);',
    '}',
    '',
    '.theme-card__dot {',
    '  display: block;',
    '  width: 24px;',
    '  height: 24px;',
    '  border-radius: 50%;',
    '  border: 2px solid var(--border-color);',
    '}',
    '',
    '.theme-card__dot--primary { background: var(--primary); }',
    '.theme-card__dot--secondary { background: var(--secondary); }',
    '.theme-card__dot--accent { background: var(--accent-color, var(--secondary)); }',
    '',
    '.theme-card__sample {',
    '  background: var(--bg-secondary);',
    '  color: var(--text-primary);',
    '}',
    '',
    '.theme-card__name,',
    '.theme-card__desc,',
    '.theme-card__tag {',
    '  display: block;',
    '}',
    '',
    '.theme-card__name {',
    '  font-size: 1rem;',
    '  font-weight: 600;',
    '  color: var(--text-primary);',
    '  margin-bottom: var(--space-xs, 0.25rem);',
    '}',
    '',
    '.theme-card__desc {',
    '  font-size: 0.75rem;',
    '  color: var(--text-muted);',
    '  margin-bottom: var(--space-sm, 0.5rem);',
    '}',
    '',
    '.theme-card__tag {',
    '  width: fit-content;',
    '}',
    '',
    '/* The card the site is currently wearing. */',
    '.theme-card[aria-pressed="true"] {',
    '  border-color: var(--primary);',
    '  box-shadow: 0 0 0 2px var(--primary);',
    '}',
    '',
])
assert anchor in css, 'themes-showcase.css anchor not found'
css = css.replace(anchor, addition + anchor, 1)
write('src/styles/pages/themes-showcase.css', css)
print('  themes-showcase.css: card-part rules added (theme variables, no literals)')
