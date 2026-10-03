"use client";

import React, { useState } from "react";
import { Fine, Tenant } from "../lib/db";
import { 
  AlertOctagon, 
  Plus, 
  IndianRupee, 
  Calendar,
  CheckCircle,
  MessageCircle,
  Clock
} from "lucide-react";
import { whatsappService } from "../lib/whatsapp";

import ModalOverlay from "./ui/ModalOverlay";
interface FinesViewProps {
  fines: Fine[];
  tenants: Tenant[];
  onAddFine: (fine: Fine) => Promise<void>;
  onUpdateFineStatus: (fineId: string, status: "paid" | "unpaid") => Promise<void>;
  selectedPropertyId: string;
}

export default function FinesView({
  fines,
  tenants,
  onAddFine,
  onUpdateFineStatus,
  selectedPropertyId
}: FinesViewProps) {
  const [showModal, setShowModal] = useState(false);
  
  // Form state
  const [tenantId, setTenantId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Sending State
  const [sendingId, setSendingId] = useState<string | null>(null);

  const totalUnpaid = fines.filter(f => f.status === "unpaid").reduce((sum, f) => sum + f.amount, 0);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !amount || !reason || !date) return;

    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    const newFine: Fine = {
      id: `fine-${Date.now()}`,
      propertyId: selectedPropertyId,
      tenantId,
      tenantName: tenant.name,
      amount: Number(amount),
      reason,
      date,
      status: "unpaid"
    };

    await onAddFine(newFine);
    setShowModal(false);
    
    // Reset
    setTenantId("");
    setAmount("");
    setReason("");
    setDate(new Date().toISOString().split("T")[0]);
  };

  const handleSendReminder = async (fine: Fine) => {
    const tenant = tenants.find(t => t.id === fine.tenantId);
    if (!tenant) return;

    setSendingId(fine.id);
    try {
      const success = await whatsappService.sendFineReminder(tenant.phone, {
        tenantName: tenant.name,
        amount: fine.amount,
        reason: fine.reason,
        date: fine.date
      });
      if (success) {
        alert("Reminder sent successfully via WhatsApp!");
      } else {
        alert("Failed to send reminder. Check server logs.");
      }
    } catch (error) {
      console.error(error);
      alert("Error sending reminder.");
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Fines & Charges
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Manage tenant penalties, late fees, and property damage charges.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm px-5 py-3 rounded-xl border border-rose-200 bg-rose-500/5">
            <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-0.5 whitespace-nowrap">Total Outstanding</p>
            <p className="text-xl font-extrabold text-slate-900">₹{totalUnpaid.toLocaleString()}</p>
          </div>
          
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-rose-600/20 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Issue Fine
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Tenant</th>
                <th className="px-6 py-4 font-semibold">Reason</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {fines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    <AlertOctagon className="w-8 h-8 mx-auto mb-3 text-slate-600" />
                    No fines issued yet.
                  </td>
                </tr>
              ) : (
                fines.map(fine => (
                  <tr key={fine.id} className="hover:bg-slate-100/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{fine.tenantName}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{fine.reason}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-rose-600">₹{fine.amount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(fine.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {fine.status === "paid" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded border bg-emerald-50 text-emerald-600 border-emerald-200 uppercase tracking-wider">
                          <CheckCircle className="w-3 h-3" /> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded border bg-amber-50 text-amber-600 border-amber-200 uppercase tracking-wider">
                          <Clock className="w-3 h-3" /> Unpaid
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {fine.status === "unpaid" ? (
                          <>
                            <button
                              onClick={() => handleSendReminder(fine)}
                              disabled={sendingId === fine.id}
                              className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                              title="Send WhatsApp Reminder"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onUpdateFineStatus(fine.id, "paid")}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
                            >
                              Mark Paid
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => onUpdateFineStatus(fine.id, "unpaid")}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                          >
                            Mark Unpaid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <ModalOverlay tone="bg-slate-900/50" onClose={() => setShowModal(false)}>
          <form 
            onSubmit={handleAdd}
            className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md animate-fade-in relative shadow-xl"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 text-rose-600" />
                  Issue Fine
                </h3>
                <p className="text-slate-500 text-xs mt-1">Record a penalty for a tenant.</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Select Tenant *</label>
                <select
                  required
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                >
                  <option value="">-- Choose Tenant --</option>
                  {tenants.filter(t => t.status === "active").map(t => (
                    <option key={t.id} value={t.id}>{t.name} (Room {t.roomId.split('_')[1]})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Reason / Description *</label>
                <input
                  required
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Late fee, Property Damage, Noise Violation"
                  className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Amount (₹) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Date Issued *</label>
                  <input
                    required
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6 mt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all ml-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-rose-600/20"
              >
                Issue Fine
              </button>
            </div>
          </form>
        </ModalOverlay>
      )}
    </div>
  );
}
