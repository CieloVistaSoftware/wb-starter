# Builder Workflow

> Documents the end-to-end workflow for editing pages with the Visual Page Builder.

## Workflow Steps

1. **Open the builder** — navigate to `/builder` in the development server
2. **Select a page** — choose an existing page from the pages panel, or create a new one
3. **Edit the canvas** — drag components from the palette, click to select and edit properties
4. **Save changes** — click Save (or `Ctrl+S`) to persist the page fragment to `pages/`
5. **Preview** — switch to preview mode or open the page in a new tab

## Server API

The builder communicates with the Node.js server via:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pages` | `GET` | List all page fragments |
| `/api/pages/:name` | `GET` | Get a page fragment |
| `/api/pages/:name` | `PUT` | Save a page fragment |
| `/api/pages/:name` | `DELETE` | Delete a page fragment |

## Notes

- All changes are saved as HTML fragments in `pages/`
- The server must be running (`npm start`) for save operations to work
- Builder state (selected component, undo history) is in-memory only

> **Note:** Builder is currently not operational. See `docs/builder.todo.md`.
