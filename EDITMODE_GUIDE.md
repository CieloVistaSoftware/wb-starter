# 🎨 EditMode Guide - Live Content Editing

## Overview

EditMode allows you to edit your site content directly on the live pages without needing a separate form. Just click on any text, edit it inline, and save!

---

## ⚡ Quick Start

### 1. Enable EditMode

In `config/site.json`, find the `site` section and set `editMode` to `true`:

```json
{
  "site": {
    "name": "Acme Co",
    "editMode": true
  }
}
```

### 2. Visit Your Site

Navigate to:
```
http://localhost:3000/builder.html
```

### 3. Edit Content

- Text elements will show a **blue dashed outline** when you hover
- Click any text to edit it
- The toolbar at the bottom shows "✅ Save Changes" and "❌ Cancel"

### 4. Save Your Changes

Click **"✅ Save Changes"** to persist your edits to `config/site.json`

---

## 📝 What You Can Edit

All content in your site comes from `config/site.json`:

### Company Info
- Company name
- Tagline
- Description
- Value proposition

### Contact Info
- Email
- Phone
- Address
- Business hours

### Services
- Service icons (emoji)
- Service names
- Service descriptions

### Team Members
- Names
- Roles
- Bios
- Avatar emojis

### Testimonials
- Customer quotes
- Customer names
- Company/title

### FAQ
- Questions
- Answers

### Footer
- Copyright text

---

## 🎯 How EditMode Works

### Enabled (editMode: true)
```
✅ All text is clickable and editable
✅ Blue dashed outline shows what's editable
✅ Toolbar appears with Save/Cancel buttons
✅ Changes persist to site.json
```

### Disabled (editMode: false)
```
✅ Site is read-only
✅ No outlines or editing hints
✅ Toolbar is hidden
✅ Changes cannot be made
```

---

## 📋 The Data Structure

Everything in your site is stored in `config/site.json`:

```json
{
  "site": {
    "name": "Acme Co",
    "editMode": true
  },
  
  "company": {
    "name": "Acme Co",
    "tagline": "Building the future",
    "description": "...",
    "valueProposition": "..."
  },

  "contact": {
    "email": "hello@acmeco.com",
    "phone": "+1 (234) 567-890",
    "address": "...",
    "hours": "Monday - Friday: 9am - 6pm EST"
  },

  "services": [
    {
      "icon": "🎨",
      "name": "Web Design",
      "description": "..."
    },
    // ... more services
  ],

  "team": [
    {
      "avatar": "👩‍💼",
      "name": "Sarah Johnson",
      "role": "CEO",
      "bio": "..."
    },
    // ... more team members
  ],

  "testimonials": [
    {
      "quote": "...",
      "name": "John Doe",
      "company": "ABC Corp"
    }
  ],

  "faq": [
    {
      "question": "What is your pricing?",
      "answer": "..."
    }
  ]
}
```

---

## 🔄 Edit Workflow

1. **Edit Mode Enabled** → Site shows in EditMode
   ```
   http://localhost:3000/builder.html
   ```

2. **Click Text to Edit**
   - Elements highlight with blue dashed outline
   - Cursor shows you can edit
   - Changes happen in real-time

3. **Save or Cancel**
   - **Save Changes**: Saves to `config/site.json`
   - **Cancel**: Discards all changes and reloads page

4. **Changes Persist**
   - After saving, refresh the page
   - Your changes remain

---

## 🎨 Visual Editing Indicators

### Editable Elements
```
[Blue dashed outline] + [Background tint]
```

### On Hover
```
[Outline becomes darker]
[Background tint increases]
```

### On Focus
```
[Solid blue outline]
[Darker background]
[Cursor is in edit mode]
```

---

## 📱 EditMode on Different Pages

EditMode works on **all pages**:

- **Home** (`?page=home`)
  - Edit company name, tagline
  - Edit value proposition
  - Edit contact info

- **About** (`?page=about`)
  - Edit description
  - Edit team member info

- **Services** (`?page=services`)
  - Edit service names & descriptions
  - Edit testimonials
  - Edit FAQ items

---

## ⚙️ Toggle EditMode

### To Enable EditMode
Edit `config/site.json`:
```json
"site": {
  "editMode": true
}
```

### To Disable EditMode
Edit `config/site.json`:
```json
"site": {
  "editMode": false
}
```

When disabled:
- ✅ Site is read-only
- ✅ No editing hints
- ✅ Toolbar hidden
- ✅ Perfect for production

---

## 🛟 Tips & Tricks

### Quick Edit Workflow
1. Visit `/builder.html`
2. Click any text with blue outline
3. Type your changes
4. Click "Save Changes" at bottom right
5. Done! Changes are saved

### Making Multiple Changes
- You can edit multiple elements before saving
- All changes are batched together
- One click to save everything

### Reverting Changes
- Click "Cancel" to discard all unsaved changes
- The page reloads with original content

### No Page Refresh Needed
- After saving, navigate between pages
- Your changes appear immediately
- No need to manually refresh

---

## 🔐 Production Setup

For a **production website**:

1. **Set editMode to false** in `config/site.json`
2. All content is locked and read-only
3. No editing toolbar appears
4. Perfect for customer-facing sites

For **admin editing**:

1. **Set editMode to true** during development
2. Make content changes
3. Save to site.json
4. Set editMode to false for production
5. Deploy with finalized content

---

## 📊 Example: Editing a Service

### Step 1: Enable EditMode
```json
"site": { "editMode": true }
```

### Step 2: Go to Services Page
```
http://localhost:3000/builder.html?page=services
```

### Step 3: Click on Service Card
```
[Click on "Web Design" text]
→ Blue outline appears
→ Text becomes editable
```

### Step 4: Edit the Name
```
🎨 Web Design
↓ (Edit)
🎨 Custom Web Solutions
```

### Step 5: Click Save
```
[Click "✅ Save Changes" button]
↓
Changes saved to config/site.json
↓
Service name is now "Custom Web Solutions"
```

---

## 🚀 Best Practices

✅ **Do:**
- Edit content regularly with EditMode enabled
- Review changes before saving
- Disable EditMode in production
- Backup site.json before major changes

❌ **Don't:**
- Leave EditMode enabled on production sites
- Edit HTML structure (only edit text content)
- Make large formatting changes through EditMode
- Forget to save before navigating away

---

## 🐛 Troubleshooting

### Changes aren't saving?
- Check browser console for errors
- Verify server is running
- Check file permissions on config/site.json

### Elements not editable?
- Verify EditMode is set to `true` in site.json
- Check browser cache (Ctrl + Shift + R)
- Reload the page

### Toolbar not visible?
- EditMode must be enabled in site.json
- Check browser console for JavaScript errors
- Try a different page

---

## 📝 Files & Locations

```
C:\Users\jwpmi\Downloads\AI\wb-starter\
├── builder.html              ← Main site (reads from site.json)
├── config/
│   └── site.json            ← All your content & EditMode setting
├── src/api/
│   └── save-config.js       ← API endpoint for saving
└── pages/                    ← (Legacy, not used with EditMode)
```

---

## ✨ Summary

**EditMode is the easiest way to manage your site content:**

1. ✅ Edit text directly on the live site
2. ✅ No separate admin panel needed
3. ✅ Changes saved to config/site.json
4. ✅ Toggle on/off with one setting
5. ✅ Perfect for small teams or solo founders

**Current Status:**
- ✅ EditMode is **enabled** by default
- ✅ Visit `http://localhost:3000/builder.html` to start editing
- ✅ Content is powered by `config/site.json`
- ✅ All changes are automatic and persistent

---

*Last Updated: 2025-01-12*
