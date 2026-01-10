# CLAUDE.md - WB Framework Project

## Session Start (DO THIS FIRST - NO EXCEPTIONS)

1. **Call `list_allowed_directories`** to confirm MCP access
2. **Read this file** (CLAUDE.md) 
3. **Read `docs/_today/CURRENT-STATUS.md`** for current project state
4. **Check `/Lock` folder** for any active file locks
5. **Then greet John** — ready to work, no questions

### What NOT To Do
- ❌ Never ask John to upload files
- ❌ Never ask "what are you working on" — read the status file
- ❌ Never fumble around looking for the project — you have MCP access
- ❌ Never ask John to help you "reboot" or get oriented

### What You Have Access To
- **Full filesystem access** via `wb-filesystem` MCP server
- **npm commands** via `npm-runner` MCP server
- **Project location**: `C:\Users\jwpmi\Downloads\AI\wb-starter`

---

## Project: WB Framework v3.0

**Owner:** John (Cielo Vista Software)
**Architecture:** WBServices pattern, Light DOM only, proper HTMLElement inheritance

### Key Standards
- **ES Modules only** — never use CommonJS (require, module.exports, .cjs)
- **Script output** — write to `data/*.json`, not console-only
- **Components** — `<wb-*>` custom element tags
- **Behaviors** — `x-*` attributes on existing elements

### File Structure
```
src/wb-models/{name}.schema.json   — Component schemas
src/wb-viewmodels/{name}.js        — Behavior/logic
src/styles/components/{name}.css   — Styles
docs/_today/CURRENT-STATUS.md      — Current work status
```

---

## File Locking Protocol

⚠️ **IMPORTANT**: Before editing ANY file, you MUST read [Lock/lock.md](Lock/lock.md) for the full coordination protocol.

**Key Rules:**
1. **Check `/Lock` folder** before touching any file
2. **Create `LOCKED-{filename}.md`** in `/Lock` before editing
   - Include your AI identifier, timestamp, and task
3. **Delete the lock file** immediately when done
4. **NEVER edit locked files** if a lock file exists for them
