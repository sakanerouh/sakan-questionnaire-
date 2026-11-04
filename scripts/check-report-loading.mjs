import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env.REPORT_UI_TEST_URL || "http://localhost:3000";
const id = "loading-regression";
const content = {
  version: "1",
  reportTitle: "Report loading regression",
  reportSubtitle: "Saved report loaded successfully.",
  openingLetter: "This is a synthetic browser test report.",
  blocks: [],
  sevenDayPlan: [],
  disclaimer: "Test fixture.",
};
const result = {
  id,
  sessionId: "regression",
  dominant: "anticipator",
  secondary: "harmonizer",
  scores: { anticipator: 80, performer: 40, harmonizer: 60, quiter: 20 },
  distribution: { anticipator: 40, performer: 20, harmonizer: 30, quiter: 10 },
  keyPatterns: [],
  shadowThemes: [],
  dreamSabotageThemes: [],
  protectionThemes: [],
  completedAt: "2026-01-01T00:00:00.000Z",
  resultLocale: "en",
};
const reportResponse = (ready) => ({
  ok: true,
  report: {
    paymentStatus: "paid",
    content: ready ? content : null,
    contentSource: "ai",
    generationStatus: ready ? "ready" : "not_started",
    result,
  },
});

const browser = await chromium.launch({ headless: true });
try {
  for (const scenario of ["cached", "generate", "retry", "timeout"]) {
    const context = await browser.newContext();
    const page = await context.newPage();
    let reads = 0;
    let generations = 0;
    let ready = scenario !== "generate";
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));

    if (scenario === "timeout") {
      await page.addInitScript(() => {
        const originalTimeout = AbortSignal.timeout.bind(AbortSignal);
        AbortSignal.timeout = (ms) => originalTimeout(ms === 20_000 ? 100 : ms);
      });
    }

    await page.route(`**/api/report/${id}**`, async (route) => {
      if (route.request().method() === "POST") {
        generations++;
        ready = true;
        await route.fulfill({ json: { ok: true, content } });
        return;
      }
      reads++;
      if (scenario === "retry" && reads === 1) {
        await route.fulfill({ status: 503, json: { ok: false } });
        return;
      }
      if (scenario === "timeout" && reads === 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      await route.fulfill({ json: reportResponse(ready) });
    });

    await page.goto(`${baseUrl}/en/report/${id}`, { waitUntil: "domcontentloaded" });

    if (scenario === "retry" || scenario === "timeout") {
      await page.getByRole("heading", { name: "Your report could not be loaded." }).waitFor();
      assert.equal(await page.getByRole("heading", { name: "Opening your report..." }).count(), 0);
      await page.getByRole("button", { name: "Try again", exact: true }).click();
    }

    await page.getByRole("heading", { name: content.reportTitle, exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Download PDF" }).isEnabled(), true);
    assert.equal(generations, scenario === "generate" ? 1 : 0);
    assert.deepEqual(errors, []);
    console.log(`PASS ${scenario}: report opens; generation requests=${generations}`);
    await context.close();
  }
} finally {
  await browser.close();
}
