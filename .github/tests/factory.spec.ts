import { expect, test } from "@playwright/test";
import {
  assembleIssueDrafts,
  calculateDiscrepancies,
  compileContract,
  parseContract,
  validateContract,
  type Contract,
} from "../../src/factory/contracts";

const target: Contract = {
  kind: "prd",
  schema_version: "1.0.0",
  policy: { file_tree_complete: false },
  requirements: [{ id: "REQ-001", title: "Working contract" }],
  files: [{ id: "FIL-001", path: "src/app.tsx", kind: "file" }],
};

test("generated documents can be parsed from embedded canonical source records", () => {
  const generated = '# Product requirements\n\n## Approved source\n\n' + '\`\`\`json\n' + JSON.stringify(target) + '\n\`\`\`';
  expect(parseContract(generated).contract).toEqual(target);
});

test("frontmatter compiler round trips and validates stable contracts", () => {
  const markdown = compileContract(target, "# Narrative\n\nOnly the contract is machine-readable.");
  const parsed = parseContract(markdown);
  expect(parsed.contract).toEqual(target);
  expect(parsed.prose).toContain("# Narrative");
  expect(validateContract(parsed.contract)).toEqual([]);
});

test("file absence is not reported against incomplete repository evidence", () => {
  expect(calculateDiscrepancies(target, null, [], false)).toEqual([]);
  const delta = calculateDiscrepancies(target, null, [], true);
  expect(delta).toHaveLength(1);
  expect(delta[0]).toMatchObject({ kind: "file", status: "missing", path: "src/app.tsx" });
});

test("unexpected files require an explicitly exhaustive target manifest", () => {
  const observed = [
    { path: "src/app.tsx", type: "file" as const },
    { path: "src/other.ts", type: "file" as const },
  ];
  expect(calculateDiscrepancies(target, null, observed, true)).toEqual([]);
  const strictTarget = { ...target, policy: { file_tree_complete: true } };
  const delta = calculateDiscrepancies(strictTarget, null, observed, true);
  expect(delta).toHaveLength(1);
  expect(delta[0]).toMatchObject({ status: "unexpected", path: "src/other.ts" });
});

test("undocumented architecture is unverified, never classified as missing implementation", () => {
  const reported: Contract = { kind: "architecture", schema_version: "1.0.0", requirements: [] };
  const delta = calculateDiscrepancies(target, reported, [{ path: "src/app.tsx", type: "file" }], true);
  expect(delta).toHaveLength(1);
  expect(delta[0]).toMatchObject({ status: "unverified", kind: "contract" });
  expect(assembleIssueDrafts(delta)[0].body).toContain("Confirm discrepancies before implementation");
});

test("global factory perspectives share the GHCode workbench", async ({ page }) => {
  await page.goto("/");
  const rail = page.getByRole("navigation", { name: "Workspace perspectives" });
  await expect(rail).toBeVisible();
  for (const concern of ["Overview", "Specification", "Delta", "Repository"]) {
    const control = rail.getByRole("button", { name: concern, exact: true });
    await control.click();
    await expect(control).toHaveAttribute("aria-pressed", "true");
  }
  await expect(page.locator('[data-workbench-surface="main"] .dv-tab').filter({ hasText: "Software Factory" })).toHaveCount(0);
  await page.getByRole("button", { name: /Open repository/i }).first().click();
  await expect(page.getByRole("dialog", { name: "Open GitHub repository" })).toBeVisible();
});

test("hiding and restoring sidebars never removes the central workspace", async ({ page }) => {
  await page.goto("/");
  const main = page.locator(".root-main");
  const canvas = page.getByRole("region", { name: "Project workspace" });
  await expect(canvas).toBeVisible();
  const initial = await main.boundingBox();
  expect(initial?.width).toBeGreaterThan(250);
  for (const name of ["Overview", "Specification", "Delta", "Repository"]) {
    await page.getByRole("navigation", { name: "Workspace perspectives" }).getByRole("button", { name }).click();
    await expect(canvas).toBeVisible();
  }
  await page.getByTitle("Toggle Primary Sidebar (Cmd/Ctrl+B)").click();
  await expect(canvas).toBeVisible();
  expect((await main.boundingBox())?.width).toBeGreaterThan(initial?.width ?? 0);
  await page.getByTitle("Toggle Secondary Sidebar (Cmd+Option/Ctrl+Alt+B)").click();
  await expect(canvas).toBeVisible();
  await page.getByTitle("Toggle Primary Sidebar (Cmd/Ctrl+B)").click();
  await expect(canvas).toBeVisible();
  await expect(page.locator(".workbench-statusbar")).toHaveCount(1);
  await expect(page.locator(".factory-footer, .factory-header")).toHaveCount(0);
});

test("activity rail returns to the native perspective without closing editor tabs", async ({ page }) => {
  await page.goto("/");
  const field = page.getByLabel("Workbench omnibar");
  await field.fill(">Open Browser");
  await field.press("Enter");
  await expect(page.locator('[data-workbench-surface="main"] .dv-tab').filter({ hasText: "Browser" })).toBeVisible();
  const canvas = page.getByRole("region", { name: "Project workspace" });
  await expect(canvas).toBeHidden();
  await page.getByRole("navigation", { name: "Workspace perspectives" }).getByRole("button", { name: "Specification" }).click();
  await expect(canvas).toBeVisible();
  await page.getByRole("navigation", { name: "Workspace perspectives" }).getByRole("button", { name: "Open editors" }).click();
  await expect(canvas).toBeHidden();
  await expect(page.locator('[data-workbench-surface="main"] .dv-tab').filter({ hasText: "Browser" })).toBeVisible();
});

test("mobile layout keeps navigation and the main content within viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Project workspace" })).toBeVisible();
  await page.getByTitle("Toggle Primary Sidebar (Cmd/Ctrl+B)").click();
  await expect(page.getByRole("region", { name: "Project workspace" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  expect((await page.locator(".root-main").boundingBox())?.width).toBeGreaterThan(250);
});
