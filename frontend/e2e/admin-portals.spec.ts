import { test, expect } from "@playwright/test";

test.describe("Admin Portal — Page Navigation", () => {
  test("dashboard loads with KPI metrics", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByText("Admin Dashboard")).toBeVisible();
    await expect(page.getByText("Total Users")).toBeVisible();
  });

  test("users management page loads", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("enrollments page loads", async ({ page }) => {
    await page.goto("/admin/enrollments");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("curriculum page loads", async ({ page }) => {
    await page.goto("/admin/curriculum");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("payments page loads", async ({ page }) => {
    await page.goto("/admin/payments");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("certificates page loads", async ({ page }) => {
    await page.goto("/admin/certificates");
    await expect(page.locator("h1")).toBeVisible();
  });
});

test.describe("Super Admin Portal — Page Navigation", () => {
  test("dashboard loads with executive KPIs", async ({ page }) => {
    await page.goto("/super-admin");
    await expect(page.getByText("Super Admin Dashboard")).toBeVisible();
    await expect(page.getByText("Total Revenue")).toBeVisible();
  });

  test("revenue intelligence page loads", async ({ page }) => {
    await page.goto("/super-admin/revenue");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("enrollment intelligence page loads", async ({ page }) => {
    await page.goto("/super-admin/enrollment");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("academic quality page loads", async ({ page }) => {
    await page.goto("/super-admin/academic");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("platform health page loads", async ({ page }) => {
    await page.goto("/super-admin/platform");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("AI agents page loads", async ({ page }) => {
    await page.goto("/super-admin/ai");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("market intelligence page loads", async ({ page }) => {
    await page.goto("/super-admin/market");
    await expect(page.locator("h1")).toBeVisible();
  });
});
