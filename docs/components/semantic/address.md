# `<address>` Element

The `<address>` element provides contact information for a person, organization, or entity. In Web Behaviors (WB), it's used in portfolio and contact cards.

## Semantic Meaning

- Contact information for the nearest `<article>` or `<body>` ancestor
- NOT for arbitrary postal addresses (use `<p>` instead)
- Typically includes: email, phone, social links, physical address

## WB Components Using `<address>`

### Card Portfolio (`cardportfolio`)

```html
<article data-wb="cardportfolio" data-name="John Doe" data-email="john@example.com">
  <header class="wb-card__header">
    <h3 class="wb-card__portfolio-name">John Doe</h3>
    <p class="wb-card__portfolio-title">Software Developer</p>
  </header>
  
  <address class="wb-card__contact">
    <a href="mailto:john@example.com" class="wb-card__portfolio-email">
      📧 john@example.com
    </a>
    <a href="tel:+15551234" class="wb-card__portfolio-phone">
      📱 +1 555-1234
    </a>
    <a href="https://johndoe.com" class="wb-card__portfolio-website">
      🌐 johndoe.com
    </a>
    <span class="wb-card__portfolio-location">
      📍 San Francisco, CA
    </span>
  </address>
</article>
```

## Accessibility Considerations

| Attribute | Purpose |
|-----------|---------|
| `href="mailto:"` | Clickable email links |
| `href="tel:"` | Clickable phone links |
| Link text | Should describe the link purpose |
| `aria-label` | For icon-only links |

## Example: Full Portfolio Card

```html
<article data-wb="cardportfolio" class="wb-card wb-card--portfolio">
  <figure class="wb-card__avatar">
    <img src="avatar.jpg" alt="John Doe">
  </figure>
  
  <header class="wb-card__header">
    <h3 class="wb-card__portfolio-name">John Doe</h3>
    <p class="wb-card__portfolio-title">Senior Software Developer</p>
    <p class="wb-card__portfolio-company">Acme Inc</p>
  </header>
  
  <p class="wb-card__portfolio-bio">
    Passionate about creating great software and mentoring junior developers.
  </p>
  
  <address class="wb-card__contact">
    <a href="mailto:john@acme.com" aria-label="Email John">
      <span aria-hidden="true">📧</span> john@acme.com
    </a>
    <a href="tel:+15551234567" aria-label="Call John">
      <span aria-hidden="true">📱</span> +1 (555) 123-4567
    </a>
    <a href="https://linkedin.com/in/johndoe" aria-label="John's LinkedIn">
      <span aria-hidden="true">💼</span> LinkedIn
    </a>
    <a href="https://github.com/johndoe" aria-label="John's GitHub">
      <span aria-hidden="true">💻</span> GitHub
    </a>
  </address>
</article>
```

## CSS Styling

```css
address.wb-card__contact {
  font-style: normal; /* Override browser default italic */
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

address.wb-card__contact a {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s;
}

address.wb-card__contact a:hover {
  color: var(--primary);
}
```

## Best Practices

1. **Scope correctly** - `<address>` applies to nearest article/body
2. **Use semantic links** - `mailto:` and `tel:` protocols
3. **Provide alternatives** - Text + clickable for accessibility
4. **Reset italic** - Browser default is italic, often unwanted
5. **Group logically** - Contact info should be visually grouped
