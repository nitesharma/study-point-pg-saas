"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  Trash2, 
  Eye, 
  ShieldAlert, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  ChevronRight,
  UserCheck,
  Phone,
  FileText,
  AlertCircle
} from "lucide-react";
import { Tenant, Room, Bed } from "../lib/db";

interface TenantsViewProps {
  tenants: Tenant[];
  rooms: Room[];
  onOnboard: (tenant: Tenant) => Promise<void>;
  onCheckout: (tenantId: string) => Promise<void>;
  preselectedRoomId: string | null;
  preselectedBedId: string | null;
  onClearPreselect: () => void;
  selectedPropertyId: string;
}

export default function TenantsView({ 
  tenants, 
  rooms, 
  onOnboard, 
  onCheckout, 
  preselectedRoomId,
  preselectedBedId,
  onClearPreselect,
  selectedPropertyId
}: TenantsViewProps) {
  
  // Search & filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "checked_out">("active");

  // Onboarding wizard states
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState(1); // 1: Personal, 2: Room, 3: Rent, 4: Summary

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [idProofType, setIdProofType] = useState("Aadhaar");
  const [idProofNumber, setIdProofNumber] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  
  const [roomId, setRoomId] = useState("");
  const [bedId, setBedId] = useState("");
  const [rentAmount, setRentAmount] = useState(0);
  const [securityDeposit, setSecurityDeposit] = useState(0);
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split("T")[0]);

  // Selected Tenant Profile Modal
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  // Trigger wizard if room and bed are preselected (e.g. from Room Grid click)
  useEffect(() => {
    if (preselectedRoomId && preselectedBedId) {
      setRoomId(preselectedRoomId);
      setBedId(preselectedBedId);
      
      // Auto-set default rent for this room
      const room = rooms.find(r => r.id === preselectedRoomId);
      if (room) {
        setRentAmount(room.rent);
        setSecurityDeposit(room.rent); // default deposit to 1 month rent
      }

      setShowWizard(true);
      setStep(1); // start at step 1 for name and phone
    }
  }, [preselectedRoomId, preselectedBedId, rooms]);

  // Reset form helper
  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setIdProofType("Aadhaar");
    setIdProofNumber("");
    setEmergencyName("");
    setEmergencyPhone("");
    setRoomId("");
    setBedId("");
    setRentAmount(0);
    setSecurityDeposit(0);
    setCheckInDate(new Date().toISOString().split("T")[0]);
    setStep(1);
    onClearPreselect();
  };

  // Close wizard safely
  const handleCloseWizard = () => {
    resetForm();
    setShowWizard(false);
  };

  // List of available rooms & beds
  const availableBedsForRoom = (roomValId: string): Bed[] => {
    const room = rooms.find((r) => r.id === roomValId);
    if (!room) return [];
    return room.beds.filter((b) => b.status === "available" || b.id === preselectedBedId);
  };

  // Filter tenants for presentation
  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch = 
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.phone.includes(searchQuery) ||
      tenant.roomId.includes(searchQuery);
    
    const matchesStatus = statusFilter === "all" || tenant.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Proceed to next step in onboarding wizard
  const nextStep = () => {
    if (step === 1) {
      if (!name || !phone || !idProofNumber) {
        alert("Please fill in Name, Phone, and ID Proof number!");
        return;
      }
    } else if (step === 2) {
      if (!roomId || !bedId) {
        alert("Please select a Room and Bed!");
        return;
      }
    } else if (step === 3) {
      if (rentAmount <= 0) {
        alert("Rent amount must be greater than 0!");
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  // Handle final Onboarding Save
  const handleOnboardSubmit = async () => {
    const newTenant: Tenant = {
      id: "tenant-" + Date.now(),
      propertyId: selectedPropertyId,
      name,
      email,
      phone,
      idProofType,
      idProofNumber,
      emergencyName,
      emergencyPhone,
      roomId,
      bedId,
      checkInDate,
      checkOutDate: null,
      rentAmount,
      securityDeposit,
      status: "active"
    };

    await onOnboard(newTenant);
    setShowWizard(false);
    resetForm();
    alert("Tenant onboarded successfully!");
  };

  // Trigger Checkout
  const handleCheckout = async (tId: string) => {
    if (window.confirm("Are you sure you want to check out this tenant? This will immediately free their assigned bed.")) {
      await onCheckout(tId);
      alert("Tenant checked out successfully.");
      if (selectedTenant && selectedTenant.id === tId) {
        setSelectedTenant(null);
      }
    }
  };

  const getRoomNumber = (rId: string) => {
    const room = rooms.find(r => r.id === rId);
    return room ? room.roomNumber : rId.split('_')[1] || rId;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Tenant Management
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Onboard new paying guests, browse records, and check out residents.
          </p>
        </div>
        <button
          onClick={() => {
            onClearPreselect();
            setShowWizard(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
        >
          <UserPlus className="w-4 h-4" />
          Onboard Tenant
        </button>
      </div>

      {/* Filters toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 border border-slate-800/60 rounded-2xl">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search name, phone, room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs glass-input"
          />
        </div>

        {/* Status Selector */}
        <div className="flex items-center gap-2 w-full md:w-auto self-end md:self-auto justify-end">
          <Filter className="w-4 h-4 text-slate-500" />
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-1 flex">
            {(["active", "checked_out", "all"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all ${
                  statusFilter === status
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {status.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tenants Table Grid */}
      {filteredTenants.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 rounded-2xl">
          No tenant records found matching your filters.
        </div>
      ) : (
        <div className="glass-card-no-hover border border-slate-800/60 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/40 text-slate-450 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4">Tenant Name</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Room & Bed</th>
                  <th className="p-4">Check-in Date</th>
                  <th className="p-4">Rent Rate</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-xs">
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="p-4 font-bold text-white flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 border border-slate-700/50">
                        {tenant.name.charAt(0)}
                      </div>
                      {tenant.name}
                    </td>
                    <td className="p-4 text-slate-350">
                      <div>{tenant.phone}</div>
                      <div className="text-[10px] text-slate-500">{tenant.email || "No Email"}</div>
                    </td>
                    <td className="p-4">
                      <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-bold text-[10px] uppercase">
                        R{getRoomNumber(tenant.roomId)} - {tenant.bedId.split("-")[1] || tenant.bedId}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">{tenant.checkInDate}</td>
                    <td className="p-4 font-bold text-white">₹{tenant.rentAmount}/mo</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        tenant.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      }`}>
                        {tenant.status === "active" ? "In Residence" : "Checked Out"}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedTenant(tenant)}
                        title="View Profile Details"
                        className="p-2 bg-slate-850 hover:bg-slate-800 border border-slate-800/80 rounded-lg text-slate-400 hover:text-white transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {tenant.status === "active" && (
                        <button
                          onClick={() => handleCheckout(tenant.id)}
                          title="Check out Guest"
                          className="p-2 bg-rose-500/15 hover:bg-rose-500 border border-rose-500/30 hover:border-rose-600 rounded-lg text-rose-450 hover:text-white transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tenant Profile View Modal */}
      {selectedTenant && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-lg animate-fade-in relative space-y-6 shadow-2xl">
            {/* Modal Header */}
            <div>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-lg font-bold text-indigo-400">
                    {selectedTenant.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-lg font-extrabold text-white">{selectedTenant.name}</h4>
                    <p className="text-slate-500 text-xs">Resident ID: {selectedTenant.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTenant(null)}
                  className="text-slate-400 hover:text-white font-extrabold text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Profile Info Columns */}
            <div className="grid grid-cols-2 gap-6 p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Phone</span>
                  <span className="text-xs font-bold text-slate-200">{selectedTenant.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Email</span>
                  <span className="text-xs font-bold text-slate-200">{selectedTenant.email || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">ID Proof Details</span>
                  <span className="text-xs font-bold text-slate-200">
                    {selectedTenant.idProofType}: {selectedTenant.idProofNumber}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Room Allocated</span>
                  <span className="text-xs font-extrabold text-indigo-400 uppercase">
                    Room {getRoomNumber(selectedTenant.roomId)} (Bed {selectedTenant.bedId.split("-")[1] || selectedTenant.bedId})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Stay Period</span>
                  <span className="text-xs font-bold text-slate-200">
                    {selectedTenant.checkInDate} to {selectedTenant.checkOutDate || "Present"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Monthly Rent Rate</span>
                  <span className="text-xs font-extrabold text-emerald-400">
                    ₹{selectedTenant.rentAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Emergency Info Box */}
            <div className="p-4 bg-indigo-550/5 border border-indigo-500/10 rounded-xl space-y-2">
              <h5 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                Emergency Contact Details
              </h5>
              <div className="flex justify-between items-center pt-1 text-xs">
                <span className="text-slate-400">Contact Person Name</span>
                <span className="text-slate-200 font-bold">{selectedTenant.emergencyName}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Contact Number</span>
                <span className="text-slate-200 font-bold">{selectedTenant.emergencyPhone}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {selectedTenant.status === "active" && (
                <button
                  onClick={() => handleCheckout(selectedTenant.id)}
                  className="flex-1 py-2.5 bg-rose-650 hover:bg-rose-700 text-white border border-rose-600/30 rounded-xl text-xs font-semibold transition-all shadow-lg shadow-rose-600/25"
                >
                  Checkout Tenant
                </button>
              )}
              <button
                onClick={() => setSelectedTenant(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Multi-step Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-lg animate-fade-in relative space-y-6 shadow-2xl">
            {/* Header & Steps Indicator */}
            <div>
              <div className="flex justify-between items-start">
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-400" />
                  Tenant Onboarding Wizard
                </h4>
                <button 
                  onClick={handleCloseWizard}
                  className="text-slate-400 hover:text-white font-extrabold text-sm"
                >
                  ✕
                </button>
              </div>
              
              {/* Process indicator */}
              <div className="flex justify-between items-center mt-6 px-1">
                {[
                  { n: 1, label: "Personal" },
                  { n: 2, label: "Room Plan" },
                  { n: 3, label: "Financials" },
                  { n: 4, label: "Confirm" }
                ].map((s) => (
                  <div key={s.n} className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                      step >= s.n
                        ? "bg-indigo-600 border-indigo-500 text-white font-bold"
                        : "bg-slate-955 border-slate-800 text-slate-500"
                    }`}>
                      {step > s.n ? "✓" : s.n}
                    </span>
                    <span className={`text-[10px] font-bold ${
                      step >= s.n ? "text-indigo-400" : "text-slate-550"
                    }`}>
                      {s.label}
                    </span>
                    {s.n < 4 && <ChevronRight className="w-3.5 h-3.5 text-slate-700" />}
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 1: Personal Details */}
            {step === 1 && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-slate-400">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amit Kumar"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-2.5 rounded-xl text-xs glass-input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-2.5 rounded-xl text-xs glass-input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400">Email Address</label>
                    <input
                      type="email"
                      placeholder="amit@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-2.5 rounded-xl text-xs glass-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400">ID Proof Type *</label>
                    <select
                      value={idProofType}
                      onChange={(e) => setIdProofType(e.target.value)}
                      className="w-full p-2.5 rounded-xl text-xs glass-input"
                    >
                      <option value="Aadhaar">Aadhaar Card</option>
                      <option value="PAN">PAN Card</option>
                      <option value="Passport">Passport</option>
                      <option value="Driving License">Driving License</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400">ID Document Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="Document ID info"
                      value={idProofNumber}
                      onChange={(e) => setIdProofNumber(e.target.value)}
                      className="w-full p-2.5 rounded-xl text-xs glass-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400">Emergency Name</label>
                    <input
                      type="text"
                      placeholder="Parent/Spouse name"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      className="w-full p-2.5 rounded-xl text-xs glass-input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400">Emergency Phone</label>
                    <input
                      type="tel"
                      placeholder="Contact number"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      className="w-full p-2.5 rounded-xl text-xs glass-input"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Room & Bed Selector */}
            {step === 2 && (
              <div className="space-y-4 py-2">
                {preselectedRoomId && preselectedBedId ? (
                  <div className="p-4 bg-indigo-650/10 border border-indigo-500/25 rounded-xl flex items-center gap-3">
                    <Check className="w-5 h-5 text-indigo-400 shrink-0" />
                    <div className="text-xs">
                      <p className="font-bold text-white">Pre-allocated Bed Selected</p>
                      <p className="text-slate-400">Room {getRoomNumber(preselectedRoomId)} - Bed {preselectedBedId.split("-")[1]}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400">Select Room</label>
                      <select
                        value={roomId}
                        onChange={(e) => {
                          const rId = e.target.value;
                          setRoomId(rId);
                          setBedId("");
                          // Set default rent for room selection
                          const selectedRoomObj = rooms.find(r => r.id === rId);
                          if (selectedRoomObj) {
                            setRentAmount(selectedRoomObj.rent);
                            setSecurityDeposit(selectedRoomObj.rent); // default deposit
                          }
                        }}
                        className="w-full p-2.5 rounded-xl text-xs glass-input"
                      >
                        <option value="">-- Choose a Room --</option>
                        {rooms.map((room) => {
                          const total = room.beds.length;
                          const occupied = room.beds.filter((b) => b.status === "occupied").length;
                          const availableCount = total - occupied;

                          return (
                            <option 
                              key={room.id} 
                              value={room.id}
                              disabled={availableCount === 0}
                            >
                              Room {room.roomNumber} ({room.type}) - {availableCount} beds available
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {roomId && (
                      <div className="space-y-1.5 animate-fade-in">
                        <label className="text-xs font-bold text-slate-400">Select Bed</label>
                        <select
                          value={bedId}
                          onChange={(e) => setBedId(e.target.value)}
                          className="w-full p-2.5 rounded-xl text-xs glass-input"
                        >
                          <option value="">-- Choose a Bed slot --</option>
                          {availableBedsForRoom(roomId).map((bed) => (
                            <option key={bed.id} value={bed.id}>
                              {bed.name} ({bed.status})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* STEP 3: Financial Terms */}
            {step === 3 && (
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Monthly Rent Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={rentAmount}
                    onChange={(e) => setRentAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl text-xs glass-input"
                  />
                  <span className="text-[10px] text-slate-500 font-semibold block">
                    Base rent for room configuration: ₹{rooms.find((r) => r.id === roomId)?.rent || 0}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Security Deposit Collected (₹)</label>
                  <input
                    type="number"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl text-xs glass-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Check-in Date</label>
                  <input
                    type="date"
                    required
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl text-xs glass-input"
                  />
                </div>
              </div>
            )}

            {/* STEP 4: Summary & Confirm */}
            {step === 4 && (
              <div className="space-y-4 py-2 text-xs">
                <div className="p-4 bg-indigo-550/5 border border-indigo-500/10 rounded-xl space-y-3">
                  <h5 className="font-bold text-white text-sm border-b border-slate-800 pb-1.5">Onboarding Confirmation</h5>
                  <div className="grid grid-cols-2 gap-y-2 pt-1">
                    <span className="text-slate-450 font-semibold">Tenant Name:</span>
                    <span className="text-slate-200 font-bold">{name}</span>
                    
                    <span className="text-slate-450 font-semibold">Contact Phone:</span>
                    <span className="text-slate-200 font-bold">{phone}</span>

                    <span className="text-slate-450 font-semibold">Allocated Location:</span>
                    <span className="text-indigo-400 font-bold">Room {getRoomNumber(roomId)} (Bed {bedId.split("-")[1]})</span>

                    <span className="text-slate-450 font-semibold">Monthly Rent:</span>
                    <span className="text-emerald-400 font-extrabold">₹{rentAmount}</span>

                    <span className="text-slate-450 font-semibold">Security Deposit:</span>
                    <span className="text-slate-205 font-bold">₹{securityDeposit}</span>

                    <span className="text-slate-450 font-semibold">Check-in Date:</span>
                    <span className="text-slate-200 font-bold">{checkInDate}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-slate-400 bg-slate-950/40 p-3.5 border border-slate-800 rounded-xl">
                  <AlertCircle className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    By confirming, this bed slot will be locked to the guest. A rent schedule ledger can be generated in the billing tab.
                  </p>
                </div>
              </div>
            )}

            {/* Wizard Actions */}
            <div className="flex gap-3 pt-2">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCloseWizard}
                  className="flex-1 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-400 rounded-xl text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOnboardSubmit}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20"
                >
                  <UserCheck className="w-4 h-4" />
                  Confirm & Save
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
