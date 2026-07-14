"use client";

import React, { useState } from "react";
import { 
  Home, 
  Plus, 
  Trash2, 
  Layers, 
  User, 
  Wrench, 
  Check, 
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { Room, Bed, Tenant } from "../lib/db";

interface RoomsViewProps {
  rooms: Room[];
  tenants: Tenant[];
  onAddRoom: (room: Room) => Promise<void>;
  onUpdateRoom: (roomId: string, updatedRoom: Room) => Promise<void>;
  onOpenOnboard: (roomId: string, bedId: string) => void;
}

export default function RoomsView({ rooms, tenants, onAddRoom, onUpdateRoom, onOpenOnboard }: RoomsViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRoomId, setNewRoomId] = useState("");
  const [newRoomFloor, setNewRoomFloor] = useState(1);
  const [newRoomType, setNewRoomType] = useState<Room["type"]>("Double");
  const [newRoomRent, setNewRoomRent] = useState(8000);
  
  const [selectedBedInfo, setSelectedBedInfo] = useState<{ room: Room; bed: Bed } | null>(null);

  // Group rooms by Floor
  const roomsByFloor: { [key: number]: Room[] } = {};
  rooms.forEach((room) => {
    if (!roomsByFloor[room.floor]) {
      roomsByFloor[room.floor] = [];
    }
    roomsByFloor[room.floor].push(room);
  });

  const floors = Object.keys(roomsByFloor)
    .map(Number)
    .sort((a, b) => a - b);

  // Handle adding room
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomId.trim()) return;

    // Check if room number already exists
    if (rooms.some((r) => r.id === newRoomId.trim())) {
      alert("Room number already exists!");
      return;
    }

    // Determine beds based on sharing type
    let bedCount = 1;
    if (newRoomType === "Double") bedCount = 2;
    if (newRoomType === "Triple") bedCount = 3;
    if (newRoomType === "Four Sharing") bedCount = 4;

    const beds: Bed[] = Array.from({ length: bedCount }).map((_, index) => {
      const label = String.fromCharCode(65 + index); // A, B, C, D
      return {
        id: `${newRoomId.trim()}-${label}`,
        name: `Bed ${label}`,
        status: "available",
        tenantId: null
      };
    });

    const room: Room = {
      id: newRoomId.trim(),
      floor: newRoomFloor,
      type: newRoomType,
      rent: newRoomRent,
      beds
    };

    await onAddRoom(room);
    setNewRoomId("");
    setShowAddModal(false);
  };

  // Toggle bed status (Available <-> Maintenance)
  const toggleBedMaintenance = async (room: Room, bedId: string) => {
    const updatedBeds = room.beds.map((b) => {
      if (b.id === bedId) {
        if (b.status === "available") {
          return { ...b, status: "maintenance" as const };
        } else if (b.status === "maintenance") {
          return { ...b, status: "available" as const };
        }
      }
      return b;
    });

    const updatedRoom = { ...room, beds: updatedBeds };
    await onUpdateRoom(room.id, updatedRoom);
    
    // Update local modal state if active
    if (selectedBedInfo && selectedBedInfo.room.id === room.id) {
      const activeBed = updatedBeds.find(b => b.id === bedId);
      if (activeBed) {
        setSelectedBedInfo({ room: updatedRoom, bed: activeBed });
      }
    }
  };

  // Find tenant by ID
  const getTenantDetails = (tenantId: string | null) => {
    if (!tenantId) return null;
    return tenants.find((t) => t.id === tenantId && t.status === "active");
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Rooms & Beds Layout
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Visualise room vacancy, change bed occupancy and configure floors.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          Add Room
        </button>
      </div>

      {/* Floors Sections */}
      {floors.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 rounded-2xl">
          No rooms defined yet. Click "Add Room" to create rooms on any floor.
        </div>
      ) : (
        <div className="space-y-12">
          {floors.map((floor) => (
            <div key={floor} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Floor {floor}</h3>
                <span className="bg-slate-800/80 text-slate-450 px-2 py-0.5 rounded-md text-xs font-semibold">
                  {roomsByFloor[floor].length} Rooms
                </span>
              </div>

              {/* Grid of rooms */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roomsByFloor[floor].map((room) => {
                  const total = room.beds.length;
                  const occupied = room.beds.filter((b) => b.status === "occupied").length;
                  const available = room.beds.filter((b) => b.status === "available").length;

                  return (
                    <div key={room.id} className="glass-card p-6 rounded-2xl flex flex-col justify-between gap-5 relative group/card">
                      {/* Room Header Info */}
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-extrabold text-white">Room {room.id}</span>
                            <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                              {room.type}
                            </span>
                          </div>
                          <p className="text-slate-450 text-xs mt-1">Base Rent: ₹{room.rent.toLocaleString("en-IN")}/mo</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-405 block">Occupancy</span>
                          <span className="text-sm font-extrabold text-white">
                            {occupied} / {total} Beds
                          </span>
                        </div>
                      </div>

                      {/* Beds Display Slots */}
                      <div className="grid grid-cols-2 gap-3">
                        {room.beds.map((bed) => {
                          const tenant = getTenantDetails(bed.tenantId);
                          let statusColor = "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400";
                          let statusLabel = "Available";

                          if (bed.status === "occupied") {
                            statusColor = "border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-rose-450";
                            statusLabel = tenant ? tenant.name : "Occupied";
                          } else if (bed.status === "maintenance") {
                            statusColor = "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-450";
                            statusLabel = "Maintenance";
                          }

                          return (
                            <button
                              key={bed.id}
                              onClick={() => setSelectedBedInfo({ room, bed })}
                              className={`p-3 border rounded-xl flex flex-col justify-between items-start gap-1 transition-all text-left group ${statusColor}`}
                            >
                              <div className="flex justify-between items-center w-full">
                                <span className="text-xs font-extrabold text-white group-hover:scale-105 transition-transform">
                                  {bed.name}
                                </span>
                                {bed.status === "occupied" ? (
                                  <User className="w-3.5 h-3.5 text-rose-400" />
                                ) : bed.status === "maintenance" ? (
                                  <Wrench className="w-3.5 h-3.5 text-amber-400" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                )}
                              </div>
                              <span className="text-[10px] font-semibold tracking-wide truncate max-w-full">
                                {statusLabel}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bed Details Modal */}
      {selectedBedInfo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md animate-fade-in relative space-y-6 shadow-2xl">
            {/* Header */}
            <div>
              <div className="flex justify-between items-start">
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <Home className="w-5 h-5 text-indigo-400" />
                  Room {selectedBedInfo.room.id} - {selectedBedInfo.bed.name}
                </h4>
                <button 
                  onClick={() => setSelectedBedInfo(null)}
                  className="text-slate-400 hover:text-white font-extrabold text-sm"
                >
                  ✕
                </button>
              </div>
              <p className="text-slate-500 text-xs mt-1">Bed unique code: {selectedBedInfo.bed.id}</p>
            </div>

            {/* Bed Status Detail */}
            <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-450 font-semibold uppercase">Current Status</span>
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  selectedBedInfo.bed.status === "available"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : selectedBedInfo.bed.status === "occupied"
                    ? "bg-rose-500/10 text-rose-400"
                    : "bg-amber-500/10 text-amber-400"
                }`}>
                  {selectedBedInfo.bed.status}
                </span>
              </div>

              {selectedBedInfo.bed.status === "occupied" ? (
                // Occupied Tenant Profile Card
                (() => {
                  const tenant = getTenantDetails(selectedBedInfo.bed.tenantId);
                  if (!tenant) return <p className="text-xs text-slate-500">Occupant details not found.</p>;
                  return (
                    <div className="space-y-2.5 pt-2 border-t border-slate-900">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Tenant Name</span>
                        <span className="text-slate-200 font-bold">{tenant.name}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Contact Number</span>
                        <span className="text-slate-200 font-bold">{tenant.phone}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Check-in Date</span>
                        <span className="text-indigo-400 font-bold">{tenant.checkInDate}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Monthly Rent</span>
                        <span className="text-slate-200 font-bold">₹{tenant.rentAmount}</span>
                      </div>
                    </div>
                  );
                })()
              ) : selectedBedInfo.bed.status === "maintenance" ? (
                <div className="flex items-start gap-2 pt-2 border-t border-slate-900 text-xs text-slate-400">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <p>This bed is currently marked for maintenance/repairs and cannot be allocated to new tenants.</p>
                </div>
              ) : (
                <div className="flex items-start gap-2 pt-2 border-t border-slate-900 text-xs text-slate-400">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <p>Bed is clean and ready for immediate occupation.</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5">
              {selectedBedInfo.bed.status === "available" && (
                <button
                  onClick={() => {
                    onOpenOnboard(selectedBedInfo.room.id, selectedBedInfo.bed.id);
                    setSelectedBedInfo(null);
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20"
                >
                  Allocate / Onboard Tenant
                </button>
              )}

              {selectedBedInfo.bed.status !== "occupied" && (
                <button
                  onClick={() => toggleBedMaintenance(selectedBedInfo.room, selectedBedInfo.bed.id)}
                  className={`w-full py-2.5 border rounded-xl text-xs font-semibold transition-all ${
                    selectedBedInfo.bed.status === "maintenance"
                      ? "border-emerald-500/20 hover:bg-emerald-500/5 text-emerald-400"
                      : "border-amber-500/20 hover:bg-amber-500/5 text-amber-400"
                  }`}
                >
                  {selectedBedInfo.bed.status === "maintenance" ? "End Maintenance" : "Mark as Maintenance"}
                </button>
              )}

              <button
                onClick={() => setSelectedBedInfo(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded-xl text-xs font-semibold transition-all"
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleCreateRoom}
            className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md animate-fade-in relative space-y-5 shadow-2xl"
          >
            <div>
              <h4 className="text-lg font-bold text-white">Add New Room Configuration</h4>
              <p className="text-slate-500 text-xs mt-1">This will automatically generate bed slots.</p>
            </div>

            <div className="space-y-4">
              {/* Room number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Room Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 104, 305"
                  value={newRoomId}
                  onChange={(e) => setNewRoomId(e.target.value)}
                  className="w-full p-2.5 rounded-xl text-xs glass-input"
                />
              </div>

              {/* Floor */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Floor Number</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="10"
                  value={newRoomFloor}
                  onChange={(e) => setNewRoomFloor(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl text-xs glass-input"
                />
              </div>

              {/* Room Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Room Type (Sharing)</label>
                <select
                  value={newRoomType}
                  onChange={(e) => {
                    const type = e.target.value as Room["type"];
                    setNewRoomType(type);
                    // Autofill rent standard rates
                    if (type === "Single") setNewRoomRent(15000);
                    if (type === "Double") setNewRoomRent(8000);
                    if (type === "Triple") setNewRoomRent(6000);
                    if (type === "Four Sharing") setNewRoomRent(4500);
                  }}
                  className="w-full p-2.5 rounded-xl text-xs glass-input"
                >
                  <option value="Single">Single Occupancy</option>
                  <option value="Double">Double Sharing</option>
                  <option value="Triple">Triple Sharing</option>
                  <option value="Four Sharing">Four Sharing</option>
                </select>
              </div>

              {/* Base Rent */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Monthly Rent per Bed (₹)</label>
                <input
                  type="number"
                  required
                  min="1000"
                  value={newRoomRent}
                  onChange={(e) => setNewRoomRent(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl text-xs glass-input"
                />
              </div>
            </div>

            {/* Form actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded-xl text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20"
              >
                Create Room
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
