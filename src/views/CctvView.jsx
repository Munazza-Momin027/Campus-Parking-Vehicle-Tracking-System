import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import AiPipelineFlow from '../components/AiPipelineFlow';
import {
  Video,
  Camera,
  Maximize2,
  RefreshCw,
  Eye,
  EyeOff,
  Zap,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Layers,
  Activity,
  Radio,
  Wifi,
  WifiOff,
  Shield,
  Clock,
  Car,
  Bike,
  User,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  X,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  ShieldAlert,
  Tag,
  Crown
} from 'lucide-react';
import { playSound } from '../utils/audio';

export default function CctvView() {
  const {
    soundEnabled,
    checkInVehicle,
    checkOutVehicle,
    slots,
    pipelineMode,
    setPipelineMode,
    gateStats,
    setGateStats,
    activeGateFilter,
    setActiveGateFilter,
    GATES_DEF,
    notifications
  } = useApp();

  // Control Room States
  const [cam1Connected, setCam1Connected] = useState(true);
  const [cam2Connected, setCam2Connected] = useState(true);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [snapshotNotice, setSnapshotNotice] = useState(null);
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [cctvWrongGateAlert, setCctvWrongGateAlert] = useState(null);
  const [selectedGateTab, setSelectedGateTab] = useState('all'); // 'all' | 'Student' | 'Staff' | 'Visitor'

  // Manual fallback form state
  const [fallbackPlate, setFallbackPlate] = useState('');
  const [fallbackType, setFallbackType] = useState('Four-Wheeler');
  const [fallbackCategory, setFallbackCategory] = useState('Visitor');
  const [fallbackGate, setFallbackGate] = useState('Student');

  // 3 Dedicated Category Gates CCTV Stream Definitions
  const GATE_STREAMS = [
    {
      gateId: 'student_gate',
      gateNumber: 1,
      gateName: 'Student Gate',
      category: 'Student',
      color: '#3A86FF',
      accent: 'var(--blue-primary)',
      badgeBg: 'rgba(58, 134, 255, 0.2)',
      badgeBorder: 'rgba(58, 134, 255, 0.45)',
      entryCam: {
        id: 'cam_student_entry',
        name: 'Student Gate — Entry Camera',
        type: 'Entry',
        ip: '192.168.1.101',
        feedImage: '/camera_1_feed.png',
        defaultPlate: 'KA-22-XY-9876',
        defaultType: 'Four-Wheeler',
        confidence: '99.4%',
        bbox: '[x: 380, y: 210, w: 360, h: 220]',
        plateBbox: '[x: 480, y: 340, w: 160, h: 48]'
      },
      exitCam: {
        id: 'cam_student_exit',
        name: 'Student Gate — Exit Camera',
        type: 'Exit',
        ip: '192.168.1.102',
        feedImage: '/camera_2_feed.png',
        defaultPlate: 'KA-22-CD-3456',
        defaultType: 'Four-Wheeler',
        confidence: '98.7%',
        bbox: '[x: 375, y: 205, w: 370, h: 225]',
        plateBbox: '[x: 478, y: 338, w: 165, h: 48]'
      }
    },
    {
      gateId: 'staff_gate',
      gateNumber: 2,
      gateName: 'Staff Gate',
      category: 'Staff',
      color: '#8B5CF6',
      accent: 'var(--purple-ai)',
      badgeBg: 'rgba(139, 92, 246, 0.2)',
      badgeBorder: 'rgba(139, 92, 246, 0.45)',
      entryCam: {
        id: 'cam_staff_entry',
        name: 'Staff Gate — Entry Camera',
        type: 'Entry',
        ip: '192.168.1.103',
        feedImage: '/camera_1_feed.png',
        defaultPlate: 'KA-22-GH-7890',
        defaultType: 'Two-Wheeler',
        confidence: '98.8%',
        bbox: '[x: 420, y: 190, w: 260, h: 290]',
        plateBbox: '[x: 495, y: 350, w: 120, h: 40]'
      },
      exitCam: {
        id: 'cam_staff_exit',
        name: 'Staff Gate — Exit Camera',
        type: 'Exit',
        ip: '192.168.1.104',
        feedImage: '/camera_2_feed.png',
        defaultPlate: 'KA-22-AB-1234',
        defaultType: 'Two-Wheeler',
        confidence: '98.8%',
        bbox: '[x: 410, y: 160, w: 240, h: 310]',
        plateBbox: '[x: 490, y: 360, w: 110, h: 42]'
      }
    },
    {
      gateId: 'visitor_gate',
      gateNumber: 3,
      gateName: 'Visitor Gate',
      category: 'Visitor',
      color: '#10B981',
      accent: 'var(--green-bright)',
      badgeBg: 'rgba(16, 185, 129, 0.2)',
      badgeBorder: 'rgba(16, 185, 129, 0.45)',
      entryCam: {
        id: 'cam_visitor_entry',
        name: 'Visitor Gate — Entry Camera',
        type: 'Entry',
        ip: '192.168.1.105',
        feedImage: '/camera_1_feed.png',
        defaultPlate: 'KA-22-ZZ-4400',
        defaultType: 'Four-Wheeler',
        confidence: '97.4%',
        bbox: '[x: 390, y: 220, w: 350, h: 210]',
        plateBbox: '[x: 485, y: 345, w: 155, h: 46]'
      },
      exitCam: {
        id: 'cam_visitor_exit',
        name: 'Visitor Gate — Exit Camera',
        type: 'Exit',
        ip: '192.168.1.106',
        feedImage: '/camera_2_feed.png',
        defaultPlate: 'KA-22-EV-1122',
        defaultType: 'Two-Wheeler',
        confidence: '98.1%',
        bbox: '[x: 400, y: 180, w: 250, h: 290]',
        plateBbox: '[x: 490, y: 350, w: 115, h: 40]'
      }
    }
  ];

  // Predefined Simulation Scenarios (3 Dedicated Gates + Wrong Gate Rejections)
  const PREDEFINED_SCENARIOS = {
    // Gate 1: Student Gate
    entry_student_car: {
      key: 'entry_student_car',
      gate: 'Student',
      title: 'Student Vehicle Detected',
      plate: 'KA-22-XY-9876',
      vehicleType: 'Four-Wheeler',
      category: 'Student',
      driver: 'Rahul Verma (Student)',
      confidence: '98.4%',
      direction: 'ENTRY (Ingress) — Gate 1',
      action: 'AUTO CHECK-IN',
      camera: 'Student Gate — Entry Camera (Gate 1)',
      camId: 'cam_student_entry',
      bbox: '[x: 380, y: 210, w: 360, h: 220]',
      plateBbox: '[x: 480, y: 340, w: 160, h: 48]',
      thumb: '/thumb_car.png',
      is_simulated: true,
      provenance: 'GATE 1 (STUDENT) • ANPR VERIFIED'
    },
    exit_student_bike: {
      key: 'exit_student_bike',
      gate: 'Student',
      title: 'Student Vehicle Detected',
      plate: 'KA-22-PQ-9988',
      vehicleType: 'Two-Wheeler',
      category: 'Student',
      driver: 'Aditi Deshmukh (Student)',
      confidence: '98.9%',
      direction: 'EXIT (Egress) — Gate 1',
      action: 'AUTO CHECK-OUT',
      camera: 'Student Gate — Exit Camera (Gate 1)',
      camId: 'cam_student_exit',
      bbox: '[x: 410, y: 160, w: 240, h: 310]',
      plateBbox: '[x: 490, y: 360, w: 110, h: 42]',
      thumb: '/thumb_bike.png',
      is_simulated: true,
      provenance: 'GATE 1 (STUDENT) • ANPR VERIFIED'
    },

    // Gate 2: Staff Gate
    entry_faculty_bike: {
      key: 'entry_faculty_bike',
      gate: 'Staff',
      title: 'Faculty Vehicle Detected',
      plate: 'KA-22-GH-7890',
      vehicleType: 'Two-Wheeler',
      category: 'Staff',
      driver: 'Prof. Arvind Rao (Faculty)',
      confidence: '97.6%',
      direction: 'ENTRY (Ingress) — Gate 2',
      action: 'AUTO CHECK-IN',
      camera: 'Staff Gate — Entry Camera (Gate 2)',
      camId: 'cam_staff_entry',
      bbox: '[x: 420, y: 190, w: 260, h: 290]',
      plateBbox: '[x: 495, y: 350, w: 120, h: 40]',
      thumb: '/thumb_bike.png',
      is_simulated: true,
      provenance: 'GATE 2 (STAFF) • ANPR VERIFIED'
    },
    exit_staff_bike: {
      key: 'exit_staff_bike',
      gate: 'Staff',
      title: 'Faculty Vehicle Detected',
      plate: 'KA-22-AB-1234',
      vehicleType: 'Two-Wheeler',
      category: 'Staff',
      driver: 'Dr. S. N. Patil (Faculty)',
      confidence: '98.8%',
      direction: 'EXIT (Egress) — Gate 2',
      action: 'AUTO CHECK-OUT',
      camera: 'Staff Gate — Exit Camera (Gate 2)',
      camId: 'cam_staff_exit',
      bbox: '[x: 410, y: 160, w: 240, h: 310]',
      plateBbox: '[x: 490, y: 360, w: 110, h: 42]',
      thumb: '/thumb_bike.png',
      is_simulated: true,
      provenance: 'GATE 2 (STAFF) • ANPR VERIFIED'
    },

    // Gate 2 VIP Fast-Track Protocol
    entry_vip_dignitary: {
      key: 'entry_vip_dignitary',
      gate: 'Staff',
      title: '⭐ VIP Dignitary Vehicle Detected',
      plate: 'KA-22-VIP-0001',
      vehicleType: 'Four-Wheeler',
      category: 'VIP',
      driver: 'Hon. Vice Chancellor / State Dignitary',
      confidence: '99.8%',
      direction: 'ENTRY (Fast-Track) — Gate 2',
      action: 'FAST-TRACK VIP CHECK-IN',
      camera: 'Staff Gate (VIP Fast-Track) — Entry Camera',
      camId: 'cam_staff_entry',
      bbox: '[x: 380, y: 210, w: 360, h: 220]',
      plateBbox: '[x: 480, y: 340, w: 160, h: 48]',
      thumb: '/thumb_car.png',
      is_simulated: true,
      provenance: 'GATE 2 (VIP FAST-TRACK) • PROTOCOL APPROVED'
    },

    // Gate 3: Visitor Gate
    entry_visitor_car: {
      key: 'entry_visitor_car',
      gate: 'Visitor',
      title: 'Guest Vehicle Detected',
      plate: 'KA-22-ZZ-4400',
      vehicleType: 'Four-Wheeler',
      category: 'Visitor',
      driver: 'Campus Guest / Visitor',
      confidence: '96.9%',
      direction: 'ENTRY (Ingress) — Gate 3',
      action: 'AUTO CHECK-IN',
      camera: 'Visitor Gate — Entry Camera (Gate 3)',
      camId: 'cam_visitor_entry',
      bbox: '[x: 390, y: 220, w: 350, h: 210]',
      plateBbox: '[x: 485, y: 345, w: 155, h: 46]',
      thumb: '/thumb_car.png',
      is_simulated: true,
      provenance: 'GATE 3 (VISITOR) • TARIFF LOGGED'
    },
    exit_visitor_bike: {
      key: 'exit_visitor_bike',
      gate: 'Visitor',
      title: 'Guest Vehicle Detected',
      plate: 'KA-22-EF-9012',
      vehicleType: 'Two-Wheeler',
      category: 'Visitor',
      driver: 'Suresh Kumar (Visitor)',
      confidence: '97.4%',
      direction: 'EXIT (Egress) — Gate 3',
      action: 'AUTO CHECK-OUT',
      camera: 'Visitor Gate — Exit Camera (Gate 3)',
      camId: 'cam_visitor_exit',
      bbox: '[x: 410, y: 160, w: 240, h: 310]',
      plateBbox: '[x: 490, y: 360, w: 110, h: 42]',
      thumb: '/thumb_bike.png',
      is_simulated: true,
      provenance: 'GATE 3 (VISITOR) • TARIFF CLEARED'
    },

    // ⚠ WRONG GATE DETECTION SCENARIOS (Security Rejections)
    wrong_gate_staff_at_student: {
      key: 'wrong_gate_staff_at_student',
      gate: 'Student', // attempted at Student Gate
      title: '⚠ WRONG GATE DETECTION',
      plate: 'KA-22-MN-5566',
      vehicleType: 'Four-Wheeler',
      category: 'Staff', // actual category
      driver: 'Dr. Meena Joshi (Staff)',
      confidence: '99.1%',
      direction: 'ENTRY (Ingress) — Gate 1',
      action: 'AUTO CHECK-IN',
      camera: 'Student Gate — Entry Camera (Gate 1)',
      camId: 'cam_student_entry',
      bbox: '[x: 380, y: 210, w: 360, h: 220]',
      plateBbox: '[x: 480, y: 340, w: 160, h: 48]',
      thumb: '/thumb_car.png',
      is_simulated: true,
      isWrongGate: true,
      correctGate: 'Staff Gate (Gate 2)',
      provenance: '⚠ SECURITY ALERT: WRONG GATE'
    },
    wrong_gate_student_at_staff: {
      key: 'wrong_gate_student_at_staff',
      gate: 'Staff', // attempted at Staff Gate
      title: '⚠ WRONG GATE DETECTION',
      plate: 'KA-22-XY-9876',
      vehicleType: 'Four-Wheeler',
      category: 'Student', // actual category
      driver: 'Rahul Verma (Student)',
      confidence: '99.4%',
      direction: 'ENTRY (Ingress) — Gate 2',
      action: 'AUTO CHECK-IN',
      camera: 'Staff Gate — Entry Camera (Gate 2)',
      camId: 'cam_staff_entry',
      bbox: '[x: 380, y: 210, w: 360, h: 220]',
      plateBbox: '[x: 480, y: 340, w: 160, h: 48]',
      thumb: '/thumb_car.png',
      is_simulated: true,
      isWrongGate: true,
      correctGate: 'Student Gate (Gate 1)',
      provenance: '⚠ SECURITY ALERT: WRONG GATE'
    },
    wrong_gate_visitor_at_staff: {
      key: 'wrong_gate_visitor_at_staff',
      gate: 'Staff', // attempted at Staff Gate
      title: '⚠ WRONG GATE DETECTION',
      plate: 'KA-22-ZZ-4400',
      vehicleType: 'Four-Wheeler',
      category: 'Visitor', // actual category
      driver: 'Campus Guest / Visitor',
      confidence: '97.2%',
      direction: 'ENTRY (Ingress) — Gate 2',
      action: 'AUTO CHECK-IN',
      camera: 'Staff Gate — Entry Camera (Gate 2)',
      camId: 'cam_staff_entry',
      bbox: '[x: 390, y: 220, w: 350, h: 210]',
      plateBbox: '[x: 485, y: 345, w: 155, h: 46]',
      thumb: '/thumb_car.png',
      is_simulated: true,
      isWrongGate: true,
      correctGate: 'Visitor Gate (Gate 3)',
      provenance: '⚠ SECURITY ALERT: WRONG GATE'
    }
  };

  // Active Detection state for Right-Side AI Detection Panel (Matching prompt specs)
  const [activeDetection, setActiveDetection] = useState({
    title: 'Vehicle Detected',
    plate: 'KA-22-XY-9876',
    vehicleType: 'Four-Wheeler',
    confidence: '98.4%',
    category: 'Student — From Database',
    action: 'AUTO CHECK-IN',
    direction: 'ENTRY (Ingress) — Gate 1',
    slotAssigned: 'F-02',
    timestamp: '10:24:12 AM',
    thumb: '/thumb_car.png',
    status: 'Vehicle Parked Successfully in Slot F-02 • Barrier 1 Opened',
    camera: 'Entry Gate — Camera 1',
    bbox: '[x: 380, y: 210, w: 360, h: 220]',
    plateBbox: '[x: 480, y: 340, w: 160, h: 48]',
    is_simulated: true,
    provenance: 'DEMO / PREDEFINED SIMULATION EVENT'
  });

  // Detection Feed History
  const [detectionLogs, setDetectionLogs] = useState([
    {
      id: 1,
      plate: 'KA-22-XY-9876',
      type: 'Four-Wheeler',
      confidence: '98.4%',
      category: 'Student — From Database',
      action: 'AUTO CHECK-IN',
      direction: 'ENTRY (Ingress) — Gate 1',
      slot: 'F-02',
      time: '10:24:12 AM',
      thumb: '/thumb_car.png',
      camera: 'Camera 1 (Entry)',
      is_simulated: true
    },
    {
      id: 2,
      plate: 'KA-22-AB-1234',
      type: 'Two-Wheeler',
      confidence: '98.8%',
      category: 'Staff — From Database',
      action: 'AUTO CHECK-OUT',
      direction: 'EXIT (Egress) — Gate 2',
      slot: 'T-05',
      time: '10:23:45 AM',
      thumb: '/thumb_bike.png',
      camera: 'Camera 2 (Exit)',
      is_simulated: true
    },
    {
      id: 3,
      plate: 'KA-22-GH-7890',
      type: 'Two-Wheeler',
      confidence: '97.6%',
      category: 'Staff — From Database',
      action: 'AUTO CHECK-IN',
      direction: 'ENTRY (Ingress) — Gate 1',
      slot: 'T-02',
      time: '10:05:10 AM',
      thumb: '/thumb_bike.png',
      camera: 'Camera 1 (Entry)',
      is_simulated: true
    }
  ]);

  // Live ticking security clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimestamp = (d) => {
    return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`;
  };

  // Trigger explicit simulation scenario
  const handleTriggerScenario = (scenarioKey) => {
    playSound('beep', soundEnabled);
    const scenario = PREDEFINED_SCENARIOS[scenarioKey];
    if (!scenario) return;

    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    if (scenario.isWrongGate) {
      playSound('alert', soundEnabled);
      const res = checkInVehicle({
        vehicleNumber: scenario.plate,
        type: scenario.vehicleType,
        category: scenario.category,
        driver: scenario.driver,
        gate: scenario.gate
      });

      const alertMsg = res.message || `⚠ WRONG GATE: ${scenario.plate} (${scenario.category}) attempted entry at ${scenario.gate} Gate. Designated gate is ${scenario.correctGate}. Access Denied.`;
      setCctvWrongGateAlert({
        vehicleNumber: scenario.plate,
        category: scenario.category,
        attemptedGate: `${scenario.gate} Gate`,
        correctGate: scenario.correctGate,
        message: alertMsg,
        time: timeStr
      });

      const wrongEntry = {
        ...scenario,
        timestamp: timeStr,
        status: `⚠ WRONG GATE: ACCESS DENIED • Barrier Remains Closed`,
        slotAssigned: 'DENIED',
        isWrongGate: true
      };

      setActiveDetection(wrongEntry);
      setDetectionLogs(prev => [
        {
          id: Date.now(),
          plate: scenario.plate,
          type: scenario.vehicleType,
          confidence: scenario.confidence,
          category: scenario.category,
          action: 'ACCESS DENIED',
          direction: scenario.direction,
          slot: 'N/A',
          time: timeStr,
          thumb: scenario.thumb,
          camera: scenario.camera,
          isWrongGate: true,
          is_simulated: true
        },
        ...prev
      ]);
      return;
    }

    // Normal valid flow
    setCctvWrongGateAlert(null);
    if (scenario.action === 'AUTO CHECK-IN' || scenario.action === 'FAST-TRACK VIP CHECK-IN') {
      const res = checkInVehicle({
        vehicleNumber: scenario.plate,
        type: scenario.vehicleType,
        category: scenario.category,
        driver: scenario.driver,
        gate: scenario.gate
      });

      const assignedSlot = res.slotAssigned || (scenario.vehicleType === 'Four-Wheeler' ? 'F-02' : 'T-02');
      const newEntry = {
        ...scenario,
        slotAssigned: assignedSlot,
        timestamp: timeStr,
        status: `✓ ${scenario.gate} Gate Verified • Slot ${assignedSlot} Allocated • Barrier 1 Opened`,
        is_simulated: true,
        isWrongGate: false
      };

      setActiveDetection(newEntry);
      setDetectionLogs(prev => [
        {
          id: Date.now(),
          plate: scenario.plate,
          type: scenario.vehicleType,
          confidence: scenario.confidence,
          category: scenario.category,
          action: 'AUTO CHECK-IN',
          direction: scenario.direction,
          slot: assignedSlot,
          time: timeStr,
          thumb: scenario.thumb,
          camera: scenario.camera,
          is_simulated: true
        },
        ...prev
      ]);
      playSound('success', soundEnabled);

    } else {
      // Check-out
      const parked = slots.filter(s => s.occupied && (scenario.vehicleType === 'Four-Wheeler' ? s.zone === 'four-wheeler' : s.zone === 'two-wheeler'));
      const targetSlot = parked[0] || (scenario.vehicleType === 'Four-Wheeler' ? { id: 'F-01', vehicleNumber: scenario.plate } : { id: 'T-05', vehicleNumber: scenario.plate });

      checkOutVehicle({
        vehicleNumber: targetSlot.vehicleNumber || scenario.plate,
        slotId: targetSlot.id,
        duration: '2 Hours 30 Mins',
        fee: scenario.category === 'Visitor' ? 40 : 0,
        gate: scenario.gate
      });

      const newEntry = {
        ...scenario,
        slotAssigned: targetSlot.id,
        timestamp: timeStr,
        status: `✓ ${scenario.gate} Gate Egress Cleared • Slot ${targetSlot.id} Vacated • Barrier 2 Opened`,
        is_simulated: true,
        isWrongGate: false
      };

      setActiveDetection(newEntry);
      setDetectionLogs(prev => [
        {
          id: Date.now(),
          plate: targetSlot.vehicleNumber || scenario.plate,
          type: scenario.vehicleType,
          confidence: scenario.confidence,
          category: scenario.category,
          action: 'AUTO CHECK-OUT',
          direction: scenario.direction,
          slot: targetSlot.id,
          time: timeStr,
          thumb: scenario.thumb,
          camera: scenario.camera,
          is_simulated: true
        },
        ...prev
      ]);
      playSound('success', soundEnabled);
    }
  };

  // Trigger simulated CCTV Detection Event (Gate-Aware)
  const handleTriggerDetection = (gateType = 'Student', direction = 'Entry') => {
    if (direction === 'Entry') {
      if (gateType === 'Student') handleTriggerScenario('entry_student_car');
      else if (gateType === 'Staff') handleTriggerScenario('entry_faculty_bike');
      else handleTriggerScenario('entry_visitor_car');
    } else {
      if (gateType === 'Student') handleTriggerScenario('exit_student_bike');
      else if (gateType === 'Staff') handleTriggerScenario('exit_staff_bike');
      else handleTriggerScenario('exit_visitor_bike');
    }
  };

  // Manual Fallback Submit
  const handleManualFallbackSubmit = (e) => {
    e.preventDefault();
    if (!fallbackPlate.trim()) return;

    const res = checkInVehicle({
      vehicleNumber: fallbackPlate.trim().toUpperCase(),
      type: fallbackType,
      category: fallbackCategory,
      driver: 'Manual Security Override',
      gate: fallbackGate
    });

    if (res.success) {
      playSound('success', soundEnabled);
      setSnapshotNotice(`Manual entry recorded for ${fallbackPlate.toUpperCase()} via ${fallbackGate} Gate. Slot assigned.`);
      setShowManualFallback(false);
      setFallbackPlate('');
    } else {
      playSound('alert', soundEnabled);
      setCctvWrongGateAlert({
        vehicleNumber: fallbackPlate.trim().toUpperCase(),
        category: fallbackCategory,
        attemptedGate: `${fallbackGate} Gate`,
        correctGate: res.message,
        message: res.message,
        time: new Date().toLocaleTimeString()
      });
      alert(res.message);
    }
    setTimeout(() => setSnapshotNotice(null), 3000);
  };

  const handleTakeSnapshot = (camName) => {
    playSound('beep', soundEnabled);
    setSnapshotNotice(`Frame snapshot captured from ${camName} at ${new Date().toLocaleTimeString()}`);
    setTimeout(() => setSnapshotNotice(null), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', paddingBottom: '30px' }}>
      
      {/* 1. Control Room Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
              Live CCTV Monitoring & ANPR Vision Wall
            </h1>
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(0, 240, 255, 0.15)',
              color: 'var(--cyan-primary)',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              fontWeight: 700
            }}>
              CONTROL ROOM HUD
            </span>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Real-time optical character recognition, bounding box telemetry, and automated gate barrier relays
          </p>
        </div>

        {/* Global Camera System Status & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          {/* Connection Status Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '20px',
            background: (cam1Connected && cam2Connected) ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.15)',
            border: (cam1Connected && cam2Connected) ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
            boxShadow: (cam1Connected && cam2Connected) ? '0 0 12px rgba(16, 185, 129, 0.2)' : '0 0 12px rgba(239, 68, 68, 0.3)'
          }}>
            {(cam1Connected && cam2Connected) ? (
              <>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--green-bright)',
                  boxShadow: '0 0 8px var(--green-bright)',
                  animation: 'pulseGlow 2s infinite ease-in-out'
                }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green-bright)' }}>
                  🟢 CCTV Connected
                </span>
              </>
            ) : (
              <>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--red-bright)',
                  boxShadow: '0 0 8px var(--red-bright)'
                }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--red-bright)' }}>
                  🔴 Camera Offline
                </span>
              </>
            )}
          </div>

          {/* Toggle Bounding Boxes */}
          <button
            onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
            className="btn-ghost"
            style={{ fontSize: '11.5px', padding: '7px 12px' }}
          >
            {showBoundingBoxes ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{showBoundingBoxes ? 'Hide Bounding Boxes' : 'Show Bounding Boxes'}</span>
          </button>

          {/* Simulate Disconnect Toggle for evaluation */}
          <button
            onClick={() => {
              setCam1Connected(!cam1Connected);
              setCam2Connected(!cam2Connected);
            }}
            className="btn-ghost"
            style={{ fontSize: '11px', padding: '7px 10px', color: 'var(--text-dim)' }}
            title="Toggle camera feed connection state for demonstration"
          >
            {cam1Connected ? <Wifi size={14} /> : <WifiOff size={14} color="#EF4444" />}
            <span>Test Disconnect</span>
          </button>
        </div>
      </div>

      {/* Snapshot Toast notification */}
      {snapshotNotice && (
        <div style={{
          padding: '10px 16px',
          borderRadius: '8px',
          background: 'rgba(0, 240, 255, 0.15)',
          border: '1px solid var(--border-neon-cyan)',
          color: 'var(--cyan-primary)',
          fontSize: '12.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.2s ease'
        }}>
          <CheckCircle2 size={16} />
          <span>{snapshotNotice}</span>
        </div>
      )}

      {/* 2. Conceptual AI Pipeline Architecture Flow Component */}
      <AiPipelineFlow />

      {/* WRONG GATE SECURITY ALERT BANNER */}
      {cctvWrongGateAlert && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '10px',
          background: 'linear-gradient(90deg, rgba(153, 27, 27, 0.45) 0%, rgba(220, 38, 38, 0.25) 100%)',
          border: '1.5px solid #EF4444',
          boxShadow: '0 0 24px rgba(239, 68, 68, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'pulseGlow 2s infinite',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #EF4444',
              flexShrink: 0
            }}>
              <ShieldAlert size={24} color="#EF4444" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#F87171', letterSpacing: '0.04em' }}>
                  ⚠ WRONG GATE DETECTION — INGRESS DENIED
                </span>
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: '#EF4444',
                  color: '#FFFFFF'
                }}>
                  SECURITY LOCK
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  {cctvWrongGateAlert.time}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#FEF2F2', marginTop: '3px' }}>
                Vehicle <strong style={{ color: '#FCA5A5', fontFamily: 'var(--font-mono)' }}>{cctvWrongGateAlert.vehicleNumber}</strong> ({cctvWrongGateAlert.category}) arrived at <strong style={{ color: '#FCA5A5' }}>{cctvWrongGateAlert.attemptedGate}</strong>. Dedicated Access Gate: <strong style={{ color: '#6EE7B7' }}>{cctvWrongGateAlert.correctGate}</strong>. Entry barrier remains LOCKED.
              </div>
            </div>
          </div>
          <button
            onClick={() => setCctvWrongGateAlert(null)}
            className="btn-ghost"
            style={{ fontSize: '11px', padding: '4px 10px', color: '#FCA5A5', borderColor: 'rgba(239, 68, 68, 0.4)' }}
          >
            Dismiss Alert
          </button>
        </div>
      )}

      {/* 3. Predefined Camera Events Simulation Bar (3 Dedicated Gates + Security Checks) */}
      <div className="glass-panel" style={{
        padding: '14px 18px',
        background: 'linear-gradient(135deg, rgba(13, 20, 36, 0.9) 0%, rgba(10, 18, 30, 0.85) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--orange-bright)',
              boxShadow: '0 0 8px var(--orange-bright)'
            }} />
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
              Simulation Mode: 3 Dedicated Gate ANPR Events & Security Verification
            </span>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: 'var(--orange-bright)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              fontFamily: 'var(--font-mono)'
            }}>
              3-GATE SIMULATION
            </span>
          </div>

          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Simulate optical ANPR ingress/egress across Gate 1, Gate 2, Gate 3, or test wrong-gate security denial
          </span>
        </div>

        {/* 3 Gates + VIP Fast-Track + Wrong Gate Presets Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px'
        }}>
          {/* VIP Dignitary Fast-Track Preset */}
          <button
            onClick={() => handleTriggerScenario('entry_vip_dignitary')}
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              background: 'rgba(234, 179, 8, 0.12)',
              border: '1px solid rgba(234, 179, 8, 0.5)',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              textAlign: 'left',
              transition: 'all 0.15s ease'
            }}
            title="Simulate VIP dignitary fast-track arrival at Gate 2 into reserved Bay F-01"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#FACC15' }}>⭐ VIP Dignitary</span>
              <span style={{ fontSize: '9px', color: '#FACC15', fontWeight: 800 }}>FAST-TRACK</span>
            </div>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>KA-22-VIP-0001</span>
            <span style={{ fontSize: '9.5px', color: 'var(--text-dim)' }}>Bay F-01 • Dignitary</span>
          </button>
          {/* Gate 1: Student Gate */}
          <button
            onClick={() => handleTriggerScenario('entry_student_car')}
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              background: 'rgba(0, 240, 255, 0.08)',
              border: '1px solid rgba(0, 240, 255, 0.35)',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              textAlign: 'left',
              transition: 'all 0.15s ease'
            }}
            title="Simulate student car arrival at Student Gate (Gate 1)"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cyan-primary)' }}>🚗 Student Car</span>
              <span style={{ fontSize: '9px', color: 'var(--green-bright)', fontWeight: 700 }}>GATE 1 ENTRY</span>
            </div>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>KA-22-XY-9876</span>
            <span style={{ fontSize: '9.5px', color: 'var(--text-dim)' }}>Four-Wheeler • Ingress</span>
          </button>

          {/* Gate 2: Staff Gate */}
          <button
            onClick={() => handleTriggerScenario('entry_faculty_bike')}
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              background: 'rgba(139, 92, 246, 0.08)',
              border: '1px solid rgba(139, 92, 246, 0.35)',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              textAlign: 'left',
              transition: 'all 0.15s ease'
            }}
            title="Simulate faculty bike arrival at Staff Gate (Gate 2)"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--purple-bright)' }}>🏍️ Faculty Bike</span>
              <span style={{ fontSize: '9px', color: 'var(--green-bright)', fontWeight: 700 }}>GATE 2 ENTRY</span>
            </div>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>KA-22-GH-7890</span>
            <span style={{ fontSize: '9.5px', color: 'var(--text-dim)' }}>Two-Wheeler • Ingress</span>
          </button>

          {/* Gate 3: Visitor Gate */}
          <button
            onClick={() => handleTriggerScenario('entry_visitor_car')}
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              textAlign: 'left',
              transition: 'all 0.15s ease'
            }}
            title="Simulate visitor vehicle arrival at Visitor Gate (Gate 3)"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--green-bright)' }}>🚙 Visitor SUV</span>
              <span style={{ fontSize: '9px', color: 'var(--green-bright)', fontWeight: 700 }}>GATE 3 ENTRY</span>
            </div>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>KA-22-ZZ-4400</span>
            <span style={{ fontSize: '9.5px', color: 'var(--text-dim)' }}>Four-Wheeler • Ingress</span>
          </button>

          {/* ⚠ Wrong Gate Security Test Button */}
          <button
            onClick={() => handleTriggerScenario('wrong_gate_student_at_staff')}
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              textAlign: 'left',
              transition: 'all 0.15s ease'
            }}
            title="Simulate student car arriving at Staff Gate (Gate 2) to test barrier denial"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#F87171' }}>⚠ WRONG GATE TEST</span>
              <span style={{ fontSize: '9px', color: '#EF4444', fontWeight: 800 }}>DENIED</span>
            </div>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#FCA5A5' }}>KA-22-XY-9876</span>
            <span style={{ fontSize: '9.5px', color: '#F87171' }}>Student at Staff Gate 2</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left CCTV Streams (3 Dedicated Gates - 6 Cameras) + Right AI Detection Panel */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.75fr 1fr',
        gap: '18px'
      }}>
        
        {/* LEFT COLUMN: Dedicated 3-Gate CCTV Streams (6 Cameras) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Gate Selection Filter Tabs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(10, 16, 30, 0.75)',
            padding: '8px 12px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Video size={15} color="var(--cyan-primary)" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>
                Camera Streams (6 Optical RTSP Streams)
              </span>
            </div>

            <div style={{ display: 'flex', gap: '4px' }}>
              {[
                { id: 'all', label: 'All 3 Gates (6 Streams)' },
                { id: 'Student', label: '🚪 Gate 1 (Student)' },
                { id: 'Staff', label: '🚪 Gate 2 (Staff)' },
                { id: 'Visitor', label: '🚪 Gate 3 (Visitor)' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedGateTab(tab.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: selectedGateTab === tab.id ? '1px solid var(--cyan-primary)' : '1px solid transparent',
                    background: selectedGateTab === tab.id ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                    color: selectedGateTab === tab.id ? '#FFFFFF' : 'var(--text-muted)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Render Gate Streams */}
          {GATE_STREAMS
            .filter(gate => selectedGateTab === 'all' || gate.category === selectedGateTab)
            .map(gate => (
              <div
                key={gate.gateId}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(6, 11, 24, 0.6)',
                  border: `1px solid ${gate.badgeBorder}`
                }}
              >
                {/* Gate Header Banner */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: gate.badgeBg,
                      color: gate.color,
                      border: `1px solid ${gate.badgeBorder}`,
                      fontFamily: 'var(--font-mono)'
                    }}>
                      GATE {gate.gateNumber}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
                      {gate.gateName.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      • Dedicated {gate.category} Access
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: 'var(--green-bright)',
                      background: 'rgba(16, 185, 129, 0.12)',
                      padding: '2px 7px',
                      borderRadius: '10px',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--green-bright)' }} />
                      Entry & Exit Online
                    </span>
                  </div>
                </div>

                {/* 2 Camera Feeds Grid (Entry Camera + Exit Camera) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  
                  {/* Entry Camera Card */}
                  <div className="glass-panel" style={{
                    background: '#040711',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* HUD Header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      background: 'rgba(7, 11, 20, 0.95)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      fontSize: '10.5px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FFFFFF', fontWeight: 600 }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--red-bright)', boxShadow: '0 0 5px var(--red-bright)' }} />
                        <span>{gate.entryCam.name}</span>
                      </div>
                      <span style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '9.5px' }}>
                        {formatTimestamp(currentTime)}
                      </span>
                    </div>

                    {/* Viewport */}
                    <div style={{ position: 'relative', height: '175px', background: '#020409', overflow: 'hidden' }}>
                      <img
                        src={gate.entryCam.feedImage}
                        alt={gate.entryCam.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />

                      {/* Provenance Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '6px',
                        left: '6px',
                        background: 'rgba(0, 240, 255, 0.25)',
                        border: '1px solid rgba(0, 240, 255, 0.6)',
                        borderRadius: '4px',
                        padding: '1px 6px',
                        fontSize: '8.5px',
                        fontWeight: 800,
                        color: 'var(--cyan-primary)',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        LIVE ENTRY STREAM
                      </div>

                      {/* Laser Scan Sweep */}
                      <div style={{
                        position: 'absolute',
                        left: '10%',
                        right: '10%',
                        height: '2px',
                        background: 'linear-gradient(90deg, transparent, #00F0FF, transparent)',
                        boxShadow: '0 0 10px #00F0FF',
                        animation: 'scanLaser 2.5s infinite linear'
                      }} />

                      {/* Bounding Box on plate */}
                      {showBoundingBoxes && (
                        <div style={{
                          position: 'absolute',
                          bottom: '30px',
                          left: '40%',
                          width: '68px',
                          height: '22px',
                          border: '2px solid #00E676',
                          borderRadius: '3px',
                          boxShadow: '0 0 8px rgba(0, 230, 118, 0.8)',
                          pointerEvents: 'none'
                        }}>
                          <span style={{
                            position: 'absolute',
                            top: '-14px',
                            left: '-2px',
                            background: '#00E676',
                            color: '#050811',
                            fontSize: '7.5px',
                            fontWeight: 800,
                            padding: '1px 3px',
                            borderRadius: '2px',
                            fontFamily: 'var(--font-mono)'
                          }}>
                            ANPR {gate.entryCam.confidence}
                          </span>
                        </div>
                      )}

                      {/* Bottom Telemetry Overlay */}
                      <div style={{
                        position: 'absolute',
                        bottom: '6px',
                        left: '6px',
                        right: '6px',
                        background: 'rgba(5, 8, 17, 0.92)',
                        backdropFilter: 'blur(6px)',
                        border: '1px solid rgba(0, 240, 255, 0.25)',
                        borderRadius: '5px',
                        padding: '3px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00E676' }} />
                          <span className="plate-badge" style={{ fontSize: '9.5px', padding: '1px 4px' }}>{gate.entryCam.defaultPlate}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{gate.entryCam.defaultType}</span>
                        </div>
                        <button
                          onClick={() => {
                            const scenarioKey = gate.category === 'Student' ? 'entry_student_car' : gate.category === 'Staff' ? 'entry_faculty_bike' : 'entry_visitor_car';
                            handleTriggerScenario(scenarioKey);
                          }}
                          className="btn-primary"
                          style={{ fontSize: '9.5px', padding: '2px 6px' }}
                        >
                          <Zap size={10} /> Auto-Entry
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Exit Camera Card */}
                  <div className="glass-panel" style={{
                    background: '#040711',
                    border: '1px solid rgba(58, 134, 255, 0.3)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* HUD Header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      background: 'rgba(7, 11, 20, 0.95)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      fontSize: '10.5px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FFFFFF', fontWeight: 600 }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--red-bright)', boxShadow: '0 0 5px var(--red-bright)' }} />
                        <span>{gate.exitCam.name}</span>
                      </div>
                      <span style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '9.5px' }}>
                        {formatTimestamp(currentTime)}
                      </span>
                    </div>

                    {/* Viewport */}
                    <div style={{ position: 'relative', height: '175px', background: '#020409', overflow: 'hidden' }}>
                      <img
                        src={gate.exitCam.feedImage}
                        alt={gate.exitCam.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />

                      {/* Provenance Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '6px',
                        left: '6px',
                        background: 'rgba(58, 134, 255, 0.25)',
                        border: '1px solid rgba(58, 134, 255, 0.6)',
                        borderRadius: '4px',
                        padding: '1px 6px',
                        fontSize: '8.5px',
                        fontWeight: 800,
                        color: 'var(--blue-hover)',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        LIVE EXIT STREAM
                      </div>

                      {/* Laser Scan Sweep */}
                      <div style={{
                        position: 'absolute',
                        left: '10%',
                        right: '10%',
                        height: '2px',
                        background: 'linear-gradient(90deg, transparent, #3A86FF, transparent)',
                        boxShadow: '0 0 10px #3A86FF',
                        animation: 'scanLaser 2.2s infinite linear'
                      }} />

                      {/* Bounding Box on plate */}
                      {showBoundingBoxes && (
                        <div style={{
                          position: 'absolute',
                          bottom: '30px',
                          left: '42%',
                          width: '64px',
                          height: '22px',
                          border: '2px solid #00E676',
                          borderRadius: '3px',
                          boxShadow: '0 0 8px rgba(0, 230, 118, 0.8)',
                          pointerEvents: 'none'
                        }}>
                          <span style={{
                            position: 'absolute',
                            top: '-14px',
                            left: '-2px',
                            background: '#00E676',
                            color: '#050811',
                            fontSize: '7.5px',
                            fontWeight: 800,
                            padding: '1px 3px',
                            borderRadius: '2px',
                            fontFamily: 'var(--font-mono)'
                          }}>
                            ANPR {gate.exitCam.confidence}
                          </span>
                        </div>
                      )}

                      {/* Bottom Telemetry Overlay */}
                      <div style={{
                        position: 'absolute',
                        bottom: '6px',
                        left: '6px',
                        right: '6px',
                        background: 'rgba(5, 8, 17, 0.92)',
                        backdropFilter: 'blur(6px)',
                        border: '1px solid rgba(58, 134, 255, 0.25)',
                        borderRadius: '5px',
                        padding: '3px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00E676' }} />
                          <span className="plate-badge" style={{ fontSize: '9.5px', padding: '1px 4px' }}>{gate.exitCam.defaultPlate}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{gate.exitCam.defaultType}</span>
                        </div>
                        <button
                          onClick={() => {
                            const scenarioKey = gate.category === 'Student' ? 'exit_student_bike' : gate.category === 'Staff' ? 'exit_staff_bike' : 'exit_visitor_bike';
                            handleTriggerScenario(scenarioKey);
                          }}
                          className="btn-ghost"
                          style={{ fontSize: '9.5px', padding: '2px 6px', color: 'var(--blue-hover)' }}
                        >
                          <Zap size={10} /> Auto-Exit
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ))}

        </div>

                {/* RIGHT COLUMN: Dedicated AI Detection Panel (Matching Prompt Requirements Exactly) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Main Active Detection Box */}
          <div className="glass-panel glass-panel-neon-cyan" style={{
            padding: '18px',
            background: 'linear-gradient(135deg, rgba(13, 20, 36, 0.9) 0%, rgba(10, 25, 45, 0.85) 100%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* Simulation Provenance Tag */}
            {(activeDetection.is_simulated || pipelineMode === 'SIMULATION') ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                padding: '4px 10px',
                borderRadius: '6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', fontWeight: 800, color: 'var(--orange-bright)' }}>
                  <ShieldAlert size={14} />
                  <span>DEMO / SIMULATION EVENT</span>
                </div>
                <span style={{ fontSize: '9px', color: '#FDE68A', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  SYNTHETIC TEST TELEMETRY
                </span>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.45)',
                padding: '4px 10px',
                borderRadius: '6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', fontWeight: 800, color: 'var(--green-bright)' }}>
                  <CheckCircle2 size={14} />
                  <span>LIVE AI MODEL INFERENCE</span>
                </div>
                <span style={{ fontSize: '9px', color: '#A7F3D0', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  YOLOv8 + OCR ACTIVE
                </span>
              </div>
            )}

            {/* Header: Vehicle Detected */}
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
                <h3 style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '0.04em'
                }}>
                  Vehicle Detected
                </h3>
              </div>

              {/* Action Badge: AUTO CHECK-IN / AUTO CHECK-OUT */}
              <span style={{
                fontSize: '10.5px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '6px',
                background: activeDetection.action === 'AUTO CHECK-IN' ? 'rgba(0, 240, 255, 0.2)' : 'rgba(58, 134, 255, 0.2)',
                color: activeDetection.action === 'AUTO CHECK-IN' ? 'var(--cyan-primary)' : '#60A5FA',
                border: activeDetection.action === 'AUTO CHECK-IN' ? '1px solid rgba(0, 240, 255, 0.5)' : '1px solid rgba(58, 134, 255, 0.5)',
                fontFamily: 'var(--font-mono)'
              }}>
                {activeDetection.action}
              </span>
            </div>

            {/* Vehicle Thumbnail & Top Line Detection */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{
                width: '88px',
                height: '80px',
                borderRadius: '10px',
                overflow: 'hidden',
                border: '1px solid rgba(0, 240, 255, 0.4)',
                boxShadow: '0 0 14px rgba(0, 240, 255, 0.25)',
                background: '#020617',
                flexShrink: 0
              }}>
                <img
                  src={activeDetection.thumb}
                  alt="Detected Vehicle"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {/* 3. Number Plate: */}
                <div>
                  <div style={{ fontSize: '9.5px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    3. Number Plate (ANPR OCR):
                  </div>
                  <div className="plate-badge" style={{ fontSize: '15px', padding: '3px 8px', marginTop: '2px' }}>
                    {activeDetection.plate}
                  </div>
                </div>

                {/* 2. Vehicle Type: */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '2px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>2. Vehicle Type:</span>
                  <span style={{ fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {activeDetection.vehicleType === 'Four-Wheeler' ? <Car size={13} color="var(--cyan-primary)" /> : <Bike size={13} color="var(--purple-bright)" />}
                    {activeDetection.vehicleType}
                  </span>
                </div>

                {/* OCR Confidence */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>OCR Confidence:</span>
                  <span style={{ fontWeight: 700, color: 'var(--green-bright)', fontFamily: 'var(--font-mono)' }}>
                    {activeDetection.confidence}
                  </span>
                </div>
              </div>
            </div>

            {/* 5-Attribute Detailed Detection Telemetry Box */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              {/* 1. Vehicle Bounding Box */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                <span style={{ color: 'var(--text-dim)' }}>1. Vehicle Bounding Box:</span>
                <span style={{ color: 'var(--cyan-primary)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                  {activeDetection.bbox || '[380, 210, 360, 220]'}
                </span>
              </div>

              {/* 4. Entry / Exit Direction */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-dim)' }}>4. Direction:</span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: activeDetection.direction?.includes('ENTRY') ? 'var(--green-bright)' : '#60A5FA',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {activeDetection.direction?.includes('ENTRY') ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
                  {activeDetection.direction || 'ENTRY (Ingress) — Gate 1'}
                </span>
              </div>

              {/* Category */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Category:</span>
                <span style={{ color: 'var(--purple-bright)', fontWeight: 600 }}>{activeDetection.category}</span>
              </div>

              {/* Assigned Slot */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-dim)' }}>Slot Allocated:</span>
                <span className="slot-badge" style={{ fontSize: '11px', padding: '1px 8px' }}>
                  {activeDetection.slotAssigned}
                </span>
              </div>

              {/* 5. Detection Timestamp */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)' }}>
                <span>5. Detection Timestamp:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#FCD34D', fontWeight: 600 }}>
                  {activeDetection.timestamp}
                </span>
              </div>
            </div>

            {/* Action Banner Result */}
            <div style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'linear-gradient(90deg, #059669 0%, #10B981 100%)',
              color: '#FFFFFF',
              fontSize: '11.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 0 12px rgba(16, 185, 129, 0.3)'
            }}>
              <CheckCircle2 size={14} />
              <span>{activeDetection.status}</span>
            </div>

            {/* Honest Disclosure Footnote */}
            {(activeDetection.is_simulated || pipelineMode === 'SIMULATION') && (
              <div style={{
                fontSize: '9.5px',
                color: 'var(--text-dim)',
                lineHeight: '1.4',
                background: 'rgba(0,0,0,0.35)',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(245, 158, 11, 0.2)'
              }}>
                ⚠️ <strong style={{ color: 'var(--orange-bright)' }}>Simulation Mode:</strong> Generated via predefined simulation scenario. Live webcam/CCTV feed does not perform real ANPR until model weights are placed in <code style={{ color: 'var(--cyan-primary)' }}>backend/models/yolov8n.pt</code>.
              </div>
            )}
          </div>

          {/* Real-time Detection Event Stream History */}
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
                Live Detection Stream
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                Auto-Logged
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '185px', overflowY: 'auto' }}>
              {detectionLogs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setActiveDetection({
                    title: 'Vehicle Detected',
                    plate: log.plate,
                    vehicleType: log.type,
                    confidence: log.confidence,
                    category: log.category,
                    action: log.action,
                    slotAssigned: log.slot,
                    timestamp: log.time,
                    thumb: log.thumb,
                    status: `${log.plate} • Logged via ${log.camera}`,
                    camera: log.camera
                  })}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 240, 255, 0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="plate-badge" style={{ fontSize: '11.5px', padding: '1px 5px' }}>
                      {log.plate}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {log.action} ({log.slot})
                    </span>
                    {log.is_simulated && (
                      <span style={{
                        fontSize: '8.5px',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: 'var(--orange-bright)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        DEMO
                      </span>
                    )}
                  </div>

                  <span style={{ fontSize: '10.5px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {log.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Secondary Manual Fallback Trigger */}
          <div style={{
            padding: '12px 14px',
            borderRadius: '10px',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px dashed var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                Damaged plate or camera glare?
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>
                Secondary manual snapshot fallback
              </div>
            </div>

            <button
              onClick={() => setShowManualFallback(true)}
              className="btn-ghost"
              style={{ fontSize: '11px', padding: '6px 12px' }}
            >
              <Plus size={13} /> Manual Entry Fallback
            </button>
          </div>

        </div>

      </div>

      {/* Secondary Manual Entry Fallback Modal */}
      {showManualFallback && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(3, 7, 18, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '460px',
            background: '#0D1424',
            border: '1px solid rgba(0, 240, 255, 0.35)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
            borderRadius: '16px',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                  Secondary Manual Capture Fallback
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Use only when optical plate reading is impeded
                </p>
              </div>
              <button
                onClick={() => setShowManualFallback(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleManualFallbackSubmit} style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  License Plate Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. KA-22-ZZ-1122"
                  value={fallbackPlate}
                  onChange={(e) => setFallbackPlate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-light)',
                    color: '#FFFFFF',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Vehicle Type
                  </label>
                  <select
                    value={fallbackType}
                    onChange={(e) => setFallbackType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: '#0D1424',
                      border: '1px solid var(--border-light)',
                      color: '#FFFFFF',
                      fontSize: '12px'
                    }}
                  >
                    <option value="Four-Wheeler">Four-Wheeler</option>
                    <option value="Two-Wheeler">Two-Wheeler</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Category
                  </label>
                  <select
                    value={fallbackCategory}
                    onChange={(e) => setFallbackCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: '#0D1424',
                      border: '1px solid var(--border-light)',
                      color: '#FFFFFF',
                      fontSize: '12px'
                    }}
                  >
                    <option value="Student">Student</option>
                    <option value="Staff">Staff</option>
                    <option value="Visitor">Visitor</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, padding: '9px', justifyContent: 'center' }}
                >
                  Confirm & Allocate Slot
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualFallback(false)}
                  className="btn-ghost"
                  style={{ padding: '9px 14px' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
