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
  HelpCircle,
  Edit
} from "lucide-react";
import { Room, Bed, Tenant } from "../lib/db";

import ModalOverlay from "./ui/ModalOverlay";
interface RoomsViewProps {
  rooms: Room[];
  tenants: Tenant[];
  onAddRoom: (room: Room) => Promise<void>;
  onUpdateRoom: (roomId: string, updatedRoom: Room) => Promise<void>;
  onDeleteRoom?: (roomId: string) => Promise<void>;
  onOpenOnboard: (roomId: string, bedId: string) => void;
  selectedPropertyId: string;
}

const FLOOR_OPTIONS = [
  { value: -2, label: "Basement 2 (B2)" },
  { value: -1, label: "Basement (B)" },
  { value: 0, label: "Ground Floor (G)" },
  ...Array.from({ length: 15 }, (_, i) => {
    const num = i + 1;
    const suffix = num === 1 ? "st" : num === 2 ? "nd" : num === 3 ? "rd" : "th";
    return { value: num, label: `${num}${suffix} Floor` };
  })
];

const getFloorLabel = (floor: number): string => {
  if (floor === -2) return "Basement 2 (B2)";
  if (floor === -1) return "Basement (B)";
  if (floor < -2) return `Basement ${Math.abs(floor)}`;
  if (floor === 0) return "Ground Floor (G)";
  if (floor === 1) return "1st Floor";
  if (floor === 2) return "2nd Floor";
  if (floor === 3) return "3rd Floor";
  return `Floor ${floor}`;
};

export default function RoomsView({ rooms, tenants, onAddRoom, onUpdateRoom, onDeleteRoom, onOpenOnboard, selectedPropertyId }: RoomsViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRoomId, setNewRoomId] = useState("");
  const [newRoomFloor, setNewRoomFloor] = useState(1);
  const [newRoomType, setNewRoomType] = useState<Room["type"]>("Double");
  const [newRoomRent, setNewRoomRent] = useState(8000);
  
  const [selectedBedInfo, setSelectedBedInfo] = useState<{ room: Room; bed: Bed } | null>(null);

  // Edit Room Modal state
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editRoomNumber, setEditRoomNumber] = useState("");
  const [editRoomRent, setEditRoomRent] = useState(8000);
  const [editRoomFloor, setEditRoomFloor] = useState(1);

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

    const formattedRoomNumber = newRoomId.trim();
    const generatedId = `${selectedPropertyId}_${formattedRoomNumber}`;

    // Check if room number already exists in this property
    if (rooms.some((r) => r.id === generatedId)) {
      alert("Room number already exists in this property!");
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
        id: `${generatedId}-${label}`,
        name: `Bed ${label}`,
        status: "available",
        tenantId: null
      };
    });

    const room: Room = {
      id: generatedId,
      propertyId: selectedPropertyId,
      roomNumber: formattedRoomNumber,
      floor: newRoomFloor,
      type: newRoomType,
      rent: newRoomRent,
      beds
    };

    await onAddRoom(room);
    setNewRoomId("");
    setShowAddModal(false);
  };

  const openEditRoom = (room: Room) => {
    setEditingRoom(room);
    setEditRoomNumber(room.roomNumber);
    setEditRoomRent(room.rent);
    setEditRoomFloor(room.floor);
  };

  const handleSaveEditRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    const updated: Room = {
      ...editingRoom,
      roomNumber: editRoomNumber.trim() || editingRoom.roomNumber,
      rent: Number(editRoomRent),
      floor: editRoomFloor
    };
    await onUpdateRoom(editingRoom.id, updated);
    setEditingRoom(null);
    alert("Room updated successfully!");
  };

  const handleDeleteRoomAction = async (room: Room) => {
    if (!onDeleteRoom) return;
    const hasOccupants = room.beds.some((b) => b.status === "occupied");
    if (hasOccupants) {
      alert("Cannot delete a room with active residents! Please check out or reassign residents first.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete Room ${room.roomNumber}? This will delete all associated beds.`)) {
      await onDeleteRoom(room.id);
      alert(`Room ${room.roomNumber} deleted.`);
    }
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
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Rooms & Beds Layout
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Visualise room vacancy, change bed occupancy and configure floors.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Room
        </button>
      </div>

      {/* Floors Sections */}
      {floors.length === 0 ? (
        <div className="bg-white border border-slate-200 shadow-sm p-12 text-center text-slate-500 rounded-2xl">
          No rooms defined yet. Click "Add Room" to create rooms on any floor.
        </div>
      ) : (
        <div className="space-y-12">
          {floors.map((floor) => (
            <div key={floor} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">{getFloorLabel(floor)}</h3>
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-xs font-semibold">
                  {roomsByFloor[floor].length} Rooms
                </span>
              </div>

              {/* Grid of rooms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {roomsByFloor[floor].map((room) => {
                  const total = room.beds.length;
                  const occupied = room.beds.filter((b) => b.status === "occupied").length;
                  const available = room.beds.filter((b) => b.status === "available").length;

                  return (
                    <div key={room.id} className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl flex flex-col justify-between gap-5 relative group/card">
                      {/* Room Header Info */}
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-lg font-extrabold text-slate-900 whitespace-nowrap">Room {room.roomNumber}</span>
                            <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                              {room.type}
                            </span>
                          </div>
                          <p className="text-slate-500 text-xs mt-1">Base Rent: ₹{room.rent.toLocaleString("en-IN")}/mo</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditRoom(room)}
                              title="Edit Room"
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {onDeleteRoom && (
                              <button
                                onClick={() => handleDeleteRoomAction(room)}
                                title="Delete Room"
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Occupancy</span>
                            <span className="text-xs font-extrabold text-slate-900 whitespace-nowrap">
                              {occupied} / {total} Beds
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Beds Display Slots */}
                      <div className="grid grid-cols-2 gap-3">
                        {room.beds.map((bed) => {
                          const tenant = getTenantDetails(bed.tenantId);
                          let statusColor = "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700";
                          let statusLabel = "Available";

                          if (bed.status === "occupied") {
                            statusColor = "border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700";
                            statusLabel = tenant ? tenant.name : "Occupied";
                          } else if (bed.status === "maintenance") {
                            statusColor = "border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700";
                            statusLabel = "Maintenance";
                          }

                          return (
                            <button
                              key={bed.id}
                              onClick={() => setSelectedBedInfo({ room, bed })}
                              className={`p-3 border rounded-xl flex flex-col justify-between items-start gap-1 transition-all text-left group ${statusColor}`}
                            >
                              <div className="flex justify-between items-center w-full">
                                <span className="text-xs font-extrabold group-hover:scale-105 transition-transform">
                                  {bed.name}
                                </span>
                                {bed.status === "occupied" ? (
                                  <User className="w-3.5 h-3.5 text-rose-500" />
                                ) : bed.status === "maintenance" ? (
                                  <Wrench className="w-3.5 h-3.5 text-amber-500" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
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
        <ModalOverlay tone="bg-slate-900/50" onClose={() => setSelectedBedInfo(null)} dismissOnBackdrop>
          <div className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md animate-fade-in relative space-y-6 shadow-xl">
            {/* Header */}
            <div>
              <div className="flex justify-between items-start">
                <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Home className="w-5 h-5 text-indigo-600" />
                  Room {selectedBedInfo.room.roomNumber} - {selectedBedInfo.bed.name}
                </h4>
                <button 
                  onClick={() => setSelectedBedInfo(null)}
                  className="text-slate-400 hover:text-slate-600 font-extrabold text-sm"
                >
                  ✕
                </button>
              </div>
              <p className="text-slate-500 text-xs mt-1">Bed unique code: {selectedBedInfo.bed.id}</p>
            </div>

            {/* Bed Status Detail */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-semibold uppercase">Current Status</span>
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  selectedBedInfo.bed.status === "available"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : selectedBedInfo.bed.status === "occupied"
                    ? "bg-rose-50 text-rose-600 border border-rose-200"
                    : "bg-amber-50 text-amber-600 border border-amber-200"
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
                    <div className="space-y-2.5 pt-2 border-t border-slate-200">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Tenant Name</span>
                        <span className="text-slate-900 font-bold">{tenant.name}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Contact Number</span>
                        <span className="text-slate-900 font-bold">{tenant.phone}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Check-in Date</span>
                        <span className="text-indigo-600 font-bold">{tenant.checkInDate}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Monthly Rent</span>
                        <span className="text-slate-900 font-bold">₹{tenant.rentAmount}</span>
                      </div>
                    </div>
                  );
                })()
              ) : selectedBedInfo.bed.status === "maintenance" ? (
                <div className="flex items-start gap-2 pt-2 border-t border-slate-200 text-xs text-slate-600">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <p>This bed is currently marked for maintenance/repairs and cannot be allocated to new tenants.</p>
                </div>
              ) : (
                <div className="flex items-start gap-2 pt-2 border-t border-slate-200 text-xs text-slate-600">
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
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
                >
                  Allocate / Onboard Tenant
                </button>
              )}

              {selectedBedInfo.bed.status !== "occupied" && (
                <button
                  onClick={() => toggleBedMaintenance(selectedBedInfo.room, selectedBedInfo.bed.id)}
                  className={`w-full py-2.5 border rounded-xl text-xs font-semibold transition-all ${
                    selectedBedInfo.bed.status === "maintenance"
                      ? "border-emerald-200 hover:bg-emerald-50 text-emerald-700"
                      : "border-amber-200 hover:bg-amber-50 text-amber-700"
                  }`}
                >
                  {selectedBedInfo.bed.status === "maintenance" ? "End Maintenance" : "Mark as Maintenance"}
                </button>
              )}

              <button
                onClick={() => setSelectedBedInfo(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
              >
                Close details
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Add Room Modal */}
      {showAddModal && (
        <ModalOverlay tone="bg-slate-900/50" onClose={() => setShowAddModal(false)}>
          <form 
            onSubmit={handleCreateRoom}
            className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md animate-fade-in relative space-y-5 shadow-xl"
          >
            <div>
              <h4 className="text-lg font-bold text-slate-900">Add New Room Configuration</h4>
              <p className="text-slate-500 text-xs mt-1">This will automatically generate bed slots.</p>
            </div>

            <div className="space-y-4">
              {/* Room number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Room Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B-01, G-01, 104, 305"
                  value={newRoomId}
                  onChange={(e) => setNewRoomId(e.target.value)}
                  className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              {/* Floor */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Floor</label>
                <select
                  value={newRoomFloor}
                  onChange={(e) => setNewRoomFloor(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                >
                  {FLOOR_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Room Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Room Type (Sharing)</label>
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
                  className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                >
                  <option value="Single">Single Occupancy</option>
                  <option value="Double">Double Sharing</option>
                  <option value="Triple">Triple Sharing</option>
                  <option value="Four Sharing">Four Sharing</option>
                </select>
              </div>

              {/* Base Rent */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Monthly Rent per Bed (₹)</label>
                <input
                  type="number"
                  required
                  min="1000"
                  value={newRoomRent}
                  onChange={(e) => setNewRoomRent(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Form actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
              >
                Create Room
              </button>
            </div>
          </form>
        </ModalOverlay>
      )}

      {/* Edit Room Modal */}
      {editingRoom && (
        <ModalOverlay tone="bg-slate-900/50" onClose={() => setEditingRoom(null)}>
          <form 
            onSubmit={handleSaveEditRoom}
            className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md animate-fade-in relative space-y-4 shadow-xl"
          >
            <div>
              <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-600" />
                Edit Room {editingRoom.roomNumber}
              </h4>
              <p className="text-slate-500 text-xs mt-0.5">Update room number, floor or standard bed rent.</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Room Number</label>
                <input
                  type="text"
                  required
                  value={editRoomNumber}
                  onChange={(e) => setEditRoomNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl text-sm border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Floor</label>
                <select
                  value={editRoomFloor}
                  onChange={(e) => setEditRoomFloor(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl text-sm border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  {FLOOR_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Monthly Rent per Bed (₹)</label>
                <input
                  type="number"
                  required
                  min="500"
                  value={editRoomRent}
                  onChange={(e) => setEditRoomRent(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl text-sm border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEditingRoom(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
              >
                Save Room
              </button>
            </div>
          </form>
        </ModalOverlay>
      )}
    </div>
  );
}
