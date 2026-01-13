
import os

file_path = 'src/wb-viewmodels/card.js'

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Constants to add
    constants = """
// Common CSS Variables
const VAR_TEXT_PRIMARY = 'var(--text-primary,#f9fafb)';
const VAR_TEXT_SECONDARY = 'var(--text-secondary,#9ca3af)';
const VAR_BORDER_COLOR = 'var(--border-color,#374151)';
const VAR_BG_TERTIARY = 'var(--bg-tertiary,#1e293b)';
const VAR_BG_SECONDARY = 'var(--bg-secondary,#1f2937)';
const VAR_PRIMARY = 'var(--primary,#6366f1)';

// Common Component Styles
const STYLE_HEADER = `padding:1rem;border-bottom:1px solid ${VAR_BORDER_COLOR};background:${VAR_BG_TERTIARY};display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;`;
const STYLE_FOOTER = `padding:0.75rem 1rem;border-top:1px solid ${VAR_BORDER_COLOR};background:${VAR_BG_TERTIARY};font-size:0.875rem;color:${VAR_TEXT_SECONDARY};`;
const STYLE_MAIN = `padding:1rem;flex:1;color:${VAR_TEXT_PRIMARY};`;
const STYLE_TITLE = `margin:0;font-size:1.1rem;font-weight:600;color:${VAR_TEXT_PRIMARY};`;
const STYLE_SUBTITLE = `margin:0.25rem 0 0;font-size:0.875rem;color:${VAR_TEXT_SECONDARY};`;
const STYLE_BADGE = `display:inline-block;padding:0.25rem 0.75rem;border-radius:999px;font-size:0.75rem;font-weight:600;background:${VAR_PRIMARY};color:white;white-space:nowrap;`;
"""

    # Insert constants after PREFERRED_TAGS definition
    insert_marker = "const PREFERRED_TAGS = ['ARTICLE', 'SECTION'];"
    if insert_marker in content:
        # Check if already added to avoid double add
        if "const VAR_TEXT_PRIMARY" not in content:
            content = content.replace(insert_marker, insert_marker + "\n" + constants)
            print("Added constants.")
        else:
            print("Constants already present.")
    else:
        print("Could not find insert marker")
        exit(1)

    # Replacements
    # Note: Replacements should be done carefully.
    
    # 1. Complex Styles (do these first as they contain the variables)
    replacements_styles = [
        ("padding:1rem;border-bottom:1px solid var(--border-color,#374151);background:var(--bg-tertiary,#1e293b);display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;", "${STYLE_HEADER}"),
        ("padding:0.75rem 1rem;border-top:1px solid var(--border-color,#374151);background:var(--bg-tertiary,#1e293b);font-size:0.875rem;color:var(--text-secondary,#9ca3af);", "${STYLE_FOOTER}"),
        ("padding:1rem;flex:1;color:var(--text-primary,#f9fafb);", "${STYLE_MAIN}"),
        ("margin:0;font-size:1.1rem;font-weight:600;color:var(--text-primary,#f9fafb);", "${STYLE_TITLE}"),
        ("margin:0.25rem 0 0;font-size:0.875rem;color:var(--text-secondary,#9ca3af);", "${STYLE_SUBTITLE}"),
        ("display:inline-block;padding:0.25rem 0.75rem;border-radius:999px;font-size:0.75rem;font-weight:600;background:var(--primary,#6366f1);color:white;white-space:nowrap;", "${STYLE_BADGE}"),
    ]
    
    for old, new in replacements_styles:
        # We need to replace the quoted string with the variable
        # logic: h.style.cssText = '...' -> h.style.cssText = STYLE_...
        # so we replace 'OLD' with NEW (no quotes in NEW if it's a variable reference)
        
        # However, the string in the file is surrounded by quotes ' or ".
        # Let's try replacing the content inside quotes.
        
        if old in content:
            print(f"Replacing style: {old[:20]}...")
            # We want to replace 'OLD' with STYLE_APP
            # But wait, `h.style.cssText = 'OLD';`
            # needs to become `h.style.cssText = STYLE_HEADER;`
            # This means replacing `'OLD'` with `STYLE_HEADER`.
            
            content = content.replace(f"'{old}'", new.replace("${", "").replace("}", ""))
            content = content.replace(f'"{old}"', new.replace("${", "").replace("}", ""))
        else:
            print(f"Style not found: {old[:20]}...")

    # 2. Variable Constants
    replacements_vars = [
        ("'var(--text-primary,#f9fafb)'", "VAR_TEXT_PRIMARY"),
        ("'var(--text-secondary,#9ca3af)'", "VAR_TEXT_SECONDARY"),
        ("'var(--border-color,#374151)'", "VAR_BORDER_COLOR"),
        ("'var(--bg-tertiary,#1e293b)'", "VAR_BG_TERTIARY"),
        ("'var(--bg-secondary,#1f2937)'", "VAR_BG_SECONDARY"),
        ("'var(--primary,#6366f1)'", "VAR_PRIMARY"),
    ]

    for old, new in replacements_vars:
        if old in content:
            print(f"Replacing variable: {old}")
            content = content.replace(old, new)
            
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print("Refactoring complete.")

except Exception as e:
    print(f"Error: {e}")
