# Builder Pages

> Documents page management in the Visual Page Builder.

## Overview

Pages in WB-Starter are HTML fragments stored in `pages/`. The builder allows creating, editing, and deleting pages.

## Page Operations

| Operation | Description |
|-----------|-------------|
| **New Page** | Creates a new fragment in `pages/` and registers it in `config/site.json` nav |
| **Edit Page** | Opens the page in the builder canvas |
| **Rename Page** | Updates the fragment filename and nav entry |
| **Delete Page** | Removes the fragment and nav entry |

## Page JSON Format

Page content is stored as HTML fragments. The server wraps them with the site shell (nav, header, footer) at request time.

> **Note:** Builder is currently not operational. See `docs/builder.todo.md`.
