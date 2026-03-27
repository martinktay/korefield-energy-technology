import { test, expect } from "@playwright/test";

test.describe("Instructor Portal — Page Navigation", () => {
  test("dashboard loads with cohorts and grading queue", async ({ page }) => {
    await page.goto("/instructor");
    await expect(page.getByText("Instructor Dashboard")).toBeVisible();
    await expect(page.getByText("Assigned Cohorts")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Grading Queue" })).toBeVisible();
  });

  test("grading page loads", async ({ page }) => {
    await page.goto("/instructor/grading");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("content authoring page loads", async ({ page }) => {
    await page.goto("/instructor/content");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("schedule page loads", async ({ page }) => {
    await page.goto("/instructor/schedule");
    await expect(page.locator("h1")).toBeVisible();
  });
});

test.describe("Assessor Dashboard — Page Navigation", () => {
  test("assessor dashboard loads", async ({ page }) => {
    await page.goto("/instructor/assessor");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("pod monitoring page loads", async ({ page }) => {
    await page.goto("/instructor/assessor/pods");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("reviews page loads", async ({ page }) => {
    await page.goto("/instructor/assessor/reviews");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("certification approval page loads", async ({ page }) => {
    await page.goto("/instructor/assessor/certification");
    await expect(page.locator("h1")).toBeVisible();
  });
});
