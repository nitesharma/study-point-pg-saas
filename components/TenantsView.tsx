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
  AlertCircle,
  Download,
  Edit,
  Clock,
  Coins
} from "lucide-react";
import { Tenant, Room, Bed, BillingRecord } from "../lib/db";
import { exportToCSV } from "../lib/export";

import ModalOverlay from "./ui/ModalOverlay";
interface TenantsViewProps {
  tenants: Tenant[];
  rooms: Room[];
  billing?: BillingRecord[];
  onOnboard: (tenant: Tenant) => Promise<void>;
  onCheckout: (
    tenantId: string,
    settlement?: {
      checkOutDate?: string;
      depositRefunded?: number;
      settlementNotes?: string;
    }
  ) => Promise<void>;
  onUpdateTenant?: (tenantId: string, updated: Partial<Tenant>) => Promise<void>;
  onDeleteTenant?: (tenantId: string) => Promise<void>;
  preselectedRoomId: string | null;
  preselectedBedId: string | null;
  onClearPreselect: () => void;
  selectedPropertyId: string;
}

export default function TenantsView({ 
  tenants, 
  rooms, 
  billing,
  onOnboard, 
  onCheckout, 
  onUpdateTenant,
  onDeleteTenant,
  preselectedRoomId,
  preselectedBedId,
  onClearPreselect,
  selectedPropertyId
}: TenantsViewProps) {
  
  // Search & filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "notice_period" | "checked_out">("active");

  // Move-Out Settlement Modal
  const [settlingTenant, setSettlingTenant] = useState<Tenant | null>(null);
  const [settlementDeductions, setSettlementDeductions] = useState<number>(0);
  const [settlementDate, setSettlementDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [settlementNotes, setSettlementNotes] = useState("");

  // Edit Tenant Modal
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRent, setEditRent] = useState(0);
  const [editEmergencyName, setEditEmergencyName] = useState("");
  const [editEmergencyPhone, setEditEmergencyPhone] = useState("");

  // Notice Period Modal
  const [noticeTenant, setNoticeTenant] = useState<Tenant | null>(null);
  const [expectedMoveOut, setExpectedMoveOut] = useState("");

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
    
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && (tenant.status === "active" || tenant.status === "notice_period")) ||
      (statusFilter === "notice_period" && tenant.status === "notice_period") ||
      (statusFilter === "checked_out" && tenant.status === "checked_out");

    return matchesSearch && matchesStatus;
  });

  // Start checkout with settlement modal
  const openSettlementModal = (tenant: Tenant) => {
    setSettlingTenant(tenant);
    setSettlementDeductions(0);
    setSettlementDate(new Date().toISOString().split("T")[0]);
    setSettlementNotes("");
    if (selectedTenant) setSelectedTenant(null);
  };

  const handleConfirmSettlement = async () => {
    if (!settlingTenant) return;
    const refund = Math.max(0, settlingTenant.securityDeposit - Number(settlementDeductions));
    await onCheckout(settlingTenant.id, {
      checkOutDate: settlementDate,
      depositRefunded: refund,
      settlementNotes: settlementNotes.trim() || `Deductions: ₹${settlementDeductions}`
    });
    setSettlingTenant(null);
    alert(`Tenant checked out successfully! Deposit refund: ₹${refund.toLocaleString("en-IN")}`);
  };

  // Start edit tenant modal
  const openEditTenantModal = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setEditName(tenant.name);
    setEditPhone(tenant.phone);
    setEditEmail(tenant.email || "");
    setEditRent(tenant.rentAmount);
    setEditEmergencyName(tenant.emergencyName || "");
    setEditEmergencyPhone(tenant.emergencyPhone || "");
    if (selectedTenant) setSelectedTenant(null);
  };

  const handleSaveEditTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant || !onUpdateTenant) return;

    await onUpdateTenant(editingTenant.id, {
      name: editName,
      phone: editPhone,
      email: editEmail,
      rentAmount: Number(editRent),
      emergencyName: editEmergencyName,
      emergencyPhone: editEmergencyPhone
    });

    setEditingTenant(null);
    alert("Tenant details updated successfully!");
  };

  // Start notice period modal
  const openNoticeModal = (tenant: Tenant) => {
    setNoticeTenant(tenant);
    // default expected move out to 30 days from now
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setExpectedMoveOut(d.toISOString().split("T")[0]);
    if (selectedTenant) setSelectedTenant(null);
  };

  const handleSaveNotice = async () => {
    if (!noticeTenant || !onUpdateTenant) return;
    const today = new Date().toISOString().split("T")[0];
    await onUpdateTenant(noticeTenant.id, {
      status: "notice_period",
      noticeDate: today,
      expectedMoveOutDate: expectedMoveOut
    });
    setNoticeTenant(null);
    alert(`Notice period set for ${noticeTenant.name} with expected move-out on ${expectedMoveOut}.`);
  };

  const handleDeleteTenantAction = async (tId: string) => {
    if (!onDeleteTenant) return;
    if (window.confirm("Are you sure you want to permanently delete this tenant record? This action cannot be undone.")) {
      await onDeleteTenant(tId);
      if (selectedTenant && selectedTenant.id === tId) setSelectedTenant(null);
      alert("Tenant record removed.");
    }
  };

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

  const handleExportTenants = () => {
    const headers = [
      "Tenant ID",
      "Full Name",
      "Status",
      "Phone",
      "Email",
      "Room",
      "Bed ID",
      "Check-In Date",
      "Check-Out Date",
      "Monthly Rent (Rs)",
      "Security Deposit (Rs)",
      "ID Proof Type",
      "ID Proof Number",
      "Emergency Contact Name",
      "Emergency Contact Phone"
    ];

    const rows = tenants.map((t) => [
      t.id,
      t.name,
      t.status,
      t.phone,
      t.email,
      `Room ${getRoomNumber(t.roomId)}`,
      t.bedId,
      t.checkInDate,
      t.checkOutDate || "N/A",
      t.rentAmount,
      t.securityDeposit,
      t.idProofType,
      t.idProofNumber,
      t.emergencyName,
      t.emergencyPhone
    ]);

    exportToCSV(`Tenants_List_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Tenant Management
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Onboard new paying guests, browse records, and check out residents.
          </p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleExportTenants}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all border border-slate-200"
            title="Download Excel / CSV"
          >
            <Download className="w-4 h-4 text-slate-600" />
            Export CSV
          </button>
          <button
            onClick={() => {
              onClearPreselect();
              setShowWizard(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Onboard Tenant
          </button>
        </div>
      </div>

      {/* Filters toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 border border-slate-200 shadow-sm rounded-2xl">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search name, phone, room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        {/* Status Selector */}
        <div className="flex items-center gap-2 w-full md:w-auto self-end md:self-auto justify-end overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-1 flex shrink-0">
            {(["active", "notice_period", "checked_out", "all"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all ${
                  statusFilter === status
                    ? "bg-white text-indigo-700 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {status === "notice_period" ? "On Notice" : status.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tenants Table Grid */}
      {filteredTenants.length === 0 ? (
        <div className="bg-white border border-slate-200 shadow-sm p-12 text-center text-slate-500 rounded-2xl">
          No tenant records found matching your filters.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4">Tenant Name</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Room & Bed</th>
                  <th className="p-4">Check-in Date</th>
                  <th className="p-4">Rent Rate</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 border border-slate-200">
                        {tenant.name.charAt(0)}
                      </div>
                      {tenant.name}
                    </td>
                    <td className="p-4 text-slate-600">
                      <div>{tenant.phone}</div>
                      <div className="text-[10px] text-slate-500">{tenant.email || "No Email"}</div>
                    </td>
                    <td className="p-4">
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-bold text-[10px] uppercase">
                        R{getRoomNumber(tenant.roomId)} - {tenant.bedId.split("-").pop() || tenant.bedId}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">{tenant.checkInDate}</td>
                    <td className="p-4 font-bold text-slate-900">₹{tenant.rentAmount}/mo</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        tenant.status === "notice_period"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : tenant.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}>
                        {tenant.status === "notice_period"
                          ? `On Notice (${tenant.expectedMoveOutDate || "Soon"})`
                          : tenant.status === "active"
                          ? "In Residence"
                          : "Checked Out"}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedTenant(tenant)}
                        title="View Profile Details"
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditTenantModal(tenant)}
                        title="Edit Resident Details"
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {tenant.status === "active" && (
                        <button
                          onClick={() => openNoticeModal(tenant)}
                          title="Record Move-Out Notice"
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-amber-700 transition-colors"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                      )}
                      {tenant.status !== "checked_out" ? (
                        <button
                          onClick={() => openSettlementModal(tenant)}
                          title="Check out & Settle Deposit"
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 rounded-lg text-rose-600 transition-all"
                        >
                          <Coins className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeleteTenantAction(tenant.id)}
                          title="Delete Record Permanently"
                          className="p-1.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg text-slate-400 hover:text-rose-600 transition-all"
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
        <ModalOverlay tone="bg-slate-900/50" onClose={() => setSelectedTenant(null)} dismissOnBackdrop>
          <div className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-lg animate-fade-in relative space-y-6 shadow-xl">
            {/* Modal Header */}
            <div>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-lg font-bold text-indigo-600">
                    {selectedTenant.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-lg font-extrabold text-slate-900">{selectedTenant.name}</h4>
                    <p className="text-slate-500 text-xs">Resident ID: {selectedTenant.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTenant(null)}
                  className="text-slate-400 hover:text-slate-600 font-extrabold text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Profile Info Columns */}
            <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Phone</span>
                  <span className="text-xs font-bold text-slate-900">{selectedTenant.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Email</span>
                  <span className="text-xs font-bold text-slate-900">{selectedTenant.email || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">ID Proof Details</span>
                  <span className="text-xs font-bold text-slate-900">
                    {selectedTenant.idProofType}: {selectedTenant.idProofNumber}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Room Allocated</span>
                  <span className="text-xs font-extrabold text-indigo-600 uppercase">
                    Room {getRoomNumber(selectedTenant.roomId)} (Bed {selectedTenant.bedId.split("-").pop() || selectedTenant.bedId})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Stay Period</span>
                  <span className="text-xs font-bold text-slate-900">
                    {selectedTenant.checkInDate} to {selectedTenant.checkOutDate || "Present"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Monthly Rent Rate</span>
                  <span className="text-xs font-extrabold text-emerald-600">
                    ₹{selectedTenant.rentAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Notice / Settlement Details if present */}
            {selectedTenant.status === "notice_period" && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-amber-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Notice Period Active
                </span>
                <p className="text-amber-900">
                  Notice Given: <strong>{selectedTenant.noticeDate || "N/A"}</strong> | Expected Move-Out: <strong>{selectedTenant.expectedMoveOutDate || "Soon"}</strong>
                </p>
              </div>
            )}

            {selectedTenant.status === "checked_out" && (
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-slate-700">Move-Out Settlement Record</span>
                <p className="text-slate-600">
                  Checked Out: <strong>{selectedTenant.checkOutDate || "N/A"}</strong>
                </p>
                {selectedTenant.depositRefunded !== undefined && (
                  <p className="text-slate-600">
                    Deposit Refunded: <strong className="text-emerald-700">₹{selectedTenant.depositRefunded?.toLocaleString("en-IN")}</strong>
                  </p>
                )}
                {selectedTenant.settlementNotes && (
                  <p className="text-slate-500 text-[11px] italic">
                    Notes: {selectedTenant.settlementNotes}
                  </p>
                )}
              </div>
            )}

            {/* Payment & Billing History Timeline */}
            {billing && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Stay & Billing History
                </span>
                {(() => {
                  const history = billing.filter((b) => b.tenantId === selectedTenant.id);
                  if (history.length === 0) {
                    return <p className="text-xs text-slate-400 italic">No bill records on file yet.</p>;
                  }
                  return (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {history.map((b) => {
                        const due = b.totalAmount - b.paidAmount;
                        return (
                          <div key={b.id} className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                            <div>
                              <span className="font-bold text-slate-800">{b.billingMonth}</span>
                              <span className="text-[10px] text-slate-500 ml-2">Total: ₹{b.totalAmount}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              due === 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}>
                              {due === 0 ? "Paid" : `Due ₹${due}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Emergency Info Box */}
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl space-y-2">
              <h5 className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                Emergency Contact Details
              </h5>
              <div className="flex justify-between items-center pt-1 text-xs">
                <span className="text-slate-600">Contact Person Name</span>
                <span className="text-slate-900 font-bold">{selectedTenant.emergencyName || "Not provided"}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Contact Number</span>
                <span className="text-slate-900 font-bold">{selectedTenant.emergencyPhone || "Not provided"}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => openEditTenantModal(selectedTenant)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit Info
              </button>
              {selectedTenant.status === "active" && (
                <button
                  onClick={() => openNoticeModal(selectedTenant)}
                  className="flex-1 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Set Notice
                </button>
              )}
              {selectedTenant.status !== "checked_out" && (
                <button
                  onClick={() => openSettlementModal(selectedTenant)}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Coins className="w-3.5 h-3.5" />
                  Settle & Checkout
                </button>
              )}
              <button
                onClick={() => setSelectedTenant(null)}
                className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Move-Out & Deposit Settlement Modal */}
      {settlingTenant && (
        <ModalOverlay tone="bg-slate-900/50" onClose={() => setSettlingTenant(null)}>
          <div className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md animate-fade-in relative space-y-5 shadow-xl">
            <div>
              <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                Move-Out & Deposit Settlement
              </h4>
              <p className="text-slate-500 text-xs mt-1">
                Settling {settlingTenant.name} (Room {getRoomNumber(settlingTenant.roomId)}). This will free their bed immediately.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">Security Deposit Paid:</span>
                <span className="text-sm font-bold text-emerald-600">
                  ₹{settlingTenant.securityDeposit.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Check-Out Date</label>
                <input
                  type="date"
                  required
                  value={settlementDate}
                  onChange={(e) => setSettlementDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Deductions (Damages / Pending Bills) ₹</label>
                <input
                  type="number"
                  min="0"
                  max={settlingTenant.securityDeposit}
                  value={settlementDeductions}
                  onChange={(e) => setSettlementDeductions(Math.max(0, Number(e.target.value)))}
                  className="w-full p-2.5 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center text-xs">
                <span className="text-emerald-800 font-bold">Net Deposit to Refund:</span>
                <span className="text-base font-extrabold text-emerald-700 font-mono">
                  ₹{Math.max(0, settlingTenant.securityDeposit - settlementDeductions).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Settlement Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Room inspected, keys returned, electric dues cleared."
                  value={settlementNotes}
                  onChange={(e) => setSettlementNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSettlingTenant(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSettlement}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
              >
                Confirm Move-Out
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Edit Tenant Modal */}
      {editingTenant && (
        <ModalOverlay tone="bg-slate-900/50" onClose={() => setEditingTenant(null)}>
          <form 
            onSubmit={handleSaveEditTenant}
            className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md animate-fade-in relative space-y-4 shadow-xl"
          >
            <div>
              <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-600" />
                Edit Resident Details
              </h4>
              <p className="text-slate-500 text-xs mt-1">Update contact details and monthly rent.</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Phone</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Monthly Rent (₹)</label>
                  <input
                    type="number"
                    required
                    value={editRent}
                    onChange={(e) => setEditRent(Number(e.target.value))}
                    className="w-full p-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full p-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Emergency Contact</label>
                  <input
                    type="text"
                    value={editEmergencyName}
                    onChange={(e) => setEditEmergencyName(e.target.value)}
                    placeholder="Name"
                    className="w-full p-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Emergency Phone</label>
                  <input
                    type="text"
                    value={editEmergencyPhone}
                    onChange={(e) => setEditEmergencyPhone(e.target.value)}
                    placeholder="Phone"
                    className="w-full p-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEditingTenant(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </form>
        </ModalOverlay>
      )}

      {/* Notice Period Modal */}
      {noticeTenant && (
        <ModalOverlay tone="bg-slate-900/50" onClose={() => setNoticeTenant(null)}>
          <div className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-sm animate-fade-in relative space-y-4 shadow-xl">
            <div>
              <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Record Move-Out Notice
              </h4>
              <p className="text-slate-500 text-xs mt-1">
                Mark {noticeTenant.name} as on notice period.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Expected Vacate Date</label>
                <input
                  type="date"
                  required
                  value={expectedMoveOut}
                  onChange={(e) => setExpectedMoveOut(e.target.value)}
                  className="w-full p-2.5 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setNoticeTenant(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNotice}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
              >
                Set Notice
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Onboarding Multi-step Wizard Modal */}
      {showWizard && (
        <ModalOverlay tone="bg-slate-900/50" onClose={() => setShowWizard(false)}>
          <div className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-lg animate-fade-in relative space-y-6 shadow-xl">
            {/* Header & Steps Indicator */}
            <div>
              <div className="flex justify-between items-start">
                <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-600" />
                  Tenant Onboarding Wizard
                </h4>
                <button 
                  onClick={handleCloseWizard}
                  className="text-slate-400 hover:text-slate-600 font-extrabold text-sm"
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
                        ? "bg-indigo-600 border-indigo-600 text-white font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-400"
                    }`}>
                      {step > s.n ? "✓" : s.n}
                    </span>
                    <span className={`text-[10px] font-bold ${
                      step >= s.n ? "text-indigo-600" : "text-slate-400"
                    }`}>
                      {s.label}
                    </span>
                    {s.n < 4 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 1: Personal Details */}
            {step === 1 && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-slate-700">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amit Kumar"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-2.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-2.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Email Address</label>
                    <input
                      type="email"
                      placeholder="amit@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-2.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">ID Proof Type *</label>
                    <select
                      value={idProofType}
                      onChange={(e) => setIdProofType(e.target.value)}
                      className="w-full p-2.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    >
                      <option value="Aadhaar">Aadhaar Card</option>
                      <option value="PAN">PAN Card</option>
                      <option value="Passport">Passport</option>
                      <option value="Driving License">Driving License</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">ID Document Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="Document ID info"
                      value={idProofNumber}
                      onChange={(e) => setIdProofNumber(e.target.value)}
                      className="w-full p-2.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Emergency Name</label>
                    <input
                      type="text"
                      placeholder="Parent/Spouse name"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      className="w-full p-2.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Emergency Phone</label>
                    <input
                      type="tel"
                      placeholder="Contact number"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      className="w-full p-2.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Room & Bed Selector */}
            {step === 2 && (
              <div className="space-y-4 py-2">
                {preselectedRoomId && preselectedBedId ? (
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3">
                    <Check className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">Pre-allocated Bed Selected</p>
                      <p className="text-slate-600">Room {getRoomNumber(preselectedRoomId)} - Bed {preselectedBedId.split("-").pop()}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Select Room</label>
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
                        className="w-full p-2.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      >
                        <option value="">-- Choose a Room --</option>
                        {rooms.map((room) => {
                          const availableCount = room.beds.filter((b) => b.status === "available").length;

                          return (
                            <option 
                              key={room.id} 
                              value={room.id}
                              disabled={availableCount === 0}
                            >
                              Room {room.roomNumber} ({room.type}) - {availableCount === 0 ? "full" : `${availableCount} bed${availableCount === 1 ? "" : "s"} available`}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {roomId && (
                      <div className="space-y-1.5 animate-fade-in">
                        <label className="text-xs font-bold text-slate-700">Select Bed</label>
                        <select
                          value={bedId}
                          onChange={(e) => setBedId(e.target.value)}
                          className="w-full p-2.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
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
                  <label className="text-xs font-bold text-slate-700">Monthly Rent Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={rentAmount}
                    onChange={(e) => setRentAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                  <span className="text-[10px] text-slate-500 font-semibold block">
                    Base rent for room configuration: ₹{rooms.find((r) => r.id === roomId)?.rent || 0}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Security Deposit Collected (₹)</label>
                  <input
                    type="number"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Check-in Date</label>
                  <input
                    type="date"
                    required
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* STEP 4: Summary & Confirm */}
            {step === 4 && (
              <div className="space-y-4 py-2 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <h5 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5">Onboarding Confirmation</h5>
                  <div className="grid grid-cols-2 gap-y-2 pt-1">
                    <span className="text-slate-600 font-semibold">Tenant Name:</span>
                    <span className="text-slate-900 font-bold">{name}</span>
                    
                    <span className="text-slate-600 font-semibold">Contact Phone:</span>
                    <span className="text-slate-900 font-bold">{phone}</span>

                    <span className="text-slate-600 font-semibold">Allocated Location:</span>
                    <span className="text-indigo-600 font-bold">Room {getRoomNumber(roomId)} (Bed {bedId.split("-").pop()})</span>

                    <span className="text-slate-600 font-semibold">Monthly Rent:</span>
                    <span className="text-emerald-600 font-extrabold">₹{rentAmount}</span>

                    <span className="text-slate-600 font-semibold">Security Deposit:</span>
                    <span className="text-slate-700 font-bold">₹{securityDeposit}</span>

                    <span className="text-slate-600 font-semibold">Check-in Date:</span>
                    <span className="text-slate-900 font-bold">{checkInDate}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-amber-700 bg-amber-50 p-3.5 border border-amber-200 rounded-xl">
                  <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
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
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCloseWizard}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOnboardSubmit}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <UserCheck className="w-4 h-4" />
                  Confirm & Save
                </button>
              )}
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
