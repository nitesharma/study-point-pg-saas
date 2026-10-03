"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import DashboardView from "../../components/DashboardView";
import RoomsView from "../../components/RoomsView";
import TenantsView from "../../components/TenantsView";
import BillingView from "../../components/BillingView";
import SecurityView from "../../components/SecurityView";
import SettingsView from "../../components/SettingsView";
import PropertySettingsView from "../../components/PropertySettingsView";
import AssetsView from "../../components/AssetsView";
import FinesView from "../../components/FinesView";
import StaffView from "../../components/StaffView";
import FinanceView from "../../components/FinanceView";
import CatalogueView from "../../components/CatalogueView";
import { 
  dbService, 
  Room, 
  Tenant, 
  BillingRecord, 
  SecurityLog, 
  Property, 
  Asset,
  Fine,
  Staff,
  StaffAttendance,
  StaffAdvance,
  Expense
} from "../../lib/db";
import { CloudLightning, Loader2, ShieldCheck, Building2, Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import LoginView from "../../components/LoginView";
import TenantPortalView from "../../components/TenantPortalView";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [isFirebase, setIsFirebase] = useState(true);

  // Core Data States
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [billing, setBilling] = useState<BillingRecord[]>([]);
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  
  // Phase 4 States
  const [fines, setFines] = useState<Fine[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<StaffAttendance[]>([]);
  const [advances, setAdvances] = useState<StaffAdvance[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Inter-view communication (Onboarding Preselection)
  const [preselectedRoomId, setPreselectedRoomId] = useState<string | null>(null);
  const [preselectedBedId, setPreselectedBedId] = useState<string | null>(null);

  // 1. Initialize and load properties
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mode = localStorage.getItem("pg_db_mode");
      if (mode === null) {
        localStorage.setItem("pg_db_mode", "firebase");
        setIsFirebase(true);
      } else {
        setIsFirebase(mode === "firebase");
      }
    }

    if (!user) return; // Do not fetch properties if not logged in

    const initDb = async () => {
      setLoading(true);
      try {
        await dbService.init();
        const props = await dbService.getProperties();
        setProperties(props);
        
        // Auto-select first property if none selected
        if (props.length > 0 && !selectedPropertyId) {
          setSelectedPropertyId(props[0].id);
        } else if (props.length === 0) {
          setCurrentView("properties"); // Force them to create a property
        }
      } catch (error) {
        console.error("Error initializing DB: ", error);
      } finally {
        setLoading(false);
      }
    };

    initDb();
  }, [isFirebase, user]);

  // 2. Load Active Property Data
  useEffect(() => {
    if (!selectedPropertyId) return;

    const loadPropertyData = async () => {
      setLoading(true);
      try {
        const rData = await dbService.getRooms(selectedPropertyId);
        const tData = await dbService.getTenants(selectedPropertyId);
        const bData = await dbService.getBilling(selectedPropertyId);
        const lData = await dbService.getSecurityLogs(selectedPropertyId);
        const aData = await dbService.getAssets(selectedPropertyId);
        const fData = await dbService.getFines(selectedPropertyId);
        const sData = await dbService.getStaff(selectedPropertyId);
        const attData = await dbService.getStaffAttendance(selectedPropertyId);
        const advData = await dbService.getStaffAdvances(selectedPropertyId);
        const expData = await dbService.getExpenses(selectedPropertyId);

        setRooms(rData);
        setTenants(tData);
        setBilling(bData);
        setLogs(lData);
        setAssets(aData);
        setFines(fData);
        setStaff(sData);
        setAttendance(attData);
        setAdvances(advData);
        setExpenses(expData);
      } catch (error) {
        console.error("Error loading property data: ", error);
      } finally {
        setLoading(false);
      }
    };

    loadPropertyData();
  }, [selectedPropertyId, isFirebase]);

  // View Refresh Helpers
  const refreshProperties = async () => {
    const p = await dbService.getProperties();
    setProperties(p);
    if (p.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(p[0].id);
      setCurrentView("dashboard");
    }
  };

  const refreshRooms = async () => {
    if(!selectedPropertyId) return;
    setRooms(await dbService.getRooms(selectedPropertyId));
  };

  const refreshTenants = async () => {
    if(!selectedPropertyId) return;
    setTenants(await dbService.getTenants(selectedPropertyId));
  };

  const refreshBilling = async () => {
    if(!selectedPropertyId) return;
    setBilling(await dbService.getBilling(selectedPropertyId));
  };

  const refreshLogs = async () => {
    if(!selectedPropertyId) return;
    setLogs(await dbService.getSecurityLogs(selectedPropertyId));
  };

  const refreshAssets = async () => {
    if(!selectedPropertyId) return;
    setAssets(await dbService.getAssets(selectedPropertyId));
  };

  const refreshFines = async () => {
    if(!selectedPropertyId) return;
    setFines(await dbService.getFines(selectedPropertyId));
  };

  const refreshStaffData = async () => {
    if(!selectedPropertyId) return;
    setStaff(await dbService.getStaff(selectedPropertyId));
    setAttendance(await dbService.getStaffAttendance(selectedPropertyId));
    setAdvances(await dbService.getStaffAdvances(selectedPropertyId));
  };

  const refreshExpenses = async () => {
    if(!selectedPropertyId) return;
    setExpenses(await dbService.getExpenses(selectedPropertyId));
  };

  // CRUD handlers
  const handleAddProperty = async (property: Property) => {
    await dbService.addProperty(property);
    await refreshProperties();
    setSelectedPropertyId(property.id);
    setCurrentView("dashboard");
  };

  const handleUpdateProperty = async (propertyId: string, updatedProperty: Property) => {
    await dbService.updateProperty(propertyId, updatedProperty);
    await refreshProperties();
  };

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

  const handleCheckoutTenant = async (
    tenantId: string,
    settlement?: {
      checkOutDate?: string;
      depositRefunded?: number;
      settlementNotes?: string;
    }
  ) => {
    await dbService.checkoutTenant(tenantId, settlement);
    await refreshTenants();
    await refreshRooms();
  };

  const handleUpdateTenant = async (tenantId: string, updated: Partial<Tenant>) => {
    await dbService.updateTenant(tenantId, updated);
    await refreshTenants();
  };

  const handleDeleteTenant = async (tenantId: string) => {
    await dbService.deleteTenant(tenantId);
    await refreshTenants();
    await refreshRooms();
  };

  const handleDeleteRoom = async (roomId: string) => {
    await dbService.deleteRoom(roomId);
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

  const handleAddAsset = async (asset: Asset) => {
    await dbService.addAsset(asset);
    await refreshAssets();
  };

  const handleUpdateAsset = async (assetId: string, updatedAsset: Asset) => {
    await dbService.updateAsset(assetId, updatedAsset);
    await refreshAssets();
  };

  const handleDeleteAsset = async (assetId: string) => {
    await dbService.deleteAsset(assetId);
    await refreshAssets();
  };

  // Phase 4 Handlers
  const handleAddFine = async (fine: Fine) => {
    await dbService.addFine(fine);
    await refreshFines();
  };

  const handleUpdateFineStatus = async (fineId: string, status: "paid" | "unpaid") => {
    await dbService.updateFineStatus(fineId, status);
    await refreshFines();
  };

  const handleAddStaff = async (newStaff: Staff) => {
    await dbService.addStaff(newStaff);
    await refreshStaffData();
  };

  const handleUpdateStaff = async (staffId: string, updatedStaff: Staff) => {
    await dbService.updateStaff(staffId, updatedStaff);
    await refreshStaffData();
  };

  const handleAddStaffAttendance = async (att: StaffAttendance) => {
    await dbService.addStaffAttendance(att);
    await refreshStaffData();
  };

  const handleAddStaffAdvance = async (adv: StaffAdvance) => {
    await dbService.addStaffAdvance(adv);
    await refreshStaffData();
  };

  const handleAddExpense = async (exp: Expense) => {
    await dbService.addExpense(exp);
    await refreshExpenses();
  };

  const handleToggleDbMode = (mode: "firebase" | "mock") => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pg_db_mode", mode);
      setIsFirebase(mode === "firebase");
    }
  };

  const handleResetMock = () => {
    dbService.clearAllMockData();
    window.location.reload();
  };

  const handleFactoryReset = async () => {
    await dbService.factoryResetAllData();
    window.location.reload();
  };

  const handleForceSeedFirestore = async () => {
    if (isFirebase) {
      await dbService.forceSeedFirestore(); 
      await refreshProperties();
      await refreshRooms();
      await refreshTenants();
      await refreshBilling();
      await refreshLogs();
      await refreshAssets();
      await refreshFines();
      await refreshStaffData();
      await refreshExpenses();
    }
  };

  const handleTriggerOnboardFromRoom = (roomId: string, bedId: string) => {
    setPreselectedRoomId(roomId);
    setPreselectedBedId(bedId);
    setCurrentView("tenants");
  };

  // Render view based on navigation state
  const renderActiveView = () => {
    if (properties.length === 0 && currentView !== "properties") {
      return (
        <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">No Properties Found</h2>
            <p className="text-slate-500 text-sm mb-6">Create your first property to start managing your PG.</p>
            <button 
              onClick={() => setCurrentView("properties")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Create Property
            </button>
          </div>
        </div>
      );
    }

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
            onDeleteRoom={handleDeleteRoom}
            onOpenOnboard={handleTriggerOnboardFromRoom}
            selectedPropertyId={selectedPropertyId!}
          />
        );
      case "tenants":
        return (
          <TenantsView
            tenants={tenants}
            rooms={rooms}
            billing={billing}
            onOnboard={handleOnboardTenant}
            onCheckout={handleCheckoutTenant}
            onUpdateTenant={handleUpdateTenant}
            onDeleteTenant={handleDeleteTenant}
            preselectedRoomId={preselectedRoomId}
            preselectedBedId={preselectedBedId}
            onClearPreselect={() => {
              setPreselectedRoomId(null);
              setPreselectedBedId(null);
            }}
            selectedPropertyId={selectedPropertyId!}
          />
        );
      case "billing":
        return (
          <BillingView
            billing={billing}
            tenants={tenants}
            rooms={rooms}
            onAddBilling={handleAddBilling}
            onUpdateBillPayment={handleUpdateBillPayment}
            selectedPropertyId={selectedPropertyId!}
          />
        );
      case "security":
        return (
          <SecurityView
            logs={logs}
            tenants={tenants}
            onAddLog={handleAddSecurityLog}
            onUpdateLogStatus={handleUpdateLogStatus}
            selectedPropertyId={selectedPropertyId!}
          />
        );
      case "assets":
        return (
          <AssetsView 
            assets={assets}
            rooms={rooms}
            onAddAsset={handleAddAsset}
            onUpdateAsset={handleUpdateAsset}
            onDeleteAsset={handleDeleteAsset}
            selectedPropertyId={selectedPropertyId!}
          />
        );
      case "fines":
        return (
          <FinesView
            fines={fines}
            tenants={tenants}
            onAddFine={handleAddFine}
            onUpdateFineStatus={handleUpdateFineStatus}
            selectedPropertyId={selectedPropertyId!}
          />
        );
      case "staff":
        return (
          <StaffView
            staff={staff}
            attendance={attendance}
            advances={advances}
            onAddStaff={handleAddStaff}
            onUpdateStaff={handleUpdateStaff}
            onAddAttendance={handleAddStaffAttendance}
            onAddAdvance={handleAddStaffAdvance}
            selectedPropertyId={selectedPropertyId!}
          />
        );
      case "finance":
        return (
          <FinanceView
            expenses={expenses}
            billing={billing}
            fines={fines}
            onAddExpense={handleAddExpense}
            selectedPropertyId={selectedPropertyId!}
          />
        );
      case "catalogue":
        return (
          <CatalogueView
            properties={properties}
            selectedPropertyId={selectedPropertyId!}
            rooms={rooms}
          />
        );
      case "properties":
        return (
          <PropertySettingsView 
            properties={properties}
            selectedPropertyId={selectedPropertyId}
            onAddProperty={handleAddProperty}
            onUpdateProperty={handleUpdateProperty}
            user={user}
          />
        );
      case "settings":
        return (
          <SettingsView
            isFirebase={isFirebase}
            onToggleDbMode={handleToggleDbMode}
            onResetMock={handleResetMock}
            onForceSeedFirestore={handleForceSeedFirestore}
            onFactoryReset={handleFactoryReset}
          />
        );
      default:
        return <div className="text-slate-500 text-sm">View not found.</div>;
    }
  };

  // Auth Guard
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 p-0.5 flex items-center justify-center shadow-sm">
            <div className="w-full h-full bg-slate-50 rounded-[14px] flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-900">Verifying secure session...</p>
            <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Checking PG Manager credentials</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const isTenant = user.providerData.some((p: any) => p.providerId === "phone");

  if (isTenant) {
    return <TenantPortalView user={user} />;
  }

  const activeProperty = properties.find(p => p.id === selectedPropertyId);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center gap-2.5 min-w-0">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              {activeProperty?.logoUrl ? (
                <img src={activeProperty.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <Building2 className="w-4 h-4 text-indigo-600" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 truncate">
                {activeProperty?.name || "Study Point PG"}
              </h1>
              <p className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider">
                {currentView.toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        isFirebase={isFirebase}
        properties={properties}
        selectedPropertyId={selectedPropertyId}
        onPropertyChange={setSelectedPropertyId}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main View Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full z-10 bg-slate-50">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <div className="text-center">
              <p className="text-sm font-bold text-slate-900">Connecting to Backend...</p>
              <p className="text-xs text-slate-500 mt-1">Syncing with Firestore</p>
            </div>
          </div>
        ) : (
          renderActiveView()
        )}
      </main>
    </div>
  );
}
