"use client";

import React, { useState } from "react";
import { 
  Receipt, 
  Plus, 
  IndianRupee, 
  Printer, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Calculator,
  User,
  ArrowRight,
  TrendingUp,
  Download,
  MessageCircle,
  Zap,
  Table,
  Check,
  Search,
  Filter
} from "lucide-react";
import { BillingRecord, Tenant, Room } from "../lib/db";
import { whatsappService } from "../lib/whatsapp";
import { exportToCSV } from "../lib/export";

import ModalOverlay from "./ui/ModalOverlay";
interface BillingViewProps {
  billing: BillingRecord[];
  tenants: Tenant[];
  rooms?: Room[];
  onAddBilling: (billing: BillingRecord) => Promise<void>;
  onUpdateBillPayment: (billId: string, type: "rent" | "electricity" | "both", paidAmount: number, date: string) => Promise<void>;
  selectedPropertyId: string;
}

export default function BillingView({ billing, tenants, rooms, onAddBilling, onUpdateBillPayment, selectedPropertyId }: BillingViewProps) {
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState<BillingRecord | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<BillingRecord | null>(null);

  // Bulk Electricity Sheet states
  const [bulkMonth, setBulkMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [bulkRate, setBulkRate] = useState(10);
  const [readings, setReadings] = useState<{ [tenantId: string]: number }>({});
  const [savingBulk, setSavingBulk] = useState(false);

  // Electricity Calculator states
  const [calcTenantId, setCalcTenantId] = useState("");
  const [calcMonth, setCalcMonth] = useState("2026-07");
  const [calcPrevReading, setCalcPrevReading] = useState(0);
  const [calcCurrReading, setCalcCurrReading] = useState(0);
  const [calcRate, setCalcRate] = useState(10); // ₹10 per unit

  // Payment states
  const [paymentType, setPaymentType] = useState<"rent" | "electricity" | "both">("both");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);

  // Filters
  const [filterSearch, setFilterSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<"all" | "paid" | "unpaid">("all");

  const availableMonths = Array.from(new Set(billing.map((b) => b.billingMonth))).sort().reverse();

  const filteredBilling = billing.filter((b) => {
    const matchesSearch =
      b.tenantName.toLowerCase().includes(filterSearch.toLowerCase()) ||
      b.roomId.toLowerCase().includes(filterSearch.toLowerCase());
    const matchesMonth = filterMonth === "all" || b.billingMonth === filterMonth;
    const balance = b.totalAmount - b.paidAmount;
    const matchesStatus =
      filterPaymentStatus === "all" ||
      (filterPaymentStatus === "paid" && balance === 0) ||
      (filterPaymentStatus === "unpaid" && balance > 0);

    return matchesSearch && matchesMonth && matchesStatus;
  });

  // Active tenants only for billing
  const activeTenants = tenants.filter((t) => t.status === "active");

  const getLatestReading = (tenantId: string): number => {
    const tenantBills = billing.filter((b) => b.tenantId === tenantId);
    if (tenantBills.length === 0) return 0;
    const sorted = [...tenantBills].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return sorted[0].electricityCurrReading || 0;
  };

  const openBulkModal = () => {
    const initial: { [tenantId: string]: number } = {};
    activeTenants.forEach((t) => {
      const existing = billing.find((b) => b.tenantId === t.id && b.billingMonth === bulkMonth);
      if (existing && existing.electricityCurrReading > 0) {
        initial[t.id] = existing.electricityCurrReading;
      } else {
        initial[t.id] = getLatestReading(t.id);
      }
    });
    setReadings(initial);
    setShowBulkModal(true);
  };

  const handleSaveBulkElectricity = async () => {
    setSavingBulk(true);
    let count = 0;
    for (const t of activeTenants) {
      const prev = getLatestReading(t.id);
      const curr = readings[t.id] ?? prev;
      if (curr < prev) continue;
      const units = curr - prev;
      const elecAmount = units * bulkRate;

      const existingBill = billing.find((b) => b.tenantId === t.id && b.billingMonth === bulkMonth);
      if (existingBill) {
        const updated: BillingRecord = {
          ...existingBill,
          electricityPrevReading: prev,
          electricityCurrReading: curr,
          electricityUnits: units,
          electricityRatePerUnit: bulkRate,
          electricityAmount: elecAmount,
          totalAmount: existingBill.rentAmount + elecAmount,
          paidAmount: existingBill.rentStatus === "paid" ? existingBill.rentAmount : 0
        };
        await onAddBilling(updated);
        count++;
      } else {
        const newBill: BillingRecord = {
          id: `bill-${Date.now()}-${t.id}`,
          propertyId: selectedPropertyId,
          tenantId: t.id,
          tenantName: t.name,
          roomId: t.roomId,
          billingMonth: bulkMonth,
          rentAmount: t.rentAmount,
          rentStatus: "unpaid",
          rentPaidDate: null,
          electricityPrevReading: prev,
          electricityCurrReading: curr,
          electricityUnits: units,
          electricityRatePerUnit: bulkRate,
          electricityAmount: elecAmount,
          electricityStatus: "unpaid",
          electricityPaidDate: null,
          totalAmount: t.rentAmount + elecAmount,
          paidAmount: 0,
          createdAt: new Date().toISOString()
        };
        await onAddBilling(newBill);
        count++;
      }
    }
    setSavingBulk(false);
    setShowBulkModal(false);
    alert(`Electricity readings saved and invoices updated for ${count} tenants!`);
  };

  const handleBatchGenerateRent = async () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const targetMonth = prompt("Enter billing month for rent generation (YYYY-MM):", currentMonth);
    if (!targetMonth) return;

    let created = 0;
    let skipped = 0;

    for (const t of activeTenants) {
      const exists = billing.find((b) => b.tenantId === t.id && b.billingMonth === targetMonth);
      if (exists) {
        skipped++;
        continue;
      }

      const prev = getLatestReading(t.id);
      const newBill: BillingRecord = {
        id: `bill-${Date.now()}-${t.id}`,
        propertyId: selectedPropertyId,
        tenantId: t.id,
        tenantName: t.name,
        roomId: t.roomId,
        billingMonth: targetMonth,
        rentAmount: t.rentAmount,
        rentStatus: "unpaid",
        rentPaidDate: null,
        electricityPrevReading: prev,
        electricityCurrReading: prev,
        electricityUnits: 0,
        electricityRatePerUnit: 10,
        electricityAmount: 0,
        electricityStatus: "unpaid",
        electricityPaidDate: null,
        totalAmount: t.rentAmount,
        paidAmount: 0,
        createdAt: new Date().toISOString()
      };
      await onAddBilling(newBill);
      created++;
    }

    alert(`Auto-generated rent bills for ${created} tenants (${skipped} already had a bill for ${targetMonth}).`);
  };

  // Autofill previous reading if possible
  const handleTenantSelect = (tenantId: string) => {
    setCalcTenantId(tenantId);
    
    // Find last bill for this tenant to get current reading as the new previous reading
    const tenantBills = billing.filter((b) => b.tenantId === tenantId);
    if (tenantBills.length > 0) {
      // Sort by date descending
      const sorted = [...tenantBills].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setCalcPrevReading(sorted[0].electricityCurrReading);
      setCalcCurrReading(sorted[0].electricityCurrReading); // reset curr reading to prev
    } else {
      setCalcPrevReading(0);
      setCalcCurrReading(0);
    }
  };

  // Generate Bill action
  const handleGenerateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calcTenantId || calcCurrReading < calcPrevReading) {
      alert("Please ensure current reading is greater than or equal to previous reading!");
      return;
    }

    const tenant = tenants.find((t) => t.id === calcTenantId);
    if (!tenant) return;

    // Check if a bill already exists for this tenant for this month
    const existingBillIndex = billing.findIndex(
      (b) => b.tenantId === calcTenantId && b.billingMonth === calcMonth
    );

    const units = calcCurrReading - calcPrevReading;
    const elecAmount = units * calcRate;

    if (existingBillIndex !== -1) {
      // We will ask the user to overwrite or we can update it
      const existing = billing[existingBillIndex];
      if (existing.electricityAmount > 0) {
        if (!window.confirm("An electricity bill already exists for this month. Do you want to update it?")) {
          return;
        }
      }
      
      // Update existing record
      const updatedBill: BillingRecord = {
        ...existing,
        electricityPrevReading: calcPrevReading,
        electricityCurrReading: calcCurrReading,
        electricityUnits: units,
        electricityRatePerUnit: calcRate,
        electricityAmount: elecAmount,
        totalAmount: existing.rentAmount + elecAmount,
        // if rent was paid but electricity unpaid, adjust paidAmount
        paidAmount: existing.rentStatus === "paid" ? existing.rentAmount : 0
      };
      
      await onAddBilling(updatedBill); // writing to same ID will overwrite doc
    } else {
      // Create new bill
      const newBill: BillingRecord = {
        id: "bill-" + Date.now(),
        propertyId: selectedPropertyId,
        tenantId: tenant.id,
        tenantName: tenant.name,
        roomId: tenant.roomId,
        billingMonth: calcMonth,
        rentAmount: tenant.rentAmount,
        rentStatus: "unpaid",
        rentPaidDate: null,
        electricityPrevReading: calcPrevReading,
        electricityCurrReading: calcCurrReading,
        electricityUnits: units,
        electricityRatePerUnit: calcRate,
        electricityAmount: elecAmount,
        electricityStatus: "unpaid",
        electricityPaidDate: null,
        totalAmount: tenant.rentAmount + elecAmount,
        paidAmount: 0,
        createdAt: new Date().toISOString()
      };

      await onAddBilling(newBill);
    }

    setShowCalcModal(false);
    setCalcTenantId("");
    alert("Invoice generated successfully!");
  };

  // Submit payment
  const handlePaymentSubmit = async () => {
    if (!showPaymentModal) return;
    
    const bill = showPaymentModal;
    let payAmount = 0;
    
    if (paymentType === "rent") {
      payAmount = bill.rentAmount;
    } else if (paymentType === "electricity") {
      payAmount = bill.electricityAmount;
    } else {
      // both
      payAmount = (bill.rentStatus === "unpaid" ? bill.rentAmount : 0) + 
                  (bill.electricityStatus === "unpaid" ? bill.electricityAmount : 0);
    }

    await onUpdateBillPayment(bill.id, paymentType, payAmount, paymentDate);
    setShowPaymentModal(null);
    alert("Payment logged successfully!");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = async (bill: BillingRecord) => {
    const tenant = tenants.find(t => t.id === bill.tenantId);
    if (!tenant) return;
    
    // In a real scenario, this would check if the bill is paid/unpaid and send appropriate template
    const success = await whatsappService.sendMessage({
      to: tenant.phone,
      type: bill.rentStatus === "paid" && bill.electricityStatus === "paid" ? "receipt" : "rent_reminder",
      parameters: {
        tenantName: tenant.name,
        month: bill.billingMonth,
        amount: bill.totalAmount - bill.paidAmount,
      }
    });

    if (success) {
      alert("WhatsApp message sent successfully!");
    } else {
      alert("Failed to send WhatsApp message. See console for details.");
    }
  };

  const handleExportBilling = () => {
    const headers = [
      "Bill ID",
      "Month",
      "Tenant Name",
      "Room",
      "Rent Amount (Rs)",
      "Rent Status",
      "Rent Paid Date",
      "Elec Prev Reading",
      "Elec Curr Reading",
      "Elec Units",
      "Elec Rate",
      "Elec Amount (Rs)",
      "Elec Status",
      "Total Amount (Rs)",
      "Paid Amount (Rs)",
      "Balance Due (Rs)",
      "Created At"
    ];

    const rows = billing.map((b) => [
      b.id,
      b.billingMonth,
      b.tenantName,
      `Room ${getRoomNumber(b.roomId)}`,
      b.rentAmount,
      b.rentStatus,
      b.rentPaidDate || "N/A",
      b.electricityPrevReading,
      b.electricityCurrReading,
      b.electricityUnits,
      b.electricityRatePerUnit,
      b.electricityAmount,
      b.electricityStatus || "N/A",
      b.totalAmount,
      b.paidAmount,
      b.totalAmount - b.paidAmount,
      b.createdAt
    ]);

    exportToCSV(`Billing_Ledger_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const getRoomNumber = (rId: string) => {
    if (rooms) {
      const r = rooms.find((room) => room.id === rId);
      if (r) return r.roomNumber;
    }
    return rId.split('_')[1] || rId;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Rent & Utilities Ledger
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Generate monthly electricity bills, record rent payments and issue receipts.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 w-full xl:w-auto [&>button]:whitespace-nowrap">
          <button
            onClick={handleExportBilling}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all border border-slate-200"
            title="Download Excel / CSV"
          >
            <Download className="w-4 h-4 text-slate-600" />
            Export CSV
          </button>
          <button
            onClick={handleBatchGenerateRent}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all border border-slate-200"
          >
            <Receipt className="w-4 h-4 text-slate-600" />
            Auto Rent
          </button>
          <button
            onClick={openBulkModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold transition-all"
          >
            <Zap className="w-4 h-4 text-amber-600" />
            Bulk Electricity
          </button>
          <button
            onClick={() => setShowCalcModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
          >
            <Calculator className="w-4 h-4" />
            Single Bill
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col xl:flex-row gap-3 justify-between items-stretch xl:items-center bg-white p-3.5 border border-slate-200 shadow-sm rounded-2xl">
        <div className="relative w-full xl:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tenant or room..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto justify-between xl:justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 shrink-0">
            <span className="font-semibold text-slate-500 text-[11px] whitespace-nowrap">Month:</span>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="p-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-indigo-500 font-semibold"
            >
              <option value="all">All Months</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-1 flex shrink-0">
            {(["all", "unpaid", "paid"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterPaymentStatus(status)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all ${
                  filterPaymentStatus === status
                    ? "bg-white text-indigo-700 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {status === "unpaid" ? "Pending" : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      {billing.length === 0 ? (
        <div className="bg-white border border-slate-200 shadow-sm p-12 text-center text-slate-500 rounded-2xl">
          No billing records available. Generate a utility bill to start.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm border border-slate-200/60 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4">Tenant Name</th>
                  <th className="p-4">Room</th>
                  <th className="p-4">Month</th>
                  <th className="p-4">Rent Status</th>
                  <th className="p-4">Electricity (Units)</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Payment Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredBilling.map((bill) => {
                  const balance = bill.totalAmount - bill.paidAmount;
                  const isPaid = balance === 0;

                  return (
                    <tr key={bill.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-indigo-600 border border-slate-200">
                          <User className="w-4 h-4" />
                        </div>
                        {bill.tenantName}
                      </td>
                      <td className="p-4 text-slate-355 font-semibold">Room {getRoomNumber(bill.roomId)}</td>
                      <td className="p-4 text-slate-500 font-medium">
                        {new Date(bill.billingMonth + "-02").toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric"
                        })}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          bill.rentStatus === "paid"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : "bg-rose-50 text-rose-600 border-rose-200"
                        }`}>
                          ₹{bill.rentAmount} ({bill.rentStatus})
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">
                        {bill.electricityAmount > 0 ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            bill.electricityStatus === "paid"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : "bg-rose-50 text-rose-600 border-rose-200"
                          }`}>
                            ₹{bill.electricityAmount} ({bill.electricityUnits} Units)
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px] font-semibold italic">Not calculated</span>
                        )}
                      </td>
                      <td className="p-4 font-extrabold text-slate-900">₹{bill.totalAmount}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          isPaid
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : bill.paidAmount > 0
                            ? "bg-amber-50 text-amber-600 border-amber-200"
                            : "bg-rose-50 text-rose-600 border-rose-200"
                        }`}>
                          {isPaid ? "Fully Paid" : bill.paidAmount > 0 ? "Partially Paid" : "Unpaid"}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-1.5">
                        <button
                          onClick={() => setSelectedInvoice(bill)}
                          title="Print/View Invoice"
                          className="p-2 bg-slate-100 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        {!isPaid && (
                          <button
                            onClick={() => {
                              setShowPaymentModal(bill);
                              // default payment type
                              if (bill.rentStatus === "unpaid" && bill.electricityStatus === "unpaid") {
                                setPaymentType("both");
                              } else if (bill.rentStatus === "unpaid") {
                                setPaymentType("rent");
                              } else {
                                setPaymentType("electricity");
                              }
                            }}
                            title="Log Bill Payment"
                            className="p-2 bg-emerald-500/15 hover:bg-emerald-600 border border-emerald-500/30 hover:border-emerald-700 rounded-lg text-emerald-600 hover:text-white transition-all animate-pulse"
                          >
                            <IndianRupee className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk Electricity Entry Sheet Modal */}
      {showBulkModal && (
        <ModalOverlay tone="bg-slate-900/50" onClose={() => setShowBulkModal(false)}>
          <div className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-fade-in relative shadow-2xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
              <div>
                <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Bulk Electricity Meter Entry Sheet
                </h4>
                <p className="text-slate-500 text-xs mt-0.5">
                  Enter current readings for all rooms simultaneously to auto-calculate bill surcharges.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-bold text-slate-600">Month:</label>
                  <input
                    type="month"
                    value={bulkMonth}
                    onChange={(e) => setBulkMonth(e.target.value)}
                    className="p-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-bold text-slate-600">Rate/Unit:</label>
                  <input
                    type="number"
                    min="1"
                    value={bulkRate}
                    onChange={(e) => setBulkRate(Number(e.target.value))}
                    className="w-16 p-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Entry Table */}
            <div className="flex-1 overflow-y-auto my-4 border border-slate-200 rounded-xl">
              {activeTenants.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No active residents found in this property.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider sticky top-0 z-10">
                    <tr>
                      <th className="p-3">Room</th>
                      <th className="p-3">Resident</th>
                      <th className="p-3 text-right">Prev Reading</th>
                      <th className="p-3">Current Reading</th>
                      <th className="p-3 text-right">Units</th>
                      <th className="p-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeTenants.map((t) => {
                      const prev = getLatestReading(t.id);
                      const curr = readings[t.id] ?? prev;
                      const units = Math.max(0, curr - prev);
                      const amount = units * bulkRate;
                      const isInvalid = curr < prev;

                      return (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold text-slate-900">
                            Room {getRoomNumber(t.roomId)}
                          </td>
                          <td className="p-3 text-slate-700">
                            {t.name}
                          </td>
                          <td className="p-3 text-right text-slate-500 font-mono">
                            {prev}
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              min={prev}
                              value={curr}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setReadings((prevMap) => ({ ...prevMap, [t.id]: val }));
                              }}
                              className={`w-28 p-1.5 text-xs font-mono rounded-lg border ${
                                isInvalid
                                  ? "border-rose-400 bg-rose-50 text-rose-700"
                                  : "border-slate-200 bg-white text-slate-900 focus:border-indigo-500"
                              } focus:outline-none`}
                            />
                            {isInvalid && (
                              <span className="block text-[10px] text-rose-500 font-medium">Must be &ge; {prev}</span>
                            )}
                          </td>
                          <td className="p-3 text-right font-bold text-slate-700 font-mono">
                            {units}
                          </td>
                          <td className="p-3 text-right font-bold text-indigo-600 font-mono">
                            ₹{amount.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <span className="text-xs text-slate-500">
                Total Residents: <strong className="text-slate-800">{activeTenants.length}</strong>
              </span>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingBulk || activeTenants.length === 0}
                  onClick={handleSaveBulkElectricity}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {savingBulk ? "Saving Readings..." : "Save All & Update Bills"}
                </button>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Electricity Bill Generator Modal */}
      {showCalcModal && (
        <ModalOverlay tone="bg-slate-900/50" onClose={() => setShowCalcModal(false)}>
          <form 
            onSubmit={handleGenerateBill}
            className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md animate-fade-in relative space-y-5 shadow-xl"
          >
            <div>
              <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-600" />
                Electricity Bill Surcharge
              </h4>
              <p className="text-slate-500 text-xs mt-1">Select tenant and input meter reading usage.</p>
            </div>

            <div className="space-y-4">
              {/* Tenant selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Select Resident</label>
                <select
                  required
                  value={calcTenantId}
                  onChange={(e) => handleTenantSelect(e.target.value)}
                  className="w-full p-2.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                >
                  <option value="">-- Choose Tenant --</option>
                  {activeTenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Room {getRoomNumber(t.roomId)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Month */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Billing Month</label>
                <input
                  type="month"
                  required
                  value={calcMonth}
                  onChange={(e) => setCalcMonth(e.target.value)}
                  className="w-full p-2.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              {/* Meter readings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Previous Reading</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={calcPrevReading}
                    onChange={(e) => setCalcPrevReading(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Current Reading</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={calcCurrReading}
                    onChange={(e) => setCalcCurrReading(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Rate */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Rate per Unit (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={calcRate}
                  onChange={(e) => setCalcRate(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              {/* Realtime calculations preview */}
              {calcCurrReading >= calcPrevReading && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span>Units Consumed:</span>
                    <span className="text-slate-900 font-bold">{calcCurrReading - calcPrevReading} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Electricity Cost:</span>
                    <span className="text-emerald-600 font-extrabold">₹{(calcCurrReading - calcPrevReading) * calcRate}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Form actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCalcModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
              >
                Generate Bill
              </button>
            </div>
          </form>
        </ModalOverlay>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <ModalOverlay tone="bg-slate-900/50" onClose={() => setShowPaymentModal(null)}>
          <div className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md animate-fade-in relative space-y-5 shadow-xl">
            <div>
              <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-emerald-600" />
                Log Rent / Utility Payment
              </h4>
              <p className="text-slate-500 text-xs mt-1">Select payment portion and finalize payment receipt.</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Resident:</span>
                  <span className="text-slate-900 font-bold">{showPaymentModal.tenantName}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Billing Month:</span>
                  <span className="text-slate-900 font-bold">{showPaymentModal.billingMonth}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Rent Dues:</span>
                  <span className={`font-bold ${showPaymentModal.rentStatus === "paid" ? "text-emerald-600" : "text-rose-600"}`}>
                    ₹{showPaymentModal.rentAmount} ({showPaymentModal.rentStatus})
                  </span>
                </div>
                {showPaymentModal.electricityAmount > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Electricity Dues:</span>
                    <span className={`font-bold ${showPaymentModal.electricityStatus === "paid" ? "text-emerald-600" : "text-rose-600"}`}>
                      ₹{showPaymentModal.electricityAmount} ({showPaymentModal.electricityStatus})
                    </span>
                  </div>
                )}
              </div>

              {/* Payment Type selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Payment Portion</label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                >
                  {showPaymentModal.rentStatus === "unpaid" && showPaymentModal.electricityStatus === "unpaid" && (
                    <option value="both">Pay Both (₹{showPaymentModal.rentAmount + showPaymentModal.electricityAmount})</option>
                  )}
                  {showPaymentModal.rentStatus === "unpaid" && (
                    <option value="rent">Pay Rent Only (₹{showPaymentModal.rentAmount})</option>
                  )}
                  {showPaymentModal.electricityAmount > 0 && showPaymentModal.electricityStatus === "unpaid" && (
                    <option value="electricity">Pay Electricity Only (₹{showPaymentModal.electricityAmount})</option>
                  )}
                </select>
              </div>

              {/* Payment Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Payment Date</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Form actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPaymentModal(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePaymentSubmit}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Printable Invoice Receipt View Modal */}
      {selectedInvoice && (
        <ModalOverlay tone="bg-slate-900/60" onClose={() => setSelectedInvoice(null)} dismissOnBackdrop>
          <div className="bg-white text-slate-900 p-8 rounded-2xl w-full max-w-lg animate-fade-in relative space-y-6 shadow-xl print:p-0 print:border-none print:shadow-none print:w-full max-h-[90vh] overflow-y-auto">
            {/* Close button on screen, hidden in printing */}
            <button 
              onClick={() => setSelectedInvoice(null)}
              aria-label="Close receipt"
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-sm font-bold print:hidden"
            >
              ✕
            </button>

            {/* Invoice Design */}
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start gap-4 border-b pb-4 pt-4 print:pt-0">
                <div>
                  <h3 className="font-extrabold text-xl tracking-tight text-indigo-900">STUDY POINT GROUP</h3>
                  <p className="text-[10px] text-slate-500">Premium PG Accommodations & Residences</p>
                </div>
                <div className="text-right">
                  <h4 className="font-bold text-sm text-slate-700">INVOICE RECEIPT</h4>
                  <p className="text-[10px] text-slate-500">ID: {selectedInvoice.id}</p>
                </div>
              </div>

              {/* Meta information */}
              <div className="grid grid-cols-2 gap-4 text-[11px] text-slate-650 bg-slate-50 p-4 rounded-xl">
                <div>
                  <p className="font-bold text-slate-500 uppercase tracking-wide">Billed To:</p>
                  <p className="font-extrabold text-slate-800 text-sm mt-0.5">{selectedInvoice.tenantName}</p>
                  <p className="mt-0.5">Assigned Room: Room {getRoomNumber(selectedInvoice.roomId)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-500 uppercase tracking-wide">Bill Details:</p>
                  <p className="mt-0.5">Billing Month: {new Date(selectedInvoice.billingMonth + "-02").toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
                  <p className="mt-0.5">Invoice Date: {new Date(selectedInvoice.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Charge Details</h5>
                <div className="border rounded-xl overflow-hidden text-[11px]">
                  <div className="grid grid-cols-3 bg-slate-100 font-bold p-3 border-b text-slate-700">
                    <span>Description</span>
                    <span className="text-center">Rate / Details</span>
                    <span className="text-right">Amount (₹)</span>
                  </div>
                  <div className="divide-y">
                    <div className="grid grid-cols-3 p-3 text-slate-600">
                      <span>Room Rent Charges</span>
                      <span className="text-center text-slate-500">Monthly</span>
                      <span className="text-right font-semibold text-slate-800">₹{selectedInvoice.rentAmount}</span>
                    </div>
                    {selectedInvoice.electricityAmount > 0 && (
                      <div className="grid grid-cols-3 p-3 text-slate-600">
                        <span>Electricity Surcharge</span>
                        <span className="text-center text-slate-500">
                          {selectedInvoice.electricityUnits} units @ ₹{selectedInvoice.electricityRatePerUnit}
                        </span>
                        <span className="text-right font-semibold text-slate-800">₹{selectedInvoice.electricityAmount}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Summary and totals */}
              <div className="flex justify-between items-start pt-2 border-t text-xs">
                <div>
                  <p className="font-bold text-[10px] text-slate-600 uppercase">Payment Summary</p>
                  <p className="text-slate-600 mt-1">
                    Rent Status: <span className="font-bold text-slate-800 uppercase">{selectedInvoice.rentStatus}</span>
                  </p>
                  <p className="text-slate-600">
                    Electricity Status: <span className="font-bold text-slate-800 uppercase">{selectedInvoice.electricityStatus || "N/A"}</span>
                  </p>
                </div>
                <div className="text-right space-y-1.5 w-48">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Amount:</span>
                    <span className="font-bold">₹{selectedInvoice.totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-slate-650">
                    <span>Amount Paid:</span>
                    <span className="font-bold text-emerald-650">₹{selectedInvoice.paidAmount}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-sm border-t pt-1.5 text-indigo-900 bg-indigo-50/50 p-1.5 rounded">
                    <span>Balance Due:</span>
                    <span>₹{selectedInvoice.totalAmount - selectedInvoice.paidAmount}</span>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="text-center text-[9px] text-slate-600 border-t pt-4">
                Thank you for staying at Study Point Group. For billing queries, please contact PG management desk.
              </div>
            </div>

            {/* Print trigger on screen */}
            <div className="flex gap-2 print:hidden flex-wrap sm:flex-nowrap">
              <button
                onClick={handlePrint}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/25"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print Invoice</span>
              </button>
              <button
                onClick={() => handleSendWhatsApp(selectedInvoice)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/25"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Send via WhatsApp</span>
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
              >
                Close View
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
