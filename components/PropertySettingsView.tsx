import React, { useState } from "react";
import { Property } from "../lib/db";
import { Building2, Plus, Edit2, Check, X, Image as ImageIcon } from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";

interface PropertySettingsViewProps {
  properties: Property[];
  selectedPropertyId: string | null;
  onAddProperty: (property: Property) => void;
  onUpdateProperty: (id: string, property: Property) => void;
  user: FirebaseUser | null;
}

export default function PropertySettingsView({ 
  properties, 
  selectedPropertyId, 
  onAddProperty, 
  onUpdateProperty,
  user
}: PropertySettingsViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const resetForm = () => {
    setName("");
    setAddress("");
    setLogoUrl("");
    setIsAdding(false);
    setEditingId(null);
  };

  const startEdit = (p: Property) => {
    setName(p.name);
    setAddress(p.address || "");
    setLogoUrl(p.logoUrl || "");
    setEditingId(p.id);
    setIsAdding(false);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    if (editingId) {
      const existing = properties.find(p => p.id === editingId);
      if (existing) {
        onUpdateProperty(editingId, {
          ...existing,
          name,
          address,
          logoUrl
        });
      }
    } else {
      const newProperty: Property = {
        id: `prop-${Date.now()}`,
        name,
        address,
        logoUrl,
        adminId: user?.uid || "admin",
        createdAt: new Date().toISOString()
      };
      onAddProperty(newProperty);
    }
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Properties</h2>
          <p className="text-sm text-slate-400 mt-1">Manage your multiple PG buildings or branches.</p>
        </div>
        {!isAdding && !editingId && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Property
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {(isAdding || editingId) && (
        <div className="glass-card p-6 rounded-xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
          <h3 className="text-lg font-bold text-white mb-4">
            {editingId ? "Edit Property" : "Add New Property"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Property Name *</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Serenity Stayz Boys PG"
                className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Logo URL (Optional)</label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-500" />
                <input 
                  type="text" 
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Address</label>
              <textarea 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main Street..."
                rows={2}
                className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button 
              onClick={resetForm}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={!name.trim()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Check className="w-4 h-4" />
              Save Property
            </button>
          </div>
        </div>
      )}

      {/* Property List */}
      {!isAdding && !editingId && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-slate-900/30 rounded-xl border border-slate-800/50 border-dashed">
              <Building2 className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p>No properties found. Add your first property to get started.</p>
            </div>
          ) : (
            properties.map((p) => (
              <div 
                key={p.id} 
                className={`glass-card p-5 rounded-xl border transition-all ${
                  p.id === selectedPropertyId 
                    ? "border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/20" 
                    : "border-slate-800/60 hover:border-slate-700"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center overflow-hidden">
                    {p.logoUrl ? (
                      <img src={p.logoUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-6 h-6 text-indigo-400" />
                    )}
                  </div>
                  <button 
                    onClick={() => startEdit(p)}
                    className="p-2 bg-slate-800/50 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-bold text-lg text-white truncate">{p.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 min-h-[32px]">
                  {p.address || "No address provided"}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-500">
                    Created: {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                  {p.id === selectedPropertyId && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md uppercase tracking-wider">
                      Active
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
