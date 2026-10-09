import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Crown,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Car,
  Bike,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  PlusCircle,
  Eye,
  LogOut,
  RefreshCw,
  Calendar,
  User,
  FileText,
  Sparkles,
  Lock,
  Unlock,
  AlertOctagon,
  ArrowRight,
  Printer,
  ChevronDown,
  Layers,
  MapPin,
  Check,
  X
} from 'lucide-react';
import { playSound } from '../utils/audio';

export default function VipReservationsView() {
  const {
    slots,
    vipReservations,
    createVipReservation,
    releaseVipReservation,
    updateVipReservationStatus,
    checkInVehicle,
    userRole,
    setUserRole,
    settings,
    soundEnabled,
    setSelectedSlotId,
    setCurrentTab
  } = useApp();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'VIP' | 'Emergency' | 'Official Guest'
  const [filterStatus, setFilterStatus] = useState('ACTIVE'); // 'ACTIVE' | 'ALL' | 'Reserved' | 'Arrived / Checked In' | 'Released' | 'Completed' | 'Expired'

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRes, setSelectedRes] = useState(null);

  // Form State
  const [formSlotId, setFormSlotId] = useState('');
  const [formType, setFormType] = useState('VIP'); // VIP | Emergency | Official Guest
  const [formReservedFor, setFormReservedFor] = useState('');
  const [formVehicleNumber, setFormVehicleNumber] = useState('');
  const [formVehicleType, setFormVehicleType] = useState('Four-Wheeler');
  const [formExpectedArrival, setFormExpectedArrival] = useState('11:00 AM');
  const [formExpiryTime, setFormExpiryTime] = useState('06:00 PM');
  const [formReason, setFormReason] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Release Modal Form
  const [releaseReason, setReleaseReason] = useState('');
  const [releaseSubmitting, setReleaseSubmitting] = useState(false);

  // Calculate live reservation stats
  const stats = useMemo(() => {
    const totalReservations = vipReservations.length;
    const active = vipReservations.filter(r => r.status === 'Reserved' || r.status === 'Arrived / Checked In');
    const reservedPending = vipReservations.filter(r => r.status === 'Reserved');
    const arrivedCheckedIn = vipReservations.filter(r => r.status === 'Arrived / Checked In');
    const expiredCount = vipReservations.filter(r => r.status === 'Expired');
    const emergencyActive = vipReservations.filter(r => r.reservationType === 'Emergency' && (r.status === 'Reserved' || r.status === 'Arrived / Checked In'));

    // Count reserved slots in inventory
    const reservedBays = slots.filter(s => s.isReserved || s.reservationStatus === 'Reserved' || s.reservationStatus === 'Arrived / Checked In').length;

    // Regular available bays strictly excluding reserved
    const regularAvailable = slots.filter(s => !s.occupied && !s.isPending && !s.isDisabled && !s.isReserved).length;

    return {
      totalReservations,
      activeCount: active.length,
      reservedPendingCount: reservedPending.length,
      arrivedCheckedInCount: arrivedCheckedIn.length,
      expiredCount: expiredCount.length,
      emergencyActiveCount: emergencyActive.length,
      reservedBays,
      regularAvailable
    };
  }, [vipReservations, slots]);

  // Available slots eligible for VIP reservation (not occupied, not disabled, not already reserved)
  const availableSlotsForReservation = useMemo(() => {
    return slots.filter(s => !s.occupied && !s.isDisabled && !s.isReserved);
  }, [slots]);

  // Filtered reservations list
  const filteredReservations = useMemo(() => {
    return vipReservations.filter(res => {
      // Status filter
      if (filterStatus === 'ACTIVE') {
        if (res.status !== 'Reserved' && res.status !== 'Arrived / Checked In') return false;
      } else if (filterStatus !== 'ALL') {
        if (res.status !== filterStatus) return false;
      }

      // Type filter
      if (filterType !== 'ALL' && res.reservationType !== filterType) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesPlate = (res.vehicleNumber || '').toLowerCase().includes(q);
        const matchesSlot = (res.slotId || '').toLowerCase().includes(q);
        const matchesGuest = (res.reservedFor || '').toLowerCase().includes(q);
        const matchesReason = (res.reason || '').toLowerCase().includes(q);
        const matchesId = (res.id || '').toLowerCase().includes(q);
        if (!matchesPlate && !matchesSlot && !matchesGuest && !matchesReason && !matchesId) {
          return false;
        }
      }

      return true;
    });
  }, [vipReservations, filterStatus, filterType, searchQuery]);

  // Open Create Reservation Modal with an optional pre-selected slot
  const handleOpenCreateModal = (preselectedSlot = null) => {
    if (userRole === 'Unauthorized') {
      playSound('alert', soundEnabled);
      alert('Access Denied: Only Security Personnel and Administrators can create VIP/Emergency reservations.');
      return;
    }

    setFormError('');
    if (preselectedSlot) {
      setFormSlotId(preselectedSlot.id);
      setFormVehicleType(preselectedSlot.zone === 'two-wheeler' ? 'Two-Wheeler' : 'Four-Wheeler');
    } else {
      const firstAvailable = availableSlotsForReservation[0];
      setFormSlotId(firstAvailable ? firstAvailable.id : '');
      setFormVehicleType(firstAvailable && firstAvailable.zone === 'two-wheeler' ? 'Two-Wheeler' : 'Four-Wheeler');
    }

    setFormType('VIP');
    setFormReservedFor('');
    setFormVehicleNumber('');
    setFormExpectedArrival('11:30 AM');
    setFormExpiryTime('06:00 PM');
    setFormReason('');
    setFormNotes('');
    setShowCreateModal(true);
  };

  // Slot selection change in form - sync vehicle type to slot zone
  const handleSlotSelectChange = (e) => {
    const slotId = e.target.value;
    setFormSlotId(slotId);
    const found = slots.find(s => s.id === slotId);
    if (found) {
      setFormVehicleType(found.zone === 'two-wheeler' ? 'Two-Wheeler' : 'Four-Wheeler');
    }
  };

  // Submit VIP Reservation
  const handleSubmitReservation = async (e) => {
    e.preventDefault();
    setFormError('');

    if (userRole === 'Unauthorized') {
      setFormError('Access Denied: Only Security Officers and Administrators may reserve bays.');
      return;
    }

    if (!formSlotId) {
      setFormError('Please select a parking bay.');
      return;
    }

    if (!formReservedFor.trim()) {
      setFormError('Please enter the Guest Name / Designation / Emergency Unit.');
      return;
    }

    if (!formVehicleNumber.trim()) {
      setFormError('Please enter the vehicle registration plate number.');
      return;
    }

    if (!formReason.trim()) {
      setFormError('Reason for reservation is required for audit and compliance.');
      return;
    }

    // Validate slot vehicle type match
    const targetSlot = slots.find(s => s.id === formSlotId);
    if (targetSlot) {
      if (targetSlot.zone === 'two-wheeler' && formVehicleType !== 'Two-Wheeler') {
        setFormError(`Bay ${formSlotId} is in Two-Wheeler zone. Vehicle type must be Two-Wheeler.`);
        return;
      }
      if (targetSlot.zone === 'four-wheeler' && formVehicleType !== 'Four-Wheeler') {
        setFormError(`Bay ${formSlotId} is in Four-Wheeler zone. Vehicle type must be Four-Wheeler.`);
        return;
      }
    }

    setFormSubmitting(true);
    try {
      const res = await createVipReservation({
        slotId: formSlotId,
        reservationType: formType,
        reservedFor: formReservedFor.trim(),
        vehicleNumber: formVehicleNumber.trim().toUpperCase(),
        vehicleType: formVehicleType,
        expectedArrival: formExpectedArrival.trim(),
        expiryTime: formExpiryTime.trim(),
        reason: formReason.trim(),
        notes: formNotes.trim(),
        createdBy: `${settings.officerName || 'Officer Raj Sharma'} (${settings.officerBadge || 'SEC-01'})`
      });

      if (res.success) {
        setShowCreateModal(false);
      } else {
        setFormError(res.error || 'Failed to create reservation.');
        playSound('alert', soundEnabled);
      }
    } catch (err) {
      setFormError(err.message || 'Error occurred while saving reservation.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Release Modal
  const handleOpenReleaseModal = (res) => {
    if (userRole === 'Unauthorized') {
      playSound('alert', soundEnabled);
      alert('Access Denied: Only Security Personnel and Administrators can release reservations.');
      return;
    }
    setSelectedRes(res);
    setReleaseReason('');
    setShowReleaseModal(true);
  };

  // Confirm Release Reservation
  const handleConfirmRelease = async () => {
    if (!selectedRes) return;
    setReleaseSubmitting(true);
    try {
      const res = await releaseVipReservation(selectedRes.id, releaseReason);
      if (res.success) {
        playSound('success', soundEnabled);
        setShowReleaseModal(false);
        setSelectedRes(null);
      } else {
        alert(res.error || 'Failed to release reservation');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setReleaseSubmitting(false);
    }
  };

  // Fast-Track Check-In for Arrived VIP Vehicle
  const handleFastTrackCheckIn = async (res) => {
    if (userRole === 'Unauthorized') {
      alert('Access Denied: Only Security Personnel can authorize fast-track VIP entry.');
      return;
    }

    playSound('success', soundEnabled);
    const checkInResult = checkInVehicle({
      vehicleNumber: res.vehicleNumber,
      type: res.vehicleType,
      category: res.reservationType === 'Emergency' ? 'Emergency' : 'VIP',
      driver: res.reservedFor,
      slotId: res.slotId,
      gate: 'Gate 2 (Staff / VIP Fast-Track)'
    });

    if (checkInResult.success) {
      await updateVipReservationStatus(res.id, 'Arrived / Checked In', 'Vehicle arrived and checked in via Fast-Track protocol.');
    } else {
      alert(`Check-in warning: ${checkInResult.message}`);
    }
  };

  // Open Details Modal
  const handleViewDetails = (res) => {
    setSelectedRes(res);
    setShowDetailModal(true);
  };

  // Jump to twin slot inspector
  const handleInspectSlot = (slotId) => {
    setSelectedSlotId(slotId);
    setCurrentTab('slots');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* View Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        background: 'linear-gradient(135deg, rgba(13, 21, 39, 0.85), rgba(7, 11, 20, 0.95))',
        padding: '22px 26px',
        borderRadius: '16px',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(0, 240, 255, 0.2))',
              border: '1px solid rgba(234, 179, 8, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(234, 179, 8, 0.25)'
            }}>
              <Crown size={22} color="#EAB308" />
            </div>
            <div>
              <h1 style={{
                fontSize: '24px',
                fontWeight: 800,
                color: '#FFFFFF',
                fontFamily: 'var(--font-heading)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                Fast-Track VIP & Emergency Reservation
                <span style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  background: 'rgba(234, 179, 8, 0.15)',
                  color: '#FACC15',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  border: '1px solid rgba(234, 179, 8, 0.4)',
                  fontWeight: 700,
                  letterSpacing: '0.05em'
                }}>
                  AUTHORITATIVE PROTOCOL
                </span>
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Guaranteed priority bay allocation for state dignitaries, emergency responders, trustees and campus officials.
              </p>
            </div>
          </div>
        </div>

        {/* Security Role Switcher & New Reservation Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Role Pill Switcher (Allows full testing of security authorization) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(15, 23, 42, 0.85)',
            padding: '6px 12px',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            fontSize: '12px'
          }}>
            <ShieldCheck size={14} color="var(--cyan-primary)" />
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Role:</span>
            <select
              value={userRole}
              onChange={(e) => {
                setUserRole(e.target.value);
                playSound('beep', soundEnabled);
              }}
              style={{
                background: userRole === 'Unauthorized' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 240, 255, 0.12)',
                color: userRole === 'Unauthorized' ? '#F87171' : 'var(--cyan-primary)',
                border: userRole === 'Unauthorized' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-neon-cyan)',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '12px',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer'
              }}
              title="Change active user role to verify security access control rules"
            >
              <option value="Security">Security Officer</option>
              <option value="Admin">Administrator</option>
              <option value="Unauthorized">Guest / Unauthorized (Test)</option>
            </select>
          </div>

          {/* Reserve Slot Button */}
          <button
            onClick={() => handleOpenCreateModal()}
            disabled={userRole === 'Unauthorized'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: userRole === 'Unauthorized'
                ? 'rgba(75, 85, 99, 0.4)'
                : 'linear-gradient(135deg, #EAB308, #CA8A04)',
              color: userRole === 'Unauthorized' ? 'var(--text-muted)' : '#070B14',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: userRole === 'Unauthorized' ? 'not-allowed' : 'pointer',
              boxShadow: userRole === 'Unauthorized' ? 'none' : '0 4px 18px rgba(234, 179, 8, 0.35)',
              transition: 'all 0.2s ease'
            }}
            className={userRole !== 'Unauthorized' ? 'hover-bright' : ''}
          >
            <Crown size={16} />
            + Reserve VIP / Emergency Slot
          </button>
        </div>
      </div>

      {/* Role Restriction Banner if set to Unauthorized */}
      {userRole === 'Unauthorized' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '12px',
          padding: '12px 18px',
          color: '#FCA5A5',
          fontSize: '13px'
        }}>
          <AlertOctagon size={20} color="#EF4444" style={{ flexShrink: 0 }} />
          <div>
            <strong>Access Restricted:</strong> You are currently simulating an <em>Unauthorized Guest</em> session.
            Reservation creation, status overrides, and slot release actions are blocked per Rule 6 access control policies. Switch role to <strong>Security Officer</strong> or <strong>Administrator</strong> above to resume write operations.
          </div>
        </div>
      )}

      {/* Top Telemetry KPI Strips (Accurate & Synced with Database) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px'
      }}>
        {/* KPI 1: Active Reserved Bays */}
        <div style={{
          background: 'rgba(13, 21, 39, 0.8)',
          border: '1px solid rgba(234, 179, 8, 0.3)',
          borderRadius: '14px',
          padding: '18px 20px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #EAB308, #F59E0B)'
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Reserved Bays
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={16} color="#EAB308" />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#FACC15', marginTop: '10px', fontFamily: 'var(--font-heading)' }}>
            {stats.reservedBays}
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '6px' }}>
              / {slots.length} bays locked
            </span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#EAB308', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Crown size={12} /> Excluded from regular check-ins
          </div>
        </div>

        {/* KPI 2: Regular Available Bays */}
        <div style={{
          background: 'rgba(13, 21, 39, 0.8)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '14px',
          padding: '18px 20px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #10B981, #00F0FF)'
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Regular Available
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={16} color="#10B981" />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#34D399', marginTop: '10px', fontFamily: 'var(--font-heading)' }}>
            {stats.regularAvailable}
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '6px' }}>
              open bays
            </span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#10B981', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Check size={12} /> Strictly excludes VIP reservations
          </div>
        </div>

        {/* KPI 3: Active VIP Reservations */}
        <div style={{
          background: 'rgba(13, 21, 39, 0.8)',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          borderRadius: '14px',
          padding: '18px 20px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #00F0FF, #3B82F6)'
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Reservations
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(0, 240, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} color="var(--cyan-primary)" />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#FFFFFF', marginTop: '10px', fontFamily: 'var(--font-heading)' }}>
            {stats.activeCount}
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '6px' }}>
              ({stats.reservedPendingCount} pending, {stats.arrivedCheckedInCount} inside)
            </span>
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--cyan-primary)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Sparkles size={12} /> Fast-track ANPR active
          </div>
        </div>

        {/* KPI 4: Emergency / Expedited */}
        <div style={{
          background: 'rgba(13, 21, 39, 0.8)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '14px',
          padding: '18px 20px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #EF4444, #F97316)'
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Emergency Units
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={16} color="#EF4444" />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#F87171', marginTop: '10px', fontFamily: 'var(--font-heading)' }}>
            {stats.emergencyActiveCount}
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '6px' }}>
              active
            </span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#F87171', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <AlertTriangle size={12} /> Instant gate clearance
          </div>
        </div>
      </div>

      {/* Main Reservation Management Section */}
      <div style={{
        background: 'rgba(13, 21, 39, 0.75)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
      }}>
        {/* Toolbar: Search & Filter Tabs */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          {/* Search Box */}
          <div style={{
            position: 'relative',
            minWidth: '280px',
            flex: '1 1 300px'
          }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by license plate, guest name, slot ID, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(8, 12, 22, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '10px 14px 10px 40px',
                color: '#FFFFFF',
                fontSize: '13px',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--cyan-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Status Filter */}
            <div style={{ display: 'flex', background: 'rgba(8, 12, 22, 0.8)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              {[
                { id: 'ACTIVE', label: 'Active (Pending / Inside)' },
                { id: 'Reserved', label: 'Pending Only' },
                { id: 'Arrived / Checked In', label: 'Checked In' },
                { id: 'Released', label: 'Released' },
                { id: 'ALL', label: 'All Records' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => {
                    setFilterStatus(f.id);
                    playSound('beep', soundEnabled);
                  }}
                  style={{
                    background: filterStatus === f.id ? 'rgba(0, 240, 255, 0.18)' : 'transparent',
                    color: filterStatus === f.id ? 'var(--cyan-primary)' : 'var(--text-muted)',
                    border: filterStatus === f.id ? '1px solid var(--border-neon-cyan)' : '1px solid transparent',
                    padding: '6px 12px',
                    borderRadius: '7px',
                    fontSize: '12px',
                    fontWeight: filterStatus === f.id ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                playSound('beep', soundEnabled);
              }}
              style={{
                background: 'rgba(8, 12, 22, 0.8)',
                color: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Categories</option>
              <option value="VIP">⭐ VIP Only</option>
              <option value="Emergency">🚨 Emergency Only</option>
              <option value="Official Guest">🏛️ Official Guest</option>
            </select>
          </div>
        </div>

        {/* Reservations Table */}
        <div style={{
          overflowX: 'auto',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          background: 'rgba(8, 12, 22, 0.6)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{
                background: 'rgba(15, 23, 42, 0.85)',
                borderBottom: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontSize: '11.5px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <th style={{ padding: '14px 16px' }}>Slot / Bay</th>
                <th style={{ padding: '14px 16px' }}>Category</th>
                <th style={{ padding: '14px 16px' }}>Vehicle Plate</th>
                <th style={{ padding: '14px 16px' }}>Reserved For / Dignitary</th>
                <th style={{ padding: '14px 16px' }}>Expected & Expiry</th>
                <th style={{ padding: '14px 16px' }}>Status</th>
                <th style={{ padding: '14px 16px' }}>Purpose / Notes</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <Crown size={36} color="rgba(234, 179, 8, 0.3)" />
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#E2E8F0' }}>No VIP Reservations Found</div>
                      <div style={{ fontSize: '12.5px' }}>
                        {searchQuery ? `No reservations matching "${searchQuery}".` : 'No active or historical VIP/Emergency reservations matching the current filters.'}
                      </div>
                      {userRole !== 'Unauthorized' && (
                        <button
                          onClick={() => handleOpenCreateModal()}
                          style={{
                            marginTop: '8px',
                            background: 'rgba(0, 240, 255, 0.15)',
                            border: '1px solid var(--border-neon-cyan)',
                            color: 'var(--cyan-primary)',
                            padding: '7px 16px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          + Create VIP Reservation Now
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReservations.map((res) => {
                  const targetSlot = slots.find(s => s.id === res.slotId);
                  const isCurrentlyOccupied = targetSlot ? targetSlot.occupied : false;

                  return (
                    <tr
                      key={res.id}
                      style={{
                        borderBottom: '1px solid rgba(30, 41, 59, 0.6)',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.5)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Slot ID Badge */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            onClick={() => handleInspectSlot(res.slotId)}
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 800,
                              fontSize: '13px',
                              padding: '4px 9px',
                              borderRadius: '6px',
                              background: 'rgba(0, 240, 255, 0.12)',
                              color: 'var(--cyan-primary)',
                              border: '1px solid var(--border-neon-cyan)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Click to inspect this bay in the interactive Slot Twin map"
                          >
                            <MapPin size={12} /> {res.slotId}
                          </span>
                          {targetSlot && (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              ({targetSlot.zone === 'two-wheeler' ? '2W' : '4W'})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td style={{ padding: '14px 16px' }}>
                        {res.reservationType === 'VIP' && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(234, 179, 8, 0.15)',
                            color: '#FACC15',
                            border: '1px solid rgba(234, 179, 8, 0.4)',
                            fontSize: '11.5px',
                            fontWeight: 700
                          }}>
                            <Crown size={12} /> VIP
                          </span>
                        )}
                        {res.reservationType === 'Emergency' && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#F87171',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            fontSize: '11.5px',
                            fontWeight: 700
                          }}>
                            <ShieldAlert size={12} /> Emergency
                          </span>
                        )}
                        {res.reservationType === 'Official Guest' && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(168, 85, 247, 0.15)',
                            color: '#C084FC',
                            border: '1px solid rgba(168, 85, 247, 0.4)',
                            fontSize: '11.5px',
                            fontWeight: 700
                          }}>
                            <User size={12} /> Official Guest
                          </span>
                        )}
                      </td>

                      {/* Vehicle Number & Type */}
                      <td style={{ padding: '14px 16px' }}>
                        <div>
                          <div style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800,
                            fontSize: '13.5px',
                            color: '#FFFFFF',
                            letterSpacing: '0.04em'
                          }}>
                            {res.vehicleNumber}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            {res.vehicleType === 'Two-Wheeler' ? <Bike size={11} /> : <Car size={11} />}
                            {res.vehicleType}
                          </div>
                        </div>
                      </td>

                      {/* Reserved For / Dignitary */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#E2E8F0' }}>
                          {res.reservedFor}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          By: {res.createdBy}
                        </div>
                      </td>

                      {/* Times */}
                      <td style={{ padding: '14px 16px', fontSize: '12px' }}>
                        <div style={{ color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Clock size={12} color="var(--cyan-primary)" />
                          ETA: <strong>{res.expectedArrival || 'N/A'}</strong>
                        </div>
                        <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                          Valid until: {res.expiryTime || 'End of Day'}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        {res.status === 'Reserved' && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(234, 179, 8, 0.15)',
                            color: '#FACC15',
                            border: '1px solid rgba(234, 179, 8, 0.4)',
                            fontSize: '11.5px',
                            fontWeight: 700
                          }}>
                            <Lock size={12} /> Reserved
                          </span>
                        )}
                        {res.status === 'Arrived / Checked In' && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34D399',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            fontSize: '11.5px',
                            fontWeight: 700
                          }}>
                            <CheckCircle2 size={12} /> Checked In
                          </span>
                        )}
                        {res.status === 'Completed' && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: '#60A5FA',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            fontSize: '11.5px',
                            fontWeight: 600
                          }}>
                            Completed
                          </span>
                        )}
                        {res.status === 'Released' && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(100, 116, 139, 0.15)',
                            color: '#94A3B8',
                            border: '1px solid rgba(100, 116, 139, 0.3)',
                            fontSize: '11.5px',
                            fontWeight: 500
                          }}>
                            <Unlock size={12} /> Released
                          </span>
                        )}
                        {res.status === 'Expired' && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#F87171',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            fontSize: '11.5px',
                            fontWeight: 600
                          }}>
                            <AlertTriangle size={12} /> Expired
                          </span>
                        )}
                      </td>

                      {/* Purpose */}
                      <td style={{ padding: '14px 16px', maxWidth: '240px' }}>
                        <div style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: '#CBD5E1',
                          fontSize: '12px'
                        }} title={res.reason}>
                          {res.reason}
                        </div>
                        {res.notes && (
                          <div style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginTop: '2px'
                          }} title={res.notes}>
                            Note: {res.notes}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          {/* Fast-Track Check-In Action (Only for Reserved status) */}
                          {res.status === 'Reserved' && (
                            <button
                              onClick={() => handleFastTrackCheckIn(res)}
                              disabled={userRole === 'Unauthorized'}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid rgba(16, 185, 129, 0.4)',
                                color: '#34D399',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                cursor: userRole === 'Unauthorized' ? 'not-allowed' : 'pointer'
                              }}
                              title="Instant Fast-Track gate check-in into reserved bay"
                            >
                              <CheckCircle2 size={13} /> Check-In
                            </button>
                          )}

                          {/* Release Reservation Action (For Reserved or Arrived) */}
                          {(res.status === 'Reserved' || res.status === 'Arrived / Checked In') && (
                            <button
                              onClick={() => handleOpenReleaseModal(res)}
                              disabled={userRole === 'Unauthorized'}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#F87171',
                                padding: '5px 9px',
                                borderRadius: '6px',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                cursor: userRole === 'Unauthorized' ? 'not-allowed' : 'pointer'
                              }}
                              title="Release VIP reservation lock (Preserves occupancy if vehicle is parked!)"
                            >
                              <Unlock size={13} /> Release
                            </button>
                          )}

                          {/* Details Inspector Button */}
                          <button
                            onClick={() => handleViewDetails(res)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-muted)',
                              padding: '5px 9px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              cursor: 'pointer'
                            }}
                            title="View Full Audit Records & Print Pass"
                          >
                            <Eye size={13} /> Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Available Bays Quick-Reserve Palette */}
      <div style={{
        background: 'rgba(13, 21, 39, 0.75)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '22px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
              Eligible Bays for Fast-Track VIP Lock ({availableSlotsForReservation.length} Available)
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Click any open bay to instantly launch the VIP reservation wizard. Occupied, disabled, and already-reserved bays are locked.
            </p>
          </div>
          <button
            onClick={() => setCurrentTab('slots')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              color: 'var(--cyan-primary)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Open Full Slot Telemetry Map <ArrowRight size={14} />
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '10px'
        }}>
          {slots.map(s => {
            const isReserved = s.isReserved || s.reservationStatus === 'Reserved' || s.reservationStatus === 'Arrived / Checked In';
            const isOccupied = s.occupied;
            const isDisabled = s.isDisabled;
            const isEligible = !isOccupied && !isDisabled && !isReserved;

            let bgColor = 'rgba(16, 185, 129, 0.12)';
            let borderColor = 'rgba(16, 185, 129, 0.35)';
            let textColor = '#34D399';
            let label = 'Available';

            if (isReserved) {
              bgColor = 'rgba(234, 179, 8, 0.15)';
              borderColor = 'rgba(234, 179, 8, 0.5)';
              textColor = '#FACC15';
              label = '⭐ VIP Locked';
            } else if (isOccupied) {
              bgColor = 'rgba(239, 68, 68, 0.12)';
              borderColor = 'rgba(239, 68, 68, 0.35)';
              textColor = '#F87171';
              label = 'Occupied';
            } else if (isDisabled) {
              bgColor = 'rgba(100, 116, 139, 0.15)';
              borderColor = 'rgba(100, 116, 139, 0.3)';
              textColor = '#94A3B8';
              label = 'Disabled';
            }

            return (
              <div
                key={s.id}
                onClick={() => {
                  if (isEligible) {
                    handleOpenCreateModal(s);
                  } else if (isReserved) {
                    // Find active reservation for this slot and inspect it
                    const activeRes = vipReservations.find(r => r.slotId === s.id && (r.status === 'Reserved' || r.status === 'Arrived / Checked In'));
                    if (activeRes) handleViewDetails(activeRes);
                  }
                }}
                style={{
                  background: bgColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '10px',
                  padding: '12px 10px',
                  textAlign: 'center',
                  cursor: isEligible || isReserved ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                className={isEligible ? 'hover-bright' : ''}
              >
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#FFFFFF'
                }}>
                  {s.id}
                </div>
                <div style={{ fontSize: '11px', color: textColor, fontWeight: 700, marginTop: '4px' }}>
                  {label}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {s.zone === 'two-wheeler' ? '2-Wheeler' : '4-Wheeler'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL 1: CREATE VIP RESERVATION */}
      {showCreateModal && (
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
            background: 'linear-gradient(135deg, #0D1527, #070B14)',
            border: '1px solid rgba(234, 179, 8, 0.4)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '26px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(234, 179, 8, 0.15)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(234, 179, 8, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Crown size={20} color="#EAB308" />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
                    Reserve VIP / Emergency Bay
                  </h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Locks parking bay immediately in SQLite and excludes it from public allocation.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#F87171',
                fontSize: '12.5px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertTriangle size={16} /> {formError}
              </div>
            )}

            <form onSubmit={handleSubmitReservation} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Row 1: Bay Selection & Reservation Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Select Open Bay *
                  </label>
                  <select
                    value={formSlotId}
                    onChange={handleSlotSelectChange}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(8, 12, 22, 0.9)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  >
                    {availableSlotsForReservation.length === 0 ? (
                      <option value="">No open bays available</option>
                    ) : (
                      availableSlotsForReservation.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.id} ({s.zone === 'two-wheeler' ? '2-Wheeler' : '4-Wheeler'})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Reservation Category *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(8, 12, 22, 0.9)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  >
                    <option value="VIP">⭐ VIP (Dignitary / VC / Trustee)</option>
                    <option value="Emergency">🚨 Emergency (Ambulance / Fire / Police)</option>
                    <option value="Official Guest">🏛️ Official Guest (Speaker / Auditor)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Vehicle Plate & Vehicle Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Vehicle Plate Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. KA-22-VIP-0001"
                    value={formVehicleNumber}
                    onChange={(e) => setFormVehicleNumber(e.target.value.toUpperCase())}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(8, 12, 22, 0.9)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Vehicle Type *
                  </label>
                  <select
                    value={formVehicleType}
                    onChange={(e) => setFormVehicleType(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(8, 12, 22, 0.9)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  >
                    <option value="Four-Wheeler">Four-Wheeler</option>
                    <option value="Two-Wheeler">Two-Wheeler</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Reserved For / Guest Designation */}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Reserved For / Dignitary Name & Designation *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hon. Vice Chancellor / State Education Minister"
                  value={formReservedFor}
                  onChange={(e) => setFormReservedFor(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(8, 12, 22, 0.9)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Row 4: Expected Arrival & Expiry */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Expected Arrival Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 11:30 AM"
                    value={formExpectedArrival}
                    onChange={(e) => setFormExpectedArrival(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(8, 12, 22, 0.9)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Expiry Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 06:00 PM"
                    value={formExpiryTime}
                    onChange={(e) => setFormExpiryTime(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(8, 12, 22, 0.9)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Row 5: Purpose / Reason (Mandatory) */}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Official Reason / Protocol Purpose * (Required for Audit)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Annual Convocation Ceremony / State Infrastructure Review"
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(8, 12, 22, 0.9)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Row 6: Security Instructions / Notes */}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Security Instructions / Gate Notes
                </label>
                <textarea
                  placeholder="Special instructions for Gate 2 barrier bypass, escort team, or parking marshals..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%',
                    background: 'rgba(8, 12, 22, 0.9)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    padding: '9px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || availableSlotsForReservation.length === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #EAB308, #CA8A04)',
                    border: 'none',
                    color: '#070B14',
                    padding: '9px 20px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: formSubmitting ? 'wait' : 'pointer',
                    boxShadow: '0 4px 16px rgba(234, 179, 8, 0.35)'
                  }}
                >
                  <Lock size={15} />
                  {formSubmitting ? 'Reserving...' : 'Confirm Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RELEASE RESERVATION CONFIRMATION */}
      {showReleaseModal && selectedRes && (
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
            background: 'linear-gradient(135deg, #0D1527, #070B14)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            padding: '26px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Unlock size={22} color="#EF4444" />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
                  Release VIP Reservation?
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Slot <strong>{selectedRes.slotId}</strong> ({selectedRes.vehicleNumber})
                </p>
              </div>
            </div>

            {/* Crucial Rule 5 Notice: Releasing reservation preserves vehicle occupancy */}
            <div style={{
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              color: '#FDE047',
              fontSize: '12px',
              marginBottom: '16px',
              display: 'flex',
              gap: '10px'
            }}>
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Occupancy Safeguard:</strong> Releasing this reservation releases the priority lock. If the vehicle is currently parked inside bay {selectedRes.slotId}, the bay will <strong>remain Occupied</strong> until vehicle check-out. It will not be falsely marked Available.
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Reason for Release (Optional Audit Note)
              </label>
              <input
                type="text"
                placeholder="e.g. Dignitary departure / Event completed early"
                value={releaseReason}
                onChange={(e) => setReleaseReason(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(8, 12, 22, 0.9)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowReleaseModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRelease}
                disabled={releaseSubmitting}
                style={{
                  background: 'linear-gradient(135deg, #EF4444, #B91C1C)',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '9px 20px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: releaseSubmitting ? 'wait' : 'pointer'
                }}
              >
                {releaseSubmitting ? 'Releasing...' : 'Confirm Release'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW RESERVATION DETAILS & PASS */}
      {showDetailModal && selectedRes && (
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
            background: 'linear-gradient(135deg, #0D1527, #070B14)',
            border: '1px solid rgba(0, 240, 255, 0.4)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            padding: '26px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 240, 255, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <span style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--cyan-primary)',
                  letterSpacing: '0.05em'
                }}>
                  {selectedRes.id}
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)', marginTop: '2px' }}>
                  VIP Parking Pass & Security Clearance
                </h3>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Pass Card Preview */}
            <div style={{
              background: 'rgba(8, 12, 22, 0.8)',
              border: '1px dashed rgba(0, 240, 255, 0.4)',
              borderRadius: '12px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '18px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#FACC15',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <Crown size={14} /> {selectedRes.reservationType} CLEARANCE
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '16px',
                  fontWeight: 800,
                  color: 'var(--cyan-primary)'
                }}>
                  BAY {selectedRes.slotId}
                </span>
              </div>

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AUTHORIZED VEHICLE</div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  letterSpacing: '0.05em'
                }}>
                  {selectedRes.vehicleNumber}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>GUEST / DIGNITARY</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
                  {selectedRes.reservedFor}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>EXPECTED ARRIVAL</div>
                  <div style={{ fontSize: '12.5px', color: '#E2E8F0', fontWeight: 600 }}>{selectedRes.expectedArrival || 'Open'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>EXPIRY</div>
                  <div style={{ fontSize: '12.5px', color: '#E2E8F0', fontWeight: 600 }}>{selectedRes.expiryTime || 'End of Day'}</div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PROTOCOL PURPOSE</div>
                <div style={{ fontSize: '12.5px', color: '#CBD5E1' }}>{selectedRes.reason}</div>
              </div>

              {selectedRes.notes && (
                <div style={{ fontSize: '11.5px', color: '#94A3B8' }}>
                  <strong>Security Note:</strong> {selectedRes.notes}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => {
                  window.print();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--border-subtle)',
                  color: '#FFFFFF',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  cursor: 'pointer'
                }}
              >
                <Printer size={14} /> Print Pass
              </button>

              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  background: 'var(--cyan-primary)',
                  border: 'none',
                  color: '#070B14',
                  padding: '9px 20px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
