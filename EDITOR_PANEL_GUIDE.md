# 🎨 Professional Editor Panel Guide

## What's New

Your site now has a **professional editor panel** on the left side when EditMode is enabled!

---

## 🎯 Editor Panel Features

### 1️⃣ **Save & Cancel**
- **💾 Save Site** - Save all your changes to `config/site.json`
- **↩️ Cancel** - Discard all unsaved changes

### 2️⃣ **Theme Selector**
- **🌙 Dark Theme** - Dark mode (default)
- **☀️ Light Theme** - Light mode
- Click to switch themes instantly

### 3️⃣ **Pages Section**
- Shows all your pages: Home, About, Services
- Click any page to navigate
- Current page is highlighted
- **+ Add Page** - Add new pages (coming soon)

### 4️⃣ **Site Settings**
- **Site Name** - Edit your company name
- **Tagline** - Edit your tagline/slogan
- Changes update live

### 5️⃣ **Editor Mode Toggle**
- Turn Edit Mode on/off
- When OFF → Site becomes read-only
- Perfect for locking down production sites

### 6️⃣ **Advanced Options**
- **📥 Export Config** - Download your site config as JSON
- **🔄 Reset Defaults** - Reset to default content (coming soon)

---

## 📍 Editor Panel Location

**Desktop:** Left sidebar (320px wide)
- Always visible when EditMode is true
- Can be toggled with the ✏️ button
- Auto-adjusts content area

**Mobile:** Bottom panel
- Slides up from bottom
- Can be dismissed
- ✏️ floating button to reopen

---

## 🎬 How to Use

### 1. Start Your Server
```bash
npm run dev
```

### 2. Visit the Editor
```
http://localhost:3000/builder.html
```

### 3. You'll See the Editor Panel
- Left sidebar with all controls
- ✏️ button in bottom right (when panel is closed)
- Status messages at top of panel

### 4. Edit Your Content

**Option A: Edit in Panel**
- Change Site Name and Tagline in the panel
- Changes apply immediately

**Option B: Edit on Page**
- Click any text with blue dashed outline
- Type your changes
- Changes are tracked

### 5. Save Your Changes
- Click **"💾 Save Site"** button
- Status message confirms save
- Changes persist to `config/site.json`

---

## 🔄 Workflow Example

### Editing Your Site

1. **Go to editor**
   ```
   http://localhost:3000/builder.html
   ```

2. **See the panel** on the left with all controls

3. **Change site name**
   - Type in "Site Name" field in panel
   - Header updates in real-time

4. **Edit page content**
   - Click text on the page (blue outline)
   - Make changes
   - Changes appear immediately

5. **Switch themes**
   - Click "Light" button in Theme section
   - Entire site switches to light mode

6. **Navigate pages**
   - Click "Home", "About", or "Services" in Pages section
   - Page loads with all content

7. **Save everything**
   - Click "💾 Save Site"
   - All changes saved
   - Status message confirms

8. **Done!**
   - Refresh page → changes persist
   - Set `editMode: false` when done
   - Deploy to production

---

## 🔐 Production Mode

### Before Deploying

1. **Test thoroughly**
   - Make sure all edits are correct
   - Navigate all pages

2. **Export backup**
   - Click "📥 Export Config"
   - Save the JSON file

3. **Disable EditMode**
   - Toggle "Edit Mode Enabled" OFF
   - Save the site
   - ✅ Site is now locked down

4. **Deploy**
   - Site is read-only
   - No editing interface
   - Perfect for customers

---

## 💾 File Locations

```
config/
└── site.json              ← All content + EditMode flag

builder.html              ← Main editor & site

src/api/
└── save-config.js       ← Saves config changes
```

---

## 🎨 Visual Guide

### Editor Panel (Left Side)
```
┌─────────────────────────┐
│ ✏️ Editor         ✕     │
├─────────────────────────┤
│ ✅ Status message       │
├─────────────────────────┤
│ [💾 Save Site]          │
│ [↩️ Cancel]             │
├─────────────────────────┤
│ 🎨 Theme                │
│ [🌙 Dark] [☀️ Light]   │
│ Edit Mode: ON           │
├─────────────────────────┤
│ 📄 Pages                │
│ [🏠 Home] ← current    │
│ [ℹ️ About]              │
│ [✨ Services]           │
│ [+ Add Page]            │
├─────────────────────────┤
│ ⚙️ Site Settings        │
│ Site Name: [______]     │
│ Tagline: [_______]      │
├─────────────────────────┤
│ 🔐 Editor Mode          │
│ [✓] Edit Mode Enabled   │
│ (description...)        │
├─────────────────────────┤
│ ⚡ Advanced             │
│ [📥 Export Config]      │
│ [🔄 Reset Defaults]     │
└─────────────────────────┘
```

---

## ⌨️ Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Toggle Panel | Press `✏️` button |
| Save Changes | Click button (no shortcut yet) |
| Cancel Changes | Click button |
| Edit Mode | Toggle in panel |

---

## 🐛 Troubleshooting

### Panel isn't visible?
- Check if EditMode is enabled in `config/site.json`
- Should have `"editMode": true`
- Reload page with Ctrl+Shift+R

### Changes aren't saving?
- Check browser console (F12)
- Verify server is running
- Check network tab for /api/save-config

### Text not editable?
- Text needs blue dashed outline
- EditMode must be enabled
- Reload page

### Changes keep disappearing?
- Make sure to click "💾 Save Site"
- Without saving, changes are lost on refresh

---

## ✨ Current Status

✅ **Editor Panel Complete**
- Save/Cancel buttons
- Theme selector (Dark/Light)
- Pages navigation
- Site settings (name, tagline)
- Edit mode toggle
- Advanced options (export)
- Professional styling
- Responsive design

🚀 **Ready to Use**
- EditMode is enabled by default
- Visit `/builder.html` to start editing
- All changes saved to `config/site.json`
- Can be disabled anytime for production

---

## 🎯 Next Steps

1. **Visit your editor:**
   ```
   http://localhost:3000/builder.html
   ```

2. **Make changes** using the panel or inline editing

3. **Save your site** with the Save button

4. **Set EditMode to false** when ready for production

---

## 📚 More Resources

- `EDITMODE_GUIDE.md` - Detailed inline editing guide
- `EDITMODE_SETUP.md` - Setup and architecture
- `CUSTOMER_READY.md` - Deployment guide

---

*Editor Panel Created: 2025-01-12*
*Status: ✅ Ready to Use*
