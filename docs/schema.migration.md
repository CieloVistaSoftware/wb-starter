# Web Behaviors (WB) Schema Migration Plan

## Purpose
This document outlines the step-by-step plan to migrate all WB project schemas to the new modular, standardized structure using the `schemaFor` property and the recommended folder layout.

---

## 1. Goals
- Replace all legacy `behavior` properties with `schemaFor` in every schema.
- Move schemas into logical subfolders: components, behaviors, pages, _base, registry.
- Ensure all schemas follow the conventions in `schema.md`.
- Update documentation and tooling to reference the new structure.

---

## 2. Folder Structure
```
src/wb-models/
  components/   # One schema per WB component
  behaviors/    # One schema per x-* or data-wb behavior
  pages/        # One schema per page type
  _base/        # Shared/base schemas for inheritance
  registry/     # Registry/category schemas (views, layouts, etc.)
```

---

## 3. Migration Steps

### Step 1: Audit Existing Schemas
- List all `.schema.json` files in `src/wb-models/` and subfolders.
- Identify which are components, behaviors, pages, base, or registry.

### Step 2: Update Schema Metadata
- For each schema, replace `behavior` with `schemaFor` (if present).
- Ensure all schemas have the required top-level properties (`$schema`, `title`, `description`, `schemaFor`).

### Step 3: Move Schemas to New Folders
- Move each schema file into its appropriate subfolder.
- Rename files if needed for clarity and consistency (e.g., `wb-card.schema.json`).

### Step 4: Refactor References
- Update all code, tests, and documentation to reference the new schema locations and names.
- Update `$ref` paths in schemas to match the new structure.

### Step 5: Validate and Test
- Run schema validation on all components, pages, and behaviors using the new structure.
- Fix any validation errors or broken references.

### Step 6: Update Documentation
- Update `schema.md` and other docs to reflect the new conventions and folder structure.
- Add migration notes and rationale for future contributors.

---

## 4. Timeline & Ownership
- Assign migration tasks to team members.
- Set deadlines for each migration step.
- Review and approve changes via code review.

---

## 5. Rationale
- Modular schemas improve maintainability, clarity, and scalability.
- `schemaFor` is unambiguous and future-proof.
- Folder structure makes schemas easy to find and reuse.

---

*For questions or help, contact the WB Behaviors project maintainers.*
