export const INITIAL_SLOTS = [
  // Two-Wheeler Zone (T-01 to T-10) — 10 slots
  { id: 'T-01', zone: 'two-wheeler', type: 'Two-Wheeler', occupied: true, status: 'Occupied', vehicleNumber: 'KA-22-MH-3311', driver: 'Prof. Arvind (Staff)', category: 'Staff', entryTime: '08:15 AM' },
  { id: 'T-02', zone: 'two-wheeler', type: 'Two-Wheeler', occupied: true, status: 'Occupied', vehicleNumber: 'KA-22-GH-7890', driver: 'Ramesh Gowda (Staff)', category: 'Staff', entryTime: '10:05 AM' },
  { id: 'T-03', zone: 'two-wheeler', type: 'Two-Wheeler', occupied: false, status: 'Available', vehicleNumber: null, driver: null, category: null, entryTime: null },
  { id: 'T-04', zone: 'two-wheeler', type: 'Two-Wheeler', occupied: false, status: 'Available', vehicleNumber: null, driver: null, category: null, entryTime: null },
  { id: 'T-05', zone: 'two-wheeler', type: 'Two-Wheeler', occupied: true, status: 'Occupied', vehicleNumber: 'KA-22-AB-1234', driver: 'Dr. S. N. Patil (Staff)', category: 'Staff', entryTime: '07:20 AM' },
  { id: 'T-06', zone: 'two-wheeler', type: 'Two-Wheeler', occupied: true, status: 'Occupied', vehicleNumber: 'KA-22-JK-9087', driver: 'Rohan Kulkarni (Student)', category: 'Student', entryTime: '09:45 AM' },
  { id: 'T-07', zone: 'two-wheeler', type: 'Two-Wheeler', occupied: false, status: 'Available', vehicleNumber: null, driver: null, category: null, entryTime: null },
  { id: 'T-08', zone: 'two-wheeler', type: 'Two-Wheeler', occupied: true, status: 'Occupied', vehicleNumber: 'KA-22-EF-9012', driver: 'Suresh Kumar (Visitor)', category: 'Visitor', entryTime: '09:15 AM' },
  { id: 'T-09', zone: 'two-wheeler', type: 'Two-Wheeler', occupied: false, status: 'Available', vehicleNumber: null, driver: null, category: null, entryTime: null },
  { id: 'T-10', zone: 'two-wheeler', type: 'Two-Wheeler', occupied: false, status: 'Available', vehicleNumber: null, driver: null, category: null, entryTime: null },

  // Four-Wheeler Zone (F-01 to F-05) — 5 slots
  { id: 'F-01', zone: 'four-wheeler', type: 'Four-Wheeler', occupied: false, status: 'Available', vehicleNumber: null, driver: null, category: null, entryTime: null },
  { id: 'F-02', zone: 'four-wheeler', type: 'Four-Wheeler', occupied: true, status: 'Occupied', vehicleNumber: 'KA-22-XY-9876', driver: 'Rahul Verma (Student)', category: 'Student', entryTime: '10:24 AM' },
  { id: 'F-03', zone: 'four-wheeler', type: 'Four-Wheeler', occupied: false, isPending: true, status: 'Detection Pending', vehicleNumber: 'KA-22-ZZ-4400', driver: 'Campus Guest / Visitor', category: 'Visitor', entryTime: '10:28 AM' },
  { id: 'F-04', zone: 'four-wheeler', type: 'Four-Wheeler', occupied: false, status: 'Available', vehicleNumber: null, driver: null, category: null, entryTime: null },
  { id: 'F-05', zone: 'four-wheeler', type: 'Four-Wheeler', occupied: false, status: 'Available', vehicleNumber: null, driver: null, category: null, entryTime: null },
];

export const INITIAL_ACTIVITY = [
  {
    id: 1,
    vehicleNumber: 'KA-22-XY-9876',
    type: 'Four-Wheeler',
    category: 'Student',
    slot: 'F-02',
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
    id: 2,
    vehicleNumber: 'KA-22-MH-3311',
    type: 'Two-Wheeler',
    category: 'Staff',
    slot: 'T-01',
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
    id: 3,
    vehicleNumber: 'KA-22-GH-7890',
    type: 'Two-Wheeler',
    category: 'Staff',
    slot: 'T-02',
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
    id: 4,
    vehicleNumber: 'KA-22-AB-1234',
    type: 'Two-Wheeler',
    category: 'Staff',
    slot: 'T-05',
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
    id: 5,
    vehicleNumber: 'KA-22-JK-9087',
    type: 'Two-Wheeler',
    category: 'Student',
    slot: 'T-06',
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
    id: 6,
    vehicleNumber: 'KA-22-EF-9012',
    type: 'Two-Wheeler',
    category: 'Visitor',
    slot: 'T-08',
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
    id: 7,
    vehicleNumber: 'KA-22-ZZ-4400',
    type: 'Four-Wheeler',
    category: 'Visitor',
    slot: 'F-03',
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
    id: 8,
    vehicleNumber: 'KA-22-CD-3456',
    type: 'Four-Wheeler',
    category: 'Student',
    slot: 'F-01',
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

export const REGISTERED_DATABASE = [
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

export const GATES_DEF = [
  {
    id: 'student_gate',
    gateNumber: 1,
    name: 'Student Gate',
    shortName: 'GATE 1',
    category: 'Student',
    description: 'Dedicated Student vehicle ingress & egress with ANPR optical verification',
    status: 'Online',
    color: '#3A86FF',
    accent: 'var(--blue-primary)',
    entryCamera: { id: 'cam_student_entry', name: 'Student Gate Entry Camera', status: 'Connected', type: 'Entry', feedImage: '/camera_1_feed.png' },
    exitCamera: { id: 'cam_student_exit', name: 'Student Gate Exit Camera', status: 'Connected', type: 'Exit', feedImage: '/camera_2_feed.png' }
  },
  {
    id: 'staff_gate',
    gateNumber: 2,
    name: 'Staff Gate',
    shortName: 'GATE 2',
    category: 'Staff',
    description: 'Dedicated Faculty & Staff ingress & egress with institutional pass verification',
    status: 'Online',
    color: '#8B5CF6',
    accent: 'var(--purple-ai)',
    entryCamera: { id: 'cam_staff_entry', name: 'Staff Gate Entry Camera', status: 'Connected', type: 'Entry', feedImage: '/camera_1_feed.png' },
    exitCamera: { id: 'cam_staff_exit', name: 'Staff Gate Exit Camera', status: 'Connected', type: 'Exit', feedImage: '/camera_2_feed.png' }
  },
  {
    id: 'visitor_gate',
    gateNumber: 3,
    name: 'Visitor Gate',
    shortName: 'GATE 3',
    category: 'Visitor',
    description: 'Guest & Visitor ingress/egress with optical registration, tariff audit & barrier control',
    status: 'Online',
    color: '#10B981',
    accent: 'var(--green-bright)',
    entryCamera: { id: 'cam_visitor_entry', name: 'Visitor Gate Entry Camera', status: 'Connected', type: 'Entry', feedImage: '/camera_1_feed.png' },
    exitCamera: { id: 'cam_visitor_exit', name: 'Visitor Gate Exit Camera', status: 'Connected', type: 'Exit', feedImage: '/camera_2_feed.png' }
  }
];

export const INITIAL_GATE_STATS = {
  Student: {
    gateId: 'student_gate',
    name: 'Student Gate',
    gateNumber: 1,
    status: 'Online',
    entryCount: 12,
    exitCount: 8,
    currentCount: 4,
    entryCameraStatus: 'Connected',
    exitCameraStatus: 'Connected',
    recentDetection: {
      vehicleNumber: 'KA-22-XY-9876',
      vehicleType: 'Four-Wheeler',
      category: 'Student',
      direction: 'Entry',
      time: '10:24 AM',
      slot: 'F-02',
      verified: true
    }
  },
  Staff: {
    gateId: 'staff_gate',
    name: 'Staff Gate',
    gateNumber: 2,
    status: 'Online',
    entryCount: 8,
    exitCount: 5,
    currentCount: 3,
    entryCameraStatus: 'Connected',
    exitCameraStatus: 'Connected',
    recentDetection: {
      vehicleNumber: 'KA-22-AB-1234',
      vehicleType: 'Two-Wheeler',
      category: 'Staff',
      direction: 'Exit',
      time: '10:23 AM',
      slot: 'T-05',
      verified: true
    }
  },
  Visitor: {
    gateId: 'visitor_gate',
    name: 'Visitor Gate',
    gateNumber: 3,
    status: 'Online',
    entryCount: 6,
    exitCount: 4,
    currentCount: 2,
    entryCameraStatus: 'Connected',
    exitCameraStatus: 'Connected',
    recentDetection: {
      vehicleNumber: 'KA-22-ZZ-4400',
      vehicleType: 'Four-Wheeler',
      category: 'Visitor',
      direction: 'Entry',
      time: '10:28 AM',
      slot: 'F-03',
      verified: true
    }
  }
};

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Auto Check-In Verified',
    message: 'KA-22-XY-9876 (Student) checked in via Gate 1 Student Gate. Slot F-02 assigned.',
    time: '10:24 AM',
    type: 'success',
    read: false
  },
  {
    id: 'notif-2',
    title: 'Auto Check-Out Completed',
    message: 'KA-22-AB-1234 (Staff) checked out via Gate 2 Staff Gate. Slot T-05 freed.',
    time: '10:23 AM',
    type: 'info',
    read: false
  },
  {
    id: 'notif-3',
    title: '3-Gate ANPR Calibrated',
    message: 'Student Gate (Gate 1), Staff Gate (Gate 2), and Visitor Gate (Gate 3) camera streams online.',
    time: '09:00 AM',
    type: 'system',
    read: true
  }
];
