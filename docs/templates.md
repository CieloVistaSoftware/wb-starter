# Templates Reference

> **File**: `data/templates.json`
> **Schema**: `data/templates.schema.json`

This document describes the structure and usage of the `templates.json` file, which powers the "Instant Page Generation" feature in the Builder.

## Purpose

The `templates.json` file acts as a registry of pre-defined page layouts and component combinations. It allows users to quickly bootstrap new pages or sections by selecting from a categorized list of templates.

## Structure

The file consists of two main sections: `categories` and `templates`.

```json
{
  "$schema": "./templates.schema.json",
  "version": "1.0.0",
  "description": "...",
  "categories": [ ... ],
  "templates": [ ... ]
}
```

### Categories

Categories define the grouping of templates in the UI.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier for the category (e.g., "landing", "heroes"). |
| `name` | string | Display name. |
| `icon` | string | Emoji icon for the category. |
| `description` | string | Brief description of what the category contains. |

**Example:**
```json
{
  "id": "heroes",
  "name": "Hero Sections",
  "icon": "🦸",
  "description": "Hero banners and headers"
}
```

### Templates

Templates define the actual content to be generated.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier for the template. |
| `name` | string | Display name. |
| `category` | string | Must match a category `id`. |
| `description` | string | Description of the template. |
| `tags` | string[] | Keywords for search/filtering. |
| `components` | object[] | Array of component definitions (shorthand format). |

#### Component Definition (Shorthand)

Templates use a shorthand JSON format to define components:

| Field | Description | Example |
|-------|-------------|---------|
| `b` | **Behavior** name | `"cardhero"` |
| `t` | **Tag** name (optional, defaults to div/custom element) | `"nav"` |
| `d` | **Data** attributes (props) | `{ "title": "Hello" }` |
| `children` | Array of child components | `[ ... ]` |
| `behaviors` | Array of additional behaviors | `["sticky"]` |

**Example Template:**
```json
{
  "id": "hero-minimal",
  "name": "Minimal Hero",
  "category": "heroes",
  "description": "Clean, text-focused hero",
  "tags": ["hero", "minimal"],
  "components": [
    { 
      "b": "cardhero", 
      "d": { 
        "title": "Less is More", 
        "subtitle": "Simplicity is the ultimate sophistication", 
        "variant": "minimal" 
      } 
    }
  ]
}
```

## Adding a New Template

1.  **Choose a Category**: Pick an existing category ID from the `categories` list.
2.  **Define Components**: Construct the component tree using the shorthand format.
3.  **Add to JSON**: Append your new template object to the `templates` array in `data/templates.json`.

## Usage in Builder

The Builder application reads this file to populate the "Templates" modal or sidebar. When a user selects a template:
1.  The `components` array is read.
2.  The Builder converts the shorthand JSON into the internal Builder Page JSON format.
3.  The components are appended to the current page or replace the current selection.
