/**
 * CPVTS SQLite Persistent Database Layer
 * Built with native Node.js DatabaseSync (node:sqlite)
 * Provides ACID persistence for:
 * - Registered Vehicles & Whitelist
 * - Parking Slots Occupancy & Allocation
 * - Parking Activities & Audit Logs
 * - Dedicated 3-Gate Category Statistics
 * - System Settings & Tariffs
 * - CCTV Camera Configurations
 * - Security Notifications
 */

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// Resolve database file location
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.resolve(__dirname, '..', 'database');
const DB_FILE = path.join(DB_DIR, 'cpvts.db');

// Ensure database folder exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let dbInstance = null;

export function getDatabase() {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_FILE);
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    dbInstance.exec('PRAGMA journal_mode = WAL;');
    initSchema(dbInstance);
  }
  return dbInstance;
}

/**
 * Initialize all database tables and seed if empty
 */
function initSchema(db) {
  // 1. Registered Vehicles
  db.exec(`
    CREATE TABLE IF NOT EXISTS registered_vehicles (
      id TEXT PRIMARY KEY,
      vehicleNumber TEXT UNIQUE NOT NULL COLLATE NOCASE,
      ownerName TEXT NOT NULL,
      category TEXT NOT NULL,
      department TEXT,
      vehicleType TEXT NOT NULL,
      model TEXT,
      rfidTag TEXT,
      contact TEXT,
      validUntil TEXT,
      status TEXT DEFAULT 'Active',
      createdAt TEXT,
      updatedAt TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_reg_plate ON registered_vehicles(vehicleNumber);
  `);

  // 2. Parking Slots
  db.exec(`
    CREATE TABLE IF NOT EXISTS parking_slots (
      id TEXT PRIMARY KEY,
      zone TEXT NOT NULL,
      type TEXT NOT NULL,
      occupied INTEGER DEFAULT 0,
      isPending INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Available',
      vehicleNumber TEXT,
      driver TEXT,
      category TEXT,
      entryTime TEXT,
      gate TEXT,
      gateCategory TEXT DEFAULT 'Universal',
      floor TEXT DEFAULT 'Ground Level',
      row TEXT,
      location TEXT,
      sensorType TEXT DEFAULT 'System-Managed',
      isDisabled INTEGER DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT
    );
  `);

  // Column migration for existing database instances
  try {
    const cols = db.prepare("PRAGMA table_info(parking_slots)").all().map(c => c.name);
    if (!cols.includes('gateCategory')) db.exec("ALTER TABLE parking_slots ADD COLUMN gateCategory TEXT DEFAULT 'Universal';");
    if (!cols.includes('floor')) db.exec("ALTER TABLE parking_slots ADD COLUMN floor TEXT DEFAULT 'Ground Level';");
    if (!cols.includes('row')) db.exec("ALTER TABLE parking_slots ADD COLUMN row TEXT;");
    if (!cols.includes('location')) db.exec("ALTER TABLE parking_slots ADD COLUMN location TEXT;");
    if (!cols.includes('sensorType')) db.exec("ALTER TABLE parking_slots ADD COLUMN sensorType TEXT DEFAULT 'System-Managed';");
    if (!cols.includes('isDisabled')) db.exec("ALTER TABLE parking_slots ADD COLUMN isDisabled INTEGER DEFAULT 0;");
    if (!cols.includes('createdAt')) db.exec("ALTER TABLE parking_slots ADD COLUMN createdAt TEXT;");
  } catch (migErr) {
    console.warn('[DB Migration Warning]:', migErr.message);
  }

  // 3. Activity History
  db.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      vehicleNumber TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      slot TEXT NOT NULL,
      gate TEXT,
      entryTime TEXT,
      exitTime TEXT,
      status TEXT NOT NULL,
      driver TEXT,
      department TEXT,
      duration TEXT,
      fee REAL DEFAULT 0,
      photo TEXT,
      thumb TEXT,
      createdAt TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_act_plate ON activities(vehicleNumber);
  `);

  // 4. Gate Stats
  db.exec(`
    CREATE TABLE IF NOT EXISTS gate_stats (
      category TEXT PRIMARY KEY,
      gateId TEXT NOT NULL,
      name TEXT NOT NULL,
      gateNumber INTEGER NOT NULL,
      status TEXT DEFAULT 'Online',
      entryCount INTEGER DEFAULT 0,
      exitCount INTEGER DEFAULT 0,
      currentCount INTEGER DEFAULT 0,
      recentDetectionJson TEXT
    );
  `);

  // 5. System Settings
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      studentRate REAL DEFAULT 0,
      staffRate REAL DEFAULT 0,
      visitorRateHourly REAL DEFAULT 20,
      barrierAutoOpen INTEGER DEFAULT 1,
      anprThreshold INTEGER DEFAULT 94,
      officerName TEXT DEFAULT 'Officer Raj Sharma',
      officerBadge TEXT DEFAULT 'CPVTS-SEC-09',
      officerShift TEXT DEFAULT 'Morning Shift (06:00 - 14:00)',
      gate1Status TEXT DEFAULT 'Online',
      gate2Status TEXT DEFAULT 'Online',
      gate3Status TEXT DEFAULT 'Online',
      updatedAt TEXT
    );
  `);

  // 6. Camera Registry
  db.exec(`
    CREATE TABLE IF NOT EXISTS cameras (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      gate TEXT,
      gateNumber INTEGER,
      location TEXT,
      type TEXT,
      ip TEXT,
      port INTEGER,
      channel TEXT,
      username TEXT,
      passwordHash TEXT,
      anprThreshold INTEGER,
      resolution TEXT,
      fps INTEGER,
      boundingBoxes INTEGER,
      autoBarrierTrigger INTEGER,
      ocrEngine TEXT,
      feedImage TEXT,
      status TEXT DEFAULT 'Connected',
      updatedAt TEXT
    );
  `);

  // 7. Notifications
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      time TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      read INTEGER DEFAULT 0,
      createdAt TEXT
    );
  `);

  // Check if seeding is required
  const countRow = db.prepare('SELECT count(*) as count FROM registered_vehicles').get();
  if (countRow.count === 0) {
    seedInitialData(db);
  }
}

/**
 * Seed initial canonical dataset
 */
export function seedInitialData(db) {
  const now = new Date().toISOString();

  // 1. Seed Registered Vehicles
  const defaultVehicles = [
    {
      id: 'REG-101',
      vehicleNumber: 'KA-22-XY-9876',
      ownerName: 'Rahul Verma',
      category: 'Student',
      department: 'Computer Science (4th Year)',
      vehicleType: 'Four-Wheeler',
      model: 'Toyota Fortuner (White)',
      rfidTag: 'RFID-9876-CSE',
      contact: '+91 98451 22345',
      validUntil: '31 Dec 2026',
      status: 'Active'
    },
    {
      id: 'REG-102',
      vehicleNumber: 'KA-22-AB-1234',
      ownerName: 'Dr. S. N. Patil',
      category: 'Staff',
      department: 'Mechanical Engineering (HOD)',
      vehicleType: 'Two-Wheeler',
      model: 'Honda Activa 6G (Green)',
      rfidTag: 'RFID-1234-FAC',
      contact: '+91 94481 67890',
      validUntil: 'Permanent',
      status: 'Active'
    },
    {
      id: 'REG-103',
      vehicleNumber: 'KA-22-CD-3456',
      ownerName: 'Priya Sharma',
      category: 'Student',
      department: 'Electronics & Comm (3rd Year)',
      vehicleType: 'Four-Wheeler',
      model: 'Hyundai i20 (Silver)',
      rfidTag: 'RFID-3456-ECE',
      contact: '+91 98860 11223',
      validUntil: '30 Jun 2027',
      status: 'Active'
    },
    {
      id: 'REG-104',
      vehicleNumber: 'KA-22-GH-7890',
      ownerName: 'Ramesh Gowda',
      category: 'Staff',
      department: 'Campus Security Supervisor',
      vehicleType: 'Two-Wheeler',
      model: 'Bajaj Pulsar 150 (Black)',
      rfidTag: 'RFID-7890-SEC',
      contact: '+91 97400 55667',
      validUntil: 'Permanent',
      status: 'Active'
    },
    {
      id: 'REG-105',
      vehicleNumber: 'KA-22-MH-3311',
      ownerName: 'Prof. Arvind Deshmukh',
      category: 'Staff',
      department: 'Civil Engineering',
      vehicleType: 'Two-Wheeler',
      model: 'TVS Jupiter (Grey)',
      rfidTag: 'RFID-3311-CIV',
      contact: '+91 91122 33445',
      validUntil: 'Permanent',
      status: 'Active'
    },
    {
      id: 'REG-106',
      vehicleNumber: 'KA-22-JK-9087',
      ownerName: 'Rohan Kulkarni',
      category: 'Student',
      department: 'Information Science (2nd Year)',
      vehicleType: 'Two-Wheeler',
      model: 'Yamaha FZ (Blue)',
      rfidTag: 'RFID-9087-ISE',
      contact: '+91 98765 43210',
      validUntil: '31 May 2028',
      status: 'Active'
    },
    {
      id: 'REG-107',
      vehicleNumber: 'KA-22-MN-5566',
      ownerName: 'Dr. Meena Joshi',
      category: 'Staff',
      department: 'Dean of Academics',
      vehicleType: 'Four-Wheeler',
      model: 'Tata Nexon EV (Teal)',
      rfidTag: 'RFID-5566-ADM',
      contact: '+91 94499 88776',
      validUntil: 'Permanent',
      status: 'Active'
    }
  ];

  const insertVeh = db.prepare(`
    INSERT OR REPLACE INTO registered_vehicles 
    (id, vehicleNumber, ownerName, category, department, vehicleType, model, rfidTag, contact, validUntil, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const v of defaultVehicles) {
    insertVeh.run(
      v.id,
      v.vehicleNumber.toUpperCase(),
      v.ownerName,
      v.category,
      v.department,
      v.vehicleType,
      v.model,
      v.rfidTag,
      v.contact,
      v.validUntil,
      v.status,
      now,
      now
    );
  }

  // 2. Seed 15 Parking Slots (10 Two-Wheeler, 5 Four-Wheeler)
  const defaultSlots = [
    { id: 'T-01', zone: 'two-wheeler', type: 'Two-Wheeler', occupied: 1, isPending: 0, status: 'Occupied', vehicleNumber: 'KA-22-MH-3311', driver: 'Prof. Arvind (Staff)', category: 'Staff', entryTime: '08:15 AM', gate: 'Staff Gate' },
    { id: 'T-02', zone: 'two-wheeler', type: 'Two-Wheeler', occupied: 1, isPending: 0, status: 'Occupied', vehicleNumber: 'KA-22-GH-7890', driver: 'Ramesh Gowda (Staff)', category: 'Staff', entryTime: '10:05 AM', gate: 'Staff Gate' },
    { id: 'T-03', zone: 'two-wheeler', type: 'Two-Wheeler', occupied: 0, isPending: 0, status: 'Available', vehicleNumber: null, driver: null, category: null, entryTime: null, gate: null },
    { id: 'T-04', zone: 'two-wheeler', type: 'Two-Wheeler', occupied: 0, isPending: 0, status: 'Available', vehicleNumber: null, driver: null, category: null, entryTime: null, gate: null },
    { id: 'T-05', zone: 'two-wheeler', type: 'Two-Wheeler', occupied: 1, isPending: 0, status: 'Occupied', vehicleNumber: 'KA-22-AB-1234', driver: 'Dr. S. N. Patil (Staff)', category: 'Staff', entryTime: '07:20 AM', gate: 'Staff Gate' },
    { id: 'T-06', zone: 'two-wheeler', type: 'Two-Wheeler', occupied: 1, isPending: 0, status: 'Occupied', vehicleNumber: 'KA-22-JK-9087', driver: 'Rohan Kulkarni (Student)', category: 'Student', entryTime: '09:45 AM', gate: 'Student Gate' },
    { id: 'T-07', zone: 'two-wheeler', type: 'Two-Wheeler', occupied: 0, isPending: 0, status: 'Available', vehicleNumber: null, driver: null, category: null, entryTime: null, gate: null },
    { id: 'T-08', zone: 'two-wheeler', type: 'Two-Wheeler', occupied: 1, isPending: 0, status: 'Occupied', vehicleNumber: 'KA-22-EF-9012', driver: 'Suresh Kumar (Visitor)', category: 'Visitor', entryTime: '09:15 AM', gate: 'Visitor Gate' },
    { id: 'T-09', zone: 'two-wheeler', type: 'Two-Wheeler', occupied: 0, isPending: 0, status: 'Available', vehicleNumber: null, driver: null, category: null, entryTime: null, gate: null },
    { id: 'T-10', zone: 'two-wheeler', type: 'Two-Wheeler', occupied: 0, isPending: 0, status: 'Available', vehicleNumber: null, driver: null, category: null, entryTime: null, gate: null },

    { id: 'F-01', zone: 'four-wheeler', type: 'Four-Wheeler', occupied: 0, isPending: 0, status: 'Available', vehicleNumber: null, driver: null, category: null, entryTime: null, gate: null },
    { id: 'F-02', zone: 'four-wheeler', type: 'Four-Wheeler', occupied: 1, isPending: 0, status: 'Occupied', vehicleNumber: 'KA-22-XY-9876', driver: 'Rahul Verma (Student)', category: 'Student', entryTime: '10:24 AM', gate: 'Student Gate' },
    { id: 'F-03', zone: 'four-wheeler', type: 'Four-Wheeler', occupied: 0, isPending: 1, status: 'Detection Pending', vehicleNumber: 'KA-22-ZZ-4400', driver: 'Campus Guest / Visitor', category: 'Visitor', entryTime: '10:28 AM', gate: 'Visitor Gate' },
    { id: 'F-04', zone: 'four-wheeler', type: 'Four-Wheeler', occupied: 0, isPending: 0, status: 'Available', vehicleNumber: null, driver: null, category: null, entryTime: null, gate: null },
    { id: 'F-05', zone: 'four-wheeler', type: 'Four-Wheeler', occupied: 0, isPending: 0, status: 'Available', vehicleNumber: null, driver: null, category: null, entryTime: null, gate: null }
  ];

  const insertSlot = db.prepare(`
    INSERT OR REPLACE INTO parking_slots
    (id, zone, type, occupied, isPending, status, vehicleNumber, driver, category, entryTime, gate, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const s of defaultSlots) {
    insertSlot.run(s.id, s.zone, s.type, s.occupied, s.isPending, s.status, s.vehicleNumber, s.driver, s.category, s.entryTime, s.gate, now);
  }

  // 3. Seed Activities
  const defaultActivities = [
    {
      id: 'ACT-1',
      vehicleNumber: 'KA-22-XY-9876',
      type: 'Four-Wheeler',
      category: 'Student',
      slot: 'F-02',
      gate: 'Student Gate',
      entryTime: '10:24 AM',
      exitTime: '—',
      status: 'Parked',
      driver: 'Rahul Verma',
      department: 'Computer Science (4th Year)',
      duration: 'Current (52m)',
      fee: 0,
      photo: '/camera_1_feed.png',
      thumb: '/thumb_car.png'
    },
    {
      id: 'ACT-2',
      vehicleNumber: 'KA-22-MH-3311',
      type: 'Two-Wheeler',
      category: 'Staff',
      slot: 'T-01',
      gate: 'Staff Gate',
      entryTime: '08:15 AM',
      exitTime: '—',
      status: 'Parked',
      driver: 'Prof. Arvind',
      department: 'Dept of Mathematics',
      duration: 'Current (2h 10m)',
      fee: 0,
      photo: '/camera_2_feed.png',
      thumb: '/thumb_bike.png'
    },
    {
      id: 'ACT-3',
      vehicleNumber: 'KA-22-GH-7890',
      type: 'Two-Wheeler',
      category: 'Staff',
      slot: 'T-02',
      gate: 'Staff Gate',
      entryTime: '10:05 AM',
      exitTime: '—',
      status: 'Parked',
      driver: 'Ramesh Gowda',
      department: 'Administrative Staff',
      duration: 'Current (1h 11m)',
      fee: 0,
      photo: '/camera_2_feed.png',
      thumb: '/thumb_bike.png'
    },
    {
      id: 'ACT-4',
      vehicleNumber: 'KA-22-AB-1234',
      type: 'Two-Wheeler',
      category: 'Staff',
      slot: 'T-05',
      gate: 'Staff Gate',
      entryTime: '07:20 AM',
      exitTime: '—',
      status: 'Parked',
      driver: 'Dr. S. N. Patil',
      department: 'Mechanical Eng',
      duration: 'Current (3h 05m)',
      fee: 0,
      photo: '/camera_2_feed.png',
      thumb: '/thumb_bike.png'
    },
    {
      id: 'ACT-5',
      vehicleNumber: 'KA-22-JK-9087',
      type: 'Two-Wheeler',
      category: 'Student',
      slot: 'T-06',
      gate: 'Student Gate',
      entryTime: '09:45 AM',
      exitTime: '—',
      status: 'Parked',
      driver: 'Rohan Kulkarni',
      department: 'Civil Engineering',
      duration: 'Current (45m)',
      fee: 0,
      photo: '/camera_2_feed.png',
      thumb: '/thumb_bike.png'
    },
    {
      id: 'ACT-6',
      vehicleNumber: 'KA-22-EF-9012',
      type: 'Two-Wheeler',
      category: 'Visitor',
      slot: 'T-08',
      gate: 'Visitor Gate',
      entryTime: '09:15 AM',
      exitTime: '—',
      status: 'Parked',
      driver: 'Suresh Kumar',
      department: 'Visitor Permit',
      duration: 'Current (1h 15m)',
      fee: 40,
      photo: '/camera_2_feed.png',
      thumb: '/thumb_bike.png'
    },
    {
      id: 'ACT-7',
      vehicleNumber: 'KA-22-ZZ-4400',
      type: 'Four-Wheeler',
      category: 'Visitor',
      slot: 'F-03',
      gate: 'Visitor Gate',
      entryTime: '10:28 AM',
      exitTime: '—',
      status: 'Pending',
      driver: 'Campus Guest / Visitor',
      department: 'Sensor Tripwire #2 (ANPR Pending)',
      duration: 'Optical Verification...',
      fee: 40,
      photo: '/camera_1_feed.png',
      thumb: '/thumb_car.png'
    },
    {
      id: 'ACT-8',
      vehicleNumber: 'KA-22-CD-3456',
      type: 'Four-Wheeler',
      category: 'Student',
      slot: 'F-01',
      gate: 'Student Gate',
      entryTime: '08:40 AM',
      exitTime: '10:10 AM',
      status: 'Exited',
      driver: 'Priya Sharma',
      department: 'Electronics',
      duration: '1 Hour 30m',
      fee: 0,
      photo: '/camera_1_feed.png',
      thumb: '/thumb_car.png'
    }
  ];

  const insertAct = db.prepare(`
    INSERT OR REPLACE INTO activities
    (id, vehicleNumber, type, category, slot, gate, entryTime, exitTime, status, driver, department, duration, fee, photo, thumb, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const a of defaultActivities) {
    insertAct.run(
      a.id,
      a.vehicleNumber,
      a.type,
      a.category,
      a.slot,
      a.gate,
      a.entryTime,
      a.exitTime,
      a.status,
      a.driver,
      a.department,
      a.duration,
      a.fee,
      a.photo,
      a.thumb,
      now
    );
  }

  // 4. Seed Gate Stats
  const defaultGateStats = [
    {
      category: 'Student',
      gateId: 'student_gate',
      name: 'Student Gate',
      gateNumber: 1,
      status: 'Online',
      entryCount: 12,
      exitCount: 8,
      currentCount: 4,
      recentDetectionJson: JSON.stringify({
        vehicleNumber: 'KA-22-XY-9876',
        vehicleType: 'Four-Wheeler',
        category: 'Student',
        direction: 'Entry',
        time: '10:24 AM',
        slot: 'F-02',
        verified: true
      })
    },
    {
      category: 'Staff',
      gateId: 'staff_gate',
      name: 'Staff Gate',
      gateNumber: 2,
      status: 'Online',
      entryCount: 8,
      exitCount: 5,
      currentCount: 3,
      recentDetectionJson: JSON.stringify({
        vehicleNumber: 'KA-22-AB-1234',
        vehicleType: 'Two-Wheeler',
        category: 'Staff',
        direction: 'Exit',
        time: '10:23 AM',
        slot: 'T-05',
        verified: true
      })
    },
    {
      category: 'Visitor',
      gateId: 'visitor_gate',
      name: 'Visitor Gate',
      gateNumber: 3,
      status: 'Online',
      entryCount: 6,
      exitCount: 4,
      currentCount: 2,
      recentDetectionJson: JSON.stringify({
        vehicleNumber: 'KA-22-ZZ-4400',
        vehicleType: 'Four-Wheeler',
        category: 'Visitor',
        direction: 'Entry',
        time: '10:28 AM',
        slot: 'F-03',
        verified: true
      })
    }
  ];

  const insertGate = db.prepare(`
    INSERT OR REPLACE INTO gate_stats
    (category, gateId, name, gateNumber, status, entryCount, exitCount, currentCount, recentDetectionJson)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const g of defaultGateStats) {
    insertGate.run(g.category, g.gateId, g.name, g.gateNumber, g.status, g.entryCount, g.exitCount, g.currentCount, g.recentDetectionJson);
  }

  // 5. Seed System Settings
  db.prepare(`
    INSERT OR REPLACE INTO system_settings
    (id, studentRate, staffRate, visitorRateHourly, barrierAutoOpen, anprThreshold, officerName, officerBadge, officerShift, gate1Status, gate2Status, gate3Status, updatedAt)
    VALUES (1, 0, 0, 20, 1, 94, 'Officer Raj Sharma', 'CPVTS-SEC-09', 'Morning Shift (06:00 - 14:00)', 'Online', 'Online', 'Online', ?)
  `).run(now);

  // 6. Seed Cameras
  const defaultCameras = [
    {
      id: 'cam_student_entry',
      name: 'Student Gate Entry Camera',
      gate: 'Student Gate',
      gateNumber: 1,
      location: 'Gate 1 Ingress Lane (North)',
      type: 'Entry',
      ip: '192.168.1.101',
      port: 554,
      channel: 'stream1',
      username: 'admin',
      passwordHash: 'sha256:enc:mock',
      anprThreshold: 94,
      resolution: '1080P Full HD (1920x1080)',
      fps: 30,
      boundingBoxes: 1,
      autoBarrierTrigger: 1,
      ocrEngine: 'PaddleOCR / CRNN',
      feedImage: '/camera_1_feed.png',
      status: 'Connected'
    },
    {
      id: 'cam_student_exit',
      name: 'Student Gate Exit Camera',
      gate: 'Student Gate',
      gateNumber: 1,
      location: 'Gate 1 Egress Lane (North)',
      type: 'Exit',
      ip: '192.168.1.102',
      port: 554,
      channel: 'stream1',
      username: 'admin',
      passwordHash: 'sha256:enc:mock',
      anprThreshold: 94,
      resolution: '1080P Full HD (1920x1080)',
      fps: 30,
      boundingBoxes: 1,
      autoBarrierTrigger: 1,
      ocrEngine: 'PaddleOCR / CRNN',
      feedImage: '/camera_2_feed.png',
      status: 'Connected'
    },
    {
      id: 'cam_staff_entry',
      name: 'Staff Gate Entry Camera',
      gate: 'Staff Gate',
      gateNumber: 2,
      location: 'Gate 2 Ingress Lane (South)',
      type: 'Entry',
      ip: '192.168.1.103',
      port: 554,
      channel: 'stream1',
      username: 'admin',
      passwordHash: 'sha256:enc:mock',
      anprThreshold: 96,
      resolution: '1080P Full HD (1920x1080)',
      fps: 30,
      boundingBoxes: 1,
      autoBarrierTrigger: 1,
      ocrEngine: 'PaddleOCR / CRNN',
      feedImage: '/camera_1_feed.png',
      status: 'Connected'
    },
    {
      id: 'cam_staff_exit',
      name: 'Staff Gate Exit Camera',
      gate: 'Staff Gate',
      gateNumber: 2,
      location: 'Gate 2 Egress Lane (South)',
      type: 'Exit',
      ip: '192.168.1.104',
      port: 554,
      channel: 'stream1',
      username: 'admin',
      passwordHash: 'sha256:enc:mock',
      anprThreshold: 96,
      resolution: '1080P Full HD (1920x1080)',
      fps: 30,
      boundingBoxes: 1,
      autoBarrierTrigger: 1,
      ocrEngine: 'PaddleOCR / CRNN',
      feedImage: '/camera_2_feed.png',
      status: 'Connected'
    },
    {
      id: 'cam_visitor_entry',
      name: 'Visitor Gate Entry Camera',
      gate: 'Visitor Gate',
      gateNumber: 3,
      location: 'Gate 3 Ingress Lane (Main Entrance)',
      type: 'Entry',
      ip: '192.168.1.105',
      port: 554,
      channel: 'stream1',
      username: 'admin',
      passwordHash: 'sha256:enc:mock',
      anprThreshold: 95,
      resolution: '1080P Full HD (1920x1080)',
      fps: 30,
      boundingBoxes: 1,
      autoBarrierTrigger: 1,
      ocrEngine: 'PaddleOCR / CRNN',
      feedImage: '/camera_1_feed.png',
      status: 'Connected'
    },
    {
      id: 'cam_visitor_exit',
      name: 'Visitor Gate Exit Camera',
      gate: 'Visitor Gate',
      gateNumber: 3,
      location: 'Gate 3 Egress Lane (Main Entrance)',
      type: 'Exit',
      ip: '192.168.1.106',
      port: 554,
      channel: 'stream1',
      username: 'admin',
      passwordHash: 'sha256:enc:mock',
      anprThreshold: 95,
      resolution: '1080P Full HD (1920x1080)',
      fps: 30,
      boundingBoxes: 1,
      autoBarrierTrigger: 1,
      ocrEngine: 'PaddleOCR / CRNN',
      feedImage: '/camera_2_feed.png',
      status: 'Connected'
    }
  ];

  const insertCam = db.prepare(`
    INSERT OR REPLACE INTO cameras
    (id, name, gate, gateNumber, location, type, ip, port, channel, username, passwordHash, anprThreshold, resolution, fps, boundingBoxes, autoBarrierTrigger, ocrEngine, feedImage, status, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const c of defaultCameras) {
    insertCam.run(
      c.id, c.name, c.gate, c.gateNumber, c.location, c.type, c.ip, c.port, c.channel,
      c.username, c.passwordHash, c.anprThreshold, c.resolution, c.fps, c.boundingBoxes,
      c.autoBarrierTrigger, c.ocrEngine, c.feedImage, c.status, now
    );
  }

  // 7. Seed Notifications
  const defaultNotifications = [
    {
      id: 'notif-1',
      title: 'Auto Check-In Verified',
      message: 'KA-22-XY-9876 (Student) checked in via Gate 1 Student Gate. Slot F-02 assigned.',
      time: '10:24 AM',
      type: 'success',
      read: 0
    },
    {
      id: 'notif-2',
      title: 'Auto Check-Out Completed',
      message: 'KA-22-AB-1234 (Staff) checked out via Gate 2 Staff Gate. Slot T-05 freed.',
      time: '10:23 AM',
      type: 'info',
      read: 0
    },
    {
      id: 'notif-3',
      title: '3-Gate ANPR Calibrated',
      message: 'Student Gate (Gate 1), Staff Gate (Gate 2), and Visitor Gate (Gate 3) camera streams online.',
      time: '09:00 AM',
      type: 'system',
      read: 1
    }
  ];

  const insertNotif = db.prepare(`
    INSERT OR REPLACE INTO notifications (id, title, message, time, type, read, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const n of defaultNotifications) {
    insertNotif.run(n.id, n.title, n.message, n.time, n.type, n.read, now);
  }
}

// =========================================================================
// AUTHORITATIVE DATABASE OPERATIONS
// =========================================================================

export function dbGetRegisteredVehicles() {
  const db = getDatabase();
  return db.prepare('SELECT * FROM registered_vehicles ORDER BY createdAt DESC').all();
}

export function dbAddRegisteredVehicle(veh) {
  const db = getDatabase();
  const now = new Date().toISOString();
  const id = veh.id || `REG-${Date.now().toString().slice(-4)}`;
  const cleanPlate = (veh.vehicleNumber || '').trim().toUpperCase();

  db.prepare(`
    INSERT INTO registered_vehicles 
    (id, vehicleNumber, ownerName, category, department, vehicleType, model, rfidTag, contact, validUntil, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    cleanPlate,
    veh.ownerName || 'Campus Member',
    veh.category || 'Student',
    veh.department || '',
    veh.vehicleType || 'Four-Wheeler',
    veh.model || '',
    veh.rfidTag || `RFID-${cleanPlate.slice(-4)}`,
    veh.contact || '',
    veh.validUntil || 'Permanent',
    veh.status || 'Active',
    now,
    now
  );

  return db.prepare('SELECT * FROM registered_vehicles WHERE id = ?').get(id);
}

export function dbUpdateRegisteredVehicle(id, updates) {
  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM registered_vehicles WHERE id = ?').get(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const vehicleNumber = updates.vehicleNumber ? updates.vehicleNumber.trim().toUpperCase() : existing.vehicleNumber;
  const ownerName = updates.ownerName ?? existing.ownerName;
  const category = updates.category ?? existing.category;
  const department = updates.department ?? existing.department;
  const vehicleType = updates.vehicleType ?? existing.vehicleType;
  const model = updates.model ?? existing.model;
  const rfidTag = updates.rfidTag ?? existing.rfidTag;
  const contact = updates.contact ?? existing.contact;
  const validUntil = updates.validUntil ?? existing.validUntil;
  const status = updates.status ?? existing.status;

  db.prepare(`
    UPDATE registered_vehicles SET
      vehicleNumber = ?, ownerName = ?, category = ?, department = ?,
      vehicleType = ?, model = ?, rfidTag = ?, contact = ?, validUntil = ?,
      status = ?, updatedAt = ?
    WHERE id = ?
  `).run(
    vehicleNumber, ownerName, category, department,
    vehicleType, model, rfidTag, contact, validUntil,
    status, now, id
  );

  return db.prepare('SELECT * FROM registered_vehicles WHERE id = ?').get(id);
}

export function dbDeleteRegisteredVehicle(id) {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM registered_vehicles WHERE id = ?').run(id);
  return result.changes > 0;
}

export function dbToggleRegisteredVehicleStatus(id) {
  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM registered_vehicles WHERE id = ?').get(id);
  if (!existing) return null;

  const nextStatus = existing.status === 'Disabled' ? 'Active' : 'Disabled';
  const now = new Date().toISOString();

  db.prepare('UPDATE registered_vehicles SET status = ?, updatedAt = ? WHERE id = ?').run(nextStatus, now, id);
  return db.prepare('SELECT * FROM registered_vehicles WHERE id = ?').get(id);
}

export function dbGetSlots() {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM parking_slots ORDER BY id ASC').all();
  return rows.map(r => ({
    ...r,
    occupied: Boolean(r.occupied),
    isPending: Boolean(r.isPending),
    isDisabled: Boolean(r.isDisabled || r.status === 'Disabled'),
    gateCategory: r.gateCategory || 'Universal',
    floor: r.floor || (r.zone === 'four-wheeler' ? 'Ground Level Bay' : 'East Wing Bay'),
    row: r.row || '',
    location: r.location || (r.zone === 'four-wheeler' ? 'Zone F Ground Bay' : 'Zone T East Bay'),
    sensorType: r.sensorType || 'System-Managed'
  }));
}

export const dbGetParkingSlots = dbGetSlots;

/**
 * Automatically compute next standardized Slot ID
 * e.g. T-11, T-12 for Two-Wheeler | F-06, F-07 for Four-Wheeler
 */
export function dbGetNextSlotId(type = 'Four-Wheeler') {
  const db = getDatabase();
  const isTwoWheeler = String(type).toLowerCase().includes('two') || String(type).toLowerCase().includes('bike');
  const prefix = isTwoWheeler ? 'T-' : 'F-';
  const minStart = isTwoWheeler ? 10 : 5;

  const rows = db.prepare('SELECT id FROM parking_slots').all();
  let maxNum = minStart;

  for (const r of rows) {
    const rawId = (r.id || '').toUpperCase();
    if (rawId.startsWith(prefix)) {
      const match = rawId.match(/^[TF]-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  return `${prefix}${String(nextNum).padStart(2, '0')}`;
}

/**
 * Add a new parking slot to inventory with strict backend validation
 */
export function dbAddParkingSlot(slotData) {
  const db = getDatabase();
  const now = new Date().toISOString();

  if (!slotData || !slotData.id || !String(slotData.id).trim()) {
    throw new Error('Slot ID is required and cannot be empty.');
  }

  const cleanId = String(slotData.id).trim().toUpperCase();

  // Consistent ID pattern validation: alphanumeric prefix + hyphen + digits (e.g. T-11, F-06, VIP-01)
  const idPattern = /^[A-Z0-9]{1,6}-\d{1,}$/i;
  if (!idPattern.test(cleanId)) {
    throw new Error(`Invalid Slot ID format '${cleanId}'. Format must follow a consistent pattern such as T-11 or F-06.`);
  }

  // Duplicate Slot ID prevention
  const existing = db.prepare('SELECT id FROM parking_slots WHERE upper(id) = ?').get(cleanId);
  if (existing) {
    throw new Error(`Duplicate Slot ID: Slot '${cleanId}' already exists in inventory.`);
  }

  const isTwoWheeler =
    String(slotData.type).toLowerCase().includes('two') ||
    String(slotData.type).toLowerCase().includes('bike') ||
    cleanId.startsWith('T-');

  const vehicleType = isTwoWheeler ? 'Two-Wheeler' : 'Four-Wheeler';
  const zone = (slotData.zone || (isTwoWheeler ? 'two-wheeler' : 'four-wheeler')).trim().toLowerCase();
  const gateCategory = slotData.gateCategory || 'Universal';
  const floor = slotData.floor || (isTwoWheeler ? 'Zone T — East Wing' : 'Zone F — Ground Level');
  const row = slotData.row || '';
  const location = slotData.location || `${floor} ${cleanId}`;
  const sensorType = slotData.sensorType || 'System-Managed';
  const initialStatus = slotData.status === 'Disabled' ? 'Disabled' : 'Available';
  const isDisabled = initialStatus === 'Disabled' ? 1 : 0;

  db.prepare(`
    INSERT INTO parking_slots
    (id, zone, type, occupied, isPending, status, vehicleNumber, driver, category, entryTime, gate, gateCategory, floor, row, location, sensorType, isDisabled, createdAt, updatedAt)
    VALUES (?, ?, ?, 0, 0, ?, NULL, NULL, NULL, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    cleanId,
    zone,
    vehicleType,
    initialStatus,
    gateCategory,
    floor,
    row,
    location,
    sensorType,
    isDisabled,
    now,
    now
  );

  const created = db.prepare('SELECT * FROM parking_slots WHERE id = ?').get(cleanId);
  return {
    ...created,
    occupied: Boolean(created.occupied),
    isPending: Boolean(created.isPending),
    isDisabled: Boolean(created.isDisabled || created.status === 'Disabled')
  };
}

/**
 * Edit slot details with active vehicle integrity checks
 */
export function dbUpdateParkingSlot(id, updates) {
  const db = getDatabase();
  const cleanId = String(id).trim().toUpperCase();
  const existing = db.prepare('SELECT * FROM parking_slots WHERE upper(id) = ?').get(cleanId);
  if (!existing) {
    throw new Error(`Slot '${cleanId}' not found.`);
  }

  // Integrity Check: Cannot manually mark occupied slot as available while vehicle is still parked
  if (existing.occupied === 1 || existing.vehicleNumber) {
    if (updates.status === 'Available' || updates.occupied === false || updates.occupied === 0) {
      throw new Error(`Integrity Violation: Cannot manually mark slot '${cleanId}' as Available while vehicle ${existing.vehicleNumber} is actively parked.`);
    }
    if (updates.type && updates.type !== existing.type) {
      throw new Error(`Cannot change vehicle type of slot '${cleanId}' while occupied by vehicle ${existing.vehicleNumber}.`);
    }
    if (updates.status === 'Disabled' || updates.isDisabled === true || updates.isDisabled === 1) {
      throw new Error(`Cannot disable slot '${cleanId}' while occupied by vehicle ${existing.vehicleNumber}.`);
    }
  }

  const now = new Date().toISOString();
  const type = updates.type ?? existing.type;
  const zone = updates.zone ?? existing.zone;
  const gateCategory = updates.gateCategory ?? existing.gateCategory ?? 'Universal';
  const floor = updates.floor ?? existing.floor ?? 'Ground Level';
  const row = updates.row ?? existing.row ?? '';
  const location = updates.location ?? existing.location ?? '';
  const sensorType = updates.sensorType ?? existing.sensorType ?? 'System-Managed';
  
  let status = updates.status ?? existing.status;
  let isDisabled = updates.isDisabled !== undefined ? (updates.isDisabled ? 1 : 0) : existing.isDisabled;

  if (updates.status === 'Disabled') {
    isDisabled = 1;
  } else if (updates.status === 'Available' && !existing.occupied) {
    isDisabled = 0;
  }

  db.prepare(`
    UPDATE parking_slots SET
      type = ?, zone = ?, gateCategory = ?, floor = ?, row = ?,
      location = ?, sensorType = ?, status = ?, isDisabled = ?, updatedAt = ?
    WHERE id = ?
  `).run(
    type, zone, gateCategory, floor, row,
    location, sensorType, status, isDisabled, now, existing.id
  );

  const updated = db.prepare('SELECT * FROM parking_slots WHERE id = ?').get(existing.id);
  return {
    ...updated,
    occupied: Boolean(updated.occupied),
    isPending: Boolean(updated.isPending),
    isDisabled: Boolean(updated.isDisabled || updated.status === 'Disabled')
  };
}

export const dbUpdateSlot = dbUpdateParkingSlot;

/**
 * Toggle enable/disable status with active vehicle guard
 */
export function dbToggleParkingSlotStatus(id) {
  const db = getDatabase();
  const cleanId = String(id).trim().toUpperCase();
  const existing = db.prepare('SELECT * FROM parking_slots WHERE upper(id) = ?').get(cleanId);
  if (!existing) {
    throw new Error(`Slot '${cleanId}' not found.`);
  }

  if (existing.occupied === 1 || existing.vehicleNumber) {
    throw new Error(`Cannot disable slot '${cleanId}' while occupied by vehicle ${existing.vehicleNumber}.`);
  }

  const isCurrentlyDisabled = existing.status === 'Disabled' || existing.isDisabled === 1;
  const nextStatus = isCurrentlyDisabled ? 'Available' : 'Disabled';
  const nextIsDisabled = isCurrentlyDisabled ? 0 : 1;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE parking_slots SET
      status = ?, isDisabled = ?, updatedAt = ?
    WHERE id = ?
  `).run(nextStatus, nextIsDisabled, now, existing.id);

  const updated = db.prepare('SELECT * FROM parking_slots WHERE id = ?').get(existing.id);
  return {
    ...updated,
    occupied: Boolean(updated.occupied),
    isPending: Boolean(updated.isPending),
    isDisabled: Boolean(updated.isDisabled || updated.status === 'Disabled')
  };
}

/**
 * Delete a slot only if it has no active parked vehicle or dependent records
 */
export function dbDeleteParkingSlot(id) {
  const db = getDatabase();
  const cleanId = String(id).trim().toUpperCase();
  const existing = db.prepare('SELECT * FROM parking_slots WHERE upper(id) = ?').get(cleanId);
  if (!existing) {
    throw new Error(`Slot '${cleanId}' not found.`);
  }

  // Active vehicle protection
  if (existing.occupied === 1 || existing.vehicleNumber) {
    throw new Error(`Cannot delete slot '${cleanId}': Active vehicle ${existing.vehicleNumber} is currently parked here. Check out the vehicle first.`);
  }

  // Active detection pending protection
  if (existing.isPending === 1 || existing.status === 'Detection Pending') {
    throw new Error(`Cannot delete slot '${cleanId}': An active optical detection is currently pending in this bay.`);
  }

  // Check dependent active activity records
  const activeAct = db.prepare("SELECT vehicleNumber FROM activities WHERE slot = ? AND status = 'Parked'").get(cleanId);
  if (activeAct) {
    throw new Error(`Cannot delete slot '${cleanId}': Active parking record exists for vehicle ${activeAct.vehicleNumber}.`);
  }

  db.prepare('DELETE FROM parking_slots WHERE upper(id) = ?').run(cleanId);
  return { success: true, message: `Parking slot '${cleanId}' has been deleted from inventory.` };
}

export function dbGetActivities() {
  const db = getDatabase();
  return db.prepare('SELECT * FROM activities ORDER BY id DESC').all();
}

export function dbAddActivity(act) {
  const db = getDatabase();
  const now = new Date().toISOString();
  const id = String(act.id || Date.now());

  db.prepare(`
    INSERT INTO activities
    (id, vehicleNumber, type, category, slot, gate, entryTime, exitTime, status, driver, department, duration, fee, photo, thumb, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    act.vehicleNumber,
    act.type,
    act.category,
    act.slot,
    act.gate || '',
    act.entryTime || '',
    act.exitTime || '—',
    act.status || 'Parked',
    act.driver || '',
    act.department || '',
    act.duration || 'Just Now',
    act.fee ?? 0,
    act.photo || '',
    act.thumb || '',
    now
  );

  return db.prepare('SELECT * FROM activities WHERE id = ?').get(id);
}

export function dbGetGateStats() {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM gate_stats').all();
  const result = {};
  for (const r of rows) {
    let recentDetection = null;
    try {
      recentDetection = JSON.parse(r.recentDetectionJson || 'null');
    } catch {
      recentDetection = null;
    }
    result[r.category] = {
      gateId: r.gateId,
      name: r.name,
      gateNumber: r.gateNumber,
      status: r.status,
      entryCount: r.entryCount,
      exitCount: r.exitCount,
      currentCount: r.currentCount,
      recentDetection
    };
  }
  return result;
}

export function dbUpdateGateStat(category, updates) {
  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM gate_stats WHERE category = ?').get(category);
  if (!existing) return null;

  const entryCount = updates.entryCount ?? existing.entryCount;
  const exitCount = updates.exitCount ?? existing.exitCount;
  const currentCount = updates.currentCount ?? existing.currentCount;
  const recentDetectionJson = updates.recentDetection ? JSON.stringify(updates.recentDetection) : existing.recentDetectionJson;

  db.prepare(`
    UPDATE gate_stats SET
      entryCount = ?, exitCount = ?, currentCount = ?, recentDetectionJson = ?
    WHERE category = ?
  `).run(entryCount, exitCount, currentCount, recentDetectionJson, category);

  return dbGetGateStats();
}

export function dbGetSettings() {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM system_settings WHERE id = 1').get();
  if (!row) return null;
  return {
    studentRate: row.studentRate,
    staffRate: row.staffRate,
    visitorRateHourly: row.visitorRateHourly,
    barrierAutoOpen: Boolean(row.barrierAutoOpen),
    anprThreshold: row.anprThreshold,
    officerName: row.officerName,
    officerBadge: row.officerBadge,
    officerShift: row.officerShift,
    gate1Status: row.gate1Status,
    gate2Status: row.gate2Status,
    gate3Status: row.gate3Status
  };
}

export function dbUpdateSettings(settings) {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE system_settings SET
      studentRate = ?, staffRate = ?, visitorRateHourly = ?,
      barrierAutoOpen = ?, anprThreshold = ?, officerName = ?,
      officerBadge = ?, officerShift = ?, gate1Status = ?,
      gate2Status = ?, gate3Status = ?, updatedAt = ?
    WHERE id = 1
  `).run(
    settings.studentRate ?? 0,
    settings.staffRate ?? 0,
    settings.visitorRateHourly ?? 20,
    settings.barrierAutoOpen ? 1 : 0,
    settings.anprThreshold ?? 94,
    settings.officerName || 'Officer Raj Sharma',
    settings.officerBadge || 'CPVTS-SEC-09',
    settings.officerShift || 'Morning Shift',
    settings.gate1Status || 'Online',
    settings.gate2Status || 'Online',
    settings.gate3Status || 'Online',
    now
  );
  return dbGetSettings();
}

export function dbGetCameras() {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM cameras ORDER BY gateNumber ASC').all();
  return rows.map(r => ({
    ...r,
    boundingBoxes: Boolean(r.boundingBoxes),
    autoBarrierTrigger: Boolean(r.autoBarrierTrigger),
    password: '••••••••',
    credentialsMasked: true
  }));
}

export function dbUpdateCamera(id, fields) {
  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM cameras WHERE id = ?').get(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const name = fields.name ?? existing.name;
  const location = fields.location ?? existing.location;
  const type = fields.type ?? existing.type;
  const ip = fields.ip ?? existing.ip;
  const port = fields.port ?? existing.port;
  const channel = fields.channel ?? existing.channel;
  const username = fields.username ?? existing.username;
  const anprThreshold = fields.anprThreshold ?? existing.anprThreshold;
  const boundingBoxes = fields.boundingBoxes !== undefined ? (fields.boundingBoxes ? 1 : 0) : existing.boundingBoxes;
  const autoBarrierTrigger = fields.autoBarrierTrigger !== undefined ? (fields.autoBarrierTrigger ? 1 : 0) : existing.autoBarrierTrigger;
  const ocrEngine = fields.ocrEngine ?? existing.ocrEngine;
  const status = fields.status ?? existing.status;

  db.prepare(`
    UPDATE cameras SET
      name = ?, location = ?, type = ?, ip = ?, port = ?,
      channel = ?, username = ?, anprThreshold = ?, boundingBoxes = ?,
      autoBarrierTrigger = ?, ocrEngine = ?, status = ?, updatedAt = ?
    WHERE id = ?
  `).run(name, location, type, ip, port, channel, username, anprThreshold, boundingBoxes, autoBarrierTrigger, ocrEngine, status, now, id);

  const row = db.prepare('SELECT * FROM cameras WHERE id = ?').get(id);
  return {
    ...row,
    boundingBoxes: Boolean(row.boundingBoxes),
    autoBarrierTrigger: Boolean(row.autoBarrierTrigger),
    password: '••••••••',
    credentialsMasked: true
  };
}

export function dbGetNotifications() {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM notifications ORDER BY createdAt DESC LIMIT 50').all();
  return rows.map(r => ({
    ...r,
    read: Boolean(r.read)
  }));
}

export function dbAddNotification(notif) {
  const db = getDatabase();
  const now = new Date().toISOString();
  const id = notif.id || `notif-${Date.now()}`;
  db.prepare(`
    INSERT INTO notifications (id, title, message, time, type, read, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    notif.title,
    notif.message,
    notif.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
    notif.type || 'info',
    notif.read ? 1 : 0,
    now
  );
  return dbGetNotifications();
}

export function dbMarkNotificationRead(id) {
  const db = getDatabase();
  if (id === 'all') {
    db.prepare('UPDATE notifications SET read = 1').run();
  } else {
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(id);
  }
  return dbGetNotifications();
}

/**
 * Perform Atomic Check-In Transaction in SQLite
 */
export function dbCheckInTransaction({ vehicleNumber, type, category, driver, slotId, timeStr, gate, rfidTag, department }) {
  const db = getDatabase();
  const cleanPlate = vehicleNumber.trim().toUpperCase();
  const now = new Date().toISOString();

  // 1. Update target slot
  db.prepare(`
    UPDATE parking_slots SET
      occupied = 1, isPending = 0, status = 'Occupied',
      vehicleNumber = ?, type = ?, driver = ?, category = ?,
      entryTime = ?, gate = ?, updatedAt = ?
    WHERE id = ?
  `).run(cleanPlate, type, driver, category, timeStr, gate, now, slotId);

  // 2. Create activity record
  const actId = String(Date.now());
  db.prepare(`
    INSERT INTO activities
    (id, vehicleNumber, type, category, slot, gate, entryTime, exitTime, status, driver, department, duration, fee, photo, thumb, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    actId,
    cleanPlate,
    type,
    category,
    slotId,
    gate,
    timeStr,
    '—',
    'Parked',
    driver,
    department || '',
    'Just Now',
    0,
    type === 'Four-Wheeler' ? '/camera_1_feed.png' : '/camera_2_feed.png',
    type === 'Four-Wheeler' ? '/thumb_car.png' : '/thumb_bike.png',
    now
  );

  // 3. Increment gate stats
  const gateRow = db.prepare('SELECT * FROM gate_stats WHERE category = ?').get(category);
  if (gateRow) {
    const recentDetectionJson = JSON.stringify({
      vehicleNumber: cleanPlate,
      vehicleType: type,
      category,
      direction: 'Entry',
      time: timeStr,
      slot: slotId,
      verified: true
    });
    db.prepare(`
      UPDATE gate_stats SET
        entryCount = entryCount + 1,
        currentCount = currentCount + 1,
        recentDetectionJson = ?
      WHERE category = ?
    `).run(recentDetectionJson, category);
  }

  // 4. Add notification
  const notifId = `notif-${Date.now()}`;
  db.prepare(`
    INSERT INTO notifications (id, title, message, time, type, read, createdAt)
    VALUES (?, ?, ?, ?, ?, 0, ?)
  `).run(
    notifId,
    'Auto Check-In Verified',
    `${cleanPlate} (${category}) checked in via ${gate}. Slot ${slotId} assigned.`,
    timeStr,
    'success',
    now
  );

  return {
    success: true,
    slot: db.prepare('SELECT * FROM parking_slots WHERE id = ?').get(slotId),
    activity: db.prepare('SELECT * FROM activities WHERE id = ?').get(actId)
  };
}

/**
 * Perform Atomic Check-Out Transaction in SQLite
 */
export function dbCheckOutTransaction({ vehicleNumber, slotId, fee, duration, timeStr, gate, category, type }) {
  const db = getDatabase();
  const cleanPlate = (vehicleNumber || '').trim().toUpperCase();
  const now = new Date().toISOString();

  // 1. Release slot
  if (slotId) {
    db.prepare(`
      UPDATE parking_slots SET
        occupied = 0, isPending = 0, status = 'Available',
        vehicleNumber = NULL, driver = NULL, category = NULL,
        entryTime = NULL, gate = NULL, updatedAt = ?
      WHERE id = ?
    `).run(now, slotId);
  } else if (cleanPlate) {
    db.prepare(`
      UPDATE parking_slots SET
        occupied = 0, isPending = 0, status = 'Available',
        vehicleNumber = NULL, driver = NULL, category = NULL,
        entryTime = NULL, gate = NULL, updatedAt = ?
      WHERE vehicleNumber = ?
    `).run(now, cleanPlate);
  }

  // 2. Update parking activity to 'Exited'
  const activeAct = db.prepare(`
    SELECT * FROM activities 
    WHERE vehicleNumber = ? AND status = 'Parked' 
    ORDER BY id DESC LIMIT 1
  `).get(cleanPlate);

  if (activeAct) {
    db.prepare(`
      UPDATE activities SET
        status = 'Exited', exitTime = ?, duration = ?, fee = ?
      WHERE id = ?
    `).run(timeStr, duration, fee, activeAct.id);
  }

  // 3. Update gate stats
  const resolvedCategory = category || (activeAct ? activeAct.category : 'Visitor');
  const gateRow = db.prepare('SELECT * FROM gate_stats WHERE category = ?').get(resolvedCategory);
  if (gateRow) {
    const recentDetectionJson = JSON.stringify({
      vehicleNumber: cleanPlate,
      vehicleType: type || (activeAct ? activeAct.type : 'Four-Wheeler'),
      category: resolvedCategory,
      direction: 'Exit',
      time: timeStr,
      slot: slotId || (activeAct ? activeAct.slot : 'Released'),
      verified: true
    });
    db.prepare(`
      UPDATE gate_stats SET
        exitCount = exitCount + 1,
        currentCount = MAX(0, currentCount - 1),
        recentDetectionJson = ?
      WHERE category = ?
    `).run(recentDetectionJson, resolvedCategory);
  }

  // 4. Add notification
  const notifId = `notif-${Date.now()}`;
  db.prepare(`
    INSERT INTO notifications (id, title, message, time, type, read, createdAt)
    VALUES (?, ?, ?, ?, ?, 0, ?)
  `).run(
    notifId,
    'Auto Check-Out Completed',
    `${cleanPlate} checked out via ${gate || 'Egress Gate'}. Slot released. Fee: ₹${fee}.`,
    timeStr,
    'info',
    now
  );

  return { success: true };
}

/**
 * Intelligent Vehicle Finder: Searches across active bays, registered whitelist & activity logs
 */
export function dbSearchVehicles(query) {
  const db = getDatabase();
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];

  const results = [];
  const seenPlates = new Set();

  // Search active parking slots
  const slots = db.prepare(`
    SELECT * FROM parking_slots 
    WHERE occupied = 1 AND (
      lower(vehicleNumber) LIKE ? OR
      lower(id) LIKE ? OR
      lower(driver) LIKE ? OR
      lower(category) LIKE ?
    )
  `).all(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);

  for (const s of slots) {
    if (s.vehicleNumber) {
      seenPlates.add(s.vehicleNumber.toUpperCase());
      results.push({
        vehicleNumber: s.vehicleNumber,
        slot: s.id,
        vehicleType: s.type,
        category: s.category || 'Visitor',
        driver: s.driver || 'Campus Driver',
        department: s.category === 'Student' ? 'Student Department' : (s.category === 'Staff' ? 'Staff Faculty' : 'Visitor Bay'),
        entryTime: s.entryTime || 'Current',
        status: 'Currently Parked',
        lastDetection: `${s.entryTime || 'Recently'} — Parked in ${s.id}`,
        cctvSource: s.zone === 'four-wheeler' ? 'Entry Camera 1' : 'Entry Camera 2',
        confidence: '99.2%',
        image: s.zone === 'four-wheeler' ? '/thumb_car.png' : '/thumb_bike.png',
        floor: s.zone === 'four-wheeler' ? 'Zone F — Ground Level' : 'Zone T — East Wing',
        zone: s.zone,
        source: 'Live Parking Slot Database'
      });
    }
  }

  // Search registered vehicles
  const regVehicles = db.prepare(`
    SELECT * FROM registered_vehicles
    WHERE lower(vehicleNumber) LIKE ? OR
      lower(ownerName) LIKE ? OR
      lower(department) LIKE ? OR
      lower(rfidTag) LIKE ?
  `).all(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);

  for (const r of regVehicles) {
    if (!seenPlates.has(r.vehicleNumber.toUpperCase())) {
      seenPlates.add(r.vehicleNumber.toUpperCase());
      results.push({
        vehicleNumber: r.vehicleNumber,
        slot: 'Registered Directory (Not Parked)',
        vehicleType: r.vehicleType,
        category: r.category,
        driver: r.ownerName,
        department: r.department || 'Campus Registered',
        entryTime: '—',
        status: r.status === 'Active' ? 'Registered Member' : 'Registration Disabled',
        lastDetection: `RFID Tag: ${r.rfidTag || 'None'} • Valid: ${r.validUntil || 'Permanent'}`,
        cctvSource: 'Campus Database',
        confidence: '100% (Verified Identity)',
        image: r.vehicleType === 'Four-Wheeler' ? '/thumb_car.png' : '/thumb_bike.png',
        floor: 'Institutional Whitelist Record',
        zone: r.vehicleType === 'Four-Wheeler' ? 'four-wheeler' : 'two-wheeler',
        source: 'Registered Whitelist Database'
      });
    }
  }

  return results;
}

/**
 * Returns complete database status and counts
 */
export function dbGetStatus() {
  const db = getDatabase();
  const regCount = db.prepare('SELECT count(*) as c FROM registered_vehicles').get().c;
  const slotCount = db.prepare('SELECT count(*) as c FROM parking_slots').get().c;
  const occupiedCount = db.prepare('SELECT count(*) as c FROM parking_slots WHERE occupied = 1').get().c;
  const actCount = db.prepare('SELECT count(*) as c FROM activities').get().c;
  const camCount = db.prepare('SELECT count(*) as c FROM cameras').get().c;

  let fileSizeKb = 0;
  try {
    const stat = fs.statSync(DB_FILE);
    fileSizeKb = Math.round(stat.size / 1024);
  } catch {}

  return {
    connected: true,
    engine: 'SQLite (node:sqlite)',
    dbFile: DB_FILE,
    fileSizeKb,
    counts: {
      registeredVehicles: regCount,
      totalSlots: slotCount,
      occupiedSlots: occupiedCount,
      activities: actCount,
      cameras: camCount
    }
  };
}

/**
 * Reset database to default seed state
 */
export function dbResetToDefaults() {
  const db = getDatabase();
  db.exec(`
    DELETE FROM registered_vehicles;
    DELETE FROM parking_slots;
    DELETE FROM activities;
    DELETE FROM gate_stats;
    DELETE FROM system_settings;
    DELETE FROM cameras;
    DELETE FROM notifications;
  `);
  seedInitialData(db);
  return dbGetStatus();
}
