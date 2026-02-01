# Semantic HTML Elements - wb-starter v3.0

wb-starter uses semantic HTML elements as the foundation for all components, ensuring accessibility, SEO benefits, and meaningful document structure.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SECTIONING ELEMENTS                       │
├─────────────────────────────────────────────────────────────┤
│  <article>  - Self-contained content (cards, posts)         │
│  <section>  - Thematic grouping with heading                │
│  <aside>    - Related but tangential content (notifications)│
│  <nav>      - Navigation links                              │
│  <header>   - Introductory content                          │
│  <footer>   - Footer content                                │
│  <main>     - Main content of document                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    CONTENT ELEMENTS                          │
├─────────────────────────────────────────────────────────────┤
│  <figure>      - Self-contained media with caption          │
│  <figcaption>  - Caption for figure                         │
│  <blockquote>  - Extended quotation (testimonials)          │
│  <cite>        - Citation/reference                         │
│  <address>     - Contact information (portfolio)            │
│  <time>        - Date/time values                           │
│  <data>        - Machine-readable data (stats)              │
└─────────────────────────────────────────────────────────────┘
```

## Component → Element Mapping

| Component | Custom Tag | Primary Element | Secondary Elements |
|-----------|------------|----------------|-------------------|
| card | `<wb-card>` | `<article>` | header, main, footer |
| cardtestimonial | `<wb-cardtestimonial>` | `<article>` | blockquote, cite, figure |
| cardnotification | `<wb-cardnotification>` | `<aside>` | - |
| cardportfolio | `<wb-cardportfolio>` | `<article>` | address, figure |
| cardstats | `<wb-cardstats>` | `<article>` | data |
| cardfile | `<wb-cardfile>` | `<article>` | figure, figcaption |
| cardproduct | `<wb-cardproduct>` | `<article>` | figure, data |
| alert | `<wb-alert>` | `<aside>` | - |
| tabs | `<wb-tabs>` | `<section>` | nav |
| dialog | `<wb-dialog>` | `<dialog>` | - |
| progress | `<wb-progress>` | `<progress>` | - |

## Why Semantic HTML?

### Accessibility
Screen readers and assistive technologies understand semantic structure, providing better navigation and context for users.

### SEO
Search engines prioritize well-structured semantic content, improving discoverability.

### Maintainability
Semantic elements are self-documenting, making code easier to understand and maintain.

### Browser Features
Semantic elements come with built-in behaviors (e.g., `<dialog>` for modals, `<progress>` for progress bars).

## Files in this Directory

- [article.md](./article.md) - Article element (base for cards)
- [aside.md](./aside.md) - Aside element (notifications, alerts)
- [blockquote.md](./blockquote.md) - Blockquote element (testimonials)
- [address.md](./address.md) - Address element (contact info)
- [figure.md](./figure.md) - Figure element (media containers)
- [data.md](./data.md) - Data element (stats, values)
- [time.md](./time.md) - Time element (dates, timestamps)
