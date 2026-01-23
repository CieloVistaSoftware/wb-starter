/**
 * Builder Properties - Properties panel functions
 */

// Show properties panel
function showProperties(template) {
  const panel = document.getElementById('propertiesPanel');
  const type = selectedComponent?.type;
  const comp = components.find(c => c.id === selectedComponent?.id);
  
  // Handle semantic elements
  if (type?.startsWith('semantic-') && comp) {
    showSemanticProperties(comp);
    return;
  }
  
  if (type === 'features' && comp?.data?.cards) {
    const cardIndex = comp.data.selectedCard || 0;
    showFeatureGridProperties(comp, cardIndex);
    setupFeatureGridClickHandlers(comp.id);
    return;
  }
  
  if (type === 'pricing' && comp?.data?.cards) {
    const cardIndex = comp.data.selectedCard || 0;
    showPricingGridProperties(comp, cardIndex);
    setupPricingGridClickHandlers(comp.id);
    return;
  }
  
  if (type === 'card' && comp?.data) {
    showCardProperties(comp);
    return;
  }
  
  if (type === 'cta' && comp?.data) {
    showCTAProperties(comp);
    return;
  }
  
  const propertyPanels = {
    navbar: `
      <div class="properties-section">
        <h4>${template.icon} ${template.name}</h4>
        
        <div class="property">
          <label>Logo Text</label>
          <input type="text" value="${comp?.data?.logo || 'Logo'}" onchange="updateNavbar('logo', this.value)">
        </div>
        
        <p style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 0.5rem;">
          💡 Links are auto-generated from pages.
        </p>
      </div>
    `,
    
    'header-logo': `
      <div class="properties-section">
        <h4>${template.icon} ${template.name}</h4>
        
        <div class="property">
          <label>Brand Name</label>
          <input type="text" value="${comp?.data?.brandName || 'Your Brand'}" onchange="updateHeaderLogo('brandName', this.value)">
        </div>
        
        <div class="property">
          <label>Tagline</label>
          <input type="text" value="${comp?.data?.tagline || 'Tagline goes here'}" onchange="updateHeaderLogo('tagline', this.value)">
        </div>
        
        <div class="property">
          <label>Icon/Emoji</label>
          <input type="text" value="${comp?.data?.icon || '▯'}" onchange="updateHeaderLogo('icon', this.value)">
        </div>
      </div>
    `,
    
    hero: `
      <div class="properties-section">
        <h4>${template.icon} ${template.name}</h4>
        
        <div class="property">
          <label>Headline</label>
          <input type="text" value="${comp?.data?.headline || 'Welcome to Your Site'}" onchange="updateHero('headline', this.value)">
        </div>
        
        <div class="property">
          <label>Subheadline</label>
          <textarea onchange="updateHero('subheadline', this.value)">${comp?.data?.subheadline || 'Your value proposition goes here'}</textarea>
        </div>
        
        <div class="property">
          <label>Gradient Angle</label>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <input type="range" min="0" max="360" value="${comp?.data?.gradientAngle || 135}" 
              oninput="this.nextElementSibling.textContent = this.value + '°'; updateHero('gradientAngle', this.value)">
            <span style="min-width: 40px; text-align: right; font-size: 0.85rem;">${comp?.data?.gradientAngle || 135}°</span>
          </div>
        </div>
        
        <div class="property">
          <label>Gradient Start</label>
          <input type="color" value="${comp?.data?.gradientStart || '#667eea'}" onchange="updateHero('gradientStart', this.value)">
        </div>
        
        <div class="property">
          <label>Gradient End</label>
          <input type="color" value="${comp?.data?.gradientEnd || '#764ba2'}" onchange="updateHero('gradientEnd', this.value)">
        </div>
      </div>
    `,
    
    footer: `
      <div class="properties-section">
        <h4>${template.icon} ${template.name}</h4>
        
        <div class="property">
          <label>Copyright Text</label>
          <input type="text" value="${comp?.data?.copyright || '© 2025 Your Company. All rights reserved.'}" onchange="updateFooter('copyright', this.value)">
        </div>
      </div>
    `
  };
  
  const defaultPanel = `
    <div class="properties-section">
      <h4>${template.icon} ${template.name}</h4>
      <p style="color: var(--text-secondary); font-size: 0.85rem;">
        Edit this component directly on the canvas.
      </p>

      <div class="property">
        <label>HTML</label>
        <wb-html-editor target-id="${comp?.id}" class="wb-html-editor--inline"></wb-html-editor>
        <p style="color: var(--text-secondary); font-size: 0.75rem; margin-top:0.5rem;">💡 Edit the element's HTML or its attributes. Use <kbd>Ctrl/Cmd</kbd>+<kbd>S</kbd> to save.</p>
      </div>
    </div>
  `;

  panel.innerHTML = `
    ${propertyPanels[type] || defaultPanel}
    <button class="btn btn-danger" style="width: 100%; margin-top: 1rem;" onclick="deleteComponent('${selectedComponent.id}')">🗑️ Delete</button>
  `;

  // Add a 'Show HTML' button to the panel header so user can open the HTML editor for this component
  (function addShowHtmlButton() {
    const h4 = panel.querySelector('h4');
    if (!h4) return;
    // Avoid adding duplicate button
    if (h4.querySelector('.btn-show-html')) return;

    const btn = document.createElement('button');
    btn.className = 'btn btn-secondary btn-show-html';
    btn.style.marginLeft = '0.5rem';
    btn.textContent = 'Show HTML';
    btn.addEventListener('click', async () => {
      // Find or create an inline editor inside this panel
      let editor = panel.querySelector('wb-html-editor');
      if (!editor) {
        editor = document.createElement('wb-html-editor');
        editor.className = 'wb-html-editor--inline';
        panel.appendChild(editor);
        try {
          // Initialize behavior if WB is available
          if (window.WB && typeof window.WB.inject === 'function') {
            await window.WB.inject(editor, 'htmlEditor');
          }
        } catch (e) {
          console.warn('Failed to init wb-html-editor', e);
        }
      }

      // Open the editor for the current selectedComponent
      try {
        editor.openFor(selectedComponent?.id || selectedComponent?.element || null);
        // Ensure editor is visible (scroll into view)
        editor.scrollIntoView({ block: 'nearest' });
      } catch (err) {
        console.warn('Show HTML button failed', err);
      }
    });

    h4.appendChild(btn);
  })();

  // If an HTML editor exists in the panel, open it for the active element by default
  const editorEl = panel.querySelector('wb-html-editor');
  if (editorEl && typeof editorEl.openFor === 'function') {
    try { editorEl.openFor(selectedComponent?.id || selectedComponent?.element || null); } catch (err) { /* ignore */ }
  }

  if (selectedComponent && selectedComponent.element) {
    selectedComponent.element.focus();
  }
}

// Feature grid properties
function showFeatureGridProperties(comp, cardIndex) {
  const card = comp.data.cards[cardIndex];
  const panel = document.getElementById('propertiesPanel');
  
  panel.innerHTML = `
    <div class="properties-section">
      <h4>✨ Features Grid</h4>
      <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
        ${comp.data.cards.map((c, i) => `
          <button onclick="selectFeatureCard('${comp.id}', ${i})"
            style="flex: 1; padding: 0.5rem; border: 2px solid ${i === cardIndex ? 'var(--primary)' : 'var(--border-color)'}; background: ${i === cardIndex ? 'var(--primary)' : 'var(--bg-tertiary)'}; color: ${i === cardIndex ? 'white' : 'var(--text-primary)'}; border-radius: 4px; cursor: pointer; font-size: 1.2rem;">
            ${c.icon}
          </button>
        `).join('')}
      </div>
      <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 1rem;">Editing Card ${cardIndex + 1}</p>
      <div class="property">
        <label>Icon/Emoji</label>
        <input type="text" value="${card.icon}" onchange="updateFeatureGridCard('${comp.id}', ${cardIndex}, 'icon', this.value)">
      </div>
      <div class="property">
        <label>Title</label>
        <input type="text" value="${card.title}" onchange="updateFeatureGridCard('${comp.id}', ${cardIndex}, 'title', this.value)">
      </div>
      <div class="property">
        <label>Description</label>
        <textarea onchange="updateFeatureGridCard('${comp.id}', ${cardIndex}, 'description', this.value)">${card.description}</textarea>
      </div>
    </div>
    <button class="btn btn-danger" style="width: 100%; margin-top: 1rem;" onclick="deleteComponent('${comp.id}')">🗑️ Delete Features Grid</button>
  `;
}

function selectFeatureCard(componentId, cardIndex) {
  const comp = components.find(c => c.id === componentId);
  if (!comp) return;
  comp.data.selectedCard = cardIndex;
  
  const cardItems = comp.element.querySelectorAll('.feature-card-item');
  cardItems.forEach((card, i) => {
    card.style.borderColor = i === cardIndex ? 'var(--primary)' : 'transparent';
  });
  
  showFeatureGridProperties(comp, cardIndex);
}

function updateFeatureGridCard(componentId, cardIndex, property, value) {
  const comp = components.find(c => c.id === componentId);
  if (!comp || !comp.data.cards) return;
  
  comp.data.cards[cardIndex][property] = value;
  const newHtml = componentTemplates.features.getHtml(comp.data);
  comp.html = newHtml;
  comp.element.querySelector('.component-content').innerHTML = newHtml;
  
  setupFeatureGridClickHandlers(componentId);
  const cardItems = comp.element.querySelectorAll('.feature-card-item');
  if (cardItems[cardIndex]) cardItems[cardIndex].style.borderColor = 'var(--primary)';
  
  updateStatus(`Updated card ${cardIndex + 1} ${property}`);
}

function setupFeatureGridClickHandlers(componentId) {
  const comp = components.find(c => c.id === componentId);
  if (!comp) return;
  
  const cardItems = comp.element.querySelectorAll('.feature-card-item');
  cardItems.forEach((card, index) => {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      cardItems.forEach(c => c.style.borderColor = 'transparent');
      card.style.borderColor = 'var(--primary)';
      comp.data.selectedCard = index;
      showFeatureGridProperties(comp, index);
    });
  });
  if (cardItems[0]) cardItems[0].style.borderColor = 'var(--primary)';
}

// Pricing grid properties
function showPricingGridProperties(comp, cardIndex) {
  const card = comp.data.cards[cardIndex];
  const panel = document.getElementById('propertiesPanel');
  
  panel.innerHTML = `
    <div class="properties-section">
      <h4>💰 Pricing Table</h4>
      <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
        ${comp.data.cards.map((c, i) => `
          <button onclick="selectPricingCard('${comp.id}', ${i})"
            style="flex: 1; padding: 0.5rem; border: 2px solid ${i === cardIndex ? 'var(--primary)' : 'var(--border-color)'}; background: ${i === cardIndex ? 'var(--primary)' : 'var(--bg-tertiary)'}; color: ${i === cardIndex ? 'white' : 'var(--text-primary)'}; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">
            ${c.name}
          </button>
        `).join('')}
      </div>
      <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 1rem;">Editing: ${card.name} Plan</p>
      <div class="property">
        <label>Plan Name</label>
        <input type="text" value="${card.name}" onchange="updatePricingGridCard('${comp.id}', ${cardIndex}, 'name', this.value)">
      </div>
      <div class="property">
        <label>Price</label>
        <input type="text" value="${card.price}" onchange="updatePricingGridCard('${comp.id}', ${cardIndex}, 'price', this.value)">
      </div>
      <div class="property">
        <label>Period</label>
        <input type="text" value="${card.period}" onchange="updatePricingGridCard('${comp.id}', ${cardIndex}, 'period', this.value)">
      </div>
      <div class="property">
        <label>Features (one per line)</label>
        <textarea rows="4" onchange="updatePricingGridCard('${comp.id}', ${cardIndex}, 'features', this.value.split('\\n').filter(f => f.trim()))">${card.features.join('\n')}</textarea>
      </div>
      <div class="property">
        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
          <input type="checkbox" ${card.highlighted ? 'checked' : ''} onchange="updatePricingGridCard('${comp.id}', ${cardIndex}, 'highlighted', this.checked)" style="width: auto;">
          Highlight this plan
        </label>
      </div>
    </div>
    <button class="btn btn-danger" style="width: 100%; margin-top: 1rem;" onclick="deleteComponent('${comp.id}')">🗑️ Delete Pricing Table</button>
  `;
}

function selectPricingCard(componentId, cardIndex) {
  const comp = components.find(c => c.id === componentId);
  if (!comp) return;
  comp.data.selectedCard = cardIndex;
  showPricingGridProperties(comp, cardIndex);
}

function updatePricingGridCard(componentId, cardIndex, property, value) {
  const comp = components.find(c => c.id === componentId);
  if (!comp || !comp.data.cards) return;
  
  comp.data.cards[cardIndex][property] = value;
  const newHtml = componentTemplates.pricing.getHtml(comp.data);
  comp.html = newHtml;
  comp.element.querySelector('.component-content').innerHTML = newHtml;
  
  setupPricingGridClickHandlers(componentId);
  updateStatus(`Updated ${comp.data.cards[cardIndex].name} plan ${property}`);
}

function setupPricingGridClickHandlers(componentId) {
  const comp = components.find(c => c.id === componentId);
  if (!comp) return;
  
  const cardItems = comp.element.querySelectorAll('.pricing-card-item');
  cardItems.forEach((card, index) => {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      comp.data.selectedCard = index;
      showPricingGridProperties(comp, index);
    });
  });
}

// Card properties
function showCardProperties(comp) {
  const panel = document.getElementById('propertiesPanel');
  const cardTypes = componentTemplates.card.cardTypes;
  const currentType = comp.data.cardType || 'basic';
  
  const typeOptions = Object.entries(cardTypes).map(([key, val]) => 
    `<option value="${key}" ${key === currentType ? 'selected' : ''}>${val.name}</option>`
  ).join('');
  
  let extraFields = '';
  if (currentType === 'basic' || currentType === 'feature') {
    extraFields = `
      <div class="property">
        <label>Icon/Emoji</label>
        <input type="text" value="${comp.data.icon || '🖼️'}" onchange="updateCard('${comp.id}', 'icon', this.value)">
      </div>
      <div class="property">
        <label>Title</label>
        <input type="text" value="${comp.data.title || 'Card Title'}" onchange="updateCard('${comp.id}', 'title', this.value)">
      </div>
      <div class="property">
        <label>Description</label>
        <textarea onchange="updateCard('${comp.id}', 'description', this.value)">${comp.data.description || ''}</textarea>
      </div>
    `;
  }
  
  panel.innerHTML = `
    <div class="properties-section">
      <h4>🃏 Card</h4>
      <div class="property">
        <label>Card Type</label>
        <select onchange="updateCardType('${comp.id}', this.value)">${typeOptions}</select>
      </div>
      ${extraFields}
    </div>
    <button class="btn btn-danger" style="width: 100%; margin-top: 1rem;" onclick="deleteComponent('${comp.id}')">🗑️ Delete Card</button>
  `;
}

function updateCardType(componentId, newType) {
  const comp = components.find(c => c.id === componentId);
  if (!comp) return;
  
  comp.data.cardType = newType;
  const newHtml = componentTemplates.card.getHtml(comp.data);
  comp.html = newHtml;
  comp.element.querySelector('.component-content').innerHTML = newHtml;
  
  showCardProperties(comp);
  updateStatus(`Changed card type to ${componentTemplates.card.cardTypes[newType].name}`);
}

function updateCard(componentId, property, value) {
  const comp = components.find(c => c.id === componentId);
  if (!comp) return;
  
  comp.data[property] = value;
  const newHtml = componentTemplates.card.getHtml(comp.data);
  comp.html = newHtml;
  comp.element.querySelector('.component-content').innerHTML = newHtml;
  
  updateStatus(`Updated card ${property}`);
}

// CTA properties
function showCTAProperties(comp) {
  const panel = document.getElementById('propertiesPanel');
  const contactType = comp.data.contactType || 'phone';
  
  let contactFields = contactType === 'phone' ? `
    <div class="property">
      <label>Phone Number</label>
      <input type="text" value="${comp.data.phoneNumber || '(555) 123-4567'}" onchange="updateCTAField('${comp.id}', 'phoneNumber', this.value)">
    </div>
  ` : `
    <div class="property">
      <label>Email Address</label>
      <input type="text" value="${comp.data.email || 'contact@example.com'}" onchange="updateCTAField('${comp.id}', 'email', this.value)">
    </div>
    <div class="property">
      <label>Email Subject</label>
      <input type="text" value="${comp.data.emailSubject || 'Contact Request'}" onchange="updateCTAField('${comp.id}', 'emailSubject', this.value)">
    </div>
    <div class="property">
      <label>Button Text</label>
      <input type="text" value="${comp.data.buttonText || 'Send Us an Email'}" onchange="updateCTAField('${comp.id}', 'buttonText', this.value)">
    </div>
  `;
  
  panel.innerHTML = `
    <div class="properties-section">
      <h4>📞 Call to Action</h4>
      <div class="property">
        <label>Headline</label>
        <input type="text" value="${comp.data.title || 'Ready to get started?'}" onchange="updateCTAField('${comp.id}', 'title', this.value)">
      </div>
      <div class="property">
        <label>Description</label>
        <textarea onchange="updateCTAField('${comp.id}', 'description', this.value)">${comp.data.description || 'Contact us today!'}</textarea>
      </div>
      <div class="property">
        <label>Contact Type</label>
        <select onchange="updateCTAField('${comp.id}', 'contactType', this.value); showCTAProperties(components.find(c => c.id === '${comp.id}'))">
          <option value="phone" ${contactType === 'phone' ? 'selected' : ''}>📞 Phone Number</option>
          <option value="email" ${contactType === 'email' ? 'selected' : ''}>✉️ Email</option>
        </select>
      </div>
      ${contactFields}
      <div class="property">
        <label>Gradient Start</label>
        <input type="color" value="${comp.data.gradientStart || '#667eea'}" onchange="updateCTAField('${comp.id}', 'gradientStart', this.value)">
      </div>
      <div class="property">
        <label>Gradient End</label>
        <input type="color" value="${comp.data.gradientEnd || '#764ba2'}" onchange="updateCTAField('${comp.id}', 'gradientEnd', this.value)">
      </div>
    </div>
    <button class="btn btn-danger" style="width: 100%; margin-top: 1rem;" onclick="deleteComponent('${comp.id}')">🗑️ Delete CTA</button>
  `;
}

function updateCTAField(componentId, property, value) {
  const comp = components.find(c => c.id === componentId);
  if (!comp) return;
  
  comp.data[property] = value;
  const newHtml = componentTemplates.cta.getHtml(comp.data);
  comp.html = newHtml;
  comp.element.querySelector('.component-content').innerHTML = newHtml;
  
  updateStatus(`Updated CTA ${property}`);
}

// Update functions for specific component types
function updateNavbar(property, value) {
  const comp = components.find(c => c.id === selectedComponent?.id);
  if (!comp) return;
  
  comp.data = comp.data || { logo: 'Logo' };
  comp.data[property] = value;
  
  const links = pages.slice(0, 4).map(p => 
    `<a href="${p.slug}" style="color: var(--text-secondary); text-decoration: none;">${p.name}</a>`
  ).join('');
  
  comp.html = `<div style="display: flex; gap: 2rem; padding: 1rem; background: var(--bg-tertiary); border-radius: 6px; align-items: center;">
    <span style="font-weight: 700;">${comp.data.logo}</span>
    ${links}
  </div>`;
  
  comp.element.querySelector('.component-content').innerHTML = comp.html;
  updateStatus(`Updated navbar ${property}`);
}

function updateHeaderLogo(property, value) {
  const comp = components.find(c => c.id === selectedComponent?.id);
  if (!comp) return;
  
  comp.data = comp.data || { brandName: 'Your Brand', tagline: 'Tagline goes here', icon: '▯' };
  comp.data[property] = value;
  
  const newHtml = `<div style="display: flex; align-items: center; gap: 1.5rem; padding: 1.5rem; background: var(--bg-tertiary); border-radius: 8px;">
    <div style="font-size: 2.5rem; width: 60px; height: 60px; background: var(--primary); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700;">${comp.data.icon}</div>
    <div>
      <h1 style="margin: 0; font-size: 1.8rem; font-weight: 800;">${comp.data.brandName}</h1>
      <p style="margin: 0.25rem 0 0 0; color: var(--text-secondary); font-size: 0.95rem;">${comp.data.tagline}</p>
    </div>
  </div>`;
  
  comp.html = newHtml;
  comp.element.querySelector('.component-content').innerHTML = newHtml;
  updateStatus(`Updated header ${property}`);
}

function updateHero(property, value) {
  const comp = components.find(c => c.id === selectedComponent?.id);
  if (!comp) return;
  
  // Ensure comp.data exists with defaults, preserving any existing values
  const defaults = { 
    headline: 'Welcome to Your Site', 
    subheadline: 'Your value proposition', 
    gradientAngle: 135,
    gradientStart: '#667eea', 
    gradientEnd: '#764ba2' 
  };
  comp.data = { ...defaults, ...(comp.data || {}) };
  
  // Update only the changed property
  comp.data[property] = value;
  
  // Use safe fallbacks in template to prevent undefined values
  const headline = comp.data.headline || defaults.headline;
  const subheadline = comp.data.subheadline || defaults.subheadline;
  const gradientAngle = comp.data.gradientAngle || defaults.gradientAngle;
  const gradientStart = comp.data.gradientStart || defaults.gradientStart;
  const gradientEnd = comp.data.gradientEnd || defaults.gradientEnd;
  
  const newHtml = `<div style="background: linear-gradient(${gradientAngle}deg, ${gradientStart} 0%, ${gradientEnd} 100%); padding: 4rem 2rem; text-align: center; color: white; border-radius: 8px;">
    <h2 style="font-size: 2.5rem; margin: 0 0 1rem 0;">${headline}</h2>
    <p style="font-size: 1.1rem; margin: 0;">${subheadline}</p>
  </div>`;
  
  comp.html = newHtml;
  comp.element.querySelector('.component-content').innerHTML = newHtml;
  updateStatus(`Updated hero ${property}`);
}

function updateFooter(property, value) {
  const comp = components.find(c => c.id === selectedComponent?.id);
  if (!comp) return;
  
  comp.data = comp.data || { copyright: '© 2025 Your Company. All rights reserved.' };
  comp.data[property] = value;
  
  const newHtml = `<div style="padding: 2rem; text-align: center; border-top: 1px solid var(--border-color);">
    <p style="margin: 0; color: var(--text-secondary);">${comp.data.copyright}</p>
  </div>`;
  
  comp.html = newHtml;
  comp.element.querySelector('.component-content').innerHTML = newHtml;
  updateStatus(`Updated footer ${property}`);
}
