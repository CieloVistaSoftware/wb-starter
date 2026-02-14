
# Component Wizard User Guide

## What is the Component Wizard?
The Component Wizard is a visual tool for building, configuring, and previewing WB custom elements. It lets you assemble components, adjust their properties, and see live HTML output—no coding required.

**Location:**
- Open `demos/wizard.html` in your browser (double-click or drag into Chrome/Edge/Firefox)

---

## Wizard UI Overview

- **Tabs:**
  - **Build:** Main workspace for assembling and configuring components
  - **Preview:** Live rendering of your assembled component stack

- **Component Picker:** Dropdown to select a WB component to add/configure
- **Stack List:** Shows the list (stack) of components you’ve added. You can select, duplicate, or remove items here.
- **Properties Panel:** Edit all properties of the selected component. Use “More Properties” to reveal advanced options.
- **Presets:** Quick property sets for common configurations (if available)
- **Code Sample:** Shows the generated HTML for your current stack—copy with one click
- **Preview Actions:**
  - **Copy HTML:** Copies the code sample to clipboard
  - **Clear Preview:** Removes all components from the stack
- **Container Mode:** Lets you add children inside container components (like layouts, cards, etc.)

---

## Step-by-Step: Building with the Wizard

1. **Open the Wizard**
   - Open `demos/wizard.html` in your browser.

2. **Pick a Component**
   - Use the dropdown at the top left to select a component (e.g., wb-card, wb-button).
   - The properties panel will update with editable fields for that component.

3. **Configure Properties**
   - Fill in or adjust properties in the right panel. Use “More Properties” for advanced options.
   - Presets (if available) let you quickly apply common settings.

4. **Add to Stack**
   - When you select a component, it’s added to the stack list on the left.
   - You can select any item in the stack to edit or duplicate it.

5. **Container Mode (Optional)**
   - Some components (like layouts or cards) can contain other components.
   - Click “Enter” on a container in the stack to add children inside it.
   - Exit container mode to return to the main stack.

6. **Preview & Export**
   - Switch to the “Preview” tab to see a live rendering of your stack.
   - The “Code Sample” box always shows the HTML for your current stack—click “Copy HTML” to use it elsewhere.

7. **Clear or Reset**
   - Use “Clear Preview” to remove all components and start over.

---

## Tips & Troubleshooting

- **Nothing shows up?**
  - Make sure you’ve selected a component and configured required properties.
  - Check the stack list—at least one item should be present.
- **Can’t edit properties?**
  - Select a component in the stack to unlock its property panel.
- **Container mode confusion?**
  - The banner at the top will tell you when you’re adding inside a container. Click “Exit Container” to return.
- **Direct HTML test:**
  - The wizard includes a direct test for `<wb-audio>` at the bottom of the build panel.
- **State is saved:**
  - The wizard auto-saves your stack and restores it on reload.

---

## Advanced: How It Works

- **Schemas:**
  - Component schemas live in `src/wb-models/` and define available properties.
- **ViewModel:**
  - All logic is in `demos/wizard/main.js` and related files.
- **Preview:**
  - The preview tab uses an iframe for full isolation.
- **Customizing:**
  - To add new components, update the schemas and ensure they’re loaded by the wizard.

---

## Related Files

- `demos/wizard.html` — Main UI
- `demos/wizard/main.js` — Logic and state
- `demos/wizard/stack.js` — Stack management
- `demos/wizard/wizard.css` — Styles
- `src/wb-models/` — Component schemas

---

For more help, see the code comments in `main.js` and `stack.js`, or ask the WB team.
