// Attach event handlers for page switching and deletion (replacing removed inline handlers)
document.addEventListener('DOMContentLoaded', () => {
	// Page switch handlers
	document.querySelectorAll('.page-item[data-onclick="switchToPage"]').forEach(item => {
		item.addEventListener('click', (e) => {
			const pageId = item.getAttribute('data-page-id');
			if (pageId) switchToPage(pageId);
		});
	});
	// Page delete handlers (rendered by JS in renderPagesList)
	document.querySelectorAll('.page-delete').forEach(btn => {
		btn.addEventListener('click', (e) => {
			e.stopPropagation();
			const pageId = btn.closest('.page-item')?.getAttribute('data-page-id');
			if (pageId) deletePage(pageId, e);
		});
	});
});
// Attach pricing grid property panel handlers after DOM load
window.addEventListener('DOMContentLoaded', () => {
	// Pricing grid property panel handlers
	document.querySelectorAll('input[data-pricing-name]').forEach(el => {
		el.addEventListener('change', function() {
			window.updatePricingGridCard?.(el.dataset.compId, Number(el.dataset.cardIndex), 'name', el.value);
		});
	});
	document.querySelectorAll('input[data-pricing-price]').forEach(el => {
		el.addEventListener('change', function() {
			window.updatePricingGridCard?.(el.dataset.compId, Number(el.dataset.cardIndex), 'price', el.value);
		});
	});
	document.querySelectorAll('input[data-pricing-period]').forEach(el => {
		el.addEventListener('change', function() {
			window.updatePricingGridCard?.(el.dataset.compId, Number(el.dataset.cardIndex), 'period', el.value);
		});
	});
	document.querySelectorAll('textarea[data-pricing-features]').forEach(el => {
		el.addEventListener('change', function() {
			const features = el.value.split('\n').filter(f => f.trim());
			window.updatePricingGridCard?.(el.dataset.compId, Number(el.dataset.cardIndex), 'features', features);
		});
	});
	document.querySelectorAll('input[data-pricing-highlighted]').forEach(el => {
		el.addEventListener('change', function() {
			window.updatePricingGridCard?.(el.dataset.compId, Number(el.dataset.cardIndex), 'highlighted', el.checked);
		});
	});
});
// Set color and number input values after DOM load
window.addEventListener('DOMContentLoaded', () => {
	// Set gradient color pickers for card/cta properties
	document.querySelectorAll('input[data-gradient-start]').forEach(el => {
		const comp = window.components?.find(c => c.id === window.selectedComponent?.id);
		el.value = comp?.data?.gradientStart || '#667eea';
	});
	document.querySelectorAll('input[data-gradient-end]').forEach(el => {
		const comp = window.components?.find(c => c.id === window.selectedComponent?.id);
		el.value = comp?.data?.gradientEnd || '#764ba2';
	});
	// Set config panel number fields
	const autoSave = window.builderSettings?.autoSaveInterval;
	const gridSize = window.builderSettings?.gridSize;
	const autoSaveInput = document.querySelector('input[data-autosave-interval]');
	if (autoSaveInput && Number.isFinite(autoSave) && autoSave >= 10 && autoSave <= 300) autoSaveInput.value = autoSave;
	const gridSizeInput = document.querySelector('input[data-grid-size]');
	if (gridSizeInput && Number.isFinite(gridSize) && gridSize >= 5 && gridSize <= 50) gridSizeInput.value = gridSize;
});
// Dynamically set input values for builder.html (migrated from template strings)
window.addEventListener('DOMContentLoaded', () => {
	// Feature Card Inputs
	const featureIcon = document.getElementById('feature-icon');
	if (featureIcon) {
		const c = window.components?.find(c => c.id === window.selectedComponent?.id);
		featureIcon.value = c?.data?.icon || '✨';
	}
	const featureTitle = document.getElementById('feature-title');
	if (featureTitle) {
		const c = window.components?.find(c => c.id === window.selectedComponent?.id);
		featureTitle.value = c?.data?.title || 'Feature Title';
	}

	// Pricing Grid Card Inputs (set all by class, if present)
	document.querySelectorAll('input[data-pricing-name]').forEach((el, i) => {
		const card = window.pricingCards?.[i];
		if (card) el.value = card.name || '';
	});
	document.querySelectorAll('input[data-pricing-price]').forEach((el, i) => {
		const card = window.pricingCards?.[i];
		if (card) el.value = card.price || '';
	});
	document.querySelectorAll('input[data-pricing-period]').forEach((el, i) => {
		const card = window.pricingCards?.[i];
		if (card) el.value = card.period || '';
	});

	// Card/CTA/Team/Testimonial Inputs (set by data attributes if present)
	document.querySelectorAll('input[data-card-field]').forEach(el => {
		const comp = window.components?.find(c => c.id === window.selectedComponent?.id);
		if (comp) el.value = comp.data?.[el.dataset.cardField] || '';
	});
	document.querySelectorAll('input[data-cta-field]').forEach(el => {
		const comp = window.components?.find(c => c.id === window.selectedComponent?.id);
		if (comp) el.value = comp.data?.[el.dataset.ctaField] || '';
	});
	document.querySelectorAll('input[data-team-field]').forEach(el => {
		const comp = window.components?.find(c => c.id === window.selectedComponent?.id);
		if (comp) el.value = comp.data?.[el.dataset.teamField] || '';
	});
	document.querySelectorAll('input[data-testimonial-field]').forEach(el => {
		const comp = window.components?.find(c => c.id === window.selectedComponent?.id);
		if (comp) el.value = comp.data?.[el.dataset.testimonialField] || '';
	});

	// Optionally, set select/option values if needed
	// ... (add as needed)
});
// builder-inline.js: extracted from builder.html
// All builder logic previously in <script> in builder.html should be moved here.
// (This is a placeholder. The full extraction of all inline JS is required for full migration.)

// Example: (copy all logic from <script> in builder.html here)
// let draggedComponent = null;
// let selectedComponent = null;
// ...
