"use client";

import React, { useState } from "react";
import { Staff, StaffAttendance, StaffAdvance } from "../lib/db";
import { 
  UserCog, 
  Plus, 
  Phone,
  CalendarDays,
  IndianRupee,
  CalendarCheck,
  CheckCircle,
  XCircle,
  Clock,
  ArrowDownCircle
} from "lucide-react";

import ModalOverlay from "./ui/ModalOverlay";
interface StaffViewProps {
  staff: Staff[];
  attendance: StaffAttendance[];
  advances: StaffAdvance[];
  onAddStaff: (staff: Staff) => Promise<void>;
  onUpdateStaff: (staffId: string, updated: Staff) => Promise<void>;
  onAddAttendance: (att: StaffAttendance) => Promise<void>;
  onAddAdvance: (adv: StaffAdvance) => Promise<void>;
  selectedPropertyId: string;
}

export default function StaffView({
  staff,
  attendance,
  advances,
  onAddStaff,
  onUpdateStaff,
  onAddAttendance,
  onAddAdvance,
  selectedPropertyId
}: StaffViewProps) {
  const [activeTab, setActiveTab] = useState<"directory" | "attendance" | "advances">("directory");
  
  // Staff Modal State
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState<"manager" | "cleaner" | "cook" | "security" | "other">("cleaner");
  const [phone, setPhone] = useState("");
  const [salary, setSalary] = useState("");
  const [joinedDate, setJoinedDate] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  // Advance Modal State
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advStaffId, setAdvStaffId] = useState("");
  const [advAmount, setAdvAmount] = useState("");
  const [advDate, setAdvDate] = useState("");
  const [advReason, setAdvReason] = useState("");

  // Attendance State
  const [attDate, setAttDate] = useState(new Date().toISOString().split("T")[0]);

  const activeStaff = staff.filter(s => s.status === "active");
  const totalMonthlySalary = activeStaff.reduce((sum, s) => sum + s.salary, 0);

  // === HANDLERS ===

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !salary || !joinedDate) return;

    const staffData: Staff = {
      id: editingStaff ? editingStaff.id : `staff-${Date.now()}`,
      propertyId: selectedPropertyId,
      name,
      role,
      phone,
      salary: Number(salary),
      joinedDate,
      status
    };

    if (editingStaff) {
      await onUpdateStaff(editingStaff.id, staffData);
    } else {
      await onAddStaff(staffData);
    }
    setShowStaffModal(false);
  };

  const openAddStaff = () => {
    setEditingStaff(null);
    setName("");
    setRole("cleaner");
    setPhone("");
    setSalary("");
    setJoinedDate(new Date().toISOString().split("T")[0]);
    setStatus("active");
    setShowStaffModal(true);
  };

  const openEditStaff = (s: Staff) => {
    setEditingStaff(s);
    setName(s.name);
    setRole(s.role);
    setPhone(s.phone);
    setSalary(s.salary.toString());
    setJoinedDate(s.joinedDate);
    setStatus(s.status);
    setShowStaffModal(true);
  };

  const handleAdvanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advStaffId || !advAmount || !advDate || !advReason) return;

    await onAddAdvance({
      id: `adv-${Date.now()}`,
      propertyId: selectedPropertyId,
      staffId: advStaffId,
      amount: Number(advAmount),
      date: advDate,
      reason: advReason
    });

    setShowAdvanceModal(false);
  };

  const handleMarkAttendance = async (staffId: string, attStatus: "present" | "absent" | "half_day") => {
    await onAddAttendance({
      id: `att-${staffId}-${attDate}`,
      propertyId: selectedPropertyId,
      staffId,
      date: attDate,
      status: attStatus
    });
  };

  // === RENDERS ===

  const renderDirectory = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
      {staff.map(s => (
        <div key={s.id} onClick={() => openEditStaff(s)} className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl cursor-pointer hover:border-indigo-200 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${s.status === 'active' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>
              {s.name.charAt(0)}
            </div>
            <div>
              <h4 className="font-bold text-slate-900">{s.name}</h4>
              <p className="text-xs text-slate-500 capitalize">{s.role}</p>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
              <span className="text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3"/> Phone</span>
              <span className="text-slate-900">{s.phone}</span>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
              <span className="text-slate-500 flex items-center gap-1"><IndianRupee className="w-3 h-3"/> Salary</span>
              <span className="text-emerald-600 font-bold">₹{s.salary.toLocaleString()}/mo</span>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
              <span className="text-slate-500 flex items-center gap-1"><CalendarDays className="w-3 h-3"/> Joined</span>
              <span className="text-slate-900">{new Date(s.joinedDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderAttendance = () => {
    return (
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-slate-900">Daily Attendance</h3>
          <input 
            type="date"
            value={attDate}
            onChange={(e) => setAttDate(e.target.value)}
            className="p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        <div className="space-y-4">
          {activeStaff.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No active staff members.</p>
          ) : (
            activeStaff.map(s => {
              const currentAtt = attendance.find(a => a.staffId === s.id && a.date === attDate);
              
              return (
                <div key={s.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="mb-3 sm:mb-0">
                    <p className="font-bold text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{s.role}</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => handleMarkAttendance(s.id, "present")}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${currentAtt?.status === 'present' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500/20'}`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Present
                    </button>
                    <button 
                      onClick={() => handleMarkAttendance(s.id, "half_day")}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${currentAtt?.status === 'half_day' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-600 hover:bg-amber-500/20'}`}
                    >
                      <Clock className="w-3.5 h-3.5" /> Half Day
                    </button>
                    <button 
                      onClick={() => handleMarkAttendance(s.id, "absent")}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${currentAtt?.status === 'absent' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                    >
                      <XCircle className="w-3.5 h-3.5" /> Absent
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderAdvances = () => (
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700 [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold">Staff Name</th>
              <th className="px-6 py-4 font-semibold">Reason</th>
              <th className="px-6 py-4 font-semibold">Amount</th>
              <th className="px-6 py-4 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {advances.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  <ArrowDownCircle className="w-8 h-8 mx-auto mb-3 text-slate-600" />
                  No advances recorded.
                </td>
              </tr>
            ) : (
              advances.sort((a,b) => b.date.localeCompare(a.date)).map(adv => {
                const s = staff.find(st => st.id === adv.staffId);
                return (
                  <tr key={adv.id} className="hover:bg-slate-100/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{s?.name || "Unknown Staff"}</td>
                    <td className="px-6 py-4 text-slate-700">{adv.reason}</td>
                    <td className="px-6 py-4 text-amber-600 font-bold">₹{adv.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{new Date(adv.date).toLocaleDateString()}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Staff & HR
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Manage your property employees, attendance, and salary advances.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm px-5 py-3 rounded-xl border border-indigo-200 bg-indigo-500/5">
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-0.5 whitespace-nowrap">Total Payroll</p>
            <p className="text-xl font-extrabold text-slate-900">₹{totalMonthlySalary.toLocaleString()}</p>
          </div>
          
          <button
            onClick={() => {
              if (activeTab === "advances") {
                // reset advance modal
                setAdvStaffId("");
                setAdvAmount("");
                setAdvDate(new Date().toISOString().split("T")[0]);
                setAdvReason("");
                setShowAdvanceModal(true);
              } else {
                openAddStaff();
              }
            }}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            {activeTab === "advances" ? "Log Advance" : "Add Staff"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row gap-2 bg-slate-100 p-2 rounded-2xl border border-slate-200/60 w-full sm:w-fit">
        <button
          onClick={() => setActiveTab("directory")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "directory" ? "bg-slate-100 text-slate-900 shadow-md" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <UserCog className="w-4 h-4" /> Directory
        </button>
        <button
          onClick={() => setActiveTab("attendance")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "attendance" ? "bg-slate-100 text-slate-900 shadow-md" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <CalendarCheck className="w-4 h-4" /> Attendance
        </button>
        <button
          onClick={() => setActiveTab("advances")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "advances" ? "bg-slate-100 text-slate-900 shadow-md" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <IndianRupee className="w-4 h-4" /> Advances
        </button>
      </div>

      {/* Content */}
      {activeTab === "directory" && renderDirectory()}
      {activeTab === "attendance" && renderAttendance()}
      {activeTab === "advances" && renderAdvances()}

      {/* STAFF MODAL */}
      {showStaffModal && (
        <ModalOverlay tone="bg-slate-900/50" onClose={() => setShowStaffModal(false)}>
          <form onSubmit={handleStaffSubmit} className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-lg animate-fade-in shadow-xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <UserCog className="w-5 h-5 text-indigo-600" />
                  {editingStaff ? "Edit Staff" : "Add Staff"}
                </h3>
              </div>
              <button type="button" onClick={() => setShowStaffModal(false)} className="text-slate-500 hover:text-slate-900">✕</button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Full Name *</label>
                  <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Role *</label>
                  <select value={role} onChange={(e) => setRole(e.target.value as any)} className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors">
                    <option value="manager">Manager</option>
                    <option value="cleaner">Cleaner</option>
                    <option value="cook">Cook</option>
                    <option value="security">Security</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Phone *</label>
                  <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Monthly Salary (₹) *</label>
                  <input required type="number" min="0" value={salary} onChange={(e) => setSalary(e.target.value)} className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Joined Date *</label>
                  <input required type="date" value={joinedDate} onChange={(e) => setJoinedDate(e.target.value)} className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
                </div>

                {editingStaff && (
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive / Resigned</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-6 mt-6 border-t border-slate-200">
              <button type="button" onClick={() => setShowStaffModal(false)} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all ml-auto">Cancel</button>
              <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all">Save Staff</button>
            </div>
          </form>
        </ModalOverlay>
      )}

      {/* ADVANCE MODAL */}
      {showAdvanceModal && (
        <ModalOverlay tone="bg-slate-900/50" onClose={() => setShowAdvanceModal(false)}>
          <form onSubmit={handleAdvanceSubmit} className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md animate-fade-in shadow-xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-indigo-600" />
                  Log Salary Advance
                </h3>
              </div>
              <button type="button" onClick={() => setShowAdvanceModal(false)} className="text-slate-500 hover:text-slate-900">✕</button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Select Staff *</label>
                <select required value={advStaffId} onChange={(e) => setAdvStaffId(e.target.value)} className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors">
                  <option value="">-- Choose Staff --</option>
                  {activeStaff.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Amount (₹) *</label>
                <input required type="number" min="1" value={advAmount} onChange={(e) => setAdvAmount(e.target.value)} className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Date *</label>
                <input required type="date" value={advDate} onChange={(e) => setAdvDate(e.target.value)} className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Reason *</label>
                <input required type="text" value={advReason} onChange={(e) => setAdvReason(e.target.value)} placeholder="e.g. Medical, Festival, Personal" className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
              </div>
            </div>

            <div className="flex gap-3 pt-6 mt-6 border-t border-slate-200">
              <button type="button" onClick={() => setShowAdvanceModal(false)} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all ml-auto">Cancel</button>
              <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all">Record Advance</button>
            </div>
          </form>
        </ModalOverlay>
      )}
    </div>
  );
}
