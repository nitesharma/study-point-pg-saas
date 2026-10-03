"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings, 
  Database, 
  ShieldAlert, 
  FileCode, 
  RefreshCw, 
  CloudCheck,
  CheckCircle,
  Copy,
  Info,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { DEFAULT_FIREBASE_CONFIG } from "../lib/firebase";

interface SettingsViewProps {
  isFirebase: boolean;
  onToggleDbMode: (mode: "firebase" | "mock") => void;
  onResetMock: () => void;
  onForceSeedFirestore: () => Promise<void>;
  onFactoryReset?: () => Promise<void>;
}

export default function SettingsView({ isFirebase, onToggleDbMode, onResetMock, onForceSeedFirestore, onFactoryReset }: SettingsViewProps) {
  const [config, setConfig] = useState(DEFAULT_FIREBASE_CONFIG);
  const [copiedRule, setCopiedRule] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pg_custom_firebase_config");
      if (saved) {
        try {
          setConfig(JSON.parse(saved));
        } catch (e) {}
      }
    }
  }, []);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("pg_custom_firebase_config", JSON.stringify(config));
      alert("Firebase credentials saved! The application will reload to apply changes.");
      window.location.reload();
    }
  };

  const copyRules = () => {
    const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Production secure rules: only allow authenticated staff users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`;

    navigator.clipboard.writeText(rules);
    setCopiedRule(true);
    setTimeout(() => setCopiedRule(false), 2000);
  };

  const triggerSeed = async () => {
    if (!window.confirm("This will populate your database with sample demo rooms, tenants, and logs. Proceed?")) return;
    setSeeding(true);
    try {
      await onForceSeedFirestore();
      alert("Demo sample data seeded successfully! You can now explore or delete these sample records.");
    } catch (e) {
      alert("Failed to seed demo data. Verify your Firestore security rules.");

    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in bg-slate-50 min-h-full">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          System Configuration
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Configure connection endpoints, review Firestore schema and secure firestore rules.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Connection Setup */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl xl:col-span-2 space-y-6">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Database className="w-5 h-5 text-indigo-600" />
            Backend Connection Manager
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-2">Select Active Database</label>
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-1.5 flex max-w-sm">
                <button
                  onClick={() => onToggleDbMode("firebase")}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all ${
                    isFirebase
                      ? "bg-white text-indigo-700 shadow-sm border border-slate-200"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Live Firebase SDK
                </button>
                <button
                  onClick={() => onToggleDbMode("mock")}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all ${
                    !isFirebase
                      ? "bg-white text-indigo-700 shadow-sm border border-slate-200"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Mock LocalStorage
                </button>
              </div>
            </div>

            {/* Config Fields */}
            {isFirebase && (
              <form onSubmit={handleSaveConfig} className="space-y-4 border-t border-slate-100 pt-4 animate-fade-in">
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                  <CloudCheck className="w-4 h-4 shrink-0" />
                  <p>Connected to Firebase application studypoint-group. Configured with user credentials.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Firebase API Key</label>
                    <input
                      type="text"
                      value={config.apiKey}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      className="w-full p-2.5 rounded-xl text-xs border border-slate-200 bg-white font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Project ID</label>
                    <input
                      type="text"
                      value={config.projectId}
                      onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
                      className="w-full p-2.5 rounded-xl text-xs border border-slate-200 bg-white font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Auth Domain</label>
                    <input
                      type="text"
                      value={config.authDomain}
                      onChange={(e) => setConfig({ ...config, authDomain: e.target.value })}
                      className="w-full p-2.5 rounded-xl text-xs border border-slate-200 bg-white font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">App ID</label>
                    <input
                      type="text"
                      value={config.appId}
                      onChange={(e) => setConfig({ ...config, appId: e.target.value })}
                      className="w-full p-2.5 rounded-xl text-xs border border-slate-200 bg-white font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 gap-4">
                  <button
                    type="button"
                    disabled={seeding}
                    onClick={triggerSeed}
                    className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${seeding ? "animate-spin" : ""}`} />
                    {seeding ? "Seeding..." : "Seed Demo Sample Data"}
                  </button>

                  
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
                  >
                    Save Changes & Reload
                  </button>
                </div>
              </form>
            )}

            {!isFirebase && (
              <div className="space-y-4 border-t border-slate-100 pt-4 animate-fade-in">
                <div className="flex items-start gap-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 p-4 rounded-xl">
                  <Info className="w-5 h-5 shrink-0" />
                  <p className="leading-relaxed">
                    You are in Mock Mode. All edits are stored inside this browser's LocalStorage. To inspect live changes across devices or save persistently, enable the Live Firebase SDK mode.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone: Factory Reset (Universal across Firebase & Mock) */}
        <div className="bg-white p-6 rounded-2xl xl:col-span-2 border border-rose-200 space-y-4">
          <div className="flex items-center gap-2 text-rose-600 border-b border-rose-100 pb-3">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-900">Danger Zone: Data Wipe & Factory Reset</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Need a clean slate? This option will permanently erase <strong className="text-rose-600">ALL rooms, beds, tenants, rent/electricity bills, and security logs</strong> from your active database ({isFirebase ? "Live Firebase Firestore" : "Browser LocalStorage"}), setting the portal to zero data.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={async () => {
                if (window.confirm(`CRITICAL WARNING:\nYou are about to permanently DELETE all data (${isFirebase ? "Firestore collections" : "LocalStorage records"}) and factory reset the PG portal to zero data.\n\nAre you sure you want to proceed?`)) {
                  try {
                    await onFactoryReset?.();
                    alert("Factory Reset Complete: All data has been wiped. Your database is now completely empty (zero records).");
                  } catch (err) {
                    alert("Error performing factory reset. Please verify your connection and permissions.");
                  }
                }
              }}
              className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              Clear All Data (Factory Reset)
            </button>
            <span className="text-[11px] text-slate-500">
              * This action cannot be undone once executed.
            </span>
          </div>
        </div>

        {/* Security Rules & Schema info */}

        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              Recommended Security Rules
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              When launching a live database in Firebase Console, paste this snippet inside your Firestore Rules tab to allow read/write permissions for rooms, tenants, billing and logs.
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative group">
              <button
                onClick={copyRules}
                className="absolute top-2.5 right-2.5 p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 rounded-lg transition-all shadow-sm"
                title="Copy rules code"
              >
                {copiedRule ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
              <pre className="text-[10px] text-slate-700 font-mono overflow-x-auto leading-relaxed max-h-52 select-all">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Production secure rules: only allow authenticated staff users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`}
              </pre>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
