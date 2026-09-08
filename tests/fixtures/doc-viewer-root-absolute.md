# Fixture: a doc that writes root-absolute asset paths

Exists for `tests/regression/doc-viewer-rebases-root-absolute-assets.spec.ts` (#1053).

Every real doc was corrected to use relative paths, which is right — and it also means
there is nothing left in `docs/` for that gate to fail on. A gate whose subject matter
has been tidied away passes by having nothing to check, so the case is kept here
deliberately instead.

Do **not** "fix" the paths below. They are the input.

<img src="/images/placeholder.svg" alt="root-absolute image">

<video poster="/images/placeholder.svg" src="/images/placeholder.svg"></video>

[a root-absolute link](/demos/site/cards.html)
