import { test, expect } from "@playwright/test";

test.describe("Learner Portal — Page Navigation", () => {
  test("home page loads with dashboard title", async ({ page }) => {
    await page.goto("/learner");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("registration page renders form fields", async ({ page }) => {
    await page.goto("/learner/register");
    await expect(page.getByText("Create your account")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  });

  test("onboarding page loads", async ({ page }) => {
    await page.goto("/learner/onboarding");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("foundation school page shows module cards", async ({ page }) => {
    await page.goto("/learner/foundation");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("track catalog page lists tracks", async ({ page }) => {
    await page.goto("/learner/tracks");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("progress page renders", async ({ page }) => {
    await page.goto("/learner/progress");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("payments page renders", async ({ page }) => {
    await page.goto("/learner/payments");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("certificates page renders", async ({ page }) => {
    await page.goto("/learner/certificates");
    await expect(page.locator("h1")).toBeVisible();
  });
});

test.describe("Learner Portal — Registration Flow", () => {
  test("shows validation errors on empty form submit", async ({ page }) => {
    await page.goto("/learner/register");
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByText("Please enter a valid email")).toBeVisible();
  });
});
