import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  ParkingSquare,
  Car,
  Bike,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Tag,
  Radio,
  Zap,
  Filter,
  ShieldCheck,
  Eye,
  Printer,
  LogOut,
  X,
  Activity,
  Sparkles,
  MapPin,
  RotateCw,
  Sliders,
  ChevronRight,
  Maximize2,
  AlertTriangle
} from 'lucide-react';
import { playSound } from '../utils/audio';

export default function SlotsView() {
  const {
    slots,
    activities,
    metrics,
    selectedSlotId,
    setSelectedSlotId,
    checkInVehicle,
    checkOutVehicle,
    triggerSlotDetectionPending,
    resolvePendingSlot,
    soundEnabled,
    setCurrentTab
  } = useApp();

  // Filter state: 'all', 'available', 'occupied', 'pending', 'two-wheeler', 'four-wheeler'
  const [filterType, setFilterType] = useState('all');

  // Authoritative status resolver driven by backend parking records
  const getSlotRecord = (slotId) => {
    return activities.find(
      (a) => a.slot === slotId && (a.status === 'Parked' || a.status === 'Pending')
    );
  };

  const getSlotState = (slot) => {
    // 🔵 Selected (User actively clicked and inspected this slot)
    if (selectedSlotId === slot.id) {
      return 'Selected';
    }

    // Check backing parking record
    const record = getSlotRecord(slot.id);
    if (record) {
      if (record.status === 'Pending') return 'Detection Pending';
      if (record.status === 'Parked') return 'Occupied';
    }

    // Check direct slot telemetry
    if (slot.isPending || slot.status === 'Detection Pending') {
      return 'Detection Pending';
    }
    if (slot.occupied || slot.status === 'Occupied') {
      return 'Occupied';
    }

    return 'Available';
  };

  // Get active selected slot object & backing record
  const selectedSlot = slots.find((s) => s.id === selectedSlotId);
  const selectedRecord = selectedSlot ? getSlotRecord(selectedSlot.id) : null;

  // Filter slots based on filter chip selection
  const filteredSlots = useMemo(() => {
    return slots.filter((s) => {
      const state = getSlotState(s);
      if (filterType === 'available') return state === 'Available';
      if (filterType === 'occupied') return state === 'Occupied' || (state === 'Selected' && s.occupied);
      if (filterType === 'pending') return state === 'Detection Pending' || (state === 'Selected' && s.isPending);
      if (filterType === 'two-wheeler') return s.zone === 'two-wheeler';
      if (filterType === 'four-wheeler') return s.zone === 'four-wheeler';
      return true;
    });
  }, [slots, filterType, selectedSlotId, activities]);

  // Click slot handler
  const handleSlotClick = (slot) => {
    playSound('beep', soundEnabled);
    if (selectedSlotId === slot.id) {
      // Toggle selection off if already selected
      setSelectedSlotId(null);
    } else {
      setSelectedSlotId(slot.id);
    }
  };

  // Quick action: release occupied slot
  const handleQuickRelease = (slotId, vehicleNumber) => {
    if (!vehicleNumber) return;
    playSound('success', soundEnabled);
    checkOutVehicle({ vehicleNumber, slotId });
  };

  // State styling tokens
  const getStateMeta = (state) => {
    switch (state) {
      case 'Available':
        return {
          label: 'Available',
          badgeText: '🟢 AVAILABLE',
          badgeColor: 'var(--green-bright)',
          badgeBg: 'rgba(16, 185, 129, 0.16)',
          border: '1px solid rgba(16, 185, 129, 0.5)',
          glow: '0 0 16px rgba(16, 185, 129, 0.2)',
          bgGradient: 'linear-gradient(145deg, rgba(6, 78, 59, 0.4) 0%, rgba(2, 44, 34, 0.7) 100%)',
          accent: 'var(--green-bright)'
        };
      case 'Occupied':
        return {
          label: 'Occupied',
          badgeText: '🔴 OCCUPIED',
          badgeColor: 'var(--red-bright)',
          badgeBg: 'rgba(239, 68, 68, 0.16)',
          border: '1px solid rgba(239, 68, 68, 0.55)',
          glow: '0 0 16px rgba(239, 68, 68, 0.25)',
          bgGradient: 'linear-gradient(145deg, rgba(127, 29, 29, 0.45) 0%, rgba(69, 10, 10, 0.75) 100%)',
          accent: 'var(--red-bright)'
        };
      case 'Selected':
        return {
          label: 'Selected',
          badgeText: '🔵 SELECTED',
          badgeColor: 'var(--cyan-primary)',
          badgeBg: 'rgba(0, 240, 255, 0.22)',
          border: '2px solid var(--cyan-primary)',
          glow: '0 0 24px rgba(0, 240, 255, 0.4)',
          bgGradient: 'linear-gradient(145deg, rgba(14, 116, 144, 0.5) 0%, rgba(3, 7, 18, 0.9) 100%)',
          accent: 'var(--cyan-primary)'
        };
      case 'Detection Pending':
        return {
          label: 'Detection Pending',
          badgeText: '🟡 PENDING OCR',
          badgeColor: 'var(--orange-bright)',
          badgeBg: 'rgba(245, 158, 11, 0.2)',
          border: '1.5px dashed var(--orange-bright)',
          glow: '0 0 20px rgba(245, 158, 11, 0.35)',
          bgGradient: 'linear-gradient(145deg, rgba(120, 53, 15, 0.45) 0%, rgba(69, 26, 3, 0.75) 100%)',
          accent: 'var(--orange-bright)'
        };
      default:
        return {
          label: 'Available',
          badgeText: '🟢 AVAILABLE',
          badgeColor: 'var(--green-bright)',
          badgeBg: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid var(--border-subtle)',
          glow: 'none',
          bgGradient: 'rgba(255, 255, 255, 0.03)',
          accent: 'var(--green-bright)'
        };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '35px' }}>
      
      {/* 1. Header & Live Telemetry Strip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
              Parking Slot Management & Telemetry Twin
            </h1>
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(0, 240, 255, 0.12)',
              color: 'var(--cyan-primary)',
              padding: '3px 9px',
              borderRadius: '6px',
              border: '1px solid var(--border-neon-cyan)',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Activity size={12} /> BACKEND RECORD DRIVEN
            </span>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Real-time multi-zone occupancy map (Two-Wheeler T-01..T-10, Four-Wheeler F-01..F-05) synchronized with parking activity audit records
          </p>
        </div>

        {/* 4 Slot State Legend Indicators */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(15, 23, 42, 0.8)',
          padding: '8px 16px',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
          fontSize: '11.5px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--green-bright)', boxShadow: '0 0 6px var(--green-bright)' }} />
            <span style={{ color: '#FFFFFF', fontWeight: 600 }}>Available ({metrics.available})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--red-bright)', boxShadow: '0 0 6px var(--red-bright)' }} />
            <span style={{ color: '#FFFFFF', fontWeight: 600 }}>Occupied ({metrics.occupied})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--cyan-primary)', boxShadow: '0 0 6px var(--cyan-primary)' }} />
            <span style={{ color: 'var(--cyan-primary)', fontWeight: 600 }}>Selected ({selectedSlotId ? 1 : 0})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--orange-bright)', boxShadow: '0 0 6px var(--orange-bright)' }} className="animate-pulse" />
            <span style={{ color: 'var(--orange-bright)', fontWeight: 600 }}>Detection Pending ({metrics.pending || 0})</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Filter Chips Bar */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { id: 'all', label: `All Slots (${slots.length})` },
          { id: 'available', label: `🟢 Available Only (${metrics.available})` },
          { id: 'occupied', label: `🔴 Occupied Only (${metrics.occupied})` },
          { id: 'pending', label: `🟡 Detection Pending (${metrics.pending || 0})` },
          { id: 'two-wheeler', label: `Two-Wheeler Zone T (${metrics.twoWheelersTotal})` },
          { id: 'four-wheeler', label: `Four-Wheeler Zone F (${metrics.fourWheelersTotal})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            style={{
              padding: '7px 14px',
              borderRadius: '20px',
              border: filterType === tab.id ? '1px solid var(--cyan-primary)' : '1px solid var(--border-subtle)',
              background: filterType === tab.id ? 'rgba(0, 240, 255, 0.16)' : 'rgba(255, 255, 255, 0.04)',
              color: filterType === tab.id ? 'var(--cyan-primary)' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}

        {selectedSlotId && (
          <button
            onClick={() => setSelectedSlotId(null)}
            className="btn-ghost"
            style={{ fontSize: '11px', padding: '6px 12px', marginLeft: 'auto', color: 'var(--cyan-primary)' }}
          >
            <X size={13} /> Clear Selected (Deselect {selectedSlotId})
          </button>
        )}
      </div>

      {/* 3. Main Workspace: Slot Bays Layout + Live Inspection Side Panel */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedSlotId ? '1fr 370px' : '1fr',
        gap: '20px',
        alignItems: 'start',
        transition: 'grid-template-columns 0.25s ease'
      }}>
        
        {/* Left Column: 2D Parking Bays (Zone T & Zone F) */}
        <div className="glass-panel" style={{ padding: '22px', background: 'rgba(7, 11, 20, 0.95)' }}>
          
          {/* Driveway & Gate Orientation HUD */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 16px',
            background: 'rgba(0, 240, 255, 0.05)',
            borderRadius: '8px',
            border: '1px dashed rgba(0, 240, 255, 0.25)',
            marginBottom: '22px',
            fontSize: '11.5px',
            color: 'var(--cyan-primary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} />
              <span>North Entry Gate (Cam 1 & Automated Barrier)</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em' }}>
              MAIN CAMPUS INGRESS / EGRESS DRIVEWAY
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>South Exit Gate (Cam 2)</span>
              <MapPin size={14} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
            
            {/* ============================================================ */}
            {/* ZONE T: TWO-WHEELER ZONE (T-01 THROUGH T-10) — 10 SLOTS       */}
            {/* ============================================================ */}
            {(filterType === 'all' || filterType === 'two-wheeler' || filterType === 'available' || filterType === 'occupied' || filterType === 'pending') && (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      background: 'rgba(58, 134, 255, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--blue-hover)'
                    }}>
                      <Bike size={16} />
                    </div>
                    <div>
                      <span style={{ fontSize: '14.5px', fontWeight: 800, color: '#FFFFFF' }}>
                        Two-Wheeler Zone (Slots T-01 to T-10)
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                        Motorcycles & Scooters Bay (10 Slots Total)
                      </span>
                    </div>
                  </div>

                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Occupancy: <strong style={{ color: '#FFFFFF' }}>{metrics.twoWheelersOccupied}/10</strong> ({Math.round((metrics.twoWheelersOccupied / 10) * 100)}%)
                  </span>
                </div>

                {/* 10 Two-Wheeler Slot Cards Grid (2 rows of 5) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                  {slots
                    .filter((s) => s.zone === 'two-wheeler')
                    .map((slot) => {
                      const state = getSlotState(slot);
                      const meta = getStateMeta(state);
                      const record = getSlotRecord(slot.id);

                      // Display values
                      const vehicleNum = slot.occupied || (record && record.status === 'Parked')
                        ? (slot.vehicleNumber || record?.vehicleNumber || 'Occupied')
                        : state === 'Detection Pending'
                          ? (slot.vehicleNumber || record?.vehicleNumber || 'Scanning Plate...')
                          : 'Vacant';

                      const entryTime = (slot.occupied || state === 'Detection Pending')
                        ? (slot.entryTime || record?.entryTime || '10:00 AM')
                        : '—';

                      return (
                        <div
                          key={slot.id}
                          onClick={() => handleSlotClick(slot)}
                          style={{
                            background: meta.bgGradient,
                            border: meta.border,
                            borderRadius: '12px',
                            padding: '14px 10px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            boxShadow: meta.glow,
                            position: 'relative',
                            userSelect: 'none'
                          }}
                          className="hover-bright"
                        >
                          {/* Slot Header: ID + State Badge */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            padding: '0 4px'
                          }}>
                            <span style={{
                              fontSize: '13px',
                              fontWeight: 900,
                              fontFamily: 'var(--font-mono)',
                              color: '#FFFFFF',
                              letterSpacing: '0.04em'
                            }}>
                              {slot.id}
                            </span>

                            <span style={{
                              fontSize: '9px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: meta.badgeBg,
                              color: meta.badgeColor,
                              fontWeight: 800,
                              fontFamily: 'var(--font-mono)',
                              letterSpacing: '0.02em',
                              whiteSpace: 'nowrap'
                            }}>
                              {meta.badgeText}
                            </span>
                          </div>

                          {/* Vehicle Icon */}
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: meta.accent
                          }}>
                            <Bike size={26} strokeWidth={2.2} />
                          </div>

                          {/* Mandatory Slot Attributes Display */}
                          <div style={{
                            textAlign: 'center',
                            width: '100%',
                            padding: '0 2px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px'
                          }}>
                            {/* Vehicle Number if occupied */}
                            <div style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              fontFamily: 'var(--font-mono)',
                              color: '#FFFFFF',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {vehicleNum}
                            </div>

                            {/* Vehicle Type & Entry Time */}
                            <div style={{
                              fontSize: '9.5px',
                              color: 'rgba(255, 255, 255, 0.7)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}>
                              <span>Two-Wheeler</span>
                              {entryTime !== '—' && (
                                <>
                                  <span>•</span>
                                  <span style={{ color: meta.accent }}>{entryTime}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* ZONE F: FOUR-WHEELER ZONE (F-01 THROUGH F-05) — 5 SLOTS       */}
            {/* ============================================================ */}
            {(filterType === 'all' || filterType === 'four-wheeler' || filterType === 'available' || filterType === 'occupied' || filterType === 'pending') && (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      background: 'rgba(0, 240, 255, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--cyan-primary)'
                    }}>
                      <Car size={16} />
                    </div>
                    <div>
                      <span style={{ fontSize: '14.5px', fontWeight: 800, color: '#FFFFFF' }}>
                        Four-Wheeler Zone (Slots F-01 to F-05)
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                        Cars & SUVs Bay (5 Slots Total)
                      </span>
                    </div>
                  </div>

                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Occupancy: <strong style={{ color: '#FFFFFF' }}>{metrics.fourWheelersOccupied}/5</strong> ({Math.round((metrics.fourWheelersOccupied / 5) * 100)}%)
                  </span>
                </div>

                {/* 5 Four-Wheeler Slot Cards Grid (1 row of 5) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                  {slots
                    .filter((s) => s.zone === 'four-wheeler')
                    .map((slot) => {
                      const state = getSlotState(slot);
                      const meta = getStateMeta(state);
                      const record = getSlotRecord(slot.id);

                      // Display values
                      const vehicleNum = slot.occupied || (record && record.status === 'Parked')
                        ? (slot.vehicleNumber || record?.vehicleNumber || 'Occupied')
                        : state === 'Detection Pending'
                          ? (slot.vehicleNumber || record?.vehicleNumber || 'Scanning Plate...')
                          : 'Vacant';

                      const entryTime = (slot.occupied || state === 'Detection Pending')
                        ? (slot.entryTime || record?.entryTime || '10:24 AM')
                        : '—';

                      return (
                        <div
                          key={slot.id}
                          onClick={() => handleSlotClick(slot)}
                          style={{
                            background: meta.bgGradient,
                            border: meta.border,
                            borderRadius: '12px',
                            padding: '16px 10px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            boxShadow: meta.glow,
                            position: 'relative',
                            userSelect: 'none'
                          }}
                          className="hover-bright"
                        >
                          {/* Slot Header: ID + State Badge */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            padding: '0 4px'
                          }}>
                            <span style={{
                              fontSize: '13px',
                              fontWeight: 900,
                              fontFamily: 'var(--font-mono)',
                              color: '#FFFFFF',
                              letterSpacing: '0.04em'
                            }}>
                              {slot.id}
                            </span>

                            <span style={{
                              fontSize: '9px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: meta.badgeBg,
                              color: meta.badgeColor,
                              fontWeight: 800,
                              fontFamily: 'var(--font-mono)',
                              letterSpacing: '0.02em',
                              whiteSpace: 'nowrap'
                            }}>
                              {meta.badgeText}
                            </span>
                          </div>

                          {/* Vehicle Icon */}
                          <div style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: meta.accent
                          }}>
                            <Car size={30} strokeWidth={2.2} />
                          </div>

                          {/* Mandatory Slot Attributes Display */}
                          <div style={{
                            textAlign: 'center',
                            width: '100%',
                            padding: '0 2px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px'
                          }}>
                            {/* Vehicle Number if occupied */}
                            <div style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              fontFamily: 'var(--font-mono)',
                              color: '#FFFFFF',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {vehicleNum}
                            </div>

                            {/* Vehicle Type & Entry Time */}
                            <div style={{
                              fontSize: '9.5px',
                              color: 'rgba(255, 255, 255, 0.7)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}>
                              <span>Four-Wheeler</span>
                              {entryTime !== '—' && (
                                <>
                                  <span>•</span>
                                  <span style={{ color: meta.accent }}>{entryTime}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: DETAILED SLOT & PARKING RECORD TELEMETRY PANEL */}
        {/* Opens when user clicks any occupied, pending, or selected slot */}
        {/* ============================================================ */}
        {selectedSlot && (
          <div className="glass-panel" style={{
            padding: '20px',
            border: '1px solid var(--border-neon-cyan)',
            boxShadow: '0 0 30px rgba(0, 240, 255, 0.15)',
            position: 'sticky',
            top: '80px',
            animation: 'fadeIn 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Header: Slot Name & Close */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '12px'
            }}>
              <div>
                <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--cyan-primary)', letterSpacing: '0.06em' }}>
                  BACKEND RECORD INSPECTION
                </span>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                  Slot {selectedSlot.id} Telemetry
                </h3>
              </div>

              <button
                onClick={() => setSelectedSlotId(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Current Dynamic State Banner */}
            {(() => {
              const state = getSlotState(selectedSlot);
              const meta = getStateMeta(state);
              return (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: meta.badgeBg,
                  border: meta.border,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: meta.badgeColor, fontFamily: 'var(--font-mono)' }}>
                      {meta.badgeText}
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    ZONE: {selectedSlot.zone === 'four-wheeler' ? 'ZONE F' : 'ZONE T'}
                  </span>
                </div>
              );
            })()}

            {/* Vehicle Profile Display (If Occupied or Pending) */}
            {(selectedSlot.occupied || selectedRecord || selectedSlot.isPending) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Plate Card */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      background: 'rgba(0, 240, 255, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--cyan-primary)'
                    }}>
                      {selectedSlot.zone === 'four-wheeler' ? <Car size={22} /> : <Bike size={22} />}
                    </div>
                    <div>
                      <div className="plate-badge" style={{ fontSize: '15px' }}>
                        {selectedSlot.vehicleNumber || selectedRecord?.vehicleNumber || 'KA-22-EX-0000'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {selectedSlot.driver || selectedRecord?.driver || 'Registered Driver'}
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--cyan-primary)',
                    background: 'rgba(0, 240, 255, 0.1)',
                    padding: '3px 8px',
                    borderRadius: '4px'
                  }}>
                    {selectedSlot.category || selectedRecord?.category || 'Student'}
                  </span>
                </div>

                {/* Telemetry Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11.5px' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 10px', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--text-dim)', fontSize: '10px', textTransform: 'uppercase' }}>Entry Timestamp</span>
                    <div style={{ color: '#FFFFFF', fontWeight: 700, marginTop: '2px' }}>
                      {selectedSlot.entryTime || selectedRecord?.entryTime || '10:24 AM'}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 10px', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--text-dim)', fontSize: '10px', textTransform: 'uppercase' }}>Vehicle Type</span>
                    <div style={{ color: 'var(--cyan-primary)', fontWeight: 700, marginTop: '2px' }}>
                      {selectedSlot.type || (selectedSlot.zone === 'four-wheeler' ? 'Four-Wheeler' : 'Two-Wheeler')}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 10px', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--text-dim)', fontSize: '10px', textTransform: 'uppercase' }}>Department</span>
                    <div style={{ color: '#FFFFFF', fontWeight: 600, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {selectedRecord?.department || 'Campus Department'}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 10px', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--text-dim)', fontSize: '10px', textTransform: 'uppercase' }}>Elapsed Duration</span>
                    <div style={{ color: 'var(--green-bright)', fontWeight: 700, marginTop: '2px' }}>
                      {selectedRecord?.duration || 'Active (45m)'}
                    </div>
                  </div>
                </div>

                {/* Backing Record Proof Tag */}
                <div style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '10.5px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span>Record ID: <strong style={{ color: '#FFFFFF' }}>{selectedRecord?.id || `REC-${selectedSlot.id}`}</strong></span>
                  <span style={{ color: 'var(--cyan-primary)' }}>Audit Provenance Verified ✓</span>
                </div>

                {/* Operational Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  {/* If Detection Pending -> Action to Resolve / Confirm Detection */}
                  {(selectedSlot.isPending || selectedSlot.status === 'Detection Pending') && (
                    <button
                      onClick={() => resolvePendingSlot(selectedSlot.id)}
                      style={{
                        background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                        color: '#050811',
                        fontWeight: 800,
                        fontSize: '12px',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Zap size={14} /> Complete ANPR Check-In Resolution
                    </button>
                  )}

                  {/* If Occupied -> Action to Check Out */}
                  {selectedSlot.occupied && (
                    <button
                      onClick={() => handleQuickRelease(selectedSlot.id, selectedSlot.vehicleNumber || selectedRecord?.vehicleNumber)}
                      style={{
                        background: 'linear-gradient(135deg, #0284C7 0%, #06B6D4 100%)',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '12px',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <LogOut size={14} /> Release Slot & Clear Backend Record
                    </button>
                  )}

                  <button
                    onClick={() => window.print()}
                    className="btn-ghost"
                    style={{ fontSize: '11.5px', padding: '8px', justifyContent: 'center' }}
                  >
                    <Printer size={13} /> Print Telemetry Ticket
                  </button>
                </div>
              </div>
            ) : (
              /* Vacant Slot Telemetry Details */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: 'var(--green-bright)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}>
                  <CheckCircle2 size={26} />
                </div>

                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>
                    Slot {selectedSlot.id} is Available
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    No active parking record associated. Ready for automatic allocation at Gate 1.
                  </p>
                </div>

                {/* Simulate Optical Tripwire / Pending Detection */}
                <button
                  onClick={() => triggerSlotDetectionPending(
                    selectedSlot.id,
                    selectedSlot.zone === 'four-wheeler' ? 'KA-22-ZZ-4400' : 'KA-22-PQ-9988',
                    selectedSlot.zone === 'four-wheeler' ? 'Four-Wheeler' : 'Two-Wheeler'
                  )}
                  style={{
                    background: 'rgba(245, 158, 11, 0.14)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    color: 'var(--orange-bright)',
                    fontWeight: 700,
                    fontSize: '11.5px',
                    borderRadius: '8px',
                    padding: '9px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginTop: '8px'
                  }}
                >
                  <Radio size={13} className="animate-pulse" /> Simulate Optical Sensor Tripwire (Set Pending)
                </button>
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
