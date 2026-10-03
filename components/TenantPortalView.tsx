"use client";

import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { dbService, Tenant, BillingRecord, Room, Property } from "../lib/db";
import { 
  Building2, 
  LogOut, 
  FileText, 
  IndianRupee, 
  MapPin, 
  Clock, 
  Download,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Calendar,
  Printer,
  Check
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

import ModalOverlay from "./ui/ModalOverlay";
interface TenantPortalProps {
  user: User;
}

export default function TenantPortalView({ user }: TenantPortalProps) {
  const { logout } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [billing, setBilling] = useState<BillingRecord[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<BillingRecord | null>(null);

  useEffect(() => {
    const fetchTenantData = async () => {
      setLoading(true);
      setError(null);
      try {
        const phone = user.phoneNumber || "";
        const foundTenant = await dbService.getTenantByPhone(phone);
        
        if (!foundTenant) {
          setError("No active tenant record found for this phone number. Please contact your PG manager.");
          setLoading(false);
          return;
        }

        setTenant(foundTenant);

        // Fetch property details
        const properties = await dbService.getProperties();
        const foundProperty = properties.find(p => p.id === foundTenant.propertyId);
        setProperty(foundProperty || null);

        // Fetch room details
        const rooms = await dbService.getRooms(foundTenant.propertyId);
        const foundRoom = rooms.find(r => r.id === foundTenant.roomId);
        setRoom(foundRoom || null);

        // Fetch billing records
        const allBills = await dbService.getBilling(foundTenant.propertyId);
        const tenantBills = allBills.filter(b => b.tenantId === foundTenant.id);
        setBilling(tenantBills);

      } catch (err: any) {
        console.error("Error fetching tenant data:", err);
        setError("Failed to load your portal data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTenantData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-700">Loading Tenant Portal...</p>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4 relative">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center relative z-10 shadow-2xl">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <AlertCircle className="w-8 h-8 text-rose-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-sm text-slate-500 mb-8">{error}</p>
          <button 
            onClick={logout}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 py-3 rounded-xl text-sm font-medium transition-colors"
          >
            Sign Out & Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalDue = billing.reduce((sum, b) => sum + (b.totalAmount - b.paidAmount), 0);
  const totalPaid = billing.reduce((sum, b) => sum + b.paidAmount, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-purple-500/30 selection:text-purple-900">
      {/* Decorative Orbs */}
      <div className="fixed top-0 left-0 w-full h-64 bg-gradient-to-b from-purple-100/60 to-transparent pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 p-[1.5px]">
              <div className="w-full h-full bg-slate-50 rounded-[10px] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                {property?.name || "Study Point Group"}
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">Tenant Portal</p>
            </div>
          </div>
          
          <button 
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-100 text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 md:p-8 relative z-10 space-y-6">
        
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back, {tenant.name.split(' ')[0]} 👋</h2>
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {property?.address || "Registered PG Address"}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white shadow-sm border border-slate-200 rounded-2xl px-5 py-3">
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-1">Room No.</p>
              <p className="text-lg font-bold text-slate-900">{room?.roomNumber || "N/A"}</p>
            </div>
            <div className="bg-white shadow-sm border border-slate-200 rounded-2xl px-5 py-3">
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-1">Bed No.</p>
              <p className="text-lg font-bold text-slate-900">{tenant.bedId.split("-").pop() || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Quick Stats */}
          <div className="md:col-span-1 space-y-6">
            
            <div className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/20 rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <IndianRupee className="w-24 h-24" />
              </div>
              <p className="text-sm font-medium text-rose-600 mb-1">Total Outstanding</p>
              <h3 className="text-3xl font-bold text-slate-900 mb-4">₹{totalDue.toLocaleString()}</h3>
              <p className="text-xs text-rose-700 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                Please clear pending dues on time
              </p>
            </div>

            <div className="bg-white shadow-sm border border-slate-200 rounded-3xl p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Your Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Full Name</p>
                  <p className="text-sm text-slate-700 font-medium">{tenant.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Phone Number</p>
                  <p className="text-sm text-slate-700 font-medium">{tenant.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Check-In Date</p>
                  <p className="text-sm text-slate-700 font-medium flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    {new Date(tenant.checkInDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-500 mb-0.5">Security Deposit Paid</p>
                  <p className="text-sm text-emerald-600 font-medium">₹{tenant.securityDeposit.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Billing History */}
          <div className="md:col-span-2">
            <div className="bg-white shadow-sm border border-slate-200 rounded-3xl p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Billing History
                </h3>
              </div>

              {billing.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6 text-slate-500" />
                  </div>
                  <p className="text-slate-500 text-sm">No billing records found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {billing.map((bill) => {
                    const due = bill.totalAmount - bill.paidAmount;
                    const isFullyPaid = due === 0;

                    return (
                      <div 
                        key={bill.id} 
                        className={`p-4 rounded-2xl border transition-colors ${
                          isFullyPaid 
                            ? 'bg-emerald-50 border-emerald-200' 
                            : 'bg-rose-50 border-rose-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-slate-900 font-medium">Month: {bill.billingMonth}</h4>
                              {isFullyPaid ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider">
                                  Paid
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 uppercase tracking-wider">
                                  Pending
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">Generated on {new Date(bill.createdAt).toLocaleDateString()}</p>
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-end gap-6">
                            <div className="text-right">
                              <p className="text-xs text-slate-500 mb-0.5">Total Bill</p>
                              <p className="text-sm font-semibold text-slate-900">₹{bill.totalAmount.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500 mb-0.5">Amount Due</p>
                              <p className={`text-sm font-bold ${isFullyPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
                                ₹{due.toLocaleString()}
                              </p>
                            </div>
                            
                            <button 
                              onClick={() => setSelectedReceipt(bill)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
                              title="Download / Print Receipt"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Expandable Details Area (Static for now) */}
                        <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase">Rent</p>
                            <p className="text-xs font-medium text-slate-600">₹{bill.rentAmount}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase">Electricity</p>
                            <p className="text-xs font-medium text-slate-600">₹{bill.electricityAmount}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[10px] text-slate-500 uppercase">Units Consumed</p>
                            <p className="text-xs font-medium text-slate-600">
                              {bill.electricityUnits} units ({bill.electricityPrevReading} - {bill.electricityCurrReading})
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <ModalOverlay tone="bg-slate-900/60" onClose={() => setSelectedReceipt(null)} dismissOnBackdrop>
          <div className="bg-white text-slate-900 p-8 rounded-2xl w-full max-w-lg animate-fade-in relative space-y-6 shadow-2xl print:p-0 print:border-none print:shadow-none print:w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <h3 className="font-extrabold text-xl text-indigo-900">
                  {property?.name || "STUDY POINT GROUP"}
                </h3>
                <p className="text-xs text-slate-500">{property?.address || "PG Accommodation"}</p>
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Payment Receipt
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Receipt #{selectedReceipt.id.slice(-8).toUpperCase()}</p>
              </div>
            </div>

            {/* Resident & Month Details */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Resident Name</span>
                <span className="font-bold text-slate-900">{tenant.name}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Room {room?.roomNumber || "N/A"} - Bed {tenant.bedId.split("-").pop() || tenant.bedId}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Billing Period</span>
                <span className="font-bold text-slate-900">{selectedReceipt.billingMonth}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Issued: {new Date(selectedReceipt.createdAt).toLocaleDateString("en-IN")}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="grid grid-cols-3 bg-slate-100 font-bold p-3 border-b border-slate-200 text-slate-700">
                <span>Description</span>
                <span className="text-center">Details</span>
                <span className="text-right">Amount (₹)</span>
              </div>
              <div className="divide-y divide-slate-100">
                <div className="grid grid-cols-3 p-3 text-slate-700">
                  <span>Room Rent</span>
                  <span className="text-center text-slate-500">Monthly</span>
                  <span className="text-right font-bold text-slate-900">₹{selectedReceipt.rentAmount.toLocaleString()}</span>
                </div>
                {selectedReceipt.electricityAmount > 0 && (
                  <div className="grid grid-cols-3 p-3 text-slate-700">
                    <span>Electricity</span>
                    <span className="text-center text-slate-500">{selectedReceipt.electricityUnits} units</span>
                    <span className="text-right font-bold text-slate-900">₹{selectedReceipt.electricityAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Status</span>
                <span className={`font-bold uppercase ${
                  selectedReceipt.totalAmount - selectedReceipt.paidAmount === 0 ? "text-emerald-600" : "text-amber-600"
                }`}>
                  {selectedReceipt.totalAmount - selectedReceipt.paidAmount === 0 ? "Fully Paid" : "Balance Due"}
                </span>
              </div>
              <div className="text-right space-y-1">
                <div className="flex gap-4 justify-between text-slate-500">
                  <span>Total Amount:</span>
                  <span className="font-bold text-slate-900">₹{selectedReceipt.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex gap-4 justify-between text-emerald-600 font-bold">
                  <span>Paid Amount:</span>
                  <span>₹{selectedReceipt.paidAmount.toLocaleString()}</span>
                </div>
                {selectedReceipt.totalAmount - selectedReceipt.paidAmount > 0 && (
                  <div className="flex gap-4 justify-between text-rose-600 font-bold pt-1 border-t">
                    <span>Balance Due:</span>
                    <span>₹{(selectedReceipt.totalAmount - selectedReceipt.paidAmount).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Print & Close */}
            <div className="flex gap-2.5 print:hidden pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Print / Save PDF
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
