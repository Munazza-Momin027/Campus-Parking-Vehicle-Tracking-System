import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { INITIAL_SLOTS, INITIAL_ACTIVITY, REGISTERED_DATABASE, INITIAL_NOTIFICATIONS, GATES_DEF, INITIAL_GATE_STATS } from '../data/initialData';
import { playSound } from '../utils/audio';
import { calculateDurationAndFee } from '../utils/tariff';
import { calculateFeeBackend, generatePdfReceiptBackend, searchVehiclesBackend } from '../services/backendApi';
import {
  fetchFullDatabaseState,
  checkDatabaseStatus,
  dbApiAddRegisteredVehicle,
  dbApiUpdateRegisteredVehicle,
  dbApiDeleteRegisteredVehicle,
  dbApiToggleRegisteredVehicleStatus,
  dbApiGetNextSlotId,
  dbApiCreateParkingSlot,
  dbApiUpdateParkingSlot,
  dbApiToggleParkingSlotStatus,
  dbApiDeleteParkingSlot,
  dbApiUpdateSlot,
  dbApiCheckIn,
  dbApiCheckOut,
  dbApiSaveSettings,
  dbApiResetDatabase,
  dbApiGetVipReservations,
  dbApiCreateVipReservation,
  dbApiReleaseVipReservation,
  dbApiUpdateVipReservationStatus
} from '../services/dbApi';

const AppContext = createContext(null);

// Safe LocalStorage helpers for instant render cache
const getCached = (key, fallback) => {
  try {
    const val = localStorage.getItem(`cpvts_${key}`);
    if (val) return JSON.parse(val);
  } catch (e) {}
  return fallback;
};

const setCached = (key, val) => {
  try {
    localStorage.setItem(`cpvts_${key}`, JSON.stringify(val));
  } catch (e) {}
};

export function AppProvider({ children }) {
  const [currentTab, setCurrentTab] = useState('dashboard');
  
  // States initialized from cache (or canonical defaults)
  const [slots, setSlots] = useState(() => getCached('slots', INITIAL_SLOTS));
  const [activities, setActivities] = useState(() => getCached('activities', INITIAL_ACTIVITY));
  const [registeredVehicles, setRegisteredVehicles] = useState(() => getCached('registeredVehicles', REGISTERED_DATABASE));
  const [notifications, setNotifications] = useState(() => getCached('notifications', INITIAL_NOTIFICATIONS));
  const [gateStats, setGateStats] = useState(() => getCached('gateStats', INITIAL_GATE_STATS));

  // VIP & Emergency Reservations State
  const [vipReservations, setVipReservations] = useState(() => getCached('vipReservations', [
    {
      id: 'RES-VIP-101',
      slotId: 'F-01',
      reservationType: 'VIP',
      reservedFor: 'Hon. Vice Chancellor / State Dignitary',
      vehicleNumber: 'KA-22-VIP-0001',
      vehicleType: 'Four-Wheeler',
      createdBy: 'Officer Raj Sharma (Security Supervisor)',
      createdAt: new Date().toISOString(),
      expectedArrival: '11:30 AM',
      expiryTime: '06:00 PM',
      reason: 'Annual Campus Convocation & Infrastructure Inspection',
      status: 'Reserved',
      releasedBy: null,
      releasedAt: null,
      notes: 'Fast-track security protocol. Priority Bay F-01.'
    }
  ]));

  // Role-Based Authorization Context ('Security' | 'Admin' | 'Unauthorized')
  const [userRole, setUserRole] = useState('Security');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectItem, setInspectItem] = useState(null); // { type: 'slot' | 'vehicle', data: ... }
  const [selectedSlotId, setSelectedSlotId] = useState(null); // Active slot selected by operator
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pipelineMode, setPipelineMode] = useState('SIMULATION'); // 'SIMULATION' (Demo) vs 'LIVE_AI' (OpenCV+YOLO)
  const [activeGateFilter, setActiveGateFilter] = useState('all'); // 'all' | 'Student' | 'Staff' | 'Visitor'

  // Database Connection State
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [dbStatus, setDbStatus] = useState(null);
  const [lastSavedNotice, setLastSavedNotice] = useState(null);

  // Settings
  const [settings, setSettingsState] = useState(() => getCached('settings', {
    studentRate: 0,
    staffRate: 0,
    visitorRateHourly: 20,
    barrierAutoOpen: true,
    anprThreshold: 94,
    officerName: 'Officer Raj Sharma',
    officerBadge: 'CPVTS-SEC-09',
    officerShift: 'Morning Shift (06:00 - 14:00)',
    gate1Status: 'Online',
    gate2Status: 'Online',
    gate3Status: 'Online'
  }));

  // Initial synchronization with authoritative SQLite Database
  useEffect(() => {
    let isMounted = true;
    async function initDatabaseSync() {
      try {
        const fullState = await fetchFullDatabaseState();
        if (fullState && fullState.success && isMounted) {
          if (Array.isArray(fullState.slots) && fullState.slots.length > 0) {
            setSlots(fullState.slots);
            setCached('slots', fullState.slots);
          }
          if (Array.isArray(fullState.registeredVehicles) && fullState.registeredVehicles.length > 0) {
            setRegisteredVehicles(fullState.registeredVehicles);
            setCached('registeredVehicles', fullState.registeredVehicles);
          }
          if (Array.isArray(fullState.activities) && fullState.activities.length > 0) {
            setActivities(fullState.activities);
            setCached('activities', fullState.activities);
          }
          if (fullState.gateStats && Object.keys(fullState.gateStats).length > 0) {
            setGateStats(fullState.gateStats);
            setCached('gateStats', fullState.gateStats);
          }
          if (fullState.settings) {
            setSettingsState(fullState.settings);
            setCached('settings', fullState.settings);
          }
          if (Array.isArray(fullState.notifications) && fullState.notifications.length > 0) {
            setNotifications(fullState.notifications);
            setCached('notifications', fullState.notifications);
          }
          if (Array.isArray(fullState.vipReservations) && fullState.vipReservations.length > 0) {
            setVipReservations(fullState.vipReservations);
            setCached('vipReservations', fullState.vipReservations);
          }
          setIsDbConnected(true);
          setDbStatus(fullState.database);
          console.log('[CPVTS Database] Connected to SQLite database:', fullState.database);
        } else {
          // Check simple status
          const status = await checkDatabaseStatus();
          if (status && status.connected && isMounted) {
            setIsDbConnected(true);
            setDbStatus(status);
          }
        }
      } catch (err) {
        console.warn('[CPVTS Database] Sync warning:', err);
      }
    }
    initDatabaseSync();
    return () => { isMounted = false; };
  }, []);

  const notifyDbSaved = (msg) => {
    setLastSavedNotice(msg || 'Saved to SQLite Database');
    setTimeout(() => setLastSavedNotice(null), 3000);
  };

  // Recent detections matching screenshot
  const [recentDetections, setRecentDetections] = useState({
    checkIn: {
      plate: 'KA-22-XY-9876',
      type: 'Four-Wheeler',
      category: 'Student (From Database)',
      time: '10:24 AM (Auto)',
      slotAssigned: 'F-02',
      status: 'Vehicle Parked Successfully',
      thumb: '/thumb_car.png',
      fullImage: '/camera_1_feed.png'
    },
    checkOut: {
      plate: 'KA-22-AB-1234',
      type: 'Two-Wheeler',
      category: 'Staff (From Database)',
      time: '10:23 AM (Auto)',
      duration: '3 Hours',
      amount: '₹0 (Staff)',
      status: 'Vehicle Checked Out & Slot Released',
      thumb: '/thumb_bike.png',
      fullImage: '/camera_2_feed.png'
    }
  });

  // Dynamic Metrics (Database is the Authoritative Single Source of Truth)
  const metrics = useMemo(() => {
    const totalSlots = slots.length;
    const pending = slots.filter(s => s.status === 'Detection Pending' || s.isPending).length;
    const occupied = slots.filter(s => s.occupied && !s.isPending).length;
    const disabled = slots.filter(s => s.status === 'Disabled' || s.isDisabled).length;

    // ACTIVE VIP / EMERGENCY RESERVATIONS & RESERVED BAYS
    const activeReservations = vipReservations.filter(r => r.status === 'Reserved' || r.status === 'Arrived / Checked In');
    const reservedSlotIds = new Set(
      vipReservations
        .filter(r => r.status === 'Reserved' || r.status === 'Arrived / Checked In')
        .map(r => r.slotId.toUpperCase())
        .concat(slots.filter(s => s.isReserved || s.reservationStatus === 'Reserved').map(s => s.id.toUpperCase()))
    );
    const reservedSlots = reservedSlotIds.size;
    const activeReservationsCount = activeReservations.length;
    const expiredReservationsCount = vipReservations.filter(r => r.status === 'Expired').length;

    // CRITICAL RULES 1, 2, 3: Reserved slots are strictly excluded from regular parking availability calculations!
    const available = slots.filter(s =>
      !s.occupied &&
      !s.isPending &&
      s.status !== 'Disabled' &&
      !s.isDisabled &&
      !reservedSlotIds.has(s.id.toUpperCase())
    ).length;

    const twoWheelersTotal = slots.filter(s => s.zone === 'two-wheeler').length;
    const twoWheelersOccupied = slots.filter(s => s.zone === 'two-wheeler' && s.occupied).length;
    const twoWheelersAvailable = slots.filter(s =>
      s.zone === 'two-wheeler' &&
      !s.occupied &&
      !s.isPending &&
      s.status !== 'Disabled' &&
      !s.isDisabled &&
      !reservedSlotIds.has(s.id.toUpperCase())
    ).length;

    const fourWheelersTotal = slots.filter(s => s.zone === 'four-wheeler').length;
    const fourWheelersOccupied = slots.filter(s => s.zone === 'four-wheeler' && s.occupied).length;
    const fourWheelersAvailable = slots.filter(s =>
      s.zone === 'four-wheeler' &&
      !s.occupied &&
      !s.isPending &&
      s.status !== 'Disabled' &&
      !s.isDisabled &&
      !reservedSlotIds.has(s.id.toUpperCase())
    ).length;

    const customZonesTotal = slots.filter(s => s.zone !== 'two-wheeler' && s.zone !== 'four-wheeler').length;

    const totalVehiclesCount = 12 + (activities.length - INITIAL_ACTIVITY.length);
    const totalExitedCount = 4 + (activities.filter(a => a.status === 'Exited').length - 2);
    const totalCollection = 320 + activities.reduce((sum, a) => sum + (a.status === 'Exited' && a.id > 5 ? (a.fee || 0) : 0), 0);

    return {
      totalSlots,
      occupied,
      available,
      pending,
      disabled,
      reservedSlots,
      activeReservationsCount,
      expiredReservationsCount,
      freePercent: totalSlots > 0 ? Math.round((available / totalSlots) * 100) : 0,
      twoWheelersTotal,
      twoWheelersOccupied,
      twoWheelersAvailable,
      fourWheelersTotal,
      fourWheelersOccupied,
      fourWheelersAvailable,
      customZonesTotal,
      todayVehicles: totalVehiclesCount,
      todayEntries: 8 + (activities.length - INITIAL_ACTIVITY.length),
      todayExits: totalExitedCount,
      todayCollection: totalCollection
    };
  }, [slots, activities, vipReservations]);

  // Actions: Automatic Vehicle Check-In Workflow with 3-Gate Category Verification & Database Persistence
  const checkInVehicle = ({ vehicleNumber, type, category, driver, slotId, customEntryTime, gate }) => {
    const cleanPlate = (vehicleNumber || '').trim().toUpperCase();
    if (!cleanPlate) {
      playSound('alert', soundEnabled);
      return { success: false, message: 'Invalid vehicle number.' };
    }

    // Step 4 & 5: Search Registered Vehicle & Get Authoritative Owner Category
    const registered = registeredVehicles.find(r => r.vehicleNumber.toUpperCase() === cleanPlate && r.status !== 'Disabled');
    const resolvedCategory = category || (registered ? registered.category : 'Visitor');
    const resolvedType = type || (registered ? registered.vehicleType : (cleanPlate.includes('XY') || cleanPlate.includes('CD') || cleanPlate.includes('MN') || cleanPlate.includes('ZZ') ? 'Four-Wheeler' : 'Two-Wheeler'));
    const resolvedDriver = driver || (registered ? registered.ownerName : (resolvedCategory === 'Student' ? 'Campus Student' : (resolvedCategory === 'Staff' ? 'Campus Faculty' : 'Campus Visitor')));

    // 🚪 3-GATE AUTOMATION LOGIC: Verify Gate Category vs Registered Vehicle Category
    const normalizeGate = (g) => {
      if (!g) return null;
      const s = String(g).toLowerCase();
      if (s.includes('student') || s === '1' || s.includes('gate 1')) return 'Student';
      if (s.includes('staff') || s === '2' || s.includes('gate 2')) return 'Staff';
      if (s.includes('visitor') || s === '3' || s.includes('gate 3')) return 'Visitor';
      return null;
    };

    const attemptedGate = normalizeGate(gate) || resolvedCategory;

    // Security Alert: Enforce Dedicated Gate Category Access
    if (attemptedGate !== resolvedCategory) {
      playSound('alert', soundEnabled);
      const gateNum = resolvedCategory === 'Student' ? 1 : resolvedCategory === 'Staff' ? 2 : 3;
      const attemptedNum = attemptedGate === 'Student' ? 1 : attemptedGate === 'Staff' ? 2 : 3;
      const msg = `⚠ WRONG GATE: This vehicle is registered for the ${resolvedCategory} Gate (Gate ${gateNum}). Ingress through ${attemptedGate} Gate (Gate ${attemptedNum}) is DENIED.`;

      const wrongNotif = {
        id: `notif-${Date.now()}`,
        title: '⚠ WRONG GATE SECURITY ALERT',
        message: `${cleanPlate} arrived at Gate ${attemptedNum} (${attemptedGate} Gate) but belongs to ${resolvedCategory}. Entry barrier remains CLOSED.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
        type: 'warning',
        read: false
      };

      setNotifications(prev => {
        const next = [wrongNotif, ...prev];
        setCached('notifications', next);
        return next;
      });

      return {
        success: false,
        error: 'Wrong Gate',
        message: msg,
        vehicleNumber: cleanPlate,
        category: resolvedCategory,
        attemptedGate: `${attemptedGate} Gate`,
        requiredGate: `${resolvedCategory} Gate`,
        barrierStatus: 'GATE BARRIER CLOSED (WRONG GATE)'
      };
    }

    // Duplicate-Entry Prevention
    const alreadyParkedSlot = slots.find(s => s.occupied && s.vehicleNumber === cleanPlate);
    if (alreadyParkedSlot) {
      playSound('alert', soundEnabled);
      return {
        success: false,
        error: 'Vehicle Already Parked',
        message: `Vehicle Already Parked in Slot ${alreadyParkedSlot.id}! Duplicate entry is prevented.`,
        slot: alreadyParkedSlot.id
      };
    }

    // Critical VIP Reservation Matching:
    // Check if incoming vehicle matches an active reservation
    const matchingReservation = vipReservations.find(
      r => (r.status === 'Reserved' || r.status === 'Arrived / Checked In') &&
      cleanPlate &&
      r.vehicleNumber &&
      r.vehicleNumber.toUpperCase() === cleanPlate
    );

    let isVipCheckIn = Boolean(matchingReservation);
    let targetSlot = slotId;

    if (matchingReservation && !targetSlot) {
      targetSlot = matchingReservation.slotId;
    }

    // Active reserved slot ID set (to exclude from regular vehicle assignment)
    const reservedSlotIds = new Set(
      vipReservations
        .filter(r => r.status === 'Reserved')
        .map(r => r.slotId.toUpperCase())
        .concat(slots.filter(s => s.isReserved || s.reservationStatus === 'Reserved').map(s => s.id.toUpperCase()))
    );

    // Find Available Slot & Assign Slot (Never assign occupied, disabled, or reserved slots to regular vehicles!)
    if (!targetSlot) {
      const zoneType = resolvedType === 'Four-Wheeler' ? 'four-wheeler' : 'two-wheeler';
      
      const isSlotEligible = (s) => {
        if (s.zone !== zoneType) return false;
        if (s.occupied || s.isPending) return false;
        if (s.status === 'Disabled' || s.isDisabled) return false;
        // CRITICAL RULE 1 & 2: A reserved slot must never be automatically assigned to a regular vehicle!
        if (s.isReserved || s.reservationStatus === 'Reserved' || reservedSlotIds.has(s.id.toUpperCase())) return false;
        return true;
      };

      // 1. Try to find a slot matching vehicle zone, not occupied, not pending, not disabled, not reserved, matching gateCategory
      let availableSlot = slots.find(s => isSlotEligible(s) && s.gateCategory === resolvedCategory);

      // 2. Fall back to Universal gate slots or unassigned category slots in that zone
      if (!availableSlot) {
        availableSlot = slots.find(s => isSlotEligible(s) && (!s.gateCategory || s.gateCategory === 'Universal'));
      }

      // 3. Fall back to any available active slot in that zone
      if (!availableSlot) {
        availableSlot = slots.find(s => isSlotEligible(s));
      }

      if (!availableSlot) {
        playSound('alert', soundEnabled);
        return {
          success: false,
          error: 'Parking Full',
          message: `Parking Full: All regular ${resolvedType} bays in ${zoneType === 'four-wheeler' ? 'Zone F' : 'Zone T'} are occupied or under maintenance (VIP reserved bays excluded)!`,
          zone: zoneType
        };
      }
      targetSlot = availableSlot.id;
    } else {
      // If a specific slot was targeted, enforce reservation integrity:
      const targetSlotObj = slots.find(s => s.id.toUpperCase() === targetSlot.toUpperCase());
      const isTargetReserved = targetSlotObj && (targetSlotObj.isReserved || targetSlotObj.reservationStatus === 'Reserved' || reservedSlotIds.has(targetSlot.toUpperCase()));

      if (isTargetReserved && !isVipCheckIn) {
        // Regular vehicle attempted on reserved slot without authorization
        playSound('alert', soundEnabled);
        return {
          success: false,
          error: 'Slot Reserved',
          message: `Ingress Denied: Slot ${targetSlot} is reserved under Fast-Track VIP / Emergency Protocol. Regular vehicles cannot occupy this bay.`,
          slot: targetSlot
        };
      }
    }

    const now = new Date();
    const timeStr = customEntryTime || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    // If VIP check-in, update VIP reservation state to 'Arrived / Checked In'
    if (isVipCheckIn && matchingReservation) {
      setVipReservations(prev => {
        const next = prev.map(r => r.id === matchingReservation.id ? { ...r, status: 'Arrived / Checked In' } : r);
        setCached('vipReservations', next);
        return next;
      });
    }

    // Step 8: Update Slots
    setSlots(prev => {
      const updated = prev.map(s => {
        if (s.id.toUpperCase() === targetSlot.toUpperCase()) {
          return {
            ...s,
            occupied: true,
            isPending: false,
            status: 'Occupied',
            reservationStatus: isVipCheckIn ? 'Arrived / Checked In' : s.reservationStatus,
            vehicleNumber: cleanPlate,
            type: resolvedType,
            driver: resolvedDriver,
            category: resolvedCategory,
            entryTime: timeStr,
            gate: `${resolvedCategory} Gate`
          };
        }
        return s;
      });
      setCached('slots', updated);
      return updated;
    });

    // Create Immutable Parking Activity Record
    const newAct = {
      id: String(Date.now()),
      vehicleNumber: cleanPlate,
      type: resolvedType,
      category: resolvedCategory,
      slot: targetSlot,
      gate: `${resolvedCategory} Gate`,
      entryTime: timeStr,
      exitTime: '—',
      status: 'Parked',
      driver: resolvedDriver,
      department: registered ? registered.department : (resolvedCategory === 'Student' ? 'Student Body' : 'Campus Visitor'),
      duration: 'Just Now',
      fee: 0,
      isAutoCheckIn: true,
      registeredTag: registered ? registered.rfidTag : 'UNREGISTERED',
      photo: resolvedType === 'Four-Wheeler' ? '/camera_1_feed.png' : '/camera_2_feed.png',
      thumb: resolvedType === 'Four-Wheeler' ? '/thumb_car.png' : '/thumb_bike.png'
    };

    setActivities(prev => {
      const updated = [newAct, ...prev];
      setCached('activities', updated);
      return updated;
    });

    // Update Gate Statistics
    setGateStats(prev => {
      const current = prev[resolvedCategory] || prev.Student;
      const updated = {
        ...prev,
        [resolvedCategory]: {
          ...current,
          entryCount: current.entryCount + 1,
          currentCount: current.currentCount + 1,
          recentDetection: {
            vehicleNumber: cleanPlate,
            vehicleType: resolvedType,
            category: resolvedCategory,
            direction: 'Entry',
            time: timeStr,
            slot: targetSlot,
            verified: true
          }
        }
      };
      setCached('gateStats', updated);
      return updated;
    });

    // Telemetry & Recent Detections
    setRecentDetections(prev => ({
      ...prev,
      checkIn: {
        plate: cleanPlate,
        type: resolvedType,
        category: `${resolvedCategory} (From Database)`,
        time: `${timeStr} (Auto)`,
        slotAssigned: targetSlot,
        status: 'Vehicle Parked Successfully',
        thumb: resolvedType === 'Four-Wheeler' ? '/thumb_car.png' : '/thumb_bike.png',
        fullImage: resolvedType === 'Four-Wheeler' ? '/camera_1_feed.png' : '/camera_2_feed.png'
      }
    }));

    // Notification
    const notifItem = {
      id: `notif-${Date.now()}`,
      title: '✓ AUTO CHECK-IN VERIFIED',
      message: `${cleanPlate} (${resolvedType} • ${resolvedCategory}) verified & assigned to Bay ${targetSlot} via ${resolvedCategory} Gate.`,
      time: timeStr,
      type: 'success',
      read: false
    };

    setNotifications(prev => {
      const updated = [notifItem, ...prev];
      setCached('notifications', updated);
      return updated;
    });

    // Persist atomically to SQLite Database
    dbApiCheckIn({
      vehicleNumber: cleanPlate,
      type: resolvedType,
      category: resolvedCategory,
      driver: resolvedDriver,
      slotId: targetSlot,
      timeStr,
      gate: `${resolvedCategory} Gate`,
      rfidTag: registered ? registered.rfidTag : null,
      department: registered ? registered.department : null
    });
    notifyDbSaved(`Check-In for ${cleanPlate} stored in SQLite.`);

    playSound('success', soundEnabled);

    return {
      success: true,
      vehicleNumber: cleanPlate,
      category: resolvedCategory,
      type: resolvedType,
      driver: resolvedDriver,
      slot: targetSlot,
      gate: `${resolvedCategory} Gate`,
      entryTime: timeStr,
      registeredDetails: registered || null,
      status: '✓ AUTO CHECK-IN'
    };
  };

  // Actions: Automatic Vehicle Check-Out Workflow with Database Persistence
  const checkOutVehicle = ({ vehicleNumber, slotId, fee, duration, exitTime: customExitTime, gate }) => {
    const now = new Date();
    const timeStr = customExitTime || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    const targetSlot = slots.find(s => s.vehicleNumber === vehicleNumber || (slotId && s.id === slotId));
    const targetActivity = activities.find(a => a.vehicleNumber === vehicleNumber && a.status === 'Parked');

    if (!targetSlot?.occupied && targetActivity?.status !== 'Parked') {
      playSound('alert', soundEnabled);
      return {
        success: false,
        error: 'Active Parking Record Not Found',
        message: `Active Parking Record Not Found: Vehicle ${vehicleNumber || slotId} is not currently parked in any campus bay.`
      };
    }

    const resolvedSlotId = slotId || targetSlot?.id || targetActivity?.slot || 'N/A';
    const entryTime = targetSlot?.entryTime || targetActivity?.entryTime || '10:00 AM';
    const category = targetSlot?.category || targetActivity?.category || 'Visitor';
    const type = targetSlot?.type || targetActivity?.type || 'Four-Wheeler';

    // 🚪 3-GATE AUTOMATION LOGIC
    const normalizeGate = (g) => {
      if (!g) return null;
      const s = String(g).toLowerCase();
      if (s.includes('student') || s === '1' || s.includes('gate 1')) return 'Student';
      if (s.includes('staff') || s === '2' || s.includes('gate 2')) return 'Staff';
      if (s.includes('visitor') || s === '3' || s.includes('gate 3')) return 'Visitor';
      return null;
    };

    const attemptedExitGate = normalizeGate(gate) || category;

    if (attemptedExitGate !== category) {
      playSound('alert', soundEnabled);
      const gateNum = category === 'Student' ? 1 : category === 'Staff' ? 2 : 3;
      const attemptedNum = attemptedExitGate === 'Student' ? 1 : attemptedExitGate === 'Staff' ? 2 : 3;
      const msg = `⚠ WRONG GATE: Vehicle belongs to ${category} category and must exit via ${category} Gate (Gate ${gateNum}). Exit through ${attemptedExitGate} Gate (Gate ${attemptedNum}) is DENIED.`;
      return {
        success: false,
        error: 'Wrong Gate',
        message: msg,
        vehicleNumber: vehicleNumber || targetSlot?.vehicleNumber,
        category,
        attemptedGate: `${attemptedExitGate} Gate`,
        requiredGate: `${category} Gate`
      };
    }

    // Valid Exit-Time Validation
    if (customExitTime) {
      const parseMinutes = (tStr) => {
        const m = String(tStr).match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (!m) return null;
        let h = parseInt(m[1], 10);
        const min = parseInt(m[2], 10);
        const ap = (m[3] || '').toUpperCase();
        if (ap === 'PM' && h < 12) h += 12;
        if (ap === 'AM' && h === 12) h = 0;
        return h * 60 + min;
      };

      const entryM = parseMinutes(entryTime);
      const exitM = parseMinutes(customExitTime);
      if (entryM !== null && exitM !== null && exitM < entryM) {
        playSound('alert', soundEnabled);
        return {
          success: false,
          error: 'Invalid Exit Time',
          message: 'Exit time cannot be earlier than entry time.'
        };
      }
    }

    // Calculate elapsed duration and fee dynamically
    const tariffResult = calculateDurationAndFee(entryTime, now, category, type);
    const resolvedDuration = duration || tariffResult.duration;
    const resolvedFee = fee !== undefined ? fee : tariffResult.totalAmount;
    const resolvedFreeHours = tariffResult.freeHours;
    const resolvedChargedHours = tariffResult.chargedHours;
    const resolvedRate = tariffResult.rate;
    const resolvedFormula = tariffResult.calculationFormula;

    const resolvedPlate = vehicleNumber || targetSlot?.vehicleNumber || targetActivity?.vehicleNumber;

    // Free slot -> Mark Available and complete VIP reservation if fulfilled
    setVipReservations(prev => {
      const updated = prev.map(r => {
        const isTargetMatch = (resolvedPlate && r.vehicleNumber && r.vehicleNumber.toUpperCase() === resolvedPlate.toUpperCase()) ||
                              (resolvedSlotId && resolvedSlotId !== 'N/A' && r.slotId.toUpperCase() === resolvedSlotId.toUpperCase());
        if (isTargetMatch && r.status === 'Arrived / Checked In') {
          return { ...r, status: 'Completed' };
        }
        return r;
      });
      setCached('vipReservations', updated);
      return updated;
    });

    setSlots(prev => {
      const updated = prev.map(s => {
        if ((resolvedPlate && s.vehicleNumber === resolvedPlate) || (resolvedSlotId && resolvedSlotId !== 'N/A' && s.id === resolvedSlotId)) {
          const wasVipCheckedIn = s.reservationStatus === 'Arrived / Checked In';
          return {
            ...s,
            occupied: false,
            isPending: false,
            status: 'Available',
            isReserved: wasVipCheckedIn ? false : s.isReserved,
            reservationId: wasVipCheckedIn ? null : s.reservationId,
            reservationType: wasVipCheckedIn ? null : s.reservationType,
            reservationStatus: wasVipCheckedIn ? null : s.reservationStatus,
            vehicleNumber: null,
            driver: null,
            category: null,
            entryTime: null,
            gate: null
          };
        }
        return s;
      });
      setCached('slots', updated);
      return updated;
    });

    // Mark Activity Record as Exited
    setActivities(prev => {
      const updated = prev.map(a => {
        if (((resolvedPlate && a.vehicleNumber === resolvedPlate) || (resolvedSlotId && resolvedSlotId !== 'N/A' && a.slot === resolvedSlotId)) && a.status === 'Parked') {
          return {
            ...a,
            exitTime: timeStr,
            status: 'Exited',
            duration: resolvedDuration,
            fee: resolvedFee,
            exitGate: `${category} Gate`
          };
        }
        return a;
      });
      setCached('activities', updated);
      return updated;
    });

    // Update Gate Statistics
    setGateStats(prev => {
      const current = prev[category] || prev.Student;
      const updated = {
        ...prev,
        [category]: {
          ...current,
          exitCount: current.exitCount + 1,
          currentCount: Math.max(0, current.currentCount - 1),
          recentDetection: {
            vehicleNumber: resolvedPlate,
            vehicleType: type,
            category,
            direction: 'Exit',
            time: timeStr,
            slot: resolvedSlotId,
            verified: true
          }
        }
      };
      setCached('gateStats', updated);
      return updated;
    });

    // Update Recent Detection CheckOut
    setRecentDetections(prev => ({
      ...prev,
      checkOut: {
        plate: resolvedPlate,
        type,
        category: `${category} (From Database)`,
        time: `${timeStr} (Auto)`,
        duration: resolvedDuration,
        amount: resolvedFee === 0 ? `₹0 (${category} Pass Waiver)` : `₹${resolvedFee}`,
        status: 'Vehicle Checked Out & Slot Released',
        thumb: type === 'Four-Wheeler' ? '/thumb_car.png' : '/thumb_bike.png',
        fullImage: type === 'Four-Wheeler' ? '/camera_1_feed.png' : '/camera_2_feed.png'
      }
    }));

    // Notification
    const notifItem = {
      id: `notif-${Date.now()}`,
      title: '✓ AUTO CHECK-OUT COMPLETED',
      message: `${resolvedPlate} (${type} • ${category}) checked out from Slot ${resolvedSlotId}. Slot is now AVAILABLE. Duration: ${resolvedDuration}, Fee: ₹${resolvedFee}.`,
      time: timeStr,
      type: 'info',
      read: false
    };

    setNotifications(prev => {
      const updated = [notifItem, ...prev];
      setCached('notifications', updated);
      return updated;
    });

    // Persist to SQLite Database
    dbApiCheckOut({
      vehicleNumber: resolvedPlate,
      slotId: resolvedSlotId,
      fee: resolvedFee,
      duration: resolvedDuration,
      timeStr,
      gate: attemptedExitGate ? `${attemptedExitGate} Gate` : null,
      category,
      type
    });
    notifyDbSaved(`Check-Out for ${resolvedPlate} saved in SQLite.`);

    playSound('success', soundEnabled);

    return {
      success: true,
      vehicleNumber: resolvedPlate,
      vehicleType: type,
      category,
      slot: resolvedSlotId,
      entryTime,
      exitTime: timeStr,
      duration: resolvedDuration,
      fee: resolvedFee,
      totalAmount: resolvedFee,
      freeHours: resolvedFreeHours,
      chargedHours: resolvedChargedHours,
      rate: resolvedRate,
      calculationFormula: resolvedFormula,
      status: '✓ AUTO CHECK-OUT',
      slotVacant: true
    };
  };

  const triggerSlotDetectionPending = (slotId, pendingPlate = 'KA-22-ZZ-4400', pendingType = 'Four-Wheeler') => {
    playSound('beep', soundEnabled);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    setSlots(prev => {
      const updated = prev.map(s => {
        if (s.id === slotId) {
          return {
            ...s,
            occupied: false,
            isPending: true,
            status: 'Detection Pending',
            vehicleNumber: pendingPlate,
            type: pendingType,
            entryTime: timeStr,
            driver: 'Optical Sensor Tripped (Pending ANPR)',
            category: 'Visitor'
          };
        }
        return s;
      });
      setCached('slots', updated);
      return updated;
    });

    const pendingAct = {
      id: String(Date.now()),
      vehicleNumber: pendingPlate,
      type: pendingType,
      category: 'Visitor',
      slot: slotId,
      entryTime: timeStr,
      exitTime: '—',
      status: 'Pending',
      driver: 'Optical Sensor Tripped (Pending ANPR)',
      department: 'Optical Beam Sensor Tripwire Active',
      duration: 'Scanning OCR...',
      fee: 40,
      photo: '/camera_1_feed.png',
      thumb: pendingType === 'Four-Wheeler' ? '/thumb_car.png' : '/thumb_bike.png'
    };

    setActivities(prev => {
      const updated = [pendingAct, ...prev.filter(a => a.slot !== slotId || a.status !== 'Pending')];
      setCached('activities', updated);
      return updated;
    });

    setNotifications(prev => {
      const updated = [
        {
          id: `notif-${Date.now()}`,
          title: '🟡 DETECTION PENDING',
          message: `Optical sensor tripped at Slot ${slotId}. Computer vision classification active for ${pendingPlate}.`,
          time: timeStr,
          type: 'warning',
          read: false
        },
        ...prev
      ];
      setCached('notifications', updated);
      return updated;
    });

    // Update in DB
    dbApiUpdateSlot(slotId, {
      occupied: false,
      isPending: true,
      status: 'Detection Pending',
      vehicleNumber: pendingPlate,
      entryTime: timeStr,
      driver: 'Optical Sensor Tripped (Pending ANPR)',
      category: 'Visitor'
    });
  };

  const resolvePendingSlot = (slotId) => {
    const slot = slots.find(s => s.id === slotId);
    if (!slot) return;
    checkInVehicle({
      vehicleNumber: slot.vehicleNumber || (slot.zone === 'four-wheeler' ? 'KA-22-XY-9876' : 'KA-22-GH-7890'),
      type: slot.type || (slot.zone === 'four-wheeler' ? 'Four-Wheeler' : 'Two-Wheeler'),
      category: slot.category || 'Student',
      driver: slot.driver || 'Campus Member',
      slotId
    });
  };

  const toggleSlot = (slotId) => {
    const slot = slots.find(s => s.id === slotId);
    if (!slot) return;
    if (slot.occupied) {
      checkOutVehicle({ vehicleNumber: slot.vehicleNumber, slotId });
    } else if (slot.isPending || slot.status === 'Detection Pending') {
      resolvePendingSlot(slotId);
    } else {
      const isTwo = slot.zone === 'two-wheeler';
      checkInVehicle({
        vehicleNumber: isTwo ? `KA-22-EX-${Math.floor(1000 + Math.random() * 9000)}` : `KA-22-DX-${Math.floor(1000 + Math.random() * 9000)}`,
        type: isTwo ? 'Two-Wheeler' : 'Four-Wheeler',
        category: 'Visitor',
        driver: 'Campus Visitor',
        slotId
      });
    }
  };

  // =========================================================================
  // REGISTERED VEHICLES (FULL CRUD WITH SQLITE DATABASE PERSISTENCE)
  // =========================================================================

  const addRegisteredVehicle = (newVeh) => {
    const id = newVeh.id || `REG-${Date.now().toString().slice(-4)}`;
    const fullVeh = {
      id,
      status: 'Active',
      ...newVeh,
      vehicleNumber: newVeh.vehicleNumber.trim().toUpperCase()
    };

    setRegisteredVehicles(prev => {
      const updated = [fullVeh, ...prev.filter(v => v.id !== id)];
      setCached('registeredVehicles', updated);
      return updated;
    });

    // Save to SQLite
    dbApiAddRegisteredVehicle(fullVeh);
    notifyDbSaved(`Registered vehicle ${fullVeh.vehicleNumber} saved to SQLite.`);
    playSound('success', soundEnabled);

    return fullVeh;
  };

  const updateRegisteredVehicle = (id, updatedFields) => {
    setRegisteredVehicles(prev => {
      const updated = prev.map(v => {
        if (v.id === id) {
          return {
            ...v,
            ...updatedFields,
            vehicleNumber: (updatedFields.vehicleNumber || v.vehicleNumber).trim().toUpperCase()
          };
        }
        return v;
      });
      setCached('registeredVehicles', updated);
      return updated;
    });

    // Save to SQLite
    dbApiUpdateRegisteredVehicle(id, updatedFields);
    notifyDbSaved(`Vehicle updates saved to SQLite.`);
    playSound('success', soundEnabled);
  };

  const toggleRegistrationStatus = (id) => {
    setRegisteredVehicles(prev => {
      const updated = prev.map(v => {
        if (v.id === id) {
          const nextStatus = v.status === 'Disabled' ? 'Active' : 'Disabled';
          return { ...v, status: nextStatus };
        }
        return v;
      });
      setCached('registeredVehicles', updated);
      return updated;
    });

    // Save to SQLite
    dbApiToggleRegisteredVehicleStatus(id);
    notifyDbSaved(`Vehicle status toggled in SQLite.`);
    playSound('beep', soundEnabled);
  };

  const deleteRegisteredVehicle = (id) => {
    setRegisteredVehicles(prev => {
      const updated = prev.filter(v => v.id !== id);
      setCached('registeredVehicles', updated);
      return updated;
    });

    // Save to SQLite
    dbApiDeleteRegisteredVehicle(id);
    notifyDbSaved(`Vehicle removed from SQLite.`);
    playSound('success', soundEnabled);
  };

  const registerVehicle = (newVeh) => {
    return addRegisteredVehicle(newVeh);
  };

  // Settings update wrapper with SQLite persistence
  const setSettings = (newSettingsOrUpdater) => {
    setSettingsState(prev => {
      const next = typeof newSettingsOrUpdater === 'function' ? newSettingsOrUpdater(prev) : newSettingsOrUpdater;
      setCached('settings', next);
      dbApiSaveSettings(next);
      notifyDbSaved('Settings saved to SQLite.');
      return next;
    });
  };

  // Reset entire database back to default initial records
  const resetDatabaseToDefaults = async () => {
    const res = await dbApiResetDatabase();
    if (res && res.success) {
      setSlots(res.slots || INITIAL_SLOTS);
      setRegisteredVehicles(res.registeredVehicles || REGISTERED_DATABASE);
      setActivities(res.activities || INITIAL_ACTIVITY);
      setGateStats(res.gateStats || INITIAL_GATE_STATS);
      setSettingsState(res.settings || {});
      setNotifications(res.notifications || INITIAL_NOTIFICATIONS);

      setCached('slots', res.slots || INITIAL_SLOTS);
      setCached('registeredVehicles', res.registeredVehicles || REGISTERED_DATABASE);
      setCached('activities', res.activities || INITIAL_ACTIVITY);
      setCached('gateStats', res.gateStats || INITIAL_GATE_STATS);
      setCached('settings', res.settings || {});
      setCached('notifications', res.notifications || INITIAL_NOTIFICATIONS);

      setDbStatus(res.database);
      notifyDbSaved('Database restored to default institutional seed.');
      playSound('success', soundEnabled);
      return true;
    }
    return false;
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      setCached('notifications', updated);
      return updated;
    });
  };

  const clearAllNotifications = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      setCached('notifications', updated);
      return updated;
    });
  };

  // =========================================================================
  // PARKING SLOT INVENTORY MANAGEMENT (SETTINGS CRUD WITH DATABASE INTEGRITY)
  // =========================================================================

  const createParkingSlot = async (slotData) => {
    const cleanId = (slotData.id || '').trim().toUpperCase();
    if (!cleanId) {
      return { success: false, error: 'Slot ID is required and cannot be empty.' };
    }

    if (slots.some(s => s.id.toUpperCase() === cleanId)) {
      return { success: false, error: `Duplicate Slot ID: Slot '${cleanId}' already exists in inventory.` };
    }

    const res = await dbApiCreateParkingSlot(slotData);
    if (res && res.success) {
      const newSlot = res.data;
      setSlots(prev => {
        const next = [...prev.filter(s => s.id.toUpperCase() !== cleanId), newSlot].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
        setCached('slots', next);
        return next;
      });
      notifyDbSaved(`Slot ${cleanId} added to database.`);
      playSound('success', soundEnabled);
      return { success: true, data: newSlot };
    }
    return { success: false, error: res?.error || 'Failed to create slot in database.' };
  };

  const editParkingSlot = async (slotId, updates) => {
    const cleanId = (slotId || '').trim().toUpperCase();
    const existing = slots.find(s => s.id.toUpperCase() === cleanId);
    if (!existing) {
      return { success: false, error: `Slot '${cleanId}' not found.` };
    }

    if (existing.occupied && (updates.status === 'Available' || updates.occupied === false)) {
      return { success: false, error: `Cannot manually mark slot '${cleanId}' as Available while vehicle ${existing.vehicleNumber} is actively parked.` };
    }

    const res = await dbApiUpdateParkingSlot(cleanId, updates);
    if (res && res.success) {
      const updated = res.data;
      setSlots(prev => {
        const next = prev.map(s => s.id.toUpperCase() === cleanId ? { ...s, ...updated } : s);
        setCached('slots', next);
        return next;
      });
      notifyDbSaved(`Slot ${cleanId} updated.`);
      playSound('success', soundEnabled);
      return { success: true, data: updated };
    }
    return { success: false, error: res?.error || 'Failed to update slot.' };
  };

  const toggleParkingSlotStatus = async (slotId) => {
    const cleanId = (slotId || '').trim().toUpperCase();
    const existing = slots.find(s => s.id.toUpperCase() === cleanId);
    if (!existing) {
      return { success: false, error: `Slot '${cleanId}' not found.` };
    }

    if (existing.occupied) {
      return { success: false, error: `Cannot disable slot '${cleanId}' while occupied by vehicle ${existing.vehicleNumber}.` };
    }

    const res = await dbApiToggleParkingSlotStatus(cleanId);
    if (res && res.success) {
      const updated = res.data;
      setSlots(prev => {
        const next = prev.map(s => s.id.toUpperCase() === cleanId ? { ...s, ...updated } : s);
        setCached('slots', next);
        return next;
      });
      notifyDbSaved(`Slot ${cleanId} status set to ${updated.status}.`);
      playSound('beep', soundEnabled);
      return { success: true, data: updated };
    }
    return { success: false, error: res?.error || 'Failed to toggle slot status.' };
  };

  const deleteParkingSlot = async (slotId) => {
    const cleanId = (slotId || '').trim().toUpperCase();
    const existing = slots.find(s => s.id.toUpperCase() === cleanId);
    if (!existing) {
      return { success: false, error: `Slot '${cleanId}' not found.` };
    }

    if (existing.occupied) {
      return { success: false, error: `Cannot delete slot '${cleanId}': Active vehicle ${existing.vehicleNumber} is parked here.` };
    }

    if (existing.isPending) {
      return { success: false, error: `Cannot delete slot '${cleanId}': Active detection pending.` };
    }

    const res = await dbApiDeleteParkingSlot(cleanId);
    if (res && res.success) {
      setSlots(prev => {
        const next = prev.filter(s => s.id.toUpperCase() !== cleanId);
        setCached('slots', next);
        return next;
      });
      notifyDbSaved(`Slot ${cleanId} deleted from inventory.`);
      playSound('success', soundEnabled);
      return { success: true };
    }
    return { success: false, error: res?.error || 'Failed to delete slot from database.' };
  };

  // Fast-Track VIP & Emergency Reservation Management
  const createVipReservation = async (reservationData) => {
    if (userRole === 'Unauthorized') {
      return { success: false, error: 'Unauthorized: Access restricted to Security Officers and Administrators.' };
    }

    try {
      const res = await dbApiCreateVipReservation(reservationData, userRole);
      if (res && res.success) {
        const newRes = res.data;
        // Update VIP reservations state
        setVipReservations(prev => {
          const next = [newRes, ...prev.filter(r => r.id !== newRes.id)];
          setCached('vipReservations', next);
          return next;
        });

        // Update corresponding slot state in memory
        setSlots(prev => {
          const next = prev.map(s => {
            if (s.id.toUpperCase() === newRes.slotId.toUpperCase()) {
              return {
                ...s,
                isReserved: true,
                reservationId: newRes.id,
                reservationType: newRes.reservationType,
                reservationStatus: 'Reserved'
              };
            }
            return s;
          });
          setCached('slots', next);
          return next;
        });

        // Create notification
        const newNotif = {
          id: Date.now(),
          type: 'alert',
          title: `VIP Bay Reserved: ${newRes.slotId}`,
          message: `${newRes.reservationType} Bay ${newRes.slotId} reserved for ${newRes.reservedFor} (${newRes.vehicleNumber}).`,
          time: 'Just now',
          read: false
        };
        setNotifications(prev => [newNotif, ...prev]);

        // Audit Activity Log
        const newActivity = {
          id: Date.now(),
          vehicleNumber: newRes.vehicleNumber,
          type: newRes.vehicleType,
          category: newRes.reservationType,
          driver: newRes.reservedFor,
          slot: newRes.slotId,
          gate: 'Security Protocol',
          entryTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          exitTime: null,
          duration: null,
          fee: 0,
          status: 'VIP Reserved',
          flagged: false,
          receiptGenerated: false,
          notes: `VIP Slot ${newRes.slotId} reserved by ${newRes.createdBy}. Reason: ${newRes.reason}`
        };
        setActivities(prev => [newActivity, ...prev]);

        playSound('success', soundEnabled);
        notifyDbSaved(`Slot ${newRes.slotId} locked for ${newRes.reservationType} (${newRes.reservedFor})`);
        return { success: true, data: newRes };
      }
      return { success: false, error: res?.error || 'Failed to create VIP reservation.' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const releaseVipReservation = async (reservationOrSlotId, reason = '') => {
    if (userRole === 'Unauthorized') {
      return { success: false, error: 'Unauthorized: Access restricted to Security Officers and Administrators.' };
    }

    try {
      const officer = settings.officerName || 'Officer Raj Sharma';

      // 1. Resolve target reservation: could be passed a reservation ID (RES-VIP-101) or a slot ID (F-01)
      let targetReservation = vipReservations.find(r => r.id === reservationOrSlotId);
      if (!targetReservation) {
        targetReservation = vipReservations.find(
          r => r.slotId?.toUpperCase() === String(reservationOrSlotId || '').toUpperCase() &&
               (r.status === 'Reserved' || r.status === 'Arrived / Checked In')
        );
      }
      const actualResId = targetReservation ? targetReservation.id : reservationOrSlotId;

      // 2. Call backend release API with clean string arguments
      const res = await dbApiReleaseVipReservation(actualResId, userRole, officer, reason);

      if (res && res.success) {
        // Unpack payload: backend sends { success: true, data: { reservation: {...}, slot: {...} } }
        const payloadData = res.data || {};
        const releasedRecord = payloadData.reservation || payloadData;
        const updatedSlot = payloadData.slot;
        const targetSlotId = updatedSlot?.id || releasedRecord.slotId || targetReservation?.slotId;

        // 3. Update VIP reservations React state immediately
        setVipReservations(prev => {
          const next = prev.map(r => {
            if (r.id === actualResId || (targetReservation && r.id === targetReservation.id)) {
              return {
                ...r,
                ...(releasedRecord || {}),
                status: 'Released',
                releasedBy: officer,
                releasedAt: new Date().toISOString()
              };
            }
            return r;
          });
          setCached('vipReservations', next);
          return next;
        });

        // 4. Update slot React state: CRITICAL RULE 5:
        // "Releasing a reservation must never automatically mark an occupied slot as available"
        setSlots(prev => {
          const next = prev.map(s => {
            if ((targetSlotId && s.id.toUpperCase() === targetSlotId.toUpperCase()) || s.reservationId === actualResId) {
              const currentOccupied = updatedSlot ? updatedSlot.occupied : s.occupied;
              const currentVehicle = updatedSlot ? updatedSlot.vehicleNumber : s.vehicleNumber;
              const nextStatus = currentOccupied ? 'Occupied' : (s.isDisabled ? 'Disabled' : 'Available');

              return {
                ...s,
                ...(updatedSlot || {}),
                isReserved: false,
                reservationId: null,
                reservationType: null,
                reservationStatus: null,
                status: nextStatus
              };
            }
            return s;
          });
          setCached('slots', next);
          return next;
        });

        // 5. Authoritative resync in background
        fetchFullDatabaseState().then(fullState => {
          if (fullState && fullState.success) {
            if (Array.isArray(fullState.vipReservations)) {
              setVipReservations(fullState.vipReservations);
              setCached('vipReservations', fullState.vipReservations);
            }
            if (Array.isArray(fullState.slots)) {
              setSlots(fullState.slots);
              setCached('slots', fullState.slots);
            }
          }
        }).catch(err => console.warn('[CPVTS] Background sync notice:', err));

        // 6. Security Activity log
        const newActivity = {
          id: Date.now(),
          vehicleNumber: releasedRecord.vehicleNumber || targetReservation?.vehicleNumber || 'RESERVED',
          type: releasedRecord.vehicleType || targetReservation?.vehicleType || 'Four-Wheeler',
          category: releasedRecord.reservationType || targetReservation?.reservationType || 'VIP',
          driver: releasedRecord.reservedFor || targetReservation?.reservedFor || 'Official Dignitary',
          slot: targetSlotId || 'Priority Bay',
          gate: 'Security Protocol',
          entryTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          exitTime: null,
          duration: null,
          fee: 0,
          status: 'VIP Released',
          flagged: false,
          receiptGenerated: false,
          notes: `VIP Reservation ${actualResId} released by ${officer}. Reason: ${reason || 'Authorized manual release'}`
        };
        setActivities(prev => [newActivity, ...prev]);

        playSound('beep', soundEnabled);
        notifyDbSaved(`VIP Reservation ${actualResId} released.`);
        return { success: true, data: releasedRecord, slot: updatedSlot };
      }

      return { success: false, error: res?.error || 'Failed to release reservation.' };
    } catch (err) {
      console.error('[CPVTS] Release error:', err);
      return { success: false, error: err.message };
    }
  };

  const updateVipReservationStatus = async (reservationId, status, notes = '') => {
    if (userRole === 'Unauthorized') {
      return { success: false, error: 'Unauthorized: Access restricted to Security Officers and Administrators.' };
    }

    try {
      const res = await dbApiUpdateVipReservationStatus(reservationId, status, notes, userRole);
      if (res && res.success) {
        const updated = res.data;
        setVipReservations(prev => {
          const next = prev.map(r => r.id === reservationId ? { ...r, ...updated } : r);
          setCached('vipReservations', next);
          return next;
        });

        // Update slot reservation status if needed
        setSlots(prev => {
          const next = prev.map(s => {
            if (s.reservationId === reservationId) {
              return {
                ...s,
                reservationStatus: updated.status,
                isReserved: updated.status === 'Reserved' || updated.status === 'Arrived / Checked In'
              };
            }
            return s;
          });
          setCached('slots', next);
          return next;
        });

        notifyDbSaved(`Reservation ${reservationId} status updated to ${status}.`);
        return { success: true, data: updated };
      }
      return { success: false, error: res?.error || 'Failed to update reservation status.' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return (
    <AppContext.Provider value={{
      currentTab,
      setCurrentTab,
      slots,
      setSlots,
      activities,
      registeredVehicles,
      notifications,
      searchQuery,
      setSearchQuery,
      inspectItem,
      setInspectItem,
      selectedSlotId,
      setSelectedSlotId,
      soundEnabled,
      setSoundEnabled,
      pipelineMode,
      setPipelineMode,
      settings,
      setSettings,
      recentDetections,
      metrics,
      checkInVehicle,
      checkOutVehicle,
      toggleSlot,
      triggerSlotDetectionPending,
      resolvePendingSlot,
      registerVehicle,
      addRegisteredVehicle,
      updateRegisteredVehicle,
      toggleRegistrationStatus,
      deleteRegisteredVehicle,
      markNotificationAsRead,
      clearAllNotifications,
      calculateFeeBackend,
      generatePdfReceiptBackend,
      searchVehiclesBackend,
      gateStats,
      setGateStats,
      activeGateFilter,
      setActiveGateFilter,
      GATES_DEF,
      // Database Context Additions
      isDbConnected,
      dbStatus,
      lastSavedNotice,
      resetDatabaseToDefaults,
      // Slot Inventory Management Additions
      createParkingSlot,
      editParkingSlot,
      toggleParkingSlotStatus,
      deleteParkingSlot,
      getNextSlotId: dbApiGetNextSlotId,
      // VIP & Emergency Reservations Additions
      vipReservations,
      setVipReservations,
      userRole,
      setUserRole,
      createVipReservation,
      releaseVipReservation,
      updateVipReservationStatus
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
