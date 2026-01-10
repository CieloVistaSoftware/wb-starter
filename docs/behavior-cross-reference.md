# Web Behaviors (WB) Behaviors Cross-Reference

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
- `data-variant` - Button style (primary, secondary, etc.)
- `data-size` - Button size (xs, sm, md, lg, xl)
- `data-icon` - Icon character
- `data-icon-position` - left or right
- `data-loading` - Show loading spinner
- `data-disabled` - Disable button

**Examples:**

```html
<!-- Basic buttons - auto-styled -->
<button>Default Primary</button>
<button type="submit">Submit Form</button>
<button type="reset">Reset</button>

<!-- All variants -->
<button data-variant="primary">Primary</button>
<button data-variant="secondary">Secondary</button>
<button data-variant="success">Success</button>
<button data-variant="danger">Danger</button>
<button data-variant="warning">Warning</button>
<button data-variant="ghost">Ghost</button>
<button data-variant="link">Link Style</button>
<button data-variant="outline">Outline</button>

<!-- All sizes -->
<button data-size="xs">Extra Small</button>
<button data-size="sm">Small</button>
<button data-size="md">Medium (default)</button>
<button data-size="lg">Large</button>
<button data-size="xl">Extra Large</button>

<!-- With icons -->
<button data-icon="💾">Save</button>
<button data-icon="🗑️" data-variant="danger">Delete</button>
<button data-icon="→" data-icon-position="right">Next</button>
<button data-icon="←">Back</button>

<!-- States -->
<button data-loading>Saving...</button>
<button data-disabled>Disabled</button>
<button data-variant="success" data-icon="✓" data-size="lg">Complete Purchase</button>

<!-- Combined -->
<button data-variant="danger" data-size="sm" data-icon="🗑️">Delete Item</button>
<button data-variant="success" data-size="lg" data-icon="✓" data-icon-position="right">
  Confirm Order
</button>
```

**Button Group Example:**
```html
<div style="display: flex; gap: 0.5rem;">
  <button data-variant="outline">Cancel</button>
  <button data-variant="primary">Save Draft</button>
  <button data-variant="success">Publish</button>
</div>
```

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
- `data-variant` - success or error
- `data-size` - xs, sm, md, lg, xl
- `data-clearable` - Add clear button
- `data-prefix` - Text before input
- `data-suffix` - Text after input

**Examples:**

```html
<!-- Basic inputs - auto-styled -->
<input type="text" placeholder="Your name">
<input type="email" placeholder="email@example.com">
<input type="password" placeholder="Password">
<input type="search" placeholder="Search...">
<input type="url" placeholder="https://...">
<input type="tel" placeholder="(555) 123-4567">

<!-- All sizes -->
<input type="text" data-size="xs" placeholder="Extra small">
<input type="text" data-size="sm" placeholder="Small">
<input type="text" data-size="md" placeholder="Medium (default)">
<input type="text" data-size="lg" placeholder="Large">
<input type="text" data-size="xl" placeholder="Extra large">

<!-- Validation states -->
<input type="email" data-variant="success" value="valid@email.com">
<input type="email" data-variant="error" value="invalid-email">

<!-- With prefix/suffix -->
<input type="text" data-prefix="$" placeholder="0.00">
<input type="text" data-suffix=".00" placeholder="Price">
<input type="text" data-prefix="https://" placeholder="website.com">
<input type="text" data-prefix="@" placeholder="username">
<input type="text" data-suffix="kg" placeholder="Weight">
<input type="text" data-prefix="$" data-suffix="USD" placeholder="Amount">

<!-- Clearable -->
<input type="text" data-clearable placeholder="Type and clear...">
<input type="search" data-clearable placeholder="Search...">
<input type="email" data-clearable data-variant="error" placeholder="Fix this email">

<!-- Combined -->
<input type="text" data-size="lg" data-prefix="🔍" data-clearable placeholder="Search products...">
<input type="number" data-prefix="$" data-suffix="/month" data-size="lg" placeholder="99">
```

**Form Field Examples:**
```html
<!-- Login form -->
<form>
  <label>Email
    <input type="email" placeholder="you@company.com" data-clearable>
  </label>
  <label>Password
    <input type="password" placeholder="••••••••" data-size="lg">
  </label>
  <button data-variant="primary" data-size="lg">Sign In</button>
</form>

<!-- Price input -->
<label>Product Price
  <input type="number" data-prefix="$" data-suffix=".00" placeholder="99" data-size="lg">
</label>

<!-- Search with icon -->
<input type="search" data-prefix="🔍" data-clearable data-size="lg" placeholder="Search documentation...">
```

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
- `data-open` - Start expanded
- `data-animated` - Enable/disable animation (default: true)

**Native behavior preserved:** Open/close toggle, summary click, keyboard access, Escape key

**Examples:**

```html
<!-- Basic collapsible -->
<details>
  <summary>What is WB Behaviors?</summary>
  <p>WB Behaviors is a behavior-based UI library that enhances semantic HTML.</p>
</details>

<!-- Starts open -->
<details data-open>
  <summary>Important Notice</summary>
  <p>This section is expanded by default so users see it immediately.</p>
</details>

<!-- FAQ section -->
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

<!-- Nested details -->
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

<!-- With rich content -->
<details>
  <summary>View Code Example</summary>
  <pre><code>
function greet(name) {
  return `Hello, ${name}!`;
}
  </code></pre>
</details>

<!-- Settings panel -->
<details>
  <summary>Advanced Settings</summary>
  <label>
    <input type="checkbox"> Enable notifications
  </label>
  <label>
    <input type="checkbox"> Dark mode
  </label>
  <label>
    Theme
    <select>
      <option>Default</option>
      <option>Ocean</option>
      <option>Forest</option>
    </select>
  </label>
</details>
```

**Accordion Pattern (multiple details):**
```html
<div class="accordion">
  <details data-open>
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
</div>
```

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

```html
<!-- Basic modal -->
<dialog id="basicModal">
  <h2>Welcome!</h2>
  <p>Thanks for visiting our site.</p>
  <button onclick="this.closest('dialog').close()">Got it</button>
</dialog>
<button onclick="document.getElementById('basicModal').showModal()">
  Show Welcome
</button>

<!-- Confirmation dialog -->
<dialog id="confirmDelete">
  <h2>Delete Item?</h2>
  <p>This action cannot be undone. Are you sure?</p>
  <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
    <button data-variant="ghost" onclick="this.closest('dialog').close()">
      Cancel
    </button>
    <button data-variant="danger" onclick="deleteItem(); this.closest('dialog').close()">
      Delete
    </button>
  </div>
</dialog>
<button data-variant="danger" onclick="document.getElementById('confirmDelete').showModal()">
  🗑️ Delete
</button>

<!-- Form in dialog -->
<dialog id="loginDialog">
  <h2>Sign In</h2>
  <form method="dialog">
    <label>
      Email
      <input type="email" required placeholder="you@example.com">
    </label>
    <label>
      Password
      <input type="password" required placeholder="••••••••">
    </label>
    <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem;">
      <button type="button" data-variant="ghost" onclick="this.closest('dialog').close()">
        Cancel
      </button>
      <button type="submit" data-variant="primary">Sign In</button>
    </div>
  </form>
</dialog>
<button onclick="document.getElementById('loginDialog').showModal()">
  Sign In
</button>

<!-- Image lightbox dialog -->
<dialog id="imageDialog">
  <img src="large-photo.jpg" alt="Full size photo" style="max-width: 90vw; max-height: 80vh;">
  <button onclick="this.closest('dialog').close()" style="position: absolute; top: 1rem; right: 1rem;">
    ✕
  </button>
</dialog>
<img src="thumbnail.jpg" alt="Click to enlarge" 
     onclick="document.getElementById('imageDialog').showModal()" 
     style="cursor: pointer;">

<!-- Terms and conditions -->
<dialog id="termsDialog">
  <h2>Terms of Service</h2>
  <div style="max-height: 300px; overflow-y: auto;">
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
    <p>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...</p>
    <!-- More content -->
  </div>
  <form method="dialog" style="margin-top: 1rem;">
    <label>
      <input type="checkbox" required> I agree to the terms and conditions
    </label>
    <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem;">
      <button type="button" data-variant="ghost" onclick="this.closest('dialog').close()">
        Decline
      </button>
      <button type="submit" data-variant="success">Accept</button>
    </div>
  </form>
</dialog>

<!-- Settings dialog -->
<dialog id="settingsDialog">
  <h2>Settings</h2>
  <form method="dialog">
    <fieldset>
      <legend>Notifications</legend>
      <label><input type="checkbox" checked> Email notifications</label>
      <label><input type="checkbox"> Push notifications</label>
      <label><input type="checkbox" checked> Weekly digest</label>
    </fieldset>
    <fieldset>
      <legend>Privacy</legend>
      <label><input type="checkbox"> Show online status</label>
      <label><input type="checkbox" checked> Allow search engines</label>
    </fieldset>
    <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem;">
      <button type="submit" data-variant="primary">Save Settings</button>
    </div>
  </form>
</dialog>
```

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
- `data-sortable` - Enable/disable sorting
- `data-striped` - Enable/disable striping

**Native behavior preserved:** Table structure, thead/tbody/tfoot, caption, accessibility

**Examples:**

```html
<!-- Basic data table -->
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

<!-- With caption -->
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

<!-- Pricing table -->
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

<!-- Schedule/calendar table -->
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

<!-- Status table with badges -->
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
      <td><span data-wb="badge" data-variant="success">Complete</span></td>
      <td>Jan 15</td>
    </tr>
    <tr>
      <td>Build API</td>
      <td>Bob</td>
      <td><span data-wb="badge" data-variant="warning">In Progress</span></td>
      <td>Jan 20</td>
    </tr>
    <tr>
      <td>Write docs</td>
      <td>Carol</td>
      <td><span data-wb="badge" data-variant="secondary">Pending</span></td>
      <td>Jan 25</td>
    </tr>
  </tbody>
</table>
```

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

```html
<!-- Contact form -->
<form action="/contact" method="post">
  <label>
    Name
    <input type="text" name="name" required placeholder="Your full name">
  </label>
  
  <label>
    Email
    <input type="email" name="email" required placeholder="you@example.com">
  </label>
  
  <label>
    Subject
    <select name="subject" required>
      <option value="">Choose a topic...</option>
      <option value="sales">Sales inquiry</option>
      <option value="support">Technical support</option>
      <option value="feedback">Feedback</option>
    </select>
  </label>
  
  <label>
    Message
    <textarea name="message" required placeholder="How can we help?" rows="5"></textarea>
  </label>
  
  <button type="submit" data-variant="primary">Send Message</button>
</form>

<!-- Registration form -->
<form action="/register" method="post">
  <fieldset>
    <legend>Account Information</legend>
    <label>
      Username
      <input type="text" name="username" required minlength="3" maxlength="20" 
             pattern="[a-zA-Z0-9_]+" placeholder="Choose a username">
    </label>
    <label>
      Email
      <input type="email" name="email" required placeholder="you@example.com">
    </label>
    <label>
      Password
      <input type="password" name="password" required minlength="8" 
             placeholder="At least 8 characters">
    </label>
    <label>
      Confirm Password
      <input type="password" name="confirm" required placeholder="Repeat password">
    </label>
  </fieldset>
  
  <fieldset>
    <legend>Profile</legend>
    <label>
      Full Name
      <input type="text" name="fullname" placeholder="Optional">
    </label>
    <label>
      Bio
      <textarea name="bio" placeholder="Tell us about yourself..." rows="3"></textarea>
    </label>
  </fieldset>
  
  <label>
    <input type="checkbox" name="terms" required>
    I agree to the <a href="/terms">Terms of Service</a>
  </label>
  
  <label>
    <input type="checkbox" name="newsletter">
    Subscribe to newsletter
  </label>
  
  <button type="submit" data-variant="success" data-size="lg">Create Account</button>
</form>

<!-- Payment form -->
<form action="/checkout" method="post">
  <fieldset>
    <legend>Payment Details</legend>
    <label>
      Card Number
      <input type="text" name="card" required pattern="[0-9]{16}" 
             placeholder="1234 5678 9012 3456" data-prefix="💳">
    </label>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
      <label>
        Expiry
        <input type="text" name="expiry" required pattern="[0-9]{2}/[0-9]{2}" 
               placeholder="MM/YY">
      </label>
      <label>
        CVV
        <input type="text" name="cvv" required pattern="[0-9]{3,4}" 
               placeholder="123">
      </label>
    </div>
  </fieldset>
  
  <button type="submit" data-variant="success" data-size="lg" data-icon="🔒">
    Pay $99.00
  </button>
</form>

<!-- Search form -->
<form action="/search" method="get" style="display: flex; gap: 0.5rem;">
  <input type="search" name="q" placeholder="Search..." data-clearable data-size="lg" style="flex: 1;">
  <button type="submit" data-variant="primary" data-size="lg" data-icon="🔍">Search</button>
</form>

<!-- Filter form -->
<form>
  <fieldset>
    <legend>Price Range</legend>
    <label><input type="radio" name="price" value="0-50"> $0 - $50</label>
    <label><input type="radio" name="price" value="50-100"> $50 - $100</label>
    <label><input type="radio" name="price" value="100+"> $100+</label>
  </fieldset>
  
  <fieldset>
    <legend>Categories</legend>
    <label><input type="checkbox" name="cat" value="electronics"> Electronics</label>
    <label><input type="checkbox" name="cat" value="clothing"> Clothing</label>
    <label><input type="checkbox" name="cat" value="home"> Home & Garden</label>
  </fieldset>
  
  <fieldset>
    <legend>Rating</legend>
    <label><input type="checkbox" name="rating" value="4"> 4+ Stars</label>
    <label><input type="checkbox" name="rating" value="3"> 3+ Stars</label>
  </fieldset>
  
  <button type="submit" data-variant="primary">Apply Filters</button>
  <button type="reset" data-variant="ghost">Clear All</button>
</form>
```

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

```html
<!-- Basic select -->
<select>
  <option value="">Choose an option...</option>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
  <option value="3">Option 3</option>
</select>

<!-- With optgroups -->
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

<!-- Country selector -->
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

<!-- Multiple selection -->
<select multiple size="5">
  <option value="html">HTML</option>
  <option value="css">CSS</option>
  <option value="js">JavaScript</option>
  <option value="ts">TypeScript</option>
  <option value="react">React</option>
  <option value="vue">Vue</option>
  <option value="angular">Angular</option>
</select>

<!-- With disabled options -->
<select>
  <option value="">Choose a plan...</option>
  <option value="free">Free - $0/mo</option>
  <option value="pro">Pro - $29/mo</option>
  <option value="enterprise" disabled>Enterprise - Contact Us</option>
</select>

<!-- Date selectors -->
<div style="display: flex; gap: 0.5rem;">
  <select name="month">
    <option value="">Month</option>
    <option value="1">January</option>
    <option value="2">February</option>
    <option value="3">March</option>
    <!-- ... -->
  </select>
  <select name="day">
    <option value="">Day</option>
    <option value="1">1</option>
    <option value="2">2</option>
    <!-- ... -->
  </select>
  <select name="year">
    <option value="">Year</option>
    <option value="2026">2026</option>
    <option value="2025">2025</option>
    <option value="2024">2024</option>
  </select>
</div>
```

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

```html
<!-- Basic textarea -->
<textarea placeholder="Enter your message..."></textarea>

<!-- With character limit -->
<textarea maxlength="500" data-counter placeholder="Write your bio (max 500 characters)..."></textarea>

<!-- Different sizes -->
<textarea rows="3" placeholder="Short message..."></textarea>
<textarea rows="10" placeholder="Long description..."></textarea>

<!-- Code input -->
<textarea rows="15" style="font-family: monospace;" placeholder="// Paste your code here..."></textarea>

<!-- Various use cases -->
<label>
  Product Description
  <textarea rows="5" placeholder="Describe your product in detail..." maxlength="1000" data-counter></textarea>
</label>

<label>
  Cover Letter
  <textarea rows="10" placeholder="Dear Hiring Manager..."></textarea>
</label>

<label>
  Bug Report
  <textarea rows="8" placeholder="Please describe the issue:
- What happened?
- What did you expect?
- Steps to reproduce..."></textarea>
</label>

<label>
  JSON Configuration
  <textarea rows="12" style="font-family: monospace;" placeholder='{
  "name": "my-config",
  "version": "1.0.0"
}'></textarea>
</label>
```

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

```html
<!-- Single checkbox -->
<label>
  <input type="checkbox" name="subscribe">
  Subscribe to newsletter
</label>

<!-- Terms agreement -->
<label>
  <input type="checkbox" name="terms" required>
  I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
</label>

<!-- Checkbox group -->
<fieldset>
  <legend>Select your interests:</legend>
  <label><input type="checkbox" name="interests" value="tech"> Technology</label>
  <label><input type="checkbox" name="interests" value="sports"> Sports</label>
  <label><input type="checkbox" name="interests" value="music"> Music</label>
  <label><input type="checkbox" name="interests" value="travel"> Travel</label>
  <label><input type="checkbox" name="interests" value="food"> Food & Cooking</label>
</fieldset>

<!-- Settings toggles -->
<fieldset>
  <legend>Notification Settings</legend>
  <label><input type="checkbox" name="email_notif" checked> Email notifications</label>
  <label><input type="checkbox" name="push_notif"> Push notifications</label>
  <label><input type="checkbox" name="sms_notif"> SMS alerts</label>
  <label><input type="checkbox" name="weekly" checked> Weekly digest</label>
</fieldset>

<!-- Feature selection -->
<fieldset>
  <legend>Select Features</legend>
  <label>
    <input type="checkbox" name="features" value="analytics" checked>
    📊 Analytics Dashboard
  </label>
  <label>
    <input type="checkbox" name="features" value="api">
    🔌 API Access
  </label>
  <label>
    <input type="checkbox" name="features" value="support">
    💬 Priority Support
  </label>
  <label>
    <input type="checkbox" name="features" value="export">
    📤 Data Export
  </label>
</fieldset>

<!-- Indeterminate state (via JS) -->
<label>
  <input type="checkbox" id="selectAll" onchange="toggleAll(this)">
  <strong>Select All</strong>
</label>
<div style="padding-left: 1.5rem;">
  <label><input type="checkbox" class="item"> Item 1</label>
  <label><input type="checkbox" class="item"> Item 2</label>
  <label><input type="checkbox" class="item"> Item 3</label>
</div>
```

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

```html
<!-- Basic radio group -->
<fieldset>
  <legend>Choose a size:</legend>
  <label><input type="radio" name="size" value="s"> Small</label>
  <label><input type="radio" name="size" value="m" checked> Medium</label>
  <label><input type="radio" name="size" value="l"> Large</label>
  <label><input type="radio" name="size" value="xl"> Extra Large</label>
</fieldset>

<!-- Payment method -->
<fieldset>
  <legend>Payment Method</legend>
  <label>
    <input type="radio" name="payment" value="card" checked>
    💳 Credit/Debit Card
  </label>
  <label>
    <input type="radio" name="payment" value="paypal">
    🅿️ PayPal
  </label>
  <label>
    <input type="radio" name="payment" value="bank">
    🏦 Bank Transfer
  </label>
  <label>
    <input type="radio" name="payment" value="crypto">
    ₿ Cryptocurrency
  </label>
</fieldset>

<!-- Shipping options -->
<fieldset>
  <legend>Shipping Speed</legend>
  <label>
    <input type="radio" name="shipping" value="standard">
    📦 Standard (5-7 days) - Free
  </label>
  <label>
    <input type="radio" name="shipping" value="express">
    🚚 Express (2-3 days) - $9.99
  </label>
  <label>
    <input type="radio" name="shipping" value="overnight">
    ✈️ Overnight - $24.99
  </label>
</fieldset>

<!-- Rating scale -->
<fieldset>
  <legend>How satisfied are you?</legend>
  <label><input type="radio" name="satisfaction" value="1"> 1 - Very Dissatisfied</label>
  <label><input type="radio" name="satisfaction" value="2"> 2 - Dissatisfied</label>
  <label><input type="radio" name="satisfaction" value="3"> 3 - Neutral</label>
  <label><input type="radio" name="satisfaction" value="4"> 4 - Satisfied</label>
  <label><input type="radio" name="satisfaction" value="5"> 5 - Very Satisfied</label>
</fieldset>

<!-- Pricing plans -->
<fieldset>
  <legend>Choose Your Plan</legend>
  <label style="display: block; padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 0.5rem;">
    <input type="radio" name="plan" value="free">
    <strong>Free</strong> - $0/month
    <br><small>Basic features for individuals</small>
  </label>
  <label style="display: block; padding: 1rem; border: 2px solid var(--primary); border-radius: 8px; margin-bottom: 0.5rem;">
    <input type="radio" name="plan" value="pro" checked>
    <strong>Pro</strong> - $29/month ⭐ Popular
    <br><small>Advanced features for professionals</small>
  </label>
  <label style="display: block; padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px;">
    <input type="radio" name="plan" value="team">
    <strong>Team</strong> - $99/month
    <br><small>Collaboration features for teams</small>
  </label>
</fieldset>

<!-- Yes/No questions -->
<fieldset>
  <legend>Do you have prior experience?</legend>
  <label><input type="radio" name="experience" value="yes"> Yes</label>
  <label><input type="radio" name="experience" value="no"> No</label>
</fieldset>

<!-- Frequency selection -->
<fieldset>
  <legend>How often do you exercise?</legend>
  <label><input type="radio" name="exercise" value="daily"> Daily</label>
  <label><input type="radio" name="exercise" value="weekly"> A few times a week</label>
  <label><input type="radio" name="exercise" value="monthly"> A few times a month</label>
  <label><input type="radio" name="exercise" value="rarely"> Rarely</label>
  <label><input type="radio" name="exercise" value="never"> Never</label>
</fieldset>
```

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

```html
<!-- Basic range -->
<label>
  Volume
  <input type="range" min="0" max="100" value="50">
</label>

<!-- With output display -->
<label>
  Brightness: <output id="brightnessValue">75</output>%
  <input type="range" min="0" max="100" value="75" 
         oninput="document.getElementById('brightnessValue').textContent = this.value">
</label>

<!-- Price range -->
<label>
  Max Price: $<output id="priceValue">500</output>
  <input type="range" min="0" max="1000" step="50" value="500"
         oninput="document.getElementById('priceValue').textContent = this.value">
</label>

<!-- Rating slider -->
<label>
  Rating: <output id="ratingValue">3</output> / 5
  <input type="range" min="1" max="5" step="1" value="3"
         oninput="document.getElementById('ratingValue').textContent = this.value">
</label>

<!-- Temperature control -->
<label>
  Temperature: <output id="tempValue">72</output>°F
  <input type="range" min="60" max="85" value="72"
         oninput="document.getElementById('tempValue').textContent = this.value">
</label>

<!-- Opacity slider -->
<label>
  Opacity: <output id="opacityValue">100</output>%
  <input type="range" min="0" max="100" value="100"
         oninput="document.getElementById('opacityValue').textContent = this.value">
</label>

<!-- Zoom control -->
<label style="display: flex; align-items: center; gap: 0.5rem;">
  <span>🔍-</span>
  <input type="range" min="50" max="200" value="100" style="flex: 1;">
  <span>🔍+</span>
</label>

<!-- Color hue picker -->
<label>
  Hue: <output id="hueValue">180</output>°
  <input type="range" min="0" max="360" value="180"
         oninput="document.getElementById('hueValue').textContent = this.value"
         style="background: linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red);">
</label>
```

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

```html
<!-- Basic progress -->
<progress value="70" max="100"></progress>

<!-- Indeterminate (loading) -->
<progress></progress>

<!-- Various completion levels -->
<label>Not started: <progress value="0" max="100"></progress></label>
<label>25% Complete: <progress value="25" max="100"></progress></label>
<label>50% Complete: <progress value="50" max="100"></progress></label>
<label>75% Complete: <progress value="75" max="100"></progress></label>
<label>Complete: <progress value="100" max="100"></progress></label>

<!-- File upload progress -->
<div>
  <p>Uploading document.pdf...</p>
  <progress value="45" max="100"></progress>
  <span>45%</span>
</div>

<!-- Download progress -->
<div>
  <p>Downloading update (125 MB / 500 MB)</p>
  <progress value="125" max="500"></progress>
</div>

<!-- Step progress -->
<div>
  <p>Step 2 of 4</p>
  <progress value="2" max="4"></progress>
</div>

<!-- Course progress -->
<div>
  <h3>JavaScript Fundamentals</h3>
  <p>12 of 20 lessons completed</p>
  <progress value="12" max="20"></progress>
</div>

<!-- Multiple progress bars (dashboard) -->
<div>
  <label>Storage Used (7.5 GB / 10 GB)
    <progress value="75" max="100"></progress>
  </label>
  <label>Bandwidth Used (45 GB / 100 GB)
    <progress value="45" max="100"></progress>
  </label>
  <label>API Calls (8,500 / 10,000)
    <progress value="85" max="100"></progress>
  </label>
</div>
```

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

```html
<!-- Inline code in text -->
<p>Use the <code>console.log()</code> function to debug your code.</p>

<p>The <code>Array.map()</code> method creates a new array.</p>

<p>Set <code>display: flex</code> on the container.</p>

<p>Run <code>npm install</code> to install dependencies.</p>

<p>The <code>async/await</code> syntax makes asynchronous code easier to read.</p>

<!-- Variable names -->
<p>Store the result in <code>userData</code> variable.</p>

<!-- File paths -->
<p>Configuration is in <code>/config/site.json</code>.</p>

<!-- Commands -->
<p>Press <code>Ctrl+C</code> to copy.</p>

<!-- Multiple inline codes -->
<p>Compare <code>==</code> (loose equality) vs <code>===</code> (strict equality).</p>

<p>Use <code>let</code> for variables that change, <code>const</code> for constants.</p>
```

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
- `data-language` - Syntax highlighting language
- `data-line-numbers` - Show line numbers

**Examples:**

```html
<!-- Basic code block -->
<pre>
function greet(name) {
  return `Hello, ${name}!`;
}
</pre>

<!-- With line numbers -->
<pre data-line-numbers>
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000);
</pre>

<!-- JavaScript example -->
<pre data-language="javascript">
// Fetch data from API
async function fetchUsers() {
  const response = await fetch('/api/users');
  const users = await response.json();
  return users;
}
</pre>

<!-- HTML example -->
<pre data-language="html">
&lt;article&gt;
  &lt;header&gt;
    &lt;h3&gt;Card Title&lt;/h3&gt;
  &lt;/header&gt;
  &lt;main&gt;
    &lt;p&gt;Card content goes here.&lt;/p&gt;
  &lt;/main&gt;
&lt;/article&gt;
</pre>

<!-- CSS example -->
<pre data-language="css">
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

<!-- JSON example -->
<pre data-language="json">
{
  "name": "wb-starter",
  "version": "2.1.0",
  "description": "Web Behaviors Starter Kit",
  "dependencies": {
    "express": "^4.18.0"
  }
}
</pre>

<!-- Shell commands -->
<pre data-language="bash">
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
</pre>

<!-- Terminal output -->
<pre>
$ npm test

  ✓ button behavior applies correctly
  ✓ card behavior adds hover effects
  ✓ form validates required fields

  3 passing (42ms)
</pre>
```

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
- `data-title` - Card title
- `data-subtitle` - Card subtitle
- `data-content` - Card body content
- `data-footer` - Footer text
- `data-variant` - glass, rack
- `data-clickable` - Make entire card clickable
- `data-hoverable` - Enable hover effects (default: true)
- `data-elevated` - Add elevated shadow

**Examples:**

```html
<!-- Basic semantic card -->
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

<!-- Card with image -->
<article>
  <figure>
    <img src="product.jpg" alt="Product photo">
  </figure>
  <header>
    <h3>Premium Widget</h3>
    <p>$99.99</p>
  </header>
  <main>
    <p>Our best-selling widget with advanced features.</p>
  </main>
  <footer>
    <button data-variant="primary">Add to Cart</button>
  </footer>
</article>

<!-- Glass variant -->
<article data-variant="glass">
  <header>
    <h3>Glassmorphism Card</h3>
  </header>
  <main>
    <p>Beautiful frosted glass effect with blur backdrop.</p>
  </main>
</article>

<!-- Elevated card -->
<article data-elevated>
  <header>
    <h3>Elevated Card</h3>
  </header>
  <main>
    <p>This card has a stronger shadow for emphasis.</p>
  </main>
</article>

<!-- Clickable card -->
<article data-clickable>
  <header>
    <h3>Click Me!</h3>
  </header>
  <main>
    <p>This entire card is clickable and interactive.</p>
  </main>
</article>

<!-- Profile card -->
<article>
  <figure style="text-align: center; padding: 2rem;">
    <img src="avatar.jpg" alt="User avatar" style="width: 80px; height: 80px; border-radius: 50%;">
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

<!-- Blog post card -->
<article>
  <figure>
    <img src="blog-hero.jpg" alt="Blog post hero image">
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

<!-- Pricing card -->
<article data-variant="glass" data-elevated>
  <header style="text-align: center;">
    <h3>Pro Plan</h3>
    <p style="font-size: 2.5rem; font-weight: bold;">$29<small>/mo</small></p>
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
    <button data-variant="primary" data-size="lg" style="width: 100%;">Get Started</button>
  </footer>
</article>

<!-- Feature card -->
<article>
  <header>
    <span style="font-size: 2rem;">🚀</span>
    <h3>Lightning Fast</h3>
  </header>
  <main>
    <p>Optimized for performance with lazy loading and minimal JavaScript overhead.</p>
  </main>
</article>

<!-- Notification/Alert card -->
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

<!-- Stat card -->
<article>
  <main style="text-align: center; padding: 2rem;">
    <p style="font-size: 3rem; font-weight: bold; margin: 0;">2,847</p>
    <p style="color: var(--text-secondary); margin: 0;">Active Users</p>
    <p style="color: var(--success); font-size: 0.875rem;">↑ 12% from last month</p>
  </main>
</article>
```

**Card Grid Example:**
```html
<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
  <article>
    <header><h3>Card 1</h3></header>
    <main><p>First card content.</p></main>
  </article>
  
  <article>
    <header><h3>Card 2</h3></header>
    <main><p>Second card content.</p></main>
  </article>
  
  <article>
    <header><h3>Card 3</h3></header>
    <main><p>Third card content.</p></main>
  </article>
</div>
```

---

### article[data-href] → cardlink
**Module:** `card.js`  
**Element:** `<article data-href="...">` morphs into clickable card

**What it adds:**
- Everything from `card` behavior
- Click handler to navigate to href
- External link indicator (↗) for target="_blank"
- Keyboard support (Enter/Space)
- role="link", tabindex="0"

**Data attributes:**
- `data-href` - URL to navigate to
- `data-target` - _self or _blank
- `data-icon` - Icon before title
- `data-description` - Description text
- `data-badge` - Badge text

**Examples:**

```html
<!-- Internal link card -->
<article data-href="/docs/getting-started">
  <header>
    <h3>📚 Documentation</h3>
  </header>
  <main>
    <p>Complete guide to using WB Behaviors.</p>
  </main>
</article>

<!-- External link card -->
<article data-href="https://github.com/wb-framework" data-target="_blank">
  <header>
    <h3>🐙 GitHub Repository</h3>
  </header>
  <main>
    <p>View source code, report issues, and contribute.</p>
  </main>
</article>

<!-- Navigation cards -->
<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
  <article data-href="/products">
    <header>
      <span style="font-size: 2rem;">🛍️</span>
      <h3>Products</h3>
    </header>
    <main>
      <p>Browse our catalog</p>
    </main>
  </article>
  
  <article data-href="/about">
    <header>
      <span style="font-size: 2rem;">ℹ️</span>
      <h3>About Us</h3>
    </header>
    <main>
      <p>Learn our story</p>
    </main>
  </article>
  
  <article data-href="/contact">
    <header>
      <span style="font-size: 2rem;">📧</span>
      <h3>Contact</h3>
    </header>
    <main>
      <p>Get in touch</p>
    </main>
  </article>
  
  <article data-href="/support">
    <header>
      <span style="font-size: 2rem;">💬</span>
      <h3>Support</h3>
    </header>
    <main>
      <p>Get help</p>
    </main>
  </article>
</div>

<!-- Resource links -->
<article data-href="https://docs.example.com" data-target="_blank">
  <header>
    <h3>API Documentation ↗</h3>
    <span data-wb="badge" data-variant="primary">New</span>
  </header>
  <main>
    <p>Complete API reference with examples and best practices.</p>
  </main>
</article>

<article data-href="https://www.youtube.com/watch?v=..." data-target="_blank">
  <figure>
    <img src="video-thumbnail.jpg" alt="Tutorial video">
  </figure>
  <header>
    <h3>Video Tutorial ↗</h3>
  </header>
  <main>
    <p>Watch our step-by-step guide on YouTube.</p>
  </main>
</article>
```

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
- If `data-items` provided: generates content from data
- If no data-items: enhances existing `<ul>` and links

**Data attributes:**
- `data-brand` - Brand/logo text
- `data-items` - Comma-separated nav items
- `data-sticky` - Enable sticky positioning

**Examples:**

```html
<!-- Basic semantic navbar -->
<nav>
  <a href="/" style="font-weight: bold; font-size: 1.25rem;">MyBrand</a>
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
    <li><a href="/services">Services</a></li>
    <li><a href="/contact">Contact</a></li>
  </ul>
</nav>

<!-- With logo image -->
<nav>
  <a href="/">
    <img src="logo.svg" alt="Company Logo" height="32">
  </a>
  <ul>
    <li><a href="/products">Products</a></li>
    <li><a href="/pricing">Pricing</a></li>
    <li><a href="/docs">Docs</a></li>
    <li><a href="/login">Login</a></li>
  </ul>
</nav>

<!-- Generated navbar -->
<nav data-brand="WB Behaviors" data-items="Home, Features, Docs, Pricing, Contact">
</nav>

<!-- Sticky navbar -->
<nav data-brand="MySite" data-items="Home, About, Blog, Contact" data-sticky>
</nav>

<!-- Full featured navbar -->
<nav>
  <div style="display: flex; align-items: center; gap: 1rem;">
    <a href="/" style="font-weight: bold;">🚀 AppName</a>
    <span style="font-size: 0.75rem; background: var(--primary); color: white; padding: 0.125rem 0.5rem; border-radius: 4px;">Beta</span>
  </div>
  
  <ul>
    <li><a href="/dashboard">Dashboard</a></li>
    <li><a href="/projects">Projects</a></li>
    <li><a href="/team">Team</a></li>
    <li><a href="/settings">Settings</a></li>
  </ul>
  
  <div style="display: flex; align-items: center; gap: 0.5rem;">
    <button data-variant="ghost" data-size="sm">🔔</button>
    <img src="avatar.jpg" alt="Profile" style="width: 32px; height: 32px; border-radius: 50%;">
  </div>
</nav>

<!-- E-commerce navbar -->
<nav>
  <a href="/">ShopName</a>
  
  <ul>
    <li><a href="/new">New Arrivals</a></li>
    <li><a href="/women">Women</a></li>
    <li><a href="/men">Men</a></li>
    <li><a href="/sale">Sale 🔥</a></li>
  </ul>
  
  <div style="display: flex; gap: 0.5rem;">
    <input type="search" placeholder="Search..." data-size="sm" style="width: 200px;">
    <button data-variant="ghost">❤️</button>
    <button data-variant="ghost">🛒 (3)</button>
  </div>
</nav>

<!-- Documentation navbar -->
<nav>
  <a href="/">
    <strong>WB Docs</strong>
    <span style="opacity: 0.7; font-size: 0.875rem; margin-left: 0.5rem;">v2.1.0</span>
  </a>
  
  <ul>
    <li><a href="/guides">Guides</a></li>
    <li><a href="/api">API Reference</a></li>
    <li><a href="/examples">Examples</a></li>
    <li><a href="/changelog">Changelog</a></li>
  </ul>
  
  <div style="display: flex; gap: 0.5rem;">
    <a href="https://github.com/wb" target="_blank">GitHub</a>
    <button data-variant="primary" data-size="sm">Get Started</button>
  </div>
</nav>
```

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
- Generates content from `data-items`

**Data attributes:**
- `data-items` - Comma-separated menu items
- `data-active` - Currently active item
- `data-collapsed` - Start in collapsed state

**Examples:**

```html
<!-- Basic sidebar -->
<aside data-items="Dashboard, Projects, Team, Settings" data-active="Dashboard">
</aside>

<!-- Semantic sidebar -->
<aside>
  <nav>
    <a href="/dashboard" class="active">📊 Dashboard</a>
    <a href="/projects">📁 Projects</a>
    <a href="/team">👥 Team</a>
    <a href="/analytics">📈 Analytics</a>
    <a href="/settings">⚙️ Settings</a>
  </nav>
</aside>

<!-- Sidebar with sections -->
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

<!-- Documentation sidebar -->
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

<!-- Admin sidebar with icons -->
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
```

**Layout with Sidebar:**
```html
<div style="display: flex; min-height: 100vh;">
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
</div>
```

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
| `<article data-href>` | cardlink | card.js |
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

```html
<!-- Basic 3-column grid -->
<wb-grid columns="3" gap="1rem">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</wb-grid>

<!-- Responsive grid with min-width -->
<wb-grid min-width="250px" gap="2rem">
  <article>Card 1</article>
  <article>Card 2</article>
  <article>Card 3</article>
  <article>Card 4</article>
</wb-grid>
```

### wb-flex / wb-row

```html
<!-- Horizontal layout -->
<wb-flex gap="1rem" justify="space-between">
  <div>Left</div>
  <div>Right</div>
</wb-flex>

<!-- Button row (wb-row is alias for flex) -->
<wb-row gap="0.5rem" justify="flex-end">
  <button data-variant="ghost">Cancel</button>
  <button data-variant="primary">Save</button>
</wb-row>
```

### wb-stack / wb-column

```html
<!-- Vertical stack -->
<wb-stack gap="1rem">
  <input type="text" placeholder="Name">
  <input type="email" placeholder="Email">
  <button>Submit</button>
</wb-stack>

<!-- wb-column is alias for stack -->
<wb-column gap="1rem">
  <h3>Title</h3>
  <p>Content</p>
</wb-column>
```

### wb-container

```html
<!-- Centered content with max-width -->
<wb-container max-width="800px" padding="2rem">
  <h1>Article Title</h1>
  <p>Content goes here...</p>
</wb-container>

<!-- Multi-column grid mode -->
<wb-container columns="2" gap="2rem">
  <div>Left column</div>
  <div>Right column</div>
</wb-container>
```

### wb-center

```html
<!-- Max-width centering -->
<wb-center max-width="600px">
  <h1>Centered Heading</h1>
</wb-center>

<!-- Intrinsic centering (based on content width) -->
<wb-center intrinsic>
  <button data-variant="primary">Centered Button</button>
</wb-center>
```

### wb-cover

```html
<!-- Full-screen hero with vertical centering -->
<wb-cover min-height="100vh">
  <header>Logo</header>
  <div data-principal>
    <h1>Main Content</h1>
    <p>This is vertically centered</p>
  </div>
  <footer>Scroll down ↓</footer>
</wb-cover>
```

### wb-sidebar

```html
<!-- Two-column layout with sidebar -->
<wb-sidebar side="left" side-width="250px" gap="2rem">
  <aside>
    <nav>Sidebar navigation</nav>
  </aside>
  <main>
    <h1>Main Content</h1>
  </main>
</wb-sidebar>
```

### wb-masonry

```html
<!-- Pinterest-style masonry -->
<wb-masonry columns="3" gap="1rem">
  <img src="tall.jpg" alt="">
  <img src="wide.jpg" alt="">
  <img src="square.jpg" alt="">
  <img src="tall2.jpg" alt="">
</wb-masonry>
```

### wb-reel

```html
<!-- Horizontal scroll carousel -->
<wb-reel item-width="300px" gap="1rem">
  <article>Card 1</article>
  <article>Card 2</article>
  <article>Card 3</article>
  <article>Card 4</article>
</wb-reel>
```

### wb-frame

```html
<!-- 16:9 video frame -->
<wb-frame ratio="16/9">
  <iframe src="https://youtube.com/embed/..."></iframe>
</wb-frame>

<!-- Square avatar frame -->
<wb-frame ratio="1/1">
  <img src="avatar.jpg" alt="User">
</wb-frame>
```

### wb-sticky

```html
<!-- Sticky header -->
<wb-sticky top="0" z-index="100">
  <header>This stays at top when scrolling</header>
</wb-sticky>
```

### wb-drawer

```html
<!-- Collapsible sidebar drawer -->
<wb-drawer position="left" width="250px" resizable save-state id="mainNav">
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
  </nav>
</wb-drawer>
```

---

## Card Custom Tags Examples

All card tags use `card-*` prefix for easy autocomplete and grouping:

```html
<!-- Basic card -->
<card-basic>
  <h3>Card Title</h3>
  <p>Card content goes here.</p>
</card-basic>

<!-- Image card -->
<card-image
  data-src="photo.jpg"
  data-title="Beautiful Sunset"
  data-alt="Sunset over mountains">
</card-image>

<!-- Profile card -->
<card-profile 
  data-avatar="avatar.jpg"
  data-name="Jane Doe"
  data-title="Senior Developer"
  data-bio="Full-stack developer with 10+ years experience.">
</card-profile>

<!-- Pricing card -->
<card-pricing
  data-plan="Pro"
  data-price="$29"
  data-period="/month"
  data-features="Unlimited projects, Priority support, API access"
  data-cta="Get Started"
  data-popular="true">
</card-pricing>

<!-- Product card -->
<card-product
  data-image="product.jpg"
  data-title="Widget Pro"
  data-price="$99.99"
  data-rating="4.5"
  data-reviews="128">
</card-product>

<!-- Stats card -->
<card-stats
  data-value="2,847"
  data-label="Active Users"
  data-change="+12%"
  data-trend="up">
</card-stats>

<!-- Testimonial card -->
<card-testimonial
  data-quote="This product changed everything!"
  data-author="John Smith"
  data-role="CEO, TechCorp"
  data-avatar="john.jpg">
</card-testimonial>

<!-- Hero card -->
<card-hero
  data-title="Welcome"
  data-subtitle="Get started today"
  data-image="hero-bg.jpg"
  data-cta="Learn More"
  data-href="/start">
</card-hero>

<!-- Video card -->
<card-video
  data-src="demo.mp4"
  data-poster="poster.jpg"
  data-title="Product Demo">
</card-video>

<!-- File card -->
<card-file
  data-filename="report.pdf"
  data-size="2.4 MB"
  data-icon="📄"
  data-href="/downloads/report.pdf">
</card-file>

<!-- Notification card -->
<card-notification
  data-type="success"
  data-title="Payment Received"
  data-message="Your payment of $99.00 was successful."
  data-time="2 minutes ago">
</card-notification>

<!-- Portfolio card -->
<card-portfolio
  data-image="project.jpg"
  data-title="E-commerce Redesign"
  data-category="Web Design"
  data-href="/portfolio/ecommerce">
</card-portfolio>

<!-- Link card (clickable) -->
<card-link 
  data-href="/docs" 
  data-title="Documentation"
  data-description="Learn how to use the framework"
  data-icon="📚">
</card-link>

<!-- Horizontal card -->
<card-horizontal
  data-image="thumb.jpg"
  data-title="Article Title"
  data-description="Brief description of the article...">
</card-horizontal>

<!-- Overlay card -->
<card-overlay
  data-image="background.jpg"
  data-title="Overlay Title"
  data-subtitle="Text appears over the image">
</card-overlay>
```

---

## Attribute Shortcuts Examples

These work on ANY element and are always active:

```html
<!-- Tooltip on any element -->
<button tooltip="Save your work">💾 Save</button>
<span tooltip="Click for more information">ℹ️</span>
<a href="/" tooltip="Go to homepage">Home</a>

<!-- Toast message on click -->
<button toast-message="Copied to clipboard!">📋 Copy</button>
<button toast-message="Item added to cart">🛒 Add to Cart</button>

<!-- Ripple effect on any clickable element -->
<div ripple style="padding: 2rem; cursor: pointer;">
  Click anywhere for ripple effect
</div>
<a href="/" ripple>Ripple Link</a>

<!-- Badge on any element -->
<span badge="3">🔔 Notifications</span>
<button badge="New">✨ Features</button>
<a href="/inbox" badge="99+">📧 Inbox</a>
```

---

## Version

- **Document Version:** 3.3.0
- **Last Updated:** January 2, 2026
