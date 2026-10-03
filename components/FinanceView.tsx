"use client";

import React, { useState } from "react";
import { Expense, BillingRecord, Fine } from "../lib/db";
import { 
  LineChart, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  IndianRupee,
  Calendar,
  Wallet,
  Download
} from "lucide-react";
import { exportToCSV } from "../lib/export";

import ModalOverlay from "./ui/ModalOverlay";
interface FinanceViewProps {
  expenses: Expense[];
  billing: BillingRecord[];
  fines: Fine[];
  onAddExpense: (exp: Expense) => Promise<void>;
  selectedPropertyId: string;
}

type Transaction = {
  id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  date: string;
  description: string;
};

export default function FinanceView({
  expenses,
  billing,
  fines,
  onAddExpense,
  selectedPropertyId
}: FinanceViewProps) {
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  
  // Expense Form
  const [category, setCategory] = useState<Expense["category"]>("maintenance");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");

  // Aggregate Data
  const incomeTransactions: Transaction[] = [];

  // From Billing
  billing.forEach(b => {
    if (b.rentStatus === "paid" && b.rentPaidDate) {
      incomeTransactions.push({
        id: `inc-rent-${b.id}`,
        type: "income",
        category: "Rent",
        amount: b.rentAmount,
        date: b.rentPaidDate.split("T")[0],
        description: `Rent - ${b.tenantName} (Room ${b.roomId.split('_')[1]})`
      });
    }
    if (b.electricityStatus === "paid" && b.electricityPaidDate) {
      incomeTransactions.push({
        id: `inc-elec-${b.id}`,
        type: "income",
        category: "Electricity",
        amount: b.electricityAmount,
        date: b.electricityPaidDate.split("T")[0],
        description: `Electricity - ${b.tenantName} (Room ${b.roomId.split('_')[1]})`
      });
    }
  });

  // From Fines
  fines.forEach(f => {
    if (f.status === "paid") {
      incomeTransactions.push({
        id: `inc-fine-${f.id}`,
        type: "income",
        category: "Fine",
        amount: f.amount,
        date: f.date,
        description: `Fine - ${f.tenantName}: ${f.reason}`
      });
    }
  });

  const expenseTransactions: Transaction[] = expenses.map(e => ({
    id: `exp-${e.id}`,
    type: "expense",
    category: e.category.replace("_", " "),
    amount: e.amount,
    date: e.date,
    description: e.description
  }));

  const allTransactions = [...incomeTransactions, ...expenseTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const categories = Array.from(new Set(allTransactions.map((t) => t.category))).sort();

  const filteredTransactions = allTransactions.filter((t) => {
    const matchesType = filterType === "all" || t.type === filterType;
    const matchesCategory = filterCategory === "all" || t.category === filterCategory;
    const matchesStart = !startDate || t.date >= startDate;
    const matchesEnd = !endDate || t.date <= endDate;
    return matchesType && matchesCategory && matchesStart && matchesEnd;
  });

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !date) return;

    await onAddExpense({
      id: `exp-${Date.now()}`,
      propertyId: selectedPropertyId,
      category,
      amount: Number(amount),
      date,
      description
    });

    setShowExpenseModal(false);
    setAmount("");
    setDescription("");
  };

  const handleExportFinance = () => {
    const headers = ["Transaction ID", "Date", "Type", "Category", "Description", "Amount (Rs)"];
    const rows = allTransactions.map((t) => [
      t.id,
      t.date,
      t.type.toUpperCase(),
      t.category,
      t.description,
      t.amount
    ]);
    exportToCSV(`Financial_Statement_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Income & Expenses
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Track property-wide financial health and log manual expenses.
          </p>
        </div>
        
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleExportFinance}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all border border-slate-200"
            title="Download Excel / CSV"
          >
            <Download className="w-4 h-4 text-slate-600" />
            Export CSV
          </button>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Log Expense
          </button>
        </div>
      </div>

      {/* P&L Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-50 border border-emerald-200 shadow-sm p-6 rounded-2xl relative overflow-hidden">
          <TrendingUp className="absolute top-4 right-4 w-16 h-16 text-emerald-500/10" />
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Total Income</p>
          <p className="text-3xl font-extrabold text-slate-900">₹{totalIncome.toLocaleString()}</p>
        </div>

        <div className="bg-rose-50 border border-rose-200 shadow-sm p-6 rounded-2xl overflow-hidden relative overflow-hidden">
          <TrendingDown className="absolute top-4 right-4 w-16 h-16 text-rose-500/10" />
          <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2">Total Expense</p>
          <p className="text-3xl font-extrabold text-slate-900">₹{totalExpense.toLocaleString()}</p>
        </div>

        <div className={`bg-white border border-slate-200 shadow-sm p-6 rounded-2xl overflow-hidden relative overflow-hidden ${
          netProfit >= 0 ? "border-indigo-200 bg-indigo-500/5" : "border-rose-200 bg-rose-500/5"
        }`}>
          <Wallet className={`absolute top-4 right-4 w-16 h-16 ${netProfit >= 0 ? "text-indigo-500/10" : "text-rose-500/10"}`} />
          <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${netProfit >= 0 ? "text-indigo-600" : "text-rose-600"}`}>
            Net Profit (All Time)
          </p>
          <p className="text-3xl font-extrabold text-slate-900">₹{netProfit.toLocaleString()}</p>
        </div>
      </div>

      {/* Transaction Ledger */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <LineChart className="w-5 h-5 text-indigo-600" />
            Transaction Ledger
          </h3>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-semibold text-[11px]">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-semibold text-[11px]">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
            >
              <option value="all">All Types</option>
              <option value="income">Income Only</option>
              <option value="expense">Expenses Only</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No transactions recorded matching the selected date/filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-mono">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(t.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                        t.type === "income" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 capitalize font-semibold text-slate-800">{t.category}</td>
                    <td className="px-6 py-4 text-slate-600">{t.description}</td>
                    <td className={`px-6 py-4 text-right font-extrabold font-mono ${
                      t.type === "income" ? "text-emerald-600" : "text-rose-600"
                    }`}>
                      {t.type === "income" ? "+" : "-"} ₹{t.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EXPENSE MODAL */}
      {showExpenseModal && (
        <ModalOverlay tone="bg-slate-900/50" onClose={() => setShowExpenseModal(false)}>
          <form onSubmit={handleAddExpense} className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md animate-fade-in shadow-xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-teal-600" />
                  Log Manual Expense
                </h3>
              </div>
              <button type="button" onClick={() => setShowExpenseModal(false)} className="text-slate-500 hover:text-slate-900">✕</button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Category *</label>
                <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors">
                  <option value="maintenance">Maintenance</option>
                  <option value="salary">Salary</option>
                  <option value="utilities">Utilities</option>
                  <option value="asset_purchase">Asset Purchase</option>
                  <option value="marketing">Marketing</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Amount (₹) *</label>
                <input required type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Date *</label>
                <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Description *</label>
                <input required type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Plumbing fix in Room 101" className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
              </div>
            </div>

            <div className="flex gap-3 pt-6 mt-6 border-t border-slate-200">
              <button type="button" onClick={() => setShowExpenseModal(false)} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all ml-auto">Cancel</button>
              <button type="submit" className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-teal-600/20">Record Expense</button>
            </div>
          </form>
        </ModalOverlay>
      )}
    </div>
  );
}
