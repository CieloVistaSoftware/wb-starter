---
labels: [QA, priority:medium]
---

# Address untested bug in bug registry & increase schema test coverage

Description
- Compliance tests show `NO UNTESTED BUGS` violation (1 untested bug) and many schemas without tests (reported 64 schemas missing tests). This blocks the coverage checks.

Proposed approach
- Triage the bug registry entry, add tests for critical schemas, and update the test coverage metadata or add missing tests.

Acceptance criteria
- Bug registry `metadata.untestedBugs` is 0.
- Schemas without tests reduced below threshold and `test-coverage` checks pass.

Tasks
- [ ] Inspect bug registry (`data/bug-registry.json` or equivalent) and triage the untested bug
- [ ] Add tests for high-priority schemas listed by the test output
- [ ] Update test coverage summary or document intentional exemptions
- [ ] Re-run compliance test suite

Estimate: 4-8 hours
