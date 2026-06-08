import { expect, test } from "@playwright/test";

test.describe("Word Code Breaker app shell", () => {
	test("loads game view by default", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveTitle(/Word Code Breaker/i);
		await expect(page.locator("#view-game")).toBeVisible();
		await expect(page.locator("#app-header-title")).toContainText(
			"Word Code Breaker",
		);
		await expect(page.locator("#board .word-game-layout")).toBeVisible();
	});

	test("menu navigation switches views", async ({ page }) => {
		await page.goto("/");
		await page.locator("#btn-menu").click();
		await page.locator("#nav-rules").click();
		await expect(page.locator("#view-rules")).toBeVisible();

		await page.locator("#btn-menu").click();
		await page.locator("#nav-about").click();
		await expect(page.locator("#view-about")).toBeVisible();

		await page.locator("#view-about .btn-back").click();
		await expect(page.locator("#view-game")).toBeVisible();
	});
});

test.describe("Options and settings", () => {
	test("can switch to German and max attempts", async ({ page }) => {
		await page.goto("/");
		await page.locator("#btn-menu").click();
		await page.locator("#nav-options").click();

		await page.locator('input[name="language"][value="de"]').check();
		await page.locator('input[name="maxAttempts"][value="8"]').check();
		await page.locator("#btn-options-ok").click();

		await expect(page.locator("#view-game")).toBeVisible();
		await expect(page.locator("#app-header-badge")).toContainText("DE");
	});

	test("submits a guess and shows tiles", async ({ page }) => {
		await page.goto("/");
		// Wait for word list to load
		await page.waitForSelector(".attempt-row--current");
		// Click letter keys on the on-screen keyboard
		const keys = page.locator('[data-input-action="append"]');
		await keys.filter({ hasText: "A" }).first().click();
		await keys.filter({ hasText: "B" }).first().click();
		await keys.filter({ hasText: "O" }).first().click();
		await keys.filter({ hasText: "U" }).first().click();
		await keys.filter({ hasText: "T" }).first().click();
		await page.locator('[data-input-action="submit"]').click();

		// After submit there should be a completed row
		await expect(page.locator(".attempt-row--done").first()).toBeVisible();
	});
});

test.describe("Highscore reset confirmation", () => {
	test("today reset asks for confirmation and can be cancelled", async ({
		page,
	}) => {
		await page.goto("/");
		await page.locator("#btn-menu").click();
		await page.locator("#nav-options").click();

		page.once("dialog", async (dialog) => {
			expect(dialog.message()).toContain("Are you sure?");
			await dialog.dismiss();
		});

		await page.locator("#btn-reset-score-today").click();
		await expect(page.locator("#score-today")).toBeVisible();
	});

	test("week reset asks for confirmation and can be accepted", async ({
		page,
	}) => {
		await page.goto("/");
		await page.locator("#btn-menu").click();
		await page.locator("#nav-options").click();

		page.once("dialog", async (dialog) => {
			expect(dialog.message()).toContain("Are you sure?");
			await dialog.accept();
		});

		await page.locator("#btn-reset-score-week").click();
		await expect(page.locator("#score-week")).toBeVisible();
	});

	test("month reset asks for confirmation and can be accepted", async ({
		page,
	}) => {
		await page.goto("/");
		await page.locator("#btn-menu").click();
		await page.locator("#nav-options").click();

		page.once("dialog", async (dialog) => {
			expect(dialog.message()).toContain("Are you sure?");
			await dialog.accept();
		});

		await page.locator("#btn-reset-score-month").click();
		await expect(page.locator("#score-month")).toBeVisible();
	});
});
