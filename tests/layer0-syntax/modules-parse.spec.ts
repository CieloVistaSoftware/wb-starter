/** Layer 0 */
import { test, expect } from "@playwright/test";

test.describe("Layer 0: Syntax", () => {
  test("modules load without syntax errors", async ({ page }) => {
    const errors = [];
    page.on("console", msg => { if(msg.text().includes("SyntaxError")||msg.text().includes("Failed to load")) errors.push(msg.text()); });
    await page.goto("http://localhost:3000/");
    await page.waitForTimeout(2000);
    expect(errors).toEqual([]);
  });

  test("WB initializes", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.waitForTimeout(2000);
    const exists = await page.evaluate(() => typeof window.WB !== "undefined");
    expect(exists).toBe(true);
  });
});
