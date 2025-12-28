# Semantic HTML Elements

WB Behaviors uses semantic HTML elements as the foundation for all components. This ensures accessibility, SEO benefits, and meaningful document structure.

## Element Hierarchy

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

| Component | Primary Element | Secondary Elements |
|-----------|----------------|-------------------|
| card | `<article>` | header, main, footer |
| cardtestimonial | `<article>` | blockquote, cite, figure |
| cardnotification | `<aside>` | - |
| cardportfolio | `<article>` | address, figure |
| cardstats | `<article>` | data |
| cardfile | `<article>` | figure, figcaption |
| cardproduct | `<article>` | figure, data |
| alert | `<aside>` | - |

## Files in this Directory

- [article.md](./article.md) - Article element (base for cards)
- [aside.md](./aside.md) - Aside element (notifications, alerts)
- [blockquote.md](./blockquote.md) - Blockquote element (testimonials)
- [address.md](./address.md) - Address element (contact info)
- [figure.md](./figure.md) - Figure element (media containers)
- [data.md](./data.md) - Data element (stats, values)
- [time.md](./time.md) - Time element (dates, timestamps)
