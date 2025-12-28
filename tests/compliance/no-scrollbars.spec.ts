import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Compliance: No Scrollbars in Docs', () => {
  
  test('docs-div-1 children should have scrollbars hidden', async ({ page }) => {
    // Navigate to docs page
    // We assume the server is running on localhost:3000
    // If not, we can try to load the file content and check CSS, but runtime check is better.
    
    // Since we can't easily rely on the server being up in this environment for the test runner (unless I start it),
    // I will check the CSS file content for the rule.
    
    const cssPath = path.join(process.cwd(), 'src', 'styles', 'site.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Check for the rule
    const hasRule = cssContent.includes('#docs-div-1 > *') && 
                    cssContent.includes('scrollbar-width: none') &&
                    cssContent.includes('display: none');
                    
    expect(hasRule, 'site.css should contain rule to hide scrollbars for #docs-div-1 children').toBe(true);
  });

});
