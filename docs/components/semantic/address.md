# `<address>` Element

The `<address>` element provides contact information for a person, organization, or entity. In WB-Starter, it's used in portfolio and contact cards.

## Semantic Meaning

- Contact information for the nearest `<article>` or `<body>` ancestor
- NOT for arbitrary postal addresses (use `<p>` instead)
- Typically includes: email, phone, social links, physical address

## WB Components Using `<address>`

### Card Portfolio (`cardportfolio`)

`x-cardportfolio` builds its own `<address>` block from `email`/`phone`/`website`
attributes — it does not read hand-authored `<address>` markup as content
(the element's children are replaced, not merged).

<wb-demo>
<article
  x-cardportfolio
  name="John Doe"
  title="Software Developer"
  location="San Francisco, CA"
  email="john@example.com"
  phone="+15551234"
  website="johndoe.com">
</article>
</wb-demo>

## Accessibility Considerations

| Attribute | Purpose |
|-----------|---------|
| `href="mailto:"` | Clickable email links |
| `href="tel:"` | Clickable phone links |
| Link text | Should describe the link purpose |
| `aria-label` | For icon-only links |

## Example: Full Portfolio Card

Social links (`linkedin`, `twitter`, `github`, `dribbble`) render in a separate
`<nav>` below the `<address>`, not inside it — LinkedIn/GitHub are profile
links, not contact channels, so they're not semantically part of the address.

<wb-demo>
<article
  x-cardportfolio
  name="John Doe"
  title="Senior Software Developer"
  company="Acme Inc"
  avatar="avatar.jpg"
  bio="Passionate about creating great software and mentoring junior developers."
  email="john@acme.com"
  phone="+15551234567"
  linkedin="https://linkedin.com/in/johndoe"
  github="https://github.com/johndoe">
</article>
</wb-demo>

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
