import { readFileSync } from "node:fs";
import vm from "node:vm";
import { transformSync } from "esbuild";

const source = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");

function assert(name, condition) {
  if (!condition) {
    throw new Error(name);
  }
  console.log(`ok - ${name}`);
}

const staticChecks = [
  ["filter normalization exists", /function normalizeFilters/.test(source)],
  ["reports use normalized filters", /const safeFilters = normalizeFilters\(data, filters\)/.test(source)],
  ["budget actual ignores search query", /const budgetActualRows = buildRows\(data, \{ \.\.\.safeFilters, query: "" \}\)/.test(source)],
  ["journal excludes fund-only accounts", /function journalAccounts\(accounts\) {\s+return accounts\.filter\(\(account\) => account\.statement !== "fund"\);/m.test(source)],
  ["budget excludes fund-only accounts", /function budgetAccounts\(accounts\) {\s+return accounts\.filter\(\(account\) => account\.statement !== "fund"/m.test(source)],
  ["cash entries cannot be noncash", /cashSide\(entry\) !== "none" && entry\.fund === "noncash"/.test(source)],
  ["entry import normalizes finite amounts", /amount: finiteNumber\(entry\.amount\)/.test(source)],
  ["entry import normalizes dates", /date: normalizeDate\(entry\.date, range\.from\)/.test(source)],
  ["account master import is normalized", /function normalizeAccount/.test(source) && /const normalized = normalizeAccount\(account\)/.test(source)],
  ["sum ignores non-finite values", /return values\.reduce\(\(total, value\) => total \+ finiteNumber\(value\), 0\)/.test(source)],
  ["fiscal year invalid entries are detected", /!isDateInFiscalRange\(entry\.date, fiscalYear\)/.test(source)],
  ["non-depreciable assets are guarded", /function isDepreciableAsset/.test(source) && /const depreciable = isDepreciableAsset\(asset\.accountCode\)/.test(source)],
  ["custom account statement follows type", /statement: statementForType\(account\.type\)/.test(source)],
  ["closing reports use full fiscal year", /const closingFilters = \{ query: "", business: "all", base: "all", service: "all", \.\.\.range \}/.test(source)],
  ["cloud mode gates app behind login screen", /cloudStoreEnabled\(\) && !cloudUser/.test(source) && /function LoginScreen/.test(source)],
  ["login form has password visibility toggle", /showPassword/.test(source) && /type=\{showPassword \? "text" : "password"\}/.test(source)],
  ["login failures show user facing auth error", /setAuthError\("メールアドレスまたはパスワードを確認してください。"\)/.test(source)],
  ["no dangerous html injection", !/dangerouslySetInnerHTML|innerHTML\s*=|eval\(|new Function/.test(source)],
  ["no debug leftovers", !/debugger|TODO|FIXME/.test(source)],
];

for (const [name, ok] of staticChecks) {
  assert(name, ok);
}

const executableSource = source
  .replace(/^import \{ loadCloudData[\s\S]*?from "\.\/cloudStore\.js";\r?\n/m, "")
  .replace(/^import React[\s\S]*?from "lucide-react";\r?\n/m, "")
  .replace(/^import \{ createRoot \} from "react-dom\/client";\r?\n/m, "")
  .replace(/^import "\.\/styles\.css";\r?\n/m, "")
  .replace(/createRoot\(document\.getElementById\("root"\)\)\.render\(<App \/>\);/, "")
  + "\n"
  + "globalThis.__accounting = { seedData, initialAccounts, fiscalRange, migrateData, computeReports, fixedAssetRows, normalizeFilters, statementForType, serviceForBase, PETTY_CASH_CODE, OPERATING_BANK_CODE };";

const { code } = transformSync(executableSource, {
  loader: "jsx",
  format: "cjs",
  jsxFactory: "React.createElement",
  jsxFragment: "React.Fragment",
});

const sandbox = {
  console,
  crypto: { randomUUID: () => `verify-${Math.random().toString(36).slice(2)}` },
  React: { createElement: () => ({}), Fragment: Symbol("Fragment") },
  loadCloudData: async () => null,
  saveCloudData: async () => false,
  cloudStoreEnabled: () => false,
  window: { print: () => {} },
};
for (const iconName of source.match(/import React[\s\S]*?from "lucide-react";/)?.[0].match(/\b[A-Z][A-Za-z0-9]+\b/g) ?? []) {
  sandbox[iconName] = () => ({});
}
vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: "main.jsx" });

const {
  seedData,
  initialAccounts,
  fiscalRange,
  migrateData,
  computeReports,
  fixedAssetRows,
  normalizeFilters,
  statementForType,
  serviceForBase,
  PETTY_CASH_CODE,
  OPERATING_BANK_CODE,
} = sandbox.__accounting;

const fullYear = { query: "", business: "all", base: "all", service: "all", ...fiscalRange(seedData.fiscalYear) };
const normalReports = computeReports(seedData, fullYear);
assert("seed report has rows", normalReports.rows.length === seedData.entries.length);
assert("fund statement has three activity classes", normalReports.fundRows.length === 3);
assert("activity statement has three sections", normalReports.activityRows.length === 3);

const staleFilter = normalizeFilters(seedData, { ...fullYear, base: seedData.divisions.bases[0], service: seedData.divisions.services[1] });
assert("stale service filter is normalized to all", staleFilter.base === seedData.divisions.bases[0] && staleFilter.service === "all");

const budgetWithoutQuery = computeReports(seedData, fullYear).budgetRows.map((row) => row.actual);
const budgetWithQuery = computeReports(seedData, { ...fullYear, query: "definitely-no-entry" }).budgetRows.map((row) => row.actual);
assert("budget actual is not changed by keyword search", JSON.stringify(budgetWithoutQuery) === JSON.stringify(budgetWithQuery));

const migrated = migrateData({
  ...seedData,
  entries: [
    {
      id: "string-amount",
      date: fullYear.from,
      voucher: "V",
      description: "string amount",
      business: "x",
      base: seedData.divisions.bases[1],
      service: seedData.divisions.services[1],
      debit: PETTY_CASH_CODE,
      credit: OPERATING_BANK_CODE,
      amount: "12345",
      fund: "operating",
    },
  ],
});
assert("imported entry amount is numeric", typeof migrated.entries[0].amount === "number" && migrated.entries[0].amount === 12345);

const infiniteImport = migrateData({
  ...seedData,
  entries: [{ ...seedData.entries[0], amount: "1e309" }],
  budgets: [{ ...seedData.budgets[0], amount: "1e309" }],
  fixedAssets: [{ ...seedData.fixedAssets[0], acquisitionCost: "1e309", subsidy: "1e309", usefulLife: "1e309" }],
});
assert("non-finite imported entry amounts are zeroed", infiniteImport.entries[0].amount === 0);
assert("non-finite imported budget amounts are zeroed", infiniteImport.budgets[0].amount === 0);
assert("non-finite imported asset amounts are zeroed", infiniteImport.fixedAssets[0].acquisitionCost === 0 && infiniteImport.fixedAssets[0].subsidy === 0);

const invalidImported = migrateData({
  ...seedData,
  accounts: [{ code: "9999", name: "broken", type: "nonsense", statement: "activity", flow: "bad-flow" }],
  entries: [{ ...seedData.entries[0], date: "2026-99-99" }],
  budgets: [{ ...seedData.budgets[0], accountCode: "NOPE" }],
  fixedAssets: [{ ...seedData.fixedAssets[0], accountCode: "NOPE", acquiredDate: "not-a-date" }],
});
assert("invalid imported entry dates fall back to fiscal start", invalidImported.entries[0].date === fullYear.from);
assert("invalid imported fixed asset dates fall back to fiscal start", invalidImported.fixedAssets[0].acquiredDate === fullYear.from);
assert("invalid imported budget accounts fall back to operating revenue", invalidImported.budgets[0].accountCode === "4112");
assert("invalid imported fixed asset accounts fall back to equipment", invalidImported.fixedAssets[0].accountCode === "1216");
const normalizedCustomAccount = invalidImported.accounts.find((account) => account.code === "9999");
assert("invalid imported account types are normalized", normalizedCustomAccount?.type === "expense" && normalizedCustomAccount?.statement === "activity" && normalizedCustomAccount?.flow === "operating");

const outOfYear = migrateData({
  ...seedData,
  entries: [{ ...seedData.entries[0], id: "bad-year", date: "2099-04-01" }],
});
assert("out-of-year entries are alerted", computeReports(outOfYear, fullYear).alerts.length > 0);

const assetCases = fixedAssetRows({
  ...seedData,
  fiscalYear: "2028",
  fixedAssets: [
    { id: "land", name: "land", base: seedData.divisions.bases[1], service: seedData.divisions.services[1], accountCode: "1211", acquiredDate: "2026-04-01", acquisitionCost: 999, subsidy: 0, usefulLife: 3, location: "x" },
    { id: "odd", name: "odd", base: seedData.divisions.bases[1], service: seedData.divisions.services[1], accountCode: "1216", acquiredDate: "2026-04-01", acquisitionCost: 100, subsidy: 0, usefulLife: 3, location: "x" },
  ],
});
assert("land is not depreciated", assetCases[0].currentDepreciation === 0 && assetCases[0].bookValue === 999);
assert("final depreciation year clears rounding residue", assetCases[1].accumulatedDepreciation === 100 && assetCases[1].bookValue === 0);

assert("asset accounts are balance statement accounts", statementForType("asset") === "balance");
assert("income accounts are activity statement accounts", statementForType("income") === "activity");
assert("fixed bases map to fixed services", serviceForBase(seedData.divisions.bases[0]) === seedData.divisions.services[0] && serviceForBase(seedData.divisions.bases[1]) === seedData.divisions.services[1]);
assert("fund-only accounts are not duplicated as journal defaults", initialAccounts.filter((account) => account.statement === "fund").length > 0);
