# Plan to Remove All wb-data References and Code

## 1. Identify All wb-data References
- Search for "wb-data", "data-wb", and related keys/variables in the codebase.
- List all files and modules that import, require, or use wb-data.

## 2. Audit Dependencies
- Check which components, viewmodels, or pages depend on wb-data.
- Note any schema, config, or test files referencing wb-data.

## 3. Refactor or Remove Code
- For each usage, determine if it can be deleted or needs replacement with updated data sources.
- Refactor logic to use new or current data files (e.g., site.json, componentcompletions.json).

## 4. Update Tests
- Remove or rewrite tests that depend on wb-data.
- Ensure coverage for new data sources.

## 5. Clean Up Assets
- Delete wb-data files from the data/ directory.
- Remove any related documentation or comments.

## 6. Validate
- Run compliance and base tests to confirm no broken references.
- Manually check UI and API endpoints for missing data errors.

## 7. Document Changes
- Update README and docs to reflect the removal of wb-data.
