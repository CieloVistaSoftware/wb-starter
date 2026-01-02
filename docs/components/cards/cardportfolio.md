# Card Portfolio Component

## Overview
The `cardportfolio` component is a rich profile card designed for personal branding, team pages, or user bios. It aggregates contact info, social links, and biographical data into a cohesive layout.

## Internals & Lifecycle

### Initialization
1.  **Cover & Avatar**:
    - Creates a cover image figure (height: 120px).
    - Creates an avatar image with a negative top margin (`-50px`) to create an overlap effect with the cover.
2.  **Profile Details**:
    - Renders Name (`h2`), Title (primary color), Company (muted), and Location (with 📍 icon).
3.  **Contact Section**:
    - Generates an `<address>` block.
    - Automatically creates `mailto:` links for emails and `tel:` links for phone numbers.
    - Adds icons (📧, 📱, 🌐) to each contact item.
4.  **Social Links**:
    - Checks for `linkedin`, `twitter`, and `github` attributes.
    - Renders a row of circular icon buttons for each provided link.

### DOM Structure

<article class="wb-card wb-card--portfolio">
  <!-- Cover Image -->
  <figure class="wb-card__portfolio-cover" style="background-image: url(...)"></figure>
  
  <!-- Profile Info -->
  <div style="margin-top: -50px;">
    <img class="wb-card__portfolio-avatar" src="...">
    <h2>Name</h2>
    <p>Title</p>
  </div>
  
  <!-- Contact -->
  <address>
    <a href="mailto:...">📧 email@example.com</a>
  </address>
  
  <!-- Social -->
  <div class="wb-card__portfolio-social">
    <a href="...">💼</a> <!-- LinkedIn -->
    <a href="...">🐦</a> <!-- Twitter -->
  </div>
</article>

```html
<article class="wb-card wb-card--portfolio">
  <!-- Cover Image -->
  <figure class="wb-card__portfolio-cover" style="background-image: url(...)"></figure>
  
  <!-- Profile Info -->
  <div style="margin-top: -50px;">
    <img class="wb-card__portfolio-avatar" src="...">
    <h2>Name</h2>
    <p>Title</p>
  </div>
  
  <!-- Contact -->
  <address>
    <a href="mailto:...">📧 email@example.com</a>
  </address>
  
  <!-- Social -->
  <div class="wb-card__portfolio-social">
    <a href="...">💼</a> <!-- LinkedIn -->
    <a href="...">🐦</a> <!-- Twitter -->
  </div>
</article>
```

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `data-name` | string | Full name. |
| `data-title` | string | Job title. |
| `data-company` | string | Company name. |
| `data-avatar` | string | URL to profile picture. |
| `data-cover` | string | URL to cover background image. |
| `data-bio` | string | Short biography text. |
| `data-location` | string | City/Country. |
| `data-email` | string | Email address. |
| `data-phone` | string | Phone number. |
| `data-website` | string | Personal website URL. |
| `data-linkedin` | string | LinkedIn profile URL. |
| `data-twitter` | string | Twitter/X profile URL. |
| `data-github` | string | GitHub profile URL. |

## Usage Example

<div data-wb="cardportfolio" 
     data-name="Jane Doe"
     data-title="Senior Developer"
     data-company="Tech Corp"
     data-avatar="/assets/jane.jpg"
     data-cover="/assets/code-bg.jpg"
     data-email="jane@example.com"
     data-github="https://github.com/janedoe">
</div>

```html
<div data-wb="cardportfolio" 
     data-name="Jane Doe"
     data-title="Senior Developer"
     data-company="Tech Corp"
     data-avatar="/assets/jane.jpg"
     data-cover="/assets/code-bg.jpg"
     data-email="jane@example.com"
     data-github="https://github.com/janedoe">
</div>
```
