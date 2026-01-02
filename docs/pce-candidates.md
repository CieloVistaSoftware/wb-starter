# PCE (Pseudo-Custom Elements) Candidates

Following the success of `<price-card>` and `<product-card>`, here are other components that would benefit from the PCE pattern.

## Priority 1: Card Variants
These are immediate wins as they share the same base logic as the implemented cards.

| Tag Name | Behavior | Description |
|----------|----------|-------------|
| `<profile-card>` | `cardprofile` | User profiles with avatar, bio, social links |
| `<hero-card>` | `cardhero` | Large banner/hero sections with background images |
| `<stats-card>` | `cardstats` | Dashboard statistics with icons and trends |
| `<testimonial-card>` | `cardtestimonial` | User quotes with ratings and author info |
| `<video-card>` | `cardvideo` | Video content with poster and controls |
| `<file-card>` | `cardfile` | File download/preview with metadata |
| `<notification-card>` | `cardnotification` | Alert/Notice blocks (Info, Success, Warning) |

## Priority 2: Structural Layouts
Replacing layout `div`s with semantic tags makes the page structure much clearer.

| Tag Name | Behavior | Description |
|----------|----------|-------------|
| `<wb-container>` | `container` | Centered content wrapper |
| `<wb-grid>` | `grid` | CSS Grid layout system |
| `<wb-flex>` | `flex` | Flexbox layout wrapper |
| `<wb-stack>` | `stack` | Vertical stacking layout |
| `<sidebar-layout>` | `sidebar-layout` | Standard sidebar + main content layout |

## Priority 3: Complex UI Components
These components often require specific markup structures that PCE can abstract away.

| Tag Name | Behavior | Description |
|----------|----------|-------------|
| `<wb-accordion>` | `accordion` | Collapsible content sections |
| `<wb-tabs>` | `tabs` | Tabbed interface |
| `<wb-modal>` | `modal` | Dialog/Popup windows |
| `<wb-carousel>` | `carousel` | Image/Content sliders |
| `<wb-alert>` | `alert` | Inline feedback messages |

## Priority 4: Media Embeds
Simplifying third-party embeds.

| Tag Name | Behavior | Description |
|----------|----------|-------------|
| `<youtube-video>` | `youtube` | YouTube embed wrapper |
| `<vimeo-video>` | `vimeo` | Vimeo embed wrapper |

## Implementation Plan
To implement any of these:
1.  Add mapping to `customElementMappings` in `src/core/wb-lazy.js`.
2.  Update the corresponding behavior file (e.g., `card.js`, `layouts.js`) to add the tag to `ALLOWED_TAGS`.
3.  (Optional) Update VS Code data for IntelliSense.
