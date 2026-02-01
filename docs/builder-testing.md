# Builder Component Testing

## Problem Statement

Components dragged onto builder canvas have critical issues:
1. Properties panel shows incomplete/empty properties
2. Components don't work as expected (cardexpandable can't expand)
3. No way to edit content for content-based components
4. Schema properties not reflected in builder

## Root Causes

1. **C.All definitions incomplete** - Component `d` object only has minimal defaults
2. **No schema reading** - Builder doesn't fetch properties from schemas
3. **Content not editable** - Components with expandable/collapsible content have no way to set it
4. **No tests** - Never verified drop→configure→works workflow

## Solution Architecture

### Phase 1: Builder-Schema Integration
- Create `getComponentSchema(behaviorName)` function
- Merge schema properties with C.All defaults
- Generate property inputs from schema definitions

### Phase 2: Component Definitions Audit
- Every component in C.All must have ALL configurable properties
- Content-based components need textarea inputs
- Boolean properties need checkbox inputs

### Phase 3: Builder Test Suite
- Test every component: drop → verify render → verify properties → verify interaction

See `docs/testing-runbook.md` for the recommended commands, CI integration examples, and guidance on producing Playwright traces and artifacts for flaky tests. Also refer to `CONTRIBUTING.md` for how to attach traces to PRs.