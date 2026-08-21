import { db } from "./firebase";
import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  deleteDoc
} from "firebase/firestore";

// Interfaces
export interface Property {
  id: string;
  name: string;
  logoUrl?: string;
  adminId: string;
  address?: string;
  createdAt: string;
}

export interface Bed {
  id: string;
  name: string;
  status: "available" | "occupied" | "maintenance";
  tenantId: string | null;
}

export interface Room {
  id: string; // Room ID e.g. prop-1_101
  propertyId: string;
  roomNumber: string; // e.g. "101"
  floor: number;
  type: "Single" | "Double" | "Triple" | "Four Sharing";
  rent: number;
  beds: Bed[];
}

export interface Tenant {
  id: string;
  propertyId: string;
  name: string;
  email: string;
  phone: string;
  idProofType: string;
  idProofNumber: string;
  emergencyName: string;
  emergencyPhone: string;
  roomId: string;
  bedId: string;
  checkInDate: string;
  checkOutDate: string | null;
  rentAmount: number;
  securityDeposit: number;
  status: "active" | "checked_out";
}

export interface BillingRecord {
  id: string;
  propertyId: string;
  tenantId: string;
  tenantName: string;
  roomId: string;
  billingMonth: string; // YYYY-MM
  rentAmount: number;
  rentStatus: "paid" | "unpaid";
  rentPaidDate: string | null;
  electricityPrevReading: number;
  electricityCurrReading: number;
  electricityUnits: number;
  electricityRatePerUnit: number;
  electricityAmount: number;
  electricityStatus: "paid" | "unpaid";
  electricityPaidDate: string | null;
  totalAmount: number;
  paidAmount: number;
  createdAt: string;
}

export interface SecurityLog {
  id: string;
  propertyId: string;
  type: "visitor" | "gate_pass" | "complaint";
  tenantId: string | null;
  tenantName: string | null;
  title: string;
  description: string;
  status: "pending" | "approved" | "resolved";
  createdAt: string;
  resolvedAt?: string | null;
}

export interface Asset {
  id: string;
  propertyId: string;
  name: string; // e.g. "AC 1.5 Ton", "Washing Machine"
  category: "electronics" | "furniture" | "appliance" | "other";
  quantity: number;
  assignmentType: "property" | "room";
  assignedRoomId: string | null; // e.g. "prop-1_101"
  status: "working" | "needs_repair" | "broken";
  purchaseDate?: string;
  cost?: number;
  notes?: string;
}

export interface Fine {
  id: string;
  propertyId: string;
  tenantId: string;
  tenantName: string;
  amount: number;
  reason: string;
  date: string;
  status: "paid" | "unpaid";
}

export interface Staff {
  id: string;
  propertyId: string;
  name: string;
  role: "manager" | "cleaner" | "cook" | "security" | "other";
  phone: string;
  salary: number;
  joinedDate: string;
  status: "active" | "inactive";
}

export interface StaffAttendance {
  id: string;
  propertyId: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  status: "present" | "absent" | "half_day";
}

export interface StaffAdvance {
  id: string;
  propertyId: string;
  staffId: string;
  amount: number;
  date: string;
  reason: string;
}

export interface Expense {
  id: string;
  propertyId: string;
  category: "maintenance" | "salary" | "utilities" | "asset_purchase" | "marketing" | "other";
  amount: number;
  date: string;
  description: string;
}

// Seed Data
const SEED_PROPERTIES: Property[] = [
  {
    id: "prop-1",
    name: "Serenity Stayz",
    adminId: "admin",
    address: "123 PG Street, Tech City",
    createdAt: "2026-01-01T00:00:00Z"
  }
];

const SEED_ROOMS: Room[] = [
  {
    id: "prop-1_101",
    propertyId: "prop-1",
    roomNumber: "101",
    floor: 1,
    type: "Single",
    rent: 15000,
    beds: [
      { id: "101-A", name: "Bed A", status: "occupied", tenantId: "tenant-1" }
    ]
  },
  {
    id: "prop-1_102",
    propertyId: "prop-1",
    roomNumber: "102",
    floor: 1,
    type: "Double",
    rent: 8000,
    beds: [
      { id: "102-A", name: "Bed A", status: "occupied", tenantId: "tenant-2" },
      { id: "102-B", name: "Bed B", status: "available", tenantId: null }
    ]
  },
  {
    id: "prop-1_201",
    propertyId: "prop-1",
    roomNumber: "201",
    floor: 2,
    type: "Triple",
    rent: 6000,
    beds: [
      { id: "201-A", name: "Bed A", status: "occupied", tenantId: "tenant-3" },
      { id: "201-B", name: "Bed B", status: "occupied", tenantId: "tenant-4" },
      { id: "201-C", name: "Bed C", status: "available", tenantId: null }
    ]
  },
  {
    id: "prop-1_202",
    propertyId: "prop-1",
    roomNumber: "202",
    floor: 2,
    type: "Double",
    rent: 8500,
    beds: [
      { id: "202-A", name: "Bed A", status: "available", tenantId: null },
      { id: "202-B", name: "Bed B", status: "available", tenantId: null }
    ]
  },
  {
    id: "prop-1_301",
    propertyId: "prop-1",
    roomNumber: "301",
    floor: 3,
    type: "Single",
    rent: 16000,
    beds: [
      { id: "301-A", name: "Bed A", status: "available", tenantId: null }
    ]
  },
  {
    id: "prop-1_302",
    propertyId: "prop-1",
    roomNumber: "302",
    floor: 3,
    type: "Double",
    rent: 9000,
    beds: [
      { id: "302-A", name: "Bed A", status: "available", tenantId: null },
      { id: "302-B", name: "Bed B", status: "available", tenantId: null }
    ]
  }
];

const SEED_TENANTS: Tenant[] = [
  {
    id: "tenant-1",
    propertyId: "prop-1",
    name: "Rahul Sharma",
    email: "rahul.sharma@example.com",
    phone: "9876543210",
    idProofType: "Aadhaar",
    idProofNumber: "1234-5678-9012",
    emergencyName: "Sanjay Sharma",
    emergencyPhone: "9876543211",
    roomId: "prop-1_101",
    bedId: "101-A",
    checkInDate: "2026-05-10",
    checkOutDate: null,
    rentAmount: 15000,
    securityDeposit: 15000,
    status: "active"
  },
  {
    id: "tenant-2",
    propertyId: "prop-1",
    name: "Priya Patel",
    email: "priya.patel@example.com",
    phone: "9812345678",
    idProofType: "PAN",
    idProofNumber: "ABCDE1234F",
    emergencyName: "Karan Patel",
    emergencyPhone: "9812345679",
    roomId: "prop-1_102",
    bedId: "102-A",
    checkInDate: "2026-06-01",
    checkOutDate: null,
    rentAmount: 8000,
    securityDeposit: 8000,
    status: "active"
  },
  {
    id: "tenant-3",
    propertyId: "prop-1",
    name: "Amit Verma",
    email: "amit.verma@example.com",
    phone: "9887654321",
    idProofType: "Aadhaar",
    idProofNumber: "9876-5432-1098",
    emergencyName: "Ramesh Verma",
    emergencyPhone: "9887654322",
    roomId: "prop-1_201",
    bedId: "201-A",
    checkInDate: "2026-06-15",
    checkOutDate: null,
    rentAmount: 6000,
    securityDeposit: 6000,
    status: "active"
  },
  {
    id: "tenant-4",
    propertyId: "prop-1",
    name: "Sneha Reddy",
    email: "sneha.reddy@example.com",
    phone: "9912345678",
    idProofType: "Passport",
    idProofNumber: "Z1234567",
    emergencyName: "Madhusudhan Reddy",
    emergencyPhone: "9912345679",
    roomId: "prop-1_201",
    bedId: "201-B",
    checkInDate: "2026-07-01",
    checkOutDate: null,
    rentAmount: 6000,
    securityDeposit: 6000,
    status: "active"
  },
  {
    id: "tenant-5",
    propertyId: "prop-1",
    name: "Vikram Singh",
    email: "vikram.singh@example.com",
    phone: "9712345678",
    idProofType: "Aadhaar",
    idProofNumber: "4567-8901-2345",
    emergencyName: "Harbhajan Singh",
    emergencyPhone: "9712345679",
    roomId: "prop-1_102",
    bedId: "102-B",
    checkInDate: "2026-01-10",
    checkOutDate: "2026-06-30",
    rentAmount: 8000,
    securityDeposit: 8000,
    status: "checked_out"
  }
];

const SEED_BILLING: BillingRecord[] = [
  {
    id: "bill-1",
    propertyId: "prop-1",
    tenantId: "tenant-1",
    tenantName: "Rahul Sharma",
    roomId: "prop-1_101",
    billingMonth: "2026-06",
    rentAmount: 15000,
    rentStatus: "paid",
    rentPaidDate: "2026-06-05",
    electricityPrevReading: 100,
    electricityCurrReading: 220,
    electricityUnits: 120,
    electricityRatePerUnit: 10,
    electricityAmount: 1200,
    electricityStatus: "paid",
    electricityPaidDate: "2026-06-05",
    totalAmount: 16200,
    paidAmount: 16200,
    createdAt: "2026-06-01T08:00:00Z"
  },
  {
    id: "bill-2",
    propertyId: "prop-1",
    tenantId: "tenant-1",
    tenantName: "Rahul Sharma",
    roomId: "prop-1_101",
    billingMonth: "2026-07",
    rentAmount: 15000,
    rentStatus: "unpaid",
    rentPaidDate: null,
    electricityPrevReading: 220,
    electricityCurrReading: 370,
    electricityUnits: 150,
    electricityRatePerUnit: 10,
    electricityAmount: 1500,
    electricityStatus: "unpaid",
    electricityPaidDate: null,
    totalAmount: 16500,
    paidAmount: 0,
    createdAt: "2026-07-01T08:00:00Z"
  },
  {
    id: "bill-3",
    propertyId: "prop-1",
    tenantId: "tenant-2",
    tenantName: "Priya Patel",
    roomId: "prop-1_102",
    billingMonth: "2026-06",
    rentAmount: 8000,
    rentStatus: "paid",
    rentPaidDate: "2026-06-04",
    electricityPrevReading: 450,
    electricityCurrReading: 540,
    electricityUnits: 90,
    electricityRatePerUnit: 10,
    electricityAmount: 900,
    electricityStatus: "paid",
    electricityPaidDate: "2026-06-04",
    totalAmount: 8900,
    paidAmount: 8900,
    createdAt: "2026-06-01T08:00:00Z"
  },
  {
    id: "bill-4",
    propertyId: "prop-1",
    tenantId: "tenant-2",
    tenantName: "Priya Patel",
    roomId: "prop-1_102",
    billingMonth: "2026-07",
    rentAmount: 8000,
    rentStatus: "paid",
    rentPaidDate: "2026-07-03",
    electricityPrevReading: 540,
    electricityCurrReading: 640,
    electricityUnits: 100,
    electricityRatePerUnit: 10,
    electricityAmount: 1000,
    electricityStatus: "unpaid",
    electricityPaidDate: null,
    totalAmount: 9000,
    paidAmount: 8000,
    createdAt: "2026-07-01T08:00:00Z"
  },
  {
    id: "bill-5",
    propertyId: "prop-1",
    tenantId: "tenant-3",
    tenantName: "Amit Verma",
    roomId: "prop-1_201",
    billingMonth: "2026-07",
    rentAmount: 6000,
    rentStatus: "unpaid",
    rentPaidDate: null,
    electricityPrevReading: 120,
    electricityCurrReading: 190,
    electricityUnits: 70,
    electricityRatePerUnit: 10,
    electricityAmount: 700,
    electricityStatus: "unpaid",
    electricityPaidDate: null,
    totalAmount: 6700,
    paidAmount: 0,
    createdAt: "2026-07-01T08:00:00Z"
  }
];

const SEED_SECURITY_LOGS: SecurityLog[] = [
  {
    id: "log-1",
    propertyId: "prop-1",
    type: "visitor",
    tenantId: "tenant-1",
    tenantName: "Rahul Sharma",
    title: "Visitor: Rohan Sharma",
    description: "Brother visiting. Entry time: 14:00, Exit time: 16:30",
    status: "approved",
    createdAt: "2026-07-12T14:00:00Z"
  },
  {
    id: "log-2",
    propertyId: "prop-1",
    type: "gate_pass",
    tenantId: "tenant-2",
    tenantName: "Priya Patel",
    title: "Late Night Entry Pass",
    description: "Returning late from office team dinner (ETA 11:30 PM)",
    status: "approved",
    createdAt: "2026-07-13T16:00:00Z"
  },
  {
    id: "log-3",
    propertyId: "prop-1",
    type: "complaint",
    tenantId: "tenant-3",
    tenantName: "Amit Verma",
    title: "Room 201 AC not cooling",
    description: "AC remote works but cooling is very slow. Filter might need cleaning.",
    status: "resolved",
    createdAt: "2026-07-11T10:00:00Z",
    resolvedAt: "2026-07-13T15:30:00Z"
  },
  {
    id: "log-4",
    propertyId: "prop-1",
    type: "complaint",
    tenantId: "tenant-2",
    tenantName: "Priya Patel",
    title: "Room 102 Wi-Fi slow",
    description: "Speed dropped below 5Mbps. Unable to attend Zoom calls.",
    status: "pending",
    createdAt: "2026-07-14T09:15:00Z"
  }
];

const SEED_ASSETS: Asset[] = [
  {
    id: "asset-1",
    propertyId: "prop-1",
    name: "Samsung Washing Machine 7kg",
    category: "appliance",
    quantity: 1,
    assignmentType: "property",
    assignedRoomId: null,
    status: "working",
    purchaseDate: "2025-10-15",
    cost: 15000,
    notes: "Placed in common area terrace"
  },
  {
    id: "asset-2",
    propertyId: "prop-1",
    name: "Voltas AC 1.5 Ton",
    category: "electronics",
    quantity: 1,
    assignmentType: "room",
    assignedRoomId: "prop-1_101",
    status: "working",
    purchaseDate: "2026-01-20",
    cost: 32000
  },
  {
    id: "asset-3",
    propertyId: "prop-1",
    name: "Single Bed with Storage",
    category: "furniture",
    quantity: 1,
    assignmentType: "room",
    assignedRoomId: "prop-1_101",
    status: "working",
    cost: 8000
  },
  {
    id: "asset-4",
    propertyId: "prop-1",
    name: "RO Water Purifier",
    category: "appliance",
    quantity: 1,
    assignmentType: "property",
    assignedRoomId: null,
    status: "needs_repair",
    purchaseDate: "2025-05-10",
    cost: 12000,
    notes: "Filter replacement required"
  }
];

const SEED_FINES: Fine[] = [
  {
    id: "fine-1",
    propertyId: "prop-1",
    tenantId: "tenant-2",
    tenantName: "Priya Patel",
    amount: 500,
    reason: "Late rent payment for July",
    date: "2026-07-10",
    status: "paid"
  }
];

const SEED_STAFF: Staff[] = [
  {
    id: "staff-1",
    propertyId: "prop-1",
    name: "Raju Bhai",
    role: "cleaner",
    phone: "9876500001",
    salary: 8000,
    joinedDate: "2025-01-01",
    status: "active"
  },
  {
    id: "staff-2",
    propertyId: "prop-1",
    name: "Sunita Devi",
    role: "cook",
    phone: "9876500002",
    salary: 12000,
    joinedDate: "2025-03-15",
    status: "active"
  }
];

const SEED_ATTENDANCE: StaffAttendance[] = [
  {
    id: "att-1",
    propertyId: "prop-1",
    staffId: "staff-1",
    date: "2026-07-20",
    status: "present"
  }
];

const SEED_ADVANCES: StaffAdvance[] = [
  {
    id: "adv-1",
    propertyId: "prop-1",
    staffId: "staff-1",
    amount: 1000,
    date: "2026-07-15",
    reason: "Medical emergency"
  }
];

const SEED_EXPENSES: Expense[] = [
  {
    id: "exp-1",
    propertyId: "prop-1",
    category: "maintenance",
    amount: 1500,
    date: "2026-07-05",
    description: "Plumbing repair in Room 101"
  },
  {
    id: "exp-2",
    propertyId: "prop-1",
    category: "utilities",
    amount: 4000,
    date: "2026-07-10",
    description: "Internet Bill"
  }
];

// Helper to determine active DB mode
const isFirebaseMode = (): boolean => {
  if (typeof window === "undefined") return true; 
  const mode = localStorage.getItem("pg_db_mode");
  return mode === "firebase" || mode === null; 
};

// Seeding FireStore if collection is empty
const seedFirestoreIfEmpty = async () => {
  try {
    const pSnap = await getDocs(collection(db, "properties"));
    if (pSnap.empty) {
      console.log("Firestore empty. Seeding Firestore collections...");
      
      for (const prop of SEED_PROPERTIES) {
        await setDoc(doc(db, "properties", prop.id), prop);
      }
      for (const room of SEED_ROOMS) {
        await setDoc(doc(db, "rooms", room.id), room);
      }
      for (const tenant of SEED_TENANTS) {
        await setDoc(doc(db, "tenants", tenant.id), tenant);
      }
      for (const bill of SEED_BILLING) {
        await setDoc(doc(db, "billing", bill.id), bill);
      }
      for (const log of SEED_SECURITY_LOGS) {
        await setDoc(doc(db, "securityLogs", log.id), log);
      }
      for (const asset of SEED_ASSETS) {
        await setDoc(doc(db, "assets", asset.id), asset);
      }
      for (const fine of SEED_FINES) {
        await setDoc(doc(db, "fines", fine.id), fine);
      }
      for (const staff of SEED_STAFF) {
        await setDoc(doc(db, "staff", staff.id), staff);
      }
      for (const att of SEED_ATTENDANCE) {
        await setDoc(doc(db, "staffAttendance", att.id), att);
      }
      for (const adv of SEED_ADVANCES) {
        await setDoc(doc(db, "staffAdvances", adv.id), adv);
      }
      for (const exp of SEED_EXPENSES) {
        await setDoc(doc(db, "expenses", exp.id), exp);
      }
      console.log("Firestore seeding completed successfully!");
    }
  } catch (error) {
    console.error("Error seeding Firestore: ", error);
  }
};

// LocalStorage helpers (Mock mode)
const getLocalData = <T>(key: string, defaultData: T[]): T[] => {
  if (typeof window === "undefined") return defaultData;
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  }
  return JSON.parse(stored);
};

const setLocalData = <T>(key: string, data: T[]): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

// Central Database Service
export const dbService = {
  init: async () => {
    if (isFirebaseMode()) {
      console.log("Connected to live Firebase. Ready for clean production queries.");
    } else {
      getLocalData<Property>("pg_mock_properties", SEED_PROPERTIES);
      getLocalData<Room>("pg_mock_rooms", SEED_ROOMS);
      getLocalData<Tenant>("pg_mock_tenants", SEED_TENANTS);
      getLocalData<BillingRecord>("pg_mock_billing", SEED_BILLING);
      getLocalData<SecurityLog>("pg_mock_securityLogs", SEED_SECURITY_LOGS);
      getLocalData<Asset>("pg_mock_assets", SEED_ASSETS);
      getLocalData<Fine>("pg_mock_fines", SEED_FINES);
      getLocalData<Staff>("pg_mock_staff", SEED_STAFF);
      getLocalData<StaffAttendance>("pg_mock_attendance", SEED_ATTENDANCE);
      getLocalData<StaffAdvance>("pg_mock_advances", SEED_ADVANCES);
      getLocalData<Expense>("pg_mock_expenses", SEED_EXPENSES);
    }
  },

  forceSeedFirestore: async () => {
    await seedFirestoreIfEmpty();
  },

  // -------------------------------------------------------------
  // PROPERTIES API
  // -------------------------------------------------------------
  getProperties: async (): Promise<Property[]> => {
    if (isFirebaseMode()) {
      try {
        const snap = await getDocs(collection(db, "properties"));
        const properties: Property[] = [];
        snap.forEach((doc) => {
          properties.push(doc.data() as Property);
        });
        return properties.sort((a, b) => a.name.localeCompare(b.name));
      } catch (err) {
        console.error("Firebase Error in getProperties:", err);
        return [];
      }
    } else {
      return getLocalData<Property>("pg_mock_properties", SEED_PROPERTIES).sort((a, b) => a.name.localeCompare(b.name));
    }
  },

  addProperty: async (property: Property): Promise<void> => {
    if (isFirebaseMode()) {
      await setDoc(doc(db, "properties", property.id), property);
    } else {
      const properties = getLocalData<Property>("pg_mock_properties", SEED_PROPERTIES);
      properties.push(property);
      setLocalData("pg_mock_properties", properties);
    }
  },

  updateProperty: async (propertyId: string, updatedProperty: Property): Promise<void> => {
    if (isFirebaseMode()) {
      await setDoc(doc(db, "properties", propertyId), updatedProperty);
    } else {
      const properties = getLocalData<Property>("pg_mock_properties", SEED_PROPERTIES);
      const index = properties.findIndex((p) => p.id === propertyId);
      if (index !== -1) {
        properties[index] = updatedProperty;
        setLocalData("pg_mock_properties", properties);
      }
    }
  },

  // -------------------------------------------------------------
  // ROOMS API
  // -------------------------------------------------------------
  getRooms: async (propertyId: string): Promise<Room[]> => {
    if (isFirebaseMode()) {
      try {
        const q = query(collection(db, "rooms"), where("propertyId", "==", propertyId));
        const snap = await getDocs(q);
        const rooms: Room[] = [];
        snap.forEach((doc) => {
          rooms.push(doc.data() as Room);
        });
        return rooms.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
      } catch (err) {
        console.error("Firebase Error in getRooms:", err);
        return [];
      }
    } else {
      return getLocalData<Room>("pg_mock_rooms", SEED_ROOMS)
        .filter(r => r.propertyId === propertyId)
        .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
    }
  },

  addRoom: async (room: Room): Promise<void> => {
    if (isFirebaseMode()) {
      await setDoc(doc(db, "rooms", room.id), room);
    } else {
      const rooms = getLocalData<Room>("pg_mock_rooms", SEED_ROOMS);
      rooms.push(room);
      setLocalData("pg_mock_rooms", rooms);
    }
  },

  updateRoom: async (roomId: string, updatedRoom: Room): Promise<void> => {
    if (isFirebaseMode()) {
      await setDoc(doc(db, "rooms", roomId), updatedRoom);
    } else {
      const rooms = getLocalData<Room>("pg_mock_rooms", SEED_ROOMS);
      const index = rooms.findIndex((r) => r.id === roomId);
      if (index !== -1) {
        rooms[index] = updatedRoom;
        setLocalData("pg_mock_rooms", rooms);
      }
    }
  },

  // -------------------------------------------------------------
  // TENANTS API
  // -------------------------------------------------------------
  getTenants: async (propertyId: string): Promise<Tenant[]> => {
    if (isFirebaseMode()) {
      try {
        const q = query(collection(db, "tenants"), where("propertyId", "==", propertyId));
        const snap = await getDocs(q);
        const tenants: Tenant[] = [];
        snap.forEach((doc) => {
          tenants.push(doc.data() as Tenant);
        });
        return tenants;
      } catch (err) {
        console.error("Firebase Error in getTenants:", err);
        return [];
      }
    } else {
      return getLocalData<Tenant>("pg_mock_tenants", SEED_TENANTS).filter(t => t.propertyId === propertyId);
    }
  },

  getTenantByPhone: async (phone: string): Promise<Tenant | null> => {
    if (isFirebaseMode()) {
      try {
        const q = query(collection(db, "tenants"), where("phone", "==", phone));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs[0].data() as Tenant;
        }
        // Fallback for +91 numbers in mock DB style
        const rawPhone = phone.replace("+91", "");
        const q2 = query(collection(db, "tenants"), where("phone", "==", rawPhone));
        const snap2 = await getDocs(q2);
        if (!snap2.empty) {
          return snap2.docs[0].data() as Tenant;
        }
        return null;
      } catch (err) {
        console.error("Firebase Error in getTenantByPhone:", err);
        return null;
      }
    } else {
      const tenants = getLocalData<Tenant>("pg_mock_tenants", SEED_TENANTS);
      const rawPhone = phone.replace("+91", "");
      const tenant = tenants.find((t) => t.phone === phone || t.phone === rawPhone);
      return tenant || null;
    }
  },

  onboardTenant: async (tenant: Tenant): Promise<void> => {
    if (isFirebaseMode()) {
      // 1. Add tenant doc
      await setDoc(doc(db, "tenants", tenant.id), tenant);

      // 2. Update room's bed status
      const roomDoc = await getDoc(doc(db, "rooms", tenant.roomId));
      if (roomDoc.exists()) {
        const room = roomDoc.data() as Room;
        const updatedBeds = room.beds.map((b) => {
          if (b.id === tenant.bedId) {
            return { ...b, status: "occupied" as const, tenantId: tenant.id };
          }
          return b;
        });
        const updatedRoom = { ...room, beds: updatedBeds };
        await setDoc(doc(db, "rooms", tenant.roomId), updatedRoom);
      }
    } else {
      const tenants = getLocalData<Tenant>("pg_mock_tenants", SEED_TENANTS);
      tenants.push(tenant);
      setLocalData("pg_mock_tenants", tenants);

      const rooms = getLocalData<Room>("pg_mock_rooms", SEED_ROOMS);
      const roomIndex = rooms.findIndex((r) => r.id === tenant.roomId);
      if (roomIndex !== -1) {
        const updatedBeds = rooms[roomIndex].beds.map((b) => {
          if (b.id === tenant.bedId) {
            return { ...b, status: "occupied" as const, tenantId: tenant.id };
          }
          return b;
        });
        rooms[roomIndex].beds = updatedBeds;
        setLocalData("pg_mock_rooms", rooms);
      }
    }
  },

  checkoutTenant: async (tenantId: string): Promise<void> => {
    if (isFirebaseMode()) {
      const tenantDoc = await getDoc(doc(db, "tenants", tenantId));
      if (tenantDoc.exists()) {
        const t = tenantDoc.data() as Tenant;
        
        const updatedTenant = {
          ...t,
          status: "checked_out" as const,
          checkOutDate: new Date().toISOString().split("T")[0]
        };
        await setDoc(doc(db, "tenants", tenantId), updatedTenant);

        const roomDoc = await getDoc(doc(db, "rooms", t.roomId));
        if (roomDoc.exists()) {
          const room = roomDoc.data() as Room;
          const updatedBeds = room.beds.map((b) => {
            if (b.tenantId === tenantId) {
              return { ...b, status: "available" as const, tenantId: null };
            }
            return b;
          });
          const updatedRoom = { ...room, beds: updatedBeds };
          await setDoc(doc(db, "rooms", t.roomId), updatedRoom);
        }
      }
    } else {
      const tenants = getLocalData<Tenant>("pg_mock_tenants", SEED_TENANTS);
      const tenantIndex = tenants.findIndex((t) => t.id === tenantId);
      if (tenantIndex !== -1) {
        const t = tenants[tenantIndex];
        t.status = "checked_out";
        t.checkOutDate = new Date().toISOString().split("T")[0];
        setLocalData("pg_mock_tenants", tenants);

        const rooms = getLocalData<Room>("pg_mock_rooms", SEED_ROOMS);
        const roomIndex = rooms.findIndex((r) => r.id === t.roomId);
        if (roomIndex !== -1) {
          rooms[roomIndex].beds = rooms[roomIndex].beds.map((b) => {
            if (b.tenantId === tenantId) {
              return { ...b, status: "available" as const, tenantId: null };
            }
            return b;
          });
          setLocalData("pg_mock_rooms", rooms);
        }
      }
    }
  },

  // -------------------------------------------------------------
  // BILLING API
  // -------------------------------------------------------------
  getBilling: async (propertyId: string): Promise<BillingRecord[]> => {
    if (isFirebaseMode()) {
      try {
        const q = query(collection(db, "billing"), where("propertyId", "==", propertyId));
        const snap = await getDocs(q);
        const records: BillingRecord[] = [];
        snap.forEach((doc) => {
          records.push(doc.data() as BillingRecord);
        });
        return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      } catch (err) {
        console.error("Firebase Error in getBilling:", err);
        return [];
      }
    } else {
      return getLocalData<BillingRecord>("pg_mock_billing", SEED_BILLING)
        .filter(b => b.propertyId === propertyId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  },

  addBilling: async (billing: BillingRecord): Promise<void> => {
    if (isFirebaseMode()) {
      await setDoc(doc(db, "billing", billing.id), billing);
    } else {
      const records = getLocalData<BillingRecord>("pg_mock_billing", SEED_BILLING);
      records.push(billing);
      setLocalData("pg_mock_billing", records);
    }
  },

  updateBillPaymentStatus: async (
    billId: string, 
    type: "rent" | "electricity" | "both", 
    paidAmount: number,
    date: string
  ): Promise<void> => {
    if (isFirebaseMode()) {
      const billDoc = await getDoc(doc(db, "billing", billId));
      if (billDoc.exists()) {
        const b = billDoc.data() as BillingRecord;
        const newPaidAmount = b.paidAmount + paidAmount;
        let updates: Partial<BillingRecord> = { paidAmount: newPaidAmount };

        if (type === "rent") {
          updates.rentStatus = "paid";
          updates.rentPaidDate = date;
        } else if (type === "electricity") {
          updates.electricityStatus = "paid";
          updates.electricityPaidDate = date;
        } else if (type === "both") {
          updates.rentStatus = "paid";
          updates.rentPaidDate = date;
          updates.electricityStatus = "paid";
          updates.electricityPaidDate = date;
        }
        await updateDoc(doc(db, "billing", billId), updates);
      }
    } else {
      const bills = getLocalData<BillingRecord>("pg_mock_billing", SEED_BILLING);
      const index = bills.findIndex((b) => b.id === billId);
      if (index !== -1) {
        const b = bills[index];
        b.paidAmount = b.paidAmount + paidAmount;
        if (type === "rent") {
          b.rentStatus = "paid";
          b.rentPaidDate = date;
        } else if (type === "electricity") {
          b.electricityStatus = "paid";
          b.electricityPaidDate = date;
        } else if (type === "both") {
          b.rentStatus = "paid";
          b.rentPaidDate = date;
          b.electricityStatus = "paid";
          b.electricityPaidDate = date;
        }
        setLocalData("pg_mock_billing", bills);
      }
    }
  },

  // -------------------------------------------------------------
  // SECURITY LOGS API
  // -------------------------------------------------------------
  getSecurityLogs: async (propertyId: string): Promise<SecurityLog[]> => {
    if (isFirebaseMode()) {
      try {
        const q = query(collection(db, "securityLogs"), where("propertyId", "==", propertyId));
        const snap = await getDocs(q);
        const logs: SecurityLog[] = [];
        snap.forEach((doc) => {
          logs.push(doc.data() as SecurityLog);
        });
        return logs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      } catch (err) {
        console.error("Firebase Error in getSecurityLogs:", err);
        return [];
      }
    } else {
      return getLocalData<SecurityLog>("pg_mock_securityLogs", SEED_SECURITY_LOGS)
        .filter(l => l.propertyId === propertyId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  },

  addSecurityLog: async (log: SecurityLog): Promise<void> => {
    if (isFirebaseMode()) {
      await setDoc(doc(db, "securityLogs", log.id), log);
    } else {
      const logs = getLocalData<SecurityLog>("pg_mock_securityLogs", SEED_SECURITY_LOGS);
      logs.push(log);
      setLocalData("pg_mock_securityLogs", logs);
    }
  },

  updateSecurityLogStatus: async (logId: string, status: "approved" | "resolved"): Promise<void> => {
    if (isFirebaseMode()) {
      const updates: Partial<SecurityLog> = { status };
      if (status === "resolved") {
        updates.resolvedAt = new Date().toISOString();
      }
      await updateDoc(doc(db, "securityLogs", logId), updates);
    } else {
      const logs = getLocalData<SecurityLog>("pg_mock_securityLogs", SEED_SECURITY_LOGS);
      const index = logs.findIndex((l) => l.id === logId);
      if (index !== -1) {
        logs[index].status = status;
        if (status === "resolved") {
          logs[index].resolvedAt = new Date().toISOString();
        }
        setLocalData("pg_mock_securityLogs", logs);
      }
    }
  },

  // -------------------------------------------------------------
  // ASSETS API
  // -------------------------------------------------------------
  getAssets: async (propertyId: string): Promise<Asset[]> => {
    if (isFirebaseMode()) {
      try {
        const q = query(collection(db, "assets"), where("propertyId", "==", propertyId));
        const snap = await getDocs(q);
        const assets: Asset[] = [];
        snap.forEach((doc) => {
          assets.push(doc.data() as Asset);
        });
        return assets.sort((a, b) => a.name.localeCompare(b.name));
      } catch (err) {
        console.error("Firebase Error in getAssets:", err);
        return [];
      }
    } else {
      return getLocalData<Asset>("pg_mock_assets", SEED_ASSETS)
        .filter(a => a.propertyId === propertyId)
        .sort((a, b) => a.name.localeCompare(b.name));
    }
  },

  addAsset: async (asset: Asset): Promise<void> => {
    if (isFirebaseMode()) {
      await setDoc(doc(db, "assets", asset.id), asset);
    } else {
      const assets = getLocalData<Asset>("pg_mock_assets", SEED_ASSETS);
      assets.push(asset);
      setLocalData("pg_mock_assets", assets);
    }
  },

  updateAsset: async (assetId: string, updatedAsset: Asset): Promise<void> => {
    if (isFirebaseMode()) {
      await setDoc(doc(db, "assets", assetId), updatedAsset);
    } else {
      const assets = getLocalData<Asset>("pg_mock_assets", SEED_ASSETS);
      const index = assets.findIndex((a) => a.id === assetId);
      if (index !== -1) {
        assets[index] = updatedAsset;
        setLocalData("pg_mock_assets", assets);
      }
    }
  },

  deleteAsset: async (assetId: string): Promise<void> => {
    if (isFirebaseMode()) {
      await deleteDoc(doc(db, "assets", assetId));
    } else {
      const assets = getLocalData<Asset>("pg_mock_assets", SEED_ASSETS);
      const filtered = assets.filter((a) => a.id !== assetId);
      setLocalData("pg_mock_assets", filtered);
    }
  },

  // -------------------------------------------------------------
  // FINES API
  // -------------------------------------------------------------
  getFines: async (propertyId: string): Promise<Fine[]> => {
    if (isFirebaseMode()) {
      try {
        const q = query(collection(db, "fines"), where("propertyId", "==", propertyId));
        const snap = await getDocs(q);
        const fines: Fine[] = [];
        snap.forEach((doc) => {
          fines.push(doc.data() as Fine);
        });
        return fines.sort((a, b) => b.date.localeCompare(a.date));
      } catch (err) {
        console.error("Firebase Error in getFines:", err);
        return [];
      }
    } else {
      return getLocalData<Fine>("pg_mock_fines", SEED_FINES)
        .filter(f => f.propertyId === propertyId)
        .sort((a, b) => b.date.localeCompare(a.date));
    }
  },

  addFine: async (fine: Fine): Promise<void> => {
    if (isFirebaseMode()) {
      await setDoc(doc(db, "fines", fine.id), fine);
    } else {
      const fines = getLocalData<Fine>("pg_mock_fines", SEED_FINES);
      fines.push(fine);
      setLocalData("pg_mock_fines", fines);
    }
  },

  updateFineStatus: async (fineId: string, status: "paid" | "unpaid"): Promise<void> => {
    if (isFirebaseMode()) {
      await updateDoc(doc(db, "fines", fineId), { status });
    } else {
      const fines = getLocalData<Fine>("pg_mock_fines", SEED_FINES);
      const index = fines.findIndex(f => f.id === fineId);
      if (index !== -1) {
        fines[index].status = status;
        setLocalData("pg_mock_fines", fines);
      }
    }
  },

  // -------------------------------------------------------------
  // STAFF API
  // -------------------------------------------------------------
  getStaff: async (propertyId: string): Promise<Staff[]> => {
    if (isFirebaseMode()) {
      try {
        const q = query(collection(db, "staff"), where("propertyId", "==", propertyId));
        const snap = await getDocs(q);
        const staff: Staff[] = [];
        snap.forEach((doc) => {
          staff.push(doc.data() as Staff);
        });
        return staff.sort((a, b) => a.name.localeCompare(b.name));
      } catch (err) {
        console.error("Firebase Error in getStaff:", err);
        return [];
      }
    } else {
      return getLocalData<Staff>("pg_mock_staff", SEED_STAFF)
        .filter(s => s.propertyId === propertyId)
        .sort((a, b) => a.name.localeCompare(b.name));
    }
  },

  addStaff: async (staff: Staff): Promise<void> => {
    if (isFirebaseMode()) {
      await setDoc(doc(db, "staff", staff.id), staff);
    } else {
      const staffList = getLocalData<Staff>("pg_mock_staff", SEED_STAFF);
      staffList.push(staff);
      setLocalData("pg_mock_staff", staffList);
    }
  },

  updateStaff: async (staffId: string, updatedStaff: Staff): Promise<void> => {
    if (isFirebaseMode()) {
      await setDoc(doc(db, "staff", staffId), updatedStaff);
    } else {
      const staffList = getLocalData<Staff>("pg_mock_staff", SEED_STAFF);
      const index = staffList.findIndex(s => s.id === staffId);
      if (index !== -1) {
        staffList[index] = updatedStaff;
        setLocalData("pg_mock_staff", staffList);
      }
    }
  },

  // -------------------------------------------------------------
  // STAFF ATTENDANCE & ADVANCES API
  // -------------------------------------------------------------
  getStaffAttendance: async (propertyId: string): Promise<StaffAttendance[]> => {
    if (isFirebaseMode()) {
      try {
        const q = query(collection(db, "staffAttendance"), where("propertyId", "==", propertyId));
        const snap = await getDocs(q);
        const att: StaffAttendance[] = [];
        snap.forEach((doc) => att.push(doc.data() as StaffAttendance));
        return att;
      } catch (err) {
        console.error("Firebase Error in getStaffAttendance:", err);
        return [];
      }
    } else {
      return getLocalData<StaffAttendance>("pg_mock_attendance", SEED_ATTENDANCE)
        .filter(a => a.propertyId === propertyId);
    }
  },

  addStaffAttendance: async (attendance: StaffAttendance): Promise<void> => {
    if (isFirebaseMode()) {
      await setDoc(doc(db, "staffAttendance", attendance.id), attendance);
    } else {
      const attList = getLocalData<StaffAttendance>("pg_mock_attendance", SEED_ATTENDANCE);
      // Upsert by date and staffId
      const index = attList.findIndex(a => a.staffId === attendance.staffId && a.date === attendance.date);
      if (index !== -1) {
        attList[index] = attendance;
      } else {
        attList.push(attendance);
      }
      setLocalData("pg_mock_attendance", attList);
    }
  },

  getStaffAdvances: async (propertyId: string): Promise<StaffAdvance[]> => {
    if (isFirebaseMode()) {
      try {
        const q = query(collection(db, "staffAdvances"), where("propertyId", "==", propertyId));
        const snap = await getDocs(q);
        const adv: StaffAdvance[] = [];
        snap.forEach((doc) => adv.push(doc.data() as StaffAdvance));
        return adv;
      } catch (err) {
        console.error("Firebase Error in getStaffAdvances:", err);
        return [];
      }
    } else {
      return getLocalData<StaffAdvance>("pg_mock_advances", SEED_ADVANCES)
        .filter(a => a.propertyId === propertyId);
    }
  },

  addStaffAdvance: async (advance: StaffAdvance): Promise<void> => {
    if (isFirebaseMode()) {
      await setDoc(doc(db, "staffAdvances", advance.id), advance);
    } else {
      const advList = getLocalData<StaffAdvance>("pg_mock_advances", SEED_ADVANCES);
      advList.push(advance);
      setLocalData("pg_mock_advances", advList);
    }
  },

  // -------------------------------------------------------------
  // EXPENSES API
  // -------------------------------------------------------------
  getExpenses: async (propertyId: string): Promise<Expense[]> => {
    if (isFirebaseMode()) {
      try {
        const q = query(collection(db, "expenses"), where("propertyId", "==", propertyId));
        const snap = await getDocs(q);
        const exp: Expense[] = [];
        snap.forEach((doc) => exp.push(doc.data() as Expense));
        return exp.sort((a, b) => b.date.localeCompare(a.date));
      } catch (err) {
        console.error("Firebase Error in getExpenses:", err);
        return [];
      }
    } else {
      return getLocalData<Expense>("pg_mock_expenses", SEED_EXPENSES)
        .filter(e => e.propertyId === propertyId)
        .sort((a, b) => b.date.localeCompare(a.date));
    }
  },

  addExpense: async (expense: Expense): Promise<void> => {
    if (isFirebaseMode()) {
      await setDoc(doc(db, "expenses", expense.id), expense);
    } else {
      const expenses = getLocalData<Expense>("pg_mock_expenses", SEED_EXPENSES);
      expenses.push(expense);
      setLocalData("pg_mock_expenses", expenses);
    }
  },

  // Developer / Settings helpers
  clearAllMockData: (): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pg_mock_properties", JSON.stringify([]));
      localStorage.setItem("pg_mock_rooms", JSON.stringify([]));
      localStorage.setItem("pg_mock_tenants", JSON.stringify([]));
      localStorage.setItem("pg_mock_billing", JSON.stringify([]));
      localStorage.setItem("pg_mock_securityLogs", JSON.stringify([]));
      localStorage.setItem("pg_mock_assets", JSON.stringify([]));
      localStorage.setItem("pg_mock_fines", JSON.stringify([]));
      localStorage.setItem("pg_mock_staff", JSON.stringify([]));
      localStorage.setItem("pg_mock_attendance", JSON.stringify([]));
      localStorage.setItem("pg_mock_advances", JSON.stringify([]));
      localStorage.setItem("pg_mock_expenses", JSON.stringify([]));
    }
  },

  factoryResetAllData: async (): Promise<void> => {
    if (isFirebaseMode()) {
      try {
        const collections = [
          "properties", "rooms", "tenants", "billing", 
          "securityLogs", "assets", "fines", "staff", 
          "staffAttendance", "staffAdvances", "expenses"
        ];
        for (const colName of collections) {
          const snap = await getDocs(collection(db, colName));
          const deletePromises = snap.docs.map((docSnap) => deleteDoc(docSnap.ref));
          await Promise.all(deletePromises);
        }
        console.log("Firestore collections wiped successfully.");
      } catch (err) {
        console.error("Error wiping Firestore collections:", err);
        throw err;
      }
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("pg_mock_properties", JSON.stringify([]));
      localStorage.setItem("pg_mock_rooms", JSON.stringify([]));
      localStorage.setItem("pg_mock_tenants", JSON.stringify([]));
      localStorage.setItem("pg_mock_billing", JSON.stringify([]));
      localStorage.setItem("pg_mock_securityLogs", JSON.stringify([]));
      localStorage.setItem("pg_mock_assets", JSON.stringify([]));
      localStorage.setItem("pg_mock_fines", JSON.stringify([]));
      localStorage.setItem("pg_mock_staff", JSON.stringify([]));
      localStorage.setItem("pg_mock_attendance", JSON.stringify([]));
      localStorage.setItem("pg_mock_advances", JSON.stringify([]));
      localStorage.setItem("pg_mock_expenses", JSON.stringify([]));
    }
  }
};
