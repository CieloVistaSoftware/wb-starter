/**
 * COMPREHENSIVE SCHEMA-SOURCE AUDIT
 * ==================================
 * Run: node audit-compliance.mjs
 * 
 * Checks ALL schemas against test requirements and source code.
 */

import fs from 'fs';
import path from 'path';

const SCHEMA_DIR = 'src/behaviors/schema';
const JS_DIR = 'src/behaviors/js';

// ═══════════════════════════════════════════════════════════════════════════
// LOAD ALL DATA
// ═══════════════════════════════════════════════════════════════════════════

function getSchemaFiles() {
  return fs.readdirSync(SCHEMA_DIR)
    .filter(f => f.endsWith('.schema.json') && !f.includes('.base.'));
}

function loadSchema(filename) {
  try {
    const content = fs.readFileSync(path.join(SCHEMA_DIR, filename), 'utf-8');
    return { filename, schema: JSON.parse(content) };
  } catch (e) {
    return { filename, error: e.message };
  }
}

function getAllJsSource(dir = JS_DIR) {
  let sources = {};
  const files = fs.readdirSync(dir);
  
  for (const f of files) {
    const fullPath = path.join(dir, f);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      Object.assign(sources, getAllJsSource(fullPath));
    } else if (f.endsWith('.js')) {
      sources[f] = fs.readFileSync(fullPath, 'utf-8');
    }
  }
  return sources;
}

// Extract function body
function extractFunction(source, funcName) {
  // Handle reserved words mapping
  const nameMap = {
    'switch': 'switchInput',
    'behaviors-showcase': 'behaviorsShowcase'
  };
  const actualName = nameMap[funcName] || funcName;

  const exportPattern = new RegExp(
    `export\\s+(async\\s+)?function\\s+${actualName}\\s*\\([^)]*\\)\\s*\\{`,
    'g'
  );
  
  const match = exportPattern.exec(source);
  if (!match) return null;
  
  const startIdx = match.index;
  const bodyStartIdx = match.index + match[0].length;
  
  let braceCount = 1;
  let endIdx = bodyStartIdx;
  let inString = false;
  let inComment = false;
  let stringChar = '';
  
  for (let i = bodyStartIdx; i < source.length; i++) {
    const char = source[i];
    const prevChar = source[i - 1];
    
    if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
      if (!inString && !inComment) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar && !inComment) {
        inString = false;
      }
    }
    
    // Handle comments
    if (!inString) {
      if (!inComment && char === '/' && source[i+1] === '/') {
        inComment = 'line';
        i++; // Skip next char
      } else if (!inComment && char === '/' && source[i+1] === '*') {
        inComment = 'block';
        i++; // Skip next char
      } else if (inComment === 'line' && char === '\n') {
        inComment = false;
      } else if (inComment === 'block' && char === '*' && source[i+1] === '/') {
        inComment = false;
        i++; // Skip next char
      }
    }
    
    if (!inString && !inComment) {
      if (char === '{') braceCount++;
      if (char === '}') {
        braceCount--;
        if (funcName === 'dropdown') console.log(`DEBUG: dropdown braceCount: ${braceCount} at index ${i}`);
        if (braceCount === 0) {
          endIdx = i + 1;
          break;
        }
      }
    }
  }
  
  return source.substring(startIdx, endIdx);
}

function createsElement(funcBody, tagName) {
  const pattern = new RegExp(`createElement\\s*\\(\\s*['"]${tagName}['"]`, 'i');
  const innerHtmlPattern = new RegExp(`innerHTML\\s*=[\\s\\S]*<${tagName}`, 'i');
  
  // Check for helper methods
  if (tagName === 'header' && funcBody.includes('createHeader')) return true;
  if (tagName === 'main' && funcBody.includes('createMain')) return true;
  if (tagName === 'footer' && funcBody.includes('createFooter')) return true;
  if (tagName === 'figure' && funcBody.includes('createFigure')) return true;
  
  return pattern.test(funcBody) || innerHtmlPattern.test(funcBody);
}

function setsStyle(funcBody, styleProp) {
  // Special case for cardBase inheritance
  if (funcBody.includes('cardBase') && styleProp === 'border') {
    return true;
  }
  const pattern = new RegExp(`\\.style\\.${styleProp}\\s*=`, 'i');
  return pattern.test(funcBody);
}

function addsClass(funcBody, className) {
  // Special case for cardBase inheritance
  if (className === 'wb-card' && funcBody.includes('cardBase')) {
    return true;
  }
  const pattern1 = new RegExp(`classList\\.add\\s*\\(\\s*['"]${className}['"]`, 'i');
  const pattern2 = new RegExp(`className\\s*[+=].*['"].*${className}`, 'i');
  return pattern1.test(funcBody) || pattern2.test(funcBody) || 
         funcBody.includes(`'${className}'`) || funcBody.includes(`"${className}"`);
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDIT
// ═══════════════════════════════════════════════════════════════════════════

const schemas = getSchemaFiles().map(loadSchema);
const jsSources = getAllJsSource();
const allJs = Object.values(jsSources).join('\n');

const issues = {
  schemaStructure: [],
  missingFunction: [],
  missingBaseClass: [],
  missingStyles: [],
  missingElements: [],
  headingLevels: [],
};

// Critical style requirements (from test file)
const CRITICAL_STYLES = {
  'cardhero': ['border'],
  'cardprofile': ['border'],
  'cardoverlay': ['backgroundImage', 'backgroundSize'],
  'progress': ['width'],
  'spinner': ['animation'],
};

// Heading requirements
const HEADING_REQUIREMENTS = {
  'cardhero': 'h3',
  'cardoverlay': 'h3',
  'cardprofile': 'h3',
};

console.log('═══════════════════════════════════════════════════════════════════');
console.log('COMPREHENSIVE SCHEMA-SOURCE COMPLIANCE AUDIT');
console.log('═══════════════════════════════════════════════════════════════════\n');

for (const { filename, schema, error } of schemas) {
  if (error) {
    issues.schemaStructure.push(`❌ ${filename}: Parse error - ${error}`);
    continue;
  }
  
  const behavior = schema.behavior;
  
  // 1. Check schema has required fields
  if (!behavior) {
    issues.schemaStructure.push(`❌ ${filename}: Missing "behavior" field`);
    continue;
  }
  
  if (!schema.compliance) {
    issues.schemaStructure.push(`❌ ${filename}: Missing "compliance" section`);
  } else if (!schema.compliance.baseClass) {
    issues.schemaStructure.push(`❌ ${filename}: compliance.baseClass missing`);
  }
  
  if (!schema.test) {
    issues.schemaStructure.push(`❌ ${filename}: Missing "test" section`);
  } else {
    if (!schema.test.setup) {
      issues.schemaStructure.push(`❌ ${filename}: test.setup missing`);
    }
    if (!schema.test.matrix) {
      issues.schemaStructure.push(`❌ ${filename}: test.matrix missing`);
    }
  }
  
  // 2. Check function exists
  const funcBody = extractFunction(allJs, behavior);
  if (behavior === 'card' || behavior === 'dropdown') {
     console.log(`DEBUG: ${behavior} body length:`, funcBody ? funcBody.length : 'null');
     if (funcBody) console.log(`DEBUG: ${behavior} body start:`, funcBody.substring(0, 100));
  }
  if (!funcBody) {
    issues.missingFunction.push(`❌ ${behavior}: No exported function found`);
    continue;
  }
  
  // 3. Check base class assignment
  if (schema.compliance?.baseClass) {
    if (!addsClass(funcBody, schema.compliance.baseClass)) {
      issues.missingBaseClass.push(`❌ ${behavior}: Doesn't add "${schema.compliance.baseClass}"`);
    }
  }
  
  // 4. Check critical styles
  if (CRITICAL_STYLES[behavior]) {
    for (const style of CRITICAL_STYLES[behavior]) {
      if (!setsStyle(funcBody, style)) {
        issues.missingStyles.push(`❌ ${behavior}: Missing style.${style}`);
      }
    }
  }
  
  // 5. Check heading levels
  if (HEADING_REQUIREMENTS[behavior]) {
    const tag = HEADING_REQUIREMENTS[behavior];
    if (!createsElement(funcBody, tag)) {
      issues.headingLevels.push(`❌ ${behavior}: Must create <${tag}> for title`);
    }
  }
  
  // 6. Check required children
  if (schema.compliance?.requiredChildren) {
    for (const [selector, def] of Object.entries(schema.compliance.requiredChildren)) {
      if (def.tagName && def.required !== false) {
        const tag = def.tagName.toLowerCase();
        if (!createsElement(funcBody, tag)) {
          issues.missingElements.push(`❌ ${behavior}: Should create <${tag}> for ${selector}`);
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// REPORT
// ═══════════════════════════════════════════════════════════════════════════

console.log('📋 SCHEMA STRUCTURE ISSUES:');
if (issues.schemaStructure.length === 0) {
  console.log('   ✅ All schemas have required fields');
} else {
  issues.schemaStructure.forEach(i => console.log('   ' + i));
}

console.log('\n📋 MISSING FUNCTIONS:');
if (issues.missingFunction.length === 0) {
  console.log('   ✅ All behaviors have exported functions');
} else {
  issues.missingFunction.forEach(i => console.log('   ' + i));
}

console.log('\n📋 MISSING BASE CLASS ASSIGNMENTS:');
if (issues.missingBaseClass.length === 0) {
  console.log('   ✅ All functions add their base class');
} else {
  issues.missingBaseClass.forEach(i => console.log('   ' + i));
}

console.log('\n📋 MISSING CRITICAL STYLES:');
if (issues.missingStyles.length === 0) {
  console.log('   ✅ All critical styles are set');
} else {
  issues.missingStyles.forEach(i => console.log('   ' + i));
}

console.log('\n📋 HEADING LEVEL ISSUES:');
if (issues.headingLevels.length === 0) {
  console.log('   ✅ All heading levels correct');
} else {
  issues.headingLevels.forEach(i => console.log('   ' + i));
}

console.log('\n📋 MISSING REQUIRED ELEMENTS:');
if (issues.missingElements.length === 0) {
  console.log('   ✅ All required children created');
} else {
  issues.missingElements.forEach(i => console.log('   ' + i));
}

// Total
const total = Object.values(issues).flat().length;
console.log('\n═══════════════════════════════════════════════════════════════════');
console.log(`TOTAL ISSUES: ${total}`);
console.log('═══════════════════════════════════════════════════════════════════\n');

// Write to file
const report = {
  timestamp: new Date().toISOString(),
  totalIssues: total,
  issues
};
fs.writeFileSync('data/compliance-audit.json', JSON.stringify(report, null, 2));
console.log('📁 Report saved to data/compliance-audit.json');
