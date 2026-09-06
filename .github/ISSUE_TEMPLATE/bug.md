---
name: Bug / defect
about: Something is wrong. Include the signature so the fix becomes reusable.
title: ''
labels: bug
assignees: ''
---

## In plain English

<!-- What a person sees going wrong. No jargon. -->

## Signature

<!--
REQUIRED. This is the machine-readable half of what you just wrote above, and
it is what lets a solved problem be matched or auto-detected later.
See docs/standards/ISSUE-SIGNATURE-BLOCK.md.

kind:     runtime | test-failure | measured | structural | dead-declaration | process
detect:   a runnable command that finds instances. Required whenever the
          condition is computable — every dead-declaration signature is.
test/fix: fill these in when the issue is closed. Closing without `test` means
          closed as CLAIMED, not VERIFIED.
-->

```yaml
kind:
subject:
observed:
expected:
detect: |

test:
fix:
```

## What is actually happening

<!-- The mechanism. Where in the code, and why it produces the symptom. -->

## Fix

<!-- What should change. -->

## Guard

<!-- The test that will prove it, and stop it coming back. -->
