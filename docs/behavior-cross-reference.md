# WB-Starter Behaviors Cross-Reference

A complete reference of all WB Behaviors with accurate documentation of what each behavior adds.

---

## What is a Behavior?

A **behavior** is a JavaScript function that decorates an HTML element by adding:
- CSS classes (styling hooks)
- Inline styles (visual enhancement)
- Event listeners (interactivity)
- ARIA attributes (accessibility)
- Data attributes (state tracking)

A behavior does **NOT** change what the element fundamentally is - it enhances it.

---

## Auto-Injection Rules

With `autoInject: true` in `config/site.json`, semantic elements are automatically decorated.

### Decoration vs Morphing

| Type | Rule | Example |
|------|------|---------|
| **Decoration** | Behavior name = element name | `<button>` → `button` behavior |
| **Morphing** | Behavior name ≠ element name | `<article>` → `card` behavior |

---

## Decorating Behaviors (Same Name)

These behaviors enhance the element while preserving its identity.

---

### button
**Module:** `semantics/button.js`  
**Element:** `<button>`

**What it adds:**
- Class: `wb-button`, `wb-button--{variant}`, `wb-button--{size}`
- Styles: padding, border-radius, cursor, font-weight, transitions
- Variants: primary, secondary, success, danger, warning, ghost, link, outline
- Sizes: xs, sm, md, lg, xl
- Loading state with spinner
- Icon support (left/right position)
- Click handler with toast feedback

**Data attributes:**
- `variant` - Button style (primary, secondary, etc.)
- `size` - Button size (xs, sm, md, lg, xl)
- `icon` - Icon character
- `icon-position` - left or right
- `loading` - Show loading spinner
- `disabled` - Disable button

**Examples:**

Basic buttons - auto-styled:

<wb-demo>
<wb-container>
<button>Default Primary</button>
<button type="submit">Submit Form</button>
<button type="reset">Reset</button>
</wb-container>
</wb-demo>

All variants:

<wb-demo>
<wb-container>
<button variant="primary">Primary</button>
<button variant="secondary">Secondary</button>
<button variant="success">Success</button>
<button variant="danger">Danger</button>
<button variant="warning">Warning</button>
<button variant="ghost">Ghost</button>
<button variant="link">Link Style</button>
<button variant="outline">Outline</button>
</wb-container>
</wb-demo>

All sizes:

<wb-demo>
<wb-container>
<button size="xs">Extra Small</button>
<button size="sm">Small</button>
<button size="md">Medium (default)</button>
<button size="lg">Large</button>
<button size="xl">Extra Large</button>
</wb-container>
</wb-demo>

With icons:

<wb-demo>
<wb-container>
<button icon="💾">Save</button>
<button
  icon="🗑️"
  variant="danger">
  Delete
</button>
<button
  icon="→"
  icon-position="right">
  Next
</button>
<button icon="←">Back</button>
</wb-container>
</wb-demo>

States:

<wb-demo>
<wb-container>
<button loading>Saving...</button>
<button disabled>Disabled</button>
</wb-container>
</wb-demo>

Combined (variant + size + icon together):

<wb-demo>
<wb-container>
<button
  variant="success"
  icon="✓"
  size="lg">
  Complete Purchase
</button>
<button
  variant="danger"
  size="sm"
  icon="🗑️">
  Delete Item
</button>
<button
  variant="success"
  size="lg"
  icon="✓"
  icon-position="right">
  Confirm Order
</button>
</wb-container>
</wb-demo>

**Button Group Example:**

<wb-demo>
<wb-row gap="0.5rem">
  <button variant="outline">Cancel</button>
  <button variant="primary">Save Draft</button>
  <button variant="success">Publish</button>
</wb-row>
</wb-demo>

---

### input
**Module:** `semantics/input.js`  
**Element:** `<input>`

**What it adds:**
- Wrapper div: `wb-input`
- Class on input: `wb-input__field`
- Styles: border, border-radius, background, color, padding
- Sizes: xs, sm, md, lg, xl
- Variants: success (green border), error (red border)
- Prefix/suffix text support
- Clearable button (×)

**Data attributes:**
- `variant` - success or error
- `size` - xs, sm, md, lg, xl
- `clearable` - Add clear button
- `prefix` - Text before input
- `suffix` - Text after input

**Examples:**

Basic inputs - auto-styled:

<wb-demo>
<wb-container>
<input
  type="text"
  placeholder="Your name">
<input
  type="email"
  placeholder="email@example.com">
<input
  type="password"
  placeholder="Password">
<input
  type="search"
  placeholder="Search...">
<input
  type="url"
  placeholder="https://...">
<input
  type="tel"
  placeholder="(555) 123-4567">
</wb-container>
</wb-demo>

All sizes:

<wb-demo>
<wb-container>
<input
  type="text"
  size="xs"
  placeholder="Extra small">
<input
  type="text"
  size="sm"
  placeholder="Small">
<input
  type="text"
  size="md"
  placeholder="Medium (default)">
<input
  type="text"
  size="lg"
  placeholder="Large">
<input
  type="text"
  size="xl"
  placeholder="Extra large">
</wb-container>
</wb-demo>

Validation states:

<wb-demo>
<wb-container>
<input
  type="email"
  variant="success"
  value="valid@email.com">
<input
  type="email"
  variant="error"
  value="invalid-email">
</wb-container>
</wb-demo>

With prefix/suffix:

<wb-demo>
<wb-container>
<input
  type="text"
  prefix="$"
  placeholder="0.00">
<input
  type="text"
  suffix=".00"
  placeholder="Price">
<input
  type="text"
  prefix="https://"
  placeholder="website.com">
<input
  type="text"
  prefix="@"
  placeholder="username">
<input
  type="text"
  suffix="kg"
  placeholder="Weight">
<input
  type="text"
  prefix="$"
  suffix="USD"
  placeholder="Amount">
</wb-container>
</wb-demo>

Clearable:

<wb-demo>
<wb-container>
<input
  type="text"
  clearable
  placeholder="Type and clear...">
<input
  type="search"
  clearable
  placeholder="Search...">
<input
  type="email"
  clearable
  variant="error"
  placeholder="Fix this email">
</wb-container>
</wb-demo>

Combined (size + prefix + clearable together):

<wb-demo>
<wb-container>
<input
  type="text"
  size="lg"
  prefix="🔍"
  clearable
  placeholder="Search products...">
<input
  type="number"
  prefix="$"
  suffix="/month"
  size="lg"
  placeholder="99">
</wb-container>
</wb-demo>

**Form Field Examples:**

Login form:

<wb-demo>
<form>
  <label>Email
    <input
      type="email"
      placeholder="you@company.com"
      clearable>
  </label>
  <label>Password
    <input
      type="password"
      placeholder="••••••••"
      size="lg">
  </label>
  <button
    variant="primary"
    size="lg">
    Sign In
  </button>
</form>
</wb-demo>

Price input:

<wb-demo>
<label>Product Price
  <input
    type="number"
    prefix="$"
    suffix=".00"
    placeholder="99"
    size="lg">
</label>
</wb-demo>

Search with icon:

<wb-demo>
<input
  type="search"
  prefix="🔍"
  clearable
  size="lg"
  placeholder="Search documentation...">
</wb-demo>

---

### details
**Module:** `semantics/details.js`  
**Element:** `<details>`

**What it adds:**
- Class: `wb-details`
- Styles: border, border-radius, overflow, background
- Summary styling: flex layout, padding, background, cursor
- Custom toggle icon (▼) with rotation animation
- `toggle` event dispatches `wb:details:toggle` custom event
- Programmatic API: `element.wbDetails.toggle()`, `.open()`, `.close()`, `.isOpen`

**Data attributes:**
- `open` - Start expanded
- `animated` - Enable/disable animation (default: true)

**Native behavior preserved:** Open/close toggle, summary click, keyboard access, Escape key

**Examples:**

Basic collapsible:

<wb-demo>
<details>
  <summary>What is WB Behaviors?</summary>
  <p>WB Behaviors is a behavior-based UI library that enhances semantic HTML.</p>
</details>
</wb-demo>

Starts open:

<wb-demo>
<details open>
  <summary>Important Notice</summary>
  <p>This section is expanded by default so users see it immediately.</p>
</details>
</wb-demo>

FAQ section:

<wb-demo>
<wb-container>
<details>
  <summary>How do I install WB Behaviors?</summary>
  <p>Run <code>npm install wb-starter</code> in your project directory.</p>
</details>
<details>
  <summary>Does it work with React?</summary>
  <p>Yes! WB behaviors can be applied to any HTML element, including those rendered by React.</p>
</details>
<details>
  <summary>Is it accessible?</summary>
  <p>Absolutely. WB uses native HTML elements and adds ARIA attributes where needed.</p>
</details>
</wb-container>
</wb-demo>

Nested details:

<wb-demo>
<details>
  <summary>Product Categories</summary>
  <details>
    <summary>Electronics</summary>
    <ul>
      <li>Phones</li>
      <li>Laptops</li>
      <li>Tablets</li>
    </ul>
  </details>
  <details>
    <summary>Clothing</summary>
    <ul>
      <li>Shirts</li>
      <li>Pants</li>
      <li>Shoes</li>
    </ul>
  </details>
</details>
</wb-demo>

With rich content:

<wb-demo>
<details>
  <summary>View Code Example</summary>
  <pre><code>
function greet(name) {
  return `Hello, ${name}!`;
}
  </code></pre>
</details>
</wb-demo>

Settings panel:

<wb-demo>
<details>
  <summary>Advanced Settings</summary>
  <label>
    <input type="checkbox"> Enable notifications
  </label>
  <label>
    <input type="checkbox"> Dark mode
  </label>
  <label> Theme <select>
      <option>Default</option>
      <option>Ocean</option>
      <option>Forest</option>
    </select>
  </label>
</details>
</wb-demo>

**Accordion Pattern (multiple details):**

<wb-demo>
<wb-stack class="accordion" gap="0.5rem">
  <details open>
    <summary>Step 1: Create Account</summary>
    <p>Fill out the registration form with your email and password.</p>
  </details>
  <details>
    <summary>Step 2: Verify Email</summary>
    <p>Check your inbox and click the verification link.</p>
  </details>
  <details>
    <summary>Step 3: Complete Profile</summary>
    <p>Add your name, photo, and preferences.</p>
  </details>
</wb-stack>
</wb-demo>

---

### dialog
**Module:** `semantics/dialog.js`  
**Element:** `<dialog>`

**What it adds:**
- Class: `wb-dialog`
- Backdrop styling
- Close button styling
- Open/close animations
- Custom events

**Native behavior preserved:** `showModal()`, `close()`, `form[method=dialog]`, focus trap, Escape key

**Examples:**

The `dialog` behavior only decorates a **real, already-open** `<dialog open>` in
place (see the Auto-Injection demo above) — it does not wire up a show/hide
trigger. For a self-contained trigger button that builds and opens a dialog on
click with no JavaScript, use the `<wb-modal>` custom tag (`semantics/dialog.js`,
exported as `modal`): `modal-title`/`modal-content` attributes supply the
dialog's contents, and the element's own text becomes the trigger label. Every
`<wb-modal>` dialog gets the same auto-generated Cancel/OK footer.

Basic modal:

<wb-demo>
<wb-modal
  modal-title="Welcome!"
  modal-content="<p>Thanks for visiting our site.</p>">
  Show Welcome
</wb-modal>
</wb-demo>

Confirmation dialog:

<wb-demo>
<wb-modal
  modal-title="Delete Item?"
  modal-content="<p>This action cannot be undone. Are you sure?</p>">
  🗑️ Delete
</wb-modal>
</wb-demo>

Form in dialog:

<wb-demo>
<wb-modal
  modal-title="Sign In"
  modal-content='<label>Email <input type="email" placeholder="you@example.com"></label><label>Password <input type="password" placeholder="••••••••"></label>'>
  Sign In
</wb-modal>
</wb-demo>

Image lightbox dialog:

<wb-demo>
<wb-modal
  modal-title="Full Size Photo"
  modal-content='<img src="https://placehold.co/1200x800/1e293b/e2e8f0?text=Full+Size+Photo" alt="Full size photo">'>
  <img
    src="https://placehold.co/200x150/1e293b/e2e8f0?text=Thumbnail"
    alt="Click to enlarge">
</wb-modal>
</wb-demo>

Terms and conditions:

<wb-demo>
<wb-modal
  modal-title="Terms of Service"
  modal-content='<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p><p>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...</p><label><input type="checkbox"> I agree to the terms and conditions</label>'>
  📜 View Terms
</wb-modal>
</wb-demo>

Settings dialog:

<wb-demo>
<wb-modal
  modal-title="Settings"
  modal-content='<fieldset><legend>Notifications</legend><label><input type="checkbox" checked> Email notifications</label><label><input type="checkbox"> Push notifications</label><label><input type="checkbox" checked> Weekly digest</label></fieldset><fieldset><legend>Privacy</legend><label><input type="checkbox"> Show online status</label><label><input type="checkbox" checked> Allow search engines</label></fieldset>'>
  ⚙️ Settings
</wb-modal>
</wb-demo>

---

### table
**Module:** `semantics/table.js`  
**Element:** `<table>`

**What it adds:**
- Class: `wb-table`
- Sortable column headers (click to sort)
- Striped rows
- Hover states
- Responsive horizontal scroll wrapper

**Data attributes:**
- `sortable` - Enable/disable sorting
- `striped` - Enable/disable striping

**Native behavior preserved:** Table structure, thead/tbody/tfoot, caption, accessibility

**Examples:**

Basic data table:

<wb-demo>
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Role</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>John Smith</td>
      <td>john@example.com</td>
      <td>Admin</td>
    </tr>
    <tr>
      <td>Jane Doe</td>
      <td>jane@example.com</td>
      <td>Editor</td>
    </tr>
    <tr>
      <td>Bob Wilson</td>
      <td>bob@example.com</td>
      <td>Viewer</td>
    </tr>
  </tbody>
</table>
</wb-demo>

With caption:

<wb-demo>
<table>
  <caption>Q4 2025 Sales Report</caption>
  <thead>
    <tr>
      <th>Product</th>
      <th>Units Sold</th>
      <th>Revenue</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Widget A</td>
      <td>1,234</td>
      <td>$12,340</td>
    </tr>
    <tr>
      <td>Widget B</td>
      <td>567</td>
      <td>$8,505</td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <th>Total</th>
      <td>1,801</td>
      <td>$20,845</td>
    </tr>
  </tfoot>
</table>
</wb-demo>

Pricing table:

<wb-demo>
<table>
  <thead>
    <tr>
      <th>Feature</th>
      <th>Free</th>
      <th>Pro</th>
      <th>Enterprise</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Users</td>
      <td>1</td>
      <td>10</td>
      <td>Unlimited</td>
    </tr>
    <tr>
      <td>Storage</td>
      <td>1 GB</td>
      <td>100 GB</td>
      <td>Unlimited</td>
    </tr>
    <tr>
      <td>Support</td>
      <td>Community</td>
      <td>Email</td>
      <td>24/7 Phone</td>
    </tr>
    <tr>
      <td>Price</td>
      <td>$0/mo</td>
      <td>$29/mo</td>
      <td>Contact Us</td>
    </tr>
  </tbody>
</table>
</wb-demo>

Schedule/calendar table:

<wb-demo>
<table>
  <thead>
    <tr>
      <th>Time</th>
      <th>Monday</th>
      <th>Tuesday</th>
      <th>Wednesday</th>
      <th>Thursday</th>
      <th>Friday</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>9:00</td>
      <td>Standup</td>
      <td>Standup</td>
      <td>Standup</td>
      <td>Standup</td>
      <td>Standup</td>
    </tr>
    <tr>
      <td>10:00</td>
      <td>Dev Work</td>
      <td>Dev Work</td>
      <td>Planning</td>
      <td>Dev Work</td>
      <td>Demo</td>
    </tr>
    <tr>
      <td>14:00</td>
      <td>Code Review</td>
      <td>1:1s</td>
      <td>Dev Work</td>
      <td>Code Review</td>
      <td>Retro</td>
    </tr>
  </tbody>
</table>
</wb-demo>

Status table with badges:

<wb-demo>
<table>
  <thead>
    <tr>
      <th>Task</th>
      <th>Assignee</th>
      <th>Status</th>
      <th>Due Date</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Design homepage</td>
      <td>Alice</td>
      <td>
        <span
          x-badge
          variant="success">
          Complete
        </span>
      </td>
      <td>Jan 15</td>
    </tr>
    <tr>
      <td>Build API</td>
      <td>Bob</td>
      <td>
        <span
          x-badge
          variant="warning">
          In Progress
        </span>
      </td>
      <td>Jan 20</td>
    </tr>
    <tr>
      <td>Write docs</td>
      <td>Carol</td>
      <td>
        <span
          x-badge
          variant="secondary">
          Pending
        </span>
      </td>
      <td>Jan 25</td>
    </tr>
  </tbody>
</table>
</wb-demo>

---

### form
**Module:** `enhancements.js`  
**Element:** `<form>`

**What it adds:**
- Class: `wb-form`
- Validation UI
- Loading states
- Error display styling

**Native behavior preserved:** Submit, reset, FormData, constraint validation API

**Examples:**

Contact form:

<wb-demo>
<form
  action="/contact"
  method="post">
  <label> Name
    <input
      type="text"
      name="name"
      required
      placeholder="Your full name">
  </label>
  <label> Email
    <input
      type="email"
      name="email"
      required
      placeholder="you@example.com">
  </label>
  <label> Subject <select
      name="subject"
      required>
      <option value="">Choose a topic...</option>
      <option value="sales">Sales inquiry</option>
      <option value="support">Technical support</option>
      <option value="feedback">Feedback</option>
    </select>
  </label>
  <label> Message
    <textarea
      name="message"
      required
      placeholder="How can we help?"
      rows="5">
    </textarea>
  </label>
  <button
    type="submit"
    variant="primary">
    Send Message
  </button>
</form>
</wb-demo>

Registration form:

<wb-demo>
<form
  action="/register"
  method="post">
  <fieldset>
    <legend>Account Information</legend>
    <label> Username
      <input
        type="text"
        name="username"
        required
        minlength="3"
        maxlength="20"
        pattern="[a-zA-Z0-9_]+"
        placeholder="Choose a username">
    </label>
    <label> Email
      <input
        type="email"
        name="email"
        required
        placeholder="you@example.com">
    </label>
    <label> Password
      <input
        type="password"
        name="password"
        required
        minlength="8"
        placeholder="At least 8 characters">
    </label>
    <label> Confirm Password
      <input
        type="password"
        name="confirm"
        required
        placeholder="Repeat password">
    </label>
  </fieldset>
  <fieldset>
    <legend>Profile</legend>
    <label> Full Name
      <input
        type="text"
        name="fullname"
        placeholder="Optional">
    </label>
    <label> Bio
      <textarea
        name="bio"
        placeholder="Tell us about yourself..."
        rows="3">
      </textarea>
    </label>
  </fieldset>
  <label>
    <input
      type="checkbox"
      name="terms"
      required>
      I agree to the <a href="/terms">Terms of Service
    </a>
  </label>
  <label>
    <input
      type="checkbox"
      name="newsletter">
      Subscribe to newsletter
  </label>
  <button
    type="submit"
    variant="success"
    size="lg">
    Create Account
  </button>
</form>
</wb-demo>

Payment form:

<wb-demo>
<form
  action="/checkout"
  method="post">
  <fieldset>
    <legend>Payment Details</legend>
    <label> Card Number
      <input
        type="text"
        name="card"
        required
        pattern="[0-9]{16}"
        placeholder="1234 5678 9012 3456"
        prefix="💳">
    </label>
    <wb-grid
      columns="2"
      gap="1rem">
      <label> Expiry
        <input
          type="text"
          name="expiry"
          required
          pattern="[0-9]{2}/[0-9]{2}"
          placeholder="MM/YY">
      </label>
      <label> CVV
        <input
          type="text"
          name="cvv"
          required
          pattern="[0-9]{3,4}"
          placeholder="123">
      </label>
    </wb-grid>
  </fieldset>
  <button
    type="submit"
    variant="success"
    size="lg"
    icon="🔒">
    Pay $99.00
  </button>
</form>
</wb-demo>

Search form:

<wb-demo>
<form
  action="/search"
  method="get">
  <wb-row gap="0.5rem">
    <input
      type="search"
      name="q"
      placeholder="Search..."
      clearable
      size="lg">
    <button
      type="submit"
      variant="primary"
      size="lg"
      icon="🔍">
      Search
    </button>
  </wb-row>
</form>
</wb-demo>

Filter form:

<wb-demo>
<form>
  <fieldset>
    <legend>Price Range</legend>
    <label>
      <input
        type="radio"
        name="price"
        value="0-50">
        $0 - $50
    </label>
    <label>
      <input
        type="radio"
        name="price"
        value="50-100">
        $50 - $100
    </label>
    <label>
      <input
        type="radio"
        name="price"
        value="100+">
        $100+
    </label>
  </fieldset>
  <fieldset>
    <legend>Categories</legend>
    <label>
      <input
        type="checkbox"
        name="cat"
        value="electronics">
        Electronics
    </label>
    <label>
      <input
        type="checkbox"
        name="cat"
        value="clothing">
        Clothing
    </label>
    <label>
      <input
        type="checkbox"
        name="cat"
        value="home">
        Home & Garden
    </label>
  </fieldset>
  <fieldset>
    <legend>Rating</legend>
    <label>
      <input
        type="checkbox"
        name="rating"
        value="4">
        4+ Stars
    </label>
    <label>
      <input
        type="checkbox"
        name="rating"
        value="3">
        3+ Stars
    </label>
  </fieldset>
  <button
    type="submit"
    variant="primary">
    Apply Filters
  </button>
  <button
    type="reset"
    variant="ghost">
    Clear All
  </button>
</form>
</wb-demo>

---

### select
**Module:** `semantics/select.js`  
**Element:** `<select>`

**What it adds:**
- Class: `wb-select`
- Custom dropdown styling
- Focus states

**Native behavior preserved:** Option selection, form data, optgroup, multiple

**Examples:**

Basic select:

<wb-demo>
<select>
  <option value="">Choose an option...</option>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
  <option value="3">Option 3</option>
</select>
</wb-demo>

With optgroups:

<wb-demo>
<select>
  <option value="">Select a car...</option>
  <optgroup label="Swedish Cars">
    <option value="volvo">Volvo</option>
    <option value="saab">Saab</option>
  </optgroup>
  <optgroup label="German Cars">
    <option value="mercedes">Mercedes</option>
    <option value="audi">Audi</option>
    <option value="bmw">BMW</option>
  </optgroup>
</select>
</wb-demo>

Country selector:

<wb-demo>
<select name="country">
  <option value="">Select country...</option>
  <option value="us">🇺🇸 United States</option>
  <option value="uk">🇬🇧 United Kingdom</option>
  <option value="ca">🇨🇦 Canada</option>
  <option value="au">🇦🇺 Australia</option>
  <option value="de">🇩🇪 Germany</option>
  <option value="fr">🇫🇷 France</option>
  <option value="jp">🇯🇵 Japan</option>
</select>
</wb-demo>

Multiple selection:

<wb-demo>
<select
  multiple
  size="5">
  <option value="html">HTML</option>
  <option value="css">CSS</option>
  <option value="js">JavaScript</option>
  <option value="ts">TypeScript</option>
  <option value="react">React</option>
  <option value="vue">Vue</option>
  <option value="angular">Angular</option>
</select>
</wb-demo>

With disabled options:

<wb-demo>
<select>
  <option value="">Choose a plan...</option>
  <option value="free">Free - $0/mo</option>
  <option value="pro">Pro - $29/mo</option>
  <option
    value="enterprise"
    disabled>
    Enterprise - Contact Us
  </option>
</select>
</wb-demo>

Date selectors:

<wb-demo>
<wb-row gap="0.5rem">
  <select name="month">
    <option value="">Month</option>
    <option value="1">January</option>
    <option value="2">February</option>
    <option value="3">March</option>
  </select>
  <select name="day">
    <option value="">Day</option>
    <option value="1">1</option>
    <option value="2">2</option>
  </select>
  <select name="year">
    <option value="">Year</option>
    <option value="2026">2026</option>
    <option value="2025">2025</option>
    <option value="2024">2024</option>
  </select>
</wb-row>
</wb-demo>

---

### textarea
**Module:** `semantics/textarea.js`  
**Element:** `<textarea>`

**What it adds:**
- Class: `wb-textarea`
- Auto-resize on input
- Character counter (optional)
- Focus styling

**Native behavior preserved:** Multi-line input, form data, rows/cols

**Examples:**

Basic textarea:

<wb-demo>
<textarea placeholder="Enter your message..."></textarea>
</wb-demo>

With character limit:

<wb-demo>
<textarea
  maxlength="500"
  counter
  placeholder="Write your bio (max 500 characters)...">
</textarea>
</wb-demo>

Different sizes:

<wb-demo>
<wb-container>
<textarea
  rows="3"
  placeholder="Short message...">
</textarea>
<textarea
  rows="10"
  placeholder="Long description...">
</textarea>
</wb-container>
</wb-demo>

Code input:

<wb-demo>
<textarea
  rows="15"
  style="font-family: monospace;"
  placeholder="// Paste your code here...">
</textarea>
</wb-demo>

Various use cases:

<wb-demo>
<wb-container>
<label> Product Description
  <textarea
    rows="5"
    placeholder="Describe your product in detail..."
    maxlength="1000"
    counter>
  </textarea>
</label>
<label> Cover Letter
  <textarea
    rows="10"
    placeholder="Dear Hiring Manager...">
  </textarea>
</label>
<label> Bug Report
  <textarea
    rows="8"
    placeholder="Please describe the issue:
- What happened?
- What did you expect?
- Steps to reproduce...">
  </textarea>
</label>
<label> JSON Configuration
  <textarea
    rows="12"
    style="font-family: monospace;"
    placeholder='{
  "name": "my-config",
  "version": "1.0.0"
}'>
  </textarea>
</label>
</wb-container>
</wb-demo>

---

### checkbox
**Module:** `semantics/checkbox.js`  
**Element:** `<input type="checkbox">`

**What it adds:**
- Class: `wb-checkbox`
- Custom visual styling
- Animated checkmark

**Native behavior preserved:** Checked state, form data, label association

**Examples:**

Single checkbox:

<wb-demo>
<label>
  <input
    type="checkbox"
    name="subscribe">
    Subscribe to newsletter
</label>
</wb-demo>

Terms agreement:

<wb-demo>
<label>
  <input
    type="checkbox"
    name="terms"
    required>
    I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy
  </a>
</label>
</wb-demo>

Checkbox group:

<wb-demo>
<fieldset>
  <legend>Select your interests:</legend>
  <label>
    <input
      type="checkbox"
      name="interests"
      value="tech">
      Technology
  </label>
  <label>
    <input
      type="checkbox"
      name="interests"
      value="sports">
      Sports
  </label>
  <label>
    <input
      type="checkbox"
      name="interests"
      value="music">
      Music
  </label>
  <label>
    <input
      type="checkbox"
      name="interests"
      value="travel">
      Travel
  </label>
  <label>
    <input
      type="checkbox"
      name="interests"
      value="food">
      Food & Cooking
  </label>
</fieldset>
</wb-demo>

Settings toggles:

<wb-demo>
<fieldset>
  <legend>Notification Settings</legend>
  <label>
    <input
      type="checkbox"
      name="email_notif"
      checked>
      Email notifications
  </label>
  <label>
    <input
      type="checkbox"
      name="push_notif">
      Push notifications
  </label>
  <label>
    <input
      type="checkbox"
      name="sms_notif">
      SMS alerts
  </label>
  <label>
    <input
      type="checkbox"
      name="weekly"
      checked>
      Weekly digest
  </label>
</fieldset>
</wb-demo>

Feature selection:

<wb-demo>
<fieldset>
  <legend>Select Features</legend>
  <label>
    <input
      type="checkbox"
      name="features"
      value="analytics"
      checked>
      📊 Analytics Dashboard
  </label>
  <label>
    <input
      type="checkbox"
      name="features"
      value="api">
      🔌 API Access
  </label>
  <label>
    <input
      type="checkbox"
      name="features"
      value="support">
      💬 Priority Support
  </label>
  <label>
    <input
      type="checkbox"
      name="features"
      value="export">
      📤 Data Export
  </label>
</fieldset>
</wb-demo>

Select-all pattern (the `toggleAll()`/indeterminate wiring is application JavaScript,
not something the doc-viewer's sanitized renderer executes — the markup below
shows the structural pattern; wiring `checkbox.indeterminate = true` is a
one-line JS API left to your own code):

<wb-demo>
<label>
  <input
    type="checkbox"
    id="selectAll">
  <strong>Select All</strong>
</label>
<wb-stack gap="0.25rem">
  <label>
    <input
      type="checkbox"
      class="item">
      Item 1
  </label>
  <label>
    <input
      type="checkbox"
      class="item">
      Item 2
  </label>
  <label>
    <input
      type="checkbox"
      class="item">
      Item 3
  </label>
</wb-stack>
</wb-demo>

---

### radio
**Module:** `semantics/radio.js`  
**Element:** `<input type="radio">`

**What it adds:**
- Class: `wb-radio`
- Custom visual styling
- Animated selection dot

**Native behavior preserved:** Radio group behavior, checked state, form data

**Examples:**

Each `<fieldset>` below is one grouped set of radios sharing a `name` — the whole
group is the unit (one `<wb-demo>` per group, not one per `<input>`).

Basic radio group:

<wb-demo>
<fieldset>
  <legend>Choose a size:</legend>
  <label>
    <input
      type="radio"
      name="size"
      value="s">
      Small
  </label>
  <label>
    <input
      type="radio"
      name="size"
      value="m"
      checked>
      Medium
  </label>
  <label>
    <input
      type="radio"
      name="size"
      value="l">
      Large
  </label>
  <label>
    <input
      type="radio"
      name="size"
      value="xl">
      Extra Large
  </label>
</fieldset>
</wb-demo>

Payment method:

<wb-demo>
<fieldset>
  <legend>Payment Method</legend>
  <label>
    <input
      type="radio"
      name="payment"
      value="card"
      checked>
      💳 Credit/Debit Card
  </label>
  <label>
    <input
      type="radio"
      name="payment"
      value="paypal">
      🅿️ PayPal
  </label>
  <label>
    <input
      type="radio"
      name="payment"
      value="bank">
      🏦 Bank Transfer
  </label>
  <label>
    <input
      type="radio"
      name="payment"
      value="crypto">
      ₿ Cryptocurrency
  </label>
</fieldset>
</wb-demo>

Shipping options:

<wb-demo>
<fieldset>
  <legend>Shipping Speed</legend>
  <label>
    <input
      type="radio"
      name="shipping"
      value="standard">
      📦 Standard (5-7 days) - Free
  </label>
  <label>
    <input
      type="radio"
      name="shipping"
      value="express">
      🚚 Express (2-3 days) - $9.99
  </label>
  <label>
    <input
      type="radio"
      name="shipping"
      value="overnight">
      ✈️ Overnight - $24.99
  </label>
</fieldset>
</wb-demo>

Rating scale:

<wb-demo>
<fieldset>
  <legend>How satisfied are you?</legend>
  <label>
    <input
      type="radio"
      name="satisfaction"
      value="1">
      1 - Very Dissatisfied
  </label>
  <label>
    <input
      type="radio"
      name="satisfaction"
      value="2">
      2 - Dissatisfied
  </label>
  <label>
    <input
      type="radio"
      name="satisfaction"
      value="3">
      3 - Neutral
  </label>
  <label>
    <input
      type="radio"
      name="satisfaction"
      value="4">
      4 - Satisfied
  </label>
  <label>
    <input
      type="radio"
      name="satisfaction"
      value="5">
      5 - Very Satisfied
  </label>
</fieldset>
</wb-demo>

Pricing plans:

<wb-demo>
<fieldset>
  <legend>Choose Your Plan</legend>
  <label style="display: block; padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 0.5rem;">
    <input
      type="radio"
      name="plan"
      value="free">
    <strong>Free</strong> - $0/month
    <br>
    <small>Basic features for individuals</small>
  </label>
  <label style="display: block; padding: 1rem; border: 2px solid var(--primary); border-radius: 8px; margin-bottom: 0.5rem;">
    <input
      type="radio"
      name="plan"
      value="pro"
      checked>
    <strong>Pro</strong> - $29/month ⭐ Popular
    <br>
    <small>Advanced features for professionals</small>
  </label>
  <label style="display: block; padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px;">
    <input
      type="radio"
      name="plan"
      value="team">
    <strong>Team</strong> - $99/month
    <br>
    <small>Collaboration features for teams</small>
  </label>
</fieldset>
</wb-demo>

Yes/No questions:

<wb-demo>
<fieldset>
  <legend>Do you have prior experience?</legend>
  <label>
    <input
      type="radio"
      name="experience"
      value="yes">
      Yes
  </label>
  <label>
    <input
      type="radio"
      name="experience"
      value="no">
      No
  </label>
</fieldset>
</wb-demo>

Frequency selection:

<wb-demo>
<fieldset>
  <legend>How often do you exercise?</legend>
  <label>
    <input
      type="radio"
      name="exercise"
      value="daily">
      Daily
  </label>
  <label>
    <input
      type="radio"
      name="exercise"
      value="weekly">
      A few times a week
  </label>
  <label>
    <input
      type="radio"
      name="exercise"
      value="monthly">
      A few times a month
  </label>
  <label>
    <input
      type="radio"
      name="exercise"
      value="rarely">
      Rarely
  </label>
  <label>
    <input
      type="radio"
      name="exercise"
      value="never">
      Never
  </label>
</fieldset>
</wb-demo>

---

### range
**Module:** `semantics/range.js`  
**Element:** `<input type="range">`

**What it adds:**
- Class: `wb-range`
- Custom track styling
- Custom thumb styling
- Value tooltip on hover

**Native behavior preserved:** Min/max/step, value binding

**Examples:**

The doc-viewer's sanitized renderer strips inline event-handler attributes
(`oninput`, etc. — see the button/checkbox sections above), so the `<output>`
value below shows its initial value only and does not live-update on drag;
wiring `input.addEventListener('input', ...)` is one line of your own JS.

Basic range:

<wb-demo>
<label> Volume
  <input
    type="range"
    min="0"
    max="100"
    value="50">
</label>
</wb-demo>

With output display:

<wb-demo>
<label> Brightness: <output id="brightnessValue">75</output>%
  <input
    type="range"
    min="0"
    max="100"
    value="75">
</label>
</wb-demo>

Price range:

<wb-demo>
<label> Max Price: $<output id="priceValue">500</output>
  <input
    type="range"
    min="0"
    max="1000"
    step="50"
    value="500">
</label>
</wb-demo>

Rating slider:

<wb-demo>
<label> Rating: <output id="ratingValue">3</output> / 5
  <input
    type="range"
    min="1"
    max="5"
    step="1"
    value="3">
</label>
</wb-demo>

Temperature control:

<wb-demo>
<label> Temperature: <output id="tempValue">72</output>°F
  <input
    type="range"
    min="60"
    max="85"
    value="72">
</label>
</wb-demo>

Opacity slider:

<wb-demo>
<label> Opacity: <output id="opacityValue">100</output>%
  <input
    type="range"
    min="0"
    max="100"
    value="100">
</label>
</wb-demo>

Zoom control:

<wb-demo>
<label style="display: flex; align-items: center; gap: 0.5rem;">
  <span>🔍-</span>
  <input
    type="range"
    min="50"
    max="200"
    value="100"
    style="flex: 1;">
  <span>🔍+</span>
</label>
</wb-demo>

Color hue picker:

<wb-demo>
<label> Hue: <output id="hueValue">180</output>°
  <input
    type="range"
    min="0"
    max="360"
    value="180"
    style="background: linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red);">
</label>
</wb-demo>

---

### progress
**Module:** `semantics/progress.js`  
**Element:** `<progress>`

**What it adds:**
- Class: `wb-progress`
- Custom bar styling
- Animated fill
- Percentage label (optional)

**Native behavior preserved:** Value/max attributes, indeterminate state

**Examples:**

Basic progress:

<wb-demo>
<progress
  value="70"
  max="100">
</progress>
</wb-demo>

Indeterminate (loading):

<wb-demo>
<progress></progress>
</wb-demo>

Various completion levels:

<wb-demo>
<wb-container>
<label>Not started: <progress
    value="0"
    max="100">
  </progress>
</label>
<label>25% Complete: <progress
    value="25"
    max="100">
  </progress>
</label>
<label>50% Complete: <progress
    value="50"
    max="100">
  </progress>
</label>
<label>75% Complete: <progress
    value="75"
    max="100">
  </progress>
</label>
<label>Complete: <progress
    value="100"
    max="100">
  </progress>
</label>
</wb-container>
</wb-demo>

File upload progress:

<wb-demo>
<div>
  <p>Uploading document.pdf...</p>
  <progress
    value="45"
    max="100">
  </progress>
  <span>45%</span>
</div>
</wb-demo>

Download progress:

<wb-demo>
<div>
  <p>Downloading update (125 MB / 500 MB)</p>
  <progress
    value="125"
    max="500">
  </progress>
</div>
</wb-demo>

Step progress:

<wb-demo>
<div>
  <p>Step 2 of 4</p>
  <progress
    value="2"
    max="4">
  </progress>
</div>
</wb-demo>

Course progress:

<wb-demo>
<div>
  <h3>JavaScript Fundamentals</h3>
  <p>12 of 20 lessons completed</p>
  <progress
    value="12"
    max="20">
  </progress>
</div>
</wb-demo>

Multiple progress bars (dashboard):

<wb-demo>
<wb-container>
  <label>Storage Used (7.5 GB / 10 GB) <progress
      value="75"
      max="100">
    </progress>
  </label>
  <label>Bandwidth Used (45 GB / 100 GB) <progress
      value="45"
      max="100">
    </progress>
  </label>
  <label>API Calls (8,500 / 10,000) <progress
      value="85"
      max="100">
    </progress>
  </label>
</wb-container>
</wb-demo>

---

### code
**Module:** `semantics/code.js`  
**Element:** `<code>`

**What it adds:**
- Class: `wb-code`
- Inline code styling
- Monospace font
- Background color
- Border radius

**Examples:**

Inline code in text:

<wb-demo>
<wb-container>
<p>Use the <code>console.log()</code> function to debug your code.</p>
<p>The <code>Array.map()</code> method creates a new array.</p>
<p>Set <code>display: flex</code> on the container.</p>
<p>Run <code>npm install</code> to install dependencies.</p>
<p>The <code>async/await</code> syntax makes asynchronous code easier to read.</p>
</wb-container>
</wb-demo>

Variable names:

<wb-demo>
<p>Store the result in <code>userData</code> variable.</p>
</wb-demo>

File paths:

<wb-demo>
<p>Configuration is in <code>/config/site.json</code>.</p>
</wb-demo>

Commands:

<wb-demo>
<p>Press <code>Ctrl+C</code> to copy.</p>
</wb-demo>

Multiple inline codes:

<wb-demo>
<wb-container>
<p>Compare <code>==</code> (loose equality) vs <code>===</code> (strict equality).</p>
<p>Use <code>let</code> for variables that change, <code>const</code> for constants.</p>
</wb-container>
</wb-demo>

---

### pre
**Module:** `semantics/pre.js`  
**Element:** `<pre>`

**What it adds:**
- Class: `wb-pre`
- Copy button
- Line numbers (optional)
- Syntax highlighting (optional)
- Styled scrollbar

**Data attributes:**
- `language` - Syntax highlighting language
- `line-numbers` - Show line numbers

**Examples:**

Basic code block:

<wb-demo>
<pre>
function greet(name) {
  return `Hello, ${name}!`;
}
</pre>
</wb-demo>

With line numbers:

<wb-demo>
<pre line-numbers>
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000);
</pre>
</wb-demo>

JavaScript example:

<wb-demo>
<pre language="javascript">
// Fetch data from API
async function fetchUsers() {
  const response = await fetch('/api/users');
  const users = await response.json();
  return users;
}
</pre>
</wb-demo>

HTML example:

<wb-demo>
<pre language="html">
&lt;article&gt;
  &lt;header&gt;
    &lt;h3&gt;Card Title&lt;/h3&gt;
  &lt;/header&gt;
  &lt;main&gt;
    &lt;p&gt;Card content goes here.&lt;/p&gt;
  &lt;/main&gt;
&lt;/article&gt;
</pre>
</wb-demo>

CSS example:

<wb-demo>
<pre language="css">
.card {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  background: var(--bg-secondary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}
</pre>
</wb-demo>

JSON example:

<wb-demo>
<pre language="json">
{
  "name": "wb-starter",
  "version": "2.1.0",
  "description": "Web Behaviors Starter Kit",
  "dependencies": {
    "express": "^4.18.0"
  }
}
</pre>
</wb-demo>

Shell commands:

<wb-demo>
<pre language="bash">
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
</pre>
</wb-demo>

Terminal output:

<wb-demo>
<pre>
$ npm test

  ✓ button behavior applies correctly
  ✓ card behavior adds hover effects
  ✓ form validates required fields

  3 passing (42ms)
</pre>
</wb-demo>

---

## Morphing Behaviors (Different Name)

These behaviors transform the element into a component.

---

### article → card
**Module:** `card.js`  
**Element:** `<article>` morphs into card component

**What it adds:**
- Class: `wb-card`
- Styles: flex column, border, border-radius (8px), background, box-shadow, overflow hidden
- Hover effects: translateY(-2px), increased box-shadow, border color change
- Styles existing `<header>`, `<main>`, `<footer>` children with card structure
- Clickable mode with role="button" and tabindex
- Elevated shadow option
- Variants: default, glass, rack

**Data attributes:**
- `title` - Card title
- `subtitle` - Card subtitle
- `content` - Card body content
- `footer` - Footer text
- `variant` - glass, rack
- `clickable` - Make entire card clickable
- `hoverable` - Enable hover effects (default: true)
- `elevated` - Add elevated shadow

**Examples:**

Basic semantic card:

<wb-demo>
<article>
  <header>
    <h3>Getting Started</h3>
  </header>
  <main>
    <p>Learn the basics of WB Behaviors in just 5 minutes.</p>
  </main>
  <footer>
    <a href="/docs/start">Read more →</a>
  </footer>
</article>
</wb-demo>

Card with image:

<wb-demo>
<article>
  <figure>
    <img
      src="https://placehold.co/400x300/1f2937/f3f4f6?text=Premium+Widget"
      alt="Product photo">
  </figure>
  <header>
    <h3>Premium Widget</h3>
    <p>$99.99</p>
  </header>
  <main>
    <p>Our best-selling widget with advanced features.</p>
  </main>
  <footer>
    <button variant="primary">Add to Cart</button>
  </footer>
</article>
</wb-demo>

Glass variant:

<wb-demo>
<article variant="glass">
  <header>
    <h3>Glassmorphism Card</h3>
  </header>
  <main>
    <p>Beautiful frosted glass effect with blur backdrop.</p>
  </main>
</article>
</wb-demo>

Elevated card:

<wb-demo>
<article elevated>
  <header>
    <h3>Elevated Card</h3>
  </header>
  <main>
    <p>This card has a stronger shadow for emphasis.</p>
  </main>
</article>
</wb-demo>

Clickable card:

<wb-demo>
<article clickable>
  <header>
    <h3>Click Me!</h3>
  </header>
  <main>
    <p>This entire card is clickable and interactive.</p>
  </main>
</article>
</wb-demo>

Profile card:

<wb-demo>
<article>
  <figure style="text-align: center; padding: 2rem;">
    <img
      src="https://ui-avatars.com/api/?name=Jane+Smith&size=150&background=475569&color=fff"
      alt="User avatar"
      style="width: 80px; height: 80px; border-radius: 50%;">
  </figure>
  <header style="text-align: center;">
    <h3>Jane Smith</h3>
    <p>Senior Developer</p>
  </header>
  <main>
    <p>Full-stack developer with 10+ years experience in web technologies.</p>
  </main>
  <footer style="display: flex; justify-content: center; gap: 1rem;">
    <a href="#">Twitter</a>
    <a href="#">GitHub</a>
    <a href="#">LinkedIn</a>
  </footer>
</article>
</wb-demo>

Blog post card:

<wb-demo>
<article>
  <figure>
    <img
      src="https://placehold.co/800x400/0f172a/e2e8f0?text=Blog+Hero"
      alt="Blog post hero image">
  </figure>
  <header>
    <span>Tutorial • 5 min read</span>
    <h3>Building Modern UIs with WB Behaviors</h3>
  </header>
  <main>
    <p>Learn how to create beautiful, accessible user interfaces using semantic HTML and behavior-based styling.</p>
  </main>
  <footer>
    <time datetime="2026-01-02">January 2, 2026</time>
    <span>By John Doe</span>
  </footer>
</article>
</wb-demo>

Pricing card:

<wb-demo>
<article
  variant="glass"
  elevated>
  <header style="text-align: center;">
    <h3>Pro Plan</h3>
    <p style="font-size: 2.5rem; font-weight: bold;">$29<small>/mo</small>
    </p>
  </header>
  <main>
    <ul>
      <li>✓ Unlimited projects</li>
      <li>✓ Priority support</li>
      <li>✓ Advanced analytics</li>
      <li>✓ Custom integrations</li>
    </ul>
  </main>
  <footer>
    <button
      variant="primary"
      size="lg"
      style="width: 100%;">
      Get Started
    </button>
  </footer>
</article>
</wb-demo>

Feature card:

<wb-demo>
<article>
  <header>
    <span style="font-size: 2rem;">🚀</span>
    <h3>Lightning Fast</h3>
  </header>
  <main>
    <p>Optimized for performance with lazy loading and minimal JavaScript overhead.</p>
  </main>
</article>
</wb-demo>

Notification/Alert card:

<wb-demo>
<article style="border-left: 4px solid var(--success);">
  <header>
    <h3>✓ Payment Successful</h3>
  </header>
  <main>
    <p>Your order #12345 has been confirmed. You will receive an email shortly.</p>
  </main>
  <footer>
    <a href="/orders/12345">View Order Details</a>
  </footer>
</article>
</wb-demo>

Stat card:

<wb-demo>
<article>
  <main style="text-align: center; padding: 2rem;">
    <p style="font-size: 3rem; font-weight: bold; margin: 0;">2,847</p>
    <p style="color: var(--text-secondary); margin: 0;">Active Users</p>
    <p style="color: var(--success); font-size: 0.875rem;">↑ 12% from last month</p>
  </main>
</article>
</wb-demo>

**Card Grid Example:**

<wb-demo>
<wb-grid min-width="250px" gap="1.5rem">
  <article>
    <header>
      <h3>Card 1</h3>
    </header>
    <main>
      <p>First card content.</p>
    </main>
  </article>
  <article>
    <header>
      <h3>Card 2</h3>
    </header>
    <main>
      <p>Second card content.</p>
    </main>
  </article>
  <article>
    <header>
      <h3>Card 3</h3>
    </header>
    <main>
      <p>Third card content.</p>
    </main>
  </article>
</wb-grid>
</wb-demo>

---

### article[href] → cardlink
**Module:** `card.js`  
**Element:** `<article href="...">` morphs into clickable card

**What it adds:**
- Everything from `card` behavior
- Click handler to navigate to href
- External link indicator (↗) for target="_blank"
- Keyboard support (Enter/Space)
- role="link", tabindex="0"

**Data attributes:**
- `href` - URL to navigate to
- `target` - _self or _blank
- `icon` - Icon before title
- `description` - Description text
- `badge` - Badge text

**Examples:**

Internal link card:

<wb-demo>
<article href="/docs/getting-started">
  <header>
    <h3>📚 Documentation</h3>
  </header>
  <main>
    <p>Complete guide to using WB Behaviors.</p>
  </main>
</article>
</wb-demo>

External link card:

<wb-demo>
<article
  href="https://github.com/wb-framework"
  target="_blank">
  <header>
    <h3>🐙 GitHub Repository</h3>
  </header>
  <main>
    <p>View source code, report issues, and contribute.</p>
  </main>
</article>
</wb-demo>

Navigation cards:

<wb-demo>
<wb-grid columns="2" gap="1rem">
  <article href="/products">
    <header>
      <span style="font-size: 2rem;">🛍️</span>
      <h3>Products</h3>
    </header>
    <main>
      <p>Browse our catalog</p>
    </main>
  </article>
  <article href="/about">
    <header>
      <span style="font-size: 2rem;">ℹ️</span>
      <h3>About Us</h3>
    </header>
    <main>
      <p>Learn our story</p>
    </main>
  </article>
  <article href="/contact">
    <header>
      <span style="font-size: 2rem;">📧</span>
      <h3>Contact</h3>
    </header>
    <main>
      <p>Get in touch</p>
    </main>
  </article>
  <article href="/support">
    <header>
      <span style="font-size: 2rem;">💬</span>
      <h3>Support</h3>
    </header>
    <main>
      <p>Get help</p>
    </main>
  </article>
</wb-grid>
</wb-demo>

Resource links:

<wb-demo>
<wb-container>
<article
  href="https://docs.example.com"
  target="_blank">
  <header>
    <h3>API Documentation ↗</h3>
    <span
      x-badge
      variant="primary">
      New
    </span>
  </header>
  <main>
    <p>Complete API reference with examples and best practices.</p>
  </main>
</article>
<article
  href="https://www.youtube.com/watch?v=example"
  target="_blank">
  <figure>
    <img
      src="https://placehold.co/400x225/1e293b/e2e8f0?text=Video+Thumbnail"
      alt="Tutorial video">
  </figure>
  <header>
    <h3>Video Tutorial ↗</h3>
  </header>
  <main>
    <p>Watch our step-by-step guide on YouTube.</p>
  </main>
</article>
</wb-container>
</wb-demo>

---

### nav → navbar
**Module:** `navigation.js`  
**Element:** `<nav>` morphs into navigation bar

**What it adds:**
- Class: `wb-navbar`
- Styles: flex layout, space-between, padding, background, border-radius, gap
- Brand area styling (font-weight, no-shrink)
- Menu area styling (flex, gap, flex-wrap)
- Link styling with hover opacity transitions
- Sticky positioning option
- If `items` provided: generates content from data
- If no items: enhances existing `<ul>` and links

**Data attributes:**
- `brand` - Brand/logo text
- `items` - Comma-separated nav items
- `sticky` - Enable sticky positioning

**Examples:**

Basic semantic navbar:

<wb-demo>
<nav>
  <a
    href="/"
    style="font-weight: bold; font-size: 1.25rem;">
    MyBrand
  </a>
  <ul>
    <li>
      <a href="/">Home</a>
    </li>
    <li>
      <a href="/about">About</a>
    </li>
    <li>
      <a href="/services">Services</a>
    </li>
    <li>
      <a href="/contact">Contact</a>
    </li>
  </ul>
</nav>
</wb-demo>

With logo image:

<wb-demo>
<nav>
  <a href="/">
    <img
      src="https://placehold.co/120x32/1e293b/e2e8f0?text=Logo"
      alt="Company Logo"
      height="32">
  </a>
  <ul>
    <li>
      <a href="/products">Products</a>
    </li>
    <li>
      <a href="/pricing">Pricing</a>
    </li>
    <li>
      <a href="/docs">Docs</a>
    </li>
    <li>
      <a href="/login">Login</a>
    </li>
  </ul>
</nav>
</wb-demo>

Generated navbar (content built from `brand`/`items` attributes, no children needed):

<wb-demo>
<nav
  brand="WB Behaviors"
  items="Home, Features, Docs, Pricing, Contact">
</nav>
</wb-demo>

Sticky navbar:

<wb-demo>
<nav
  brand="MySite"
  items="Home, About, Blog, Contact"
  sticky>
</nav>
</wb-demo>

Full featured navbar:

<wb-demo>
<nav>
  <div style="display: flex; align-items: center; gap: 1rem;">
    <a
      href="/"
      style="font-weight: bold;">
      🚀 AppName
    </a>
    <span style="font-size: 0.75rem; background: var(--primary); color: white; padding: 0.125rem 0.5rem; border-radius: 4px;">Beta</span>
  </div>
  <ul>
    <li>
      <a href="/dashboard">Dashboard</a>
    </li>
    <li>
      <a href="/projects">Projects</a>
    </li>
    <li>
      <a href="/team">Team</a>
    </li>
    <li>
      <a href="/settings">Settings</a>
    </li>
  </ul>
  <div style="display: flex; align-items: center; gap: 0.5rem;">
    <button
      variant="ghost"
      size="sm">
      🔔
    </button>
    <img
      src="https://ui-avatars.com/api/?name=User&size=64&background=475569&color=fff"
      alt="Profile"
      style="width: 32px; height: 32px; border-radius: 50%;">
  </div>
</nav>
</wb-demo>

E-commerce navbar:

<wb-demo>
<nav>
  <a href="/">ShopName</a>
  <ul>
    <li>
      <a href="/new">New Arrivals</a>
    </li>
    <li>
      <a href="/women">Women</a>
    </li>
    <li>
      <a href="/men">Men</a>
    </li>
    <li>
      <a href="/sale">Sale 🔥</a>
    </li>
  </ul>
  <div style="display: flex; gap: 0.5rem;">
    <input
      type="search"
      placeholder="Search..."
      size="sm"
      style="width: 200px;">
    <button variant="ghost">❤️</button>
    <button variant="ghost">🛒 (3)</button>
  </div>
</nav>
</wb-demo>

Documentation navbar:

<wb-demo>
<nav>
  <a href="/">
    <strong>WB Docs</strong>
    <span style="opacity: 0.7; font-size: 0.875rem; margin-left: 0.5rem;">v2.1.0</span>
  </a>
  <ul>
    <li>
      <a href="/guides">Guides</a>
    </li>
    <li>
      <a href="/api">API Reference</a>
    </li>
    <li>
      <a href="/examples">Examples</a>
    </li>
    <li>
      <a href="/changelog">Changelog</a>
    </li>
  </ul>
  <div style="display: flex; gap: 0.5rem;">
    <a
      href="https://github.com/wb"
      target="_blank">
      GitHub
    </a>
    <button
      variant="primary"
      size="sm">
      Get Started
    </button>
  </div>
</nav>
</wb-demo>

---

### aside → sidebar
**Module:** `navigation.js`  
**Element:** `<aside>` morphs into sidebar

**What it adds:**
- Class: `wb-sidebar`
- Styles: flex column, gap, padding, background, border-radius, min-width
- Item styling: padding, border-radius, hover states
- Active item highlighting
- Collapsed mode (narrower width)
- Generates content from `items`

**Data attributes:**
- `items` - Comma-separated menu items
- `active` - Currently active item
- `collapsed` - Start in collapsed state

**Examples:**

Basic sidebar (content built from `items`/`active` attributes, no children needed):

<wb-demo>
<aside
  items="Dashboard, Projects, Team, Settings"
  active="Dashboard">
</aside>
</wb-demo>

Semantic sidebar:

<wb-demo>
<aside>
  <nav>
    <a
      href="/dashboard"
      class="active">
      📊 Dashboard
    </a>
    <a href="/projects">📁 Projects</a>
    <a href="/team">👥 Team</a>
    <a href="/analytics">📈 Analytics</a>
    <a href="/settings">⚙️ Settings</a>
  </nav>
</aside>
</wb-demo>

Sidebar with sections:

<wb-demo>
<aside>
  <nav>
    <strong style="display: block; padding: 0.5rem; opacity: 0.7; font-size: 0.75rem;">MAIN</strong>
    <a href="/dashboard">Dashboard</a>
    <a href="/inbox">Inbox</a>
    <a href="/calendar">Calendar</a>
    <strong style="display: block; padding: 0.5rem; margin-top: 1rem; opacity: 0.7; font-size: 0.75rem;">PROJECTS</strong>
    <a href="/projects/alpha">Project Alpha</a>
    <a href="/projects/beta">Project Beta</a>
    <a href="/projects/new">+ New Project</a>
    <strong style="display: block; padding: 0.5rem; margin-top: 1rem; opacity: 0.7; font-size: 0.75rem;">SETTINGS</strong>
    <a href="/profile">Profile</a>
    <a href="/preferences">Preferences</a>
    <a href="/logout">Log out</a>
  </nav>
</aside>
</wb-demo>

Documentation sidebar:

<wb-demo>
<aside>
  <nav>
    <strong>Getting Started</strong>
    <a href="/docs/intro">Introduction</a>
    <a href="/docs/install">Installation</a>
    <a href="/docs/quickstart">Quick Start</a>
    <strong style="margin-top: 1rem; display: block;">Core Concepts</strong>
    <a href="/docs/behaviors">Behaviors</a>
    <a href="/docs/auto-inject">Auto Injection</a>
    <a href="/docs/themes">Theming</a>
    <strong style="margin-top: 1rem; display: block;">Components</strong>
    <a href="/docs/buttons">Buttons</a>
    <a href="/docs/forms">Forms</a>
    <a href="/docs/cards">Cards</a>
    <a href="/docs/dialogs">Dialogs</a>
    <strong style="margin-top: 1rem; display: block;">Advanced</strong>
    <a href="/docs/custom">Custom Behaviors</a>
    <a href="/docs/api">JavaScript API</a>
  </nav>
</aside>
</wb-demo>

Admin sidebar with icons:

<wb-demo>
<aside>
  <div style="padding: 1rem; border-bottom: 1px solid var(--border-color);">
    <strong>Admin Panel</strong>
  </div>
  <nav>
    <a href="/admin">🏠 Overview</a>
    <a href="/admin/users">👥 Users</a>
    <a href="/admin/orders">📦 Orders</a>
    <a href="/admin/products">🛍️ Products</a>
    <a href="/admin/analytics">📊 Analytics</a>
    <a href="/admin/reports">📋 Reports</a>
  </nav>
  <div style="margin-top: auto; padding: 1rem; border-top: 1px solid var(--border-color);">
    <a href="/admin/settings">⚙️ Settings</a>
    <a href="/logout">🚪 Log out</a>
  </div>
</aside>
</wb-demo>

**Layout with Sidebar:**

<wb-demo>
<wb-flex min-height="100vh">
  <aside style="width: 240px; flex-shrink: 0;">
    <nav>
      <a href="/dashboard">Dashboard</a>
      <a href="/projects">Projects</a>
      <a href="/settings">Settings</a>
    </nav>
  </aside>
  <main style="flex: 1; padding: 2rem;">
    <h1>Dashboard</h1>
    <p>Main content goes here.</p>
  </main>
</wb-flex>
</wb-demo>

---

## Quick Reference Table

### Decorating (element stays what it is)

| Element | Behavior | Module |
|---------|----------|--------|
| `<button>` | button | semantics/button.js |
| `<input>` | input | semantics/input.js |
| `<input type="checkbox">` | checkbox | semantics/checkbox.js |
| `<input type="radio">` | radio | semantics/radio.js |
| `<input type="range">` | range | semantics/range.js |
| `<select>` | select | semantics/select.js |
| `<textarea>` | textarea | semantics/textarea.js |
| `<form>` | form | enhancements.js |
| `<fieldset>` | fieldset | enhancements.js |
| `<label>` | label | enhancements.js |
| `<table>` | table | semantics/table.js |
| `<details>` | details | semantics/details.js |
| `<dialog>` | dialog | semantics/dialog.js |
| `<code>` | code | semantics/code.js |
| `<pre>` | pre | semantics/pre.js |
| `<kbd>` | kbd | semantics/inline.js |
| `<mark>` | mark | semantics/inline.js |
| `<video>` | video | semantics/video.js |
| `<audio>` | audio | semantics/audio.js |
| `<progress>` | progress | semantics/progress.js |
| `<header>` | header | header.js |
| `<footer>` | footer | footer.js |

### Morphing (element becomes a component)

| Element | Behavior | Module |
|---------|----------|--------|
| `<article>` | card | card.js |
| `<article href>` | cardlink | card.js |
| `<nav>` | navbar | navigation.js |
| `<aside>` | sidebar | navigation.js |
| `<img>` | image | media.js |

### Custom Tags (Always Active)

| Custom Tag | Behavior | Description |
|------------|----------|-------------|
| `<wb-grid>` | grid | CSS Grid layout |
| `<wb-flex>` | flex | Flexbox layout |
| `<wb-row>` | flex | Horizontal flex (alias) |
| `<wb-column>` | stack | Vertical stack (alias) |
| `<wb-stack>` | stack | Vertical stack |
| `<wb-cluster>` | cluster | Horizontal cluster |
| `<wb-container>` | container | Full-featured container |
| `<wb-center>` | center | Centered content |
| `<wb-cover>` | cover | Full-screen cover |
| `<wb-sidebar>` | sidebarlayout | Main + sidebar layout |
| `<wb-masonry>` | masonry | Masonry grid |
| `<wb-switcher>` | switcher | Responsive switcher |
| `<wb-reel>` | reel | Horizontal scroll |
| `<wb-frame>` | frame | Aspect ratio frame |
| `<wb-sticky>` | sticky | Sticky positioning |
| `<wb-drawer>` | drawerLayout | Collapsible drawer |
| `<wb-icon>` | icon | Icon + text alignment |
| `<card-basic>` | card | Generic card |
| `<card-image>` | cardimage | Card with image |
| `<card-video>` | cardvideo | Video card |
| `<card-profile>` | cardprofile | User profile card |
| `<card-pricing>` | cardpricing | Pricing card |
| `<card-product>` | cardproduct | Product card |
| `<card-stats>` | cardstats | Statistics card |
| `<card-testimonial>` | cardtestimonial | Testimonial card |
| `<card-hero>` | cardhero | Hero card |
| `<card-file>` | cardfile | File download card |
| `<card-notification>` | cardnotification | Notification card |
| `<card-portfolio>` | cardportfolio | Portfolio item card |
| `<card-link>` | cardlink | Clickable card |
| `<card-horizontal>` | cardhorizontal | Horizontal card |
| `<card-overlay>` | cardoverlay | Text over image |

### Attribute Shortcuts (Always Active)

| Attribute | Behavior | Usage |
|-----------|----------|-------|
| `tooltip="text"` | tooltip | `<span tooltip="Help">?</span>` |
| `toast-message="text"` | toast | `<button toast-message="Saved!">Save</button>` |
| `ripple` | ripple | `<div ripple>Click me</div>` |
| `badge="text"` | badge | `<span badge="3">Notifications</span>` |

---

## Custom Tags: Not Web Components!

WB Behaviors supports custom tag names like `<wb-grid>` and `<price-card>`. Here's the important thing:

**These are NOT Web Components.**

- ❌ No `customElements.define()`
- ❌ No Shadow DOM
- ❌ No class extending HTMLElement
- ✅ Just regular HTML elements with custom tag names
- ✅ Behaviors applied via CSS selector matching
- ✅ Works because browsers allow unknown tag names

### How Custom Tags Work

```
1. You write:     <wb-grid columns="3">...</wb-grid>

2. Browser sees:  Unknown tag → creates generic HTMLElement
                  (Browsers don't reject unknown tags!)

3. WB scans:      The customElementMappings array in wb-lazy.js:
                  { selector: 'wb-grid', behavior: 'grid' }

4. WB matches:    element.matches('wb-grid') → true

5. WB injects:    grid(element, options) function runs

6. Result:        Your <wb-grid> now has CSS Grid styles applied
```

This happens via `MutationObserver` - WB watches for new elements and applies behaviors automatically.

### The Code Behind It

In `src/core/wb-lazy.js`:

```javascript
const customElementMappings = [
  // Layout tags
  { selector: 'wb-grid', behavior: 'grid' },
  { selector: 'wb-flex', behavior: 'flex' },
  { selector: 'wb-row', behavior: 'flex' },      // Alias!
  { selector: 'wb-column', behavior: 'stack' },  // Alias!
  { selector: 'wb-stack', behavior: 'stack' },
  // ... more mappings
  
  // Card tags
  { selector: 'card-pricing', behavior: 'cardpricing' },
  { selector: 'card-profile', behavior: 'cardprofile' },
  // ... more card mappings
  
  // Attribute shortcuts (work on ANY element)
  { selector: '[tooltip]', behavior: 'tooltip' },
  { selector: '[ripple]', behavior: 'ripple' },
];
```

Then in the scan/observe logic:

```javascript
customElementMappings.forEach(({ selector, behavior }) => {
  const elements = root.querySelectorAll(selector);
  elements.forEach(element => {
    WB.lazyInject(element, behavior);
  });
});
```

### Why Not Real Web Components?

| Web Components | WB Custom Tags |
|----------------|----------------|
| Requires `customElements.define()` | No registration needed |
| Shadow DOM isolation | Light DOM - CSS works normally |
| Class-based boilerplate | Just functions |
| One component = one class | Many behaviors in one module |
| Slots, templates required | Plain HTML children |
| Must wait for definition | Works immediately |

### Custom Tags Are Always Active

Unlike `autoInject` (which requires `autoInject: true` in config), custom tags **always work**. They're in a separate `customElementMappings` array that's checked regardless of the autoInject setting.

```javascript
// In WB.scan() - custom elements ALWAYS checked:
customElementMappings.forEach(({ selector, behavior }) => {
  const customElements = root.querySelectorAll(selector);
  customElements.forEach(element => {
    WB.lazyInject(element, behavior);
  });
});

// autoInject elements only if enabled:
if (getConfig('autoInject')) {
  autoInjectMappings.forEach(...);
}
```

---

## Layout Custom Tags Examples

### wb-grid

Basic 3-column grid:

<wb-demo>
<wb-grid
  columns="3"
  gap="1rem">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</wb-grid>
</wb-demo>

Responsive grid with min-width:

<wb-demo>
<wb-grid
  min-width="250px"
  gap="2rem">
  <article>Card 1</article>
  <article>Card 2</article>
  <article>Card 3</article>
  <article>Card 4</article>
</wb-grid>
</wb-demo>

### wb-flex / wb-row

Horizontal layout:

<wb-demo>
<wb-flex
  gap="1rem"
  justify="space-between">
  <div>Left</div>
  <div>Right</div>
</wb-flex>
</wb-demo>

Button row (wb-row is alias for flex):

<wb-demo>
<wb-row
  gap="0.5rem"
  justify="flex-end">
  <button variant="ghost">Cancel</button>
  <button variant="primary">Save</button>
</wb-row>
</wb-demo>

### wb-stack / wb-column

Vertical stack:

<wb-demo>
<wb-stack gap="1rem">
  <input
    type="text"
    placeholder="Name">
  <input
    type="email"
    placeholder="Email">
  <button>Submit</button>
</wb-stack>
</wb-demo>

wb-column is alias for stack:

<wb-demo>
<wb-column gap="1rem">
  <h3>Title</h3>
  <p>Content</p>
</wb-column>
</wb-demo>

### wb-container

Centered content with max-width:

<wb-demo>
<wb-container
  max-width="800px"
  padding="2rem">
  <h1>Article Title</h1>
  <p>Content goes here...</p>
</wb-container>
</wb-demo>

Multi-column grid mode:

<wb-demo>
<wb-container
  columns="2"
  gap="2rem">
  <div>Left column</div>
  <div>Right column</div>
</wb-container>
</wb-demo>

### wb-center

Max-width centering:

<wb-demo>
<wb-center max-width="600px">
  <h1>Centered Heading</h1>
</wb-center>
</wb-demo>

Intrinsic centering (based on content width):

<wb-demo>
<wb-center intrinsic>
  <button variant="primary">Centered Button</button>
</wb-center>
</wb-demo>

### wb-cover

Full-screen hero with vertical centering:

<wb-demo>
<wb-cover min-height="320px">
  <header>Logo</header>
  <div principal>
    <h1>Main Content</h1>
    <p>This is vertically centered</p>
  </div>
  <footer>Scroll down ↓</footer>
</wb-cover>
</wb-demo>

### wb-sidebar

Two-column layout with sidebar:

<wb-demo>
<wb-sidebar
  side="left"
  side-width="250px"
  gap="2rem">
  <aside>
    <nav>Sidebar navigation</nav>
  </aside>
  <main>
    <h1>Main Content</h1>
  </main>
</wb-sidebar>
</wb-demo>

### wb-masonry

Pinterest-style masonry:

<wb-demo>
<wb-masonry
  columns="3"
  gap="1rem">
  <img
    src="https://placehold.co/300x500/1e293b/e2e8f0?text=Tall"
    alt="">
  <img
    src="https://placehold.co/500x300/1e293b/e2e8f0?text=Wide"
    alt="">
  <img
    src="https://placehold.co/400x400/1e293b/e2e8f0?text=Square"
    alt="">
  <img
    src="https://placehold.co/300x450/1e293b/e2e8f0?text=Tall+2"
    alt="">
</wb-masonry>
</wb-demo>

### wb-reel

Horizontal scroll carousel:

<wb-demo>
<wb-reel
  item-width="300px"
  gap="1rem">
  <article>Card 1</article>
  <article>Card 2</article>
  <article>Card 3</article>
  <article>Card 4</article>
</wb-reel>
</wb-demo>

### wb-frame

16:9 video frame:

<wb-demo>
<wb-frame ratio="16/9">
  <iframe src="about:blank" title="16:9 video frame placeholder"></iframe>
</wb-frame>
</wb-demo>

Square avatar frame:

<wb-demo>
<wb-frame ratio="1/1">
  <img
    src="https://ui-avatars.com/api/?name=User&size=150&background=475569&color=fff"
    alt="User">
</wb-frame>
</wb-demo>

### wb-sticky

Sticky header:

<wb-demo>
<wb-sticky
  top="0"
  z-index="100">
  <header>This stays at top when scrolling</header>
</wb-sticky>
</wb-demo>

### wb-drawer

`<wb-drawer>` (`drawer` behavior, `semantics`/`overlay.js`) is itself the
clickable trigger — its own text is the visible label, `title`/`width`/
`position` configure the slide-in panel, and clicking it opens an overlay
panel built from those attributes. (An earlier version of this doc showed
`<wb-drawer>` as a static, always-visible sidebar with `resizable`/
`save-state` attributes that don't exist on this behavior — that pattern is
`<wb-drawer-layout>`, a different tag/behavior; see
[Drawer Components](components/drawer.md).)

<wb-demo>
<wb-drawer
  position="left"
  width="250px"
  title="Menu">
  Click to open the navigation drawer
</wb-drawer>
</wb-demo>

---

## Card Custom Tags Examples

All card tags use `card-*` prefix for easy autocomplete and grouping:

Basic card:

<wb-demo>
<card-basic>
  <h3>Card Title</h3>
  <p>Card content goes here.</p>
</card-basic>
</wb-demo>

Image card:

<wb-demo>
<card-image
  src="https://picsum.photos/seed/photo/600/400"
  title="Beautiful Sunset"
  alt="Sunset over mountains">
</card-image>
</wb-demo>

Profile card:

<wb-demo>
<card-profile
  avatar="https://ui-avatars.com/api/?name=Jane+Doe&size=150&background=475569&color=fff"
  name="Jane Doe"
  title="Senior Developer"
  bio="Full-stack developer with 10+ years experience.">
</card-profile>
</wb-demo>

Pricing card:

<wb-demo>
<card-pricing
  plan="Pro"
  price="$29"
  period="/month"
  features="Unlimited projects, Priority support, API access"
  cta="Get Started"
  popular="true">
</card-pricing>
</wb-demo>

Product card:

<wb-demo>
<card-product
  image="https://picsum.photos/seed/product/600/400"
  title="Widget Pro"
  price="$99.99"
  rating="4.5"
  reviews="128">
</card-product>
</wb-demo>

Stats card:

<wb-demo>
<card-stats
  value="2,847"
  label="Active Users"
  change="+12%"
  trend="up">
</card-stats>
</wb-demo>

Testimonial card:

<wb-demo>
<card-testimonial
  quote="This product changed everything!"
  author="John Smith"
  role="CEO, TechCorp"
  avatar="https://picsum.photos/seed/john/200/200">
</card-testimonial>
</wb-demo>

Hero card:

<wb-demo>
<card-hero
  title="Welcome"
  subtitle="Get started today"
  image="https://picsum.photos/seed/hero-bg/600/400"
  cta="Learn More"
  href="/start">
</card-hero>
</wb-demo>

Video card:

<wb-demo>
<card-video
  src="demo.mp4"
  poster="https://picsum.photos/seed/poster/800/450"
  title="Product Demo">
</card-video>
</wb-demo>

File card:

<wb-demo>
<card-file
  filename="report.pdf"
  size="2.4 MB"
  icon="📄"
  href="/downloads/report.pdf">
</card-file>
</wb-demo>

Notification card:

<wb-demo>
<card-notification
  type="success"
  title="Payment Received"
  message="Your payment of $99.00 was successful."
  time="2 minutes ago">
</card-notification>
</wb-demo>

Portfolio card:

<wb-demo>
<card-portfolio
  image="https://picsum.photos/seed/project/600/400"
  title="E-commerce Redesign"
  category="Web Design"
  href="/portfolio/ecommerce">
</card-portfolio>
</wb-demo>

Link card (clickable):

<wb-demo>
<card-link
  href="/docs"
  title="Documentation"
  description="Learn how to use the framework"
  icon="📚">
</card-link>
</wb-demo>

Horizontal card:

<wb-demo>
<card-horizontal
  image="https://picsum.photos/seed/thumb/600/400"
  title="Article Title"
  description="Brief description of the article...">
</card-horizontal>
</wb-demo>

Overlay card:

<wb-demo>
<card-overlay
  image="https://picsum.photos/seed/background/600/400"
  title="Overlay Title"
  subtitle="Text appears over the image">
</card-overlay>
</wb-demo>

---

## Attribute Shortcuts Examples

These work on ANY element and are always active:

Tooltip on any element:

<wb-demo>
<wb-container>
<button tooltip="Save your work">💾 Save</button>
<span tooltip="Click for more information">ℹ️</span>
<a
  href="/"
  tooltip="Go to homepage">
  Home
</a>
</wb-container>
</wb-demo>

Toast message on click:

<wb-demo>
<wb-container>
<button toast-message="Copied to clipboard!">📋 Copy</button>
<button toast-message="Item added to cart">🛒 Add to Cart</button>
</wb-container>
</wb-demo>

Ripple effect on any clickable element:

<wb-demo>
<wb-container>
<div
  ripple
  style="padding: 2rem; cursor: pointer;">
  Click anywhere for ripple effect
</div>
<a
  href="/"
  ripple>
  Ripple Link
</a>
</wb-container>
</wb-demo>

Badge on any element:

<wb-demo>
<wb-container>
<span badge="3">🔔 Notifications</span>
<button badge="New">✨ Features</button>
<a
  href="/inbox"
  badge="99+">
  📧 Inbox
</a>
</wb-container>
</wb-demo>

---

## Version

- **Document Version:** 3.3.0
- **Last Updated:** January 2, 2026
