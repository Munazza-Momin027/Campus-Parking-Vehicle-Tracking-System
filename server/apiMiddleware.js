/**
 * Vite Dev Server Backend API Middleware
 * Emulates the Python Flask REST API directly within the Vite server (port 5173).
 * Ensures instant, zero-delay responses for:
 * - /api/calculate-fee (POST)
 * - /api/receipt/pdf (POST)
 * - /api/vehicle-finder/search (GET)
 */

import { jsPDF } from 'jspdf';

// Canonical Database
const BACKEND_VEHICLE_DATABASE = [
  {
    vehicleNumber: 'KA-22-XY-9876',
    slot: 'F-02',
    vehicleType: 'Four-Wheeler',
    category: 'Student',
    driver: 'Rahul Verma',
    department: 'Computer Science (4th Year)',
    entryTime: '10:24 AM',
    status: 'Currently Parked',
    lastDetection: '10:24 AM — Optical Plate Verified',
    cctvSource: 'Entry Camera 1',
    confidence: '98.4%',
    image: '/thumb_car.png',
    floor: 'Zone F — Ground Level Bay 2',
    zone: 'four-wheeler'
  },
  {
    vehicleNumber: 'KA-22-MH-3311',
    slot: 'T-01',
    vehicleType: 'Two-Wheeler',
    category: 'Staff',
    driver: 'Prof. Arvind Rao',
    department: 'Dept of Mathematics',
    entryTime: '08:15 AM',
    status: 'Currently Parked',
    lastDetection: '08:15 AM — Staff Pass Matched',
    cctvSource: 'Entry Camera 1',
    confidence: '99.1%',
    image: '/thumb_bike.png',
    floor: 'Zone T — East Wing Bay 1',
    zone: 'two-wheeler'
  },
  {
    vehicleNumber: 'KA-22-GH-7890',
    slot: 'T-02',
    vehicleType: 'Two-Wheeler',
    category: 'Staff',
    driver: 'Ramesh Gowda',
    department: 'Administrative Staff',
    entryTime: '10:05 AM',
    status: 'Currently Parked',
    lastDetection: '10:05 AM — ANPR Optical Match',
    cctvSource: 'Entry Camera 1',
    confidence: '97.9%',
    image: '/thumb_bike.png',
    floor: 'Zone T — East Wing Bay 2',
    zone: 'two-wheeler'
  },
  {
    vehicleNumber: 'KA-22-AB-1234',
    slot: 'T-05',
    vehicleType: 'Two-Wheeler',
    category: 'Staff',
    driver: 'Dr. S. N. Patil',
    department: 'Mechanical Eng',
    entryTime: '07:20 AM',
    status: 'Currently Parked',
    lastDetection: '07:20 AM — Staff RFID Sensor',
    cctvSource: 'Entry Camera 1',
    confidence: '99.5%',
    image: '/thumb_bike.png',
    floor: 'Zone T — East Wing Bay 5',
    zone: 'two-wheeler'
  },
  {
    vehicleNumber: 'KA-22-JK-9087',
    slot: 'T-06',
    vehicleType: 'Two-Wheeler',
    category: 'Student',
    driver: 'Rohan Kulkarni',
    department: 'Civil Engineering',
    entryTime: '09:45 AM',
    status: 'Currently Parked',
    lastDetection: '09:45 AM — Student Whitelist Found',
    cctvSource: 'Entry Camera 1',
    confidence: '98.8%',
    image: '/thumb_bike.png',
    floor: 'Zone T — East Wing Bay 6',
    zone: 'two-wheeler'
  },
  {
    vehicleNumber: 'KA-22-EF-9012',
    slot: 'T-08',
    vehicleType: 'Two-Wheeler',
    category: 'Visitor',
    driver: 'Suresh Kumar',
    department: 'Visitor Permit #8812',
    entryTime: '09:15 AM',
    status: 'Currently Parked',
    lastDetection: '09:15 AM — Visitor Pass Generated',
    cctvSource: 'Entry Camera 1',
    confidence: '96.5%',
    image: '/thumb_bike.png',
    floor: 'Zone T — East Wing Bay 8',
    zone: 'two-wheeler'
  },
  {
    vehicleNumber: 'KA-22-ZZ-4400',
    slot: 'F-03',
    vehicleType: 'Four-Wheeler',
    category: 'Visitor',
    driver: 'Campus Guest / Visitor',
    department: 'General Campus Guest',
    entryTime: '10:28 AM',
    status: 'Currently Parked',
    lastDetection: '10:28 AM — Optical Tripwire Tripped',
    cctvSource: 'Entry Camera 1',
    confidence: '95.2%',
    image: '/thumb_car.png',
    floor: 'Zone F — Ground Level Bay 3',
    zone: 'four-wheeler'
  },
  {
    vehicleNumber: 'KA-22-CD-3456',
    slot: 'F-01',
    vehicleType: 'Four-Wheeler',
    category: 'Student',
    driver: 'Priya Sharma',
    department: 'Electronics Eng',
    entryTime: '08:30 AM',
    status: 'Exited',
    lastDetection: '11:45 AM — Egress Cleared at Gate 2',
    cctvSource: 'Exit Camera 2',
    confidence: '99.0%',
    image: '/thumb_car.png',
    floor: 'Zone F — Ground Level Bay 1 (Released)',
    zone: 'four-wheeler'
  }
];

let BACKEND_CAMERA_REGISTRY = [
  // GATE 1 — STUDENT GATE (Entry & Exit)
  {
    id: 'cam_student_entry',
    name: 'Student Gate Entry Camera',
    gate: 'Student Gate',
    gateNumber: 1,
    category: 'Student',
    location: 'Gate 1 — Student Entry',
    type: 'Entry',
    status: 'Connected',
    ip: '192.168.1.101',
    port: 554,
    channel: 'stream1',
    username: 'admin',
    credentialsMasked: true,
    anprThreshold: 94,
    resolution: '1080P Full HD (1920x1080)',
    fps: 30,
    boundingBoxes: true,
    autoBarrierTrigger: true,
    ocrEngine: 'PaddleOCR / CRNN',
    feedImage: '/camera_1_feed.png'
  },
  {
    id: 'cam_student_exit',
    name: 'Student Gate Exit Camera',
    gate: 'Student Gate',
    gateNumber: 1,
    category: 'Student',
    location: 'Gate 1 — Student Exit',
    type: 'Exit',
    status: 'Connected',
    ip: '192.168.1.102',
    port: 554,
    channel: 'stream1',
    username: 'admin',
    credentialsMasked: true,
    anprThreshold: 94,
    resolution: '1080P Full HD (1920x1080)',
    fps: 30,
    boundingBoxes: true,
    autoBarrierTrigger: true,
    ocrEngine: 'PaddleOCR / CRNN',
    feedImage: '/camera_2_feed.png'
  },

  // GATE 2 — STAFF GATE (Entry & Exit)
  {
    id: 'cam_staff_entry',
    name: 'Staff Gate Entry Camera',
    gate: 'Staff Gate',
    gateNumber: 2,
    category: 'Staff',
    location: 'Gate 2 — Faculty/Staff Entry',
    type: 'Entry',
    status: 'Connected',
    ip: '192.168.1.103',
    port: 554,
    channel: 'stream1',
    username: 'admin',
    credentialsMasked: true,
    anprThreshold: 96,
    resolution: '1080P Full HD (1920x1080)',
    fps: 30,
    boundingBoxes: true,
    autoBarrierTrigger: true,
    ocrEngine: 'EasyOCR ANPR Model',
    feedImage: '/camera_1_feed.png'
  },
  {
    id: 'cam_staff_exit',
    name: 'Staff Gate Exit Camera',
    gate: 'Staff Gate',
    gateNumber: 2,
    category: 'Staff',
    location: 'Gate 2 — Faculty/Staff Exit',
    type: 'Exit',
    status: 'Connected',
    ip: '192.168.1.104',
    port: 554,
    channel: 'stream1',
    username: 'admin',
    credentialsMasked: true,
    anprThreshold: 96,
    resolution: '1080P Full HD (1920x1080)',
    fps: 30,
    boundingBoxes: true,
    autoBarrierTrigger: true,
    ocrEngine: 'EasyOCR ANPR Model',
    feedImage: '/camera_2_feed.png'
  },

  // GATE 3 — VISITOR GATE (Entry & Exit)
  {
    id: 'cam_visitor_entry',
    name: 'Visitor Gate Entry Camera',
    gate: 'Visitor Gate',
    gateNumber: 3,
    category: 'Visitor',
    location: 'Gate 3 — Visitor & Guest Entry',
    type: 'Entry',
    status: 'Connected',
    ip: '192.168.1.105',
    port: 554,
    channel: 'stream1',
    username: 'admin',
    credentialsMasked: true,
    anprThreshold: 95,
    resolution: '1080P Full HD (1920x1080)',
    fps: 30,
    boundingBoxes: true,
    autoBarrierTrigger: true,
    ocrEngine: 'PaddleOCR / CRNN',
    feedImage: '/camera_1_feed.png'
  },
  {
    id: 'cam_visitor_exit',
    name: 'Visitor Gate Exit Camera',
    gate: 'Visitor Gate',
    gateNumber: 3,
    category: 'Visitor',
    location: 'Gate 3 — Visitor & Guest Exit',
    type: 'Exit',
    status: 'Connected',
    ip: '192.168.1.106',
    port: 554,
    channel: 'stream1',
    username: 'admin',
    credentialsMasked: true,
    anprThreshold: 95,
    resolution: '1080P Full HD (1920x1080)',
    fps: 30,
    boundingBoxes: true,
    autoBarrierTrigger: true,
    ocrEngine: 'PaddleOCR / CRNN',
    feedImage: '/camera_2_feed.png'
  }
];

export function cpvtsBackendApiPlugin() {
  return {
    name: 'cpvts-backend-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url, 'http://localhost:5173');

        // Route 0: /api/status
        if (url.pathname === '/api/status' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            status: 'online',
            pipeline_mode: 'SIMULATION',
            is_simulation_mode: true,
            architecture: 'CCTV/IP Camera → Video Stream → OpenCV → Vehicle Detection (YOLO) → Plate Detection → OCR/ANPR → Flask Backend',
            models: {
              vehicle_detector: { name: 'YOLOv8', loaded: false, status: 'Simulation Active' },
              ocr_engine: { name: 'PaddleOCR / EasyOCR', loaded: false, status: 'Simulation Active' }
            },
            cameras: BACKEND_CAMERA_REGISTRY,
            timestamp: new Date().toISOString()
          }));
          return;
        }

        // Route 1: /api/calculate-fee
        if (url.pathname === '/api/calculate-fee' && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', chunk => { bodyStr += chunk; });
          req.on('end', () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const { vehicleType, category, entryTime, exitTime, duration } = body;

              const isFourWheeler =
                String(vehicleType).toLowerCase().includes('four') ||
                String(vehicleType).toLowerCase().includes('car');
              const normalizedType = isFourWheeler ? 'Four-Wheeler' : 'Two-Wheeler';

              const normalizedCategory =
                String(category).toLowerCase().includes('staff')
                  ? 'Staff'
                  : String(category).toLowerCase().includes('student')
                  ? 'Student'
                  : 'Visitor';

              let totalHours = 1;
              let durationStr = duration || '1 Hour';

              if (entryTime && exitTime) {
                const parseTime = (str) => {
                  const match = str.match(/(\d+):(\d+)\s*(AM|PM)?/i);
                  if (!match) return null;
                  let hrs = parseInt(match[1], 10);
                  const mins = parseInt(match[2], 10);
                  const ampm = (match[3] || '').toUpperCase();
                  if (ampm === 'PM' && hrs < 12) hrs += 12;
                  if (ampm === 'AM' && hrs === 12) hrs = 0;
                  return hrs * 60 + mins;
                };

                const m1 = parseTime(entryTime);
                const m2 = parseTime(exitTime);

                if (m1 !== null && m2 !== null) {
                  if (m2 < m1) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                      success: false,
                      error: 'Invalid Exit Time',
                      message: 'Exit time cannot be earlier than entry time.'
                    }));
                    return;
                  }
                  let diff = m2 - m1;
                  if (diff <= 0) diff = 60;
                  const hrs = Math.floor(diff / 60);
                  const mins = diff % 60;
                  durationStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                  totalHours = Math.max(1, Math.ceil(diff / 60));
                }
              } else if (typeof duration === 'number') {
                totalHours = Math.max(1, Math.ceil(duration));
                durationStr = `${totalHours} Hours`;
              } else if (duration) {
                const match = String(duration).match(/(\d+)/);
                if (match) {
                  totalHours = Math.max(1, parseInt(match[1], 10));
                  durationStr = `${totalHours} Hours`;
                }
              }

              // Codethon Pricing Matrix
              let freeHours = 0;
              let chargedHours = 0;
              let rate = 0;
              let totalAmount = 0;
              let formulaDesc = '';

              if (normalizedCategory === 'Staff') {
                freeHours = totalHours;
                chargedHours = 0;
                rate = 0;
                totalAmount = 0;
                formulaDesc = 'Staff Pass: 100% Free (₹0)';
              } else if (normalizedCategory === 'Student') {
                freeHours = Math.min(2, totalHours);
                chargedHours = Math.max(0, totalHours - 2);
                rate = isFourWheeler ? 20 : 10;
                totalAmount = chargedHours * rate;
                formulaDesc =
                  chargedHours > 0
                    ? `Student: First 2h Free + ${chargedHours}h @ ₹${rate}/hr`
                    : `Student: Within 2h Free Grace Period`;
              } else {
                freeHours = 0;
                chargedHours = totalHours;
                rate = isFourWheeler ? 40 : 20;
                totalAmount = chargedHours * rate;
                formulaDesc = `Visitor Tariff: ${chargedHours}h @ ₹${rate}/hr`;
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                vehicleType: normalizedType,
                category: normalizedCategory,
                entryTime: entryTime || '10:00 AM',
                exitTime: exitTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
                duration: durationStr,
                totalHours,
                freeHours,
                chargedHours,
                rate,
                totalAmount,
                calculationFormula: formulaDesc,
                source: 'CPVTS Flask/Node Backend Engine'
              }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // Route 2: /api/receipt/pdf
        if (url.pathname === '/api/receipt/pdf' && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', chunk => { bodyStr += chunk; });
          req.on('end', () => {
            try {
              const receiptData = JSON.parse(bodyStr || '{}');

              const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [100, 160]
              });

              const pageWidth = 100;
              let y = 10;

              // Header Accent
              doc.setFillColor(8, 14, 28);
              doc.rect(0, 0, pageWidth, 26, 'F');

              doc.setTextColor(0, 240, 255);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(14);
              doc.text('CPVTS', pageWidth / 2, y + 2, { align: 'center' });

              doc.setFontSize(7.5);
              doc.setTextColor(200, 220, 240);
              doc.setFont('helvetica', 'normal');
              doc.text('Campus Parking & Vehicle Tracking System', pageWidth / 2, y + 7, { align: 'center' });
              doc.text('OFFICIAL CLEARANCE RECEIPT', pageWidth / 2, y + 11, { align: 'center' });

              y = 32;

              doc.setFillColor(16, 185, 129);
              doc.roundedRect(8, y - 4, 38, 7, 2, 2, 'F');
              doc.setTextColor(255, 255, 255);
              doc.setFontSize(7);
              doc.setFont('helvetica', 'bold');
              doc.text('✓ AUTO CHECK-OUT', 27, y, { align: 'center' });

              doc.setFillColor(58, 134, 255);
              doc.roundedRect(52, y - 4, 40, 7, 2, 2, 'F');
              doc.text('✓ SLOT RELEASED', 72, y, { align: 'center' });

              y += 10;
              doc.setDrawColor(200, 200, 200);
              doc.setLineWidth(0.3);
              doc.line(8, y, pageWidth - 8, y);
              y += 5;

              const addRow = (label, val, highlight = false) => {
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(80, 80, 80);
                doc.text(label, 8, y);
                doc.setFont('helvetica', highlight ? 'bold' : 'normal');
                doc.setTextColor(highlight ? 0 : 30, highlight ? 100 : 30, highlight ? 180 : 30);
                doc.text(String(val), pageWidth - 8, y, { align: 'right' });
                y += 5;
              };

              addRow('Receipt Ref:', receiptData.receiptId || `RCPT-${Math.floor(1000 + Math.random() * 9000)}`);
              addRow('Vehicle Number:', receiptData.vehicleNumber, true);
              addRow('Vehicle Type:', receiptData.vehicleType || 'Four-Wheeler');
              addRow('Owner Category:', receiptData.category || 'Student');
              addRow('Parking Slot:', receiptData.slot || 'F-02', true);

              y += 2;
              doc.setDrawColor(220, 220, 220);
              doc.line(8, y, pageWidth - 8, y);
              y += 5;

              addRow('Entry Time:', receiptData.entryTime || '10:24 AM');
              addRow('Exit Time:', receiptData.exitTime || '12:45 PM');
              addRow('Duration:', receiptData.duration || '2 Hours 21m');
              addRow('Free Hours:', `${receiptData.freeHours ?? 2} hrs`);
              addRow('Charged Hours:', `${receiptData.chargedHours ?? 0} hrs`);
              addRow('Rate:', `₹${receiptData.rate ?? 0}/hr`);

              y += 2;
              doc.setFillColor(240, 245, 255);
              doc.roundedRect(8, y, pageWidth - 16, 14, 2, 2, 'F');
              doc.setDrawColor(58, 134, 255);
              doc.roundedRect(8, y, pageWidth - 16, 14, 2, 2, 'D');

              doc.setFontSize(9);
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(20, 40, 80);
              doc.text('TOTAL AMOUNT:', 14, y + 9);

              doc.setFontSize(13);
              doc.setTextColor(16, 185, 129);
              doc.text(`₹${receiptData.totalAmount ?? 0}`, pageWidth - 14, y + 9.5, { align: 'right' });

              y += 20;
              doc.setFontSize(6.5);
              doc.setFont('helvetica', 'italic');
              doc.setTextColor(120, 120, 120);
              doc.text(receiptData.calculationFormula || 'Institutional Fee Settled', pageWidth / 2, y, { align: 'center' });

              const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Disposition', 'attachment; filename="CPVTS_Parking_Receipt.pdf"');
              res.end(pdfBuffer);
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // Route 3: /api/vehicle-finder/search
        if (url.pathname === '/api/vehicle-finder/search') {
          const q = (url.searchParams.get('q') || '').toLowerCase().trim();
          let results = [];

          if (q) {
            results = BACKEND_VEHICLE_DATABASE.filter(
              item =>
                item.vehicleNumber.toLowerCase().includes(q) ||
                item.slot.toLowerCase() === q ||
                item.slot.toLowerCase().includes(q) ||
                item.driver.toLowerCase().includes(q) ||
                item.department.toLowerCase().includes(q)
            );
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            query: q,
            count: results.length,
            results
          }));
          return;
        }

        // Route 4: /api/camera-settings (Phase 13: Secure backend camera credentials store)
        if (url.pathname === '/api/camera-settings') {
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              cameras: BACKEND_CAMERA_REGISTRY.map(cam => ({
                ...cam,
                password: '••••••••',
                credentialsMasked: true
              }))
            }));
            return;
          }

          if (req.method === 'POST') {
            let bodyStr = '';
            req.on('data', chunk => { bodyStr += chunk; });
            req.on('end', () => {
              try {
                const body = JSON.parse(bodyStr || '{}');
                const target = BACKEND_CAMERA_REGISTRY.find(c => c.id === body.id);
                if (target) {
                  Object.assign(target, {
                    name: body.name || target.name,
                    location: body.location || target.location,
                    type: body.type || target.type,
                    ip: body.ip || target.ip,
                    port: body.port || target.port,
                    channel: body.channel || target.channel,
                    username: body.username || target.username,
                    anprThreshold: body.anprThreshold ?? target.anprThreshold,
                    boundingBoxes: body.boundingBoxes ?? target.boundingBoxes,
                    autoBarrierTrigger: body.autoBarrierTrigger ?? target.autoBarrierTrigger,
                    ocrEngine: body.ocrEngine || target.ocrEngine
                  });
                }
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: true,
                  message: 'Camera configuration stored securely in backend vault.',
                  camera: { ...(target || body), password: '••••••••', credentialsMasked: true }
                }));
              } catch (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }
        }

        next();
      });
    }
  };
}
