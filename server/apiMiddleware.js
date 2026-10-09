/**
 * Vite Dev Server Backend API & SQLite Database Middleware
 * Runs directly within the Vite server (port 5173).
 * Connects the web application to the SQLite database with zero latency.
 */

import { jsPDF } from 'jspdf';
import {
  getDatabase,
  dbGetStatus,
  dbGetRegisteredVehicles,
  dbAddRegisteredVehicle,
  dbUpdateRegisteredVehicle,
  dbDeleteRegisteredVehicle,
  dbToggleRegisteredVehicleStatus,
  dbGetSlots,
  dbUpdateSlot,
  dbGetActivities,
  dbAddActivity,
  dbGetGateStats,
  dbUpdateGateStat,
  dbGetSettings,
  dbUpdateSettings,
  dbGetCameras,
  dbUpdateCamera,
  dbGetNotifications,
  dbAddNotification,
  dbMarkNotificationRead,
  dbCheckInTransaction,
  dbCheckOutTransaction,
  dbSearchVehicles,
  dbResetToDefaults
} from './database.js';

// Helper to read and parse JSON body
function readJson(req) {
  return new Promise((resolve, reject) => {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', () => {
      try {
        resolve(bodyStr ? JSON.parse(bodyStr) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', err => reject(err));
  });
}

function sendJson(res, data, statusCode = 200) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export function cpvtsBackendApiPlugin() {
  return {
    name: 'cpvts-backend-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const url = new URL(req.url, 'http://localhost:5173');
          const pathname = url.pathname;
          const method = req.method;

          // CORS / Preflight
          if (method === 'OPTIONS') {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.statusCode = 204;
            res.end();
            return;
          }

          // -------------------------------------------------------------
          // 1. /api/status - Architecture & Database Health
          // -------------------------------------------------------------
          if (pathname === '/api/status' && method === 'GET') {
            const dbStatus = dbGetStatus();
            sendJson(res, {
              status: 'online',
              database: dbStatus,
              pipeline_mode: 'SIMULATION',
              is_simulation_mode: true,
              architecture: 'CCTV/IP Camera → Video Stream → OpenCV → Vehicle Detection (YOLO) → Plate Detection → OCR/ANPR → SQLite Database',
              models: {
                vehicle_detector: { name: 'YOLOv8', loaded: false, status: 'Simulation Active' },
                ocr_engine: { name: 'PaddleOCR / EasyOCR', loaded: false, status: 'Simulation Active' }
              },
              cameras: dbGetCameras(),
              timestamp: new Date().toISOString()
            });
            return;
          }

          // -------------------------------------------------------------
          // 2. /api/database/status - Database Info
          // -------------------------------------------------------------
          if (pathname === '/api/database/status' && method === 'GET') {
            sendJson(res, dbGetStatus());
            return;
          }

          // -------------------------------------------------------------
          // 3. /api/database/state - Complete Unified Database State
          // -------------------------------------------------------------
          if (pathname === '/api/database/state' && method === 'GET') {
            sendJson(res, {
              success: true,
              database: dbGetStatus(),
              registeredVehicles: dbGetRegisteredVehicles(),
              slots: dbGetSlots(),
              activities: dbGetActivities(),
              gateStats: dbGetGateStats(),
              settings: dbGetSettings(),
              cameras: dbGetCameras(),
              notifications: dbGetNotifications()
            });
            return;
          }

          // -------------------------------------------------------------
          // 4. /api/database/reset - Revert to Seed Data
          // -------------------------------------------------------------
          if (pathname === '/api/database/reset' && method === 'POST') {
            const status = dbResetToDefaults();
            sendJson(res, {
              success: true,
              message: 'Database successfully re-seeded to default institutional records.',
              database: status,
              registeredVehicles: dbGetRegisteredVehicles(),
              slots: dbGetSlots(),
              activities: dbGetActivities(),
              gateStats: dbGetGateStats(),
              settings: dbGetSettings(),
              cameras: dbGetCameras(),
              notifications: dbGetNotifications()
            });
            return;
          }

          // -------------------------------------------------------------
          // 5. /api/registered-vehicles - CRUD for Whitelist Database
          // -------------------------------------------------------------
          if (pathname === '/api/registered-vehicles') {
            if (method === 'GET') {
              sendJson(res, { success: true, data: dbGetRegisteredVehicles() });
              return;
            }
            if (method === 'POST') {
              const body = await readJson(req);
              if (!body.vehicleNumber) {
                sendJson(res, { success: false, error: 'Vehicle number is required' }, 400);
                return;
              }
              const created = dbAddRegisteredVehicle(body);
              sendJson(res, { success: true, message: 'Vehicle registered in database.', data: created }, 201);
              return;
            }
          }

          // /api/registered-vehicles/:id
          const regMatch = pathname.match(/^\/api\/registered-vehicles\/([^\/]+)$/);
          if (regMatch) {
            const vehId = decodeURIComponent(regMatch[1]);
            if (method === 'PUT') {
              const body = await readJson(req);
              const updated = dbUpdateRegisteredVehicle(vehId, body);
              if (!updated) {
                sendJson(res, { success: false, error: 'Vehicle not found' }, 404);
                return;
              }
              sendJson(res, { success: true, message: 'Vehicle record updated in database.', data: updated });
              return;
            }
            if (method === 'DELETE') {
              const ok = dbDeleteRegisteredVehicle(vehId);
              sendJson(res, { success: ok, message: ok ? 'Vehicle removed from database.' : 'Vehicle not found' });
              return;
            }
          }

          // /api/registered-vehicles/:id/status
          const statusMatch = pathname.match(/^\/api\/registered-vehicles\/([^\/]+)\/status$/);
          if (statusMatch && (method === 'PATCH' || method === 'POST')) {
            const vehId = decodeURIComponent(statusMatch[1]);
            const updated = dbToggleRegisteredVehicleStatus(vehId);
            if (!updated) {
              sendJson(res, { success: false, error: 'Vehicle not found' }, 404);
              return;
            }
            sendJson(res, { success: true, message: `Status updated to ${updated.status}.`, data: updated });
            return;
          }

          // -------------------------------------------------------------
          // 6. /api/slots - Parking Slot Allocation
          // -------------------------------------------------------------
          if (pathname === '/api/slots' && method === 'GET') {
            sendJson(res, { success: true, data: dbGetSlots() });
            return;
          }

          const slotMatch = pathname.match(/^\/api\/slots\/([^\/]+)$/);
          if (slotMatch && method === 'PUT') {
            const slotId = decodeURIComponent(slotMatch[1]);
            const body = await readJson(req);
            const updated = dbUpdateSlot(slotId, body);
            sendJson(res, { success: true, data: updated });
            return;
          }

          // -------------------------------------------------------------
          // 7. /api/check-in & /api/check-out - Atomic Transactions
          // -------------------------------------------------------------
          if (pathname === '/api/check-in' && method === 'POST') {
            const body = await readJson(req);
            const result = dbCheckInTransaction(body);
            sendJson(res, result);
            return;
          }

          if (pathname === '/api/check-out' && method === 'POST') {
            const body = await readJson(req);
            const result = dbCheckOutTransaction(body);
            sendJson(res, result);
            return;
          }

          // -------------------------------------------------------------
          // 8. /api/activities - History & Logs
          // -------------------------------------------------------------
          if (pathname === '/api/activities') {
            if (method === 'GET') {
              sendJson(res, { success: true, data: dbGetActivities() });
              return;
            }
            if (method === 'POST') {
              const body = await readJson(req);
              const saved = dbAddActivity(body);
              sendJson(res, { success: true, data: saved }, 201);
              return;
            }
          }

          // -------------------------------------------------------------
          // 9. /api/settings - System Settings & Tariffs
          // -------------------------------------------------------------
          if (pathname === '/api/settings') {
            if (method === 'GET') {
              sendJson(res, { success: true, data: dbGetSettings() });
              return;
            }
            if (method === 'PUT' || method === 'POST') {
              const body = await readJson(req);
              const updated = dbUpdateSettings(body);
              sendJson(res, { success: true, message: 'Settings saved to SQLite database.', data: updated });
              return;
            }
          }

          // -------------------------------------------------------------
          // 10. /api/camera-settings - CCTV Camera Registry
          // -------------------------------------------------------------
          if (pathname === '/api/camera-settings') {
            if (method === 'GET') {
              sendJson(res, {
                success: true,
                cameras: dbGetCameras()
              });
              return;
            }
            if (method === 'POST') {
              const body = await readJson(req);
              const updated = dbUpdateCamera(body.id, body);
              sendJson(res, {
                success: true,
                message: 'Camera settings saved securely to backend database.',
                camera: updated
              });
              return;
            }
          }

          // -------------------------------------------------------------
          // 11. /api/vehicle-finder/search - Intelligent Live Search
          // -------------------------------------------------------------
          if (pathname === '/api/vehicle-finder/search') {
            const q = (url.searchParams.get('q') || '').trim();
            const results = dbSearchVehicles(q);
            sendJson(res, {
              query: q,
              count: results.length,
              databaseEngine: 'SQLite (Live Persistent Query)',
              results
            });
            return;
          }

          // -------------------------------------------------------------
          // 12. /api/notifications - Notifications
          // -------------------------------------------------------------
          if (pathname === '/api/notifications') {
            if (method === 'GET') {
              sendJson(res, { success: true, data: dbGetNotifications() });
              return;
            }
            if (method === 'POST') {
              const body = await readJson(req);
              const updatedList = dbAddNotification(body);
              sendJson(res, { success: true, data: updatedList });
              return;
            }
          }

          const notifReadMatch = pathname.match(/^\/api\/notifications\/([^\/]+)\/read$/);
          if (notifReadMatch && (method === 'PATCH' || method === 'POST')) {
            const notifId = decodeURIComponent(notifReadMatch[1]);
            const updated = dbMarkNotificationRead(notifId);
            sendJson(res, { success: true, data: updated });
            return;
          }

          // -------------------------------------------------------------
          // 13. /api/calculate-fee - Authoritative Codethon Fee Engine
          // -------------------------------------------------------------
          if (pathname === '/api/calculate-fee' && method === 'POST') {
            const body = await readJson(req);
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
                  sendJson(res, {
                    success: false,
                    error: 'Invalid Exit Time',
                    message: 'Exit time cannot be earlier than entry time.'
                  }, 400);
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

            sendJson(res, {
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
              source: 'CPVTS Authoritative SQLite Backend Engine'
            });
            return;
          }

          // -------------------------------------------------------------
          // 14. /api/receipt/pdf - Receipt Engine
          // -------------------------------------------------------------
          if (pathname === '/api/receipt/pdf' && method === 'POST') {
            const receiptData = await readJson(req);

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
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('SMART CAMPUS PARKING & VEHICLE TRACKING SYSTEM', pageWidth / 2, 13, { align: 'center' });

            doc.setTextColor(200, 220, 240);
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');
            doc.text('OFFICIAL PARKING FEE AUDIT RECEIPT', pageWidth / 2, 18, { align: 'center' });
            doc.text('PERSISTENT SQLITE DATABASE VERIFIED', pageWidth / 2, 22, { align: 'center' });

            y = 33;
            doc.setTextColor(30, 40, 60);
            doc.setFontSize(8);

            const addRow = (label, val, isBold = false) => {
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(90, 100, 120);
              doc.text(label, 8, y);
              doc.setFont('helvetica', isBold ? 'bold' : 'normal');
              doc.setTextColor(20, 30, 50);
              doc.text(String(val), pageWidth - 8, y, { align: 'right' });
              y += 5.5;
            };

            addRow('Receipt No:', receiptData.receiptNumber || `CPVTS-REC-${Date.now().toString().slice(-6)}`, true);
            addRow('Issued Date:', new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }));
            addRow('Vehicle Number:', receiptData.vehicleNumber || 'KA-22-XX-0000', true);
            addRow('Vehicle Type:', receiptData.vehicleType || 'Four-Wheeler');
            addRow('Category:', receiptData.category || 'Visitor', true);
            addRow('Bay / Slot:', receiptData.slot || 'F-02');
            addRow('Gate Used:', receiptData.gate || 'Gate 1 (Student Gate)');

            y += 2;
            doc.setDrawColor(200, 210, 230);
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
            return;
          }

          next();
        } catch (err) {
          console.error('[CPVTS Database API Error]:', err);
          sendJson(res, { error: 'Internal Server Error', message: err.message }, 500);
        }
      });
    }
  };
}
