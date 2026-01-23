---
labels: [QA, priority:high]
---

# Fix runtime error: "header is not defined"

Description
- Tests report a runtime error: `header is not defined` (see `data/errors.json`). This causes `tests/compliance/error-log-empty.spec.ts` to fail.

Steps to reproduce
- Run `npm run test:compliance` or open http://localhost:3000/index.html and check `data/errors.json`.

Proposed fix
- Locate the undefined `header` reference in source (likely a missing import or variable in a view or viewmodel). Add guard or correct the reference and ensure the error is cleared.

Acceptance criteria
- `data/errors.json` has no runtime error entries.
- `tests/compliance/error-log-empty.spec.ts` passes.

Tasks
- [ ] Reproduce locally and capture stack trace
- [ ] Locate source of `header` reference and implement fix
- [ ] Add regression test if appropriate
- [ ] Clear `data/errors.json` and re-run compliance tests (expect no runtime errors)
- [ ] Mark this issue closed when tests pass

Estimate: 1-3 hours
