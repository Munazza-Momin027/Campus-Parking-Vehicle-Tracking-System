import React, { createContext, useContext, useState, useMemo } from 'react';
import { INITIAL_SLOTS, INITIAL_ACTIVITY, REGISTERED_DATABASE, INITIAL_NOTIFICATIONS, GATES_DEF, INITIAL_GATE_STATS } from '../data/initialData';
import { playSound } from '../utils/audio';
import { calculateDurationAndFee } from '../utils/tariff';
import { calculateFeeBackend, generatePdfReceiptBackend, searchVehiclesBackend } from '../services/backendApi';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [slots, setSlots] = useState(INITIAL_SLOTS);
  const [activities, setActivities] = useState(INITIAL_ACTIVITY);
  const [registeredVehicles, setRegisteredVehicles] = useState(REGISTERED_DATABASE);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectItem, setInspectItem] = useState(null); // { type: 'slot' | 'vehicle', data: ... }
  const [selectedSlotId, setSelectedSlotId] = useState(null); // Active slot selected by operator
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pipelineMode, setPipelineMode] = useState('SIMULATION'); // 'SIMULATION' (Demo) vs 'LIVE_AI' (OpenCV+YOLO)

  // 3 Dedicated Category Gates State
  const [gateStats, setGateStats] = useState(INITIAL_GATE_STATS);
  const [activeGateFilter, setActiveGateFilter] = useState('all'); // 'all' | 'Student' | 'Staff' | 'Visitor'

  // Settings
  const [settings, setSettings] = useState({
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
  });

  // Recent detections matching screenshot:
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

  // Dynamic Metrics
  const metrics = useMemo(() => {
    const totalSlots = slots.length;
    const pending = slots.filter(s => s.status === 'Detection Pending' || s.isPending).length;
    const occupied = slots.filter(s => s.occupied && !s.isPending).length;
    const available = totalSlots - occupied - pending;
    const twoWheelersTotal = slots.filter(s => s.zone === 'two-wheeler').length;
    const twoWheelersOccupied = slots.filter(s => s.zone === 'two-wheeler' && s.occupied).length;
    const fourWheelersTotal = slots.filter(s => s.zone === 'four-wheeler').length;
    const fourWheelersOccupied = slots.filter(s => s.zone === 'four-wheeler' && s.occupied).length;

    const totalVehiclesCount = 12 + (activities.length - INITIAL_ACTIVITY.length);
    const totalExitedCount = 4 + (activities.filter(a => a.status === 'Exited').length - 2);
    const totalCollection = 320 + activities.reduce((sum, a) => sum + (a.status === 'Exited' && a.id > 5 ? (a.fee || 0) : 0), 0);

    return {
      totalSlots,
      occupied,
      available,
      pending,
      freePercent: Math.round((available / totalSlots) * 100),
      twoWheelersTotal,
      twoWheelersOccupied,
      fourWheelersTotal,
      fourWheelersOccupied,
      todayVehicles: totalVehiclesCount,
      todayEntries: 8 + (activities.length - INITIAL_ACTIVITY.length),
      todayExits: totalExitedCount,
      todayCollection: totalCollection
    };
  }, [slots, activities]);

  // Actions: Automatic Vehicle Check-In Workflow with 3-Gate Category Verification
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
    const resolvedIdRef = registered?.idRef || (registered ? `REG-${registered.category.toUpperCase()}` : null);

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

      setNotifications(prev => [
        {
          id: `notif-${Date.now()}`,
          title: '⚠ WRONG GATE SECURITY ALERT',
          message: `${cleanPlate} arrived at Gate ${attemptedNum} (${attemptedGate} Gate) but belongs to ${resolvedCategory}. Entry barrier remains CLOSED.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
          type: 'warning',
          read: false
        },
        ...prev
      ]);

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

    // Phase 14 Validation Guard: Duplicate-Entry Prevention (Vehicle Already Parked)
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

    // Step 6 & 7: Find Available Slot & Assign Slot (Parking Full Guard)
    let targetSlot = slotId;
    if (!targetSlot) {
      const zoneType = resolvedType === 'Four-Wheeler' ? 'four-wheeler' : 'two-wheeler';
      const availableSlot = slots.find(s => s.zone === zoneType && !s.occupied && !s.isPending);
      if (!availableSlot) {
        playSound('alert', soundEnabled);
        return {
          success: false,
          error: 'Parking Full',
          message: `Parking Full: All ${resolvedType} bays in ${zoneType === 'four-wheeler' ? 'Zone F' : 'Zone T'} are occupied!`,
          zone: zoneType
        };
      }
      targetSlot = availableSlot.id;
    }

    const now = new Date();
    const timeStr = customEntryTime || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    // Step 8: Update Slots & Create Parking Record
    setSlots(prev => prev.map(s => {
      if (s.id === targetSlot) {
        return {
          ...s,
          occupied: true,
          isPending: false,
          status: 'Occupied',
          vehicleNumber: cleanPlate,
          type: resolvedType,
          driver: resolvedDriver,
          category: resolvedCategory,
          entryTime: timeStr,
          gate: `${resolvedCategory} Gate`
        };
      }
      return s;
    }));

    // Create Immutable Parking Activity Record
    const newAct = {
      id: Date.now(),
      vehicleNumber: cleanPlate,
      type: resolvedType,
      category: resolvedCategory,
      slot: targetSlot,
      gate: `${resolvedCategory} Gate`,
      entryTime: timeStr,
      exitTime: '—',
      status: 'Parked',
      driver: resolvedDriver,
      duration: 'Just Now',
      fee: 0,
      isAutoCheckIn: true,
      registeredTag: registered ? registered.rfidTag : 'UNREGISTERED',
      photo: resolvedType === 'Four-Wheeler' ? '/camera_1_feed.png' : '/camera_2_feed.png',
      thumb: resolvedType === 'Four-Wheeler' ? '/thumb_car.png' : '/thumb_bike.png'
    };
    setActivities(prev => [newAct, ...prev]);

    // Update Gate Statistics for the dedicated category gate
    setGateStats(prev => {
      const current = prev[resolvedCategory] || prev.Student;
      return {
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
    });

    // Step 9: Update Dashboard Telemetry & Recent Detections
    setRecentDetections(prev => ({
      ...prev,
      checkIn: {
        plate: cleanPlate,
        type: resolvedType,
        category: registered ? `${resolvedCategory} (From Database)` : `${resolvedCategory} (Visitor)`,
        time: timeStr,
        slotAssigned: targetSlot,
        gate: `${resolvedCategory} Gate`,
        status: 'Vehicle Parked Successfully',
        thumb: resolvedType === 'Four-Wheeler' ? '/thumb_car.png' : '/thumb_bike.png',
        fullImage: resolvedType === 'Four-Wheeler' ? '/camera_1_feed.png' : '/camera_2_feed.png'
      }
    }));

    // Add Audit Notification
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: '✓ AUTO CHECK-IN COMPLETED',
        message: `${cleanPlate} (${resolvedType} • ${resolvedCategory}) verified at ${resolvedCategory} Gate. Slot ${targetSlot} assigned. Barrier OPENED.`,
        time: timeStr,
        type: 'success',
        read: false
      },
      ...prev
    ]);

    playSound('success', soundEnabled);

    return {
      success: true,
      slotAssigned: targetSlot,
      vehicleNumber: cleanPlate,
      type: resolvedType,
      category: resolvedCategory,
      gate: `${resolvedCategory} Gate`,
      driver: resolvedDriver,
      entryTime: timeStr,
      isRegistered: Boolean(registered),
      registeredDetails: registered || null,
      status: '✓ AUTO CHECK-IN'
    };
  };

  const checkOutVehicle = ({ vehicleNumber, slotId, fee, duration, exitTime: customExitTime, gate }) => {
    const now = new Date();
    const timeStr = customExitTime || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    // Target slot & active record resolution
    const targetSlot = slots.find(s => s.vehicleNumber === vehicleNumber || (slotId && s.id === slotId));
    const targetActivity = activities.find(a => a.vehicleNumber === vehicleNumber && a.status === 'Parked');

    // Phase 14 Validation Guard: Active Parking Record Not Found
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
    const driver = targetSlot?.driver || targetActivity?.driver || 'Campus Driver';

    // 🚪 3-GATE AUTOMATION LOGIC: Verify Exit Gate Category
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

    // Phase 14 Validation Guard: Valid Exit-Time Validation ("Exit time cannot be earlier than entry time.")
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

    // Calculate elapsed duration and fee dynamically using institutional tariff rules
    const tariffResult = calculateDurationAndFee(entryTime, now, category, type);
    const resolvedDuration = duration || tariffResult.duration;
    const resolvedFee = fee !== undefined ? fee : tariffResult.totalAmount;
    const resolvedFreeHours = tariffResult.freeHours;
    const resolvedChargedHours = tariffResult.chargedHours;
    const resolvedRate = tariffResult.rate;
    const resolvedFormula = tariffResult.calculationFormula;

    const resolvedPlate = vehicleNumber || targetSlot?.vehicleNumber || targetActivity?.vehicleNumber;

    // Free slot -> Mark Available and clear vehicle details
    setSlots(prev => prev.map(s => {
      if ((resolvedPlate && s.vehicleNumber === resolvedPlate) || (resolvedSlotId && resolvedSlotId !== 'N/A' && s.id === resolvedSlotId)) {
        return {
          ...s,
          occupied: false,
          isPending: false,
          status: 'Available',
          vehicleNumber: null,
          driver: null,
          category: null,
          entryTime: null,
          gate: null
        };
      }
      return s;
    }));

    // Mark Activity Record as Exited with exit timestamp, duration and fee
    setActivities(prev => prev.map(a => {
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
    }));

    // Update Gate Statistics for the dedicated category gate
    setGateStats(prev => {
      const current = prev[category] || prev.Student;
      return {
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
    });

    // Update Recent Detection CheckOut
    setRecentDetections(prev => ({
      ...prev,
      checkOut: {
        plate: vehicleNumber,
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

    // Add Notification
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: '✓ AUTO CHECK-OUT COMPLETED',
        message: `${vehicleNumber} (${type} • ${category}) checked out from Slot ${resolvedSlotId}. Slot is now AVAILABLE. Duration: ${resolvedDuration}, Fee: ₹${resolvedFee}.`,
        time: timeStr,
        type: 'info',
        read: false
      },
      ...prev
    ]);

    playSound('success', soundEnabled);

    return {
      success: true,
      vehicleNumber,
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

    // Update slot to Detection Pending (Yellow state)
    setSlots(prev => prev.map(s => {
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
    }));

    // Backing parking record with status 'Pending'
    const pendingAct = {
      id: Date.now(),
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
    setActivities(prev => [pendingAct, ...prev.filter(a => a.slot !== slotId || a.status !== 'Pending')]);

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: '🟡 DETECTION PENDING',
        message: `Optical sensor tripped at Slot ${slotId}. Computer vision classification active for ${pendingPlate}.`,
        time: timeStr,
        type: 'warning',
        read: false
      },
      ...prev
    ]);
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
      // Auto fill with test vehicle
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

  const addRegisteredVehicle = (newVeh) => {
    const id = newVeh.id || `REG-${Date.now().toString().slice(-4)}`;
    const fullVeh = {
      id,
      status: 'Active',
      ...newVeh,
      vehicleNumber: newVeh.vehicleNumber.trim().toUpperCase()
    };
    setRegisteredVehicles(prev => [fullVeh, ...prev]);
    playSound('success', soundEnabled);
    return fullVeh;
  };

  const updateRegisteredVehicle = (id, updatedFields) => {
    setRegisteredVehicles(prev => prev.map(v => {
      if (v.id === id) {
        return {
          ...v,
          ...updatedFields,
          vehicleNumber: (updatedFields.vehicleNumber || v.vehicleNumber).trim().toUpperCase()
        };
      }
      return v;
    }));
    playSound('success', soundEnabled);
  };

  const toggleRegistrationStatus = (id) => {
    setRegisteredVehicles(prev => prev.map(v => {
      if (v.id === id) {
        const nextStatus = v.status === 'Disabled' ? 'Active' : 'Disabled';
        return { ...v, status: nextStatus };
      }
      return v;
    }));
    playSound('beep', soundEnabled);
  };

  const deleteRegisteredVehicle = (id) => {
    setRegisteredVehicles(prev => prev.filter(v => v.id !== id));
    playSound('success', soundEnabled);
  };

  const registerVehicle = (newVeh) => {
    return addRegisteredVehicle(newVeh);
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
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
      GATES_DEF
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
