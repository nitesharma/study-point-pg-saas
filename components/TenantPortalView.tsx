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
  Calendar
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

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
      <div className="min-h-screen bg-[#0d0d0f] text-zinc-100 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-200">Loading Tenant Portal...</p>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-[#0d0d0f] text-zinc-100 flex flex-col items-center justify-center p-4 relative">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="bg-[#18181b]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md w-full text-center relative z-10 shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <AlertCircle className="w-8 h-8 text-rose-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-sm text-zinc-400 mb-8">{error}</p>
          <button 
            onClick={logout}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl text-sm font-medium transition-colors"
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
    <div className="min-h-screen bg-[#0d0d0f] text-zinc-100 selection:bg-purple-500/30 selection:text-purple-200">
      {/* Decorative Orbs */}
      <div className="fixed top-0 left-0 w-full h-64 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#121215]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 p-[1.5px]">
              <div className="w-full h-full bg-[#121215] rounded-[10px] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">
                {property?.name || "Serenity Stayz"}
              </h1>
              <p className="text-[11px] text-zinc-400 font-medium">Tenant Portal</p>
            </div>
          </div>
          
          <button 
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 text-sm text-zinc-400 hover:text-white transition-colors"
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
            <h2 className="text-2xl font-bold text-white mb-1">Welcome back, {tenant.name.split(' ')[0]} 👋</h2>
            <p className="text-sm text-zinc-400 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {property?.address || "Registered PG Address"}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-[#18181b] border border-white/10 rounded-2xl px-5 py-3">
              <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider mb-1">Room No.</p>
              <p className="text-lg font-bold text-white">{room?.roomNumber || "N/A"}</p>
            </div>
            <div className="bg-[#18181b] border border-white/10 rounded-2xl px-5 py-3">
              <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider mb-1">Bed No.</p>
              <p className="text-lg font-bold text-white">{tenant.bedId.split('-')[1] || "N/A"}</p>
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
              <p className="text-sm font-medium text-rose-400 mb-1">Total Outstanding</p>
              <h3 className="text-3xl font-bold text-white mb-4">₹{totalDue.toLocaleString()}</h3>
              <p className="text-xs text-rose-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                Please clear pending dues on time
              </p>
            </div>

            <div className="bg-[#18181b] border border-white/10 rounded-3xl p-6">
              <h3 className="text-base font-semibold text-white mb-4">Your Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-zinc-500 mb-0.5">Full Name</p>
                  <p className="text-sm text-zinc-200 font-medium">{tenant.name}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-0.5">Phone Number</p>
                  <p className="text-sm text-zinc-200 font-medium">{tenant.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-0.5">Check-In Date</p>
                  <p className="text-sm text-zinc-200 font-medium flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-zinc-400" />
                    {new Date(tenant.checkInDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="pt-4 border-t border-white/5">
                  <p className="text-xs text-zinc-500 mb-0.5">Security Deposit Paid</p>
                  <p className="text-sm text-emerald-400 font-medium">₹{tenant.securityDeposit.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Billing History */}
          <div className="md:col-span-2">
            <div className="bg-[#18181b] border border-white/10 rounded-3xl p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  Billing History
                </h3>
              </div>

              {billing.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6 text-zinc-500" />
                  </div>
                  <p className="text-zinc-400 text-sm">No billing records found.</p>
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
                            ? 'bg-emerald-500/5 border-emerald-500/10' 
                            : 'bg-rose-500/5 border-rose-500/10'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-white font-medium">Month: {bill.billingMonth}</h4>
                              {isFullyPaid ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 uppercase tracking-wider">
                                  Paid
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 uppercase tracking-wider">
                                  Pending
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-400">Generated on {new Date(bill.createdAt).toLocaleDateString()}</p>
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-end gap-6">
                            <div className="text-right">
                              <p className="text-xs text-zinc-500 mb-0.5">Total Bill</p>
                              <p className="text-sm font-semibold text-white">₹{bill.totalAmount.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-zinc-500 mb-0.5">Amount Due</p>
                              <p className={`text-sm font-bold ${isFullyPaid ? 'text-emerald-400' : 'text-rose-400'}`}>
                                ₹{due.toLocaleString()}
                              </p>
                            </div>
                            
                            <button 
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                              title="Download Receipt"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Expandable Details Area (Static for now) */}
                        <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div>
                            <p className="text-[10px] text-zinc-500 uppercase">Rent</p>
                            <p className="text-xs font-medium text-zinc-300">₹{bill.rentAmount}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-zinc-500 uppercase">Electricity</p>
                            <p className="text-xs font-medium text-zinc-300">₹{bill.electricityAmount}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[10px] text-zinc-500 uppercase">Units Consumed</p>
                            <p className="text-xs font-medium text-zinc-300">
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
    </div>
  );
}
