"use client";

import React, { useState } from "react";
import { 
  ShieldAlert, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  Users, 
  Clipboard, 
  FileText,
  Key
} from "lucide-react";
import { SecurityLog, Tenant } from "../lib/db";

import ModalOverlay from "./ui/ModalOverlay";
interface SecurityViewProps {
  logs: SecurityLog[];
  tenants: Tenant[];
  onAddLog: (log: SecurityLog) => Promise<void>;
  onUpdateLogStatus: (logId: string, status: "approved" | "resolved") => Promise<void>;
  selectedPropertyId: string;
}

export default function SecurityView({ logs, tenants, onAddLog, onUpdateLogStatus, selectedPropertyId }: SecurityViewProps) {
  const [activeTab, setActiveTab] = useState<"all" | "visitor" | "gate_pass" | "complaint">("all");
  const [showAddLogModal, setShowAddLogModal] = useState<"visitor" | "gate_pass" | "complaint" | null>(null);
  
  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Form Fields
  const [tenantId, setTenantId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");

  const activeTenants = tenants.filter((t) => t.status === "active");

  // Log submit
  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddLogModal) return;

    const tenant = tenants.find((t) => t.id === tenantId);
    
    let logTitle = title;
    let logDesc = description;
    let initialStatus: SecurityLog["status"] = "pending";

    if (showAddLogModal === "visitor") {
      logTitle = `Visitor: ${title}`;
      logDesc = `Phone: ${visitorPhone}. Purpose: ${description}`;
      initialStatus = "approved"; // visitors are checked-in / approved instantly
    } else if (showAddLogModal === "gate_pass") {
      logTitle = `Late Pass: ${title}`;
      initialStatus = "approved"; // auto-approve gate pass for mock/sim simplicity
    } else {
      // complaint
      logTitle = `Issue: ${title}`;
      initialStatus = "pending";
    }

    const newLog: SecurityLog = {
      id: "log-" + Date.now(),
      propertyId: selectedPropertyId,
      type: showAddLogModal,
      tenantId: tenant ? tenant.id : null,
      tenantName: tenant ? tenant.name : null,
      title: logTitle,
      description: logDesc,
      status: initialStatus,
      createdAt: new Date().toISOString()
    };

    await onAddLog(newLog);
    
    // reset form
    setTenantId("");
    setTitle("");
    setDescription("");
    setVisitorPhone("");
    setShowAddLogModal(null);
    alert("Security log entered successfully!");
  };

  // Resolve Ticket
  const handleResolve = async (logId: string, type: "visitor" | "gate_pass" | "complaint") => {
    const status = type === "complaint" ? "resolved" : "approved";
    await onUpdateLogStatus(logId, status);
    alert(`${type === "complaint" ? "Ticket resolved" : "Gate pass approved"} successfully!`);
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesTab = activeTab === "all" || log.type === activeTab;
    const matchesSearch = 
      log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.tenantName && log.tenantName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesTab && matchesSearch;
  });

  const getRoomNumber = (rId: string | undefined | null) => {
    if (!rId) return "N/A";
    return rId.split('_')[1] || rId;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Security & Complaints Desk
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Track visitors, issue gate passes, and resolve maintenance tickets.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 [&>button]:whitespace-nowrap">
          <button
            onClick={() => setShowAddLogModal("visitor")}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 rounded-xl text-xs font-semibold transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Visitor Log
          </button>
          <button
            onClick={() => setShowAddLogModal("gate_pass")}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-indigo-600 border border-slate-200 rounded-xl text-xs font-semibold transition-all"
          >
            <Key className="w-3.5 h-3.5" />
            Gate Pass
          </button>
          <button
            onClick={() => setShowAddLogModal("complaint")}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-600/25"
          >
            <Plus className="w-3.5 h-3.5" />
            Lodge Complaint
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50 p-4 border border-slate-200/60 rounded-2xl">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-1 flex">
          {[
            { id: "all", label: "All Logs" },
            { id: "visitor", label: "Visitors" },
            { id: "gate_pass", label: "Gate Passes" },
            { id: "complaint", label: "Complaints" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search details, visitor name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Security Logs list */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white border border-slate-200 shadow-sm p-12 text-center text-slate-500 rounded-2xl">
          No logs entered for this selection.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredLogs.map((log) => {
            let logIcon = <Clipboard className="w-5 h-5 text-blue-600" />;
            let badgeStyle = "bg-blue-50 text-blue-600 border border-blue-200";
            
            if (log.type === "complaint") {
              logIcon = <AlertTriangle className={`w-5 h-5 ${log.status === "resolved" ? "text-emerald-600" : "text-amber-550"}`} />;
              badgeStyle = log.status === "resolved"
                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : "bg-amber-50 text-amber-600 border border-amber-200 animate-pulse";
            } else if (log.type === "gate_pass") {
              logIcon = <Key className="w-5 h-5 text-indigo-600" />;
              badgeStyle = "bg-indigo-50 text-indigo-455 border border-indigo-200";
            }

            const formattedDate = new Date(log.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit"
            });

            return (
              <div key={log.id} className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl flex flex-col justify-between gap-4 relative">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-slate-100/60 rounded-xl border border-slate-200">
                        {logIcon}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{log.title}</h4>
                        <span className="text-[10px] text-slate-500 font-semibold">{formattedDate}</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${badgeStyle}`}>
                      {log.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pl-1 pt-1.5">{log.description}</p>
                </div>

                {/* Footer details */}
                <div className="flex justify-between items-center border-t border-slate-200/70 pt-3 text-[11px]">
                  {log.tenantName ? (
                    <span className="text-indigo-600 font-bold flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      Tenant: {log.tenantName} (Room {getRoomNumber(tenants.find((t) => t.id === log.tenantId)?.roomId)})
                    </span>
                  ) : (
                    <span className="text-slate-500 italic">No resident profile attached</span>
                  )}

                  {log.type === "complaint" && log.status === "pending" && (
                    <button
                      onClick={() => handleResolve(log.id, "complaint")}
                      className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-500/30 rounded-lg font-semibold transition-all"
                    >
                      Resolve Ticket
                    </button>
                  )}
                  {log.type === "gate_pass" && log.status === "pending" && (
                    <button
                      onClick={() => handleResolve(log.id, "gate_pass")}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all"
                    >
                      Approve Pass
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lodge Dialog (Combined modal based on action) */}
      {showAddLogModal && (
        <ModalOverlay tone="bg-slate-900/50" onClose={() => setShowAddLogModal(null)}>
          <form 
            onSubmit={handleLogSubmit}
            className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md animate-fade-in relative space-y-5 shadow-xl"
          >
            <div>
              <h4 className="text-lg font-bold text-slate-900 capitalize">
                Lodge {showAddLogModal.replace("_", " ")} entry
              </h4>
              <p className="text-slate-500 text-xs mt-1">Provide log details and link a resident if needed.</p>
            </div>

            <div className="space-y-4">
              {/* Linked Tenant Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">
                  {showAddLogModal === "visitor" ? "Person Visiting" : "Resident ID"}
                </label>
                <select
                  required={showAddLogModal !== "visitor"} // Optional for visitors, required for passes and complaints
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="w-full p-2.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                >
                  <option value="">-- Choose Resident --</option>
                  {activeTenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Room {getRoomNumber(t.roomId)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title Input based on type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">
                  {showAddLogModal === "visitor"
                    ? "Visitor Full Name"
                    : showAddLogModal === "gate_pass"
                    ? "Late Pass Reason"
                    : "Complaint Subject"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    showAddLogModal === "visitor"
                      ? "e.g. Rahul Verma"
                      : showAddLogModal === "gate_pass"
                      ? "e.g. Returning late from office"
                      : "e.g. AC cooling issue, bathroom leak"
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              {/* Phone number for Visitor only */}
              {showAddLogModal === "visitor" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Visitor Contact Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="Visitor phone number"
                    value={visitorPhone}
                    onChange={(e) => setVisitorPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              )}

              {/* Description details */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Details / Remarks</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide additional details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Form actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddLogModal(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
              >
                Log Entry
              </button>
            </div>
          </form>
        </ModalOverlay>
      )}
    </div>
  );
}
