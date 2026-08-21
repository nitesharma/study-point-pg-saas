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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {staff.map(s => (
        <div key={s.id} onClick={() => openEditStaff(s)} className="glass-card p-5 rounded-2xl cursor-pointer hover:border-indigo-500/30 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${s.status === 'active' ? 'bg-indigo-500' : 'bg-slate-600'}`}>
              {s.name.charAt(0)}
            </div>
            <div>
              <h4 className="font-bold text-white">{s.name}</h4>
              <p className="text-xs text-slate-400 capitalize">{s.role}</p>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 bg-slate-900/50 rounded-lg">
              <span className="text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3"/> Phone</span>
              <span className="text-slate-200">{s.phone}</span>
            </div>
            <div className="flex justify-between p-2 bg-slate-900/50 rounded-lg">
              <span className="text-slate-400 flex items-center gap-1"><IndianRupee className="w-3 h-3"/> Salary</span>
              <span className="text-emerald-400 font-bold">₹{s.salary.toLocaleString()}/mo</span>
            </div>
            <div className="flex justify-between p-2 bg-slate-900/50 rounded-lg">
              <span className="text-slate-400 flex items-center gap-1"><CalendarDays className="w-3 h-3"/> Joined</span>
              <span className="text-slate-200">{new Date(s.joinedDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderAttendance = () => {
    return (
      <div className="glass-card border border-slate-800/60 rounded-2xl overflow-hidden p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-white">Daily Attendance</h3>
          <input 
            type="date"
            value={attDate}
            onChange={(e) => setAttDate(e.target.value)}
            className="p-2.5 rounded-xl text-sm glass-input"
          />
        </div>

        <div className="space-y-4">
          {activeStaff.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No active staff members.</p>
          ) : (
            activeStaff.map(s => {
              const currentAtt = attendance.find(a => a.staffId === s.id && a.date === attDate);
              
              return (
                <div key={s.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                  <div className="mb-3 sm:mb-0">
                    <p className="font-bold text-white">{s.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{s.role}</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => handleMarkAttendance(s.id, "present")}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${currentAtt?.status === 'present' ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Present
                    </button>
                    <button 
                      onClick={() => handleMarkAttendance(s.id, "half_day")}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${currentAtt?.status === 'half_day' ? 'bg-amber-500 text-white' : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'}`}
                    >
                      <Clock className="w-3.5 h-3.5" /> Half Day
                    </button>
                    <button 
                      onClick={() => handleMarkAttendance(s.id, "absent")}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${currentAtt?.status === 'absent' ? 'bg-rose-500 text-white' : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'}`}
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
    <div className="glass-card border border-slate-800/60 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-800">
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
                  <tr key={adv.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-200">{s?.name || "Unknown Staff"}</td>
                    <td className="px-6 py-4 text-slate-300">{adv.reason}</td>
                    <td className="px-6 py-4 text-amber-400 font-bold">₹{adv.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{new Date(adv.date).toLocaleDateString()}</td>
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
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Staff & HR
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Manage your property employees, attendance, and salary advances.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="glass-card-no-hover px-5 py-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-0.5">Total Payroll</p>
            <p className="text-xl font-extrabold text-white">₹{totalMonthlySalary.toLocaleString()}</p>
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
            className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            {activeTab === "advances" ? "Log Advance" : "Add Staff"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row gap-2 bg-slate-900/50 p-2 rounded-2xl border border-slate-800/60 w-full sm:w-fit">
        <button
          onClick={() => setActiveTab("directory")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "directory" ? "bg-slate-800 text-white shadow-md" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <UserCog className="w-4 h-4" /> Directory
        </button>
        <button
          onClick={() => setActiveTab("attendance")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "attendance" ? "bg-slate-800 text-white shadow-md" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <CalendarCheck className="w-4 h-4" /> Attendance
        </button>
        <button
          onClick={() => setActiveTab("advances")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "advances" ? "bg-slate-800 text-white shadow-md" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleStaffSubmit} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-lg animate-fade-in shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserCog className="w-5 h-5 text-indigo-400" />
                  {editingStaff ? "Edit Staff" : "Add Staff"}
                </h3>
              </div>
              <button type="button" onClick={() => setShowStaffModal(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Full Name *</label>
                  <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2.5 rounded-xl text-sm glass-input" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Role *</label>
                  <select value={role} onChange={(e) => setRole(e.target.value as any)} className="w-full p-2.5 rounded-xl text-sm glass-input">
                    <option value="manager">Manager</option>
                    <option value="cleaner">Cleaner</option>
                    <option value="cook">Cook</option>
                    <option value="security">Security</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Phone *</label>
                  <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2.5 rounded-xl text-sm glass-input" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Monthly Salary (₹) *</label>
                  <input required type="number" min="0" value={salary} onChange={(e) => setSalary(e.target.value)} className="w-full p-2.5 rounded-xl text-sm glass-input" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Joined Date *</label>
                  <input required type="date" value={joinedDate} onChange={(e) => setJoinedDate(e.target.value)} className="w-full p-2.5 rounded-xl text-sm glass-input" />
                </div>

                {editingStaff && (
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-400">Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full p-2.5 rounded-xl text-sm glass-input">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive / Resigned</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-6 mt-6 border-t border-slate-800">
              <button type="button" onClick={() => setShowStaffModal(false)} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-all ml-auto">Cancel</button>
              <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all">Save Staff</button>
            </div>
          </form>
        </div>
      )}

      {/* ADVANCE MODAL */}
      {showAdvanceModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAdvanceSubmit} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md animate-fade-in shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-indigo-400" />
                  Log Salary Advance
                </h3>
              </div>
              <button type="button" onClick={() => setShowAdvanceModal(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Select Staff *</label>
                <select required value={advStaffId} onChange={(e) => setAdvStaffId(e.target.value)} className="w-full p-2.5 rounded-xl text-sm glass-input">
                  <option value="">-- Choose Staff --</option>
                  {activeStaff.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Amount (₹) *</label>
                <input required type="number" min="1" value={advAmount} onChange={(e) => setAdvAmount(e.target.value)} className="w-full p-2.5 rounded-xl text-sm glass-input" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Date *</label>
                <input required type="date" value={advDate} onChange={(e) => setAdvDate(e.target.value)} className="w-full p-2.5 rounded-xl text-sm glass-input" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Reason *</label>
                <input required type="text" value={advReason} onChange={(e) => setAdvReason(e.target.value)} placeholder="e.g. Medical, Festival, Personal" className="w-full p-2.5 rounded-xl text-sm glass-input" />
              </div>
            </div>

            <div className="flex gap-3 pt-6 mt-6 border-t border-slate-800">
              <button type="button" onClick={() => setShowAdvanceModal(false)} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-all ml-auto">Cancel</button>
              <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all">Record Advance</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
