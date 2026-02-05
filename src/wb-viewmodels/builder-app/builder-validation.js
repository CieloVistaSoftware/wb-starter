/**
 * Property validation against schemas and compliance testing.
 * - Schema caching, test queue, failure logging.
 */
export function cc() {}

// =============================================================================
// BUILDER VALIDATION & COMPLIANCE TESTING
// Validates property changes against schema and logs test failures
// =============================================================================

const BuilderValidation = {
  schemaCache: {},
  testQueue: [],
  isProcessing: false,

  // =============================================================================
  // SCHEMA LOADING & CACHING
  // =============================================================================
  async getSchema(behavior) {
    if (this.schemaCache[behavior]) {
      return this.schemaCache[behavior];
    }

    try {
      const fetchResponse = await fetch(`src/behaviors/schema/${behavior}.schema.json?caller=builder-validation`);
      if (fetchResponse.ok) {
        const fetchedSchema = await fetchResponse.json();
        this.schemaCache[behavior] = fetchedSchema;
        return fetchedSchema;
      }
    } catch (err) {
      console.warn(`[Validation] No schema for ${behavior}:`, err.message);
    }
    return null;
  },

  // =============================================================================
  // TYPE VALIDATION
  // =============================================================================
  validateValue(value, propSchema, propName) {
    const errors = [];
    
    if (!propSchema) return { valid: true, errors };

    const type = propSchema.type;
    
    // Handle empty/null values
    if (value === '' || value === null || value === undefined) {
      if (propSchema.required) {
        errors.push({ type: 'required', message: `${propName} is required` });
      }
      return { valid: errors.length === 0, errors };
    }

    // Type checking
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push({ type: 'type', message: `${propName} must be a string` });
        } else {
          if (propSchema.minLength && value.length < propSchema.minLength) {
            errors.push({ type: 'minLength', message: `${propName} must be at least ${propSchema.minLength} characters` });
          }
          if (propSchema.maxLength && value.length > propSchema.maxLength) {
            errors.push({ type: 'maxLength', message: `${propName} must be at most ${propSchema.maxLength} characters` });
          }
          if (propSchema.pattern) {
            const regex = new RegExp(propSchema.pattern);
            if (!regex.test(value)) {
              errors.push({ type: 'pattern', message: `${propName} does not match required pattern` });
            }
          }
        }
        break;

      case 'number':
      case 'integer':
        const num = parseFloat(value);
        if (isNaN(num)) {
          errors.push({ type: 'type', message: `${propName} must be a number` });
        } else {
          if (type === 'integer' && !Number.isInteger(num)) {
            errors.push({ type: 'type', message: `${propName} must be an integer` });
          }
          if (propSchema.minimum !== undefined && num < propSchema.minimum) {
            errors.push({ type: 'minimum', message: `${propName} must be at least ${propSchema.minimum}` });
          }
          if (propSchema.maximum !== undefined && num > propSchema.maximum) {
            errors.push({ type: 'maximum', message: `${propName} must be at most ${propSchema.maximum}` });
          }
        }
        break;

      case 'boolean':
        if (value !== 'true' && value !== 'false' && value !== true && value !== false) {
          errors.push({ type: 'type', message: `${propName} must be true or false` });
        }
        break;

      case 'array':
        try {
          const arr = typeof value === 'string' ? JSON.parse(value) : value;
          if (!Array.isArray(arr)) {
            errors.push({ type: 'type', message: `${propName} must be an array` });
          }
        } catch {
          errors.push({ type: 'type', message: `${propName} must be a valid JSON array` });
        }
        break;
    }

    // Enum validation
    if (propSchema.enum && !propSchema.enum.includes(value)) {
      errors.push({ 
        type: 'enum', 
        message: `${propName} must be one of: ${propSchema.enum.join(', ')}` 
      });
    }

    return { valid: errors.length === 0, errors };
  },

  // =============================================================================
  // COMPLIANCE TEST RUNNER
  // =============================================================================
  async runComplianceTest(behavior, element, propName, newValue) {
    const testResult = {
      id: `${behavior}-${propName}-${Date.now()}`,
      behavior,
      property: propName,
      value: newValue,
      timestamp: new Date().toISOString(),
      schemaValid: false,
      behaviorValid: false,
      errors: [],
      warnings: []
    };

    // 1. Schema Validation
    const validationSchema = await this.getSchema(behavior);
    if (validationSchema && validationSchema.properties && validationSchema.properties[propName]) {
      const validation = this.validateValue(newValue, validationSchema.properties[propName], propName);
      testResult.schemaValid = validation.valid;
      if (!validation.valid) {
        testResult.errors.push(...validation.errors.map(e => ({
          source: 'schema',
          ...e
        })));
      }
    } else {
      testResult.schemaValid = true; // No schema = no schema errors
      testResult.warnings.push({ message: `No schema definition for ${behavior}.${propName}` });
    }

    // 2. Behavior Validation (check if component renders correctly)
    try {
      // Wait for WB to re-render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if element is still in DOM and valid
      if (!element || !document.body.contains(element)) {
        testResult.errors.push({
          source: 'behavior',
          type: 'element-removed',
          message: 'Element was removed from DOM after property change'
        });
      } else {
        // Check for JavaScript errors (would be caught by global handler)
        const hasErrors = element.dataset.wbError === 'true';
        if (hasErrors) {
          testResult.errors.push({
            source: 'behavior',
            type: 'render-error',
            message: 'Component threw an error during re-render'
          });
        } else {
          testResult.behaviorValid = true;
        }
      }
    } catch (err) {
      testResult.errors.push({
        source: 'behavior',
        type: 'exception',
        message: err.message
      });
    }

    // 3. Log results
    if (!testResult.schemaValid || !testResult.behaviorValid) {
      await this.logTestFailure(testResult);
    }

    return testResult;
  },

  // =============================================================================
  // TEST FAILURE LOGGING
  // =============================================================================
  async logTestFailure(testResult) {
    // Queue the failure for batch processing
    this.testQueue.push(testResult);
    
    // Save to localStorage immediately for persistence
    const failuresList = JSON.parse(localStorage.getItem('wb-test-failures') || '[]');
    failuresList.push(testResult);
    
    // Keep only last 100 failures
    if (failuresList.length > 100) {
      failuresList.splice(0, failuresList.length - 100);
    }
    
    localStorage.setItem('wb-test-failures', JSON.stringify(failuresList));
    
    // Try to save to server
    this.saveToServer();
    
    // Show visual feedback
    this.showTestError(testResult);
  },

  async saveToServer() {
    if (this.isProcessing || this.testQueue.length === 0) return;
    
    this.isProcessing = true;
    const failuresToSave = [...this.testQueue];
    this.testQueue = [];
    
    try {
      const saveResponse = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'data/test-failures.json',
          data: {
            lastUpdated: new Date().toISOString(),
            source: 'builder-validation',
            failures: failuresToSave
          }
        })
      });
      
      if (!saveResponse.ok) {
        console.warn('[Validation] Failed to save test failures to server');
      }
    } catch (err) {
      console.warn('[Validation] Server save error:', err.message);
    }
    
    this.isProcessing = false;
  },

  showTestError(testResult) {
    const errorCount = testResult.errors.length;
    const msg = `⚠️ ${errorCount} validation error${errorCount > 1 ? 's' : ''} for ${testResult.property}`;
    
    // Use toast if available
    if (window.toast) {
      const toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = msg;
        toast.style.background = 'var(--danger-color, #ef4444)';
        toast.classList.add('show');
        setTimeout(() => {
          toast.classList.remove('show');
          toast.style.background = '';
        }, 3000);
      }
    }
    
    // Log to console
    console.warn('[Validation]', msg, testResult.errors);
  },

  // =============================================================================
  // GET PENDING FAILURES FOR NEXT TEST RUN
  // =============================================================================
  getPendingFailures() {
    return JSON.parse(localStorage.getItem('wb-test-failures') || '[]');
  },

  clearPendingFailures() {
    localStorage.removeItem('wb-test-failures');
    this.testQueue = [];
  },

  // =============================================================================
  // LOG FIX
  // =============================================================================
  async logFix(fix) {
    try {
      // Load existing fixes
      const fixesResponse = await fetch('data/fixes.json');
      let fixesData = { fixes: {}, stats: { totalFixes: 0 } };
      
      if (fixesResponse.ok) {
        fixesData = await fixesResponse.json();
      }

      // Generate fix ID
      const fixId = `${fix.component}_${fix.property}_${Date.now()}`.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
      
      // Add fix
      fixesData.fixes[fixId] = {
        errorId: fixId,
        component: fix.component,
        property: fix.property,
        errorSignature: fix.errorSignature || `${fix.property} validation failure`,
        issue: fix.issue,
        fix: {
          action: fix.action,
          oldValue: fix.oldValue,
          newValue: fix.newValue,
          verify: fix.verify || `Property ${fix.property} passes validation`
        },
        status: 'APPLIED',
        appliedDate: new Date().toISOString()
      };

      // Update stats
      fixesData.stats.totalFixes = Object.keys(fixesData.fixes).length;
      fixesData.metadata = fixesData.metadata || {};
      fixesData.metadata.lastUpdated = new Date().toISOString();

      // Save
      const fixResponse = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'data/fixes.json',
          data: fixesData
        })
      });

      console.log('[Validation] Fix logged:', fixId);
      return fixId;
    } catch (err) {
      console.error('[Validation] Failed to log fix:', err);
      return null;
    }
  }
};

// Export for use in builder
window.BuilderValidation = BuilderValidation;

export default BuilderValidation;
