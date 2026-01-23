# Page Builder Onboarding Flow

## New User Experience (Polished Flow)

### Step 1: Pick a Template
User opens builder → Sidebar shows templates categorized by type
- Landing Pages
- Portfolio
- Blog
- Dashboard
- Business

**OR** User clicks "Start Blank" for empty canvas

### Step 2: Template Loads → Hints Appear

When a template loads, the onboarding system shows contextual hints:

```
┌──────────────────────────────────────────────┐
│  ✨ Click any text to edit it directly on the canvas │
└──────────────────────────────────────────────┘
```

After first edit:
```
┌──────────────────────────────────────────────┐
│ 🎯 Great! Keep customizing to make it yours        │
└──────────────────────────────────────────────┘
```

When ready (3+ components):
```
┌──────────────────────────────────────────────┐
│ 🚀 Looking good! Click "Export" when ready to save │
└──────────────────────────────────────────────┘
```

### Step 3: Visual Editing Cues

- **Hover effect**: Editable elements show dashed purple outline
- **First-time tooltip**: "Click to edit" appears on first hover
- **Smooth transitions**: All highlights animate smoothly

### Step 4: Export Modal

When user clicks "Finish & Export" button (appears after adding content):

```
┌──────────────────────────────┐
│              🎉 Your Page is Ready!               │
│                5 components built                │
│                                                  │
│  ┌────────────┐  ┌────────────┐                   │
│  │ 👁️ Preview  │  │📄 Download │  ← Primary       │
│  │            │  │    HTML    │                   │
│  └────────────┘  └────────────┘                   │
│                                                  │
│  ┌────────────┐  ┌────────────┐                   │
│  │ 📦 Export   │  │ 📋 Copy     │                   │
│  │   JSON     │  │    HTML    │                   │
│  └────────────┘  └────────────┘                   │
│                                                  │
│              [ Keep Editing ]                    │
└──────────────────────────────┘
```

## Files Modified/Created

| File | Purpose |
|------|---------|
| `builder-onboarding.js` | **NEW** - Hint system, export modal, editable highlights |
| `builder-template-browser.js` | Triggers onboarding after template load |
| `builder-welcome.js` | Triggers onboarding after template selection |
| `index.js` | Imports onboarding module |

## Features

### Hint System
- Shows hints based on user progress
- Each hint shows only once (stored in localStorage)
- Queue system prevents hint overlap
- Dismissible with ✕ button

### Export CTA
- Floating "Finish & Export" button appears after content is added
- Pulses when page has 3+ components
- Opens beautiful export modal with all options

### Visual Editing
- Hover highlights on editable elements
- "Click to edit" tooltip on first hover
- Tracks first edit and shows encouragement

## How to Reset Hints (for testing)

Open console and run:
```javascript
window.resetOnboardingHints()
```

## Flow State Machine

```
EMPTY → EDITING → READY
  ↓        ↓        ↓
  No     1-2       3+
content  comps    comps
```

Each state transition triggers appropriate hints.

---

*Created: January 2, 2026*
