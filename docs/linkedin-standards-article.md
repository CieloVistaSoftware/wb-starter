# LinkedIn Article: The 3 Non-Negotiable Standards of Our Front-End Architecture

**Headline:** Stop Guessing. Start Standardizing. How Strict Front-End Rules Drive Velocity.

We've all seen "Div Soup"—nested implementations where spacing is random, colors are hardcoded, and structure is meaningless. To combat entropy in the **Web Behaviors** system, we enforce three strict standards. Here is the pared-down version of our engineering philosophy.

---

### 1. The "No-Div" Policy (Semantic Standard)

**The Rule:** If an HTML5 semantic element exists for your use case, `<div>` is forbidden. 

We don't build "Cards" with `<div class="card">`; we use `<article>`. We don't build sidebars with divs; we use `<aside>`.
*   **Cards/Widgets** → `<article>`
*   **Tab Panels** → `<section>`
*   **Navigation** → `<nav>`
*   **Dialogs** → `<dialog>`

**Why?** Accessibility is automatic, not an afterthought. SEO is inherent. The code describes *what it is*, not just how it looks.

### 2. The "One Source of Truth" (OOP CSS Standard)

**The Rule:** CSS is layered, object-oriented, and never repeats itself.

We use a strict hierarchy: `Foundation > Themes > Behaviors`. 
*   **No Hardcoded Values:** Every color, border, and spacing unit is a variable (`var(--space-md)`).
*   **Strict Spacing:** We don't guess padding. 
    *   Containers/Panels? **1rem** (`--space-md`). 
    *   Inputs/Buttons? **0.5rem** (`--space-sm`).
    *   List Items? **0.25rem** (`--space-xs`).

**Why?** When you change a theme variable, the entire application updates instantly. Dark mode isn't a hack; it's just a different variable set.

### 3. The "One Attribute Per Line" Rule (Code Standard)

**The Rule:** In HTML code examples and demos, every attribute gets its own line. No exceptions.

```html
<!-- ✅ Correct -->
<button 
  type="button"
  data-variant="primary"
  data-size="lg">
  Click Me
</button>

<!-- ❌ Wrong -->
<button type="button" data-variant="primary" data-size="lg">Click Me</button>
```

**Why?** Readability and "Git-ability." Diffs are cleaner. It forces you to think about every attribute you verify. It makes code easier for both humans and AI agents to parse and maintain.

---

**The Takeaway:**
Standards aren't constraints; they're accelerators. By removing the need to decide "how much padding" or "which tag to use," we focus entirely on building value.

#FrontEndDevelopment #WebStandards #CSS #SemanticHTML #EngineeringCulture
