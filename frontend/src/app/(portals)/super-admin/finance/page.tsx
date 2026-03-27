"use client";

import { useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, Building2, Users, Receipt, Calculator, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type FinanceTab = "overview" | "capex" | "opex" | "payroll" | "tax";

const TABS: { id: FinanceTab; label: string }[] = [
  { id: "overview", label: "P&L Overview" },
  { id: "capex", label: "CapEx" },
  { id: "opex", label: "OpEx" },
  { id: "payroll", label: "Payroll & PAYE" },
  { id: "tax", label: "Tax" },
];

// ── Mock Data ──

const PL_SUMMARY = {
  revenue: { mtd: 12450, qtd: 34200, ytd: 78600 },
  expenses: { mtd: 8200, qtd: 22800, ytd: 51400 },
  grossMargin: "34%",
  netProfit: { mtd: 4250, qtd: 11400, ytd: 27200 },
  burnRate: "$8,200/mo",
  runway: "9.6 months",
};

const CAPEX_ITEMS = [
  { id: "CX-001", item: "AWS Infrastructure Setup", category: "Cloud", amount: 5000, date: "2025-06-15", status: "Paid", depreciation: "36 months" },
  { id: "CX-002", item: "Cloudflare Stream Annual", category: "Video Hosting", amount: 2400, date: "2025-07-01", status: "Paid", depreciation: "12 months" },
  { id: "CX-003", item: "Development Laptops (x3)", category: "Equipment", amount: 4500, date: "2025-08-10", status: "Paid", depreciation: "48 months" },
  { id: "CX-004", item: "LangSmith Enterprise License", category: "Software", amount: 3600, date: "2025-09-01", status: "Paid", depreciation: "12 months" },
  { id: "CX-005", item: "Office Setup (Remote Hub)", category: "Facilities", amount: 2000, date: "2026-01-15", status: "Pending", depreciation: "60 months" },
];

const OPEX_ITEMS = [
  { id: "OX-001", item: "AWS ECS Fargate (4 services)", category: "Cloud Hosting", amount: 1800, frequency: "Monthly", vendor: "AWS" },
  { id: "OX-002", item: "RDS PostgreSQL", category: "Database", amount: 450, frequency: "Monthly", vendor: "AWS" },
  { id: "OX-003", item: "ElastiCache Redis", category: "Caching", amount: 200, frequency: "Monthly", vendor: "AWS" },
  { id: "OX-004", item: "S3 Storage + Transfer", category: "Storage", amount: 120, frequency: "Monthly", vendor: "AWS" },
  { id: "OX-005", item: "Cloudflare Stream", category: "Video CDN", amount: 200, frequency: "Monthly", vendor: "Cloudflare" },
  { id: "OX-006", item: "GitHub Team", category: "DevOps", amount: 44, frequency: "Monthly", vendor: "GitHub" },
  { id: "OX-007", item: "Vercel Pro (Frontend)", category: "Hosting", amount: 20, frequency: "Monthly", vendor: "Vercel" },
  { id: "OX-008", item: "Domain + SSL", category: "Infrastructure", amount: 15, frequency: "Monthly", vendor: "Cloudflare" },
  { id: "OX-009", item: "Marketing & Ads", category: "Marketing", amount: 500, frequency: "Monthly", vendor: "Various" },
  { id: "OX-010", item: "Legal & Compliance", category: "Professional", amount: 300, frequency: "Monthly", vendor: "External" },
];

const PAYROLL = [
  { id: "PY-001", name: "Martin Tay", role: "CEO", grossSalary: 5000, paye: 750, pension: 250, nhis: 125, netPay: 3875, currency: "USD" },
  { id: "PY-002", name: "Esi Owusu", role: "COO", grossSalary: 4000, paye: 600, pension: 200, nhis: 100, netPay: 3100, currency: "USD" },
  { id: "PY-003", name: "Dr. Amina Osei", role: "Lead Instructor", grossSalary: 3500, paye: 525, pension: 175, nhis: 87, netPay: 2713, currency: "USD" },
  { id: "PY-004", name: "Prof. Kweku Mensah", role: "Instructor", grossSalary: 3000, paye: 450, pension: 150, nhis: 75, netPay: 2325, currency: "USD" },
  { id: "PY-005", name: "Nana Adjei", role: "Admin", grossSalary: 2500, paye: 375, pension: 125, nhis: 62, netPay: 1938, currency: "USD" },
  { id: "PY-006", name: "Chidinma Eze", role: "Finance Admin", grossSalary: 2500, paye: 375, pension: 125, nhis: 62, netPay: 1938, currency: "USD" },
  { id: "PY-007", name: "Tunde Bakare", role: "DevOps Engineer", grossSalary: 3500, paye: 525, pension: 175, nhis: 87, netPay: 2713, currency: "USD" },
];

const TAX_OBLIGATIONS = [
  { id: "TX-001", type: "Corporate Income Tax", jurisdiction: "Ghana", rate: "25%", amount: 6800, dueDate: "2026-04-30", status: "Upcoming", period: "FY 2025" },
  { id: "TX-002", type: "PAYE (Employer)", jurisdiction: "Ghana", rate: "Varies", amount: 3600, dueDate: "2026-04-15", status: "Upcoming", period: "Q1 2026" },
  { id: "TX-003", type: "VAT/NHIL", jurisdiction: "Ghana", rate: "15%", amount: 1867, dueDate: "2026-04-20", status: "Upcoming", period: "Mar 2026" },
  { id: "TX-004", type: "Withholding Tax", jurisdiction: "Ghana", rate: "5%", amount: 450, dueDate: "2026-04-15", status: "Upcoming", period: "Q1 2026" },
  { id: "TX-005", type: "PAYE (Employer)", jurisdiction: "Ghana", rate: "Varies", amount: 3400, dueDate: "2026-01-15", status: "Paid", period: "Q4 2025" },
  { id: "TX-006", type: "Corporate Income Tax", jurisdiction: "Ghana", rate: "25%", amount: 5200, dueDate: "2025-04-30", status: "Paid", period: "FY 2024" },
];

export default function FinancePage() {
  const [tab, setTab] = useState<FinanceTab>("overview");

  const totalCapex = CAPEX_ITEMS.reduce((s, i) => s + i.amount, 0);
  const monthlyOpex = OPEX_ITEMS.reduce((s, i) => s + i.amount, 0);
  const totalPayroll = PAYROLL.reduce((s, p) => s + p.grossSalary, 0);
  const totalPaye = PAYROLL.reduce((s, p) => s + p.paye, 0);
  const totalNetPay = PAYROLL.reduce((s, p) => s + p.netPay, 0);
  const upcomingTax = TAX_OBLIGATIONS.filter((t) => t.status === "Upcoming").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-sm text-surface-900">Finance & Accounting</h1>
        <p className="mt-1 text-body-lg text-surface-500">CapEx, OpEx, payroll, PAYE, tax obligations, and P&L tracking.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-surface-200 pb-0">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-body-sm font-medium border-b-2 transition-all -mb-px ${tab === t.id ? "border-brand-600 text-brand-700" : "border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* P&L Overview */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            {[
              { label: "Revenue (MTD)", value: `$${PL_SUMMARY.revenue.mtd.toLocaleString()}`, color: "text-accent-600", Icon: TrendingUp, bg: "bg-accent-50" },
              { label: "Expenses (MTD)", value: `$${PL_SUMMARY.expenses.mtd.toLocaleString()}`, color: "text-status-error", Icon: TrendingDown, bg: "bg-red-50" },
              { label: "Net Profit (MTD)", value: `$${PL_SUMMARY.netProfit.mtd.toLocaleString()}`, color: "text-brand-600", Icon: DollarSign, bg: "bg-brand-50" },
              { label: "Gross Margin", value: PL_SUMMARY.grossMargin, color: "text-accent-600", Icon: Calculator, bg: "bg-accent-50" },
              { label: "Monthly Burn Rate", value: PL_SUMMARY.burnRate, color: "text-amber-600", Icon: Receipt, bg: "bg-amber-50" },
              { label: "Cash Runway", value: PL_SUMMARY.runway, color: "text-purple-600", Icon: Building2, bg: "bg-purple-50" },
            ].map((kpi) => {
              const Icon = kpi.Icon;
              return (
                <div key={kpi.label} className="rounded-xl border border-surface-200 bg-surface-0 p-5 shadow-card">
                  <div className="flex items-center justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.bg}`}>
                      <Icon className={`h-5 w-5 ${kpi.color}`} />
                    </div>
                    <span className={`text-heading-sm font-bold ${kpi.color}`}>{kpi.value}</span>
                  </div>
                  <p className="mt-3 text-body-sm text-surface-500">{kpi.label}</p>
                </div>
              );
            })}
          </div>

          {/* Expense Breakdown */}
          <div className="rounded-xl border border-surface-200 bg-surface-0 p-5 shadow-card">
            <h3 className="text-heading-sm text-surface-900 mb-4">Monthly Expense Breakdown</h3>
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { label: "Staff Payroll", value: totalPayroll, pct: Math.round((totalPayroll / (totalPayroll + monthlyOpex)) * 100) },
                { label: "Cloud & Infra", value: OPEX_ITEMS.filter((i) => ["Cloud Hosting", "Database", "Caching", "Storage", "Infrastructure"].includes(i.category)).reduce((s, i) => s + i.amount, 0), pct: 0 },
                { label: "SaaS & Tools", value: OPEX_ITEMS.filter((i) => ["DevOps", "Hosting", "Video CDN", "Software"].includes(i.category)).reduce((s, i) => s + i.amount, 0), pct: 0 },
                { label: "Other (Marketing, Legal)", value: OPEX_ITEMS.filter((i) => ["Marketing", "Professional"].includes(i.category)).reduce((s, i) => s + i.amount, 0), pct: 0 },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-surface-50 p-4 text-center">
                  <p className="text-heading-sm font-bold text-surface-900">${item.value.toLocaleString()}</p>
                  <p className="text-caption text-surface-500 mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue vs Expenses */}
          <div className="rounded-xl border border-surface-200 bg-surface-0 shadow-card overflow-hidden">
            <table className="w-full text-left text-body-sm">
              <thead className="border-b border-surface-200 bg-surface-50">
                <tr>
                  <th className="px-5 py-3 text-surface-600 font-medium">Period</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Revenue</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Expenses</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Net Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {[
                  { period: "Month to Date", rev: PL_SUMMARY.revenue.mtd, exp: PL_SUMMARY.expenses.mtd, net: PL_SUMMARY.netProfit.mtd },
                  { period: "Quarter to Date", rev: PL_SUMMARY.revenue.qtd, exp: PL_SUMMARY.expenses.qtd, net: PL_SUMMARY.netProfit.qtd },
                  { period: "Year to Date", rev: PL_SUMMARY.revenue.ytd, exp: PL_SUMMARY.expenses.ytd, net: PL_SUMMARY.netProfit.ytd },
                ].map((row) => (
                  <tr key={row.period} className="hover:bg-surface-50 transition-colors">
                    <td className="px-5 py-3 text-surface-900 font-medium">{row.period}</td>
                    <td className="px-5 py-3 text-accent-600 font-bold">${row.rev.toLocaleString()}</td>
                    <td className="px-5 py-3 text-status-error">${row.exp.toLocaleString()}</td>
                    <td className="px-5 py-3 text-brand-600 font-bold">${row.net.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CapEx */}
      {tab === "capex" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-heading-sm text-surface-900">Capital Expenditures</p>
              <p className="text-body-sm text-surface-500">One-time investments in infrastructure, equipment, and software licenses.</p>
            </div>
            <div className="text-right">
              <p className="text-heading-sm font-bold text-surface-900">${totalCapex.toLocaleString()}</p>
              <p className="text-caption text-surface-400">Total CapEx</p>
            </div>
          </div>
          <div className="rounded-xl border border-surface-200 bg-surface-0 shadow-card overflow-hidden">
            <table className="w-full text-left text-body-sm">
              <thead className="border-b border-surface-200 bg-surface-50">
                <tr>
                  <th className="px-5 py-3 text-surface-600 font-medium">Item</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Category</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Amount</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Date</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Depreciation</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {CAPEX_ITEMS.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-5 py-3 text-surface-900 font-medium">{item.item}</td>
                    <td className="px-5 py-3 text-surface-600">{item.category}</td>
                    <td className="px-5 py-3 text-surface-900 font-bold">${item.amount.toLocaleString()}</td>
                    <td className="px-5 py-3 text-surface-600">{item.date}</td>
                    <td className="px-5 py-3 text-surface-500">{item.depreciation}</td>
                    <td className="px-5 py-3"><Badge className={`border-0 ${item.status === "Paid" ? "bg-accent-50 text-accent-700" : "bg-amber-50 text-amber-700"}`}>{item.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* OpEx */}
      {tab === "opex" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-heading-sm text-surface-900">Operational Expenditures</p>
              <p className="text-body-sm text-surface-500">Recurring monthly costs for cloud, tools, marketing, and professional services.</p>
            </div>
            <div className="text-right">
              <p className="text-heading-sm font-bold text-surface-900">${monthlyOpex.toLocaleString()}/mo</p>
              <p className="text-caption text-surface-400">${(monthlyOpex * 12).toLocaleString()}/yr</p>
            </div>
          </div>
          <div className="rounded-xl border border-surface-200 bg-surface-0 shadow-card overflow-hidden">
            <table className="w-full text-left text-body-sm">
              <thead className="border-b border-surface-200 bg-surface-50">
                <tr>
                  <th className="px-5 py-3 text-surface-600 font-medium">Item</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Category</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Amount</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Frequency</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Vendor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {OPEX_ITEMS.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-5 py-3 text-surface-900 font-medium">{item.item}</td>
                    <td className="px-5 py-3 text-surface-600">{item.category}</td>
                    <td className="px-5 py-3 text-surface-900 font-bold">${item.amount.toLocaleString()}</td>
                    <td className="px-5 py-3 text-surface-500">{item.frequency}</td>
                    <td className="px-5 py-3 text-surface-600">{item.vendor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payroll & PAYE */}
      {tab === "payroll" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-heading-sm text-surface-900">Payroll & PAYE</p>
              <p className="text-body-sm text-surface-500">Staff compensation, PAYE tax deductions, pension, and NHIS contributions.</p>
            </div>
            <div className="flex gap-6 text-right">
              <div><p className="text-heading-sm font-bold text-surface-900">${totalPayroll.toLocaleString()}</p><p className="text-caption text-surface-400">Gross/mo</p></div>
              <div><p className="text-heading-sm font-bold text-status-error">${totalPaye.toLocaleString()}</p><p className="text-caption text-surface-400">PAYE/mo</p></div>
              <div><p className="text-heading-sm font-bold text-accent-600">${totalNetPay.toLocaleString()}</p><p className="text-caption text-surface-400">Net Pay/mo</p></div>
            </div>
          </div>
          <div className="rounded-xl border border-surface-200 bg-surface-0 shadow-card overflow-hidden">
            <table className="w-full text-left text-body-sm">
              <thead className="border-b border-surface-200 bg-surface-50">
                <tr>
                  <th className="px-5 py-3 text-surface-600 font-medium">Staff</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Role</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Gross</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">PAYE</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Pension</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">NHIS</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Net Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {PAYROLL.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-5 py-3 text-surface-900 font-medium">{p.name}</td>
                    <td className="px-5 py-3 text-surface-600">{p.role}</td>
                    <td className="px-5 py-3 text-surface-900">${p.grossSalary.toLocaleString()}</td>
                    <td className="px-5 py-3 text-status-error">${p.paye.toLocaleString()}</td>
                    <td className="px-5 py-3 text-surface-600">${p.pension.toLocaleString()}</td>
                    <td className="px-5 py-3 text-surface-600">${p.nhis.toLocaleString()}</td>
                    <td className="px-5 py-3 text-accent-600 font-bold">${p.netPay.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-surface-300 bg-surface-50">
                <tr>
                  <td className="px-5 py-3 text-surface-900 font-bold" colSpan={2}>Total</td>
                  <td className="px-5 py-3 text-surface-900 font-bold">${totalPayroll.toLocaleString()}</td>
                  <td className="px-5 py-3 text-status-error font-bold">${totalPaye.toLocaleString()}</td>
                  <td className="px-5 py-3 text-surface-900 font-bold">${PAYROLL.reduce((s, p) => s + p.pension, 0).toLocaleString()}</td>
                  <td className="px-5 py-3 text-surface-900 font-bold">${PAYROLL.reduce((s, p) => s + p.nhis, 0).toLocaleString()}</td>
                  <td className="px-5 py-3 text-accent-600 font-bold">${totalNetPay.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Tax Obligations */}
      {tab === "tax" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-heading-sm text-surface-900">Tax Obligations</p>
              <p className="text-body-sm text-surface-500">Corporate tax, PAYE remittance, VAT/NHIL, and withholding tax deadlines.</p>
            </div>
            <div className="text-right">
              <p className="text-heading-sm font-bold text-amber-600">${upcomingTax.toLocaleString()}</p>
              <p className="text-caption text-surface-400">Upcoming obligations</p>
            </div>
          </div>
          <div className="rounded-xl border border-surface-200 bg-surface-0 shadow-card overflow-hidden">
            <table className="w-full text-left text-body-sm">
              <thead className="border-b border-surface-200 bg-surface-50">
                <tr>
                  <th className="px-5 py-3 text-surface-600 font-medium">Tax Type</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Jurisdiction</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Rate</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Amount</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Period</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Due Date</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {TAX_OBLIGATIONS.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-5 py-3 text-surface-900 font-medium">{t.type}</td>
                    <td className="px-5 py-3 text-surface-600">{t.jurisdiction}</td>
                    <td className="px-5 py-3 text-surface-600">{t.rate}</td>
                    <td className="px-5 py-3 text-surface-900 font-bold">${t.amount.toLocaleString()}</td>
                    <td className="px-5 py-3 text-surface-500">{t.period}</td>
                    <td className="px-5 py-3 text-surface-600">{t.dueDate}</td>
                    <td className="px-5 py-3"><Badge className={`border-0 ${t.status === "Paid" ? "bg-accent-50 text-accent-700" : "bg-amber-50 text-amber-700"}`}>{t.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
