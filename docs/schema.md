# Schema Standards for Web Behaviors (WB) Components & Pages

## Purpose
This document defines the standard structure and conventions for all JSON schemas used in the WB project, including components, pages, and behaviors.

---

## 1. Required Top-Level Properties

| Property      | Type     | Description                                                                 |
|---------------|----------|-----------------------------------------------------------------------------|
| `$schema`     | string   | JSON Schema version reference                                               |
| `title`       | string   | Human-readable name of the schema                                           |
| `description` | string   | Short description of the schema's purpose                                   |
| `schemaFor`   | string   | (REQUIRED) The unique name of the component or page this schema validates   |

**Note:** The `schemaFor` property replaces the old `behavior` property for clarity. All new and updated schemas must use `schemaFor`.

---

## 2. Core Sections

- `properties`: Defines the data model (attributes, fields, etc.)
- `$view`: Describes the DOM structure, tags, and layout for the component/page
- `$methods`: Lists callable functions or actions (ViewModel layer)
- `compliance`: Accessibility, support level, and required children
- `$cssAPI`: Custom CSS variables and styling hooks
- `test`: Setup and validation for automated tests

---

## 3. Example Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Home Page",
  "description": "Schema for validating the home page structure.",
  "schemaFor": "home-page",
  "properties": {
    "hero": { "type": "object" }
  },
  "$view": [
    {
      "name": "hero",
      "tag": "wb-stack",
      "required": true,
      "description": "Hero section must use <wb-stack> and contain a <wb-cardhero> as its child.",
      "children": [
        {
          "tag": "wb-cardhero",
          "required": true,
          "attributes": [
            { "name": "variant", "required": true, "example": "cosmic" },
            { "name": "title", "required": true, "example": "Build stunning UIs" },
            { "name": "cta", "required": true, "example": "Explore Components" }
          ]
        }
      ]
    }
  ],
  "$methods": {},
  "compliance": {},
  "$cssAPI": {},
  "test": {}
}
```

---

## 4. Migration Guidance
- All schemas must use `schemaFor` for identification.
- Remove the old `behavior` property from all schemas.
- Document any schema-specific conventions in this file.

---

## 5. Rationale
- `schemaFor` is unambiguous and future-proof.
- Consistent structure enables tooling, validation, and automation.
- This standard applies to all new and legacy schemas after February 2026.

---

*For questions or updates, see the WB Behaviors project documentation team.*
