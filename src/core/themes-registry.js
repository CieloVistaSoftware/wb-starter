/**
 * themes-registry.js -- every site theme, in one place (#1025)
 *
 * The [data-theme="<id>"] blocks in src/styles/themes.css are the themes; this
 * is their list. The header's x-themecontrol builds its dropdown from it, and
 * scripts/build-themes-page.mjs writes the Themes page (its counts and one
 * card per theme) from it. Before this, the page kept its own hand-written
 * copy and showed 23 of 50.
 *
 * Adding a theme: add its block to themes.css, add it here, then run
 * `node scripts/build-themes-page.mjs`.
 * tests/compliance/themes-page-lists-every-theme.spec.ts fails until all three
 * agree.
 */
export const THEMES = [
  // Original dark themes
  { id: 'dark', name: 'Dark', description: 'Standard dark theme' },
  { id: 'light', name: 'Light', description: 'Standard light theme' },
  { id: 'cyberpunk', name: 'Cyberpunk', description: 'Vibrant magenta/cyan' },
  { id: 'ocean', name: 'Ocean', description: 'Calm blues' },
  { id: 'sunset', name: 'Sunset', description: 'Warm oranges' },
  { id: 'forest', name: 'Forest', description: 'Natural greens' },
  { id: 'midnight', name: 'Midnight', description: 'Deep monochromatic blue' },
  { id: 'twilight', name: 'Twilight', description: 'Purple-blue with warm accents' },
  { id: 'sakura', name: 'Sakura', description: 'Elegant pink' },
  { id: 'arctic', name: 'Arctic', description: 'Ice blue' },
  { id: 'desert', name: 'Desert', description: 'Warm sand tones' },
  { id: 'neon-dreams', name: 'Neon Dreams', description: 'Purple neon' },
  { id: 'retro-wave', name: 'Retro Wave', description: 'Retro pink/purple' },
  // Second wave (10)
  { id: 'lavender', name: 'Lavender', description: 'Soft purple pastels' },
  { id: 'emerald', name: 'Emerald', description: 'Rich jewel-toned green' },
  { id: 'ruby', name: 'Ruby', description: 'Deep red elegance' },
  { id: 'golden', name: 'Golden', description: 'Luxurious gold and amber' },
  { id: 'slate', name: 'Slate', description: 'Professional gray tones' },
  { id: 'coffee', name: 'Coffee', description: 'Warm brown tones' },
  { id: 'mint', name: 'Mint', description: 'Fresh mint green' },
  { id: 'noir', name: 'Noir', description: 'High contrast black/white' },
  { id: 'aurora', name: 'Aurora', description: 'Northern lights inspired' },
  { id: 'grape', name: 'Grape', description: 'Deep purple vibes' },
  // Third wave - new dark themes
  { id: 'coral-dark', name: 'Coral Dark', description: 'Vibrant coral with high saturation' },
  { id: 'teal-dark', name: 'Teal Dark', description: 'Rich teal with high saturation' },
  { id: 'indigo-dark', name: 'Indigo Dark', description: 'Deep indigo with medium saturation' },
  { id: 'plum-dark', name: 'Plum Dark', description: 'Rich plum with medium saturation' },
  { id: 'sage-dark', name: 'Sage Dark', description: 'Muted sage green with low saturation' },
  { id: 'amber-dark', name: 'Amber Dark', description: 'Deep amber with high saturation' },
  { id: 'sapphire-dark', name: 'Sapphire Dark', description: 'Rich sapphire blue with high saturation' },
  { id: 'turquoise-dark', name: 'Turquoise Dark', description: 'Bright turquoise with high saturation' },
  { id: 'tomato-dark', name: 'Tomato Dark', description: 'Vibrant tomato red with high saturation' },
  { id: 'rose-dark', name: 'Rose Dark', description: 'Deep rose pink with medium saturation' },
  { id: 'copper-dark', name: 'Copper Dark', description: 'Warm copper tones with medium saturation' },
  { id: 'jade-dark', name: 'Jade Dark', description: 'Deep jade green with medium saturation' },
  { id: 'amethyst-dark', name: 'Amethyst Dark', description: 'Rich amethyst purple with medium saturation' },
  { id: 'marigold-dark', name: 'Marigold Dark', description: 'Bright marigold with high saturation' },
  // Third wave - new light themes
  { id: 'seafoam-light', name: 'Seafoam Light', description: 'Light seafoam with medium saturation' },
  { id: 'peony-light', name: 'Peony Light', description: 'Light peony pink with medium saturation' },
  { id: 'taupe-light', name: 'Taupe Light', description: 'Warm taupe with low saturation' },
  { id: 'khaki-light', name: 'Khaki Light', description: 'Warm khaki with medium saturation' },
  { id: 'steel-light', name: 'Steel Light', description: 'Cool steel gray with low saturation' },
  { id: 'moss-light', name: 'Moss Light', description: 'Muted moss green with low saturation' },
  { id: 'sand-light', name: 'Sand Light', description: 'Warm sand tones with low saturation' },
  { id: 'blush-light', name: 'Blush Light', description: 'Soft blush pink with low saturation' },
  { id: 'sage-light', name: 'Sage Light', description: 'Light sage green with low saturation' },
  { id: 'mauve-light', name: 'Mauve Light', description: 'Soft mauve purple with low saturation' },
  { id: 'celadon-light', name: 'Celadon Light', description: 'Light celadon green with low saturation' },
  { id: 'linen-light', name: 'Linen Light', description: 'Warm linen beige with low saturation' },
  { id: 'pistachio-light', name: 'Pistachio Light', description: 'Light pistachio with medium saturation' }
];
