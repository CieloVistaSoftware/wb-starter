# Page Builder Workflow System

## Overview

The workflow system guides new users through creating their first page while respecting existing work. It follows a progressive disclosure approach - revealing features as users need them.

## Key Principle

**Workspace always loads first.** The workflow wizard is an overlay that doesn't block access to existing work.

## User Flows

### First-Time Visitor (No Saved Work)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│           🎨 What do you want to create?                        │
│                                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │   📄    │  │   🌐    │  │   🧩    │  │   🎨    │            │
│  │ A Page  │  │ Website │  │Component│  │ A Style │            │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │
│                                                                 │
│  ┌─────────┐  ┌─────────┐                                      │
│  │   ⚡    │  │   🔍    │                                      │
│  │   JS    │  │ Explore │                                      │
│  └─────────┘  └─────────┘                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼ (selects "A Page")
          │
┌─────────────────────────────────────────────────────────────────┐
│  ← Back                                                         │
│                                                                 │
│           📄 What kind of page?                                 │
│                                                                 │
│  🚀 Landing    💼 Portfolio    📝 Blog    📞 Contact            │
│  💰 Pricing    👋 About        ✨ Other                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼ (selects "Landing Page")
          │
     [Workflow closes]
     [Template browser opens]
     [Toast: "Showing Landing Page templates"]
     [Indicator widget appears in corner]
```

### Returning Visitor (Has Saved Work)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│           👋 Welcome back!                                      │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  📄  SaaS Landing Page                                     │ │
│  │      5 components • Last edited 2 hours ago                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [▶ Continue Working]        [🔄 Start Something New]          │
│                                                                 │
│  Your work is already loaded on the canvas behind this dialog. │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Continue Working:** Closes overlay, shows indicator, work is already loaded.

**Start Something New:**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│           What about your current work?                         │
│           "SaaS Landing Page" has 5 components                  │
│                                                                 │
│           [💾 Save Backup & Start New]                          │
│           [🗑️ Discard & Start New]                              │
│           [← Keep Working]                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Workflow Indicator Widget

A small persistent widget in the bottom-left corner shows current workflow context:

```
┌──────────────────────┐
│ 📄 Landing Page  ▼   │
└──────────────────────┘
```

Click to show menu:
- 🔄 Start something new
- ⌨️ Keyboard shortcuts  
- ❓ Help & tips

## Workflow Options

### 📄 A Page
Single-page templates: Landing, Portfolio, Blog, Contact, Pricing, About

### 🌐 A Website  
Multi-page templates: Business, Personal, Store, Restaurant, Dashboard

### 🧩 A Component
Individual components: Card, Hero, Form, Pricing Table, Testimonials, Stats, CTA, Footer

### 🎨 A Style
Opens theme editor for colors, fonts, and visual customization

### ⚡ JavaScript
Interactive effect demos: Confetti, Snow, Animations, Ripple, Parallax, Lazy Loading, Carousel

### 🔍 Just Explore
Opens full builder with all sidebars visible, minimal guidance

## Files

| File | Purpose |
|------|---------|
| `src/builder/builder-workflow.js` | Main workflow system |
| `src/builder/index.js` | Imports and initializes workflow |
| `docs/builder-workflow.md` | This documentation |

## State Management

Workflow state is stored in `localStorage` under key `wb-builder-workflow`:

```javascript
{
  intent: 'page',           // page | website | component | style | javascript | explore
  intentName: 'A Page',
  subtype: 'landing',       // Type within intent
  typeName: 'Landing Page',
  lastModified: '2025-01-02T...'
}
```

Session flag `wb-workflow-shown` prevents re-showing the wizard on page refresh.

## Global Functions

```javascript
window.showWorkflowPicker()  // Open workflow wizard
window.hideWorkflow()        // Close workflow wizard
window.wfChangeWorkflow()    // Restart from intent picker
window.wfContinue()          // Continue with existing work
window.wfSaveAndNew()        // Export JSON, then start fresh
window.wfDiscardAndNew()     // Clear canvas, start fresh
```

## Integration with Onboarding

After workflow selection, the onboarding system takes over with contextual hints:
1. Template loads → "Click any text to edit"
2. First edit → "Great! Keep customizing"
3. 3+ components → "Looking good! Click Export when ready"

## Design Decisions

1. **Workspace loads first** - User's work is never blocked
2. **Progressive disclosure** - Don't overwhelm new users
3. **Escape hatches** - Always allow skipping or going back
4. **Context preservation** - Remember what user was building
5. **Non-destructive** - Always offer to save before clearing
