/**
 * Phase 2: Update cardnotification to use 'variant' instead of 'type'
 */
import fs from 'fs';

const filePath = 'src/wb-viewmodels/card.js';
let content = fs.readFileSync(filePath, 'utf8');

// Find and update cardnotification function
const oldPattern = `export function cardnotification(element, options = {}) {
  const config = {
    type: options.type || element.dataset.type || element.getAttribute('type') || 'info',`;

const newPattern = `export function cardnotification(element, options = {}) {
  // Phase 2: Read 'variant' first, fallback to legacy 'type' for backward compat
  // Note: Native 'type' has specific meaning on inputs/buttons, so we prefer 'variant' for style variants
  const variantValue = options.variant || element.dataset.variant || element.getAttribute('variant') ||
                       options.type || element.dataset.type || element.getAttribute('type') || 'info';
  
  const config = {
    // v3.0 Phase 2: Use 'variant' for style variants (standard), keep 'type' alias for backward compat
    variant: variantValue,
    type: variantValue, // Backward compatibility alias`;

if (content.includes(oldPattern)) {
  content = content.replace(oldPattern, newPattern);
  fs.writeFileSync(filePath, content);
  console.log('✅ Updated cardnotification to use variant instead of type');
} else {
  console.log('⚠️ Pattern not found - may already be updated or different format');
  
  // Try to find the function and show context
  const funcStart = content.indexOf('export function cardnotification');
  if (funcStart !== -1) {
    console.log('Found function at position:', funcStart);
    console.log('Context:', content.substring(funcStart, funcStart + 300));
  }
}
