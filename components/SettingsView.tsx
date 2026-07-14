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
  Info
} from "lucide-react";
import { DEFAULT_FIREBASE_CONFIG } from "../lib/firebase";

interface SettingsViewProps {
  isFirebase: boolean;
  onToggleDbMode: (mode: "firebase" | "mock") => void;
  onResetMock: () => void;
  onForceSeedFirestore: () => Promise<void>;
}

export default function SettingsView({ isFirebase, onToggleDbMode, onResetMock, onForceSeedFirestore }: SettingsViewProps) {
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
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          System Configuration
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Configure connection endpoints, review Firestore schema and secure firestore rules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Connection Setup */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-2 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <Database className="w-5 h-5 text-indigo-400" />
            Backend Connection Manager
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-2">Select Active Database</label>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-1.5 flex max-w-sm">
                <button
                  onClick={() => onToggleDbMode("firebase")}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all ${
                    isFirebase
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                      : "text-slate-400 hover:text-slate-205"
                  }`}
                >
                  Live Firebase SDK
                </button>
                <button
                  onClick={() => onToggleDbMode("mock")}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all ${
                    !isFirebase
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                      : "text-slate-400 hover:text-slate-205"
                  }`}
                >
                  Mock LocalStorage
                </button>
              </div>
            </div>

            {/* Config Fields */}
            {isFirebase && (
              <form onSubmit={handleSaveConfig} className="space-y-4 border-t border-slate-800/80 pt-4 animate-fade-in">
                <div className="flex items-center gap-2 text-xs text-emerald-450 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
                  <CloudCheck className="w-4 h-4 shrink-0" />
                  <p>Connected to Firebase application serenity-stayz. Configured with user credentials.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Firebase API Key</label>
                    <input
                      type="text"
                      value={config.apiKey}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      className="w-full p-2.5 rounded-xl text-xs glass-input font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Project ID</label>
                    <input
                      type="text"
                      value={config.projectId}
                      onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
                      className="w-full p-2.5 rounded-xl text-xs glass-input font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Auth Domain</label>
                    <input
                      type="text"
                      value={config.authDomain}
                      onChange={(e) => setConfig({ ...config, authDomain: e.target.value })}
                      className="w-full p-2.5 rounded-xl text-xs glass-input font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">App ID</label>
                    <input
                      type="text"
                      value={config.appId}
                      onChange={(e) => setConfig({ ...config, appId: e.target.value })}
                      className="w-full p-2.5 rounded-xl text-xs glass-input font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 gap-4">
                  <button
                    type="button"
                    disabled={seeding}
                    onClick={triggerSeed}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-amber-400 border border-amber-500/20 hover:border-amber-500/40 rounded-xl text-xs font-semibold transition-all flex items-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${seeding ? "animate-spin" : ""}`} />
                    {seeding ? "Seeding..." : "Seed Demo Sample Data"}
                  </button>

                  
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20"
                  >
                    Save Changes & Reload
                  </button>
                </div>
              </form>
            )}

            {!isFirebase && (
              <div className="space-y-4 border-t border-slate-800/80 pt-4 animate-fade-in">
                <div className="flex items-start gap-3 text-xs text-amber-500 bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl">
                  <Info className="w-5 h-5 shrink-0" />
                  <p className="leading-relaxed">
                    You are in Mock Mode. All edits are stored inside this browser's LocalStorage. To inspect live changes across devices or save persistently, enable the Live Firebase SDK mode.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("This will erase all tenants, rooms and logs created in Mock Mode and reset to the seed details. Proceed?")) {
                      onResetMock();
                      alert("Database sandbox wiped. Reloading...");
                      window.location.reload();
                    }
                  }}
                  className="px-4 py-2.5 bg-rose-500/15 hover:bg-rose-500 border border-rose-500/30 hover:border-rose-600 text-rose-450 hover:text-white rounded-xl text-xs font-semibold transition-all"
                >
                  Factory Reset Local Database
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Security Rules & Schema info */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              Recommended Security Rules
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              When launching a live database in Firebase Console, paste this snippet inside your Firestore Rules tab to allow read/write permissions for rooms, tenants, billing and logs.
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 relative group">
              <button
                onClick={copyRules}
                className="absolute top-2.5 right-2.5 p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-all"
                title="Copy rules code"
              >
                {copiedRule ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <pre className="text-[10px] text-indigo-300 font-mono overflow-x-auto leading-relaxed max-h-52 select-all">
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
