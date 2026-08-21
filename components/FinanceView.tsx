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
  Wallet
} from "lucide-react";

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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            Income & Expenses
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Track property-wide financial health and log manual expenses.
          </p>
        </div>
        
        <button
          onClick={() => setShowExpenseModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-teal-600/20 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Log Expense
        </button>
      </div>

      {/* P&L Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card-no-hover p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden">
          <TrendingUp className="absolute top-4 right-4 w-16 h-16 text-emerald-500/10" />
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Total Income</p>
          <p className="text-3xl font-extrabold text-white">₹{totalIncome.toLocaleString()}</p>
        </div>

        <div className="glass-card-no-hover p-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 relative overflow-hidden">
          <TrendingDown className="absolute top-4 right-4 w-16 h-16 text-rose-500/10" />
          <p className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">Total Expense</p>
          <p className="text-3xl font-extrabold text-white">₹{totalExpense.toLocaleString()}</p>
        </div>

        <div className={`glass-card-no-hover p-6 rounded-2xl border relative overflow-hidden ${
          netProfit >= 0 ? "border-indigo-500/20 bg-indigo-500/5" : "border-rose-500/20 bg-rose-500/5"
        }`}>
          <Wallet className={`absolute top-4 right-4 w-16 h-16 ${netProfit >= 0 ? "text-indigo-500/10" : "text-rose-500/10"}`} />
          <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${netProfit >= 0 ? "text-indigo-400" : "text-rose-400"}`}>
            Net Profit (All Time)
          </p>
          <p className="text-3xl font-extrabold text-white">₹{netProfit.toLocaleString()}</p>
        </div>
      </div>

      {/* Transaction Ledger */}
      <div className="glass-card border border-slate-800/60 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800/60 bg-slate-900/30">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <LineChart className="w-5 h-5 text-teal-400" />
            Transaction Ledger
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {allTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No transactions recorded yet.
                  </td>
                </tr>
              ) : (
                allTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(t.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${
                        t.type === "income" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 capitalize font-medium text-slate-300">{t.category}</td>
                    <td className="px-6 py-4 text-slate-400">{t.description}</td>
                    <td className={`px-6 py-4 text-right font-bold ${
                      t.type === "income" ? "text-emerald-400" : "text-rose-400"
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddExpense} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md animate-fade-in shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-teal-400" />
                  Log Manual Expense
                </h3>
              </div>
              <button type="button" onClick={() => setShowExpenseModal(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Category *</label>
                <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-full p-2.5 rounded-xl text-sm glass-input">
                  <option value="maintenance">Maintenance</option>
                  <option value="salary">Salary</option>
                  <option value="utilities">Utilities</option>
                  <option value="asset_purchase">Asset Purchase</option>
                  <option value="marketing">Marketing</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Amount (₹) *</label>
                <input required type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2.5 rounded-xl text-sm glass-input" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Date *</label>
                <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2.5 rounded-xl text-sm glass-input" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Description *</label>
                <input required type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Plumbing fix in Room 101" className="w-full p-2.5 rounded-xl text-sm glass-input" />
              </div>
            </div>

            <div className="flex gap-3 pt-6 mt-6 border-t border-slate-800">
              <button type="button" onClick={() => setShowExpenseModal(false)} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-all ml-auto">Cancel</button>
              <button type="submit" className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-teal-600/20">Record Expense</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
