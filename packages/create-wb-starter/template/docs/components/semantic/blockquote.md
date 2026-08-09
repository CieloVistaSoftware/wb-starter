# `<blockquote>` Element

The `<blockquote>` element represents an extended quotation from another source. In WB-Starter, it's used for testimonials and quoted content.

## Semantic Meaning

- Extended quotation from external source
- Should include citation when source is known
- Typically indented or visually distinct from regular content

## WB Components Using `<blockquote>`

### Card Testimonial (`cardtestimonial`)

`x-cardtestimonial` builds its own `<blockquote>`/`<cite>`/`<footer>` from the
`quote`/`author`/`role` attributes — hand-authored children are replaced, not
merged.

<wb-demo>
<article
  x-cardtestimonial
  quote="This product changed my life. Highly recommended!"
  author="Jane Smith"
  role="CEO, TechCorp">
</article>
</wb-demo>

## Companion Element: `<cite>`

The `<cite>` element identifies the source of a quotation:

<wb-demo>
<blockquote>
  <p>Design is not just what it looks like. Design is how it works.</p>
</blockquote>
<cite>Steve Jobs</cite>
</wb-demo>

**Note:** `<cite>` should contain the *title of a work* or *name of a person*, not the quotation itself.

## Accessibility Considerations

| Attribute | Purpose |
|-----------|---------|
| `cite` attribute | URL of quotation source |
| Proper nesting | Ensure quote text is in `<p>` tags |
| Visual distinction | Make quotes clearly different from regular text |

## Example: Full Testimonial Structure

<wb-demo>
<article
  x-cardtestimonial
  quote="This product changed my life. The support team is incredible and the features are exactly what I needed."
  author="Jane Smith"
  role="CEO, TechCorp"
  avatar="avatar.jpg"
  rating="5">
</article>
</wb-demo>

## CSS Styling

```css
blockquote.wb-card__quote {
  /* Quotation marks */
  quotes: """ """ "'" "'";
  font-style: italic;
  position: relative;
  padding-left: 2rem;
}

blockquote.wb-card__quote::before {
  content: open-quote;
  font-size: 3rem;
  position: absolute;
  left: 0;
  top: -0.5rem;
  color: var(--primary);
  opacity: 0.3;
}

cite.wb-card__author {
  font-style: normal;
  font-weight: 600;
}
```

## Best Practices

1. **Always cite sources** - Use `<cite>` for attribution
2. **Use `cite` attribute** - Include URL when available
3. **Keep quotes focused** - Extract the most relevant portion
4. **Provide context** - Include author's role/credentials
5. **Visual quotes** - Use CSS quotation marks for clarity
