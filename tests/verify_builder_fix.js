
// Mock DOM and dependencies
const global = {
    window: {},
    document: {
        getElementById: () => ({
            innerHTML: '',
            closest: () => ({ scrollIntoView: () => {} })
        }),
        createElement: () => ({
            classList: { add: () => {} },
            addEventListener: () => {}
        })
    },
    console: {
        log: () => {},
        error: console.error
    }
};

// Mock property config
const propertyConfig = {
    properties: {},
    categories: { other: { label: 'Other', order: 1 } },
    componentDefaults: {}
};

// Mock getPropertyDef
function getPropertyDef(propName, componentBehavior) {
    return { ui: 'text' };
}

// Mock getCategory
function getCategory(name) {
    return { label: name, order: 1 };
}

// Mock renderPropertyControl
function renderPropertyControl(wrapperId, propName, value, componentBehavior) {
    return `<input value="${value}">`;
}

// The function to test (copied from the fixed file)
function renderPropertiesPanel(wrapper, panelElement, onChange = null, scrollToProperty = null) {
  if (!propertyConfig) {
    panelElement.innerHTML = '<div class="prop-loading">Loading properties...</div>';
    return;
  }
  
  const componentData = JSON.parse(wrapper.dataset.c || '{}');
  const wrapperId = wrapper.id;
  // THE FIX: Default to empty string
  const behavior = componentData.b || '';
  const currentProps = componentData.d || {};
  
  // Merge current props with defaults for this component type
  const defaultProps = (propertyConfig.componentDefaults && propertyConfig.componentDefaults[behavior]) || {};
  
  // Create a unified set of all property names
  const allPropNames = new Set([...Object.keys(currentProps), ...Object.keys(defaultProps)]);
  
  if (onChange) {
    window._propOnChange = onChange;
  }
  
  const grouped = {};
  
  for (const propName of allPropNames) {
    const def = getPropertyDef(propName, behavior);
    // Use current value if set, otherwise use default from config
    const propValue = currentProps.hasOwnProperty(propName) ? currentProps[propName] : (defaultProps[propName] ?? def?.default);
    
    const category = def?.category || 'other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    
    grouped[category].push({
      name: propName,
      value: propValue,
      def: def || { label: propName, ui: 'text' }
    });
  }
  
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const orderA = getCategory(a).order || 99;
    const orderB = getCategory(b).order || 99;
    return orderA - orderB;
  });
  
  let html = '<div class="prop-panel-flexcol">';
  
  // Header with component type
  html += `<div class="prop-header">
    <div class="prop-header-left">
      <span class="prop-header-title">${behavior || componentData.n || 'Component'}</span>
      <span class="prop-header-id">#${wrapperId}</span>
    </div>
    <button class="prop-header-help" onclick="showDocs('${behavior}')" title="View Documentation">❓</button>
  </div>`;

  // Special "Morph" dropdown for Cards
  // THIS WAS THE CRASH SITE
  if (behavior.startsWith('card')) {
    const cardTypes = ['card', 'cardimage']; // Mocked
    
    html += `<div class="prop-category">
      <div class="prop-category-title">Variant</div>
      <div class="prop-category-content">
        <div class="prop-row">
          <div class="prop-row-header">
            <label class="prop-label">Card Type</label>
          </div>
          <div class="prop-control">
            <select class="prop-input" onchange="changeCardType('${wrapperId}', this.value)">
              ${cardTypes.map(type => `<option value="${type}"${type === behavior ? ' selected' : ''}>${type}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>
    </div>`;
  }

  // ... rest of function omitted for brevity as it wasn't crashing ...
  
  panelElement.innerHTML = html;
}

// Test Case
try {
    console.log('Testing renderPropertiesPanel with component missing "b" property...');
    
    const mockWrapper = {
        id: 'test-123',
        dataset: {
            c: JSON.stringify({
                n: 'Heading 1',
                t: 'h1',
                d: { text: 'Hello' }
                // Note: 'b' is missing
            })
        }
    };
    
    const mockPanel = { innerHTML: '' };
    
    renderPropertiesPanel(mockWrapper, mockPanel);
    
    console.log('SUCCESS: Function executed without crashing.');
    console.log('Generated HTML length:', mockPanel.innerHTML.length);
    
} catch (e) {
    console.error('FAILURE: Function crashed:', e);
    process.exit(1);
}
