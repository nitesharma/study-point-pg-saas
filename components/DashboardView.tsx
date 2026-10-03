"use client";

import React from "react";
import { 
  Home, 
  Users, 
  IndianRupee, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  Clock,
  CheckCircle,
  FileText
} from "lucide-react";
import { Room, Tenant, BillingRecord, SecurityLog } from "../lib/db";

interface DashboardViewProps {
  rooms: Room[];
  tenants: Tenant[];
  billing: BillingRecord[];
  logs: SecurityLog[];
  onViewChange: (view: string) => void;
}

export default function DashboardView({ rooms, tenants, billing, logs, onViewChange }: DashboardViewProps) {
  // 1. Calculate Occupancy Stats
  let totalBeds = 0;
  let occupiedBeds = 0;
  rooms.forEach((r) => {
    r.beds.forEach((b) => {
      totalBeds++;
      if (b.status === "occupied") {
        occupiedBeds++;
      }
    });
  });
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  // 2. Financial Stats
  let totalCollected = 0;
  let pendingDues = 0;
  billing.forEach((b) => {
    totalCollected += b.paidAmount;
    pendingDues += (b.totalAmount - b.paidAmount);
  });

  // 3. Security/Complaints Stats
  const activeComplaints = logs.filter((l) => l.type === "complaint" && l.status === "pending").length;
  const recentLogs = logs.slice(0, 5);

  // 4. Monthly Collection breakdown for mini chart
  // Group by billingMonth
  const monthlyRevenue: { [key: string]: { paid: number; unpaid: number } } = {};
  billing.forEach((b) => {
    if (!monthlyRevenue[b.billingMonth]) {
      monthlyRevenue[b.billingMonth] = { paid: 0, unpaid: 0 };
    }
    monthlyRevenue[b.billingMonth].paid += b.paidAmount;
    monthlyRevenue[b.billingMonth].unpaid += (b.totalAmount - b.paidAmount);
  });

  const sortedMonths = Object.keys(monthlyRevenue).sort().slice(-4); // Last 4 months

  // Max value for chart scaling
  const maxVal = Math.max(
    ...sortedMonths.map((m) => monthlyRevenue[m].paid + monthlyRevenue[m].unpaid),
    10000 // avoid division by zero
  );

  return (
    <div className="space-y-8 animate-fade-in bg-slate-50 text-slate-900 min-h-full">
      {/* Top Welcome Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Overview Dashboard
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Real-time analytics and statistics for Study Point Group Paying Guest house.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onViewChange("tenants")}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            Onboard Tenant
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Occupancy Card */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Home className="w-24 h-24 text-indigo-600" />
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold text-slate-500">Occupancy Rate</span>
            <span className="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              {occupancyRate}%
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900">{occupiedBeds} / {totalBeds}</h3>
            <p className="text-slate-500 text-xs mt-1">Occupied Beds vs Total Available</p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4">
            <div 
              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${occupancyRate}%` }}
            ></div>
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <IndianRupee className="w-24 h-24 text-emerald-600" />
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold text-slate-500">Total Collected</span>
            <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg text-xs font-bold">
              Received
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900">₹{totalCollected.toLocaleString("en-IN")}</h3>
            <p className="text-slate-500 text-xs mt-1">Total revenue collected from bills</p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-[11px] text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Updates dynamically from ledger</span>
          </div>
        </div>

        {/* Pending Dues */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <IndianRupee className="w-24 h-24 text-rose-600" />
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold text-slate-500">Pending Dues</span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
              pendingDues > 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
            }`}>
              {pendingDues > 0 ? "Action Needed" : "Clear"}
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900">₹{pendingDues.toLocaleString("en-IN")}</h3>
            <p className="text-slate-500 text-xs mt-1">Pending rent and utilities surcharge</p>
          </div>
          <div className={`mt-4 flex items-center gap-1 text-[11px] ${pendingDues > 0 ? "text-rose-600" : "text-emerald-600"}`}>
            {pendingDues > 0 ? (
              <>
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>Requires payment reminders</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>All invoices settled!</span>
              </>
            )}
          </div>
        </div>

        {/* Active Complaints */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <AlertCircle className="w-24 h-24 text-amber-500" />
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold text-slate-500">Open Complaints</span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
              activeComplaints > 0 ? "bg-amber-50 text-amber-600 animate-pulse" : "bg-emerald-50 text-emerald-600"
            }`}>
              {activeComplaints > 0 ? "Pending Resolve" : "All Clean"}
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900">{activeComplaints}</h3>
            <p className="text-slate-500 text-xs mt-1">Pending tenant maintenance tickets</p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-[11px] text-amber-600">
            <Clock className="w-3.5 h-3.5" />
            <span>Average resolution time: 24h</span>
          </div>
        </div>
      </div>

      {/* Main Stats Charts & Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Collection History Chart */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl xl:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-bold text-slate-900 text-base">Revenue Collection Summary</h4>
              <p className="text-xs text-slate-500">Monthly summary of Paid vs Unpaid amount</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-indigo-500 inline-block"></span>
                <span className="text-slate-600">Paid (Collected)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-indigo-200 inline-block"></span>
                <span className="text-slate-600">Pending</span>
              </div>
            </div>
          </div>

          {/* SVG Mini Bar Graph */}
          {sortedMonths.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
              No financial billing data generated yet.
            </div>
          ) : (
            <div className="h-64 flex items-end justify-between px-4 pb-2 border-b border-slate-100 pt-8 gap-6">
              {sortedMonths.map((month) => {
                const data = monthlyRevenue[month];
                const paidHeight = (data.paid / maxVal) * 100;
                const unpaidHeight = (data.unpaid / maxVal) * 100;
                const totalAmount = data.paid + data.unpaid;

                // Format month code (e.g. 2026-07 -> Jul 26)
                const dateObj = new Date(month + "-02"); // avoid time zone issues
                const monthStr = dateObj.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

                return (
                  <div key={month} className="flex-1 flex flex-col items-center gap-3 h-full group relative justify-end">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 bg-white border border-slate-200 p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 flex flex-col gap-1 text-[11px] min-w-[120px] shadow-lg">
                      <span className="font-bold text-slate-900 mb-0.5">{monthStr} Detail</span>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Paid:</span>
                        <span className="text-indigo-600 font-bold">₹{data.paid}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pending:</span>
                        <span className="text-rose-600 font-bold">₹{data.unpaid}</span>
                      </div>
                      <div className="border-t border-slate-100 my-0.5 pt-0.5 flex justify-between font-bold">
                        <span className="text-slate-700">Total:</span>
                        <span className="text-slate-900">₹{totalAmount}</span>
                      </div>
                    </div>

                    {/* Columns Stack */}
                    <div className="w-full max-w-[48px] h-full flex flex-col justify-end gap-[2px]">
                      {data.unpaid > 0 && (
                        <div 
                          className="w-full bg-indigo-200 hover:bg-indigo-300 rounded-t-md transition-all duration-300 relative border border-indigo-100" 
                          style={{ height: `${Math.max(unpaidHeight, 2)}%` }}
                        ></div>
                      )}
                      {data.paid > 0 && (
                        <div 
                          className="w-full bg-indigo-500 hover:bg-indigo-600 rounded-b-md transition-all duration-300 relative" 
                          style={{ height: `${Math.max(paidHeight, 2)}%` }}
                        ></div>
                      )}
                    </div>
                    
                    <span className="text-xs font-semibold text-slate-500">{monthStr}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Security Alert Feed */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-slate-900 text-base">Security & Activity Log</h4>
              <button 
                onClick={() => onViewChange("security")}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                View Desk
              </button>
            </div>

            {/* List */}
            {recentLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                No logs recorded today.
              </div>
            ) : (
              <div className="space-y-4">
                {recentLogs.map((log) => {
                  let badgeColor = "bg-blue-50 text-blue-600 border border-blue-200";
                  if (log.type === "complaint") {
                    badgeColor = log.status === "resolved" 
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : "bg-amber-50 text-amber-600 border border-amber-200 animate-pulse";
                  } else if (log.type === "gate_pass") {
                    badgeColor = "bg-purple-50 text-purple-600 border border-purple-200";
                  }

                  const formattedDate = new Date(log.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit"
                  });

                  return (
                    <div key={log.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-1.5 hover:border-slate-200 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeColor}`}>
                          {log.type.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {formattedDate}
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-slate-800">
                        {log.title}
                      </h5>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {log.description}
                      </p>
                      {log.tenantName && (
                        <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 font-semibold pt-1 border-t border-slate-200">
                          <Users className="w-3 h-3" />
                          <span>Tenant: {log.tenantName} (Room {tenants.find((t) => t.id === log.tenantId)?.roomId || "N/A"})</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Quick Room Layout Overview */}
      <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-bold text-slate-900 text-base">Quick Room Grid</h4>
            <p className="text-xs text-slate-500">Visual layout of PG floors and bed occupancy</p>
          </div>
          <button 
            onClick={() => onViewChange("rooms")}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            Manage Rooms
          </button>
        </div>

        {/* Room grid representation */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-2">
          {rooms.map((room) => {
            // Calculate occupied beds in this room
            const occupied = room.beds.filter((b) => b.status === "occupied").length;
            const total = room.beds.length;
            let percent = total > 0 ? (occupied / total) * 100 : 0;

            let indicatorColor = "bg-emerald-500";
            if (percent === 100) {
              indicatorColor = "bg-rose-500";
            } else if (percent > 0) {
              indicatorColor = "bg-amber-500";
            }

            return (
              <div 
                key={room.id}
                onClick={() => onViewChange("rooms")}
                className="bg-slate-50 hover:bg-slate-100 cursor-pointer border border-slate-200 p-4 rounded-xl flex flex-col justify-between gap-3 transition-all hover:scale-[1.02]"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-slate-900">Room {room.id}</span>
                  <span className="text-[10px] font-bold text-slate-500">{room.type}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-600 font-bold">
                    <span>Occupancy</span>
                    <span>{occupied}/{total} Beds</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${indicatorColor}`} style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
