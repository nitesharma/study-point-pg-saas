"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import DashboardView from "../components/DashboardView";
import RoomsView from "../components/RoomsView";
import TenantsView from "../components/TenantsView";
import BillingView from "../components/BillingView";
import SecurityView from "../components/SecurityView";
import SettingsView from "../components/SettingsView";
import { dbService, Room, Tenant, BillingRecord, SecurityLog } from "../lib/db";
import { CloudLightning, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import LoginView from "../components/LoginView";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [isFirebase, setIsFirebase] = useState(true);

  // Core Data States
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [billing, setBilling] = useState<BillingRecord[]>([]);
  const [logs, setLogs] = useState<SecurityLog[]>([]);

  // Inter-view communication (Onboarding Preselection)
  const [preselectedRoomId, setPreselectedRoomId] = useState<string | null>(null);
  const [preselectedBedId, setPreselectedBedId] = useState<string | null>(null);

  // Initialize and load data
  useEffect(() => {
    // Determine active DB Mode from LocalStorage
    if (typeof window !== "undefined") {
      const mode = localStorage.getItem("pg_db_mode");
      // Default to firebase as requested by the user, if not set
      if (mode === null) {
        localStorage.setItem("pg_db_mode", "firebase");
        setIsFirebase(true);
      } else {
        setIsFirebase(mode === "firebase");
      }
    }

    const loadData = async () => {
      setLoading(true);
      try {
        // Initialize database (seeding if empty)
        await dbService.init();

        // Fetch data
        const rData = await dbService.getRooms();
        const tData = await dbService.getTenants();
        const bData = await dbService.getBilling();
        const lData = await dbService.getSecurityLogs();

        setRooms(rData);
        setTenants(tData);
        setBilling(bData);
        setLogs(lData);
      } catch (error) {
        console.error("Error loading database records: ", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isFirebase]);

  // View Refresh Helpers
  const refreshRooms = async () => {
    const r = await dbService.getRooms();
    setRooms(r);
  };

  const refreshTenants = async () => {
    const t = await dbService.getTenants();
    setTenants(t);
  };

  const refreshBilling = async () => {
    const b = await dbService.getBilling();
    setBilling(b);
  };

  const refreshLogs = async () => {
    const l = await dbService.getSecurityLogs();
    setLogs(l);
  };

  // CRUD handlers
  const handleAddRoom = async (room: Room) => {
    await dbService.addRoom(room);
    await refreshRooms();
  };

  const handleUpdateRoom = async (roomId: string, updatedRoom: Room) => {
    await dbService.updateRoom(roomId, updatedRoom);
    await refreshRooms();
  };

  const handleOnboardTenant = async (tenant: Tenant) => {
    await dbService.onboardTenant(tenant);
    await refreshTenants();
    await refreshRooms();
  };

  const handleCheckoutTenant = async (tenantId: string) => {
    await dbService.checkoutTenant(tenantId);
    await refreshTenants();
    await refreshRooms();
  };

  const handleAddBilling = async (bill: BillingRecord) => {
    await dbService.addBilling(bill);
    await refreshBilling();
  };

  const handleUpdateBillPayment = async (
    billId: string,
    type: "rent" | "electricity" | "both",
    paidAmount: number,
    date: string
  ) => {
    await dbService.updateBillPaymentStatus(billId, type, paidAmount, date);
    await refreshBilling();
  };

  const handleAddSecurityLog = async (log: SecurityLog) => {
    await dbService.addSecurityLog(log);
    await refreshLogs();
  };

  const handleUpdateLogStatus = async (logId: string, status: "approved" | "resolved") => {
    await dbService.updateSecurityLogStatus(logId, status);
    await refreshLogs();
  };

  const handleToggleDbMode = (mode: "firebase" | "mock") => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pg_db_mode", mode);
      setIsFirebase(mode === "firebase");
    }
  };

  const handleResetMock = () => {
    dbService.clearAllMockData();
  };

  const handleForceSeedFirestore = async () => {
    if (isFirebase) {
      await dbService.forceSeedFirestore(); // explicitly runs seed when clicked in settings
      await refreshRooms();
      await refreshTenants();
      await refreshBilling();
      await refreshLogs();
    }
  };

  // Navigate to Tenants Onboarding Wizard with bed preallocated
  const handleTriggerOnboardFromRoom = (roomId: string, bedId: string) => {
    setPreselectedRoomId(roomId);
    setPreselectedBedId(bedId);
    setCurrentView("tenants");
  };

  // Render view based on navigation state
  const renderActiveView = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <DashboardView
            rooms={rooms}
            tenants={tenants}
            billing={billing}
            logs={logs}
            onViewChange={setCurrentView}
          />
        );
      case "rooms":
        return (
          <RoomsView
            rooms={rooms}
            tenants={tenants}
            onAddRoom={handleAddRoom}
            onUpdateRoom={handleUpdateRoom}
            onOpenOnboard={handleTriggerOnboardFromRoom}
          />
        );
      case "tenants":
        return (
          <TenantsView
            tenants={tenants}
            rooms={rooms}
            onOnboard={handleOnboardTenant}
            onCheckout={handleCheckoutTenant}
            preselectedRoomId={preselectedRoomId}
            preselectedBedId={preselectedBedId}
            onClearPreselect={() => {
              setPreselectedRoomId(null);
              setPreselectedBedId(null);
            }}
          />
        );
      case "billing":
        return (
          <BillingView
            billing={billing}
            tenants={tenants}
            onAddBilling={handleAddBilling}
            onUpdateBillPayment={handleUpdateBillPayment}
          />
        );
      case "security":
        return (
          <SecurityView
            logs={logs}
            tenants={tenants}
            onAddLog={handleAddSecurityLog}
            onUpdateLogStatus={handleUpdateLogStatus}
          />
        );
      case "settings":
        return (
          <SettingsView
            isFirebase={isFirebase}
            onToggleDbMode={handleToggleDbMode}
            onResetMock={handleResetMock}
            onForceSeedFirestore={handleForceSeedFirestore}
          />
        );
      default:
        return <div className="text-white text-sm">View not found.</div>;
    }
  };

  // Auth Guard
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d0f] text-zinc-100 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-[#121215] rounded-[14px] flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-200">Verifying secure session...</p>
            <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Checking Serenity Stayz credentials</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Orbs */}
      <div className="glow-orb-purple top-10 left-10"></div>
      <div className="glow-orb-green bottom-20 right-20"></div>

      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        isFirebase={isFirebase}
      />

      {/* Main View Area */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto max-w-7xl mx-auto w-full z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <div className="text-center">
              <p className="text-sm font-bold text-slate-200">Connecting to Backend...</p>
              <p className="text-xs text-slate-500 mt-1">Syncing with serenity-stayz Firestore schema</p>
            </div>
          </div>
        ) : (
          renderActiveView()
        )}
      </main>
    </div>
  );
}
