/** SCHEMA: draggable.schema.json */
import { test, expect } from "@playwright/test";

const TEST_URL = "http://localhost:3000/pages/behaviors.html";

test.describe("draggable", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForTimeout(1000);
  });

  // REQ-001: MUST NOT change element position on initialization
  test("REQ-001: position unchanged on inject", async ({ page }) => {
    const box = await page.evaluate(() => {
      const el = document.createElement("div");
      el.id = "test-drag";
      el.style.cssText = "width:100px;height:100px;background:red;";
      document.body.appendChild(el);
      return el.getBoundingClientRect();
    });
    await page.evaluate(() => document.getElementById("test-drag").setAttribute("x-draggable", ""));
    await page.waitForTimeout(500);
    const after = await page.evaluate(() => document.getElementById("test-drag").getBoundingClientRect());
    expect(after.x).toBe(box.x);
    expect(after.y).toBe(box.y);
  });

  // REQ-002: MUST only apply position:relative when drag starts
  test("REQ-002: position not forced on inject", async ({ page }) => {
    const pos = await page.evaluate(() => {
      const el = document.createElement("div");
      el.id = "test-pos";
      el.style.cssText = "width:100px;height:100px;";
      document.body.appendChild(el);
      return getComputedStyle(el).position;
    });
    await page.evaluate(() => document.getElementById("test-pos").setAttribute("x-draggable",""));
    await page.waitForTimeout(500);
    const after = await page.evaluate(() => getComputedStyle(document.getElementById("test-pos")).position);
    expect(after).toBe(pos);
  });

  // REQ-005: MUST constrain to axis when set
  test("REQ-005: axis=x blocks vertical", async ({ page }) => {
    await page.evaluate(() => {
      const el = document.createElement("div");
      el.id = "test-axis";
      el.style.cssText = "width:100px;height:100px;background:green;position:relative;left:0;top:0;";
      el.setAttribute("x-draggable","");
      el.setAttribute("data-axis","x");
      document.body.appendChild(el);
    });
    await page.waitForTimeout(500);
    const start = await page.locator("#test-axis").boundingBox();
    await page.locator("#test-axis").hover();
    await page.mouse.down();
    await page.mouse.move(start.x+50, start.y+50);
    await page.mouse.up();
    const end = await page.locator("#test-axis").boundingBox();
    expect(Math.abs(end.y - start.y)).toBeLessThan(5);
  });
});
