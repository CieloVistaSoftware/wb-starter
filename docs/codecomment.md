# Code Comment Standards

Guidelines for writing JSDoc and code comments that display correctly in VS Code IntelliSense.

## Core Principles

1. **Every function needs a description** - Explain what it does, not just its name
2. **IntelliSense-first** - Comments are documentation; format for tooltip rendering
3. **Be concise but complete** - Include enough detail to use without reading source

---

## JSDoc Structure

Every exported or significant function should have:

```javascript
/**
 * Brief description of what the function does.
 * Additional context if needed (one or two sentences max).
 * @param {Type} paramName - Description of parameter
 * @param {Type} [optionalParam] - Optional parameter (brackets)
 * @returns {Type} Description of return value
 * @example
 * functionName("input")  // → "output"
 * functionName({ key: "value" })  // → expectedResult
 */
```

---

## IntelliSense Formatting Rules

### 1. Wrap HTML Tags in Backticks

IntelliSense doesn't render raw HTML markup. Always wrap tags in backticks.

❌ **Wrong:**
```javascript
// Input: <wb-card title="Hello">
```

✅ **Correct:**
```javascript
// Input: `<wb-card title="Hello">`
```

### 2. Use ` - X.` Prefix for Separate Lines

IntelliSense collapses prose into runon text. Use markdown list format for distinct lines.

❌ **Wrong (runs together):**
```javascript
/**
 * EXAMPLE TRACE:
 * Step 1: detectSchema() returns "card"
 * Step 2: getSchema() looks up schema
 * Step 3: buildStructure() creates DOM
 */
```

✅ **Correct (each line separate):**
```javascript
/**
 * EXAMPLE TRACE:
 *   - Step 1: detectSchema() returns "card"
 *   - Step 2: getSchema() looks up schema
 *   - Step 3: buildStructure() creates DOM
 */
```

### 3. Truncate Long Lines

Keep comment lines under ~80 chars. Truncate with `...` if needed.

❌ **Wrong:**
```javascript
// This is a very long comment line that goes on and on describing something in excessive detail that nobody will read
```

✅ **Correct:**
```javascript
// This is a long comment line that describes something...
```

### 4. No Text Runon

Each conceptual item gets its own line. Use blank lines to separate sections.

---

## @example Block Format

Use consistent format showing input → output:

```javascript
/**
 * @example
 * parseValue("")         // → true (boolean attribute)
 * parseValue("true")     // → true
 * parseValue("42")       // → 42 (number)
 * parseValue('{"a":1}')  // → { a: 1 } (JSON)
 */
```

For method examples, show realistic usage:

```javascript
/**
 * @example
 * await loadSchemas('/src/wb-models')  // loads all *.schema.json files
 * await loadSchemas('/custom/path')    // custom schema location
 */
```

---

## EXAMPLE TRACE Blocks

For complex functions, include a trace showing the processing flow:

```javascript
/**
 * EXAMPLE TRACE:
 *   - Input:  element = `<wb-card title="Hello">`
 *   - Step 1: detectSchema() → "card"
 *   - Step 2: getSchema("card") → { behavior: "card", $view: [...] }
 *   - Step 3: extractData() → { title: "Hello", content: "..." }
 *   - Result: `<wb-card class="wb-card">...</wb-card>`
 */
```

Key patterns:
- Start with ` - ` for each line (IntelliSense compatibility)
- Use `→` for "produces" or "returns"
- Wrap HTML in backticks
- Keep each line self-contained

---

## Condition Documentation

When documenting condition logic, show multiple cases:

```javascript
/**
 * @example
 * // Simple property check
 * evaluateCondition("title", { title: "Hello" })        // → true
 * evaluateCondition("title", {})                        // → false
 *
 * // OR conditions (any match)
 * evaluateCondition("title OR subtitle", { title: "X" })  // → true
 *
 * // AND conditions (all must match)
 * evaluateCondition("title AND subtitle", { title: "X" }) // → false
 *
 * // NOT conditions
 * evaluateCondition("NOT disabled", { disabled: false })  // → true
 */
```

---

## Quick Reference

| Rule | Example |
|------|---------|
| HTML in backticks | `` `<wb-card>` `` |
| Separate lines | ` - Step 1: ...` |
| Return arrow | `// → result` |
| Optional param | `@param {Type} [name]` |
| Long line truncate | `...` |
| Boolean attr | `// → true (boolean attribute)` |

---

## Anti-Patterns

Avoid these common mistakes:

1. **No description** - Just `@param` and `@returns` without explaining purpose
2. **Raw HTML** - `<wb-card>` instead of `` `<wb-card>` ``
3. **Prose paragraphs** - Long text blocks that collapse in IntelliSense
4. **Missing examples** - Complex functions without usage examples
5. **Stale comments** - Comments that don't match current code behavior
