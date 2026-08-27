# `<address>` Element

The `<address>` element provides contact information for a person, organization, or entity.

## Semantic Meaning

- Contact information for the nearest `<article>` or `<body>` ancestor
- NOT for arbitrary postal addresses (use `<p>` instead)
- Typically includes: email, phone, social links, physical address
- No dedicated WB behavior of its own -- `<address>` is plain semantic HTML,
  styled like any other element, with no `x-*`/`autoInject` enhancement to
  opt into.

## Basic Usage

<div x-demo>
<article>
  <h3>Jane Smith</h3>
  <p>Freelance illustrator based in Portland, OR.</p>
  <address>
    <a href="mailto:jane@example.com">jane@example.com</a><br>
    <a href="tel:+15035551234">+1 (503) 555-1234</a>
  </address>
</article>
</div>

## With a Physical Location

`<address>` can include a real place alongside contact links -- still scoped
to the nearest `<article>`/`<body>` ancestor, still not a general-purpose
postal-address container:

<div x-demo>
<article>
  <h3>Acme Studio</h3>
  <address>
    123 Design Ave, Suite 400<br>
    Portland, OR 97201<br>
    <a href="mailto:hello@acmestudio.example">hello@acmestudio.example</a>
  </address>
</article>
</div>

## Accessibility Considerations

| Attribute | Purpose |
|-----------|---------|
| `href="mailto:"` | Clickable email links |
| `href="tel:"` | Clickable phone links |
| Link text | Should describe the link purpose |
| `aria-label` | For icon-only links |

## CSS Styling

`<address>` renders in italics by default in every browser -- almost always
unwanted for contact info, so reset it explicitly:

```css
address {
  font-style: normal; /* Override browser default italic */
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

address a {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s;
}

address a:hover {
  color: var(--primary);
}
```

## Best Practices

1. **Scope correctly** - `<address>` applies to nearest article/body
2. **Use semantic links** - `mailto:` and `tel:` protocols
3. **Provide alternatives** - Text + clickable for accessibility
4. **Reset italic** - Browser default is italic, often unwanted
5. **Group logically** - Contact info should be visually grouped

## Related

Behaviors that build their own `<address>` block internally from
structured attributes (rather than hand-authored `<address>` markup, which
they replace, not merge) document their own contact-info behavior on their
own page, not here:

- [cardportfolio](../cards/cardportfolio.md) -- builds `<address>` from `email`/`phone`/`website` attributes
- [cardprofile](../cards/cardprofile.md) -- user profile card with contact/social links
