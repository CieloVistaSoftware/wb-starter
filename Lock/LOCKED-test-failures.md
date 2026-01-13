# LOCKED: Test Failures Fix

**AI:** Claude  
**Started:** 2026-01-12T20:00:00Z  
**Task:** Fix pre-existing test failures (add $cssAPI, duplicate variables, timeout)  
**ETA:** 30 minutes

---

**Files being modified:**
- `src/wb-models/card.schema.json` - add $cssAPI
- `src/wb-models/cardprofile.schema.json` - add $cssAPI
- `src/wb-models/demo.schema.json` - add $cssAPI
- `src/wb-viewmodels/card.js` - fix 13 duplicate variable declarations
- `tests/` - investigate card-schema test timeout
