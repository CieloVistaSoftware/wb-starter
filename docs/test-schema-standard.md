# Comprehensive Test Schema Standard

## Overview

Every behavior schema MUST define tests that guarantee **100% functional compliance** in ONE test run. This means:
- All parameters work correctly
- All buttons/elements are clickable and functional
- All events fire properly
- All accessibility attributes are present
- All visual states render correctly
- All interactions behave as expected

---

## Schema Structure

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Component Name",
  "description": "What this component does",
  "behavior": "behaviorname",
  
  "properties": {
    "propName": {
      "type": "string|boolean|number",
      "description": "What this prop does",
      "enum": ["value1", "value2"],
      "default": "value1",
      "permutations": {
        "type": "ALL_ENUM|BOOLEAN|BOUNDARY_NUMBER|EXPLICIT",
        "values": [],
        "assertions": {}
      }
    }
  },
  
  "compliance": {},
  "interactions": {},
  "accessibility": {},
  "events": {},
  "test": {}
}
```

---

## 1. PROPERTIES with PERMUTATIONS

Every property MUST define permutations with specific assertions:

### Permutation Types

| Type | Use Case | Example |
|------|----------|---------|
| `ALL_ENUM` | Test all enum values | `["default", "primary", "success"]` |
| `ALL_ENUM_PLUS_NULL` | Enum + undefined/null | Test missing attribute |
| `BOOLEAN` | True/false props | `[true, false]` |
| `BOUNDARY_NUMBER` | Min/max/edge values | `[0, 1, 50, 99, 100]` |
| `EXPLICIT` | Specific test values | `["custom", "values"]` |

### Assertion Structure

```json
"permutations": {
  "type": "ALL_ENUM",
  "assertions": {
    "default": {
      "selector": "element",
      "checks": {
        "hasClass": "wb-component--default",
        "backgroundColor": "rgb(31, 41, 55)"
      }
    },
    "primary": {
      "selector": "element",
      "checks": {
        "hasClass": "wb-component--primary",
        "backgroundColor": "rgb(99, 102, 241)"
      }
    }
  }
}
```

---

## 2. COMPLIANCE Section

Defines structural requirements:

```json
"compliance": {
  "baseClass": "wb-card",
  "parentClass": "wb-card--variant",
  
  "requiredChildren": {
    ".wb-card__header": {
      "description": "Card header section",
      "required": true,
      "tagName": "HEADER",
      "minCount": 1
    },
    ".wb-card__btn--primary": {
      "description": "Primary action button",
      "required": true,
      "requiredWhen": "data-primary is set"
    }
  },
  
  "optionalChildren": {
    ".wb-card__subtitle": {
      "description": "Optional subtitle",
      "required": false
    }
  },
  
  "styles": {
    "border": {
      "required": true,
      "pattern": "1px solid"
    },
    "borderRadius": {
      "required": true,
      "value": "8px"
    }
  }
}
```

---

## 3. INTERACTIONS Section (NEW - Critical for Functional Testing)

Defines ALL clickable/interactive elements and expected behavior:

```json
"interactions": {
  "elements": {
    ".wb-card__btn--primary": {
      "type": "button",
      "clickable": true,
      "click": {
        "action": "dispatch event",
        "event": "wb:card:action",
        "eventDetail": { "action": "primary" }
      },
      "hover": {
        "style": { "backgroundColor": "var(--primary-dark)" }
      },
      "focus": {
        "style": { "outline": "2px solid var(--primary)" }
      }
    },
    ".wb-card__btn--secondary": {
      "type": "button",
      "clickable": true,
      "click": {
        "action": "dispatch event",
        "event": "wb:card:action",
        "eventDetail": { "action": "secondary" }
      }
    },
    ".wb-card__expand-btn": {
      "type": "button",
      "clickable": true,
      "click": {
        "action": "toggle class",
        "targetSelector": "element",
        "class": "wb-card--expanded"
      }
    },
    ".wb-card__notif-close": {
      "type": "button",
      "clickable": true,
      "click": {
        "action": "remove element",
        "target": "element"
      }
    }
  },
  
  "keyboard": {
    "Enter": {
      "target": "[tabindex]",
      "action": "trigger click"
    },
    "Space": {
      "target": "[tabindex]",
      "action": "trigger click"
    },
    "Escape": {
      "target": "element",
      "action": "close/minimize"
    }
  },
  
  "drag": {
    "handle": ".wb-card__drag-handle",
    "bounds": "viewport",
    "events": ["dragstart", "drag", "dragend"]
  }
}
```

---

## 4. ACCESSIBILITY Section

```json
"accessibility": {
  "element": {
    "role": "article|button|region",
    "tabindex": "0",
    "aria-label": "dynamic"
  },
  "children": {
    ".wb-card__header button": {
      "aria-expanded": "true|false",
      "aria-controls": "panel-id"
    },
    ".wb-card__close-btn": {
      "aria-label": "Close"
    }
  }
}
```

---

## 5. EVENTS Section

All custom events the component dispatches:

```json
"events": {
  "wb:card:click": {
    "trigger": "click on clickable card",
    "detail": {
      "active": "boolean"
    },
    "bubbles": true
  },
  "wb:card:expand": {
    "trigger": "expand button clicked",
    "detail": {
      "expanded": "boolean"
    }
  },
  "wb:card:dismiss": {
    "trigger": "close button clicked",
    "detail": {}
  }
}
```

---

## 6. TEST Section - Comprehensive Matrix

```json
"test": {
  "setup": [
    "<div data-wb=\"cardbutton\" data-title=\"Test\" data-primary=\"Save\" data-secondary=\"Cancel\">Content</div>"
  ],
  
  "matrix": {
    "combinations": [
      {},
      { "title": "Test Title" },
      { "title": "Test", "primary": "Save" },
      { "title": "Test", "primary": "Save", "secondary": "Cancel" },
      { "title": "Test", "primary": "Save", "primaryHref": "/save" },
      { "variant": "info", "title": "Info Card" }
    ]
  },
  
  "functional": {
    "buttons": [
      {
        "name": "primary button click",
        "setup": "<div data-wb=\"cardbutton\" data-primary=\"Save\"></div>",
        "selector": ".wb-card__btn--primary",
        "action": "click",
        "expect": {
          "event": "wb:card:action",
          "eventDetail": { "action": "primary" }
        }
      },
      {
        "name": "secondary button click",
        "setup": "<div data-wb=\"cardbutton\" data-secondary=\"Cancel\"></div>",
        "selector": ".wb-card__btn--secondary",
        "action": "click",
        "expect": {
          "event": "wb:card:action"
        }
      }
    ],
    
    "interactions": [
      {
        "name": "hover effect",
        "setup": "<div data-wb=\"card\" data-hoverable></div>",
        "action": "hover",
        "expect": {
          "style": {
            "transform": "translateY(-2px)"
          }
        }
      },
      {
        "name": "click toggle",
        "setup": "<div data-wb=\"card\" data-clickable></div>",
        "action": "click",
        "expect": {
          "class": "wb-card--active",
          "event": "wb:card:click"
        }
      }
    ],
    
    "keyboard": [
      {
        "name": "Enter activates clickable card",
        "setup": "<div data-wb=\"card\" data-clickable></div>",
        "key": "Enter",
        "expect": {
          "class": "wb-card--active"
        }
      }
    ],
    
    "dismiss": [
      {
        "name": "close button removes notification",
        "setup": "<div data-wb=\"cardnotification\" data-dismissible data-message=\"Test\"></div>",
        "selector": ".wb-card__notif-close",
        "action": "click",
        "expect": {
          "removed": true
        }
      }
    ]
  },
  
  "api": {
    "methods": [
      {
        "name": "expand() method",
        "setup": "<div data-wb=\"cardexpandable\" data-title=\"Test\">Long content here</div>",
        "call": "element.wbCardExpandable.expand()",
        "expect": {
          "class": "wb-card--expanded",
          "property": { "expanded": true }
        }
      },
      {
        "name": "collapse() method",
        "setup": "<div data-wb=\"cardexpandable\" data-expanded>Content</div>",
        "call": "element.wbCardExpandable.collapse()",
        "expect": {
          "notClass": "wb-card--expanded",
          "property": { "expanded": false }
        }
      }
    ]
  }
}
```

---

## Complete Example: cardbutton.schema.json

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Card Button",
  "description": "Card with action buttons in footer",
  "behavior": "cardbutton",
  
  "properties": {
    "title": {
      "type": "string",
      "description": "Card title",
      "permutations": {
        "type": "EXPLICIT",
        "values": [null, "Short", "A Very Long Title That Should Truncate Properly"],
        "assertions": {
          "null": { "selector": ".wb-card__header", "checks": { "exists": false } },
          "Short": { "selector": ".wb-card__title", "checks": { "textContains": "Short" } }
        }
      }
    },
    "primary": {
      "type": "string",
      "description": "Primary button text",
      "permutations": {
        "type": "EXPLICIT",
        "values": [null, "Save", "Submit Form"],
        "assertions": {
          "null": { "selector": ".wb-card__btn--primary", "checks": { "exists": false } },
          "Save": { 
            "selector": ".wb-card__btn--primary", 
            "checks": { 
              "exists": true,
              "textContains": "Save",
              "tagName": "BUTTON"
            } 
          }
        }
      }
    },
    "primaryHref": {
      "type": "string",
      "description": "URL for primary button (makes it a link)",
      "permutations": {
        "type": "EXPLICIT",
        "values": [null, "/save", "https://example.com"],
        "assertions": {
          "/save": { 
            "selector": ".wb-card__btn--primary", 
            "checks": { 
              "tagName": "A",
              "attribute": { "href": "/save" }
            } 
          }
        }
      }
    },
    "secondary": {
      "type": "string",
      "description": "Secondary button text",
      "permutations": {
        "type": "EXPLICIT",
        "values": [null, "Cancel"],
        "assertions": {
          "Cancel": { 
            "selector": ".wb-card__btn--secondary", 
            "checks": { "exists": true, "textContains": "Cancel" } 
          }
        }
      }
    }
  },
  
  "compliance": {
    "baseClass": "wb-card",
    "parentClass": "wb-card--button",
    "requiredChildren": {
      ".wb-card__footer": {
        "description": "Footer containing buttons",
        "required": true,
        "requiredWhen": "primary or secondary is set"
      }
    },
    "styles": {
      "border": { "required": true, "pattern": "1px solid" },
      "borderRadius": { "required": true },
      "padding": { "required": true }
    }
  },
  
  "interactions": {
    "elements": {
      ".wb-card__btn--primary": {
        "type": "button",
        "clickable": true,
        "click": {
          "action": "dispatch event OR navigate",
          "event": "click",
          "navigateWhen": "primaryHref is set"
        },
        "hover": {
          "style": { "opacity": "0.9" }
        },
        "focus": {
          "visible": true
        }
      },
      ".wb-card__btn--secondary": {
        "type": "button", 
        "clickable": true
      }
    }
  },
  
  "accessibility": {
    ".wb-card__btn--primary": {
      "role": "implicit button/link"
    },
    ".wb-card__btn--secondary": {
      "role": "implicit button/link"
    }
  },
  
  "test": {
    "setup": [
      "<div data-wb=\"cardbutton\" data-title=\"Actions\" data-primary=\"Save\" data-secondary=\"Cancel\">Content</div>"
    ],
    
    "matrix": {
      "combinations": [
        {},
        { "primary": "Save" },
        { "secondary": "Cancel" },
        { "primary": "Save", "secondary": "Cancel" },
        { "title": "Actions", "primary": "Save" },
        { "primary": "Go", "primaryHref": "/go" },
        { "secondary": "Back", "secondaryHref": "/back" }
      ]
    },
    
    "functional": {
      "buttons": [
        {
          "name": "primary button is clickable",
          "setup": "<div data-wb=\"cardbutton\" data-primary=\"Save\"></div>",
          "selector": ".wb-card__btn--primary",
          "action": "click",
          "expect": {
            "clickable": true,
            "noError": true
          }
        },
        {
          "name": "primary button as link has href",
          "setup": "<div data-wb=\"cardbutton\" data-primary=\"Go\" data-primary-href=\"/test\"></div>",
          "selector": ".wb-card__btn--primary",
          "expect": {
            "tagName": "A",
            "attribute": { "href": "/test" }
          }
        },
        {
          "name": "secondary button is clickable",
          "setup": "<div data-wb=\"cardbutton\" data-secondary=\"Cancel\"></div>",
          "selector": ".wb-card__btn--secondary",
          "action": "click",
          "expect": {
            "clickable": true
          }
        }
      ],
      
      "visual": [
        {
          "name": "buttons have proper styling",
          "setup": "<div data-wb=\"cardbutton\" data-primary=\"Save\" data-secondary=\"Cancel\"></div>",
          "checks": [
            { "selector": ".wb-card__btn--primary", "style": "backgroundColor", "pattern": "rgb\\(99, 102, 241\\)" },
            { "selector": ".wb-card__btn--secondary", "style": "backgroundColor", "notEmpty": true }
          ]
        }
      ]
    }
  }
}
```

---

## Test Runner Implementation

The test runner (`permutation-compliance.spec.ts`) must:

1. **Load schema** and parse all sections
2. **Run property permutations** - test each value with its assertions
3. **Run matrix combinations** - test all combos initialize
4. **Run functional tests**:
   - Click every button, verify action
   - Hover elements, verify style changes
   - Press keyboard keys, verify response
   - Call API methods, verify state
5. **Check accessibility** - verify ARIA attributes
6. **Check events** - verify custom events fire
7. **Check removal/dismiss** - verify cleanup works

---

## Checklist for Complete Schema

- [ ] Every property has `permutations` with `assertions`
- [ ] `compliance.requiredChildren` lists all generated elements
- [ ] `interactions.elements` lists ALL clickable/interactive elements
- [ ] `interactions.keyboard` defines keyboard behavior
- [ ] `accessibility` defines ARIA requirements
- [ ] `events` lists all custom events
- [ ] `test.matrix.combinations` covers edge cases
- [ ] `test.functional.buttons` tests every button click
- [ ] `test.functional.interactions` tests hover/focus
- [ ] `test.api.methods` tests component API (if any)

---

*This standard ensures ONE test validates EVERYTHING - parameters, buttons, elements, events, accessibility, and interactions.*
