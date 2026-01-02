# Card Product Component

## Overview
The `cardproduct` component is a commerce-focused card designed to display product details, pricing, and call-to-action buttons. It includes built-in event handling for "Add to Cart" actions.

## Internals & Lifecycle

### Initialization
1.  **Image & Badge**: 
    - Creates a figure for the product image.
    - If `data-badge` is present (e.g., "Sale", "New"), it injects a badge element absolutely positioned over the image.
2.  **Price Formatting**:
    - Renders the current price in a bold, prominent style.
    - If `data-original-price` is provided, it renders it next to the current price with `text-decoration: line-through` and a muted color.
3.  **Rating System**:
    - Generates star characters (★) based on the `data-rating` value.
    - Appends the review count in parentheses if `data-reviews` is provided.
4.  **Interaction**:
    - Creates a full-width CTA button (default text: "Add to Cart").
    - Attaches a click handler to the button that dispatches a custom event.

### Events
The component dispatches a custom event when the CTA button is clicked.

- **Event Name**: `wb:cardproduct:addtocart`
- **Bubbles**: `true`
- **Detail Object**:
  ```javascript
  {
    title: "Product Title",
    price: "$99.00",
    id: "element-id"
  }
  ```

### DOM Structure

<article class="wb-card wb-card--product">
  <!-- Image & Badge -->
  <figure style="position:relative;">
    <img src="...">
    <span class="wb-card__badge">Sale</span>
  </figure>
  
  <!-- Product Info -->
  <div class="wb-card__product-info">
    <h3 class="wb-card__product-title">Title</h3>
    
    <!-- Rating -->
    <div class="wb-card__product-rating">
      <span>★★★★</span> <span>4.5 (120)</span>
    </div>
    
    <!-- Pricing -->
    <div class="wb-card__price-wrap">
      <span class="wb-card__price-current">$49.99</span>
      <span class="wb-card__price-original">$69.99</span>
    </div>
    
    <!-- CTA -->
    <button class="wb-card__product-cta">Add to Cart</button>
  </div>
</article>

```html
<article class="wb-card wb-card--product">
  <!-- Image & Badge -->
  <figure style="position:relative;">
    <img src="...">
    <span class="wb-card__badge">Sale</span>
  </figure>
  
  <!-- Product Info -->
  <div class="wb-card__product-info">
    <h3 class="wb-card__product-title">Title</h3>
    
    <!-- Rating -->
    <div class="wb-card__product-rating">
      <span>★★★★</span> <span>4.5 (120)</span>
    </div>
    
    <!-- Pricing -->
    <div class="wb-card__price-wrap">
      <span class="wb-card__price-current">$49.99</span>
      <span class="wb-card__price-original">$69.99</span>
    </div>
    
    <!-- CTA -->
    <button class="wb-card__product-cta">Add to Cart</button>
  </div>
</article>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-image` | string | required | URL of the product image. |
| `data-price` | string | required | Current price string. |
| `data-original-price` | string | - | Original price (shown struck through). |
| `data-badge` | string | - | Overlay text like "Sale" or "New". |
| `data-rating` | number | - | Star rating (0-5). |
| `data-reviews` | number | - | Count of reviews. |
| `data-cta` | string | "Add to Cart" | Text for the action button. |

## Usage Example

<div data-wb="cardproduct" 
     data-title="Wireless Headphones"
     data-image="/assets/headphones.jpg" 
     data-price="$199.00"
     data-original-price="$249.00"
     data-badge="Best Seller"
     data-rating="4.8"
     data-reviews="450">
</div>

<script>
  document.addEventListener('wb:cardproduct:addtocart', (e) => {
    console.log('Added to cart:', e.detail.title);
  });
</script>

```html
<div data-wb="cardproduct" 
     data-title="Wireless Headphones"
     data-image="/assets/headphones.jpg" 
     data-price="$199.00"
     data-original-price="$249.00"
     data-badge="Best Seller"
     data-rating="4.8"
     data-reviews="450">
</div>

<script>
  document.addEventListener('wb:cardproduct:addtocart', (e) => {
    console.log('Added to cart:', e.detail.title);
  });
</script>
```
