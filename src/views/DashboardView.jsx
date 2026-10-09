import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  ParkingSquare,
  Car,
  Bike,
  ShieldCheck,
  TrendingUp,
  CircleDollarSign,
  Video,
  UserPlus,
  Search,
  FileText,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Maximize2,
  RefreshCw,
  User,
  Zap,
  Radio,
  Sliders,
  Check,
  ShieldAlert,
  AlertTriangle,
  DoorOpen
} from 'lucide-react';
import { playSound } from '../utils/audio';

export default function DashboardView() {
  const {
    slots,
    activities,
    metrics,
    recentDetections,
    setCurrentTab,
    setInspectItem,
    checkInVehicle,
    checkOutVehicle,
    soundEnabled,
    registeredVehicles,
    pipelineMode,
    setPipelineMode,
    gateStats,
    setGateStats,
    activeGateFilter,
    setActiveGateFilter,
    GATES_DEF,
    notifications
  } = useApp();

  // Active selected slot state for blue/selected visual state
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [cctvScanning, setCctvScanning] = useState(true);
  const [liveScanModal, setLiveScanModal] = useState(null); // { camId, plate, status, step, ... }
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedGatePreview, setSelectedGatePreview] = useState('all'); // 'all' | 'Student' | 'Staff' | 'Visitor'
  const [wrongGateAlert, setWrongGateAlert] = useState(null); // { vehicleNumber, category, attemptedGate, correctGate, message, time }

  // Ticking live clock for cameras and HUD
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Format camera timestamp: "10 Mar 2025 10:24:12 AM"
  const formattedTimestamp = `${currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ${currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`;

  // Gate-Aware Detection Trigger: Handles Student, Staff, Visitor gates and Wrong Gate detection
  const handleTriggerGateCctv = (gateCategory = 'Student', direction = 'Entry', simulateWrongGate = false) => {
    playSound('beep', soundEnabled);

    if (simulateWrongGate) {
      // Wrong Gate Simulation: Staff attempting Student Gate, or Student at Staff Gate
      const wrongVehicle = gateCategory === 'Student'
        ? { plate: 'KA-22-MN-5566', type: 'Four-Wheeler', category: 'Staff', driver: 'Dr. Meena Joshi (Staff)' }
        : gateCategory === 'Staff'
        ? { plate: 'KA-22-XY-9876', type: 'Four-Wheeler', category: 'Student', driver: 'Rahul Verma (Student)' }
        : { plate: 'KA-22-GH-7890', type: 'Two-Wheeler', category: 'Staff', driver: 'Ramesh Gowda (Staff)' };

      setLiveScanModal({
        camId: `${gateCategory} Gate — Camera Ingress`,
        gateCategory,
        direction,
        plate: wrongVehicle.plate,
        type: wrongVehicle.type,
        driver: wrongVehicle.driver,
        category: wrongVehicle.category,
        step: 'scanning'
      });

      setTimeout(() => {
        playSound('beep', soundEnabled);
        setLiveScanModal(prev => prev ? { ...prev, step: 'recognizing' } : null);
      }, 600);

      setTimeout(() => {
        const res = checkInVehicle({
          vehicleNumber: wrongVehicle.plate,
          type: wrongVehicle.type,
          category: wrongVehicle.category,
          driver: wrongVehicle.driver,
          gate: gateCategory
        });

        playSound('alert', soundEnabled);
        const alertData = {
          vehicleNumber: wrongVehicle.plate,
          category: wrongVehicle.category,
          attemptedGate: `${gateCategory} Gate`,
          correctGate: wrongVehicle.category === 'Student' ? 'Student Gate (Gate 1)' : wrongVehicle.category === 'Staff' ? 'Staff Gate (Gate 2)' : 'Visitor Gate (Gate 3)',
          message: res.message || `⚠ WRONG GATE: ${wrongVehicle.plate} (${wrongVehicle.category}) attempted entry at ${gateCategory} Gate. Access Denied.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
        };
        setWrongGateAlert(alertData);

        setLiveScanModal(prev => prev ? {
          ...prev,
          step: 'error',
          isWrongGate: true,
          message: alertData.message
        } : null);

        setTimeout(() => setLiveScanModal(null), 3500);
      }, 1400);
      return;
    }

    if (direction === 'Entry') {
      const parkedPlates = new Set(slots.filter(s => s.occupied).map(s => s.vehicleNumber));
      let pool = [];
      if (gateCategory === 'Student') {
        pool = [
          { plate: 'KA-22-PQ-9988', type: 'Two-Wheeler', category: 'Student', driver: 'Aditi Deshmukh' },
          { plate: 'KA-22-CD-3456', type: 'Four-Wheeler', category: 'Student', driver: 'Neha Kulkarni' },
          { plate: 'KA-22-XY-9876', type: 'Four-Wheeler', category: 'Student', driver: 'Rahul Verma' }
        ];
      } else if (gateCategory === 'Staff') {
        pool = [
          { plate: 'KA-22-GH-7890', type: 'Two-Wheeler', category: 'Staff', driver: 'Prof. Arvind Rao' },
          { plate: 'KA-22-MN-5566', type: 'Four-Wheeler', category: 'Staff', driver: 'Dr. Meena Joshi' },
          { plate: 'KA-22-AB-1234', type: 'Two-Wheeler', category: 'Staff', driver: 'Dr. S. N. Patil' }
        ];
      } else {
        pool = [
          { plate: `KA-22-ZZ-${Math.floor(1000 + Math.random() * 8999)}`, type: 'Four-Wheeler', category: 'Visitor', driver: 'Campus Guest / Visitor' },
          { plate: `KA-22-EV-${Math.floor(1000 + Math.random() * 8999)}`, type: 'Two-Wheeler', category: 'Visitor', driver: 'Guest Courier' }
        ];
      }

      const vehicle = pool.find(v => !parkedPlates.has(v.plate)) || pool[0];

      setLiveScanModal({
        camId: `${gateCategory} Gate — Entry Camera`,
        gateCategory,
        direction: 'Entry',
        plate: vehicle.plate,
        type: vehicle.type,
        driver: vehicle.driver,
        category: vehicle.category,
        step: 'scanning'
      });

      setTimeout(() => {
        playSound('beep', soundEnabled);
        setLiveScanModal(prev => prev ? { ...prev, step: 'recognizing' } : null);
      }, 600);

      setTimeout(() => {
        const res = checkInVehicle({
          vehicleNumber: vehicle.plate,
          type: vehicle.type,
          category: vehicle.category,
          driver: vehicle.driver,
          gate: gateCategory
        });

        if (res.success) {
          playSound('success', soundEnabled);
          setLiveScanModal(prev => prev ? {
            ...prev,
            step: 'complete',
            slotAssigned: res.slotAssigned || 'F-02',
            message: `✓ Valid ${gateCategory} Gate Access • Slot ${res.slotAssigned} Assigned • Barrier OPENED`
          } : null);
        } else {
          playSound('alert', soundEnabled);
          setLiveScanModal(prev => prev ? {
            ...prev,
            step: 'error',
            message: res.message || 'Check-In Denied'
          } : null);
        }

        setTimeout(() => setLiveScanModal(null), 2500);
      }, 1400);

    } else {
      // Exit gate direction
      const matchingParked = slots.filter(s => s.occupied && (gateCategory === 'Visitor' ? s.category === 'Visitor' : s.category === gateCategory));
      const targetSlot = matchingParked.length > 0
        ? matchingParked[Math.floor(Math.random() * matchingParked.length)]
        : slots.find(s => s.occupied);

      if (!targetSlot) {
        playSound('alert', soundEnabled);
        alert(`No parked ${gateCategory} vehicles currently available to exit.`);
        return;
      }

      setLiveScanModal({
        camId: `${gateCategory} Gate — Exit Camera`,
        gateCategory,
        direction: 'Exit',
        plate: targetSlot.vehicleNumber,
        type: targetSlot.type,
        driver: targetSlot.driver || `${gateCategory} Member`,
        category: targetSlot.category || gateCategory,
        step: 'scanning'
      });

      setTimeout(() => {
        playSound('beep', soundEnabled);
        setLiveScanModal(prev => prev ? { ...prev, step: 'recognizing' } : null);
      }, 600);

      setTimeout(() => {
        const res = checkOutVehicle({
          vehicleNumber: targetSlot.vehicleNumber,
          slotId: targetSlot.id,
          fee: targetSlot.category === 'Visitor' ? 40 : 0,
          duration: '2 Hours 15m',
          gate: gateCategory
        });

        if (res.success) {
          playSound('success', soundEnabled);
          setLiveScanModal(prev => prev ? {
            ...prev,
            step: 'complete',
            message: `✓ Valid ${gateCategory} Gate Egress • Slot Released • Barrier OPENED`
          } : null);
        } else {
          playSound('alert', soundEnabled);
          setLiveScanModal(prev => prev ? {
            ...prev,
            step: 'error',
            message: res.message || 'Check-Out Denied'
          } : null);
        }

        setTimeout(() => setLiveScanModal(null), 2500);
      }, 1400);
    }
  };

  // Backwards compatible wrapper
  const handleTriggerCctvDetection = (cameraNumber = 1) => {
    if (cameraNumber === 1) {
      handleTriggerGateCctv('Student', 'Entry');
    } else {
      handleTriggerGateCctv('Staff', 'Exit');
    }
  };

  // Slot click handler: updates selected state and opens inspector
  const handleSlotClick = (slot) => {
    setSelectedSlotId(slot.id);
    setInspectItem({ type: 'slot', data: slot });
  };

  // Filter zones
  const twoWheelerSlots = slots.filter(s => s.zone === 'two-wheeler');
  const fourWheelerSlots = slots.filter(s => s.zone === 'four-wheeler');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '30px' }}>
      
      {/* 1. TOP STAT METRICS ROW & AI STATUS CARD */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '14px'
      }}>
        {/* Total Slots: 15 */}
        <div className="glass-panel" style={{
          padding: '16px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(59, 130, 246, 0.4)',
            flexShrink: 0
          }}>
            <span style={{ fontSize: '20px', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>P</span>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Total Slots</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)', lineHeight: '1.1' }}>
              {metrics.totalSlots}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '3px' }}>
              {metrics.twoWheelersTotal} Two-Wheeler | {metrics.fourWheelersTotal} Four-Wheeler{metrics.customZonesTotal > 0 ? ` | ${metrics.customZonesTotal} Custom` : ''}
            </div>
          </div>
        </div>

        {/* Occupied */}
        <div className="glass-panel" style={{
          padding: '16px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          position: 'relative'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #991B1B 0%, #EF4444 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(239, 68, 68, 0.4)',
            flexShrink: 0
          }}>
            <Car size={22} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Occupied</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)', lineHeight: '1.1' }}>
              {metrics.occupied}
            </div>
            <div style={{
              fontSize: '10.5px',
              color: '#F87171',
              marginTop: '3px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontWeight: 600
            }}>
              <span>↑ 2 today</span>
            </div>
          </div>
        </div>

        {/* Available */}
        <div className="glass-panel" style={{
          padding: '16px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          position: 'relative'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #065F46 0%, #10B981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)',
            flexShrink: 0
          }}>
            <ParkingSquare size={22} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Available</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)', lineHeight: '1.1' }}>
              {metrics.available}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--green-bright)', marginTop: '3px', fontWeight: 600 }}>
              {metrics.freePercent}% Free
            </div>
          </div>
        </div>

        {/* Today's Vehicles */}
        <div className="glass-panel" style={{
          padding: '16px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #5B21B6 0%, #8B5CF6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(139, 92, 246, 0.4)',
            flexShrink: 0
          }}>
            <Bike size={22} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Today's Vehicles</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)', lineHeight: '1.1' }}>
              {metrics.todayVehicles}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '3px' }}>
              {metrics.todayEntries} Entry | {metrics.todayExits} Exit
            </div>
          </div>
        </div>

        {/* Today's Collection */}
        <div className="glass-panel" style={{
          padding: '16px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #B45309 0%, #F59E0B 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(245, 158, 11, 0.4)',
            flexShrink: 0
          }}>
            <CircleDollarSign size={22} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Today's Collection</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)', lineHeight: '1.1' }}>
              ₹{metrics.todayCollection}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--orange-bright)', marginTop: '3px', fontWeight: 600 }}>
              +20% Vs Yesterday
            </div>
          </div>
        </div>

        {/* AI System Status Card */}
        <div className="glass-panel glass-panel-neon-purple" style={{
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'linear-gradient(135deg, rgba(20, 24, 48, 0.8) 0%, rgba(13, 17, 34, 0.9) 100%)'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #8B5CF6 0%, #4C1D95 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.6)',
            flexShrink: 0,
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}>
            <span style={{ fontSize: '16px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.05em' }}>AI</span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>AI System</span>
              <span style={{
                fontSize: '9.5px',
                padding: '1px 5px',
                borderRadius: '10px',
                background: pipelineMode === 'SIMULATION' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: pipelineMode === 'SIMULATION' ? 'var(--orange-bright)' : 'var(--green-bright)',
                border: pipelineMode === 'SIMULATION' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
                fontWeight: 600
              }}>
                {pipelineMode === 'SIMULATION' ? '● Simulation (Demo)' : '● Live Pipeline'}
              </span>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5px',
              fontSize: '8.5px',
              color: 'var(--text-muted)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Check size={10} color={pipelineMode === 'SIMULATION' ? 'var(--orange-bright)' : 'var(--green-bright)'} strokeWidth={3} />
                <span>{pipelineMode === 'SIMULATION' ? 'Simulated CCTV Feeds' : 'CCTV Connected'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Check size={10} color={pipelineMode === 'SIMULATION' ? 'var(--orange-bright)' : 'var(--green-bright)'} strokeWidth={3} />
                <span>{pipelineMode === 'SIMULATION' ? 'YOLO Arch (Demo Mode)' : 'Vehicle Detection'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Check size={10} color={pipelineMode === 'SIMULATION' ? 'var(--orange-bright)' : 'var(--green-bright)'} strokeWidth={3} />
                <span>{pipelineMode === 'SIMULATION' ? 'ANPR OCR (Demo Mode)' : 'Number Plate Recognition'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Check size={10} color="var(--green-bright)" strokeWidth={3} />
                <span>Slot Tracking Active</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Check size={10} color="var(--green-bright)" strokeWidth={3} />
                <span>Automatic Logging Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Disclosure Notice Banner */}
      {pipelineMode === 'SIMULATION' && (
        <div style={{
          padding: '8px 14px',
          borderRadius: '8px',
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px',
          color: '#FEF3C7'
        }}>
          <span style={{ fontSize: '13px' }}>🧪</span>
          <span>
            <strong style={{ color: 'var(--orange-bright)' }}>Simulation Mode Active:</strong> Camera detections below are generated from predefined simulation events for demonstration. Real YOLOv8 and EasyOCR models can be connected via the backend architecture.
          </span>
        </div>
      )}

      {/* WRONG GATE SECURITY ALERT BANNER */}
      {wrongGateAlert && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '10px',
          background: 'linear-gradient(90deg, rgba(153, 27, 27, 0.4) 0%, rgba(220, 38, 38, 0.22) 100%)',
          border: '1.5px solid #EF4444',
          boxShadow: '0 0 24px rgba(239, 68, 68, 0.35)',
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
                  SECURITY DENIAL
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  {wrongGateAlert.time}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#FEF2F2', marginTop: '3px' }}>
                Vehicle <strong style={{ color: '#FCA5A5', fontFamily: 'var(--font-mono)' }}>{wrongGateAlert.vehicleNumber}</strong> ({wrongGateAlert.category}) attempted entry at <strong style={{ color: '#FCA5A5' }}>{wrongGateAlert.attemptedGate}</strong>. Dedicated Access Gate: <strong style={{ color: '#6EE7B7' }}>{wrongGateAlert.correctGate}</strong>. Entry barrier remains LOCKED.
              </div>
            </div>
          </div>
          <button
            onClick={() => setWrongGateAlert(null)}
            className="btn-ghost"
            style={{ fontSize: '11px', padding: '4px 10px', color: '#FCA5A5', borderColor: 'rgba(239, 68, 68, 0.4)' }}
          >
            Dismiss Alert
          </button>
        </div>
      )}

      {/* 2. DEDICATED CAMPUS GATE MONITORING SECTION (Student Gate, Staff Gate, Visitor Gate) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
              Campus Gate Monitoring — 3 Dedicated Category Gates
            </h2>
            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Dedicated Optical Access Control: Gate 1 (Students) • Gate 2 (Staff & Faculty) • Gate 3 (Visitors & Guests)
            </p>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => handleTriggerGateCctv('Student', 'Entry', true)}
              className="btn-ghost"
              style={{
                fontSize: '10.5px',
                padding: '4px 10px',
                color: '#F87171',
                borderColor: 'rgba(239, 68, 68, 0.4)',
                background: 'rgba(239, 68, 68, 0.1)'
              }}
              title="Simulate Staff car arriving at Student Gate to test security rejection"
            >
              <AlertTriangle size={12} />
              <span>Test Wrong Gate Detection</span>
            </button>
          </div>
        </div>

        {/* 3 Gate Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          
          {/* GATE 1: STUDENT GATE */}
          <div className="glass-panel" style={{
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            border: '1px solid rgba(58, 134, 255, 0.35)',
            background: 'linear-gradient(145deg, rgba(13, 20, 42, 0.85) 0%, rgba(9, 14, 28, 0.9) 100%)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '5px',
                  background: 'rgba(58, 134, 255, 0.25)',
                  color: 'var(--blue-hover)',
                  border: '1px solid rgba(58, 134, 255, 0.5)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  GATE 1
                </span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
                  STUDENT GATE
                </span>
              </div>
              <span style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: 'var(--green-bright)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green-bright)', boxShadow: '0 0 6px var(--green-bright)' }} />
                Online
              </span>
            </div>

            {/* Cameras status bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              borderRadius: '6px',
              background: 'rgba(5, 8, 17, 0.6)',
              fontSize: '10px',
              color: 'var(--text-muted)'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Video size={11} color="var(--blue-hover)" />
                Entry Cam: <strong style={{ color: 'var(--green-bright)' }}>🟢 Connected</strong>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Video size={11} color="var(--blue-hover)" />
                Exit Cam: <strong style={{ color: 'var(--green-bright)' }}>🟢 Connected</strong>
              </span>
            </div>

            {/* Ingress / Egress Counts */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
              padding: '8px 10px',
              background: 'rgba(58, 134, 255, 0.06)',
              borderRadius: '8px',
              border: '1px solid rgba(58, 134, 255, 0.15)',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>Entry Today</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
                  {gateStats.Student?.entryCount ?? 12}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.08)', borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>Exit Today</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
                  {gateStats.Student?.exitCount ?? 8}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '9.5px', color: 'var(--cyan-primary)' }}>On Campus</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cyan-primary)', fontFamily: 'var(--font-heading)' }}>
                  {gateStats.Student?.currentCount ?? 4}
                </div>
              </div>
            </div>

            {/* Recent Detection Detail */}
            <div style={{
              padding: '10px',
              borderRadius: '8px',
              background: 'rgba(5, 8, 17, 0.7)',
              border: '1px solid rgba(58, 134, 255, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '9.5px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Recent Detection
                </span>
                <span style={{
                  fontSize: '9px',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--green-bright)',
                  fontWeight: 700
                }}>
                  ✓ Valid Student Gate Access
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="plate-badge" style={{ fontSize: '12px', padding: '2px 8px' }}>
                  {gateStats.Student?.recentDetection?.vehicleNumber || 'KA-22-XY-9876'}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {gateStats.Student?.recentDetection?.vehicleType || 'Four-Wheeler'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-dim)' }}>
                <span>Role: <strong style={{ color: '#FFFFFF' }}>Student</strong> • Direction: <strong style={{ color: '#FFFFFF' }}>{gateStats.Student?.recentDetection?.direction || 'Entry'}</strong></span>
                <span>Slot: <strong style={{ color: 'var(--cyan-primary)', fontFamily: 'var(--font-mono)' }}>{gateStats.Student?.recentDetection?.slot || 'F-02'}</strong></span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
              <button
                onClick={() => {
                  setActiveGateFilter('Student');
                  setSelectedGatePreview('Student');
                  setCurrentTab('cctv');
                }}
                className="btn-ghost"
                style={{ flex: 1, fontSize: '10.5px', padding: '5px 8px', justifyContent: 'center' }}
              >
                <Video size={12} color="var(--blue-hover)" />
                <span>View Live Cameras</span>
              </button>
              <button
                onClick={() => handleTriggerGateCctv('Student', 'Entry')}
                className="btn-primary"
                style={{ fontSize: '10.5px', padding: '5px 8px' }}
                title="Simulate Student Entry"
              >
                <Zap size={12} />
                <span>Auto-Entry</span>
              </button>
              <button
                onClick={() => handleTriggerGateCctv('Student', 'Exit')}
                className="btn-ghost"
                style={{ fontSize: '10.5px', padding: '5px 8px' }}
                title="Simulate Student Exit"
              >
                <span>Auto-Exit</span>
              </button>
            </div>
          </div>

          {/* GATE 2: STAFF GATE */}
          <div className="glass-panel" style={{
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            border: '1px solid rgba(139, 92, 246, 0.35)',
            background: 'linear-gradient(145deg, rgba(22, 16, 42, 0.85) 0%, rgba(12, 10, 28, 0.9) 100%)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '5px',
                  background: 'rgba(139, 92, 246, 0.25)',
                  color: 'var(--purple-bright)',
                  border: '1px solid rgba(139, 92, 246, 0.5)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  GATE 2
                </span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
                  STAFF GATE
                </span>
              </div>
              <span style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: 'var(--green-bright)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green-bright)', boxShadow: '0 0 6px var(--green-bright)' }} />
                Online
              </span>
            </div>

            {/* Cameras status bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              borderRadius: '6px',
              background: 'rgba(5, 8, 17, 0.6)',
              fontSize: '10px',
              color: 'var(--text-muted)'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Video size={11} color="var(--purple-bright)" />
                Entry Cam: <strong style={{ color: 'var(--green-bright)' }}>🟢 Connected</strong>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Video size={11} color="var(--purple-bright)" />
                Exit Cam: <strong style={{ color: 'var(--green-bright)' }}>🟢 Connected</strong>
              </span>
            </div>

            {/* Ingress / Egress Counts */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
              padding: '8px 10px',
              background: 'rgba(139, 92, 246, 0.06)',
              borderRadius: '8px',
              border: '1px solid rgba(139, 92, 246, 0.15)',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>Entry Today</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
                  {gateStats.Staff?.entryCount ?? 8}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.08)', borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>Exit Today</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
                  {gateStats.Staff?.exitCount ?? 5}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '9.5px', color: 'var(--purple-bright)' }}>On Campus</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--purple-bright)', fontFamily: 'var(--font-heading)' }}>
                  {gateStats.Staff?.currentCount ?? 3}
                </div>
              </div>
            </div>

            {/* Recent Detection Detail */}
            <div style={{
              padding: '10px',
              borderRadius: '8px',
              background: 'rgba(5, 8, 17, 0.7)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '9.5px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Recent Detection
                </span>
                <span style={{
                  fontSize: '9px',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--green-bright)',
                  fontWeight: 700
                }}>
                  ✓ Valid Staff Gate Access
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="plate-badge" style={{ fontSize: '12px', padding: '2px 8px' }}>
                  {gateStats.Staff?.recentDetection?.vehicleNumber || 'KA-22-AB-1234'}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {gateStats.Staff?.recentDetection?.vehicleType || 'Two-Wheeler'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-dim)' }}>
                <span>Role: <strong style={{ color: '#FFFFFF' }}>Staff / Faculty</strong> • Direction: <strong style={{ color: '#FFFFFF' }}>{gateStats.Staff?.recentDetection?.direction || 'Exit'}</strong></span>
                <span>Slot: <strong style={{ color: 'var(--purple-bright)', fontFamily: 'var(--font-mono)' }}>{gateStats.Staff?.recentDetection?.slot || 'T-05'}</strong></span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
              <button
                onClick={() => {
                  setActiveGateFilter('Staff');
                  setSelectedGatePreview('Staff');
                  setCurrentTab('cctv');
                }}
                className="btn-ghost"
                style={{ flex: 1, fontSize: '10.5px', padding: '5px 8px', justifyContent: 'center' }}
              >
                <Video size={12} color="var(--purple-bright)" />
                <span>View Live Cameras</span>
              </button>
              <button
                onClick={() => handleTriggerGateCctv('Staff', 'Entry')}
                className="btn-primary"
                style={{ fontSize: '10.5px', padding: '5px 8px', background: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)' }}
                title="Simulate Staff Entry"
              >
                <Zap size={12} />
                <span>Auto-Entry</span>
              </button>
              <button
                onClick={() => handleTriggerGateCctv('Staff', 'Exit')}
                className="btn-ghost"
                style={{ fontSize: '10.5px', padding: '5px 8px' }}
                title="Simulate Staff Exit"
              >
                <span>Auto-Exit</span>
              </button>
            </div>
          </div>

          {/* GATE 3: VISITOR GATE */}
          <div className="glass-panel" style={{
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            background: 'linear-gradient(145deg, rgba(8, 24, 20, 0.85) 0%, rgba(6, 16, 14, 0.9) 100%)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '5px',
                  background: 'rgba(16, 185, 129, 0.25)',
                  color: 'var(--green-bright)',
                  border: '1px solid rgba(16, 185, 129, 0.5)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  GATE 3
                </span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
                  VISITOR GATE
                </span>
              </div>
              <span style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: 'var(--green-bright)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green-bright)', boxShadow: '0 0 6px var(--green-bright)' }} />
                Online
              </span>
            </div>

            {/* Cameras status bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              borderRadius: '6px',
              background: 'rgba(5, 8, 17, 0.6)',
              fontSize: '10px',
              color: 'var(--text-muted)'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Video size={11} color="var(--green-bright)" />
                Entry Cam: <strong style={{ color: 'var(--green-bright)' }}>🟢 Connected</strong>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Video size={11} color="var(--green-bright)" />
                Exit Cam: <strong style={{ color: 'var(--green-bright)' }}>🟢 Connected</strong>
              </span>
            </div>

            {/* Ingress / Egress Counts */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
              padding: '8px 10px',
              background: 'rgba(16, 185, 129, 0.06)',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.15)',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>Entry Today</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
                  {gateStats.Visitor?.entryCount ?? 6}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.08)', borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>Exit Today</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
                  {gateStats.Visitor?.exitCount ?? 4}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '9.5px', color: 'var(--green-bright)' }}>On Campus</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--green-bright)', fontFamily: 'var(--font-heading)' }}>
                  {gateStats.Visitor?.currentCount ?? 2}
                </div>
              </div>
            </div>

            {/* Recent Detection Detail */}
            <div style={{
              padding: '10px',
              borderRadius: '8px',
              background: 'rgba(5, 8, 17, 0.7)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '9.5px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Recent Detection
                </span>
                <span style={{
                  fontSize: '9px',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--green-bright)',
                  fontWeight: 700
                }}>
                  ✓ Valid Visitor Gate Access
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="plate-badge" style={{ fontSize: '12px', padding: '2px 8px' }}>
                  {gateStats.Visitor?.recentDetection?.vehicleNumber || 'KA-22-ZZ-4400'}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {gateStats.Visitor?.recentDetection?.vehicleType || 'Four-Wheeler'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-dim)' }}>
                <span>Role: <strong style={{ color: '#FFFFFF' }}>Visitor / Guest Pass</strong> • Direction: <strong style={{ color: '#FFFFFF' }}>{gateStats.Visitor?.recentDetection?.direction || 'Entry'}</strong></span>
                <span>Tariff: <strong style={{ color: 'var(--orange-bright)', fontFamily: 'var(--font-mono)' }}>₹40 Pass</strong></span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
              <button
                onClick={() => {
                  setActiveGateFilter('Visitor');
                  setSelectedGatePreview('Visitor');
                  setCurrentTab('cctv');
                }}
                className="btn-ghost"
                style={{ flex: 1, fontSize: '10.5px', padding: '5px 8px', justifyContent: 'center' }}
              >
                <Video size={12} color="var(--green-bright)" />
                <span>View Live Cameras</span>
              </button>
              <button
                onClick={() => handleTriggerGateCctv('Visitor', 'Entry')}
                className="btn-primary"
                style={{ fontSize: '10.5px', padding: '5px 8px', background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)' }}
                title="Simulate Visitor Entry"
              >
                <Zap size={12} />
                <span>Auto-Entry</span>
              </button>
              <button
                onClick={() => handleTriggerGateCctv('Visitor', 'Exit')}
                className="btn-ghost"
                style={{ fontSize: '10.5px', padding: '5px 8px' }}
                title="Simulate Visitor Exit"
              >
                <span>Auto-Exit</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 3. LIVE CCTV MONITORING & RECENT DETECTION */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.6fr 1fr',
        gap: '16px'
      }}>
        {/* Left: Live CCTV Monitoring Grid with Gate Switcher Tabs */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
                Live CCTV Monitoring
              </h2>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--red-bright)',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                padding: '2px 8px',
                borderRadius: '12px'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--red-bright)',
                  animation: 'pulseGlow 1.5s infinite ease-in-out'
                }} />
                Live 6 Streams
              </span>
            </div>

            {/* Quick Gate CCTV Switcher Tabs */}
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(5, 8, 17, 0.6)', padding: '2px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              {['all', 'Student', 'Staff', 'Visitor'].map(g => (
                <button
                  key={g}
                  onClick={() => setSelectedGatePreview(g)}
                  style={{
                    padding: '3px 9px',
                    borderRadius: '6px',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: selectedGatePreview === g ? 'var(--cyan-glow)' : 'transparent',
                    color: selectedGatePreview === g ? '#FFFFFF' : 'var(--text-muted)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {g === 'all' ? 'All Gates' : `${g} Gate`}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setCurrentTab('cctv')}
                className="btn-ghost"
                style={{ fontSize: '11px', padding: '5px 10px' }}
              >
                <Maximize2 size={13} />
                <span>Video Wall</span>
              </button>
            </div>
          </div>

          {/* Camera Feed Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            
            {/* Camera Card 1: Entry Camera for selected gate */}
            <div style={{
              background: '#040711',
              borderRadius: '12px',
              border: selectedGatePreview === 'Staff' ? '1px solid rgba(139, 92, 246, 0.4)' : selectedGatePreview === 'Visitor' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(0, 240, 255, 0.4)',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* Header Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 10px',
                background: 'rgba(5, 8, 17, 0.9)',
                fontSize: '11px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FFFFFF', fontWeight: 600 }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--red-bright)',
                    boxShadow: '0 0 6px var(--red-bright)'
                  }} />
                  <Video size={13} color="var(--cyan-primary)" />
                  <span>
                    {selectedGatePreview === 'Staff' ? 'Staff Gate — Entry Camera (Gate 2)' : selectedGatePreview === 'Visitor' ? 'Visitor Gate — Entry Camera (Gate 3)' : 'Student Gate — Entry Camera (Gate 1)'}
                  </span>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                  {formattedTimestamp}
                </span>
              </div>

              {/* Feed Image Container with Detection Bounding Box */}
              <div style={{ position: 'relative', height: '185px', overflow: 'hidden' }}>
                <img
                  src="/camera_1_feed.png"
                  alt="Entry Gate CCTV Feed"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* Provenance Badge */}
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  background: pipelineMode === 'SIMULATION' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(0, 240, 255, 0.25)',
                  border: pipelineMode === 'SIMULATION' ? '1px solid rgba(245, 158, 11, 0.7)' : '1px solid rgba(0, 240, 255, 0.6)',
                  borderRadius: '5px',
                  padding: '2px 7px',
                  fontSize: '9px',
                  fontWeight: 800,
                  color: pipelineMode === 'SIMULATION' ? 'var(--orange-bright)' : 'var(--cyan-primary)',
                  fontFamily: 'var(--font-mono)',
                  backdropFilter: 'blur(4px)',
                  zIndex: 4
                }}>
                  {selectedGatePreview === 'Staff' ? 'GATE 2 • STAFF' : selectedGatePreview === 'Visitor' ? 'GATE 3 • VISITOR' : 'GATE 1 • STUDENT'}
                </div>

                {/* Laser scan line effect */}
                {cctvScanning && (
                  <div style={{
                    position: 'absolute',
                    left: '15%',
                    right: '15%',
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, #00F0FF, transparent)',
                    boxShadow: '0 0 10px #00F0FF',
                    animation: 'scanLaser 2.5s infinite linear'
                  }} />
                )}

                {/* Green Detection Bounding Box on Vehicle Number Plate */}
                <div style={{
                  position: 'absolute',
                  bottom: '30px',
                  left: '42%',
                  width: '68px',
                  height: '24px',
                  border: '2px solid #00E676',
                  borderRadius: '3px',
                  boxShadow: '0 0 10px rgba(0, 230, 118, 0.7)'
                }}>
                  <span style={{
                    position: 'absolute',
                    top: '-15px',
                    left: '-2px',
                    background: '#00E676',
                    color: '#050811',
                    fontSize: '8px',
                    fontWeight: 800,
                    padding: '1px 3px',
                    borderRadius: '2px'
                  }}>
                    ANPR 99.4%
                  </span>
                </div>

                {/* Floating Bottom Detection Bar */}
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '8px',
                  right: '8px',
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    background: 'rgba(5, 8, 17, 0.92)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(0, 230, 118, 0.5)',
                    borderRadius: '6px',
                    padding: '4px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 0 12px rgba(0, 230, 118, 0.3)'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00E676' }} />
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#FFFFFF'
                    }}>
                      {selectedGatePreview === 'Staff' ? 'KA-22-MN-5566' : selectedGatePreview === 'Visitor' ? 'KA-22-ZZ-4400' : 'KA-22-XY-9876'}
                    </span>
                    <span style={{ color: 'var(--text-dim)', fontSize: '10px' }}>|</span>
                    <span style={{ fontSize: '10px', color: '#00E676', fontWeight: 600 }}>
                      {selectedGatePreview === 'Staff' ? 'Staff Ingress Verified' : selectedGatePreview === 'Visitor' ? 'Visitor Ingress Logged' : 'Student Ingress Verified'}
                    </span>
                  </div>
                </div>

                {/* CCTV Action Overlay Button */}
                <button
                  onClick={() => handleTriggerGateCctv(selectedGatePreview === 'all' ? 'Student' : selectedGatePreview, 'Entry')}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(0, 240, 255, 0.2)',
                    border: '1px solid rgba(0, 240, 255, 0.4)',
                    borderRadius: '6px',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    backdropFilter: 'blur(4px)'
                  }}
                  title="Trigger optical check-in at this gate"
                >
                  <Zap size={11} color="var(--cyan-primary)" />
                  <span>Scan Ingress</span>
                </button>
              </div>
            </div>

            {/* Camera Card 2: Exit Camera for selected gate */}
            <div style={{
              background: '#040711',
              borderRadius: '12px',
              border: selectedGatePreview === 'Staff' ? '1px solid rgba(139, 92, 246, 0.4)' : selectedGatePreview === 'Visitor' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(58, 134, 255, 0.4)',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* Header Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 10px',
                background: 'rgba(5, 8, 17, 0.9)',
                fontSize: '11px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FFFFFF', fontWeight: 600 }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--red-bright)',
                    boxShadow: '0 0 6px var(--red-bright)'
                  }} />
                  <Video size={13} color="var(--blue-hover)" />
                  <span>
                    {selectedGatePreview === 'Staff' ? 'Staff Gate — Exit Camera (Gate 2)' : selectedGatePreview === 'Visitor' ? 'Visitor Gate — Exit Camera (Gate 3)' : 'Student Gate — Exit Camera (Gate 1)'}
                  </span>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                  {formattedTimestamp}
                </span>
              </div>

              {/* Feed Image Container with Detection Bounding Box */}
              <div style={{ position: 'relative', height: '185px', overflow: 'hidden' }}>
                <img
                  src="/camera_2_feed.png"
                  alt="Exit Gate CCTV Feed"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* Provenance Badge */}
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  background: pipelineMode === 'SIMULATION' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(58, 134, 255, 0.25)',
                  border: pipelineMode === 'SIMULATION' ? '1px solid rgba(245, 158, 11, 0.7)' : '1px solid rgba(58, 134, 255, 0.6)',
                  borderRadius: '5px',
                  padding: '2px 7px',
                  fontSize: '9px',
                  fontWeight: 800,
                  color: pipelineMode === 'SIMULATION' ? 'var(--orange-bright)' : 'var(--blue-hover)',
                  fontFamily: 'var(--font-mono)',
                  backdropFilter: 'blur(4px)',
                  zIndex: 4
                }}>
                  {selectedGatePreview === 'Staff' ? 'GATE 2 • STAFF' : selectedGatePreview === 'Visitor' ? 'GATE 3 • VISITOR' : 'GATE 1 • STUDENT'}
                </div>

                {/* Laser scan line effect */}
                {cctvScanning && (
                  <div style={{
                    position: 'absolute',
                    left: '20%',
                    right: '20%',
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, #3A86FF, transparent)',
                    boxShadow: '0 0 10px #3A86FF',
                    animation: 'scanLaser 2.2s infinite linear'
                  }} />
                )}

                {/* Green Detection Bounding Box on Scooter Number Plate */}
                <div style={{
                  position: 'absolute',
                  bottom: '38px',
                  left: '44%',
                  width: '56px',
                  height: '24px',
                  border: '2px solid #00E676',
                  borderRadius: '3px',
                  boxShadow: '0 0 10px rgba(0, 230, 118, 0.7)'
                }}>
                  <span style={{
                    position: 'absolute',
                    top: '-15px',
                    left: '-2px',
                    background: '#00E676',
                    color: '#050811',
                    fontSize: '8px',
                    fontWeight: 800,
                    padding: '1px 3px',
                    borderRadius: '2px'
                  }}>
                    ANPR 98.8%
                  </span>
                </div>

                {/* Floating Bottom Detection Bar */}
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '8px',
                  right: '8px',
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    background: 'rgba(5, 8, 17, 0.92)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(0, 230, 118, 0.5)',
                    borderRadius: '6px',
                    padding: '4px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 0 12px rgba(0, 230, 118, 0.3)'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00E676' }} />
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#FFFFFF'
                    }}>
                      {selectedGatePreview === 'Staff' ? 'KA-22-AB-1234' : selectedGatePreview === 'Visitor' ? 'KA-22-EF-9012' : 'KA-22-CD-3456'}
                    </span>
                    <span style={{ color: 'var(--text-dim)', fontSize: '10px' }}>|</span>
                    <span style={{ fontSize: '10px', color: '#00E676', fontWeight: 600 }}>
                      {selectedGatePreview === 'Staff' ? 'Staff Egress Verified' : selectedGatePreview === 'Visitor' ? 'Visitor Egress Cleared' : 'Student Egress Verified'}
                    </span>
                  </div>
                </div>

                {/* CCTV Action Overlay Button */}
                <button
                  onClick={() => handleTriggerGateCctv(selectedGatePreview === 'all' ? 'Student' : selectedGatePreview, 'Exit')}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(58, 134, 255, 0.25)',
                    border: '1px solid rgba(58, 134, 255, 0.45)',
                    borderRadius: '6px',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    backdropFilter: 'blur(4px)'
                  }}
                  title="Trigger optical check-out at this gate"
                >
                  <Zap size={11} color="var(--blue-hover)" />
                  <span>Scan Egress</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Recent Detection (Auto Check-In & Auto Check-Out) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Card 1: Recent Detection (Auto Check-In) */}
          <div className="glass-panel" style={{
            padding: '12px 14px',
            background: 'linear-gradient(135deg, rgba(13, 20, 36, 0.8) 0%, rgba(10, 25, 45, 0.75) 100%)',
            border: '1px solid rgba(0, 240, 255, 0.25)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
                Recent Detection (Auto Check-In)
              </span>
              <button
                onClick={() => setCurrentTab('checkin')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--cyan-primary)',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  cursor: 'pointer'
                }}
              >
                View All <ArrowRight size={12} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{
                width: '80px',
                height: '75px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid rgba(0, 240, 255, 0.4)',
                boxShadow: '0 0 10px rgba(0, 240, 255, 0.2)',
                background: '#020617',
                flexShrink: 0
              }}>
                <img
                  src={recentDetections.checkIn.thumb}
                  alt="Vehicle Image"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13.5px',
                    fontWeight: 800,
                    color: '#FFFFFF'
                  }}>
                    {recentDetections.checkIn.plate}
                  </span>
                  <span style={{
                    fontSize: '9.5px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(0, 240, 255, 0.15)',
                    color: 'var(--cyan-primary)',
                    border: '1px solid rgba(0, 240, 255, 0.35)'
                  }}>
                    AUTO CHECK-IN
                  </span>
                  {pipelineMode === 'SIMULATION' && (
                    <span style={{
                      fontSize: '8.5px',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: 'rgba(245, 158, 11, 0.18)',
                      color: 'var(--orange-bright)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      DEMO
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <Car size={13} color="var(--cyan-primary)" />
                  <span>{recentDetections.checkIn.type}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <User size={13} color="var(--purple-bright)" />
                  <span>{recentDetections.checkIn.category}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-dim)' }}>
                  <Clock size={13} />
                  <span>{recentDetections.checkIn.time}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#FFFFFF', fontWeight: 600 }}>
                  <ParkingSquare size={13} color="var(--cyan-primary)" />
                  <span>Slot Assigned: <span style={{ color: 'var(--cyan-primary)', fontFamily: 'var(--font-mono)' }}>{recentDetections.checkIn.slotAssigned}</span></span>
                </div>
              </div>
            </div>

            {/* Bottom Status Banner */}
            <div style={{
              marginTop: '10px',
              padding: '6px 12px',
              borderRadius: '6px',
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
              <span>{recentDetections.checkIn.status}</span>
            </div>

            {pipelineMode === 'SIMULATION' && (
              <div style={{ fontSize: '9px', color: 'var(--text-dim)', textAlign: 'center', marginTop: '6px' }}>
                * Predefined simulation event for demonstration. Live YOLO+ANPR model not connected.
              </div>
            )}
          </div>

          {/* Card 2: Recent Detection (Auto Check-Out) */}
          <div className="glass-panel" style={{
            padding: '12px 14px',
            background: 'linear-gradient(135deg, rgba(13, 20, 36, 0.8) 0%, rgba(15, 20, 40, 0.75) 100%)',
            border: '1px solid rgba(58, 134, 255, 0.25)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
                Recent Detection (Auto Check-Out)
              </span>
              <button
                onClick={() => setCurrentTab('checkout')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--blue-hover)',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  cursor: 'pointer'
                }}
              >
                View All <ArrowRight size={12} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{
                width: '80px',
                height: '75px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid rgba(58, 134, 255, 0.4)',
                boxShadow: '0 0 10px rgba(58, 134, 255, 0.2)',
                background: '#020617',
                flexShrink: 0
              }}>
                <img
                  src={recentDetections.checkOut.thumb}
                  alt="Vehicle Image"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13.5px',
                    fontWeight: 800,
                    color: '#FFFFFF'
                  }}>
                    {recentDetections.checkOut.plate}
                  </span>
                  <span style={{
                    fontSize: '9.5px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(58, 134, 255, 0.18)',
                    color: '#60A5FA',
                    border: '1px solid rgba(58, 134, 255, 0.35)'
                  }}>
                    AUTO CHECK-OUT
                  </span>
                  {pipelineMode === 'SIMULATION' && (
                    <span style={{
                      fontSize: '8.5px',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: 'rgba(245, 158, 11, 0.18)',
                      color: 'var(--orange-bright)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      DEMO
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <Bike size={13} color="var(--cyan-primary)" />
                  <span>{recentDetections.checkOut.type}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <User size={13} color="var(--purple-bright)" />
                  <span>{recentDetections.checkOut.category}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-dim)' }}>
                  <Clock size={13} />
                  <span>Exit Time: {recentDetections.checkOut.time}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Duration: {recentDetections.checkOut.duration}</span>
                  <span style={{ color: 'var(--green-bright)', fontWeight: 600 }}>Amount: {recentDetections.checkOut.amount}</span>
                </div>
              </div>
            </div>

            {/* Bottom Status Banner */}
            <div style={{
              marginTop: '10px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'linear-gradient(90deg, #0284C7 0%, #06B6D4 100%)',
              color: '#FFFFFF',
              fontSize: '11.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 0 12px rgba(6, 182, 212, 0.3)'
            }}>
              <CheckCircle2 size={14} />
              <span>{recentDetections.checkOut.status}</span>
            </div>

            {pipelineMode === 'SIMULATION' && (
              <div style={{ fontSize: '9px', color: 'var(--text-dim)', textAlign: 'center', marginTop: '6px' }}>
                * Predefined simulation event for demonstration. Live YOLO+ANPR model not connected.
              </div>
            )}
          </div>

        </div>
      </div>


      {/* 3. PARKING OVERVIEW (Two-Wheeler T-01..T-10 & Four-Wheeler F-01..F-05 with Green / Red / Blue states) */}
      <div className="glass-panel" style={{ padding: '16px 20px' }}>
        {/* Header & Legend */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
            Parking Slot Overview
          </h2>

          {/* Four States: Green (Available), Red (Occupied), Blue (Selected), Yellow (Detection Pending) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#059669', boxShadow: '0 0 6px #10B981' }} />
              <span style={{ color: 'var(--green-bright)', fontWeight: 600 }}>Available (Green)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#DC2626', boxShadow: '0 0 6px #EF4444' }} />
              <span style={{ color: '#F87171', fontWeight: 600 }}>Occupied (Red)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#0284C7', boxShadow: '0 0 8px #00F0FF' }} />
              <span style={{ color: 'var(--cyan-primary)', fontWeight: 600 }}>Selected (Blue)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#D97706', boxShadow: '0 0 6px #F59E0B' }} />
              <span style={{ color: 'var(--orange-bright)', fontWeight: 600 }}>Pending (Yellow)</span>
            </div>

            <button
              onClick={() => setCurrentTab('slots')}
              className="btn-ghost"
              style={{ fontSize: '11px', padding: '3px 8px', color: 'var(--cyan-primary)', border: '1px solid rgba(0, 240, 255, 0.3)' }}
            >
              Slot Management →
            </button>
          </div>
        </div>

        {/* Zones Container */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px' }}>
          
          {/* Two-Wheeler Zone (T-01 to T-10) */}
          <div style={{
            background: 'rgba(8, 14, 28, 0.7)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '14px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  background: 'rgba(58, 134, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--cyan-primary)'
                }}>
                  <Bike size={16} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>
                  Two-Wheeler Zone (T-01 to T-10)
                </span>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#F87171',
                border: '1px solid rgba(239, 68, 68, 0.35)'
              }}>
                {metrics.twoWheelersOccupied}/10 Occupied
              </span>
            </div>

            {/* 10 Slots Grid (2 rows of 5) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '8px'
            }}>
              {twoWheelerSlots.map(slot => {
                const isSelected = selectedSlotId === slot.id;
                let bgStyle = 'linear-gradient(180deg, #065F46 0%, #064E3B 100%)';
                let borderStyle = '1px solid #10B981';
                let shadowStyle = '0 0 10px rgba(16, 185, 129, 0.2)';

                if (isSelected) {
                  bgStyle = 'linear-gradient(180deg, #0369A1 0%, #0284C7 100%)';
                  borderStyle = '2px solid #00F0FF';
                  shadowStyle = '0 0 16px rgba(0, 240, 255, 0.7)';
                } else if (slot.occupied) {
                  bgStyle = 'linear-gradient(180deg, #991B1B 0%, #7F1D1D 100%)';
                  borderStyle = '1px solid #DC2626';
                  shadowStyle = '0 0 10px rgba(220, 38, 38, 0.25)';
                }

                return (
                  <div
                    key={slot.id}
                    onClick={() => handleSlotClick(slot)}
                    style={{
                      background: bgStyle,
                      border: borderStyle,
                      borderRadius: '8px',
                      padding: '8px 4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: shadowStyle
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    title={`${slot.id}: ${slot.occupied ? `Occupied by ${slot.vehicleNumber}` : 'Available'} (Click to inspect / select)`}
                  >
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: '#FFFFFF'
                    }}>
                      {slot.id}
                    </span>
                    <Bike size={20} color="#FFFFFF" strokeWidth={2.2} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Four-Wheeler Zone (F-01 to F-05) */}
          <div style={{
            background: 'rgba(8, 14, 28, 0.7)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '14px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  background: 'rgba(0, 240, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--cyan-primary)'
                }}>
                  <Car size={16} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>
                  Four-Wheeler Zone (F-01 to F-05)
                </span>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(58, 134, 255, 0.2)',
                color: 'var(--cyan-primary)',
                border: '1px solid rgba(0, 240, 255, 0.35)'
              }}>
                {metrics.fourWheelersOccupied}/5 Occupied
              </span>
            </div>

            {/* 5 Slots Grid (Row 1: 3, Row 2: 2) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {fourWheelerSlots.slice(0, 3).map(slot => {
                  const isSelected = selectedSlotId === slot.id;
                  let bgStyle = 'linear-gradient(180deg, #065F46 0%, #064E3B 100%)';
                  let borderStyle = '1px solid #10B981';
                  let shadowStyle = '0 0 10px rgba(16, 185, 129, 0.2)';

                  if (isSelected) {
                    bgStyle = 'linear-gradient(180deg, #0369A1 0%, #0284C7 100%)';
                    borderStyle = '2px solid #00F0FF';
                    shadowStyle = '0 0 16px rgba(0, 240, 255, 0.7)';
                  } else if (slot.occupied) {
                    bgStyle = 'linear-gradient(180deg, #991B1B 0%, #7F1D1D 100%)';
                    borderStyle = '1px solid #DC2626';
                    shadowStyle = '0 0 10px rgba(220, 38, 38, 0.25)';
                  }

                  return (
                    <div
                      key={slot.id}
                      onClick={() => handleSlotClick(slot)}
                      style={{
                        background: bgStyle,
                        border: borderStyle,
                        borderRadius: '8px',
                        padding: '8px 4px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: shadowStyle
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      title={`${slot.id}: ${slot.occupied ? `Occupied by ${slot.vehicleNumber}` : 'Available'} (Click to inspect / select)`}
                    >
                      <span style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        color: '#FFFFFF'
                      }}>
                        {slot.id}
                      </span>
                      <Car size={20} color="#FFFFFF" strokeWidth={2.2} />
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {fourWheelerSlots.slice(3, 5).map(slot => {
                  const isSelected = selectedSlotId === slot.id;
                  let bgStyle = 'linear-gradient(180deg, #065F46 0%, #064E3B 100%)';
                  let borderStyle = '1px solid #10B981';
                  let shadowStyle = '0 0 10px rgba(16, 185, 129, 0.2)';

                  if (isSelected) {
                    bgStyle = 'linear-gradient(180deg, #0369A1 0%, #0284C7 100%)';
                    borderStyle = '2px solid #00F0FF';
                    shadowStyle = '0 0 16px rgba(0, 240, 255, 0.7)';
                  } else if (slot.occupied) {
                    bgStyle = 'linear-gradient(180deg, #991B1B 0%, #7F1D1D 100%)';
                    borderStyle = '1px solid #DC2626';
                    shadowStyle = '0 0 10px rgba(220, 38, 38, 0.25)';
                  }

                  return (
                    <div
                      key={slot.id}
                      onClick={() => handleSlotClick(slot)}
                      style={{
                        background: bgStyle,
                        border: borderStyle,
                        borderRadius: '8px',
                        padding: '8px 4px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: shadowStyle
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      title={`${slot.id}: ${slot.occupied ? `Occupied by ${slot.vehicleNumber}` : 'Available'} (Click to inspect / select)`}
                    >
                      <span style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        color: '#FFFFFF'
                      }}>
                        {slot.id}
                      </span>
                      <Car size={20} color="#FFFFFF" strokeWidth={2.2} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>


      {/* 4. QUICK ACTIONS & TODAY'S ACTIVITY */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '3.2fr 1fr',
        gap: '16px'
      }}>
        {/* Quick Actions (4 Buttons) */}
        <div className="glass-panel" style={{ padding: '16px 20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
            Quick Actions
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {/* Live Monitoring */}
            <button
              onClick={() => setCurrentTab('cctv')}
              style={{
                background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: '10px',
                padding: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}>
                <Video size={18} />
              </div>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#FFFFFF' }}>Live Monitoring</div>
                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)' }}>View CCTV Feed</div>
              </div>
            </button>

            {/* Register Vehicle */}
            <button
              onClick={() => setCurrentTab('checkin')}
              style={{
                background: 'linear-gradient(135deg, #065F46 0%, #059669 100%)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '10px',
                padding: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}>
                <UserPlus size={18} />
              </div>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#FFFFFF' }}>Register Vehicle</div>
                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)' }}>Manual Entry (If needed)</div>
              </div>
            </button>

            {/* Search Vehicle */}
            <button
              onClick={() => setCurrentTab('finder')}
              style={{
                background: 'linear-gradient(135deg, #4C1D95 0%, #7C3AED 100%)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                borderRadius: '10px',
                padding: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}>
                <Search size={18} />
              </div>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#FFFFFF' }}>Search Vehicle</div>
                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)' }}>By Number or Slot</div>
              </div>
            </button>

            {/* View Reports */}
            <button
              onClick={() => setCurrentTab('reports')}
              style={{
                background: 'linear-gradient(135deg, #9A3412 0%, #EA580C 100%)',
                border: '1px solid rgba(234, 88, 12, 0.4)',
                borderRadius: '10px',
                padding: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px rgba(234, 88, 12, 0.3)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}>
                <FileText size={18} />
              </div>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#FFFFFF' }}>View Reports</div>
                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)' }}>Daily Summary</div>
              </div>
            </button>
          </div>
        </div>

        {/* Today's Activity mini-card */}
        <div className="glass-panel" style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'rgba(10, 16, 30, 0.8)'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
            Today's Activity
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                <span style={{ color: 'var(--cyan-primary)', fontWeight: 800 }}>➔</span>
                <span>{metrics.todayEntries}</span>
                <span>Vehicle Entry</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                <span style={{ color: '#F87171', fontWeight: 800 }}>➔</span>
                <span>{metrics.todayExits}</span>
                <span>Vehicle Exit</span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--orange-bright)',
              paddingTop: '6px',
              borderTop: '1px solid var(--border-subtle)'
            }}>
              <span>₹{metrics.todayCollection}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 500 }}>Collection</span>
            </div>
          </div>
        </div>

      </div>


      {/* 5. ANALYTICS & DISTRIBUTION DONUT CHARTS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px'
      }}>
        {/* Vehicle Type Distribution */}
        <div className="glass-panel" style={{ padding: '18px 22px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
            Vehicle Type Distribution
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '20px' }}>
            <div style={{ position: 'relative', width: '130px', height: '130px' }}>
              <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="16" />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#3A86FF"
                  strokeWidth="16"
                  strokeDasharray="160 238"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="16"
                  strokeDasharray="78 238"
                  strokeDashoffset="-160"
                  strokeLinecap="round"
                />
              </svg>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>12</span>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Today</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#3A86FF' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>Two-Wheelers</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
                  8 (67%)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#8B5CF6' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>Four-Wheelers</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
                  4 (33%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="glass-panel" style={{ padding: '18px 22px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
            Category Distribution
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '20px' }}>
            <div style={{ position: 'relative', width: '130px', height: '130px' }}>
              <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="16" />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="16"
                  strokeDasharray="119 238"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="16"
                  strokeDasharray="59 238"
                  strokeDashoffset="-119"
                  strokeLinecap="round"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="16"
                  strokeDasharray="59 238"
                  strokeDashoffset="-178"
                  strokeLinecap="round"
                />
              </svg>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>12</span>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Today</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#10B981' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>Students</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
                  6 (50%)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#8B5CF6' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>Staff</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
                  3 (25%)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#F59E0B' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>Visitors</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
                  3 (25%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* 6. RECENT PARKING ACTIVITY TABLE */}
      <div className="glass-panel" style={{ padding: '18px 20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px'
        }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
              Recent Parking Activity
            </h3>
            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Real-time campus vehicular entry and exit log
            </p>
          </div>
          <button
            onClick={() => setCurrentTab('reports')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--cyan-primary)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            View All <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid var(--border-subtle)',
                color: 'var(--text-dim)',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                <th style={{ padding: '10px 12px' }}>#</th>
                <th style={{ padding: '10px 12px' }}>Vehicle Number</th>
                <th style={{ padding: '10px 12px' }}>Type</th>
                <th style={{ padding: '10px 12px' }}>Category</th>
                <th style={{ padding: '10px 12px' }}>Slot</th>
                <th style={{ padding: '10px 12px' }}>Entry Time</th>
                <th style={{ padding: '10px 12px' }}>Exit Time</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activities.slice(0, 5).map((act, idx) => {
                const isCar = act.type === 'Four-Wheeler';
                const isParked = act.status === 'Parked';
                return (
                  <tr
                    key={act.id || idx}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background 0.15s ease',
                      cursor: 'pointer'
                    }}
                    onClick={() => setInspectItem({ type: 'activity', data: act })}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className="plate-badge" style={{ fontSize: '12px' }}>
                        {act.vehicleNumber}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isCar ? <Car size={15} color="var(--cyan-primary)" /> : <Bike size={15} color="var(--blue-hover)" />}
                        <span style={{ color: 'var(--text-muted)' }}>{act.type}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: act.category === 'Student'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : act.category === 'Staff'
                          ? 'rgba(139, 92, 246, 0.15)'
                          : 'rgba(245, 158, 11, 0.15)',
                        color: act.category === 'Student'
                          ? 'var(--green-bright)'
                          : act.category === 'Staff'
                          ? 'var(--purple-bright)'
                          : 'var(--orange-bright)',
                        fontWeight: 600
                      }}>
                        {act.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className="slot-badge" style={{ fontSize: '11.5px' }}>
                        {act.slot}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#FFFFFF', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                      {act.entryTime}
                    </td>
                    <td style={{ padding: '12px', color: act.exitTime === '—' ? 'var(--text-dim)' : '#FFFFFF', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                      {act.exitTime}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '12px',
                        background: isParked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(58, 134, 255, 0.2)',
                        color: isParked ? 'var(--green-bright)' : '#60A5FA',
                        border: isParked ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(58, 134, 255, 0.4)'
                      }}>
                        {act.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectItem({ type: 'activity', data: act });
                        }}
                        className="btn-ghost"
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. LIVE CCTV TELEMETRY SCAN MODAL HUD */}
      {liveScanModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 8, 17, 0.88)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 150,
          animation: 'fadeIn 0.15s ease'
        }}>
          <div style={{
            width: '90%',
            maxWidth: '480px',
            background: '#0D1424',
            border: liveScanModal.step === 'error' ? '2px solid #EF4444' : '2px solid #00F0FF',
            borderRadius: '16px',
            boxShadow: liveScanModal.step === 'error' ? '0 0 40px rgba(239, 68, 68, 0.45)' : '0 0 40px rgba(0, 240, 255, 0.4)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: liveScanModal.step === 'error' ? '#EF4444' : 'var(--red-bright)',
                boxShadow: liveScanModal.step === 'error' ? '0 0 10px #EF4444' : '0 0 10px var(--red-bright)',
                animation: 'pulseGlow 1s infinite'
              }} />
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.05em' }}>
                {liveScanModal.camId.toUpperCase()} • CCTV LIVE SCAN
              </span>
            </div>

            {/* Bounding box animation */}
            <div style={{
              position: 'relative',
              height: '120px',
              borderRadius: '10px',
              background: '#030611',
              border: liveScanModal.step === 'error' ? '1px dashed rgba(239, 68, 68, 0.6)' : '1px dashed rgba(0, 240, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: liveScanModal.step === 'error' ? '#EF4444' : '#00F0FF',
                boxShadow: liveScanModal.step === 'error' ? '0 0 14px #EF4444' : '0 0 14px #00F0FF',
                animation: 'scanLaser 1.5s infinite linear'
              }} />

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <span className="plate-badge" style={{ fontSize: '20px', padding: '6px 16px' }}>
                  {liveScanModal.plate}
                </span>
                <span style={{ fontSize: '11px', color: liveScanModal.step === 'error' ? '#F87171' : 'var(--green-bright)', fontWeight: 600 }}>
                  {liveScanModal.step === 'scanning' && 'Target Vehicle Detected... Analyzing Plate'}
                  {liveScanModal.step === 'recognizing' && 'Optical Character Recognition Match: 99.4%'}
                  {liveScanModal.step === 'complete' && 'Database Verified: Access Granted'}
                  {liveScanModal.step === 'error' && (liveScanModal.isWrongGate ? '⚠ GATE VERIFICATION FAILED: ACCESS DENIED' : 'Check-In Denied')}
                </span>
              </div>
            </div>

            {/* Step & Details */}
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              <div>Driver: <strong style={{ color: '#FFFFFF' }}>{liveScanModal.driver}</strong></div>
              <div>Category: <strong style={{ color: 'var(--cyan-primary)' }}>{liveScanModal.category}</strong></div>
              {liveScanModal.slotAssigned && (
                <div style={{ marginTop: '4px' }}>
                  Allocated Slot: <strong className="slot-badge" style={{ fontSize: '13px' }}>{liveScanModal.slotAssigned}</strong>
                </div>
              )}
            </div>

            {liveScanModal.step === 'complete' && (
              <div style={{
                padding: '8px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid #10B981',
                color: 'var(--green-bright)',
                fontSize: '12px',
                fontWeight: 700
              }}>
                ✓ {liveScanModal.message}
              </div>
            )}

            {liveScanModal.step === 'error' && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.22)',
                border: '1px solid #EF4444',
                color: '#FCA5A5',
                fontSize: '12px',
                fontWeight: 700,
                lineHeight: '1.4'
              }}>
                {liveScanModal.message}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
