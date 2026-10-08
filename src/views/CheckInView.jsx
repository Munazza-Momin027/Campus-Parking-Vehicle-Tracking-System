import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  Car,
  Bike,
  Printer,
  Zap,
  Clock,
  User,
  ParkingSquare,
  Check,
  ChevronDown,
  ChevronUp,
  Layers,
  Activity,
  Eye,
  Radio,
  Sparkles,
  ArrowRight,
  Shield,
  ShieldCheck,
  ScanLine,
  Sliders,
  Maximize2
} from 'lucide-react';
import { playSound } from '../utils/audio';

export default function CheckInView() {
  const {
    slots,
    checkInVehicle,
    registeredVehicles,
    soundEnabled,
    setCurrentTab,
    pipelineMode
  } = useApp();

  // 🚪 3-Gate Category Selection State ('Student' | 'Staff' | 'Visitor')
  const [selectedGate, setSelectedGate] = useState('Student');
  const [manualGate, setManualGate] = useState('Student');

  // Gate Definition Lookup
  const GATES = [
    {
      id: 'Student',
      gateNumber: 1,
      name: 'Gate 1 — Student Gate',
      camId: 'cam_student_entry',
      color: '#3A86FF',
      badgeBg: 'rgba(58, 134, 255, 0.15)',
      badgeBorder: 'rgba(58, 134, 255, 0.4)',
      category: 'Student',
      feedImage: '/camera_1_feed.png',
      desc: 'Dedicated Student vehicle ingress with optical OCR verification'
    },
    {
      id: 'Staff',
      gateNumber: 2,
      name: 'Gate 2 — Staff Gate',
      camId: 'cam_staff_entry',
      color: '#8B5CF6',
      badgeBg: 'rgba(139, 92, 246, 0.15)',
      badgeBorder: 'rgba(139, 92, 246, 0.4)',
      category: 'Staff',
      feedImage: '/camera_1_feed.png',
      desc: 'Dedicated Faculty & Staff ingress with institutional credential checks'
    },
    {
      id: 'Visitor',
      gateNumber: 3,
      name: 'Gate 3 — Visitor Gate',
      camId: 'cam_visitor_entry',
      color: '#10B981',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      badgeBorder: 'rgba(16, 185, 129, 0.4)',
      category: 'Visitor',
      feedImage: '/camera_1_feed.png',
      desc: 'Guest & Visitor ingress with tariff calculation & visitor pass logging'
    }
  ];

  const currentGateConfig = GATES.find(g => g.id === selectedGate) || GATES[0];

  // Workflow Execution State
  const [activeWorkflow, setActiveWorkflow] = useState({
    plate: 'KA-22-XY-9876',
    vehicleType: 'Four-Wheeler',
    category: 'Student',
    ownerName: 'Rahul Verma',
    department: 'Computer Science (4th Year)',
    entryTime: '10:24 AM',
    assignedSlot: 'F-02',
    confidence: '99.4%',
    status: '✓ AUTO CHECK-IN',
    barrierStatus: 'GATE BARRIER OPENED',
    currentStepIndex: 9, // All 9 steps complete by default
    isProcessing: false,
    thumb: '/thumb_car.png'
  });

  // Phase 14: Error Handling & Fallback States
  const [isCameraOffline, setIsCameraOffline] = useState(false);
  const [unclearPlateModal, setUnclearPlateModal] = useState(null); // { plateDraft: string, frame: string, confidence: string }
  const [correctedPlateInput, setCorrectedPlateInput] = useState('');
  const [lastCheckInError, setLastCheckInError] = useState(null); // { error: string, message: string }

  // Security Override / Manual Fallback State (Security staff manual entry: Vehicle Number, Vehicle Type, Category, Entry Time)
  const [showManualOverride, setShowManualOverride] = useState(false);
  const [manualPlate, setManualPlate] = useState('');
  const [manualType, setManualType] = useState('Four-Wheeler');
  const [manualCategory, setManualCategory] = useState('Visitor');
  const [manualDriver, setManualDriver] = useState('');
  const [manualSlot, setManualSlot] = useState('');
  const [manualEntryTime, setManualEntryTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }));

  // Available slots for selected vehicle type
  const availableSlots = slots.filter(s =>
    !s.occupied &&
    (manualType === 'Four-Wheeler' ? s.zone === 'four-wheeler' : s.zone === 'two-wheeler')
  );

  // Predefined Ingress Scenarios for All 3 Dedicated Campus Gates + Error Scenarios
  const INGRESS_PRESETS = [
    // Gate 1: Student Gate Presets
    {
      id: 'student_car',
      plate: 'KA-22-CD-3456',
      type: 'Four-Wheeler',
      label: 'Student Car (Priya Sharma)',
      driver: 'Priya Sharma',
      dept: 'Electronics Eng (3rd Year)',
      category: 'Student',
      gate: 'Student',
      thumb: '/thumb_car.png'
    },
    {
      id: 'student_bike',
      plate: 'KA-22-ST-1122',
      type: 'Two-Wheeler',
      label: 'Student Bike (Aryan Khan)',
      driver: 'Aryan Khan',
      dept: 'Computer Science (2nd Year)',
      category: 'Student',
      gate: 'Student',
      thumb: '/thumb_bike.png'
    },
    // Gate 2: Staff Gate Presets
    {
      id: 'faculty_bike',
      plate: 'KA-22-GH-7890',
      type: 'Two-Wheeler',
      label: 'Faculty Bike (Prof. Arvind)',
      driver: 'Prof. Arvind Rao',
      dept: 'Dept of Physics',
      category: 'Staff',
      gate: 'Staff',
      thumb: '/thumb_bike.png'
    },
    {
      id: 'staff_car',
      plate: 'KA-22-FC-5544',
      type: 'Four-Wheeler',
      label: 'Staff Car (Dr. Sunita)',
      driver: 'Dr. Sunita Mehra',
      dept: 'Dean of Academics',
      category: 'Staff',
      gate: 'Staff',
      thumb: '/thumb_car.png'
    },
    // Gate 3: Visitor Gate Presets
    {
      id: 'visitor_car',
      plate: 'KA-22-ZZ-8822',
      type: 'Four-Wheeler',
      label: 'Visitor Sedan (Rajan Kapoor)',
      driver: 'Rajan Kapoor',
      dept: 'Campus Guest / Vendor',
      category: 'Visitor',
      gate: 'Visitor',
      thumb: '/thumb_car.png'
    },
    // Dedicated Security Verification Test: Wrong Gate Rejection
    {
      id: 'wrong_gate_test',
      plate: 'KA-22-WG-9090',
      type: 'Four-Wheeler',
      label: '⚠️ Wrong Gate Test (Security Rejection)',
      driver: 'Unauthorized Ingress',
      dept: 'Category Security Audit',
      category: 'Staff', // Mismatch against Student Gate, or Student at Staff Gate
      isWrongGateTest: true,
      thumb: '/thumb_car.png'
    },
    // Edge-Case / Fail-Safe Presets
    {
      id: 'duplicate_test',
      plate: 'KA-22-XY-9876', // Currently parked in F-02
      type: 'Four-Wheeler',
      label: '⚠️ Duplicate Plate (Already Parked)',
      driver: 'Rahul Verma',
      dept: 'Duplicate Test',
      category: 'Student',
      gate: 'Student',
      thumb: '/thumb_car.png',
      isDuplicateTest: true
    },
    {
      id: 'unclear_test',
      plate: 'KA-22-??-9876',
      type: 'Four-Wheeler',
      label: '⚠️ Low ANPR Confidence',
      driver: 'Campus Driver',
      dept: 'Optical Ambiguity',
      category: 'Visitor',
      gate: 'Visitor',
      thumb: '/thumb_car.png',
      isUnclearTest: true
    },
    {
      id: 'parking_full_test',
      plate: 'KA-22-ZZ-9999',
      type: 'Four-Wheeler',
      label: '⛔ Parking Full Simulation',
      driver: 'Overflow Guest',
      dept: 'Capacity Test',
      category: 'Visitor',
      gate: 'Visitor',
      thumb: '/thumb_car.png',
      isFullTest: true
    }
  ];

  // The 9 Sequential Steps of Automatic Check-In Pipeline
  const PIPELINE_STEPS = [
    { num: 1, title: 'Vehicle Detected', desc: 'Gate 1 Optical Sensor Tripwire' },
    { num: 2, title: 'Number Plate Recognized', desc: 'Optical Character Recognition (ANPR)' },
    { num: 3, title: 'Vehicle Type Detected', desc: 'YOLOv8 Geometry Classification' },
    { num: 4, title: 'Search Registered Vehicle', desc: 'Campus Database Query' },
    { num: 5, title: 'Get Owner Category', desc: 'Student / Staff / Visitor Profile' },
    { num: 6, title: 'Find Available Slot', desc: 'Zone Capacity & Sensor Audit' },
    { num: 7, title: 'Assign Slot', desc: 'Optimal Proximity Allocation' },
    { num: 8, title: 'Create Parking Record', desc: 'Immutable Activity Audit Log' },
    { num: 9, title: 'Update Dashboard', desc: 'KPI Counters & Barrier Relay' }
  ];

  // Primary Autonomous Check-In Execution Engine
  const triggerAutomatedCheckIn = (preset) => {
    playSound('beep', soundEnabled);
    setLastCheckInError(null);

    // PHASE 14: If ANPR confidence is low (Number Plate Unclear)
    if (preset.isUnclearTest || preset.plate.includes('?')) {
      playSound('alert', soundEnabled);
      setUnclearPlateModal({
        plateDraft: preset.plate,
        frame: preset.thumb || '/thumb_car.png',
        confidence: '41.2% (Low Confidence)'
      });
      setCorrectedPlateInput('KA-22-XY-9876');
      return;
    }

    // PHASE 14: Parking Full Simulation
    if (preset.isFullTest) {
      playSound('alert', soundEnabled);
      const errObj = {
        error: 'Parking Full',
        message: 'Parking Full: All Four-Wheeler bays in Zone F are currently occupied! Ingress denied.'
      };
      setLastCheckInError(errObj);
      setActiveWorkflow(prev => ({
        ...prev,
        plate: preset.plate,
        vehicleType: preset.type,
        category: preset.category,
        assignedSlot: 'PARKING FULL',
        status: '⛔ PARKING FULL',
        barrierStatus: 'GATE BARRIER CLOSED (DENIED)',
        currentStepIndex: 6,
        isProcessing: false
      }));
      return;
    }

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    // Initiate Step Progression
    setActiveWorkflow({
      plate: preset.plate,
      vehicleType: preset.type,
      category: preset.category,
      ownerName: preset.driver,
      department: preset.dept,
      entryTime: timeFormatted,
      assignedSlot: 'Computing...',
      confidence: `${(98.5 + Math.random() * 1.3).toFixed(1)}%`,
      status: 'PROCESSING AUTOMATION...',
      barrierStatus: 'WAITING VERIFICATION...',
      currentStepIndex: 1,
      isProcessing: true,
      thumb: preset.thumb
    });

    // Step 2 & 3: Plate & Type (150ms)
    setTimeout(() => {
      setActiveWorkflow(prev => ({ ...prev, currentStepIndex: 3 }));
    }, 150);

    // Step 4 & 5: DB Search & Owner Category (350ms)
    setTimeout(() => {
      setActiveWorkflow(prev => ({ ...prev, currentStepIndex: 5 }));
    }, 350);

    // Step 6 & 7: Find & Assign Slot (600ms)
    setTimeout(() => {
      setActiveWorkflow(prev => ({ ...prev, currentStepIndex: 7 }));
    }, 600);

    // Step 8 & 9: Create Record, Update Dashboard & Gate Barrier Relay (900ms)
    setTimeout(() => {
      // Calculate target category (simulate mismatch if wrong gate test)
      const effectiveCategory = preset.isWrongGateTest
        ? (selectedGate === 'Student' ? 'Staff' : 'Student')
        : preset.category;

      const res = checkInVehicle({
        vehicleNumber: preset.plate,
        type: preset.type,
        category: effectiveCategory,
        driver: preset.driver,
        gate: selectedGate
      });

      // Security Check: Wrong Gate Rejection & Error Guards
      if (!res.success) {
        playSound('alert', soundEnabled);
        setLastCheckInError(res);
        const isWrongGate = res.error === 'Wrong Gate';

        setActiveWorkflow(prev => ({
          ...prev,
          plate: preset.plate,
          vehicleType: preset.type,
          category: effectiveCategory,
          ownerName: preset.driver,
          assignedSlot: res.error === 'Vehicle Already Parked' ? `Slot ${res.slot}` : 'ACCESS DENIED',
          status: isWrongGate
            ? '⚠️ WRONG GATE ACCESS DENIED'
            : res.error === 'Vehicle Already Parked'
            ? '⚠️ VEHICLE ALREADY PARKED'
            : '⛔ PARKING FULL',
          barrierStatus: isWrongGate
            ? '⚠ WRONG GATE — Gate Barrier Closed (Access Denied / Redirect to appropriate gate)'
            : 'GATE BARRIER CLOSED (DENIED)',
          currentStepIndex: isWrongGate ? 5 : 6,
          isProcessing: false,
          thumb: preset.thumb
        }));
        return;
      }

      setLastCheckInError(null);
      const slotAssigned = res.slotAssigned || (preset.type === 'Four-Wheeler' ? 'F-02' : 'T-02');
      playSound('success', soundEnabled);

      setActiveWorkflow({
        plate: preset.plate,
        vehicleType: preset.type,
        category: effectiveCategory,
        ownerName: preset.driver,
        department: preset.dept,
        entryTime: timeFormatted,
        assignedSlot: slotAssigned,
        confidence: `${(98.5 + Math.random() * 1.3).toFixed(1)}%`,
        status: '✓ AUTO CHECK-IN',
        barrierStatus: `GATE BARRIER OPENED (${currentGateConfig.name.toUpperCase()})`,
        currentStepIndex: 9,
        isProcessing: false,
        thumb: preset.thumb
      });
    }, 900);
  };

  // Phase 14: Confirm staff plate correction from low ANPR confidence modal
  const handleConfirmCorrectedPlate = (e) => {
    e.preventDefault();
    const clean = correctedPlateInput.trim().toUpperCase();
    if (!clean) return;
    setUnclearPlateModal(null);
    playSound('beep', soundEnabled);
    triggerAutomatedCheckIn({
      id: 'corrected_plate',
      plate: clean,
      type: 'Four-Wheeler',
      label: 'Staff Corrected Plate',
      driver: 'Campus Driver (Verified)',
      dept: 'OCR Ambiguity Resolution',
      category: 'Visitor',
      thumb: '/thumb_car.png'
    });
  };

  // Phase 14: Manual Fallback Submission (Vehicle Number, Vehicle Type, Category, Entry Time)
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualPlate.trim()) return;

    const res = checkInVehicle({
      vehicleNumber: manualPlate.trim().toUpperCase(),
      type: manualType,
      category: manualCategory,
      driver: manualDriver.trim() || `${manualCategory} Driver`,
      slotId: manualSlot || undefined,
      customEntryTime: manualEntryTime || undefined,
      gate: manualGate || selectedGate
    });

    if (!res.success) {
      playSound('alert', soundEnabled);
      setLastCheckInError(res);
      return;
    }

    setLastCheckInError(null);
    playSound('success', soundEnabled);
    const assigned = res.slotAssigned;

    setActiveWorkflow({
      plate: manualPlate.trim().toUpperCase(),
      vehicleType: manualType,
      category: manualCategory,
      ownerName: manualDriver.trim() || `${manualCategory} Driver`,
      department: 'Manual Security Clearance',
      entryTime: manualEntryTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      assignedSlot: assigned,
      confidence: 'Manual Staff Entry (100%)',
      status: '✓ MANUAL CHECK-IN',
      barrierStatus: 'GATE BARRIER OPENED',
      currentStepIndex: 9,
      isProcessing: false,
      thumb: manualType === 'Four-Wheeler' ? '/thumb_car.png' : '/thumb_bike.png'
    });

    setManualPlate('');
    setManualDriver('');
    setManualSlot('');
    setShowManualOverride(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '35px' }}>
      
      {/* 1. Header & Autonomous Mode Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
              Automatic Vehicle Check-In Terminal
            </h1>
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--green-bright)',
              padding: '3px 9px',
              borderRadius: '6px',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--green-bright)',
                boxShadow: '0 0 6px var(--green-bright)'
              }} />
              100% AUTONOMOUS INGRESS
            </span>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            When the entry camera detects a vehicle, the 9-stage optical pipeline automatically resolves owner, allocates optimal slot, and opens gate barrier.
          </p>
        </div>

        {/* Operational Notice: No Manual Entry Required */}
        <div style={{
          padding: '8px 14px',
          borderRadius: '8px',
          background: 'rgba(0, 240, 255, 0.08)',
          border: '1px solid rgba(0, 240, 255, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11.5px',
          color: '#E0F2FE'
        }}>
          <ShieldCheck size={16} color="var(--cyan-primary)" />
          <span>
            <strong>Zero Manual Entry:</strong> Security staff do not enter plates manually during normal operation.
          </span>
        </div>
      </div>

      {/* 🚪 3-GATE DEDICATED INGRESS SELECTOR BAR */}
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
            background: currentGateConfig.badgeBg,
            border: `1px solid ${currentGateConfig.badgeBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield size={16} color={currentGateConfig.color} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
                Active Monitoring Gate:
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '4px',
                background: currentGateConfig.badgeBg,
                color: currentGateConfig.color,
                border: `1px solid ${currentGateConfig.badgeBorder}`,
                fontFamily: 'var(--font-mono)'
              }}>
                {currentGateConfig.name} ({currentGateConfig.camId})
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {currentGateConfig.desc}
            </div>
          </div>
        </div>

        {/* 3 Interactive Gate Selection Pills */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {GATES.map((gate) => {
            const isSel = selectedGate === gate.id;
            return (
              <button
                key={gate.id}
                type="button"
                onClick={() => {
                  playSound('beep', soundEnabled);
                  setSelectedGate(gate.id);
                  setManualGate(gate.id);
                  setLastCheckInError(null);
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

      {/* 2. Visual 9-Step Pipeline Execution Flow Bar */}
      <div className="glass-panel" style={{
        padding: '16px 20px',
        background: 'linear-gradient(135deg, rgba(8, 14, 28, 0.95) 0%, rgba(5, 9, 18, 0.95) 100%)',
        border: '1px solid rgba(0, 240, 255, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="var(--cyan-primary)" />
            <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
              Autonomous Ingress Workflow (9-Stage Sequence)
            </h3>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            Vehicle Detected → Number Plate Recognized → Vehicle Type → Search DB → Owner Category → Find Slot → Assign Slot → Create Record → Update Dashboard
          </span>
        </div>

        {/* 9-Step Horizontal Progress Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(9, 1fr)',
          gap: '6px'
        }}>
          {PIPELINE_STEPS.map((step) => {
            const isCompleted = activeWorkflow.currentStepIndex >= step.num;
            const isCurrent = activeWorkflow.currentStepIndex === step.num && activeWorkflow.isProcessing;

            return (
              <div
                key={step.num}
                style={{
                  position: 'relative',
                  background: isCompleted ? 'rgba(16, 185, 129, 0.12)' : (isCurrent ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)'),
                  border: isCompleted ? '1px solid rgba(16, 185, 129, 0.45)' : (isCurrent ? '1px solid var(--cyan-primary)' : '1px solid var(--border-subtle)'),
                  borderRadius: '8px',
                  padding: '8px 6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  transition: 'all 0.25s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: isCompleted ? 'var(--green-bright)' : (isCurrent ? 'var(--cyan-primary)' : 'rgba(255, 255, 255, 0.1)'),
                    color: isCompleted || isCurrent ? '#050811' : 'var(--text-muted)',
                    fontSize: '9px',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {isCompleted ? <Check size={10} strokeWidth={3} /> : step.num}
                  </span>
                  <span style={{
                    fontSize: '8.5px',
                    color: isCompleted ? 'var(--green-bright)' : (isCurrent ? 'var(--cyan-primary)' : 'var(--text-dim)'),
                    fontWeight: 700
                  }}>
                    {isCompleted ? 'DONE' : (isCurrent ? 'RUNNING' : 'WAIT')}
                  </span>
                </div>

                <div style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: isCompleted || isCurrent ? '#FFFFFF' : 'var(--text-dim)',
                  lineHeight: '1.2'
                }}>
                  {step.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PHASE 14: Error Notification Banner (Vehicle Already Parked / Parking Full) */}
      {lastCheckInError && (
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
                {lastCheckInError.error === 'Vehicle Already Parked'
                  ? '⚠️ Vehicle Already Parked'
                  : lastCheckInError.error === 'Parking Full'
                  ? '⛔ Parking Full'
                  : lastCheckInError.error}
              </div>
              <div style={{ color: '#FECACA', fontSize: '12px', marginTop: '2px' }}>
                {lastCheckInError.message}
              </div>
            </div>
          </div>
          <button
            onClick={() => setLastCheckInError(null)}
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

      {/* PHASE 14: Camera Offline & Manual Entry Available Notice */}
      {isCameraOffline && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>🔴</span>
            <div>
              <div style={{ color: 'var(--red-bright)', fontWeight: 800, fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Camera Offline
                <span style={{
                  background: 'rgba(0, 240, 255, 0.15)',
                  border: '1px solid var(--border-neon-cyan)',
                  color: 'var(--cyan-primary)',
                  fontSize: '10.5px',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)'
                }}>
                  Manual Entry Available
                </span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11.5px', marginTop: '2px' }}>
                CCTV is unavailable. Security staff can manually enter: <strong>Vehicle Number, Vehicle Type, Category, and Entry Time</strong>.
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowManualOverride(true)}
            className="btn-primary"
            style={{ fontSize: '11.5px', padding: '7px 14px', whiteSpace: 'nowrap' }}
          >
            Open Manual Entry
          </button>
        </div>
      )}

      {/* 3. Main Operational Center: Left Ingress Feed & Triggers + Right Active Result Slip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.35fr 1fr',
        gap: '20px'
      }}>
        
        {/* LEFT COLUMN: Camera 1 Live Feed & Sensor Simulation Triggers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Camera 1 Viewport Container */}
          <div className="glass-panel" style={{
            background: '#040711',
            borderRadius: '14px',
            overflow: 'hidden',
            border: isCameraOffline ? '1.5px solid rgba(239, 68, 68, 0.6)' : '1px solid rgba(0, 240, 255, 0.35)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Top Camera Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '9px 14px',
              background: 'rgba(7, 11, 20, 0.95)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: isCameraOffline ? 'var(--red-bright)' : 'var(--green-bright)',
                  animation: 'pulseGlow 1.5s infinite'
                }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
                  {currentGateConfig.name} — Camera ({currentGateConfig.camId})
                </span>
                
                {/* Phase 14 Connection Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    playSound('beep', soundEnabled);
                    const nextOff = !isCameraOffline;
                    setIsCameraOffline(nextOff);
                    if (nextOff) setShowManualOverride(true);
                  }}
                  style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: isCameraOffline ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.2)',
                    color: isCameraOffline ? 'var(--red-bright)' : 'var(--green-bright)',
                    border: isCameraOffline ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(16, 185, 129, 0.4)',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)'
                  }}
                  title="Toggle CCTV Connection to test Camera Offline / Manual Entry Available"
                >
                  {isCameraOffline ? '🔴 Camera Offline' : '🟢 CCTV Online'}
                </button>
              </div>

              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {isCameraOffline ? 'STREAM OFFLINE' : '30.0 FPS • 1080P Full HD'}
              </span>
            </div>

            {/* Video Feed Area */}
            <div style={{ position: 'relative', height: '235px', overflow: 'hidden' }}>
              {isCameraOffline ? (
                /* Phase 14: Camera Offline & Manual Entry Available Display */
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(circle at center, #1C1118 0%, #060205 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '20px',
                  textAlign: 'center',
                  zIndex: 10
                }}>
                  <div style={{
                    padding: '6px 16px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.22)',
                    border: '1.5px solid var(--red-bright)',
                    color: 'var(--red-bright)',
                    fontWeight: 900,
                    fontSize: '15px',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.04em',
                    boxShadow: '0 0 20px rgba(239, 68, 68, 0.35)'
                  }}>
                    🔴 Camera Offline
                  </div>
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    background: 'rgba(0, 240, 255, 0.15)',
                    border: '1px solid var(--border-neon-cyan)',
                    color: 'var(--cyan-primary)',
                    fontWeight: 800,
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    Manual Entry Available
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-dim)', maxWidth: '340px', lineHeight: '1.4' }}>
                    Optical CCTV feed is unavailable. Security staff can manually enter <strong>Vehicle Number, Vehicle Type, Category, and Entry Time</strong>.
                  </p>
                  <button
                    onClick={() => setShowManualOverride(true)}
                    className="btn-primary"
                    style={{ fontSize: '11.5px', padding: '6px 14px', marginTop: '4px' }}
                  >
                    Open Manual Entry Form
                  </button>
                </div>
              ) : (
                <>
                  <img
                    src="/camera_1_feed.png"
                    alt="Entry Camera Feed"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {/* Watermark */}
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: pipelineMode === 'SIMULATION' ? 'rgba(245, 158, 11, 0.28)' : 'rgba(0, 240, 255, 0.25)',
                    border: pipelineMode === 'SIMULATION' ? '1px solid rgba(245, 158, 11, 0.6)' : '1px solid rgba(0, 240, 255, 0.6)',
                    borderRadius: '5px',
                    padding: '2px 7px',
                    fontSize: '9.5px',
                    fontWeight: 800,
                    color: pipelineMode === 'SIMULATION' ? 'var(--orange-bright)' : 'var(--cyan-primary)',
                    fontFamily: 'var(--font-mono)',
                    backdropFilter: 'blur(4px)'
                  }}>
                    {pipelineMode === 'SIMULATION' ? '🧪 SIMULATION CAMERA FEED' : '⚡ LIVE RTSP FEED'}
                  </div>

                  {/* Laser Scan Sweep Line */}
                  <div style={{
                    position: 'absolute',
                    left: '12%',
                    right: '12%',
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, #00F0FF, transparent)',
                    boxShadow: '0 0 12px #00F0FF',
                    animation: 'scanLaser 2.2s infinite linear'
                  }} />

              {/* Vehicle Bounding Box Reticle */}
              <div style={{
                position: 'absolute',
                top: '18%',
                left: '26%',
                width: '46%',
                height: '66%',
                border: '2px solid rgba(0, 240, 255, 0.75)',
                borderRadius: '6px',
                boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)',
                pointerEvents: 'none'
              }}>
                <span style={{
                  position: 'absolute',
                  top: '-20px',
                  left: 0,
                  background: 'rgba(0, 240, 255, 0.9)',
                  color: '#050811',
                  fontSize: '9.5px',
                  fontWeight: 900,
                  padding: '1px 6px',
                  borderRadius: '3px',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {activeWorkflow.vehicleType?.toUpperCase() || 'FOUR-WHEELER'} DETECTED
                </span>
              </div>

              {/* Plate Bounding Box Reticle */}
              <div style={{
                position: 'absolute',
                bottom: '26%',
                left: '42%',
                width: '74px',
                height: '24px',
                border: '2px solid #00E676',
                borderRadius: '3px',
                boxShadow: '0 0 10px rgba(0, 230, 118, 0.8)',
                pointerEvents: 'none'
              }}>
                <span style={{
                  position: 'absolute',
                  top: '-15px',
                  left: '-2px',
                  background: '#00E676',
                  color: '#050811',
                  fontSize: '8.5px',
                  fontWeight: 900,
                  padding: '1px 4px',
                  borderRadius: '2px',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {activeWorkflow.plate}
                </span>
              </div>

              {/* Bottom Barrier Status Ribbon */}
              <div style={{
                position: 'absolute',
                bottom: '8px',
                left: '8px',
                right: '8px',
                background: 'rgba(5, 8, 17, 0.92)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '6px',
                padding: '4px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green-bright)' }} />
                  <span style={{ color: '#FFFFFF', fontWeight: 600 }}>Optical Gate Tripwire:</span>
                  <span style={{ color: 'var(--green-bright)', fontWeight: 700 }}>ACTIVE</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', color: activeWorkflow.barrierStatus?.includes('WRONG GATE') ? 'var(--red-bright)' : 'var(--cyan-primary)' }}>
                  Barrier Gate {currentGateConfig.gateNumber}: <strong style={{ color: activeWorkflow.barrierStatus?.includes('WRONG GATE') ? 'var(--red-bright)' : 'var(--green-bright)' }}>
                    {activeWorkflow.barrierStatus}
                  </strong>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

          {/* Instant Camera Ingress Sensor Triggers */}
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={15} color="var(--cyan-primary)" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                  Simulate Camera Ingress Detections (Arrival at {currentGateConfig.name})
                </span>
              </div>
              <span style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>
                Click to trigger automated pipeline
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '8px' }}>
              {INGRESS_PRESETS.map((preset) => {
                const isCurrent = activeWorkflow.plate === preset.plate;
                const isWrong = preset.isWrongGateTest;
                return (
                  <button
                    key={preset.id}
                    onClick={() => triggerAutomatedCheckIn(preset)}
                    disabled={activeWorkflow.isProcessing}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: isWrong
                        ? 'rgba(239, 68, 68, 0.12)'
                        : isCurrent
                        ? 'rgba(0, 240, 255, 0.15)'
                        : 'rgba(255, 255, 255, 0.04)',
                      border: isWrong
                        ? '1px solid rgba(239, 68, 68, 0.5)'
                        : isCurrent
                        ? '1px solid var(--cyan-primary)'
                        : '1px solid var(--border-subtle)',
                      color: '#FFFFFF',
                      cursor: activeWorkflow.isProcessing ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!activeWorkflow.isProcessing) {
                        e.currentTarget.style.background = isWrong ? 'rgba(239, 68, 68, 0.22)' : 'rgba(0, 240, 255, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeWorkflow.plate !== preset.plate) {
                        e.currentTarget.style.background = isWrong ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.04)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: isWrong
                          ? 'var(--red-bright)'
                          : preset.type === 'Four-Wheeler'
                          ? 'var(--cyan-primary)'
                          : 'var(--purple-bright)'
                      }}>
                        {isWrong ? '⚠ SECURITY TEST' : preset.type === 'Four-Wheeler' ? '🚗 Car' : '🏍️ Bike'}
                      </span>
                      <span style={{
                        fontSize: '9px',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        background: preset.category === 'Student' ? 'rgba(58, 134, 255, 0.2)' : preset.category === 'Staff' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: preset.category === 'Student' ? '#93C5FD' : preset.category === 'Staff' ? '#C4B5FD' : '#6EE7B7'
                      }}>
                        {preset.category}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                      {preset.plate}
                    </span>
                    <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {preset.label || preset.driver}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>


        {/* RIGHT COLUMN: Official Auto Check-In Admission Slip (Matching Prompt Example) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* The Main Admission Card */}
          <div className="glass-panel glass-panel-neon-cyan" style={{
            padding: '20px',
            background: 'linear-gradient(135deg, rgba(13, 22, 42, 0.95) 0%, rgba(8, 15, 30, 0.9) 100%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            
            {/* Top Card Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--green-bright)',
                  boxShadow: '0 0 10px var(--green-bright)',
                  animation: 'pulseGlow 1.5s infinite'
                }} />
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
                  Active Vehicle Admission Slip
                </h3>
              </div>

              {/* Status Badge: ✓ AUTO CHECK-IN */}
              <div style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.2)',
                color: 'var(--green-bright)',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                fontFamily: 'var(--font-mono)',
                boxShadow: '0 0 12px rgba(16, 185, 129, 0.3)'
              }}>
                {activeWorkflow.status}
              </div>
            </div>

            {/* Vehicle Thumbnail & High-Contrast Number Plate */}
            <div style={{
              display: 'flex',
              gap: '14px',
              alignItems: 'center',
              background: 'rgba(5, 8, 17, 0.6)',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{
                width: '85px',
                height: '75px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid rgba(0, 240, 255, 0.4)',
                boxShadow: '0 0 12px rgba(0, 240, 255, 0.2)',
                background: '#020617',
                flexShrink: 0
              }}>
                <img
                  src={activeWorkflow.thumb}
                  alt="Vehicle Image"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Optical Number Plate (ANPR):
                </div>
                <div className="plate-badge" style={{ fontSize: '16px', padding: '3px 10px' }}>
                  {activeWorkflow.plate}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--green-bright)', fontWeight: 600, marginTop: '2px' }}>
                  OCR Confidence: {activeWorkflow.confidence}
                </div>
              </div>
            </div>

            {/* 4 Required Spec Attributes in Highlighted Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px'
            }}>
              {/* Vehicle Type */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <span style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>Vehicle Type:</span>
                <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {activeWorkflow.vehicleType === 'Four-Wheeler' ? <Car size={15} color="var(--cyan-primary)" /> : <Bike size={15} color="var(--purple-bright)" />}
                  {activeWorkflow.vehicleType}
                </span>
              </div>

              {/* Owner Category */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <span style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>Owner Category:</span>
                <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--cyan-primary)' }}>
                  {activeWorkflow.category}
                </span>
              </div>

              {/* Entry Time */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <span style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>Entry Timestamp:</span>
                <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#FCD34D', fontFamily: 'var(--font-mono)' }}>
                  {activeWorkflow.entryTime}
                </span>
              </div>

              {/* Assigned Slot */}
              <div style={{
                background: 'rgba(0, 240, 255, 0.08)',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(0, 240, 255, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <span style={{ fontSize: '10.5px', color: 'var(--cyan-primary)', fontWeight: 600 }}>Assigned Slot:</span>
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                  {activeWorkflow.assignedSlot}
                </span>
              </div>
            </div>

            {/* Owner Details Sub-Panel */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              fontSize: '11.5px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Registered Driver:</span>
                <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{activeWorkflow.ownerName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Campus Affiliation:</span>
                <span style={{ color: 'var(--purple-bright)', fontWeight: 600 }}>{activeWorkflow.department}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Admission Method:</span>
                <span style={{ color: 'var(--green-bright)', fontWeight: 600 }}>Autonomous CCTV Detection (Zero Manual Input)</span>
              </div>
            </div>

            {/* Barrier Gate Relay Status Banner with Wrong Gate Alert */}
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: activeWorkflow.barrierStatus?.includes('WRONG GATE') || lastCheckInError?.error === 'Wrong Gate'
                ? 'linear-gradient(90deg, #991B1B 0%, #DC2626 100%)'
                : 'linear-gradient(90deg, #059669 0%, #10B981 100%)',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: activeWorkflow.barrierStatus?.includes('WRONG GATE') || lastCheckInError?.error === 'Wrong Gate'
                ? '0 0 16px rgba(239, 68, 68, 0.5)'
                : '0 0 16px rgba(16, 185, 129, 0.35)',
              border: activeWorkflow.barrierStatus?.includes('WRONG GATE') || lastCheckInError?.error === 'Wrong Gate'
                ? '1px solid rgba(254, 202, 202, 0.5)'
                : 'none'
            }}>
              {activeWorkflow.barrierStatus?.includes('WRONG GATE') || lastCheckInError?.error === 'Wrong Gate' ? (
                <AlertCircle size={16} color="#FFFFFF" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              <span>
                {activeWorkflow.barrierStatus}
              </span>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => window.print()}
                className="btn-ghost"
                style={{ flex: 1, justifyContent: 'center', fontSize: '11.5px', padding: '8px' }}
              >
                <Printer size={13} /> Print Entry Ticket
              </button>
              <button
                onClick={() => setCurrentTab('slots')}
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center', fontSize: '11.5px', padding: '8px' }}
              >
                <ParkingSquare size={13} /> View Slot on Map
              </button>
            </div>

          </div>
        </div>

      </div>


      {/* 4. Secondary Security Override / Manual Fallback (Collapsible) */}
      <div className="glass-panel" style={{
        padding: '14px 18px',
        border: '1px dashed var(--border-subtle)',
        background: 'rgba(15, 23, 42, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div
          onClick={() => setShowManualOverride(!showManualOverride)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={15} color="var(--text-muted)" />
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Secondary Security Override / Manual Fallback (Damaged or Obscured Plates Only)
            </span>
          </div>

          <button
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--cyan-primary)',
              fontSize: '11.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <span>{showManualOverride ? 'Collapse Form' : 'Expand Form'}</span>
            {showManualOverride ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Note stating normal operation is automatic */}
        <div style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.4' }}>
          * Security staff should <strong>not</strong> manually enter values during normal operations. The automated camera pipeline handles recognition and parking allocation autonomously.
        </div>

        {/* Collapsible Manual Form */}
        {showManualOverride && (
          <form onSubmit={handleManualSubmit} style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr) auto',
            gap: '10px',
            alignItems: 'flex-end',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
                Vehicle Number
              </label>
              <input
                type="text"
                placeholder="KA-22-XX-0000"
                value={manualPlate}
                onChange={(e) => setManualPlate(e.target.value.toUpperCase())}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  background: '#0D1424',
                  border: '1px solid var(--border-light)',
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
                Vehicle Type
              </label>
              <select
                value={manualType}
                onChange={(e) => setManualType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  background: '#0D1424',
                  border: '1px solid var(--border-light)',
                  color: '#FFFFFF',
                  fontSize: '11.5px'
                }}
              >
                <option value="Four-Wheeler">Four-Wheeler</option>
                <option value="Two-Wheeler">Two-Wheeler</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
                Arrival Gate
              </label>
              <select
                value={manualGate}
                onChange={(e) => setManualGate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  background: '#0D1424',
                  border: '1px solid var(--border-light)',
                  color: '#FFFFFF',
                  fontSize: '11.5px'
                }}
              >
                <option value="Student">Gate 1 (Student Gate)</option>
                <option value="Staff">Gate 2 (Staff Gate)</option>
                <option value="Visitor">Gate 3 (Visitor Gate)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
                Category
              </label>
              <select
                value={manualCategory}
                onChange={(e) => setManualCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  background: '#0D1424',
                  border: '1px solid var(--border-light)',
                  color: '#FFFFFF',
                  fontSize: '11.5px'
                }}
              >
                <option value="Student">Student</option>
                <option value="Staff">Faculty / Staff</option>
                <option value="Visitor">Visitor</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
                Entry Time
              </label>
              <input
                type="text"
                placeholder="10:24 AM"
                value={manualEntryTime}
                onChange={(e) => setManualEntryTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  background: '#0D1424',
                  border: '1px solid var(--border-light)',
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
                Driver Name (Optional)
              </label>
              <input
                type="text"
                placeholder="Driver Name"
                value={manualDriver}
                onChange={(e) => setManualDriver(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  background: '#0D1424',
                  border: '1px solid var(--border-light)',
                  color: '#FFFFFF',
                  fontSize: '11.5px'
                }}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '8px 14px', fontSize: '11.5px', whiteSpace: 'nowrap' }}
            >
              Complete Manual Entry
            </button>
          </form>
        )}
      </div>

      {/* PHASE 14: Number Plate Unclear Modal (Low ANPR Confidence) */}
      {unclearPlateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 18, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setUnclearPlateModal(null)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '24px',
              border: '1.5px solid var(--orange-bright)',
              background: 'linear-gradient(180deg, rgba(15, 20, 35, 0.98) 0%, rgba(8, 12, 22, 0.99) 100%)',
              boxShadow: '0 0 50px rgba(245, 158, 11, 0.3)',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: 'var(--orange-bright)',
                    border: '1px solid rgba(245, 158, 11, 0.5)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontWeight: 800,
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    LOW ANPR CONFIDENCE
                  </span>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF' }}>
                    Number Plate Unclear
                  </h3>
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Optical confidence is below threshold ({unclearPlateModal.confidence}). Review captured frame and correct plate.
                </p>
              </div>
              <button
                onClick={() => setUnclearPlateModal(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            {/* Captured Frame with Plate Zoom Overlay */}
            <div style={{
              position: 'relative',
              borderRadius: '10px',
              overflow: 'hidden',
              height: '180px',
              background: '#040711',
              border: '1px solid var(--border-subtle)'
            }}>
              <img
                src={unclearPlateModal.frame || '/camera_1_feed.png'}
                alt="Captured Ingress Frame"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                bottom: '22%',
                left: '38%',
                width: '94px',
                height: '32px',
                border: '2px dashed var(--orange-bright)',
                boxShadow: '0 0 16px rgba(245, 158, 11, 0.6)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(5, 8, 17, 0.75)'
              }}>
                <span style={{ fontSize: '11px', color: 'var(--orange-bright)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  {unclearPlateModal.plateDraft}
                </span>
              </div>
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'rgba(0,0,0,0.8)',
                color: 'var(--orange-bright)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)'
              }}>
                CONFIDENCE: {unclearPlateModal.confidence}
              </div>
            </div>

            {/* Correction Form */}
            <form onSubmit={handleConfirmCorrectedPlate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Corrected License Plate (Staff Verification)
                </label>
                <input
                  type="text"
                  value={correctedPlateInput}
                  onChange={e => setCorrectedPlateInput(e.target.value.toUpperCase())}
                  placeholder="e.g. KA-22-XY-9876"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#090E1A',
                    border: '1.5px solid var(--cyan-primary)',
                    color: '#FFFFFF',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '15px',
                    fontWeight: 800,
                    letterSpacing: '0.05em'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setUnclearPlateModal(null)}
                  className="btn-ghost"
                  style={{ flex: 1, padding: '10px', fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 2, padding: '10px', fontSize: '12px', justifyContent: 'center' }}
                >
                  <Check size={14} /> Confirm Corrected Plate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
