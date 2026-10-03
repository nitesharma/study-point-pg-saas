"use client";

import React, { useState } from "react";
import { 
  Archive, 
  Plus, 
  MapPin, 
  AlertCircle, 
  CheckCircle,
  IndianRupee,
  Calendar,
  Building2,
  Home,
  Monitor,
  Sofa,
  Cpu,
  Package
} from "lucide-react";
import { Asset, Room } from "../lib/db";

import ModalOverlay from "./ui/ModalOverlay";
interface AssetsViewProps {
  assets: Asset[];
  rooms: Room[];
  onAddAsset: (asset: Asset) => Promise<void>;
  onUpdateAsset: (assetId: string, asset: Asset) => Promise<void>;
  onDeleteAsset: (assetId: string) => Promise<void>;
  selectedPropertyId: string;
}

export default function AssetsView({ 
  assets, 
  rooms, 
  onAddAsset, 
  onUpdateAsset, 
  onDeleteAsset, 
  selectedPropertyId 
}: AssetsViewProps) {
  const [activeTab, setActiveTab] = useState<"property" | "room">("property");
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"electronics" | "furniture" | "appliance" | "other">("appliance");
  const [quantity, setQuantity] = useState(1);
  const [assignmentType, setAssignmentType] = useState<"property" | "room">("property");
  const [assignedRoomId, setAssignedRoomId] = useState("");
  const [status, setStatus] = useState<"working" | "needs_repair" | "broken">("working");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");

  const filteredAssets = assets.filter(a => a.assignmentType === activeTab);

  const totalValue = assets.reduce((sum, a) => sum + (a.cost || 0), 0);
  const needsRepairCount = assets.filter(a => a.status === "needs_repair" || a.status === "broken").length;

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "electronics": return <Monitor className="w-5 h-5" />;
      case "furniture": return <Sofa className="w-5 h-5" />;
      case "appliance": return <Cpu className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  const getRoomName = (rId: string | null) => {
    if (!rId) return "Unassigned";
    const room = rooms.find(r => r.id === rId);
    return room ? `Room ${room.roomNumber}` : "Unknown Room";
  };

  const openAddModal = () => {
    setEditingAsset(null);
    setName("");
    setCategory("appliance");
    setQuantity(1);
    setAssignmentType(activeTab);
    setAssignedRoomId("");
    setStatus("working");
    setPurchaseDate("");
    setCost("");
    setNotes("");
    setShowModal(true);
  };

  const openEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setName(asset.name);
    setCategory(asset.category);
    setQuantity(asset.quantity);
    setAssignmentType(asset.assignmentType);
    setAssignedRoomId(asset.assignedRoomId || "");
    setStatus(asset.status);
    setPurchaseDate(asset.purchaseDate || "");
    setCost(asset.cost?.toString() || "");
    setNotes(asset.notes || "");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (assignmentType === "room" && !assignedRoomId) {
      alert("Please select a room for this asset.");
      return;
    }

    const assetData: Asset = {
      id: editingAsset ? editingAsset.id : `asset-${Date.now()}`,
      propertyId: selectedPropertyId,
      name,
      category,
      quantity: Number(quantity),
      assignmentType,
      assignedRoomId: assignmentType === "room" ? assignedRoomId : null,
      status,
      purchaseDate,
      cost: cost ? Number(cost) : undefined,
      notes
    };

    if (editingAsset) {
      await onUpdateAsset(editingAsset.id, assetData);
    } else {
      await onAddAsset(assetData);
    }

    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to remove this asset?")) {
      await onDeleteAsset(id);
      setShowModal(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Assets & Inventory
          </h2>
          <p className="text-slate-500 text-sm">
            Manage property-wide appliances and room-specific furniture.
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm p-4 rounded-2xl flex-1 border border-indigo-200 bg-indigo-500/5 flex flex-col justify-center">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Total Value</p>
            <p className="text-2xl font-extrabold text-slate-900">₹{totalValue.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm p-4 rounded-2xl flex-1 border border-rose-200 bg-rose-500/5 flex flex-col justify-center">
            <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Needs Repair</p>
            <p className="text-2xl font-extrabold text-slate-900">{needsRepairCount}</p>
          </div>
        </div>
      </div>

      {/* Tabs & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-100 p-2 rounded-2xl border border-slate-200/60">
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("property")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "property" 
                ? "bg-slate-100 text-slate-900 shadow-md" 
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Property Assets
          </button>
          <button
            onClick={() => setActiveTab("room")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "room" 
                ? "bg-slate-100 text-slate-900 shadow-md" 
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Home className="w-4 h-4" />
            Room Assets
          </button>
        </div>

        <button
          onClick={openAddModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Asset
        </button>
      </div>

      {/* Asset Grid */}
      {filteredAssets.length === 0 ? (
        <div className="bg-white border border-slate-200 shadow-sm p-12 text-center text-slate-500 rounded-2xl flex flex-col items-center justify-center gap-3">
          <Archive className="w-12 h-12 text-slate-700" />
          <p>No assets found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filteredAssets.map(asset => (
            <div 
              key={asset.id} 
              onClick={() => openEditModal(asset)}
              className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 cursor-pointer hover:border-indigo-200 transition-all group relative overflow-hidden"
            >
              {/* Status Indicator */}
              <div className={`absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40 ${
                asset.status === "working" ? "bg-emerald-500" :
                asset.status === "needs_repair" ? "bg-amber-500" : "bg-rose-500"
              }`} />

              <div className="flex items-start gap-4 mb-4 relative z-10">
                <div className={`p-3 rounded-xl ${
                  asset.category === "electronics" ? "bg-blue-50 text-blue-600" :
                  asset.category === "furniture" ? "bg-amber-50 text-amber-600" :
                  asset.category === "appliance" ? "bg-purple-500/10 text-purple-600" :
                  "bg-slate-100 text-slate-500"
                }`}>
                  {getCategoryIcon(asset.category)}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h4 className="font-bold text-slate-900 truncate">{asset.name}</h4>
                  <p className="text-xs text-slate-500 capitalize">{asset.category} • Qty: {asset.quantity}</p>
                </div>
              </div>

              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Location
                  </span>
                  <span className="font-semibold text-slate-900">{getRoomName(asset.assignedRoomId)}</span>
                </div>

                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5" /> Value
                  </span>
                  <span className="font-semibold text-emerald-600">
                    {asset.cost ? `₹${asset.cost.toLocaleString()}` : "N/A"}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${
                    asset.status === "working" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                    asset.status === "needs_repair" ? "bg-amber-50 text-amber-600 border-amber-200" :
                    "bg-rose-50 text-rose-600 border-rose-200"
                  }`}>
                    {asset.status.replace("_", " ")}
                  </span>
                  
                  {asset.purchaseDate && (
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(asset.purchaseDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <ModalOverlay tone="bg-slate-900/50" onClose={() => setShowModal(false)}>
          <form 
            onSubmit={handleSubmit}
            className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-lg animate-fade-in relative shadow-xl max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Archive className="w-5 h-5 text-indigo-600" />
                  {editingAsset ? "Edit Asset" : "Add New Asset"}
                </h3>
                <p className="text-slate-500 text-xs mt-1">Fill out the details to register inventory items.</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Asset Name *</label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Voltas 1.5 Ton AC"
                    className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  >
                    <option value="electronics">Electronics</option>
                    <option value="furniture">Furniture</option>
                    <option value="appliance">Appliance</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Quantity *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Status *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  >
                    <option value="working">Working</option>
                    <option value="needs_repair">Needs Repair</option>
                    <option value="broken">Broken / Discarded</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Assignment Level *</label>
                  <select
                    value={assignmentType}
                    onChange={(e) => {
                      setAssignmentType(e.target.value as any);
                      if (e.target.value === "property") setAssignedRoomId("");
                    }}
                    className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  >
                    <option value="property">Property-Wide</option>
                    <option value="room">Assigned to Room</option>
                  </select>
                </div>

                {assignmentType === "room" && (
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Assign to Room *</label>
                    <select
                      required={assignmentType === "room"}
                      value={assignedRoomId}
                      onChange={(e) => setAssignedRoomId(e.target.value)}
                      className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    >
                      <option value="">-- Select Room --</option>
                      {rooms.map(r => (
                        <option key={r.id} value={r.id}>Room {r.roomNumber}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Purchase Date</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Additional Notes</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="E.g. Serial number, warranty info, etc."
                    className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6 mt-6 border-t border-slate-200">
              {editingAsset && (
                <button
                  type="button"
                  onClick={() => handleDelete(editingAsset.id)}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100/20 text-rose-600 border border-rose-200 rounded-xl text-sm font-semibold transition-all mr-auto"
                >
                  Delete Asset
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
              >
                {editingAsset ? "Save Changes" : "Register Asset"}
              </button>
            </div>
          </form>
        </ModalOverlay>
      )}
    </div>
  );
}
