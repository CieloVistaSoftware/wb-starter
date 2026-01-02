# `<blockquote>` Element

The `<blockquote>` element represents an extended quotation from another source. In Web Behaviors (WB), it's used for testimonials and quoted content.

## Semantic Meaning

- Extended quotation from external source
- Should include citation when source is known
- Typically indented or visually distinct from regular content

## WB Components Using `<blockquote>`

### Card Testimonial (`cardtestimonial`)

```html
<article data-wb="cardtestimonial" data-quote="..." data-author="Jane Smith">
  <blockquote class="wb-card__quote">
    "This product changed my life. Highly recommended!"
  </blockquote>
  <footer class="wb-card__quote-footer">
    <cite class="wb-card__author">Jane Smith</cite>
    <span class="wb-card__author-role">CEO, TechCorp</span>
  </footer>
</article>
```

## Companion Element: `<cite>`

The `<cite>` element identifies the source of a quotation:

```html
<blockquote>
  <p>Design is not just what it looks like. Design is how it works.</p>
</blockquote>
<cite>Steve Jobs</cite>
```

**Note:** `<cite>` should contain the *title of a work* or *name of a person*, not the quotation itself.

## Accessibility Considerations

| Attribute | Purpose |
|-----------|---------|
| `cite` attribute | URL of quotation source |
| Proper nesting | Ensure quote text is in `<p>` tags |
| Visual distinction | Make quotes clearly different from regular text |

## Example: Full Testimonial Structure

```html
<article data-wb="cardtestimonial" class="wb-card wb-card--testimonial">
  <figure class="wb-card__avatar">
    <img src="avatar.jpg" alt="Jane Smith">
  </figure>
  
  <blockquote class="wb-card__quote" cite="https://example.com/review">
    <p>"This product changed my life. The support team is incredible 
    and the features are exactly what I needed."</p>
  </blockquote>
  
  <footer class="wb-card__quote-footer">
    <cite class="wb-card__author">Jane Smith</cite>
    <p class="wb-card__author-role">CEO, TechCorp</p>
    <div class="wb-card__rating" aria-label="5 out of 5 stars">
      ⭐⭐⭐⭐⭐
    </div>
  </footer>
</article>
```

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
