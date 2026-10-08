import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LogOut,
  Car,
  Bike,
  CheckCircle,
  Printer,
  Clock,
  QrCode,
  CreditCard,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  AlertCircle,
  Zap,
  Radio,
  Sparkles,
  ShieldCheck,
  ScanLine,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Layers,
  Activity,
  Eye,
  ParkingSquare,
  FileText,
  BadgeCheck
} from 'lucide-react';
import { playSound } from '../utils/audio';
import { calculateDurationAndFee } from '../utils/tariff';
import { calculateFeeBackend, generatePdfReceiptBackend } from '../services/backendApi';
import ModalReceipt from '../components/ModalReceipt';

export default function CheckOutView() {
  const {
    slots,
    activities,
    checkOutVehicle,
    soundEnabled,
    setCurrentTab,
    pipelineMode,
    settings
  } = useApp();

  // Find all currently parked vehicles from active slots
  const parkedVehicles = slots.filter(s => s.occupied);

  // Modal receipt visibility state
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // 🚪 3-Gate Dedicated Exit System State ('Student' | 'Staff' | 'Visitor')
  const [selectedExitGate, setSelectedExitGate] = useState('Student');
  const [manualExitGate, setManualExitGate] = useState('Student');

  // Gate Definition Lookup for Dedicated Exit
  const EXIT_GATES = [
    {
      id: 'Student',
      gateNumber: 1,
      name: 'Gate 1 — Student Gate Exit',
      camId: 'cam_student_exit',
      color: '#3A86FF',
      badgeBg: 'rgba(58, 134, 255, 0.15)',
      badgeBorder: 'rgba(58, 134, 255, 0.4)',
      category: 'Student',
      feedImage: '/camera_2_feed.png',
      desc: 'Dedicated Student vehicle exit with ANPR license verification & pass clearance'
    },
    {
      id: 'Staff',
      gateNumber: 2,
      name: 'Gate 2 — Staff Gate Exit',
      camId: 'cam_staff_exit',
      color: '#8B5CF6',
      badgeBg: 'rgba(139, 92, 246, 0.15)',
      badgeBorder: 'rgba(139, 92, 246, 0.4)',
      category: 'Staff',
      feedImage: '/camera_2_feed.png',
      desc: 'Dedicated Faculty & Staff exit with automated institutional pass release'
    },
    {
      id: 'Visitor',
      gateNumber: 3,
      name: 'Gate 3 — Visitor Gate Exit',
      camId: 'cam_visitor_exit',
      color: '#10B981',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      badgeBorder: 'rgba(16, 185, 129, 0.4)',
      category: 'Visitor',
      feedImage: '/camera_2_feed.png',
      desc: 'Visitor & Guest exit with tariff audit, payment settlement & receipt generation'
    }
  ];

  const currentExitGateConfig = EXIT_GATES.find(g => g.id === selectedExitGate) || EXIT_GATES[0];

  // Active Autonomous Exit State with Codethon Fee Calculation Fields
  const [activeWorkflow, setActiveWorkflow] = useState({
    plate: 'KA-22-XY-9876',
    vehicleType: 'Four-Wheeler',
    category: 'Student',
    driver: 'Rahul Verma',
    department: 'Computer Science (4th Year)',
    slotReleased: 'F-02',
    entryTime: '10:24 AM',
    exitTime: '12:45 PM',
    duration: '2 Hours 21m',
    totalHours: 3,
    freeHours: 2,
    chargedHours: 1,
    rate: 20,
    fee: 20,
    totalAmount: 20,
    tariffBreakdown: 'Student: First 2h Free + 1h @ ₹20/hr = ₹20',
    calculationFormula: 'Student: First 2h Free + 1h @ ₹20/hr = ₹20',
    receiptId: 'RCPT-8821-EXP',
    confidence: '99.2%',
    status: '✓ AUTO CHECK-OUT',
    barrierStatus: `EXIT BARRIER OPENED (${currentExitGateConfig.name.toUpperCase()})`,
    currentStepIndex: 8, // All 8 steps complete by default
    isProcessing: false,
    slotVacant: true,
    thumb: '/thumb_car.png'
  });

  // Secondary Manual Fallback Drawer State (Collapsed by default)
  const [showManualOverride, setShowManualOverride] = useState(false);
  const [manualPlate, setManualPlate] = useState('');
  const [manualPaymentMethod, setManualPaymentMethod] = useState('UPI');
  const [manualExitTime, setManualExitTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }));
  const [lastCheckOutError, setLastCheckOutError] = useState(null); // { error: string, message: string }

  // The 8 Sequential Steps of Automatic Exit Processing (As specified)
  const PIPELINE_STEPS = [
    { num: 1, title: 'Vehicle Detection', desc: 'Exit Camera Sensor Tripwire' },
    { num: 2, title: 'Number Plate Recognition', desc: 'ANPR Optical Scanning' },
    { num: 3, title: 'Find Active Parking Record', desc: 'Query Occupied Bay & Ingress Data' },
    { num: 4, title: 'Capture Exit Time', desc: 'High-Precision Exit Timestamp' },
    { num: 5, title: 'Calculate Duration', desc: 'Elapsed Duration Calculation' },
    { num: 6, title: 'Calculate Fee', desc: 'Tariff / Exemption Computation' },
    { num: 7, title: 'Generate Receipt', desc: 'Digital Settlement & QR Code' },
    { num: 8, title: 'Release Parking Slot', desc: 'Mark Slot as AVAILABLE (Vacant)' }
  ];

  // Helper to parse clock time to minutes
  const parseClockMinutes = (tStr) => {
    const m = String(tStr).match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!m) return null;
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const ap = (m[3] || '').toUpperCase();
    if (ap === 'PM' && h < 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    return h * 60 + min;
  };

  // Primary Autonomous Exit Processing Execution Engine
  const triggerAutomatedCheckOut = async (slot, customExitTime) => {
    playSound('beep', soundEnabled);
    setLastCheckOutError(null);

    // PHASE 14 Validation Guard: Active Parking Record Not Found
    const activeSlot = slots.find(s => s.occupied && s.vehicleNumber === slot.vehicleNumber);
    if ((!activeSlot && slot.isNotFoundTest) || (!activeSlot && !slot.id)) {
      playSound('alert', soundEnabled);
      const err = {
        error: 'Active Parking Record Not Found',
        message: `Active Parking Record Not Found: Vehicle ${slot.vehicleNumber} is not currently parked in any campus bay.`
      };
      setLastCheckOutError(err);
      setActiveWorkflow(prev => ({
        ...prev,
        plate: slot.vehicleNumber,
        status: '⚠️ ACTIVE PARKING RECORD NOT FOUND',
        barrierStatus: 'EXIT BARRIER CLOSED (DENIED)',
        isProcessing: false
      }));
      return;
    }

    const now = new Date();
    const entryTime = slot.entryTime || activeSlot?.entryTime || '10:00 AM';
    const timeFormatted = customExitTime || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    // PHASE 14 Validation Guard: Valid Exit-Time Validation ("Exit time cannot be earlier than entry time.")
    const entM = parseClockMinutes(entryTime);
    const extM = parseClockMinutes(timeFormatted);
    if (entM !== null && extM !== null && extM < entM) {
      playSound('alert', soundEnabled);
      const err = {
        error: 'Invalid Exit Time',
        message: 'Exit time cannot be earlier than entry time.'
      };
      setLastCheckOutError(err);
      setActiveWorkflow(prev => ({
        ...prev,
        plate: slot.vehicleNumber,
        entryTime: entryTime,
        exitTime: timeFormatted,
        status: '❌ INVALID EXIT TIME',
        barrierStatus: 'EXIT BARRIER CLOSED (DENIED)',
        isProcessing: false
      }));
      return;
    }

    const isFour = (slot.zone || activeSlot?.zone) === 'four-wheeler';
    const vehType = isFour ? 'Four-Wheeler' : 'Two-Wheeler';

    // Step 5 & 6: Compute authoritative fee from backend API engine
    const feeData = await calculateFeeBackend({
      vehicleType: vehType,
      category: slot.category || activeSlot?.category || 'Visitor',
      entryTime: entryTime,
      exitTime: timeFormatted
    });

    if (feeData.error === 'Invalid Exit Time' || (feeData.message && feeData.message.includes('earlier than entry time'))) {
      playSound('alert', soundEnabled);
      setLastCheckOutError({
        error: 'Invalid Exit Time',
        message: feeData.message || 'Exit time cannot be earlier than entry time.'
      });
      setActiveWorkflow(prev => ({
        ...prev,
        plate: slot.vehicleNumber,
        status: '❌ INVALID EXIT TIME',
        barrierStatus: 'EXIT BARRIER CLOSED (DENIED)',
        isProcessing: false
      }));
      return;
    }

    const recId = `RCPT-${Math.floor(1000 + Math.random() * 9000)}-EXP`;

    // Initiate Step Progression
    setActiveWorkflow({
      plate: slot.vehicleNumber,
      vehicleType: vehType,
      category: slot.category || activeSlot?.category || 'Visitor',
      driver: slot.driver || activeSlot?.driver || 'Campus Driver',
      department: (slot.category || activeSlot?.category) === 'Student' ? 'Undergraduate Student' : (slot.category || activeSlot?.category) === 'Staff' ? 'Campus Faculty' : 'Guest Visitor',
      slotReleased: slot.id || activeSlot?.id || 'F-02',
      entryTime: feeData.entryTime,
      exitTime: feeData.exitTime,
      duration: feeData.duration,
      totalHours: feeData.totalHours,
      freeHours: feeData.freeHours,
      chargedHours: feeData.chargedHours,
      rate: feeData.rate,
      fee: feeData.totalAmount,
      totalAmount: feeData.totalAmount,
      tariffBreakdown: feeData.calculationFormula,
      calculationFormula: feeData.calculationFormula,
      receiptId: recId,
      confidence: `${(98.6 + Math.random() * 1.2).toFixed(1)}%`,
      status: 'PROCESSING AUTOMATED EXIT...',
      barrierStatus: 'WAITING CLEARANCE...',
      currentStepIndex: 1,
      isProcessing: true,
      slotVacant: false,
      thumb: isFour ? '/thumb_car.png' : '/thumb_bike.png'
    });

    // Step 2 & 3: Plate Recognition & Find Record (150ms)
    setTimeout(() => {
      setActiveWorkflow(prev => ({ ...prev, currentStepIndex: 3 }));
    }, 150);

    // Step 4 & 5: Capture Exit Time & Calculate Duration (350ms)
    setTimeout(() => {
      setActiveWorkflow(prev => ({ ...prev, currentStepIndex: 5 }));
    }, 350);

    // Step 6 & 7: Calculate Fee & Generate Receipt (600ms)
    setTimeout(() => {
      setActiveWorkflow(prev => ({ ...prev, currentStepIndex: 7 }));
    }, 600);

    // Step 8: Release Parking Slot & Mark as AVAILABLE (850ms)
    setTimeout(() => {
      const targetSlotId = slot.id || activeSlot?.id;
      const res = checkOutVehicle({
        vehicleNumber: slot.vehicleNumber,
        slotId: targetSlotId,
        fee: feeData.totalAmount,
        duration: feeData.duration,
        exitTime: timeFormatted,
        gate: selectedExitGate
      });

      if (!res.success) {
        playSound('alert', soundEnabled);
        setLastCheckOutError(res);
        const isWrongGate = res.error === 'Wrong Gate';
        setActiveWorkflow(prev => ({
          ...prev,
          plate: slot.vehicleNumber,
          status: isWrongGate ? '⚠️ WRONG GATE EXIT DENIED' : `❌ ${res.error.toUpperCase()}`,
          barrierStatus: isWrongGate
            ? '⚠ WRONG GATE — Gate Barrier Closed (Access Denied / Redirect to appropriate gate)'
            : 'EXIT BARRIER CLOSED (DENIED)',
          isProcessing: false
        }));
        return;
      }

      setLastCheckOutError(null);
      playSound('success', soundEnabled);

      setActiveWorkflow({
        plate: slot.vehicleNumber,
        vehicleType: vehType,
        category: slot.category || activeSlot?.category || 'Visitor',
        driver: slot.driver || activeSlot?.driver || 'Campus Driver',
        department: (slot.category || activeSlot?.category) === 'Student' ? 'Undergraduate Student' : (slot.category || activeSlot?.category) === 'Staff' ? 'Campus Faculty' : 'Guest Visitor',
        slotReleased: targetSlotId,
        entryTime: feeData.entryTime,
        exitTime: feeData.exitTime,
        duration: feeData.duration,
        totalHours: feeData.totalHours,
        freeHours: feeData.freeHours,
        chargedHours: feeData.chargedHours,
        rate: feeData.rate,
        fee: feeData.totalAmount,
        totalAmount: feeData.totalAmount,
        tariffBreakdown: feeData.calculationFormula,
        calculationFormula: feeData.calculationFormula,
        receiptId: recId,
        confidence: `${(98.8 + Math.random() * 1.1).toFixed(1)}%`,
        status: '✓ AUTO CHECK-OUT',
        barrierStatus: 'EXIT BARRIER 2 OPENED',
        currentStepIndex: 8,
        isProcessing: false,
        slotVacant: true, // Marked AVAILABLE
        thumb: isFour ? '/thumb_car.png' : '/thumb_bike.png'
      });
    }, 850);
  };

  const handleDirectPdfDownload = async () => {
    try {
      setDownloadingPdf(true);
      playSound('beep', soundEnabled);
      const blob = await generatePdfReceiptBackend(activeWorkflow);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CPVTS_Receipt_${activeWorkflow.plate}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleNewTransaction = () => {
    playSound('beep', soundEnabled);
    setActiveWorkflow(prev => ({
      ...prev,
      plate: 'KA-22-READY',
      status: 'SENSOR ARMED & READY',
      barrierStatus: 'GATE BARRIER CLOSED',
      currentStepIndex: 0,
      slotVacant: true,
      isProcessing: false
    }));
  };

  // Secondary Manual Override Fallback Handler
  const handleManualCheckOut = (e) => {
    e.preventDefault();
    const cleanPlate = manualPlate.trim().toUpperCase();
    if (!cleanPlate) return;

    setLastCheckOutError(null);

    // PHASE 14: Check if vehicle is active in slots
    const matched = slots.find(s => s.vehicleNumber === cleanPlate && s.occupied);
    if (!matched) {
      playSound('alert', soundEnabled);
      const err = {
        error: 'Active Parking Record Not Found',
        message: `Active Parking Record Not Found: Vehicle ${cleanPlate} is not currently parked in any campus bay.`
      };
      setLastCheckOutError(err);
      setActiveWorkflow(prev => ({
        ...prev,
        plate: cleanPlate,
        status: '⚠️ ACTIVE PARKING RECORD NOT FOUND',
        barrierStatus: 'EXIT BARRIER CLOSED (DENIED)',
        isProcessing: false
      }));
      return;
    }

    const entryTime = matched.entryTime || '10:00 AM';
    const exitTime = manualExitTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    // PHASE 14: Validate exit time cannot be earlier than entry time
    const entM = parseClockMinutes(entryTime);
    const extM = parseClockMinutes(exitTime);
    if (entM !== null && extM !== null && extM < entM) {
      playSound('alert', soundEnabled);
      const err = {
        error: 'Invalid Exit Time',
        message: 'Exit time cannot be earlier than entry time.'
      };
      setLastCheckOutError(err);
      setActiveWorkflow(prev => ({
        ...prev,
        plate: cleanPlate,
        status: '❌ INVALID EXIT TIME',
        barrierStatus: 'EXIT BARRIER CLOSED (DENIED)',
        isProcessing: false
      }));
      return;
    }

    const isVisitor = matched?.category === 'Visitor';
    const fee = isVisitor ? 40 : 0;
    const durationStr = '1 Hour 45m';

    const res = checkOutVehicle({
      vehicleNumber: cleanPlate,
      slotId: matched.id,
      fee,
      duration: durationStr,
      exitTime: exitTime,
      gate: manualExitGate || selectedExitGate
    });

    if (!res.success) {
      playSound('alert', soundEnabled);
      setLastCheckOutError(res);
      const isWrongGate = res.error === 'Wrong Gate';
      setActiveWorkflow(prev => ({
        ...prev,
        plate: cleanPlate,
        status: isWrongGate ? '⚠️ WRONG GATE EXIT DENIED' : `❌ ${res.error.toUpperCase()}`,
        barrierStatus: isWrongGate
          ? '⚠ WRONG GATE — Gate Barrier Closed (Access Denied / Redirect to appropriate gate)'
          : 'EXIT BARRIER CLOSED (DENIED)',
        isProcessing: false
      }));
      return;
    }

    setLastCheckOutError(null);
    playSound('success', soundEnabled);

    setActiveWorkflow({
      plate: cleanPlate,
      vehicleType: matched.zone === 'four-wheeler' ? 'Four-Wheeler' : 'Two-Wheeler',
      category: matched.category || 'Visitor',
      driver: matched.driver || 'Manual Override Driver',
      department: 'Manual Security Clearance',
      slotReleased: matched.id,
      entryTime: entryTime,
      exitTime: exitTime,
      duration: durationStr,
      totalHours: 2,
      freeHours: isVisitor ? 0 : 2,
      chargedHours: isVisitor ? 2 : 0,
      rate: isVisitor ? 20 : 0,
      fee,
      totalAmount: fee,
      tariffBreakdown: isVisitor ? 'Manual Settlement (₹40)' : 'Manual Pass Clearance (₹0)',
      calculationFormula: isVisitor ? 'Manual Settlement (₹40)' : 'Manual Pass Clearance (₹0)',
      receiptId: `MAN-${Date.now().toString().slice(-4)}`,
      confidence: 'Manual Override (100%)',
      status: '✓ MANUAL CHECK-OUT',
      barrierStatus: 'EXIT BARRIER 2 OPENED',
      currentStepIndex: 8,
      isProcessing: false,
      slotVacant: true,
      thumb: matched.zone === 'four-wheeler' ? '/thumb_car.png' : '/thumb_bike.png'
    });

    setManualPlate('');
    setShowManualOverride(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '35px' }}>
      
      {/* 1. Header & Live Autonomous Egress Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
              Automatic Vehicle Exit & Settlement Terminal
            </h1>
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(58, 134, 255, 0.15)',
              color: 'var(--blue-hover)',
              padding: '3px 9px',
              borderRadius: '6px',
              border: '1px solid rgba(58, 134, 255, 0.4)',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--blue-hover)',
                boxShadow: '0 0 6px var(--blue-hover)'
              }} />
              100% AUTONOMOUS EGRESS
            </span>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Exit camera ANPR scans number plate, retrieves active parking record, calculates stay duration & institutional fee, generates receipt, and releases slot to AVAILABLE
          </p>
        </div>

        {/* Live System Status Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            padding: '5px 12px',
            borderRadius: '8px',
            background: currentExitGateConfig.badgeBg,
            color: currentExitGateConfig.color,
            border: `1px solid ${currentExitGateConfig.badgeBorder}`,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: currentExitGateConfig.color,
              boxShadow: `0 0 6px ${currentExitGateConfig.color}`
            }} />
            {currentExitGateConfig.name.toUpperCase()} ARMED
          </div>

          <div style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            padding: '5px 12px',
            borderRadius: '8px',
            background: 'rgba(245, 158, 11, 0.12)',
            color: 'var(--orange-bright)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Radio size={12} className="animate-pulse" />
            SIMULATION MODE
          </div>
        </div>
      </div>

      {/* 🚪 3-GATE DEDICATED EGRESS SELECTOR BAR */}
      <div className="glass-panel" style={{
        padding: '12px 18px',
        background: 'rgba(6, 11, 24, 0.85)',
        border: '1px solid rgba(0, 240, 255, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: currentExitGateConfig.badgeBg,
            border: `1px solid ${currentExitGateConfig.badgeBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={16} color={currentExitGateConfig.color} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
                Active Exit Monitoring Gate:
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '4px',
                background: currentExitGateConfig.badgeBg,
                color: currentExitGateConfig.color,
                border: `1px solid ${currentExitGateConfig.badgeBorder}`,
                fontFamily: 'var(--font-mono)'
              }}>
                {currentExitGateConfig.name} ({currentExitGateConfig.camId})
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {currentExitGateConfig.desc}
            </div>
          </div>
        </div>

        {/* 3 Interactive Exit Gate Selection Pills */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {EXIT_GATES.map((gate) => {
            const isSel = selectedExitGate === gate.id;
            return (
              <button
                key={gate.id}
                type="button"
                onClick={() => {
                  playSound('beep', soundEnabled);
                  setSelectedExitGate(gate.id);
                  setManualExitGate(gate.id);
                  setLastCheckOutError(null);
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isSel ? `1.5px solid ${gate.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isSel ? gate.badgeBg : 'rgba(255, 255, 255, 0.03)',
                  color: isSel ? '#FFFFFF' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  boxShadow: isSel ? `0 0 12px ${gate.badgeBg}` : 'none'
                }}
              >
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: gate.color,
                  boxShadow: isSel ? `0 0 8px ${gate.color}` : 'none'
                }} />
                <span>{gate.name}</span>
                <span style={{
                  fontSize: '9px',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  background: isSel ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  Gate {gate.gateNumber}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PHASE 14: Exit Error Notification Banner (Active Parking Record Not Found / Invalid Exit Time) */}
      {lastCheckOutError && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '10px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1.5px solid rgba(239, 68, 68, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          boxShadow: '0 0 20px rgba(239, 68, 68, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={22} color="var(--red-bright)" />
            <div>
              <div style={{ color: '#FFFFFF', fontWeight: 900, fontSize: '14.5px', fontFamily: 'var(--font-heading)' }}>
                {lastCheckOutError.error === 'Active Parking Record Not Found'
                  ? '⚠️ Active Parking Record Not Found'
                  : lastCheckOutError.error === 'Invalid Exit Time'
                  ? '❌ Invalid Exit Time'
                  : lastCheckOutError.error}
              </div>
              <div style={{ color: '#FECACA', fontSize: '12px', marginTop: '2px' }}>
                {lastCheckOutError.message}
              </div>
            </div>
          </div>
          <button
            onClick={() => setLastCheckOutError(null)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Visual 8-Step Automatic Exit Processing Pipeline Stepper (As requested) */}
      <div className="glass-panel" style={{
        padding: '16px 20px',
        border: '1px solid var(--border-neon-cyan)',
        background: 'rgba(8, 14, 28, 0.85)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={16} color="var(--cyan-primary)" />
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.04em' }}>
              8-STAGE AUTOMATIC EXIT PROCESSING WORKFLOW
            </span>
          </div>

          <span style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: activeWorkflow.isProcessing ? 'var(--orange-bright)' : 'var(--green-bright)',
            fontWeight: 700
          }}>
            {activeWorkflow.isProcessing
              ? `RUNNING STEP ${activeWorkflow.currentStepIndex} OF 8...`
              : 'STATE: 8/8 COMPLETE • SLOT RELEASED & AVAILABLE'}
          </span>
        </div>

        {/* 8-Step Horizontal Indicator Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: '8px',
          position: 'relative'
        }}>
          {PIPELINE_STEPS.map((step) => {
            const isCompleted = activeWorkflow.currentStepIndex >= step.num;
            const isCurrent = activeWorkflow.currentStepIndex === step.num && activeWorkflow.isProcessing;

            return (
              <div
                key={step.num}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  padding: '9px 6px',
                  borderRadius: '8px',
                  background: isCurrent
                    ? 'rgba(0, 240, 255, 0.16)'
                    : isCompleted
                      ? 'rgba(16, 185, 129, 0.1)'
                      : 'rgba(255, 255, 255, 0.02)',
                  border: isCurrent
                    ? '1px solid var(--border-neon-cyan)'
                    : isCompleted
                      ? '1px solid rgba(16, 185, 129, 0.4)'
                      : '1px solid rgba(255, 255, 255, 0.05)',
                  transition: 'all 0.25s ease',
                  textAlign: 'center'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: isCurrent
                      ? 'var(--cyan-primary)'
                      : isCompleted
                        ? 'var(--green-avail)'
                        : 'rgba(255, 255, 255, 0.1)',
                    color: isCurrent || isCompleted ? '#050811' : 'var(--text-dim)',
                    fontSize: '10.5px',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {isCompleted && !isCurrent ? <CheckCircle2 size={13} strokeWidth={3} /> : step.num}
                  </div>
                </div>

                <div style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: isCurrent ? 'var(--cyan-primary)' : isCompleted ? '#FFFFFF' : 'var(--text-dim)',
                  lineHeight: '1.2'
                }}>
                  {step.title}
                </div>

                <div style={{
                  fontSize: '8.5px',
                  color: isCompleted ? 'var(--text-muted)' : 'var(--text-dim)',
                  lineHeight: '1.1'
                }}>
                  {step.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Main Workspace: Camera Viewport + Required Output Telemetry Card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: '20px', alignItems: 'start' }}>
        
        {/* Left Column: Camera 2 Exit Gate Stream & Live Egress Triggers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Camera 2 Viewport Card */}
          <div className="glass-panel" style={{ padding: '16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={16} color="var(--cyan-primary)" />
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
                  {currentExitGateConfig.name} — Camera ({currentExitGateConfig.camId})
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="live-indicator">LIVE</span>
                <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--green-bright)' }}>
                  30 FPS • 1080P
                </span>
              </div>
            </div>

            {/* Video Screen Area */}
            <div style={{
              position: 'relative',
              borderRadius: '10px',
              overflow: 'hidden',
              height: '240px',
              background: '#040711',
              border: '1px solid rgba(0, 240, 255, 0.25)',
              boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.8)'
            }}>
              <img
                src="/camera_2_feed.png"
                alt="Exit Gate Feed"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'contrast(1.08) brightness(0.95)'
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/camera_placeholder.png';
                }}
              />

              {/* Laser Scan Line Overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent, #00F0FF, #3A86FF, transparent)',
                  boxShadow: '0 0 10px #00F0FF, 0 0 20px #3A86FF',
                  animation: 'laserScan 3.2s linear infinite'
                }}
              />

              {/* Optical Detection Reticle */}
              <div style={{
                position: 'absolute',
                top: '24%',
                left: '26%',
                width: '48%',
                height: '52%',
                border: '1.5px dashed var(--cyan-primary)',
                borderRadius: '8px',
                pointerEvents: 'none',
                boxShadow: '0 0 15px rgba(0, 240, 255, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '6px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '9px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--cyan-primary)',
                  fontWeight: 700
                }}>
                  <span>EXIT OPTICAL BEAM</span>
                  <span>CONF: {activeWorkflow.confidence}</span>
                </div>
                <div style={{
                  alignSelf: 'center',
                  background: 'rgba(5, 8, 17, 0.88)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-neon-cyan)',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 800,
                  color: '#FFFFFF'
                }}>
                  {activeWorkflow.plate}
                </div>
              </div>

              {/* Bottom HUD Bar */}
              <div style={{
                position: 'absolute',
                bottom: '8px',
                left: '8px',
                right: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(4, 7, 17, 0.82)',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--border-subtle)'
              }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  EXIT BARRIER SENSOR: <strong style={{ color: 'var(--green-bright)' }}>ARMED</strong>
                </span>
                <span style={{
                  color: activeWorkflow.barrierStatus.includes('WRONG GATE')
                    ? 'var(--red-bright)'
                    : activeWorkflow.barrierStatus.includes('OPENED')
                    ? 'var(--green-bright)'
                    : 'var(--orange-bright)',
                  fontWeight: 800
                }}>
                  {activeWorkflow.barrierStatus.includes('WRONG GATE')
                    ? '⚠ WRONG GATE (LOCKED)'
                    : activeWorkflow.barrierStatus.includes('OPENED')
                    ? `🟢 GATE ${currentExitGateConfig.gateNumber} OPENED`
                    : `🔴 GATE ${currentExitGateConfig.gateNumber} CLOSED`}
                </span>
              </div>
            </div>
          </div>

          {/* Instant Camera 2 Exit Egress Sensor Simulation Triggers */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Radio size={14} color="var(--blue-hover)" />
                  {currentExitGateConfig.name} Egress Triggers
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Click occupied vehicle to exit through {currentExitGateConfig.name}, or click Security Rejection test
                </p>
              </div>

              <span style={{
                fontSize: '10.5px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--cyan-primary)',
                background: 'rgba(0, 240, 255, 0.08)',
                padding: '3px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(0, 240, 255, 0.25)'
              }}>
                {parkedVehicles.length} Occupied Slots
              </span>
            </div>

            {/* Security Wrong Gate Test Banner */}
            <div style={{ marginBottom: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  // Find a vehicle belonging to another category
                  const mismatchVeh = parkedVehicles.find(s => s.category !== selectedExitGate) || {
                    vehicleNumber: selectedExitGate === 'Student' ? 'KA-22-MH-3311' : 'KA-22-XY-9876',
                    category: selectedExitGate === 'Student' ? 'Staff' : 'Student',
                    driver: 'Unauthorized Gate Exit',
                    id: 'F-02'
                  };
                  triggerAutomatedCheckOut(mismatchVeh);
                }}
                disabled={activeWorkflow.isProcessing}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.6)',
                  color: '#FECACA',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: activeWorkflow.isProcessing ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={15} color="var(--red-bright)" />
                  <span>⚠️ Test Wrong Gate Exit Rejection (Simulate Category Mismatch)</span>
                </div>
                <span style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(239, 68, 68, 0.3)',
                  color: '#FFFFFF'
                }}>
                  Security Test
                </span>
              </button>
            </div>

            {/* List of currently parked vehicles as live exit triggers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
              {parkedVehicles.length === 0 ? (
                <div style={{
                  padding: '24px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '8px',
                  border: '1px dashed var(--border-subtle)',
                  color: 'var(--text-dim)',
                  fontSize: '12px'
                }}>
                  <p>All parking slots are currently vacant!</p>
                  <p style={{ fontSize: '11px', marginTop: '6px', color: 'var(--text-muted)' }}>
                    Check in vehicles at the <button onClick={() => setCurrentTab('checkin')} style={{ color: 'var(--cyan-primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Vehicle Check-In Terminal</button> to test exit processing.
                  </p>
                </div>
              ) : (
                parkedVehicles.map((slot) => {
                  const isFour = slot.zone === 'four-wheeler';
                  const isVisitor = slot.category === 'Visitor';
                  const feeDesc = isVisitor ? 'Visitor Tariff' : 'Pass Waiver (₹0)';
                  const isSelected = activeWorkflow.plate === slot.vehicleNumber;

                  return (
                    <button
                      key={slot.id}
                      onClick={() => triggerAutomatedCheckOut(slot)}
                      disabled={activeWorkflow.isProcessing}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: isSelected
                          ? 'rgba(0, 240, 255, 0.12)'
                          : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected
                          ? '1px solid var(--border-neon-cyan)'
                          : '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: activeWorkflow.isProcessing ? 'not-allowed' : 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.18s ease'
                      }}
                      className="hover-bright"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: isFour ? 'rgba(0, 240, 255, 0.15)' : 'rgba(58, 134, 255, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isFour ? 'var(--cyan-primary)' : 'var(--blue-hover)'
                        }}>
                          {isFour ? <Car size={16} /> : <Bike size={16} />}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="plate-badge" style={{ fontSize: '12px' }}>
                              {slot.vehicleNumber}
                            </span>
                            <span className="slot-badge" style={{ fontSize: '10.5px' }}>
                              {slot.id}
                            </span>
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {slot.driver} • <span style={{ color: 'var(--cyan-primary)' }}>{slot.category}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: isVisitor ? 'var(--orange-bright)' : 'var(--green-bright)'
                        }}>
                          {feeDesc}
                        </div>
                        <div style={{ fontSize: '9.5px', color: 'var(--text-dim)', marginTop: '1px' }}>
                          Detect at Exit Gate →
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* PHASE 14: Fallback & Validation Scenarios (As specified by Phase 14 prompt) */}
            <div style={{ marginTop: '14px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={13} color="var(--orange-bright)" />
                <strong style={{ color: '#FFFFFF' }}>Phase 14 Fallback & Validation Tests:</strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => triggerAutomatedCheckOut({ vehicleNumber: 'KA-22-UN-9999', isNotFoundTest: true })}
                  className="btn-ghost hover-bright"
                  style={{
                    fontSize: '10.5px',
                    padding: '8px 10px',
                    color: 'var(--orange-bright)',
                    borderColor: 'rgba(245, 158, 11, 0.4)',
                    background: 'rgba(245, 158, 11, 0.08)',
                    textAlign: 'left'
                  }}
                  title="Simulate vehicle not found at exit (Active Parking Record Not Found)"
                >
                  <div style={{ fontWeight: 800 }}>⚠️ Record Not Found</div>
                  <div style={{ fontSize: '9.5px', color: 'var(--text-dim)', marginTop: '2px' }}>KA-22-UN-9999 (Unparked)</div>
                </button>
                <button
                  type="button"
                  onClick={() => triggerAutomatedCheckOut({
                    vehicleNumber: parkedVehicles[0]?.vehicleNumber || 'KA-22-XY-9876',
                    entryTime: '10:24 AM',
                    zone: 'four-wheeler'
                  }, '08:15 AM')}
                  className="btn-ghost hover-bright"
                  style={{
                    fontSize: '10.5px',
                    padding: '8px 10px',
                    color: 'var(--red-bright)',
                    borderColor: 'rgba(239, 68, 68, 0.4)',
                    background: 'rgba(239, 68, 68, 0.08)',
                    textAlign: 'left'
                  }}
                  title="Simulate exit time earlier than entry time (08:15 AM < 10:24 AM)"
                >
                  <div style={{ fontWeight: 800 }}>❌ Invalid Exit Time</div>
                  <div style={{ fontSize: '9.5px', color: 'var(--text-dim)', marginTop: '2px' }}>08:15 AM &lt; 10:24 AM</div>
                </button>
              </div>
            </div>

            {/* Test Simulation Preset (If campus is empty) */}
            {parkedVehicles.length === 0 && (
              <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Or simulate normal egress event:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    onClick={() => triggerAutomatedCheckOut({
                      vehicleNumber: 'KA-22-XY-9876',
                      zone: 'four-wheeler',
                      category: 'Student',
                      driver: 'Rahul Verma',
                      id: 'F-02',
                      entryTime: '10:24 AM'
                    })}
                    className="btn-ghost"
                    style={{ fontSize: '11px', padding: '8px' }}
                  >
                    <Car size={13} color="var(--cyan-primary)" /> KA-22-XY-9876 (Student Car)
                  </button>
                  <button
                    onClick={() => triggerAutomatedCheckOut({
                      vehicleNumber: 'KA-22-AB-1234',
                      zone: 'two-wheeler',
                      category: 'Staff',
                      driver: 'Dr. S. N. Patil',
                      id: 'T-05',
                      entryTime: '07:20 AM'
                    })}
                    className="btn-ghost"
                    style={{ fontSize: '11px', padding: '8px' }}
                  >
                    <Bike size={13} color="var(--blue-hover)" /> KA-22-AB-1234 (Staff Bike)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Required Output Telemetry & Digital Clearance Receipt */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Active Automatic Exit Processing Telemetry Slip */}
          <div className="glass-panel" style={{
            padding: '22px',
            border: '1px solid var(--border-neon-cyan)',
            boxShadow: '0 0 30px rgba(0, 240, 255, 0.12)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Header: Status Pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '12px'
            }}>
              <div>
                <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--cyan-primary)', letterSpacing: '0.08em' }}>
                  CPVTS AUTOMATIC EXIT PROCESSING TELEMETRY
                </span>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                  Exit Settlement & Clearance Slip
                </h3>
              </div>

              {/* Status Pill: ✓ AUTO CHECK-OUT */}
              <div style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1.5px solid var(--border-neon-green)',
                color: 'var(--green-bright)',
                fontWeight: 900,
                fontSize: '12.5px',
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 0 14px rgba(16, 185, 129, 0.35)'
              }}>
                <CheckCircle size={15} />
                {activeWorkflow.status}
              </div>
            </div>

            {/* Core Display Fields: Vehicle Number & Released Slot */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '10px',
                  background: 'rgba(0, 240, 255, 0.12)',
                  border: '1px solid var(--border-neon-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--cyan-primary)'
                }}>
                  {activeWorkflow.vehicleType === 'Four-Wheeler' ? <Car size={28} /> : <Bike size={28} />}
                </div>

                <div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                    Vehicle Number
                  </div>
                  <div className="plate-badge" style={{ fontSize: '18px', marginTop: '2px', letterSpacing: '0.06em' }}>
                    {activeWorkflow.plate}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                    {activeWorkflow.driver}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  Assigned Slot
                </div>
                <div className="slot-badge" style={{
                  fontSize: '18px',
                  marginTop: '2px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--green-bright)',
                  border: '1px solid var(--border-neon-green)'
                }}>
                  {activeWorkflow.slotReleased}
                </div>
              </div>
            </div>

            {/* PHASE 9: Required Fee Telemetry Grid:
                Entry Time | Exit Time | Duration | Free Hours | Charged Hours | Rate | TOTAL AMOUNT */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
              
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Entry Time</span>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                  {activeWorkflow.entryTime}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Exit Time</span>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                  {activeWorkflow.exitTime}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Duration</span>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--cyan-primary)', marginTop: '2px' }}>
                  {activeWorkflow.duration}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Free Hours</span>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--green-bright)', marginTop: '2px' }}>
                  {activeWorkflow.freeHours ?? 2} hrs
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Charged Hours</span>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                  {activeWorkflow.chargedHours ?? 0} hrs
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Tariff Rate</span>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                  ₹{activeWorkflow.rate ?? 0}/hr
                </div>
              </div>

            </div>

            {/* TOTAL AMOUNT Telemetry Box */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.1) 0%, rgba(58, 134, 255, 0.1) 100%)',
              border: '1px solid var(--border-neon-cyan)',
              borderRadius: '10px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--cyan-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  BACKEND FEE CALCULATION ENGINE
                </span>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {activeWorkflow.calculationFormula || activeWorkflow.tariffBreakdown}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>TOTAL AMOUNT</div>
                <div style={{
                  fontSize: '22px',
                  fontWeight: 900,
                  color: (activeWorkflow.totalAmount ?? activeWorkflow.fee) === 0 ? 'var(--green-bright)' : '#FFFFFF',
                  fontFamily: 'var(--font-heading)'
                }}>
                  ₹{activeWorkflow.totalAmount ?? activeWorkflow.fee}
                </div>
              </div>
            </div>

            {/* PROMINENT REQUIREMENT:
                Show the slot becoming vacant after checkout & marked AVAILABLE */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1.5px solid var(--border-neon-green)',
              borderRadius: '10px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'var(--green-bright)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#050811'
                }}>
                  <CheckCircle2 size={20} strokeWidth={2.8} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
                    Slot {activeWorkflow.slotReleased} Released & Marked AVAILABLE (Vacant)
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    State Transition: <span style={{ color: 'var(--red-bright)', textDecoration: 'line-through' }}>🔴 OCCUPIED</span> → <span style={{ color: 'var(--green-bright)', fontWeight: 800 }}>🟢 AVAILABLE</span>
                  </div>
                </div>
              </div>

              <span style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--green-bright)',
                background: 'rgba(16, 185, 129, 0.2)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontWeight: 800,
                border: '1px solid rgba(16, 185, 129, 0.5)'
              }}>
                SLOT VACANT ✓
              </span>
            </div>

            {/* Barrier Relay & Receipt Bar with Wrong Gate Alert */}
            <div style={{
              background: activeWorkflow.barrierStatus?.includes('WRONG GATE') || lastCheckOutError?.error === 'Wrong Gate'
                ? 'rgba(239, 68, 68, 0.18)'
                : 'rgba(15, 23, 42, 0.8)',
              border: activeWorkflow.barrierStatus?.includes('WRONG GATE') || lastCheckOutError?.error === 'Wrong Gate'
                ? '1.5px solid rgba(239, 68, 68, 0.7)'
                : '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              fontSize: '11.5px',
              boxShadow: activeWorkflow.barrierStatus?.includes('WRONG GATE') || lastCheckOutError?.error === 'Wrong Gate'
                ? '0 0 16px rgba(239, 68, 68, 0.35)'
                : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {activeWorkflow.barrierStatus?.includes('WRONG GATE') || lastCheckOutError?.error === 'Wrong Gate' ? (
                  <AlertCircle size={16} color="var(--red-bright)" />
                ) : (
                  <ShieldCheck size={16} color="var(--green-bright)" />
                )}
                <span style={{
                  color: activeWorkflow.barrierStatus?.includes('WRONG GATE') || lastCheckOutError?.error === 'Wrong Gate'
                    ? 'var(--red-bright)'
                    : '#FFFFFF',
                  fontWeight: 700
                }}>
                  {activeWorkflow.barrierStatus}
                </span>
              </div>
              <span style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                Receipt #{activeWorkflow.receiptId}
              </span>
            </div>

            {/* PHASE 10: Automatic Receipt Action Buttons (Print, Download PDF, New Transaction) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.1fr', gap: '10px' }}>
              <button
                onClick={() => setShowReceiptModal(true)}
                className="btn-ghost"
                style={{ padding: '10px 8px', fontSize: '12px', justifyContent: 'center' }}
              >
                <Printer size={15} /> Print Receipt
              </button>
              <button
                onClick={handleDirectPdfDownload}
                disabled={downloadingPdf}
                className="btn-ghost"
                style={{
                  padding: '10px 8px',
                  fontSize: '12px',
                  justifyContent: 'center',
                  color: 'var(--cyan-primary)',
                  borderColor: 'rgba(0, 240, 255, 0.3)'
                }}
              >
                <Printer size={15} style={{ display: 'none' }} />
                {downloadingPdf ? 'Generating...' : 'Download PDF'}
              </button>
              <button
                onClick={handleNewTransaction}
                className="btn-primary"
                style={{ padding: '10px 8px', fontSize: '12px', justifyContent: 'center' }}
              >
                New Transaction
              </button>
            </div>
          </div>

          {/* Secondary Security Override / Manual Exit Fallback Drawer */}
          <div className="glass-panel" style={{
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden'
          }}>
            <button
              onClick={() => setShowManualOverride(!showManualOverride)}
              style={{
                width: '100%',
                padding: '14px 18px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                color: '#FFFFFF'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={15} color="var(--orange-bright)" />
                <span style={{ fontSize: '12.5px', fontWeight: 700 }}>
                  Secondary Security Override / Manual Exit Fallback
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                  (Damaged or Obscured Plates Only)
                </span>
              </div>
              {showManualOverride ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showManualOverride && (
              <div style={{ padding: '18px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(8, 12, 22, 0.95)' }}>
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  fontSize: '11.5px',
                  color: 'var(--text-muted)',
                  marginBottom: '14px'
                }}>
                  <strong style={{ color: 'var(--orange-bright)' }}>Security Notice:</strong> The security staff should not manually enter these values during normal operation. CCTV automated egress handles all vehicles automatically. Use this fallback solely if the vehicle license plate is illegible.
                </div>

                <form onSubmit={handleManualCheckOut} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      Departure Exit Gate
                    </label>
                    <select
                      value={manualExitGate}
                      onChange={(e) => setManualExitGate(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '6px',
                        padding: '9px 12px',
                        color: '#FFFFFF',
                        fontSize: '12.5px'
                      }}
                    >
                      <option value="Student">Gate 1 (Student Gate Exit)</option>
                      <option value="Staff">Gate 2 (Staff Gate Exit)</option>
                      <option value="Visitor">Gate 3 (Visitor Gate Exit)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      License Plate Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. KA-22-AB-1234"
                      value={manualPlate}
                      onChange={(e) => setManualPlate(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '6px',
                        padding: '9px 12px',
                        color: '#FFFFFF',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '13px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      Exit Time (Validated: Cannot Be Earlier Than Entry)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 12:45 PM"
                      value={manualExitTime}
                      onChange={(e) => setManualExitTime(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '6px',
                        padding: '9px 12px',
                        color: '#FFFFFF',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '13px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      Settlement Mode
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {['UPI', 'Cash', 'Card'].map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setManualPaymentMethod(m)}
                          style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: manualPaymentMethod === m ? '1px solid var(--cyan-primary)' : '1px solid var(--border-subtle)',
                            background: manualPaymentMethod === m ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                            color: manualPaymentMethod === m ? 'var(--cyan-primary)' : 'var(--text-muted)',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!manualPlate.trim()}
                    style={{
                      background: 'linear-gradient(135deg, #0284C7 0%, #06B6D4 100%)',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '12.5px',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '11px',
                      cursor: manualPlate.trim() ? 'pointer' : 'not-allowed',
                      opacity: manualPlate.trim() ? 1 : 0.6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      marginTop: '6px'
                    }}
                  >
                    <LogOut size={15} /> Execute Manual Override & Release Gate 2
                  </button>
                </form>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* PHASE 10: Premium CPVTS Parking Receipt Modal Dialog */}
      {showReceiptModal && (
        <ModalReceipt
          receipt={activeWorkflow}
          onClose={() => setShowReceiptModal(false)}
          onNewTransaction={handleNewTransaction}
        />
      )}

    </div>
  );
}
