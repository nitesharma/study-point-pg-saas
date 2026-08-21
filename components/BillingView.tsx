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
  MessageCircle
} from "lucide-react";
import { BillingRecord, Tenant } from "../lib/db";
import { whatsappService } from "../lib/whatsapp";

interface BillingViewProps {
  billing: BillingRecord[];
  tenants: Tenant[];
  onAddBilling: (billing: BillingRecord) => Promise<void>;
  onUpdateBillPayment: (billId: string, type: "rent" | "electricity" | "both", paidAmount: number, date: string) => Promise<void>;
  selectedPropertyId: string;
}

export default function BillingView({ billing, tenants, onAddBilling, onUpdateBillPayment, selectedPropertyId }: BillingViewProps) {
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState<BillingRecord | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<BillingRecord | null>(null);

  // Electricity Calculator states
  const [calcTenantId, setCalcTenantId] = useState("");
  const [calcMonth, setCalcMonth] = useState("2026-07");
  const [calcPrevReading, setCalcPrevReading] = useState(0);
  const [calcCurrReading, setCalcCurrReading] = useState(0);
  const [calcRate, setCalcRate] = useState(10); // ₹10 per unit

  // Payment states
  const [paymentType, setPaymentType] = useState<"rent" | "electricity" | "both">("both");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);

  // Active tenants only for billing
  const activeTenants = tenants.filter((t) => t.status === "active");

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

  const getRoomNumber = (rId: string) => {
    return rId.split('_')[1] || rId;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Rent & Utilities Ledger
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Generate monthly electricity bills, record rent payments and issue receipts.
          </p>
        </div>
        <button
          onClick={() => setShowCalcModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
        >
          <Calculator className="w-4 h-4" />
          Generate Utility Bill
        </button>
      </div>

      {/* Ledger Table */}
      {billing.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 rounded-2xl">
          No billing records available. Generate a utility bill to start.
        </div>
      ) : (
        <div className="glass-card-no-hover border border-slate-800/60 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/40 text-slate-450 text-xs font-bold uppercase tracking-wider">
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
              <tbody className="divide-y divide-slate-800/50 text-xs">
                {billing.map((bill) => {
                  const balance = bill.totalAmount - bill.paidAmount;
                  const isPaid = balance === 0;

                  return (
                    <tr key={bill.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="p-4 font-bold text-white flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-indigo-400 border border-slate-700/50">
                          <User className="w-4 h-4" />
                        </div>
                        {bill.tenantName}
                      </td>
                      <td className="p-4 text-slate-355 font-semibold">Room {getRoomNumber(bill.roomId)}</td>
                      <td className="p-4 text-slate-400 font-medium">
                        {new Date(bill.billingMonth + "-02").toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric"
                        })}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          bill.rentStatus === "paid"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-450 border-rose-500/20"
                        }`}>
                          ₹{bill.rentAmount} ({bill.rentStatus})
                        </span>
                      </td>
                      <td className="p-4 text-slate-350">
                        {bill.electricityAmount > 0 ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            bill.electricityStatus === "paid"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-450 border-rose-500/20"
                          }`}>
                            ₹{bill.electricityAmount} ({bill.electricityUnits} Units)
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px] font-semibold italic">Not calculated</span>
                        )}
                      </td>
                      <td className="p-4 font-extrabold text-white">₹{bill.totalAmount}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          isPaid
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : bill.paidAmount > 0
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-rose-500/10 text-rose-450 border-rose-500/20"
                        }`}>
                          {isPaid ? "Fully Paid" : bill.paidAmount > 0 ? "Partially Paid" : "Unpaid"}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-1.5">
                        <button
                          onClick={() => setSelectedInvoice(bill)}
                          title="Print/View Invoice"
                          className="p-2 bg-slate-850 hover:bg-slate-850 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
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
                            className="p-2 bg-emerald-500/15 hover:bg-emerald-600 border border-emerald-500/30 hover:border-emerald-700 rounded-lg text-emerald-400 hover:text-white transition-all animate-pulse"
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

      {/* Electricity Bill Generator Modal */}
      {showCalcModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleGenerateBill}
            className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md animate-fade-in relative space-y-5 shadow-2xl"
          >
            <div>
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-400" />
                Electricity Bill Surcharge
              </h4>
              <p className="text-slate-500 text-xs mt-1">Select tenant and input meter reading usage.</p>
            </div>

            <div className="space-y-4">
              {/* Tenant selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Select Resident</label>
                <select
                  required
                  value={calcTenantId}
                  onChange={(e) => handleTenantSelect(e.target.value)}
                  className="w-full p-2.5 rounded-xl text-xs glass-input"
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
                <label className="text-xs font-bold text-slate-400">Billing Month</label>
                <input
                  type="month"
                  required
                  value={calcMonth}
                  onChange={(e) => setCalcMonth(e.target.value)}
                  className="w-full p-2.5 rounded-xl text-xs glass-input"
                />
              </div>

              {/* Meter readings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Previous Reading</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={calcPrevReading}
                    onChange={(e) => setCalcPrevReading(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl text-xs glass-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Current Reading</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={calcCurrReading}
                    onChange={(e) => setCalcCurrReading(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl text-xs glass-input"
                  />
                </div>
              </div>

              {/* Rate */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Rate per Unit (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={calcRate}
                  onChange={(e) => setCalcRate(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl text-xs glass-input"
                />
              </div>

              {/* Realtime calculations preview */}
              {calcCurrReading >= calcPrevReading && (
                <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1.5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Units Consumed:</span>
                    <span className="text-white font-bold">{calcCurrReading - calcPrevReading} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Electricity Cost:</span>
                    <span className="text-emerald-400 font-extrabold">₹{(calcCurrReading - calcPrevReading) * calcRate}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Form actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCalcModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded-xl text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20"
              >
                Generate Bill
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md animate-fade-in relative space-y-5 shadow-2xl">
            <div>
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-emerald-400" />
                Log Rent / Utility Payment
              </h4>
              <p className="text-slate-500 text-xs mt-1">Select payment portion and finalize payment receipt.</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-955 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Resident:</span>
                  <span className="text-white font-bold">{showPaymentModal.tenantName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Billing Month:</span>
                  <span className="text-white font-bold">{showPaymentModal.billingMonth}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Rent Dues:</span>
                  <span className={`font-bold ${showPaymentModal.rentStatus === "paid" ? "text-emerald-400" : "text-rose-400"}`}>
                    ₹{showPaymentModal.rentAmount} ({showPaymentModal.rentStatus})
                  </span>
                </div>
                {showPaymentModal.electricityAmount > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Electricity Dues:</span>
                    <span className={`font-bold ${showPaymentModal.electricityStatus === "paid" ? "text-emerald-400" : "text-rose-450"}`}>
                      ₹{showPaymentModal.electricityAmount} ({showPaymentModal.electricityStatus})
                    </span>
                  </div>
                )}
              </div>

              {/* Payment Type selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Payment Portion</label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl text-xs glass-input"
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
                <label className="text-xs font-bold text-slate-400">Payment Date</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl text-xs glass-input"
                />
              </div>
            </div>

            {/* Form actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPaymentModal(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded-xl text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePaymentSubmit}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-emerald-600/20"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Invoice Receipt View Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 p-8 rounded-2xl w-full max-w-lg animate-fade-in relative space-y-6 shadow-2xl print:p-0 print:border-none print:shadow-none print:w-full max-h-[90vh] overflow-y-auto">
            {/* Close button on screen, hidden in printing */}
            <button 
              onClick={() => setSelectedInvoice(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 text-sm font-bold print:hidden"
            >
              ✕ Close
            </button>

            {/* Invoice Design */}
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h3 className="font-extrabold text-xl tracking-tight text-indigo-900">SERENITY STAYZ</h3>
                  <p className="text-[10px] text-slate-500">Premium PG Accommodations & Residences</p>
                </div>
                <div className="text-right">
                  <h4 className="font-bold text-sm text-slate-700">INVOICE RECEIPT</h4>
                  <p className="text-[10px] text-slate-400">ID: {selectedInvoice.id}</p>
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
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Charge Details</h5>
                <div className="border rounded-xl overflow-hidden text-[11px]">
                  <div className="grid grid-cols-3 bg-slate-100 font-bold p-3 border-b text-slate-700">
                    <span>Description</span>
                    <span className="text-center">Rate / Details</span>
                    <span className="text-right">Amount (₹)</span>
                  </div>
                  <div className="divide-y">
                    <div className="grid grid-cols-3 p-3 text-slate-600">
                      <span>Room Rent Charges</span>
                      <span className="text-center text-slate-400">Monthly</span>
                      <span className="text-right font-semibold text-slate-800">₹{selectedInvoice.rentAmount}</span>
                    </div>
                    {selectedInvoice.electricityAmount > 0 && (
                      <div className="grid grid-cols-3 p-3 text-slate-600">
                        <span>Electricity Surcharge</span>
                        <span className="text-center text-slate-400">
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
                  <p className="font-bold text-[10px] text-slate-450 uppercase">Payment Summary</p>
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
              <div className="text-center text-[9px] text-slate-450 border-t pt-4">
                Thank you for staying at Serenity Stayz. For billing queries, please contact PG management desk.
              </div>
            </div>

            {/* Print trigger on screen */}
            <div className="flex gap-2 print:hidden flex-wrap sm:flex-nowrap">
              <button
                onClick={handlePrint}
                className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/25"
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
        </div>
      )}
    </div>
  );
}
