import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { loadCloudData, saveCloudData, cloudStoreEnabled, onCloudAuthState, signInCloud, signOutCloud } from "./cloudStore.js";
import {
  AlertTriangle,
  ArrowDownToLine,
  BarChart3,
  BookOpen,
  Building2,
  Calculator,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Eye,
  EyeOff,
  Landmark,
  Layers3,
  LockKeyhole,
  LogIn,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  SplitSquareHorizontal,
  Trash2,
  Upload,
  WalletCards,
} from "lucide-react";
import "./styles.css";

const STORAGE_KEY = "shafuku-accounting-local-v1";
const APP_SCHEMA_VERSION = 3;
const REIWA_START_YEAR = 2019;
const PETTY_CASH_CODE = "1121";
const OPERATING_BANK_CODE = "1112";
const VARIANCE_THRESHOLD = 100000;

const initialAccounts = [
  { code: "1111", name: "現金", type: "asset", statement: "balance", flow: "none" },
  { code: "1112", name: "普通預金", type: "asset", statement: "balance", flow: "none" },
  { code: "1113", name: "当座預金", type: "asset", statement: "balance", flow: "none" },
  { code: "1114", name: "定期預金", type: "asset", statement: "balance", flow: "none" },
  { code: "1121", name: "小口現金", type: "asset", statement: "balance", flow: "none" },
  { code: "1131", name: "事業未収金", type: "asset", statement: "balance", flow: "none" },
  { code: "1132", name: "未収金", type: "asset", statement: "balance", flow: "none" },
  { code: "1133", name: "未収補助金", type: "asset", statement: "balance", flow: "none" },
  { code: "1134", name: "未収収益", type: "asset", statement: "balance", flow: "none" },
  { code: "1141", name: "前払金", type: "asset", statement: "balance", flow: "none" },
  { code: "1142", name: "前払費用", type: "asset", statement: "balance", flow: "none" },
  { code: "1151", name: "立替金", type: "asset", statement: "balance", flow: "none" },
  { code: "1161", name: "仮払金", type: "asset", statement: "balance", flow: "none" },
  { code: "1171", name: "短期貸付金", type: "asset", statement: "balance", flow: "none" },
  { code: "1211", name: "土地", type: "asset", statement: "balance", flow: "facility" },
  { code: "1212", name: "建物", type: "asset", statement: "balance", flow: "facility" },
  { code: "1213", name: "構築物", type: "asset", statement: "balance", flow: "facility" },
  { code: "1214", name: "機械及び装置", type: "asset", statement: "balance", flow: "facility" },
  { code: "1215", name: "車輌運搬具", type: "asset", statement: "balance", flow: "facility" },
  { code: "1216", name: "器具及び備品", type: "asset", statement: "balance", flow: "facility" },
  { code: "1217", name: "建設仮勘定", type: "asset", statement: "balance", flow: "facility" },
  { code: "1221", name: "権利", type: "asset", statement: "balance", flow: "facility" },
  { code: "1222", name: "ソフトウェア", type: "asset", statement: "balance", flow: "facility" },
  { code: "1231", name: "投資有価証券", type: "asset", statement: "balance", flow: "none" },
  { code: "1232", name: "長期貸付金", type: "asset", statement: "balance", flow: "none" },
  { code: "1233", name: "退職給付引当資産", type: "asset", statement: "balance", flow: "none" },
  { code: "1234", name: "保育所施設・設備整備積立資産", type: "asset", statement: "balance", flow: "none" },
  { code: "1235", name: "人件費積立資産", type: "asset", statement: "balance", flow: "none" },
  { code: "1236", name: "修繕積立資産", type: "asset", statement: "balance", flow: "none" },
  { code: "1237", name: "備品等購入積立資産", type: "asset", statement: "balance", flow: "none" },
  { code: "2111", name: "事業未払金", type: "liability", statement: "balance", flow: "none" },
  { code: "2112", name: "その他の未払金", type: "liability", statement: "balance", flow: "none" },
  { code: "2113", name: "未払費用", type: "liability", statement: "balance", flow: "none" },
  { code: "2114", name: "預り金", type: "liability", statement: "balance", flow: "none" },
  { code: "2115", name: "職員預り金", type: "liability", statement: "balance", flow: "none" },
  { code: "2116", name: "前受金", type: "liability", statement: "balance", flow: "none" },
  { code: "2117", name: "仮受金", type: "liability", statement: "balance", flow: "none" },
  { code: "2118", name: "賞与引当金", type: "liability", statement: "balance", flow: "none" },
  { code: "2121", name: "短期運営資金借入金", type: "liability", statement: "balance", flow: "financing" },
  { code: "2211", name: "設備資金借入金", type: "liability", statement: "balance", flow: "financing" },
  { code: "2212", name: "長期運営資金借入金", type: "liability", statement: "balance", flow: "financing" },
  { code: "2213", name: "退職給付引当金", type: "liability", statement: "balance", flow: "none" },
  { code: "2214", name: "長期未払金", type: "liability", statement: "balance", flow: "none" },
  { code: "2215", name: "リース債務", type: "liability", statement: "balance", flow: "financing" },
  { code: "3111", name: "基本金", type: "netAsset", statement: "balance", flow: "none" },
  { code: "3121", name: "国庫補助金等特別積立金", type: "netAsset", statement: "balance", flow: "none" },
  { code: "3211", name: "次期繰越活動増減差額", type: "netAsset", statement: "balance", flow: "none" },
  { code: "3221", name: "人件費積立金", type: "netAsset", statement: "balance", flow: "none" },
  { code: "3222", name: "修繕積立金", type: "netAsset", statement: "balance", flow: "none" },
  { code: "3223", name: "保育所施設・設備整備積立金", type: "netAsset", statement: "balance", flow: "none" },
  { code: "3224", name: "備品等購入積立金", type: "netAsset", statement: "balance", flow: "none" },
  { code: "4111", name: "児童福祉事業収益", type: "income", statement: "activity", flow: "operating" },
  { code: "4112", name: "保育事業収益", type: "income", statement: "activity", flow: "operating" },
  { code: "4113", name: "利用者等利用料収益", type: "income", statement: "activity", flow: "operating" },
  { code: "4114", name: "私的契約利用料収益", type: "income", statement: "activity", flow: "operating" },
  { code: "4115", name: "補助金事業収益", type: "income", statement: "activity", flow: "operating" },
  { code: "4116", name: "委託費収益", type: "income", statement: "activity", flow: "operating" },
  { code: "4117", name: "延長保育事業収益", type: "income", statement: "activity", flow: "operating" },
  { code: "4118", name: "一時預かり事業収益", type: "income", statement: "activity", flow: "operating" },
  { code: "4119", name: "給食費収益", type: "income", statement: "activity", flow: "operating" },
  { code: "4121", name: "その他の事業収益", type: "income", statement: "activity", flow: "operating" },
  { code: "4211", name: "経常経費寄附金収益", type: "income", statement: "activity", flow: "operating" },
  { code: "4212", name: "受取補助金等収益", type: "income", statement: "activity", flow: "operating" },
  { code: "4311", name: "受取利息配当金収益", type: "income", statement: "activity", flow: "operating" },
  { code: "4312", name: "その他のサービス活動外収益", type: "income", statement: "activity", flow: "operating" },
  { code: "4411", name: "施設整備等補助金収益", type: "income", statement: "activity", flow: "facility" },
  { code: "4412", name: "施設整備等寄附金収益", type: "income", statement: "activity", flow: "facility" },
  { code: "4413", name: "固定資産売却益", type: "income", statement: "activity", flow: "facility" },
  { code: "4511", name: "拠点区分間繰入金収入", type: "income", statement: "fund", flow: "financing" },
  { code: "5111", name: "役員報酬", type: "expense", statement: "activity", flow: "operating" },
  { code: "5112", name: "職員給与", type: "expense", statement: "activity", flow: "operating" },
  { code: "5113", name: "職員賞与", type: "expense", statement: "activity", flow: "operating" },
  { code: "5114", name: "非常勤職員給与", type: "expense", statement: "activity", flow: "operating" },
  { code: "5115", name: "派遣職員費", type: "expense", statement: "activity", flow: "operating" },
  { code: "5116", name: "退職給付費用", type: "expense", statement: "activity", flow: "operating" },
  { code: "5117", name: "法定福利費", type: "expense", statement: "activity", flow: "operating" },
  { code: "5118", name: "福利厚生費", type: "expense", statement: "activity", flow: "operating" },
  { code: "5121", name: "給食費", type: "expense", statement: "activity", flow: "operating" },
  { code: "5122", name: "保育材料費", type: "expense", statement: "activity", flow: "operating" },
  { code: "5123", name: "教材費", type: "expense", statement: "activity", flow: "operating" },
  { code: "5124", name: "保健衛生費", type: "expense", statement: "activity", flow: "operating" },
  { code: "5125", name: "水道光熱費", type: "expense", statement: "activity", flow: "operating" },
  { code: "5126", name: "燃料費", type: "expense", statement: "activity", flow: "operating" },
  { code: "5127", name: "消耗器具備品費", type: "expense", statement: "activity", flow: "operating" },
  { code: "5128", name: "保険料", type: "expense", statement: "activity", flow: "operating" },
  { code: "5129", name: "賃借料", type: "expense", statement: "activity", flow: "operating" },
  { code: "5130", name: "修繕費", type: "expense", statement: "activity", flow: "operating" },
  { code: "5131", name: "通信運搬費", type: "expense", statement: "activity", flow: "operating" },
  { code: "5132", name: "業務委託費", type: "expense", statement: "activity", flow: "operating" },
  { code: "5133", name: "手数料", type: "expense", statement: "activity", flow: "operating" },
  { code: "5134", name: "研修研究費", type: "expense", statement: "activity", flow: "operating" },
  { code: "5135", name: "広報費", type: "expense", statement: "activity", flow: "operating" },
  { code: "5136", name: "旅費交通費", type: "expense", statement: "activity", flow: "operating" },
  { code: "5137", name: "会議費", type: "expense", statement: "activity", flow: "operating" },
  { code: "5138", name: "租税公課", type: "expense", statement: "activity", flow: "operating" },
  { code: "5139", name: "雑費", type: "expense", statement: "activity", flow: "operating" },
  { code: "5141", name: "事務消耗品費", type: "expense", statement: "activity", flow: "operating" },
  { code: "5142", name: "印刷製本費", type: "expense", statement: "activity", flow: "operating" },
  { code: "5143", name: "諸会費", type: "expense", statement: "activity", flow: "operating" },
  { code: "5144", name: "支払利息", type: "expense", statement: "activity", flow: "operating" },
  { code: "5211", name: "減価償却費", type: "expense", statement: "activity", flow: "noncash" },
  { code: "5311", name: "固定資産取得支出", type: "expense", statement: "fund", flow: "facility" },
  { code: "5312", name: "固定資産除却・廃棄支出", type: "expense", statement: "fund", flow: "facility" },
  { code: "5313", name: "施設整備等支出", type: "expense", statement: "fund", flow: "facility" },
  { code: "5411", name: "借入金元金償還支出", type: "expense", statement: "fund", flow: "financing" },
  { code: "5412", name: "積立資産支出", type: "expense", statement: "fund", flow: "financing" },
  { code: "5413", name: "拠点区分間繰入金支出", type: "expense", statement: "fund", flow: "financing" },
];

const canonicalDivisions = {
  businesses: ["社会福祉事業"],
  bases: ["社会福祉法人泉州福祉会", "認定こども園ひさほ保育園"],
  services: ["本部会計", "認定こども園"],
};

const defaultNotes = {
  accountingPolicy: "社会福祉法人会計基準に準拠し、正規の簿記の原則により処理しています。",
  depreciation: "固定資産は定額法により減価償却を行います。",
  fundScope: "資金収支計算書は事業活動、施設整備等、その他の活動に区分して表示します。",
  internalTransactions: "拠点区分間取引は決算整理時に相殺消去を確認します。",
  collateral: "該当事項はありません。",
  subsequentEvents: "該当事項はありません。",
};

const noteLabels = {
  accountingPolicy: "重要な会計方針",
  depreciation: "固定資産の減価償却方法",
  fundScope: "資金収支計算書の作成方針",
  internalTransactions: "内部取引の相殺消去",
  collateral: "担保提供資産",
  subsequentEvents: "重要な後発事象",
};

const seedFixedAssets = [
  {
    id: "asset-1",
    name: "園舎建物",
    base: "認定こども園ひさほ保育園",
    service: "認定こども園",
    accountCode: "1212",
    acquiredDate: "2020-04-01",
    acquisitionCost: 48000000,
    subsidy: 18000000,
    usefulLife: 39,
    location: "認定こども園ひさほ保育園",
    status: "使用中",
  },
  {
    id: "asset-2",
    name: "保育備品一式",
    base: "認定こども園ひさほ保育園",
    service: "認定こども園",
    accountCode: "1216",
    acquiredDate: "2024-04-01",
    acquisitionCost: 1250000,
    subsidy: 0,
    usefulLife: 5,
    location: "保育室",
    status: "使用中",
  },
];

const seedData = {
  schemaVersion: APP_SCHEMA_VERSION,
  fiscalYear: "2026",
  organization: {
    name: "社会福祉法人泉州福祉会",
    closingMonth: "3",
  },
  divisions: canonicalDivisions,
  accounts: initialAccounts,
  notes: defaultNotes,
  fixedAssets: seedFixedAssets,
  varianceReasons: {},
  budgets: [
    { accountCode: "4112", base: "認定こども園ひさほ保育園", service: "認定こども園", amount: 52300000 },
    { accountCode: "4115", base: "認定こども園ひさほ保育園", service: "認定こども園", amount: 18400000 },
    { accountCode: "4119", base: "認定こども園ひさほ保育園", service: "認定こども園", amount: 3600000 },
    { accountCode: "5112", base: "認定こども園ひさほ保育園", service: "認定こども園", amount: 31200000 },
    { accountCode: "5117", base: "認定こども園ひさほ保育園", service: "認定こども園", amount: 4800000 },
    { accountCode: "5121", base: "認定こども園ひさほ保育園", service: "認定こども園", amount: 6500000 },
    { accountCode: "5122", base: "認定こども園ひさほ保育園", service: "認定こども園", amount: 2100000 },
    { accountCode: "5132", base: "社会福祉法人泉州福祉会", service: "本部会計", amount: 2600000 },
    { accountCode: "5141", base: "社会福祉法人泉州福祉会", service: "本部会計", amount: 900000 },
  ],
  entries: [
    {
      id: "sample-0",
      date: "2026-04-01",
      voucher: "B-001",
      description: "期首残高の登録",
      business: "社会福祉事業",
      base: "社会福祉法人泉州福祉会",
      service: "本部会計",
      debit: "1112",
      credit: "3111",
      amount: 20000000,
      fund: "none",
    },
    {
      id: "sample-1",
      date: "2026-04-01",
      voucher: "C-001",
      description: "小口現金の補充",
      business: "社会福祉事業",
      base: "認定こども園ひさほ保育園",
      service: "認定こども園",
      debit: "1121",
      credit: "1112",
      amount: 50000,
      fund: "operating",
    },
    {
      id: "sample-2",
      date: "2026-04-02",
      voucher: "C-002",
      description: "保育材料の小口購入",
      business: "社会福祉事業",
      base: "認定こども園ひさほ保育園",
      service: "認定こども園",
      debit: "5122",
      credit: "1121",
      amount: 6800,
      fund: "operating",
    },
    {
      id: "sample-3",
      date: "2026-04-01",
      voucher: "R-001",
      description: "保育給付費の入金",
      business: "社会福祉事業",
      base: "認定こども園ひさほ保育園",
      service: "認定こども園",
      debit: "1112",
      credit: "4112",
      amount: 6900000,
      fund: "operating",
    },
    {
      id: "sample-4",
      date: "2026-04-05",
      voucher: "P-001",
      description: "職員給与の支払",
      business: "社会福祉事業",
      base: "認定こども園ひさほ保育園",
      service: "認定こども園",
      debit: "5112",
      credit: "1112",
      amount: 4200000,
      fund: "operating",
    },
    {
      id: "sample-5",
      date: "2026-04-10",
      voucher: "P-002",
      description: "給食材料費の支払",
      business: "社会福祉事業",
      base: "認定こども園ひさほ保育園",
      service: "認定こども園",
      debit: "5121",
      credit: "1112",
      amount: 720000,
      fund: "operating",
    },
    {
      id: "sample-6",
      date: "2026-04-15",
      voucher: "R-002",
      description: "施設型給付費補助金の入金",
      business: "社会福祉事業",
      base: "認定こども園ひさほ保育園",
      service: "認定こども園",
      debit: "1112",
      credit: "4115",
      amount: 4100000,
      fund: "operating",
    },
  ],
};

const accountTypes = {
  asset: "資産",
  liability: "負債",
  netAsset: "純資産",
  income: "収益",
  expense: "費用/支出",
};

const normalSide = {
  asset: "debit",
  expense: "debit",
  liability: "credit",
  netAsset: "credit",
  income: "credit",
};

const fundLabels = {
  operating: "事業活動",
  facility: "施設整備等",
  financing: "その他の活動",
  noncash: "非資金",
  none: "対象外",
};

const tabs = [
  { id: "dashboard", label: "概況", icon: BarChart3 },
  { id: "entries", label: "仕訳", icon: BookOpen },
  { id: "petty", label: "小口", icon: WalletCards },
  { id: "reports", label: "帳票", icon: FileSpreadsheet },
  { id: "closing", label: "決算", icon: ClipboardCheck },
  { id: "master", label: "マスタ", icon: Settings },
  { id: "backup", label: "保全", icon: Database },
];

function currency(value) {
  const numericValue = Number(value);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(
    Math.round(safeValue),
  );
}

function number(value) {
  const numericValue = Number(value);
  return new Intl.NumberFormat("ja-JP").format(Math.round(Number.isFinite(numericValue) ? numericValue : 0));
}

function finiteNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function westernToReiwaYear(westernYear) {
  return (Number(westernYear) || new Date().getFullYear()) - REIWA_START_YEAR + 1;
}

function reiwaToWesternYear(reiwaYear) {
  return REIWA_START_YEAR + Number(reiwaYear) - 1;
}

function fiscalYearLabel(westernYear) {
  const reiwaYear = westernToReiwaYear(westernYear);
  return `令和${reiwaYear === 1 ? "元" : reiwaYear}年度`;
}

function normalizeFiscalYear(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value < 100 ? reiwaToWesternYear(value) : value);
  }
  const text = String(value ?? "").trim();
  const western = Number(text);
  if (Number.isFinite(western) && western > 0) {
    return String(western < 100 ? reiwaToWesternYear(western) : western);
  }
  const reiwaMatch = text.match(/(?:令和|R|r)\s*(元|\d+)/);
  if (reiwaMatch) {
    const reiwaYear = reiwaMatch[1] === "元" ? 1 : Number(reiwaMatch[1]);
    return String(reiwaToWesternYear(reiwaYear));
  }
  return String(new Date().getFullYear());
}

function fiscalYearOptions(selectedYear) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 12 }, (_, index) => currentYear - 5 + index).filter((year) => year >= REIWA_START_YEAR);
  const selected = Number(normalizeFiscalYear(selectedYear));
  return Array.from(new Set(Number.isFinite(selected) ? [...years, selected] : years)).sort((a, b) => a - b);
}

function fiscalRange(fiscalYear) {
  const year = Number(normalizeFiscalYear(fiscalYear)) || new Date().getFullYear();
  return {
    from: `${year}-04-01`,
    to: `${year + 1}-03-31`,
  };
}

function displayDate(date) {
  return String(date ?? "").replaceAll("-", "/");
}

function isIsoDate(value) {
  const text = String(value ?? "");
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12) return false;
  const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day >= 1 && day <= maxDay;
}

function normalizeDate(value, fallback) {
  return isIsoDate(value) ? String(value) : fallback;
}

function isDateInFiscalRange(date, fiscalYear) {
  const range = fiscalRange(fiscalYear);
  return isIsoDate(date) && date >= range.from && date <= range.to;
}

function fiscalDateErrorMessage(date, fiscalYear) {
  const range = fiscalRange(fiscalYear);
  const input = date ? displayDate(date) : "未入力";
  return `${fiscalYearLabel(fiscalYear)}の登録可能期間は ${displayDate(range.from)}〜${displayDate(range.to)} です。\n入力日付: ${input}`;
}

function confirmDelete(label, detail = "") {
  const message = detail ? `${label}を削除します。\n${detail}\nよろしいですか？` : `${label}を削除します。よろしいですか？`;
  return window.confirm(message);
}

function normalizeAccount(account) {
  const type = Object.keys(accountTypes).includes(account?.type) ? account.type : "expense";
  const flow = Object.keys(fundLabels).includes(account?.flow) ? account.flow : type === "asset" || type === "liability" || type === "netAsset" ? "none" : "operating";
  const statement = account?.statement === "fund" && (type === "income" || type === "expense") ? "fund" : statementForType(type);
  return {
    code: String(account?.code ?? "").trim(),
    name: String(account?.name ?? "").trim(),
    type,
    statement,
    flow,
  };
}

function mergeAccounts(storedAccounts = []) {
  const accountMap = new Map(initialAccounts.map((account) => [account.code, account]));
  storedAccounts.forEach((account) => {
    const normalized = normalizeAccount(account);
    if (normalized.code && normalized.name && !accountMap.has(normalized.code)) {
      accountMap.set(normalized.code, normalized);
    }
  });
  return Array.from(accountMap.values()).sort((a, b) => a.code.localeCompare(b.code));
}

function normalizeBase(base) {
  const baseMap = {
    法人本部: "社会福祉法人泉州福祉会",
    社会福祉法人サンプル会: "社会福祉法人泉州福祉会",
    特別養護老人ホーム青葉: "認定こども園ひさほ保育園",
    こども園ひかり: "認定こども園ひさほ保育園",
  };
  const normalized = baseMap[base] ?? base;
  return canonicalDivisions.bases.includes(normalized) ? normalized : canonicalDivisions.bases[1];
}

function normalizeService(service, base) {
  const serviceMap = {
    介護老人福祉施設: "認定こども園",
    短期入所生活介護: "認定こども園",
    保育所: "認定こども園",
  };
  if (base === canonicalDivisions.bases[0]) return "本部会計";
  const normalized = serviceMap[service] ?? service;
  return canonicalDivisions.services.includes(normalized) ? normalized : "認定こども園";
}

function serviceForBase(base) {
  return base === canonicalDivisions.bases[0] ? canonicalDivisions.services[0] : canonicalDivisions.services[1];
}

function serviceOptionsForBase(base) {
  return [serviceForBase(base)];
}

function migrateLegacyEntryAccounts(entry) {
  const description = entry.description ?? "";
  const isLegacySample = String(entry.id ?? "").startsWith("sample-");
  const shouldMapLegacy =
    isLegacySample ||
    description.includes("介護報酬") ||
    description.includes("保育給付") ||
    description.includes("職員給与") ||
    description.includes("給食材料");

  if (!shouldMapLegacy) return entry;

  const legacyCodeMap = {
    "4111": "4112",
    "4113": "4112",
    "5111": "5112",
    "5121": "5121",
    "5131": "5141",
  };

  return {
    ...entry,
    debit: legacyCodeMap[entry.debit] ?? entry.debit,
    credit: legacyCodeMap[entry.credit] ?? entry.credit,
  };
}

function migrateLegacyBudgetAccounts(budget) {
  const legacyBudgetMap = {
    "4111": "4112",
    "4113": "4112",
    "5111": "5112",
    "5131": "5141",
  };
  return {
    ...budget,
    accountCode: legacyBudgetMap[budget.accountCode] ?? budget.accountCode,
  };
}

function normalizeBudgetAccountCode(accountCode, accounts = initialAccounts) {
  const code = migrateLegacyBudgetAccounts({ accountCode }).accountCode;
  return budgetAccounts(accounts).some((account) => account.code === code) ? code : "4112";
}

function consolidateBudgets(budgets) {
  const budgetMap = new Map();
  budgets.forEach((budget) => {
    const key = `${budget.accountCode}__${budget.base}__${budget.service}`;
    const existing = budgetMap.get(key);
    budgetMap.set(key, {
      ...budget,
      amount: (existing?.amount ?? 0) + finiteNumber(budget.amount),
    });
  });
  return Array.from(budgetMap.values());
}

function normalizeFixedAsset(asset, fiscalYear = seedData.fiscalYear) {
  const base = normalizeBase(asset.base);
  const range = fiscalRange(fiscalYear);
  const assetAccounts = initialAccounts.filter((account) => account.type === "asset" && account.flow === "facility");
  const accountCode = assetAccounts.some((account) => account.code === asset.accountCode) ? asset.accountCode : "1216";
  return {
    id: asset.id || crypto.randomUUID(),
    name: String(asset.name ?? "").trim() || "固定資産",
    base,
    service: normalizeService(asset.service, base),
    accountCode,
    acquiredDate: normalizeDate(asset.acquiredDate, range.from),
    acquisitionCost: finiteNumber(asset.acquisitionCost),
    subsidy: finiteNumber(asset.subsidy),
    usefulLife: Math.max(1, finiteNumber(asset.usefulLife) || 5),
    location: String(asset.location ?? "").trim() || base,
    status: asset.status || "使用中",
  };
}

function migrateData(parsed) {
  const merged = { ...seedData, ...parsed };
  const range = fiscalRange(merged.fiscalYear);
  const entries = (merged.entries ?? []).map((entry) => {
    const base = normalizeBase(entry.base);
    return migrateLegacyEntryAccounts({
      ...entry,
      id: entry.id || crypto.randomUUID(),
      date: normalizeDate(entry.date, range.from),
      voucher: String(entry.voucher ?? ""),
      description: String(entry.description ?? ""),
      business: canonicalDivisions.businesses[0],
      base,
      service: normalizeService(entry.service, base),
      amount: finiteNumber(entry.amount),
      fund: fundLabels[entry.fund] ? entry.fund : "operating",
    });
  });
  const budgets = consolidateBudgets((merged.budgets ?? []).map((budget) => {
    const base = normalizeBase(budget.base);
    return {
      ...budget,
      accountCode: normalizeBudgetAccountCode(budget.accountCode, mergeAccounts(merged.accounts)),
      base,
      service: normalizeService(budget.service, base),
      amount: finiteNumber(budget.amount),
    };
  }));
  const fixedAssets = (merged.fixedAssets ?? seedFixedAssets).map((asset) => normalizeFixedAsset(asset, merged.fiscalYear));

  return {
    ...merged,
    schemaVersion: APP_SCHEMA_VERSION,
    fiscalYear: normalizeFiscalYear(merged.fiscalYear),
    organization: {
      ...merged.organization,
      name: "社会福祉法人泉州福祉会",
    },
    divisions: canonicalDivisions,
    accounts: mergeAccounts(merged.accounts),
    entries,
    budgets,
    fixedAssets,
    notes: { ...defaultNotes, ...(merged.notes ?? {}) },
    varianceReasons: merged.varianceReasons ?? {},
  };
}

function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return seedData;
    const parsed = JSON.parse(stored);
    const migrated = migrateData(parsed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return seedData;
  }
}

function downloadFile(name, content, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function sum(values) {
  return values.reduce((total, value) => total + finiteNumber(value), 0);
}

function byAccount(accounts) {
  return Object.fromEntries(accounts.map((account) => [account.code, account]));
}

function journalAccounts(accounts) {
  return accounts.filter((account) => account.statement !== "fund");
}

function budgetAccounts(accounts) {
  return accounts.filter((account) => account.statement !== "fund" && (account.type === "income" || account.type === "expense"));
}

function statementForType(type) {
  return type === "asset" || type === "liability" || type === "netAsset" ? "balance" : "activity";
}

function signedForAccount(account, debit, credit) {
  if (!account) return 0;
  return normalSide[account.type] === "debit" ? debit - credit : credit - debit;
}

function activitySection(account) {
  if (account.flow === "facility" || String(account.code).startsWith("44")) return "special";
  if (String(account.code).startsWith("431") || account.code === "5144") return "outside";
  return "service";
}

function isDepreciableAsset(accountCode) {
  return !["1211", "1217"].includes(accountCode);
}

function isCashAccount(code) {
  return ["1111", "1112", "1113", "1114", PETTY_CASH_CODE].includes(code);
}

function cashSide(entry) {
  const debitCash = isCashAccount(entry.debit);
  const creditCash = isCashAccount(entry.credit);
  if (debitCash && creditCash) return "transfer";
  if (debitCash) return "inflow";
  if (creditCash) return "outflow";
  return "none";
}

function isStructurallyInvalidEntry(entry, accounts, fiscalYear) {
  const debit = accounts[entry.debit];
  const credit = accounts[entry.credit];
  return (
    !debit ||
    !credit ||
    debit.statement === "fund" ||
    credit.statement === "fund" ||
    entry.debit === entry.credit ||
    entry.service !== serviceForBase(entry.base) ||
    !isDateInFiscalRange(entry.date, fiscalYear) ||
    finiteNumber(entry.amount) <= 0 ||
    (cashSide(entry) !== "none" && entry.fund === "noncash")
  );
}

function yearsInService(asset, fiscalYear) {
  const acquired = Number(String(asset.acquiredDate).slice(0, 4));
  const year = Number(normalizeFiscalYear(fiscalYear));
  if (!acquired || acquired > year) return 0;
  return Math.min(asset.usefulLife, year - acquired + 1);
}

function fixedAssetRows(data) {
  return (data.fixedAssets ?? []).map((asset) => {
    const acquisitionCost = finiteNumber(asset.acquisitionCost);
    const usefulLife = Math.max(1, finiteNumber(asset.usefulLife) || 1);
    const depreciable = isDepreciableAsset(asset.accountCode);
    const annualDepreciation = depreciable ? Math.floor(acquisitionCost / usefulLife) : 0;
    const serviceYears = yearsInService(asset, data.fiscalYear);
    const previousServiceYears = depreciable ? yearsInService(asset, Number(normalizeFiscalYear(data.fiscalYear)) - 1) : 0;
    const accumulatedBefore = previousServiceYears >= usefulLife ? acquisitionCost : Math.min(acquisitionCost, annualDepreciation * previousServiceYears);
    const accumulatedDepreciation = depreciable ? (serviceYears >= usefulLife ? acquisitionCost : Math.min(acquisitionCost, annualDepreciation * serviceYears)) : 0;
    const currentDepreciation = Math.max(0, accumulatedDepreciation - accumulatedBefore);
    const bookValue = Math.max(0, acquisitionCost - accumulatedDepreciation);
    return { ...asset, annualDepreciation, currentDepreciation, accumulatedDepreciation, bookValue };
  });
}

function budgetKey(row) {
  return `${row.accountCode}__${row.base}__${row.service}`;
}

function scopeReport(data, filters, scope) {
  return computeReports(data, {
    ...filters,
    query: "",
    base: scope.base ?? "all",
    service: scope.service ?? "all",
  });
}

function buildRows(data, filters) {
  return data.entries
    .filter((entry) => {
      if (filters.query) {
        const haystack = `${entry.date} ${entry.voucher} ${entry.description} ${entry.business} ${entry.base} ${entry.service}`.toLowerCase();
        if (!haystack.includes(filters.query.toLowerCase())) return false;
      }
      if (filters.business !== "all" && entry.business !== filters.business) return false;
      if (filters.base !== "all" && entry.base !== filters.base) return false;
      if (filters.service !== "all" && entry.service !== filters.service) return false;
      if (filters.from && entry.date < filters.from) return false;
      if (filters.to && entry.date > filters.to) return false;
      return true;
    })
    .sort((a, b) => `${b.date}${b.voucher}`.localeCompare(`${a.date}${a.voucher}`));
}

function balanceFiltersFor(filters) {
  return {
    ...filters,
    query: "",
    from: "",
  };
}

function normalizeFilters(data, filters) {
  const range = fiscalRange(data.fiscalYear);
  const business = filters.business === "all" || data.divisions.businesses.includes(filters.business) ? filters.business : "all";
  const base = filters.base === "all" || data.divisions.bases.includes(filters.base) ? filters.base : "all";
  const serviceOptions = base === "all" ? data.divisions.services : serviceOptionsForBase(base);
  const service = filters.service === "all" || serviceOptions.includes(filters.service) ? filters.service : "all";
  const rawFrom = normalizeDate(filters.from, range.from);
  const rawTo = normalizeDate(filters.to, range.to);
  const from = rawFrom < range.from ? range.from : rawFrom > range.to ? range.to : rawFrom;
  const to = rawTo > range.to ? range.to : rawTo < range.from ? range.from : rawTo;
  return {
    query: filters.query ?? "",
    business,
    base,
    service,
    from: from > to ? to : from,
    to: to < from ? from : to,
  };
}

function computeReports(data, filters) {
  const safeFilters = normalizeFilters(data, filters);
  const accounts = byAccount(data.accounts);
  const rows = buildRows(data, safeFilters);
  const balanceRows = buildRows(data, balanceFiltersFor(safeFilters));
  const budgetActualRows = buildRows(data, { ...safeFilters, query: "" });
  const invalidEntries = data.entries.filter((entry) => isStructurallyInvalidEntry(entry, accounts, data.fiscalYear));
  const trial = data.accounts.map((account) => {
    const debit = sum(rows.filter((entry) => entry.debit === account.code).map((entry) => entry.amount));
    const credit = sum(rows.filter((entry) => entry.credit === account.code).map((entry) => entry.amount));
    return { ...account, debit, credit, balance: signedForAccount(account, debit, credit) };
  });
  const balanceTrial = data.accounts.map((account) => {
    const debit = sum(balanceRows.filter((entry) => entry.debit === account.code).map((entry) => entry.amount));
    const credit = sum(balanceRows.filter((entry) => entry.credit === account.code).map((entry) => entry.amount));
    return { ...account, debit, credit, balance: signedForAccount(account, debit, credit) };
  });
  const reportTrial = data.accounts.map((account) => {
    if (account.type === "asset" || account.type === "liability" || account.type === "netAsset") {
      return balanceTrial.find((row) => row.code === account.code) ?? account;
    }
    return trial.find((row) => row.code === account.code) ?? account;
  });

  const income = sum(trial.filter((row) => row.type === "income" && row.statement === "activity").map((row) => row.balance));
  const expenses = sum(
    trial.filter((row) => row.type === "expense" && row.statement === "activity" && row.flow !== "noncash").map((row) => row.balance),
  );
  const noncashExpenses = sum(
    trial.filter((row) => row.type === "expense" && row.statement === "activity" && row.flow === "noncash").map((row) => row.balance),
  );
  const assets = sum(balanceTrial.filter((row) => row.type === "asset").map((row) => row.balance));
  const liabilities = sum(balanceTrial.filter((row) => row.type === "liability").map((row) => row.balance));
  const netAssets = sum(balanceTrial.filter((row) => row.type === "netAsset").map((row) => row.balance));
  const result = income - expenses - noncashExpenses;
  const cumulativeIncome = sum(balanceTrial.filter((row) => row.type === "income" && row.statement === "activity").map((row) => row.balance));
  const cumulativeExpenses = sum(
    balanceTrial.filter((row) => row.type === "expense" && row.statement === "activity" && row.flow !== "noncash").map((row) => row.balance),
  );
  const cumulativeNoncashExpenses = sum(
    balanceTrial.filter((row) => row.type === "expense" && row.statement === "activity" && row.flow === "noncash").map((row) => row.balance),
  );
  const cumulativeResult = cumulativeIncome - cumulativeExpenses - cumulativeNoncashExpenses;
  const balanceSheetDifference = assets - liabilities - netAssets - cumulativeResult;
  const activityRows = [
    { key: "service", label: "サービス活動増減差額" },
    { key: "outside", label: "サービス活動外増減差額" },
    { key: "special", label: "特別増減差額" },
  ].map((section) => {
    const sectionRows = trial.filter((row) => row.statement === "activity" && activitySection(row) === section.key);
    const sectionIncome = sum(sectionRows.filter((row) => row.type === "income").map((row) => row.balance));
    const sectionExpense = sum(sectionRows.filter((row) => row.type === "expense").map((row) => row.balance));
    return { ...section, income: sectionIncome, expense: sectionExpense, balance: sectionIncome - sectionExpense };
  });

  const fundRows = Object.keys(fundLabels)
    .filter((key) => key !== "none" && key !== "noncash")
    .map((key) => {
      const inflow = sum(
        rows
          .filter((entry) => entry.fund === key)
          .map((entry) => (isCashAccount(entry.debit) && !isCashAccount(entry.credit) ? entry.amount : 0)),
      );
      const outflow = sum(
        rows
          .filter((entry) => entry.fund === key)
          .map((entry) => (!isCashAccount(entry.debit) && isCashAccount(entry.credit) ? entry.amount : 0)),
      );
      return { key, label: fundLabels[key], inflow, outflow, balance: inflow - outflow };
    });

  const budgetRows = data.budgets
    .filter((budget) => {
      if (safeFilters.business !== "all" && data.divisions.businesses[0] !== safeFilters.business) return false;
      if (safeFilters.base !== "all" && budget.base !== safeFilters.base) return false;
      if (safeFilters.service !== "all" && budget.service !== safeFilters.service) return false;
      return true;
    })
    .map((budget) => {
      const account = accounts[budget.accountCode];
      const actual = sum(
        budgetActualRows
          .filter((entry) => entry.base === budget.base && entry.service === budget.service)
          .map((entry) => {
            const debit = entry.debit === budget.accountCode ? entry.amount : 0;
            const credit = entry.credit === budget.accountCode ? entry.amount : 0;
            return signedForAccount(account, debit, credit);
          }),
      );
      return { ...budget, accountName: account?.name ?? budget.accountCode, actual, variance: budget.amount - actual };
    });

  const imbalance = sum(rows.map((entry) => entry.amount)) - sum(rows.map((entry) => entry.amount));
  const pettyCashAccount = balanceTrial.find((row) => row.code === PETTY_CASH_CODE);
  const pettyRows = balanceRows.filter((entry) => entry.debit === PETTY_CASH_CODE || entry.credit === PETTY_CASH_CODE);
  const pettyIn = sum(pettyRows.filter((entry) => entry.debit === PETTY_CASH_CODE).map((entry) => entry.amount));
  const pettyOut = sum(pettyRows.filter((entry) => entry.credit === PETTY_CASH_CODE).map((entry) => entry.amount));
  const pettyCash = {
    balance: pettyCashAccount?.balance ?? 0,
    inflow: pettyIn,
    outflow: pettyOut,
    rows: pettyRows,
  };
  const alerts = [
    ...invalidEntries.map((entry) => `仕訳 ${entry.voucher || entry.id} の科目または区分を確認してください`),
    ...(Math.abs(balanceSheetDifference) > 0 ? [`貸借差額 ${currency(balanceSheetDifference)} があります`] : []),
    ...(pettyCash.balance < 0 ? ["小口現金がマイナス残高です"] : []),
  ];

  return {
    rows,
    trial: reportTrial,
    periodTrial: trial,
    balanceTrial,
    income,
    expenses,
    noncashExpenses,
    assets,
    liabilities,
    netAssets,
    result,
    cumulativeResult,
    activityRows,
    fundRows,
    budgetRows,
    imbalance,
    accounts,
    pettyCash,
    balanceSheetDifference,
    alerts,
  };
}

function App() {
  const [data, setData] = useState(loadData);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [cloudUser, setCloudUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState(cloudStoreEnabled() ? "cloud-login" : "local-only");
  const [authError, setAuthError] = useState("");
  const [filters, setFilters] = useState({
    query: "",
    business: "all",
    base: "all",
    service: "all",
    ...fiscalRange(data.fiscalYear),
  });
  const effectiveFilters = useMemo(() => normalizeFilters(data, filters), [data, filters]);
  const reports = useMemo(() => computeReports(data, effectiveFilters), [data, effectiveFilters]);
  const healthReports = useMemo(
    () => computeReports(data, { query: "", business: "all", base: "all", service: "all", ...fiscalRange(data.fiscalYear) }),
    [data],
  );

  useEffect(() => {
    let cancelled = false;
    if (!cloudStoreEnabled()) return undefined;
    let unsubscribeAuth = () => {};
    onCloudAuthState(async (user) => {
      if (cancelled) return;
      setCloudUser(user);
      if (!user) {
        setAuthError("");
        setSyncStatus("cloud-login");
        return;
      }
      setAuthError("");
      setSyncStatus("cloud-loading");
      try {
        const cloudData = await loadCloudData();
        if (cancelled) return;
        if (cloudData) {
          const migrated = migrateData(cloudData);
          setData(migrated);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          setFilters({ query: "", business: "all", base: "all", service: "all", ...fiscalRange(migrated.fiscalYear) });
        }
        setSyncStatus("cloud-ready");
      } catch {
        if (!cancelled) setSyncStatus("cloud-error");
      }
    }).then((unsubscribe) => {
      unsubscribeAuth = unsubscribe;
    }).catch(() => {
      if (!cancelled) setSyncStatus("cloud-error");
    });
    return () => {
      cancelled = true;
      unsubscribeAuth();
    };
  }, []);

  function persist(next) {
    const migrated = migrateData(next);
    setData(migrated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    if (cloudStoreEnabled() && cloudUser) {
      setSyncStatus("cloud-saving");
      saveCloudData(migrated)
        .then(() => setSyncStatus("cloud-ready"))
        .catch(() => setSyncStatus("cloud-error"));
    }
  }

  function resetDemo() {
    persist(seedData);
    setFilters({ query: "", business: "all", base: "all", service: "all", ...fiscalRange(seedData.fiscalYear) });
  }

  async function loginCloud(email, password) {
    setAuthError("");
    setSyncStatus("cloud-loading");
    try {
      await signInCloud(email, password);
      return true;
    } catch {
      setSyncStatus("cloud-error");
      setAuthError("メールアドレスまたはパスワードを確認してください。");
      return false;
    }
  }

  async function logoutCloud() {
    await signOutCloud();
    setCloudUser(null);
    setSyncStatus("cloud-login");
  }

  const context = { data, persist, filters: effectiveFilters, setFilters, reports, setActiveTab, syncStatus };

  if (cloudStoreEnabled() && !cloudUser) {
    return <LoginScreen loginCloud={loginCloud} syncStatus={syncStatus} authError={authError} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">
            <Landmark size={26} />
          </div>
          <div>
            <h1>社会福祉法人会計</h1>
            <p>ローカル台帳</p>
          </div>
        </div>

        <nav className="nav-stack">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={activeTab === tab.id ? "nav-button active" : "nav-button"}
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="mini-stat">
            <span>会計年度</span>
            <strong>{fiscalYearLabel(data.fiscalYear)}</strong>
          </div>
          <div className="mini-stat">
            <span>仕訳件数</span>
            <strong>{number(data.entries.length)}件</strong>
          </div>
        </div>
      </aside>

      <main className="workspace">
        <Header data={data} persist={persist} reports={healthReports} setFilters={setFilters} syncStatus={syncStatus} />
        <CloudPanel cloudUser={cloudUser} loginCloud={loginCloud} logoutCloud={logoutCloud} syncStatus={syncStatus} />
        <FilterBar data={data} filters={effectiveFilters} setFilters={setFilters} />
        {activeTab === "dashboard" && <Dashboard {...context} />}
        {activeTab === "entries" && <Entries {...context} />}
        {activeTab === "petty" && <PettyCash {...context} />}
        {activeTab === "reports" && <Reports {...context} />}
        {activeTab === "closing" && <ClosingDocs {...context} />}
        {activeTab === "master" && <MasterData {...context} />}
        {activeTab === "backup" && <Backup {...context} resetDemo={resetDemo} />}
      </main>
    </div>
  );
}

function LoginScreen({ loginCloud, syncStatus, authError }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const loading = syncStatus === "cloud-loading";

  async function submit(event) {
    event.preventDefault();
    if (!email.trim() || !password) return;
    const loggedIn = await loginCloud(email.trim(), password);
    if (loggedIn) setPassword("");
  }

  return (
    <main className="login-shell">
      <section className="login-brand">
        <div className="login-mark">
          <Landmark size={34} />
        </div>
        <p className="eyebrow">Firebase Authentication / Firestore</p>
        <h1>社会福祉法人会計</h1>
        <p>本部と認定こども園ひさほ保育園の会計データを、許可された利用者だけがブラウザから開けます。</p>
        <div className="login-assurance">
          <span>
            <ShieldCheck size={17} />
            メール認証
          </span>
          <span>
            <Database size={17} />
            DB同期
          </span>
          <span>
            <LockKeyhole size={17} />
            権限管理
          </span>
        </div>
      </section>

      <section className="login-card" aria-label="ログイン">
        <div className="login-card-heading">
          <LockKeyhole size={22} />
          <div>
            <h2>ログイン</h2>
            <p>登録済みのメールアドレスで入ってください。</p>
          </div>
        </div>
        <form className="login-form" onSubmit={submit}>
          <label className="login-field">
            <span>メールアドレス</span>
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="account@example.com"
              required
            />
          </label>
          <label className="login-field">
            <span>パスワード</span>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="パスワード"
                required
              />
              <button type="button" onClick={() => setShowPassword((current) => !current)} title={showPassword ? "隠す" : "表示"}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>
          {authError && <div className="login-error">{authError}</div>}
          <button className="login-submit" type="submit" disabled={loading || !email.trim() || !password}>
            <LogIn size={18} />
            {loading ? "確認中..." : "ログイン"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Header({ data, persist, reports, setFilters, syncStatus }) {
  const status = reports.alerts.length === 0;
  const syncLabels = {
    "local-only": "ローカル保存",
    "cloud-login": "DBログイン待ち",
    "cloud-loading": "DB読込中",
    "cloud-saving": "DB保存中",
    "cloud-ready": "DB同期済",
    "cloud-error": "DB要確認",
  };
  function changeFiscalYear(westernYear) {
    persist({ ...data, fiscalYear: String(westernYear) });
    setFilters((current) => ({ ...current, ...fiscalRange(westernYear) }));
  }
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">法人単位 / 事業区分 / 拠点区分 / サービス区分</p>
        <h2>{data.organization.name}</h2>
      </div>
      <div className="topbar-actions">
        <label className="field compact">
          <span>法人名</span>
          <input
            value={data.organization.name}
            onChange={(event) => persist({ ...data, organization: { ...data.organization, name: event.target.value } })}
          />
        </label>
        <label className="field year">
          <span>会計年度</span>
          <select value={data.fiscalYear} onChange={(event) => changeFiscalYear(event.target.value)}>
            {fiscalYearOptions(data.fiscalYear).map((year) => (
              <option key={year} value={year}>
                {fiscalYearLabel(year)}
              </option>
            ))}
          </select>
        </label>
        <button className="icon-button" onClick={() => window.print()} title="印刷">
          <Printer size={18} />
        </button>
        <div className={syncStatus === "cloud-error" ? "health warn" : "health good"} title={syncLabels[syncStatus] ?? syncStatus}>
          <Database size={17} />
          <span>{syncLabels[syncStatus] ?? syncStatus}</span>
        </div>
        <div className={status ? "health good" : "health warn"} title={status ? "入力整合" : reports.alerts.join(" / ")}>
          {status ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
          <span>{status ? "入力整合" : "要確認"}</span>
        </div>
      </div>
    </header>
  );
}

function CloudPanel({ cloudUser, loginCloud, logoutCloud, syncStatus }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  if (!cloudStoreEnabled()) return null;

  function submit(event) {
    event.preventDefault();
    if (!email || !password) return;
    loginCloud(email, password);
    setPassword("");
  }

  return (
    <section className="cloud-band">
      <div>
        <strong>{cloudUser ? "クラウドDB接続中" : "クラウドDBログイン"}</strong>
        <span>{cloudUser ? cloudUser.email : "Firebase Authenticationの利用者でログインしてください。"}</span>
      </div>
      {cloudUser ? (
        <button className="secondary-button" type="button" onClick={logoutCloud}>
          ログアウト
        </button>
      ) : (
        <form className="cloud-login" onSubmit={submit}>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="メール" />
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="パスワード" />
          <button className="secondary-button" type="submit" disabled={syncStatus === "cloud-loading"}>
            接続
          </button>
        </form>
      )}
    </section>
  );
}

function FilterBar({ data, filters, setFilters }) {
  const range = fiscalRange(data.fiscalYear);
  const serviceFilterOptions = filters.base === "all" ? data.divisions.services : serviceOptionsForBase(filters.base);
  const serviceFilterValue = serviceFilterOptions.includes(filters.service) ? filters.service : "all";
  function changeFrom(from) {
    const nextFrom = from < range.from ? range.from : from > range.to ? range.to : from;
    setFilters({ ...filters, from: nextFrom, to: filters.to < nextFrom ? nextFrom : filters.to });
  }
  function changeTo(to) {
    const nextTo = to > range.to ? range.to : to < range.from ? range.from : to;
    setFilters({ ...filters, from: filters.from > nextTo ? nextTo : filters.from, to: nextTo });
  }
  return (
    <section className="filter-band">
      <div className="filter-title">
        <Filter size={18} />
        <span>表示条件</span>
      </div>
      <label className="field search">
        <Search size={16} />
        <input
          placeholder="摘要・伝票番号で検索"
          value={filters.query}
          onChange={(event) => setFilters({ ...filters, query: event.target.value })}
        />
      </label>
      <SelectField
        label="事業区分"
        value={filters.business}
        options={["all", ...data.divisions.businesses]}
        onChange={(business) => setFilters({ ...filters, business })}
      />
      <SelectField
        label="拠点区分"
        value={filters.base}
        options={["all", ...data.divisions.bases]}
        onChange={(base) => setFilters({ ...filters, base, service: "all" })}
      />
      <SelectField
        label="サービス区分"
        value={serviceFilterValue}
        options={["all", ...serviceFilterOptions]}
        onChange={(service) => setFilters({ ...filters, service })}
      />
      <label className="field date">
        <span>開始</span>
        <input
          type="date"
          min={range.from}
          max={range.to}
          value={filters.from}
          onChange={(event) => changeFrom(event.target.value)}
        />
      </label>
      <label className="field date">
        <span>終了</span>
        <input
          type="date"
          min={range.from}
          max={range.to}
          value={filters.to}
          onChange={(event) => changeTo(event.target.value)}
        />
      </label>
    </section>
  );
}

function SelectField({ label, value, options, onChange, optionLabel = (option) => (option === "all" ? "すべて" : option) }) {
  return (
    <label className="field select">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function Dashboard({ data, reports, setActiveTab }) {
  const serviceCards = data.divisions.services.map((service) => {
    const rows = reports.rows.filter((entry) => entry.service === service);
    const revenue = sum(
      rows.map((entry) => {
        const account = reports.accounts[entry.debit]?.type === "income" ? reports.accounts[entry.debit] : reports.accounts[entry.credit];
        if (account?.type !== "income" || account.statement !== "activity") return 0;
        return signedForAccount(account, entry.debit === account.code ? entry.amount : 0, entry.credit === account.code ? entry.amount : 0);
      }),
    );
    const cost = sum(
      rows.map((entry) => {
        const account = reports.accounts[entry.debit]?.type === "expense" ? reports.accounts[entry.debit] : reports.accounts[entry.credit];
        if (account?.type !== "expense" || account.statement !== "activity") return 0;
        return signedForAccount(account, entry.debit === account.code ? entry.amount : 0, entry.credit === account.code ? entry.amount : 0);
      }),
    );
    return { service, revenue, cost, result: revenue - cost };
  });

  return (
    <div className="page-stack">
      <section className="kpi-grid">
        <Kpi icon={CircleDollarSign} label="サービス活動収益" value={currency(reports.income)} tone="green" />
        <Kpi icon={WalletCards} label="サービス活動費用" value={currency(reports.expenses + reports.noncashExpenses)} tone="coral" />
        <Kpi icon={Calculator} label="当期活動増減差額" value={currency(reports.result)} tone={reports.result >= 0 ? "green" : "coral"} />
        <Kpi icon={Building2} label="純資産見込" value={currency(reports.netAssets + reports.cumulativeResult)} tone="blue" />
        <Kpi icon={WalletCards} label="小口現金残高" value={currency(reports.pettyCash.balance)} tone="gold" />
      </section>

      <section className="workflow-strip">
        <button onClick={() => setActiveTab("petty")}>
          <WalletCards size={20} />
          <span>小口現金</span>
          <strong>{reports.pettyCash.balance < 10000 ? "補充確認" : "出納帳"}</strong>
        </button>
        <button onClick={() => setActiveTab("entries")}>
          <BookOpen size={20} />
          <span>仕訳入力</span>
          <strong>{number(reports.rows.length)}件表示中</strong>
        </button>
        <button onClick={() => setActiveTab("reports")}>
          <FileSpreadsheet size={20} />
          <span>帳票確認</span>
          <strong>試算表・3計算書類</strong>
        </button>
        <button onClick={() => setActiveTab("backup")}>
          <Database size={20} />
          <span>保全</span>
          <strong>JSON/CSV</strong>
        </button>
      </section>

      <section className="split-layout">
        <div className="panel">
          <div className="panel-heading">
            <h3>資金収支の内訳</h3>
            <SplitSquareHorizontal size={19} />
          </div>
          <div className="fund-bars">
            {reports.fundRows.map((row) => (
              <div className="fund-row" key={row.key}>
                <div>
                  <strong>{row.label}</strong>
                  <span>{currency(row.balance)}</span>
                </div>
                <meter min="-100" max="100" value={Math.max(-100, Math.min(100, row.balance / 100000))} />
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-heading">
            <h3>サービス区分別の採算</h3>
            <Layers3 size={19} />
          </div>
          <div className="table-wrap compact-table">
            <table>
              <thead>
                <tr>
                  <th>サービス区分</th>
                  <th>収益</th>
                  <th>費用</th>
                  <th>差額</th>
                </tr>
              </thead>
              <tbody>
                {serviceCards.map((row) => (
                  <tr key={row.service}>
                    <td>{row.service}</td>
                    <td>{currency(row.revenue)}</td>
                    <td>{currency(row.cost)}</td>
                    <td className={row.result >= 0 ? "positive" : "negative"}>{currency(row.result)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>予算執行状況</h3>
          <CalendarDays size={19} />
        </div>
        <BudgetTable rows={reports.budgetRows} />
      </section>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone }) {
  return (
    <div className={`kpi ${tone}`}>
      <div className="kpi-icon">
        <Icon size={22} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Entries({ data, persist, reports }) {
  const range = fiscalRange(data.fiscalYear);
  const selectableAccounts = journalAccounts(data.accounts);
  const blank = {
    date: isDateInFiscalRange(today(), data.fiscalYear) ? today() : range.from,
    voucher: "",
    description: "",
    business: data.divisions.businesses[0],
    base: data.divisions.bases[0],
    service: data.divisions.services[0],
    debit: selectableAccounts.find((account) => account.type === "expense")?.code ?? selectableAccounts[0].code,
    credit: selectableAccounts.find((account) => account.type === "asset")?.code ?? selectableAccounts[0].code,
    amount: "",
    fund: "operating",
  };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    setForm((current) => {
      const safeDate = isDateInFiscalRange(current.date, data.fiscalYear) ? current.date : range.from;
      return current.date === safeDate ? current : { ...current, date: safeDate };
    });
  }, [data.fiscalYear, range.from]);

  function updateEntryForm(patch) {
    const next = { ...form, ...patch };
    if (cashSide(next) !== "none" && next.fund === "noncash") {
      next.fund = "operating";
    }
    setForm(next);
  }

  function addEntry(event) {
    event.preventDefault();
    const amount = finiteNumber(form.amount);
    if (!amount || amount <= 0) return;
    if (!isDateInFiscalRange(form.date, data.fiscalYear)) {
      alert(fiscalDateErrorMessage(form.date, data.fiscalYear));
      return;
    }
    if (form.debit === form.credit) {
      alert("借方科目と貸方科目には別の科目を選択してください。");
      return;
    }
    if (cashSide(form) !== "none" && form.fund === "noncash") {
      alert("現金・預金を使う仕訳は非資金にできません。資金区分を選び直してください。");
      return;
    }
    const next = {
      ...form,
      id: crypto.randomUUID(),
      amount,
      voucher: form.voucher || `J-${String(data.entries.length + 1).padStart(4, "0")}`,
    };
    persist({ ...data, entries: [next, ...data.entries] });
    setForm({ ...blank, date: form.date });
  }

  function deleteEntry(entry) {
    if (!confirmDelete("仕訳", `${entry.date} ${entry.voucher} ${currency(entry.amount)} ${entry.description}`)) return;
    const id = entry.id;
    persist({ ...data, entries: data.entries.filter((entry) => entry.id !== id) });
  }

  return (
    <div className="page-stack">
      <section className="entry-layout">
        <form className="panel entry-form" onSubmit={addEntry}>
          <div className="panel-heading">
            <h3>仕訳入力</h3>
            <Plus size={19} />
          </div>
          <div className="form-grid">
            <label className="field">
              <span>日付</span>
              <input
                type="date"
                min={range.from}
                max={range.to}
                value={form.date}
                onChange={(event) => updateEntryForm({ date: event.target.value })}
              />
            </label>
            <label className="field">
              <span>伝票番号</span>
              <input value={form.voucher} onChange={(event) => updateEntryForm({ voucher: event.target.value })} />
            </label>
            <SelectField
              label="事業区分"
              value={form.business}
              options={data.divisions.businesses}
              onChange={(business) => updateEntryForm({ business })}
            />
            <SelectField
              label="拠点区分"
              value={form.base}
              options={data.divisions.bases}
              onChange={(base) => updateEntryForm({ base, service: serviceForBase(base) })}
            />
            <SelectField
              label="サービス区分"
              value={form.service}
              options={serviceOptionsForBase(form.base)}
              onChange={(service) => updateEntryForm({ service })}
            />
            <SelectField
              label="資金区分"
              value={form.fund}
              options={Object.keys(fundLabels).filter((key) => key !== "none" && (cashSide(form) === "none" || key !== "noncash"))}
              onChange={(fund) => updateEntryForm({ fund })}
              optionLabel={(fund) => fundLabels[fund]}
            />
            <AccountSelect label="借方科目" accounts={selectableAccounts} value={form.debit} onChange={(debit) => updateEntryForm({ debit })} />
            <AccountSelect label="貸方科目" accounts={selectableAccounts} value={form.credit} onChange={(credit) => updateEntryForm({ credit })} />
            <label className="field">
              <span>金額</span>
              <input
                type="number"
                min="1"
                value={form.amount}
                onChange={(event) => updateEntryForm({ amount: event.target.value })}
                placeholder="0"
              />
            </label>
            <label className="field wide">
              <span>摘要</span>
              <input
                value={form.description}
                onChange={(event) => updateEntryForm({ description: event.target.value })}
                placeholder="取引内容"
              />
            </label>
          </div>
          <button className="primary-button" type="submit">
            <Save size={18} />
            <span>登録</span>
          </button>
        </form>

        <div className="panel">
          <div className="panel-heading">
            <h3>検算</h3>
            <Calculator size={19} />
          </div>
          <div className="check-list">
            <div>
              <span>借方合計</span>
              <strong>{currency(sum(reports.rows.map((entry) => entry.amount)))}</strong>
            </div>
            <div>
              <span>貸方合計</span>
              <strong>{currency(sum(reports.rows.map((entry) => entry.amount)))}</strong>
            </div>
            <div>
              <span>対象仕訳</span>
              <strong>{number(reports.rows.length)}件</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>仕訳帳</h3>
          <BookOpen size={19} />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>日付</th>
                <th>伝票</th>
                <th>区分</th>
                <th>借方</th>
                <th>貸方</th>
                <th>金額</th>
                <th>摘要</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reports.rows.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.date}</td>
                  <td>{entry.voucher}</td>
                  <td>
                    <span className="stacked">{entry.base}</span>
                    <small>{entry.service}</small>
                  </td>
                  <td>{reports.accounts[entry.debit]?.name}</td>
                  <td>{reports.accounts[entry.credit]?.name}</td>
                  <td>{currency(entry.amount)}</td>
                  <td>{entry.description}</td>
                  <td>
                    <button className="icon-button danger" onClick={() => deleteEntry(entry)} title="削除">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AccountSelect({ label, data, accounts, value, onChange }) {
  const options = accounts ?? data.accounts;
  return (
    <label className="field select">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((account) => (
          <option key={account.code} value={account.code}>
            {account.code} {account.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function PettyCash({ data, persist, reports }) {
  const range = fiscalRange(data.fiscalYear);
  const expenseAccounts = data.accounts.filter((account) => account.type === "expense" && account.flow === "operating");
  const defaultBase = data.divisions.bases[1] ?? data.divisions.bases[0];
  const defaultService = data.divisions.services[1] ?? data.divisions.services[0];
  const defaultExpenseCode = expenseAccounts.find((account) => account.code === "5122")?.code ?? expenseAccounts[0]?.code ?? "5122";
  const [mode, setMode] = useState("expense");
  const [actualCash, setActualCash] = useState("");
  const [form, setForm] = useState({
    date: isDateInFiscalRange(today(), data.fiscalYear) ? today() : range.from,
    voucher: "",
    description: "",
    base: defaultBase,
    service: defaultService,
    expenseCode: defaultExpenseCode,
    amount: "",
  });
  useEffect(() => {
    setForm((current) => {
      const safeDate = isDateInFiscalRange(current.date, data.fiscalYear) ? current.date : range.from;
      return current.date === safeDate ? current : { ...current, date: safeDate };
    });
  }, [data.fiscalYear, range.from]);
  const pettyScopeReports = useMemo(
    () =>
      computeReports(data, {
        query: "",
        business: data.divisions.businesses[0],
        base: form.base,
        service: form.service,
        from: range.from,
        to: form.date || range.to,
      }),
    [data, form.base, form.service, form.date, range.from, range.to],
  );
  const pettyCash = pettyScopeReports.pettyCash;
  const pettyLedgerRows = [...pettyCash.rows]
    .sort((a, b) => `${a.date}${a.voucher}`.localeCompare(`${b.date}${b.voucher}`))
    .reduce((items, entry) => {
      const isIn = entry.debit === PETTY_CASH_CODE;
      const previous = items.length ? items[items.length - 1].runningBalance : 0;
      items.push({
        entry,
        isIn,
        runningBalance: previous + (isIn ? entry.amount : -entry.amount),
      });
      return items;
    }, []);

  function addPettyEntry(event) {
    event.preventDefault();
    const amount = finiteNumber(form.amount);
    if (!amount || amount <= 0) return;
    if (!isDateInFiscalRange(form.date, data.fiscalYear)) {
      alert(fiscalDateErrorMessage(form.date, data.fiscalYear));
      return;
    }

    const isReplenish = mode === "replenish";
    if (!isReplenish && amount > pettyCash.balance) {
      alert("小口現金残高を超える支払は登録できません。先に補充を登録してください。");
      return;
    }
    const next = {
      id: crypto.randomUUID(),
      date: form.date,
      voucher: form.voucher || `PC-${String(data.entries.length + 1).padStart(4, "0")}`,
      description: form.description || (isReplenish ? "小口現金の補充" : "小口現金支払"),
      business: data.divisions.businesses[0],
      base: form.base,
      service: form.service,
      debit: isReplenish ? PETTY_CASH_CODE : form.expenseCode,
      credit: isReplenish ? OPERATING_BANK_CODE : PETTY_CASH_CODE,
      amount,
      fund: "operating",
    };

    persist({ ...data, entries: [next, ...data.entries] });
    setForm({ ...form, voucher: "", description: "", amount: "" });
  }

  function deletePettyEntry(entry) {
    if (!confirmDelete("小口現金の取引", `${entry.date} ${entry.voucher} ${currency(entry.amount)} ${entry.description}`)) return;
    persist({ ...data, entries: data.entries.filter((item) => item.id !== entry.id) });
  }

  return (
    <div className="page-stack">
      <section className="petty-hero">
        <div>
          <p className="eyebrow">Petty cash control</p>
          <h3>小口現金</h3>
          <strong>{currency(pettyCash.balance)}</strong>
        </div>
        <div className="petty-metrics">
          <div>
            <span>補充累計</span>
            <strong>{currency(pettyCash.inflow)}</strong>
          </div>
          <div>
            <span>支払累計</span>
            <strong>{currency(pettyCash.outflow)}</strong>
          </div>
          <div>
            <span>小口取引</span>
            <strong>{number(pettyCash.rows.length)}件</strong>
          </div>
        </div>
      </section>

      <section className="entry-layout">
        <form className="panel entry-form" onSubmit={addPettyEntry}>
          <div className="panel-heading">
            <h3>小口現金入力</h3>
            <WalletCards size={19} />
          </div>
          <div className="segmented">
            <button type="button" className={mode === "expense" ? "active" : ""} onClick={() => setMode("expense")}>
              支払
            </button>
            <button type="button" className={mode === "replenish" ? "active" : ""} onClick={() => setMode("replenish")}>
              補充
            </button>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>日付</span>
              <input
                type="date"
                min={range.from}
                max={range.to}
                value={form.date}
                onChange={(event) => setForm({ ...form, date: event.target.value })}
              />
            </label>
            <label className="field">
              <span>伝票番号</span>
              <input value={form.voucher} onChange={(event) => setForm({ ...form, voucher: event.target.value })} />
            </label>
            <label className="field">
              <span>金額</span>
              <input
                type="number"
                min="1"
                value={form.amount}
                onChange={(event) => setForm({ ...form, amount: event.target.value })}
                placeholder="0"
              />
            </label>
            <SelectField
              label="拠点"
              value={form.base}
              options={data.divisions.bases}
              onChange={(base) => setForm({ ...form, base, service: serviceForBase(base) })}
            />
            <SelectField
              label="サービス"
              value={form.service}
              options={serviceOptionsForBase(form.base)}
              onChange={(service) => setForm({ ...form, service })}
            />
            {mode === "expense" ? (
              <label className="field select">
                <span>支払科目</span>
                <select value={form.expenseCode} onChange={(event) => setForm({ ...form, expenseCode: event.target.value })}>
                  {expenseAccounts.map((account) => (
                    <option key={account.code} value={account.code}>
                      {account.code} {account.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="petty-route">
                <span>仕訳</span>
                <strong>小口現金 / 普通預金</strong>
              </div>
            )}
            <label className="field wide">
              <span>摘要</span>
              <input
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder={mode === "replenish" ? "小口現金の補充" : "購入先・用途など"}
              />
            </label>
          </div>
          <button className="primary-button" type="submit">
            <Save size={18} />
            <span>{mode === "replenish" ? "補充を登録" : "支払を登録"}</span>
          </button>
        </form>

        <div className="panel">
          <div className="panel-heading">
            <h3>精算チェック</h3>
            <Calculator size={19} />
          </div>
          <label className="field cash-count">
            <span>現金実査額</span>
            <input
              type="number"
              min="0"
              value={actualCash}
              onChange={(event) => setActualCash(event.target.value)}
              placeholder="手元現金を入力"
            />
          </label>
          <div className="check-list">
            <div>
              <span>帳簿残高</span>
              <strong>{currency(pettyCash.balance)}</strong>
            </div>
            <div>
              <span>実査差額</span>
              <strong className={actualCash === "" || finiteNumber(actualCash) === pettyCash.balance ? "positive" : "negative"}>
                {actualCash === "" ? "未入力" : currency(finiteNumber(actualCash) - pettyCash.balance)}
              </strong>
            </div>
            <div>
              <span>推奨</span>
              <strong>{actualCash !== "" && finiteNumber(actualCash) !== pettyCash.balance ? "差額確認" : pettyCash.balance < 10000 ? "補充確認" : "通常"}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>小口現金出納帳</h3>
          <BookOpen size={19} />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>日付</th>
                <th>伝票</th>
                <th>入金</th>
                <th>出金</th>
                <th>残高</th>
                <th>相手科目</th>
                <th>拠点</th>
                <th>摘要</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pettyLedgerRows.map(({ entry, isIn, runningBalance }) => {
                const opposite = isIn ? reports.accounts[entry.credit] : reports.accounts[entry.debit];
                return (
                  <tr key={entry.id}>
                    <td>{entry.date}</td>
                    <td>{entry.voucher}</td>
                    <td>{isIn ? currency(entry.amount) : ""}</td>
                    <td>{!isIn ? currency(entry.amount) : ""}</td>
                    <td>{currency(runningBalance)}</td>
                    <td>{opposite?.name}</td>
                    <td>
                      <span className="stacked">{entry.base}</span>
                      <small>{entry.service}</small>
                    </td>
                    <td>{entry.description}</td>
                    <td>
                      <button className="icon-button danger" onClick={() => deletePettyEntry(entry)} title="削除">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ClosingDocs({ data, persist, reports }) {
  const range = fiscalRange(data.fiscalYear);
  const closingFilters = { query: "", business: "all", base: "all", service: "all", ...range };
  const closingReports = useMemo(() => computeReports(data, closingFilters), [data, range.from, range.to]);
  const assetAccounts = data.accounts.filter((account) => account.type === "asset" && account.flow === "facility");
  const defaultAssetCode = assetAccounts.find((account) => account.code === "1216")?.code ?? assetAccounts.find((account) => isDepreciableAsset(account.code))?.code ?? assetAccounts[0]?.code ?? "1216";
  const [assetForm, setAssetForm] = useState({
    name: "",
    base: data.divisions.bases[1],
    service: data.divisions.services[1],
    accountCode: defaultAssetCode,
    acquiredDate: range.from,
    acquisitionCost: "",
    subsidy: "",
    usefulLife: "5",
    location: "",
    status: "使用中",
  });
  const fixedRows = fixedAssetRows(data);
  const scopeRows = [
    { label: "法人単位", report: scopeReport(data, closingFilters, { base: "all", service: "all" }) },
    ...data.divisions.bases.map((base) => ({ label: base, report: scopeReport(data, closingFilters, { base, service: serviceForBase(base) }) })),
  ];
  const significantVariances = closingReports.budgetRows.filter((row) => Math.abs(row.variance) >= VARIANCE_THRESHOLD);
  const propertyRows = closingReports.balanceTrial
    .filter((row) => (row.type === "asset" || row.type === "liability") && row.balance)
    .map((row) => ({
      category: row.type === "asset" ? "資産" : "負債",
      name: row.name,
      amount: row.balance,
      detail: row.type === "asset" ? "貸借対照表残高" : "債務額",
    }));
  const closingChecks = [
    { label: "資金収支計算書の3区分", done: closingReports.fundRows.length === 3 },
    { label: "予算対比と差異理由", done: significantVariances.every((row) => data.varianceReasons?.[budgetKey(row)]) },
    { label: "事業活動計算書の区分表示", done: closingReports.activityRows.length === 3 && Number.isFinite(closingReports.result) },
    { label: "貸借対照表", done: Math.abs(closingReports.balanceSheetDifference) === 0 },
    { label: "附属明細書 固定資産", done: fixedRows.length > 0 },
    { label: "財産目録", done: propertyRows.length > 0 },
    { label: "計算書類の注記", done: Object.values(data.notes ?? {}).every((value) => String(value).trim()) },
  ];

  function updateNote(key, value) {
    persist({ ...data, notes: { ...data.notes, [key]: value } });
  }

  function updateVarianceReason(row, reason) {
    persist({ ...data, varianceReasons: { ...(data.varianceReasons ?? {}), [budgetKey(row)]: reason } });
  }

  function addFixedAsset(event) {
    event.preventDefault();
    const nextAsset = normalizeFixedAsset({ ...assetForm, id: crypto.randomUUID() }, data.fiscalYear);
    if (!nextAsset.name || nextAsset.acquisitionCost <= 0) return;
    persist({ ...data, fixedAssets: [nextAsset, ...(data.fixedAssets ?? [])] });
    setAssetForm({ ...assetForm, name: "", acquisitionCost: "", subsidy: "", location: "" });
  }

  function deleteFixedAsset(asset) {
    if (!confirmDelete("固定資産", `${asset.name} ${currency(asset.acquisitionCost)} ${asset.location}`)) return;
    const id = asset.id;
    persist({ ...data, fixedAssets: (data.fixedAssets ?? []).filter((asset) => asset.id !== id) });
  }

  return (
    <div className="page-stack">
      <section className="closing-grid">
        <div className="panel">
          <div className="panel-heading">
            <h3>決算提出チェック</h3>
            <ClipboardCheck size={19} />
          </div>
          <div className="checklist-grid">
            {closingChecks.map((item) => (
              <div className={item.done ? "closing-check done" : "closing-check warn"} key={item.label}>
                {item.done ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <h3>計算書類スコープ</h3>
            <SplitSquareHorizontal size={19} />
          </div>
          <div className="table-wrap compact-table">
            <table>
              <thead>
                <tr>
                  <th>区分</th>
                  <th>資金収支差額</th>
                  <th>活動増減差額</th>
                  <th>純資産見込</th>
                  <th>貸借差額</th>
                </tr>
              </thead>
              <tbody>
                {scopeRows.map((scope) => (
                  <tr key={scope.label}>
                    <td>{scope.label}</td>
                    <td>{currency(sum(scope.report.fundRows.map((row) => row.balance)))}</td>
                    <td>{currency(scope.report.result)}</td>
                    <td>{currency(scope.report.netAssets + scope.report.cumulativeResult)}</td>
                    <td className={Math.abs(scope.report.balanceSheetDifference) === 0 ? "positive" : "negative"}>
                      {currency(scope.report.balanceSheetDifference)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>資金収支 予算差異理由</h3>
          <FileText size={19} />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>拠点</th>
                <th>サービス</th>
                <th>科目</th>
                <th>予算</th>
                <th>決算</th>
                <th>差異</th>
                <th>理由</th>
              </tr>
            </thead>
            <tbody>
              {significantVariances.map((row) => (
                <tr key={budgetKey(row)}>
                  <td>{row.base}</td>
                  <td>{row.service}</td>
                  <td>{row.accountName}</td>
                  <td>{currency(row.amount)}</td>
                  <td>{currency(row.actual)}</td>
                  <td className={row.variance >= 0 ? "positive" : "negative"}>{currency(row.variance)}</td>
                  <td>
                    <input
                      className="table-input"
                      value={data.varianceReasons?.[budgetKey(row)] ?? ""}
                      onChange={(event) => updateVarianceReason(row, event.target.value)}
                      placeholder="差異理由"
                    />
                  </td>
                </tr>
              ))}
              {significantVariances.length === 0 && (
                <tr>
                  <td colSpan="7">大きな予算差異はありません。</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="entry-layout">
        <form className="panel entry-form" onSubmit={addFixedAsset}>
          <div className="panel-heading">
            <h3>固定資産台帳</h3>
            <Building2 size={19} />
          </div>
          <div className="form-grid">
            <label className="field">
              <span>資産名</span>
              <input value={assetForm.name} onChange={(event) => setAssetForm({ ...assetForm, name: event.target.value })} />
            </label>
            <AccountSelect
              label="資産科目"
              accounts={assetAccounts}
              value={assetForm.accountCode}
              onChange={(accountCode) => setAssetForm({ ...assetForm, accountCode })}
            />
            <SelectField
              label="拠点"
              value={assetForm.base}
              options={data.divisions.bases}
              onChange={(base) => setAssetForm({ ...assetForm, base, service: serviceForBase(base) })}
            />
            <SelectField
              label="サービス"
              value={assetForm.service}
              options={serviceOptionsForBase(assetForm.base)}
              onChange={(service) => setAssetForm({ ...assetForm, service })}
            />
            <label className="field">
              <span>取得日</span>
              <input type="date" value={assetForm.acquiredDate} onChange={(event) => setAssetForm({ ...assetForm, acquiredDate: event.target.value })} />
            </label>
            <label className="field">
              <span>取得価額</span>
              <input type="number" min="1" value={assetForm.acquisitionCost} onChange={(event) => setAssetForm({ ...assetForm, acquisitionCost: event.target.value })} />
            </label>
            <label className="field">
              <span>補助金等</span>
              <input type="number" min="0" value={assetForm.subsidy} onChange={(event) => setAssetForm({ ...assetForm, subsidy: event.target.value })} />
            </label>
            <label className="field">
              <span>耐用年数</span>
              <input type="number" min="1" value={assetForm.usefulLife} onChange={(event) => setAssetForm({ ...assetForm, usefulLife: event.target.value })} />
            </label>
            <label className="field wide">
              <span>所在地・保管場所</span>
              <input value={assetForm.location} onChange={(event) => setAssetForm({ ...assetForm, location: event.target.value })} />
            </label>
          </div>
          <button className="primary-button" type="submit">
            <Plus size={18} />
            <span>資産を追加</span>
          </button>
        </form>

        <div className="panel">
          <div className="panel-heading">
            <h3>注記</h3>
            <FileText size={19} />
          </div>
          <div className="note-grid">
            {Object.entries(data.notes ?? defaultNotes).map(([key, value]) => (
              <label className="field" key={key}>
                <span>{noteLabels[key] ?? key}</span>
                <textarea value={value} onChange={(event) => updateNote(key, event.target.value)} />
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>附属明細書 固定資産</h3>
          <FileSpreadsheet size={19} />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>資産名</th>
                <th>区分</th>
                <th>取得価額</th>
                <th>補助金等</th>
                <th>当期償却</th>
                <th>減価償却累計</th>
                <th>帳簿価額</th>
                <th>場所</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {fixedRows.map((asset) => (
                <tr key={asset.id}>
                  <td>{asset.name}</td>
                  <td>
                    <span className="stacked">{reports.accounts[asset.accountCode]?.name ?? asset.accountCode}</span>
                    <small>{asset.base} / {asset.service}</small>
                  </td>
                  <td>{currency(asset.acquisitionCost)}</td>
                  <td>{currency(asset.subsidy)}</td>
                  <td>{currency(asset.currentDepreciation)}</td>
                  <td>{currency(asset.accumulatedDepreciation)}</td>
                  <td>{currency(asset.bookValue)}</td>
                  <td>{asset.location}</td>
                  <td>
                    <button className="icon-button danger" onClick={() => deleteFixedAsset(asset)} title="削除">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>財産目録</h3>
          <Landmark size={19} />
        </div>
        <div className="table-wrap compact-table">
          <table>
            <thead>
              <tr>
                <th>区分</th>
                <th>名称</th>
                <th>内容</th>
                <th>金額</th>
              </tr>
            </thead>
            <tbody>
              {propertyRows.map((row) => (
                <tr key={`${row.category}-${row.name}`}>
                  <td>{row.category}</td>
                  <td>{row.name}</td>
                  <td>{row.detail}</td>
                  <td>{currency(row.amount)}</td>
                </tr>
              ))}
              {fixedRows.map((asset) => (
                <tr key={`asset-${asset.id}`}>
                  <td>固定資産明細</td>
                  <td>{asset.name}</td>
                  <td>{asset.location}</td>
                  <td>{currency(asset.bookValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Reports({ reports }) {
  return (
    <div className="page-stack">
      <section className="report-grid">
        <ReportPanel title="試算表" icon={Calculator}>
          <TrialTable rows={reports.trial.filter((row) => row.debit || row.credit || row.balance)} />
        </ReportPanel>
        <ReportPanel title="資金収支計算書" icon={WalletCards}>
          <SimpleStatement
            rows={[
              ...reports.fundRows.map((row) => [row.label, row.inflow, row.outflow, row.balance]),
              ["当期資金収支差額合計", sum(reports.fundRows.map((row) => row.inflow)), sum(reports.fundRows.map((row) => row.outflow)), sum(reports.fundRows.map((row) => row.balance))],
            ]}
            columns={["区分", "収入", "支出", "差額"]}
          />
        </ReportPanel>
        <ReportPanel title="事業活動計算書" icon={BarChart3}>
          <SimpleStatement
            rows={[
              ...reports.activityRows.map((row) => [row.label, row.income, row.expense, row.balance]),
              ["当期活動増減差額", "", "", reports.result],
            ]}
            columns={["科目", "収益", "費用", "差額"]}
          />
        </ReportPanel>
        <ReportPanel title="貸借対照表" icon={Building2}>
          <SimpleStatement
            rows={[
              ["資産の部", reports.assets, "", reports.assets],
              ["負債の部", "", reports.liabilities, -reports.liabilities],
              ["純資産の部", "", reports.netAssets + reports.cumulativeResult, -(reports.netAssets + reports.cumulativeResult)],
              ["貸借差額", "", "", reports.balanceSheetDifference],
            ]}
            columns={["区分", "借方", "貸方", "差額"]}
          />
        </ReportPanel>
      </section>
    </div>
  );
}

function ReportPanel({ title, icon: Icon, children }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h3>{title}</h3>
        <Icon size={19} />
      </div>
      {children}
    </section>
  );
}

function TrialTable({ rows }) {
  return (
    <div className="table-wrap compact-table">
      <table>
        <thead>
          <tr>
            <th>コード</th>
            <th>科目</th>
            <th>種別</th>
            <th>借方</th>
            <th>貸方</th>
            <th>残高</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.code}>
              <td>{row.code}</td>
              <td>{row.name}</td>
              <td>{accountTypes[row.type]}</td>
              <td>{currency(row.debit)}</td>
              <td>{currency(row.credit)}</td>
              <td>{currency(row.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SimpleStatement({ rows, columns }) {
  return (
    <div className="table-wrap compact-table">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, index) => (
                <td key={`${row[0]}-${index}`} className={index > 0 && Number(cell) < 0 ? "negative" : ""}>
                  {index === 0 || cell === "" ? cell : currency(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BudgetTable({ rows }) {
  return (
    <div className="table-wrap compact-table">
      <table>
        <thead>
          <tr>
            <th>拠点</th>
            <th>サービス</th>
            <th>科目</th>
            <th>予算</th>
            <th>実績</th>
            <th>残額</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.accountCode}-${row.base}-${row.service}`}>
              <td>{row.base}</td>
              <td>{row.service}</td>
              <td>{row.accountName}</td>
              <td>{currency(row.amount)}</td>
              <td>{currency(row.actual)}</td>
              <td className={row.variance >= 0 ? "positive" : "negative"}>{currency(row.variance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MasterData({ data, persist }) {
  const selectableBudgetAccounts = budgetAccounts(data.accounts);
  const [account, setAccount] = useState({ code: "", name: "", type: "expense", statement: "activity", flow: "operating" });
  const [budget, setBudget] = useState({
    accountCode: selectableBudgetAccounts.find((account) => account.code === "4112")?.code ?? selectableBudgetAccounts[0].code,
    base: data.divisions.bases[0],
    service: data.divisions.services[0],
    amount: "",
  });

  function addAccount(event) {
    event.preventDefault();
    const nextAccount = { ...account, code: account.code.trim(), name: account.name.trim(), statement: statementForType(account.type) };
    if (!nextAccount.code || !nextAccount.name || data.accounts.some((item) => item.code === nextAccount.code)) return;
    persist({ ...data, accounts: [...data.accounts, nextAccount].sort((a, b) => a.code.localeCompare(b.code)) });
    setAccount({ code: "", name: "", type: "expense", statement: "activity", flow: "operating" });
  }

  function addBudget(event) {
    event.preventDefault();
    const amount = finiteNumber(budget.amount);
    if (!amount || amount <= 0) return;
    persist({ ...data, budgets: consolidateBudgets([...data.budgets, { ...budget, amount }]) });
    setBudget({ ...budget, amount: "" });
  }

  return (
    <div className="page-stack">
      <section className="master-grid">
        <form className="panel" onSubmit={addAccount}>
          <div className="panel-heading">
            <h3>勘定科目</h3>
            <BookOpen size={19} />
          </div>
          <div className="form-grid small">
            <label className="field">
              <span>コード</span>
              <input value={account.code} onChange={(event) => setAccount({ ...account, code: event.target.value })} />
            </label>
            <label className="field">
              <span>科目名</span>
              <input value={account.name} onChange={(event) => setAccount({ ...account, name: event.target.value })} />
            </label>
            <SelectField
              label="種別"
              value={account.type}
              options={Object.keys(accountTypes)}
              onChange={(type) => setAccount({ ...account, type, statement: statementForType(type) })}
              optionLabel={(type) => accountTypes[type]}
            />
            <SelectField
              label="資金区分"
              value={account.flow}
              options={Object.keys(fundLabels)}
              onChange={(flow) => setAccount({ ...account, flow })}
              optionLabel={(flow) => fundLabels[flow]}
            />
          </div>
          <button className="primary-button" type="submit">
            <Plus size={18} />
            <span>追加</span>
          </button>
        </form>

        <section className="panel">
          <div className="panel-heading">
            <h3>区分</h3>
            <Layers3 size={19} />
          </div>
          <div className="division-list">
            <div>
              <span>事業区分</span>
              <strong>{data.divisions.businesses.join(" / ")}</strong>
            </div>
            <div>
              <span>拠点区分</span>
              <strong>{data.divisions.bases.join(" / ")}</strong>
            </div>
            <div>
              <span>サービス区分</span>
              <strong>{data.divisions.services.join(" / ")}</strong>
            </div>
          </div>
        </section>

        <form className="panel" onSubmit={addBudget}>
          <div className="panel-heading">
            <h3>予算</h3>
            <CalendarDays size={19} />
          </div>
          <div className="form-grid small">
            <AccountSelect
              label="科目"
              accounts={selectableBudgetAccounts}
              value={budget.accountCode}
              onChange={(accountCode) => setBudget({ ...budget, accountCode })}
            />
            <SelectField
              label="拠点"
              value={budget.base}
              options={data.divisions.bases}
              onChange={(base) => setBudget({ ...budget, base, service: serviceForBase(base) })}
            />
            <SelectField
              label="サービス"
              value={budget.service}
              options={serviceOptionsForBase(budget.base)}
              onChange={(service) => setBudget({ ...budget, service })}
            />
            <label className="field">
              <span>予算額</span>
              <input type="number" value={budget.amount} onChange={(event) => setBudget({ ...budget, amount: event.target.value })} />
            </label>
          </div>
          <button className="primary-button" type="submit">
            <Plus size={18} />
            <span>追加</span>
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>登録済み科目</h3>
          <FileSpreadsheet size={19} />
        </div>
        <TrialTable rows={data.accounts.map((item) => ({ ...item, debit: 0, credit: 0, balance: 0 }))} />
      </section>
    </div>
  );
}

function Backup({ data, persist, reports, resetDemo, setFilters }) {
  function exportJson() {
    downloadFile(`shafuku-accounting-${data.fiscalYear}.json`, JSON.stringify(data, null, 2), "application/json;charset=utf-8");
  }

  function exportEntriesCsv() {
    const rows = [
      ["日付", "伝票番号", "事業区分", "拠点区分", "サービス区分", "借方", "貸方", "金額", "資金区分", "摘要"],
      ...reports.rows.map((entry) => [
        entry.date,
        entry.voucher,
        entry.business,
        entry.base,
        entry.service,
        reports.accounts[entry.debit]?.name,
        reports.accounts[entry.credit]?.name,
        entry.amount,
        fundLabels[entry.fund],
        entry.description,
      ]),
    ];
    downloadFile(`仕訳帳-${data.fiscalYear}.csv`, `\uFEFF${rows.map((row) => row.map(csvEscape).join(",")).join("\n")}`, "text/csv;charset=utf-8");
  }

  function importJson(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const migrated = migrateData(parsed);
        persist(migrated);
        setFilters({ query: "", business: "all", base: "all", service: "all", ...fiscalRange(migrated.fiscalYear) });
      } catch {
        alert("JSONを読み込めませんでした。");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="page-stack">
      <section className="backup-grid">
        <ActionCard icon={Download} title="バックアップ" text="全データをJSONで保存します。" onClick={exportJson} />
        <ActionCard icon={FileSpreadsheet} title="仕訳CSV" text="現在の表示条件に一致する仕訳を出力します。" onClick={exportEntriesCsv} />
        <label className="action-card upload-card">
          <Upload size={25} />
          <strong>復元</strong>
          <span>保存済みJSONを読み込みます。</span>
          <input type="file" accept="application/json,.json" onChange={importJson} />
        </label>
        <ActionCard icon={RotateCcw} title="サンプル初期化" text="初期データに戻します。" onClick={resetDemo} danger />
      </section>
    </div>
  );
}

function ActionCard({ icon: Icon, title, text, onClick, danger }) {
  return (
    <button className={danger ? "action-card danger" : "action-card"} onClick={onClick}>
      <Icon size={25} />
      <strong>{title}</strong>
      <span>{text}</span>
    </button>
  );
}

createRoot(document.getElementById("root")).render(<App />);
