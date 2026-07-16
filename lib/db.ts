import { db } from "./firebase";
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  deleteDoc
} from "firebase/firestore";

// Interfaces
export interface Bed {
  id: string;
  name: string;
  status: "available" | "occupied" | "maintenance";
  tenantId: string | null;
}

export interface Room {
  id: string; // Room number, e.g. "101"
  floor: number;
  type: "Single" | "Double" | "Triple" | "Four Sharing";
  rent: number;
  beds: Bed[];
}

export interface Tenant {
  id: string;
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
  type: "visitor" | "gate_pass" | "complaint";
  tenantId: string | null;
  tenantName: string | null;
  title: string;
  description: string;
  status: "pending" | "approved" | "resolved";
  createdAt: string;
  resolvedAt?: string | null;
}

// Seed Data
const SEED_ROOMS: Room[] = [
  {
    id: "101",
    floor: 1,
    type: "Single",
    rent: 15000,
    beds: [
      { id: "101-A", name: "Bed A", status: "occupied", tenantId: "tenant-1" }
    ]
  },
  {
    id: "102",
    floor: 1,
    type: "Double",
    rent: 8000,
    beds: [
      { id: "102-A", name: "Bed A", status: "occupied", tenantId: "tenant-2" },
      { id: "102-B", name: "Bed B", status: "available", tenantId: null }
    ]
  },
  {
    id: "201",
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
    id: "202",
    floor: 2,
    type: "Double",
    rent: 8500,
    beds: [
      { id: "202-A", name: "Bed A", status: "available", tenantId: null },
      { id: "202-B", name: "Bed B", status: "available", tenantId: null }
    ]
  },
  {
    id: "301",
    floor: 3,
    type: "Single",
    rent: 16000,
    beds: [
      { id: "301-A", name: "Bed A", status: "available", tenantId: null }
    ]
  },
  {
    id: "302",
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
    name: "Rahul Sharma",
    email: "rahul.sharma@example.com",
    phone: "9876543210",
    idProofType: "Aadhaar",
    idProofNumber: "1234-5678-9012",
    emergencyName: "Sanjay Sharma",
    emergencyPhone: "9876543211",
    roomId: "101",
    bedId: "101-A",
    checkInDate: "2026-05-10",
    checkOutDate: null,
    rentAmount: 15000,
    securityDeposit: 15000,
    status: "active"
  },
  {
    id: "tenant-2",
    name: "Priya Patel",
    email: "priya.patel@example.com",
    phone: "9812345678",
    idProofType: "PAN",
    idProofNumber: "ABCDE1234F",
    emergencyName: "Karan Patel",
    emergencyPhone: "9812345679",
    roomId: "102",
    bedId: "102-A",
    checkInDate: "2026-06-01",
    checkOutDate: null,
    rentAmount: 8000,
    securityDeposit: 8000,
    status: "active"
  },
  {
    id: "tenant-3",
    name: "Amit Verma",
    email: "amit.verma@example.com",
    phone: "9887654321",
    idProofType: "Aadhaar",
    idProofNumber: "9876-5432-1098",
    emergencyName: "Ramesh Verma",
    emergencyPhone: "9887654322",
    roomId: "201",
    bedId: "201-A",
    checkInDate: "2026-06-15",
    checkOutDate: null,
    rentAmount: 6000,
    securityDeposit: 6000,
    status: "active"
  },
  {
    id: "tenant-4",
    name: "Sneha Reddy",
    email: "sneha.reddy@example.com",
    phone: "9912345678",
    idProofType: "Passport",
    idProofNumber: "Z1234567",
    emergencyName: "Madhusudhan Reddy",
    emergencyPhone: "9912345679",
    roomId: "201",
    bedId: "201-B",
    checkInDate: "2026-07-01",
    checkOutDate: null,
    rentAmount: 6000,
    securityDeposit: 6000,
    status: "active"
  },
  {
    id: "tenant-5",
    name: "Vikram Singh",
    email: "vikram.singh@example.com",
    phone: "9712345678",
    idProofType: "Aadhaar",
    idProofNumber: "4567-8901-2345",
    emergencyName: "Harbhajan Singh",
    emergencyPhone: "9712345679",
    roomId: "102",
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
    tenantId: "tenant-1",
    tenantName: "Rahul Sharma",
    roomId: "101",
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
    tenantId: "tenant-1",
    tenantName: "Rahul Sharma",
    roomId: "101",
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
    tenantId: "tenant-2",
    tenantName: "Priya Patel",
    roomId: "102",
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
    tenantId: "tenant-2",
    tenantName: "Priya Patel",
    roomId: "102",
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
    tenantId: "tenant-3",
    tenantName: "Amit Verma",
    roomId: "201",
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
    type: "complaint",
    tenantId: "tenant-2",
    tenantName: "Priya Patel",
    title: "Room 102 Wi-Fi slow",
    description: "Speed dropped below 5Mbps. Unable to attend Zoom calls.",
    status: "pending",
    createdAt: "2026-07-14T09:15:00Z"
  }
];

// Helper to determine active DB mode
const isFirebaseMode = (): boolean => {
  if (typeof window === "undefined") return true; // Server side defaults to firebase API structure
  const mode = localStorage.getItem("pg_db_mode");
  return mode === "firebase" || mode === null; // Default to firebase mode now as per user instruction
};

// Seeding FireStore if collection is empty
const seedFirestoreIfEmpty = async () => {
  try {
    const rSnap = await getDocs(collection(db, "rooms"));
    if (rSnap.empty) {
      console.log("Firestore empty. Seeding Firestore collections...");
      // Seed Rooms
      for (const room of SEED_ROOMS) {
        await setDoc(doc(db, "rooms", room.id), room);
      }
      // Seed Tenants
      for (const tenant of SEED_TENANTS) {
        await setDoc(doc(db, "tenants", tenant.id), tenant);
      }
      // Seed Billing
      for (const bill of SEED_BILLING) {
        await setDoc(doc(db, "billing", bill.id), bill);
      }
      // Seed Security Logs
      for (const log of SEED_SECURITY_LOGS) {
        await setDoc(doc(db, "securityLogs", log.id), log);
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
  // Initialize Database
  init: async () => {
    if (isFirebaseMode()) {
      // In production Firebase mode, do not automatically seed dummy data on boot
      console.log("Connected to live Firebase. Ready for clean production queries.");
    } else {
      // Just load local data to initialize LocalStorage keys in mock mode
      getLocalData<Room>("pg_mock_rooms", SEED_ROOMS);
      getLocalData<Tenant>("pg_mock_tenants", SEED_TENANTS);
      getLocalData<BillingRecord>("pg_mock_billing", SEED_BILLING);
      getLocalData<SecurityLog>("pg_mock_securityLogs", SEED_SECURITY_LOGS);
    }
  },

  forceSeedFirestore: async () => {
    await seedFirestoreIfEmpty();
  },


  // -------------------------------------------------------------
  // ROOMS API
  // -------------------------------------------------------------
  getRooms: async (): Promise<Room[]> => {
    if (isFirebaseMode()) {
      try {
        const snap = await getDocs(collection(db, "rooms"));
        const rooms: Room[] = [];
        snap.forEach((doc) => {
          rooms.push(doc.data() as Room);
        });
        // Sort rooms by room number/id
        return rooms.sort((a, b) => a.id.localeCompare(b.id));
      } catch (err) {
        console.error("Firebase Error in getRooms:", err);
        return [];
      }
    } else {
      return getLocalData<Room>("pg_mock_rooms", SEED_ROOMS).sort((a, b) => a.id.localeCompare(b.id));
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
  getTenants: async (): Promise<Tenant[]> => {
    if (isFirebaseMode()) {
      try {
        const snap = await getDocs(collection(db, "tenants"));
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
      return getLocalData<Tenant>("pg_mock_tenants", SEED_TENANTS);
    }
  },

  onboardTenant: async (tenant: Tenant): Promise<void> => {
    if (isFirebaseMode()) {
      // 1. Add tenant doc
      await setDoc(doc(db, "tenants", tenant.id), tenant);

      // 2. Update room's bed status
      const rooms = await dbService.getRooms();
      const room = rooms.find((r) => r.id === tenant.roomId);
      if (room) {
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
      // Onboard mock tenant
      const tenants = getLocalData<Tenant>("pg_mock_tenants", SEED_TENANTS);
      tenants.push(tenant);
      setLocalData("pg_mock_tenants", tenants);

      // Update room bed in mock
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
      // 1. Fetch tenant to know their room and bed
      const tenantsSnap = await getDocs(collection(db, "tenants"));
      let tenant: Tenant | null = null;
      tenantsSnap.forEach((doc) => {
        const t = doc.data() as Tenant;
        if (t.id === tenantId) tenant = t;
      });

      if (tenant) {
        const t = tenant as Tenant;
        // 2. Update tenant doc status
        const updatedTenant = {
          ...t,
          status: "checked_out" as const,
          checkOutDate: new Date().toISOString().split("T")[0]
        };
        await setDoc(doc(db, "tenants", tenantId), updatedTenant);

        // 3. Update room's bed status to available
        const rooms = await dbService.getRooms();
        const room = rooms.find((r) => r.id === t.roomId);
        if (room) {
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
      // Checkout in mock
      const tenants = getLocalData<Tenant>("pg_mock_tenants", SEED_TENANTS);
      const tenantIndex = tenants.findIndex((t) => t.id === tenantId);
      if (tenantIndex !== -1) {
        const t = tenants[tenantIndex];
        t.status = "checked_out";
        t.checkOutDate = new Date().toISOString().split("T")[0];
        setLocalData("pg_mock_tenants", tenants);

        // Free bed in room
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
  getBilling: async (): Promise<BillingRecord[]> => {
    if (isFirebaseMode()) {
      try {
        const snap = await getDocs(collection(db, "billing"));
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
      return getLocalData<BillingRecord>("pg_mock_billing", SEED_BILLING).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
      // Fetch bill first
      const snap = await getDocs(collection(db, "billing"));
      let bill: BillingRecord | null = null;
      snap.forEach((doc) => {
        const b = doc.data() as BillingRecord;
        if (b.id === billId) bill = b;
      });

      if (bill) {
        const b = bill as BillingRecord;
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
      // Mock update
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
  getSecurityLogs: async (): Promise<SecurityLog[]> => {
    if (isFirebaseMode()) {
      try {
        const snap = await getDocs(collection(db, "securityLogs"));
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
      return getLocalData<SecurityLog>("pg_mock_securityLogs", SEED_SECURITY_LOGS).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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

  // Developer / Settings helpers
  clearAllMockData: (): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pg_mock_rooms", JSON.stringify([]));
      localStorage.setItem("pg_mock_tenants", JSON.stringify([]));
      localStorage.setItem("pg_mock_billing", JSON.stringify([]));
      localStorage.setItem("pg_mock_securityLogs", JSON.stringify([]));
    }
  },

  factoryResetAllData: async (): Promise<void> => {
    // 1. If in Firebase mode, delete all docs from Firestore collections
    if (isFirebaseMode()) {
      try {
        const collections = ["rooms", "tenants", "billing", "securityLogs"];
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

    // 2. Also wipe local storage keys explicitly to empty arrays [] so both modes have 0 data
    if (typeof window !== "undefined") {
      localStorage.setItem("pg_mock_rooms", JSON.stringify([]));
      localStorage.setItem("pg_mock_tenants", JSON.stringify([]));
      localStorage.setItem("pg_mock_billing", JSON.stringify([]));
      localStorage.setItem("pg_mock_securityLogs", JSON.stringify([]));
    }
  }
};

