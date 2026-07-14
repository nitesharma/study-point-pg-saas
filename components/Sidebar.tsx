"use client";

import React from "react";
import { 
  LayoutDashboard, 
  Home as HomeIcon, 
  Users, 
  Receipt, 
  ShieldAlert, 
  Settings as SettingsIcon,
  Database,
  CloudLightning,
  LogOut,
  UserCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  isFirebase: boolean;
}

export default function Sidebar({ currentView, onViewChange, isFirebase }: SidebarProps) {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "rooms", label: "Rooms & Beds", icon: HomeIcon },
    { id: "tenants", label: "Tenants", icon: Users },
    { id: "billing", label: "Rent & Electricity", icon: Receipt },
    { id: "security", label: "Security & Complaints", icon: ShieldAlert },
    { id: "settings", label: "System Settings", icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 shrink-0">
      {/* Top Logo */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-violet-600 to-indigo-500 p-2.5 rounded-xl shadow-lg shadow-indigo-500/30">
            <CloudLightning className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Serenity Stayz
            </h1>
            <span className="text-xs font-semibold text-indigo-400 tracking-wider uppercase">
              PG Management
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-1.5 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-indigo-600/20 text-indigo-300 border-l-4 border-indigo-500 shadow-inner"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-350"
                }`}
              />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Database Mode Status */}
      <div className="p-4 border-t border-slate-800">
        <div className="glass-card-no-hover p-4 rounded-xl bg-slate-900/50 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold tracking-wide uppercase">
              Connection
            </span>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isFirebase ? "bg-emerald-400" : "bg-cyan-400"
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                isFirebase ? "bg-emerald-500" : "bg-cyan-500"
              }`}></span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Database className={`w-4 h-4 ${isFirebase ? "text-emerald-400" : "text-cyan-400"}`} />
            <span className="text-sm font-medium text-slate-200">
              {isFirebase ? "Firebase DB Live" : "Local Mock Database"}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal">
            {isFirebase 
              ? "Syncing real-time updates to serenity-stayz Firestore." 
              : "Running in sandbox mode. Changes saved locally."}
          </p>
        </div>

        {/* User Account / Log Out Bar */}
        {user && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user.displayName ? user.displayName[0].toUpperCase() : user.email ? user.email[0].toUpperCase() : "A"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {user.displayName || "Administrator"}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

