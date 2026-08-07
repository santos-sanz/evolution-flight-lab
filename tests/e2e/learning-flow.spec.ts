import { expect, test } from "@playwright/test";

test("manual-to-evolution learning journey", async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await expect(page).toHaveTitle("Evolution Flight Lab");
  if (isMobile) await expect(page.getByText("FLIGHT LAB")).toBeVisible();
  else await expect(page.getByText("Wind Tunnel Laboratory")).toBeVisible();
  await page.getByRole("button", { name: "FLY A MANUAL RUN" }).click();
  await page.keyboard.press("Space");
  await expect(page.getByRole("img", { name: /Manual flight/ })).toBeVisible();
  await page.getByRole("button", { name: "EVOLVE" }).click();
  await expect(page.getByText("Why did it flap?")).toBeVisible();
  await expect(page.getByRole("button", { name: /EVOLVE NEXT GENERATION/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test("walkthrough and mobile controls remain accessible", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) {
    await expect(page.getByRole("button", { name: "EVOLVE" })).toBeVisible();
    await page.getByRole("button", { name: "EVOLVE" }).click();
    await expect(page.getByRole("button", { name: /EVOLVE NEXT GENERATION/ })).toBeVisible();
    const bodyWidth = await page.locator("body").evaluate((body) => body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width ?? 0;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
  } else {
    await page.getByRole("button", { name: /LESSON PROGRESS/ }).click();
    await expect(page.getByRole("dialog")).toContainText("Fly it yourself");
  }
});
