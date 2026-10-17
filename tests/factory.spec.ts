import { expect, test } from "@playwright/test";
import {
  assembleIssueDrafts,
  calculateDiscrepancies,
  compileContract,
  parseContract,
  validateContract,
  type Contract,
} from "../src/factory/contracts";

const target: Contract = {
  kind: "prd",
  schema_version: "1.0.0",
  policy: { file_tree_complete: false },
  requirements: [{ id: "REQ-001", title: "Working contract" }],
  files: [{ id: "FIL-001", path: "src/app.tsx", kind: "file" }],
};

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

test("factory opens inside the existing Dockview launcher rather than as a second application", async ({ page }) => {
  await page.goto("/");
  const launcher = page.locator('[data-workbench-surface="main"]').getByRole("button", { name: "Open tab launcher" }).last();
  await launcher.click();
  await page.getByRole("menuitem", { name: "Software Factory" }).click();
  await expect(page.locator('[data-workbench-surface="main"] .dv-tab').filter({ hasText: "Software Factory" })).toBeVisible();
  await expect(page.getByText("Open a GitHub workspace to inspect its source")).toBeVisible();
  await page.getByRole("button", { name: "Open repository" }).click();
  await expect(page.getByRole("textbox", { name: "Repository" })).toBeVisible();
});
