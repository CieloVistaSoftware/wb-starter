# Card Profile

A profile card displaying user information with avatar, name, role, and optional bio. Perfect for team pages, user directories, and social features.

## Overview

| Property | Value |
|----------|-------|
| Behavior | `cardprofile` |
| Semantic | `<article>` |
| Base Class | `wb-card wb-card--profile` |
| Category | Cards |
| Icon | 👤 |

## Inheritance

```
article (semantic) → card.base → cardprofile
```

Card Profile **IS-A** card, inheriting semantic structure.

### Containment (HAS-A)

| Element | Description |
|---------|-------------|
| Cover | Optional banner image |
| Avatar | Profile picture in figure |
| Identity | Name and role in header |
| Bio | Biography paragraph |

## Properties

### Inherited from Card Base

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `elevated` | boolean | `false` | Add drop shadow |
| `hoverable` | boolean | `true` | Enable hover effects |

### Card Profile Specific

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | string | **required** | Person's name |
| `role` | string | `"Designer"` | Job title or role |
| `avatar` | string | `"https://i.pravatar.cc/80?img=1"` | Avatar image URL |
| `bio` | string | `""` | Short biography |
| `cover` | string | `""` | Cover/banner image URL |
| `size` | enum | `"md"` | Avatar size |
| `align` | enum | `"center"` | Content alignment |
| `hoverText` | string | `""` | Tooltip text shown on hover |

### Size Options

| Value | Description | Avatar Size |
|-------|-------------|-------------|
| `sm` | Small | 48px |
| `md` | Medium (default) | 80px |
| `lg` | Large | 120px |

### Alignment Options

| Value | Description |
|-------|-------------|
| `left` | Left-aligned content |
| `center` | Centered content (default) |

## Usage

### Basic Profile

<article data-wb="cardprofile" data-name="John Doe"></article>

```html
<article data-wb="cardprofile" data-name="John Doe"></article>
```

### Profile with Role

<article data-wb="cardprofile"
         data-name="Jane Smith"
         data-role="Product Designer">
</article>

```html
<article data-wb="cardprofile"
         data-name="Jane Smith"
         data-role="Product Designer">
</article>
```

### Full Profile

<article data-wb="cardprofile"
         data-name="Alex Johnson"
         data-role="Senior Developer"
         data-avatar="https://i.pravatar.cc/80?img=3"
         data-bio="Full-stack developer with 10 years of experience."
         data-cover="https://picsum.photos/400/100">
</article>

```html
<article data-wb="cardprofile"
         data-name="Alex Johnson"
         data-role="Senior Developer"
         data-avatar="https://i.pravatar.cc/80?img=3"
         data-bio="Full-stack developer with 10 years of experience."
         data-cover="https://picsum.photos/400/100">
</article>
```

### Large Avatar

<article data-wb="cardprofile"
         data-name="Sarah Wilson"
         data-role="CEO"
         data-size="lg">
</article>

```html
<article data-wb="cardprofile"
         data-name="Sarah Wilson"
         data-role="CEO"
         data-size="lg">
</article>
```

### Left-Aligned Profile

<article data-wb="cardprofile"
         data-name="Mike Brown"
         data-role="Marketing Lead"
         data-align="left">
</article>

```html
<article data-wb="cardprofile"
         data-name="Mike Brown"
         data-role="Marketing Lead"
         data-align="left">
</article>
```

## Structure

<article class="wb-card wb-card--profile" style="text-align: center;">
  <!-- Cover image (when set) -->
  <figure class="wb-card__profile-cover">
    <img src="cover.jpg" alt="">
  </figure>
  
  <!-- Avatar -->
  <figure class="wb-card__profile-avatar wb-card__profile-avatar--md">
    <img src="avatar.jpg" alt="Profile photo of John Doe">
  </figure>
  
  <!-- Identity (name and role) -->
  <header>
    <h3 class="wb-card__profile-name">John Doe</h3>
    <p class="wb-card__profile-role">Designer</p>
  </header>
  
  <!-- Bio (when set) -->
  <p class="wb-card__profile-bio">
    Short biography here...
  </p>
</article>

```html
<article class="wb-card wb-card--profile" style="text-align: center;">
  <!-- Cover image (when set) -->
  <figure class="wb-card__profile-cover">
    <img src="cover.jpg" alt="">
  </figure>
  
  <!-- Avatar -->
  <figure class="wb-card__profile-avatar wb-card__profile-avatar--md">
    <img src="avatar.jpg" alt="Profile photo of John Doe">
  </figure>
  
  <!-- Identity (name and role) -->
  <header>
    <h3 class="wb-card__profile-name">John Doe</h3>
    <p class="wb-card__profile-role">Designer</p>
  </header>
  
  <!-- Bio (when set) -->
  <p class="wb-card__profile-bio">
    Short biography here...
  </p>
</article>
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.wb-card--profile` | Profile variant styling |
| `.wb-card__profile-cover` | Cover image container |
| `.wb-card__profile-avatar` | Avatar container |
| `.wb-card__profile-avatar--sm` | Small avatar |
| `.wb-card__profile-avatar--md` | Medium avatar |
| `.wb-card__profile-avatar--lg` | Large avatar |
| `.wb-card__profile-name` | Name heading |
| `.wb-card__profile-role` | Role text |
| `.wb-card__profile-bio` | Biography paragraph |

## Semantic Structure

| Part | HTML Element | Class |
|------|--------------|-------|
| Card | `<article>` | `.wb-card` |
| Cover | `<figure>` | `.wb-card__profile-cover` |
| Avatar | `<figure> > <img>` | `.wb-card__profile-avatar` |
| Identity | `<header>` | (none) |
| Name | `<h3>` | `.wb-card__profile-name` |
| Role | `<p>` | `.wb-card__profile-role` |
| Bio | `<p>` | `.wb-card__profile-bio` |

## Accessibility

| Element | Implementation |
|---------|----------------|
| Avatar alt | "Profile photo of {name}" |
| Cover alt | Empty (decorative) |
| Name | H3 heading |
| Role | Paragraph |

### Generated Alt Text

Avatar alt text is automatically generated:

```html
<img src="avatar.jpg" alt="Profile photo of John Doe">
```

## Builder Integration

### Sidebar

```
📁 Cards
└── 👤 Card Profile
```

### Property Panel

| Group | Properties |
|-------|------------|
| Identity | name, role |
| Images | avatar, cover, size |
| Content | bio |
| Style | align, elevated |

### Defaults

```json
{
  "name": "John Doe",
  "role": "Designer",
  "avatar": "https://i.pravatar.cc/80?img=1",
  "bio": "",
  "cover": "",
  "size": "md",
  "align": "center"
}
```

## Test Matrix

| Combination | Expected |
|-------------|----------|
| `name="John Doe"` | Name in H3, default avatar |
| `name="J" role="Dev"` | Name and role displayed |
| `name="J" avatar="url"` | Custom avatar image |
| `name="J" bio="Bio text"` | Bio paragraph shown |
| `name="J" cover="url"` | Cover image shown |
| `name="J" size="sm"` | Small avatar class |
| `name="J" size="lg"` | Large avatar class |
| `name="J" align="left"` | Left text alignment |

### Conditional Rendering

| Property | When Set | When Empty |
|----------|----------|------------|
| `cover` | Figure shown | Figure hidden |
| `bio` | Paragraph shown | Paragraph hidden |
| `role` | Role shown | Role hidden |

## Examples

### Team Member Card

<article data-wb="cardprofile"
         data-name="Emily Chen"
         data-role="Lead Designer"
         data-avatar="https://i.pravatar.cc/80?img=32"
         data-bio="Creating beautiful user experiences since 2015."
         data-elevated="true">
</article>

```html
<article data-wb="cardprofile"
         data-name="Emily Chen"
         data-role="Lead Designer"
         data-avatar="https://i.pravatar.cc/80?img=32"
         data-bio="Creating beautiful user experiences since 2015."
         data-elevated="true">
</article>
```

### Compact Profile (No Bio)

<article data-wb="cardprofile"
         data-name="David Kim"
         data-role="Engineer"
         data-avatar="https://i.pravatar.cc/80?img=12"
         data-size="sm">
</article>

```html
<article data-wb="cardprofile"
         data-name="David Kim"
         data-role="Engineer"
         data-avatar="https://i.pravatar.cc/80?img=12"
         data-size="sm">
</article>
```

### Executive Profile (Large)

<article data-wb="cardprofile"
         data-name="Maria Garcia"
         data-role="Chief Executive Officer"
         data-avatar="https://i.pravatar.cc/120?img=47"
         data-bio="Visionary leader with 20+ years in tech industry."
         data-cover="https://picsum.photos/400/100?blur=2"
         data-size="lg">
</article>

```html
<article data-wb="cardprofile"
         data-name="Maria Garcia"
         data-role="Chief Executive Officer"
         data-avatar="https://i.pravatar.cc/120?img=47"
         data-bio="Visionary leader with 20+ years in tech industry."
         data-cover="https://picsum.photos/400/100?blur=2"
         data-size="lg">
</article>
```

### Testimonial Style

<article data-wb="cardprofile"
         data-name="Tom Wilson"
         data-role="Happy Customer"
         data-avatar="https://i.pravatar.cc/80?img=8"
         data-bio="This product changed my workflow completely!"
         data-align="center">
</article>

```html
<article data-wb="cardprofile"
         data-name="Tom Wilson"
         data-role="Happy Customer"
         data-avatar="https://i.pravatar.cc/80?img=8"
         data-bio="This product changed my workflow completely!"
         data-align="center">
</article>
```

## Avatar Presets

The builder provides preset avatar options:

| Label | URL |
|-------|-----|
| Person 1 | `https://i.pravatar.cc/80?img=1` |
| Person 2 | `https://i.pravatar.cc/80?img=2` |
| Person 3 | `https://i.pravatar.cc/80?img=3` |
| Person 4 | `https://i.pravatar.cc/80?img=4` |
| Person 5 | `https://i.pravatar.cc/80?img=5` |
| Woman 1 | `https://i.pravatar.cc/80?img=32` |
| Woman 2 | `https://i.pravatar.cc/80?img=47` |
| Woman 3 | `https://i.pravatar.cc/80?img=44` |
| Custom... | (enter URL) |

## Related

- [Card](./card.md) - Base card component
- [Card Testimonial](./cardtestimonial.md) - Quote with author
- [Avatar Component](../avatar.md) - Standalone avatar
