import { test, expect } from "@playwright/test";

test("homepage renders the AUTOX fleet and booking flow", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /More freedom/i })).toBeVisible();
  await expect(page.locator(".car").first()).toBeVisible();
  await page.getByLabel("Pickup date").fill("2027-01-10");
  await page.getByLabel("Return date").fill("2027-01-12");
  await expect(page.locator("#booking-summary")).toContainText("2 rental days");
});

test("login page shows fields and toggles password visibility", async ({ page }) => {
  await page.goto("/login.html", { waitUntil: "domcontentloaded" });
  const password = page.getByLabel("Password", { exact: true });
  await expect(password).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
  await expect(page.getByRole("button", { name: /Continue with Google/i })).toBeVisible();
});

test("mobile homepage stays within the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
});

test("admin route does not render for an unauthenticated browser", async ({ page }) => {
  await page.goto("/admin.html", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/login\.html$/);
});
