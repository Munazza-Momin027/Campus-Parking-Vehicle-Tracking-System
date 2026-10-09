import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings,
  CircleDollarSign,
  Shield,
  Volume2,
  CheckCircle,
  Save,
  RotateCcw,
  Database,
  ParkingSquare,
  Plus,
  Edit2,
  Trash2,
  Power,
  Search,
  Filter,
  Car,
  Bike,
  AlertCircle,
  Check,
  X,
  Radio,
  MapPin,
  Sliders,
  Sparkles,
  Info,
  ShieldCheck,
  AlertTriangle,
  Crown
} from 'lucide-react';
import { playSound } from '../utils/audio';

export default function SettingsView() {
  const {
    settings,
    setSettings,
    soundEnabled,
    setSoundEnabled,
    resetDatabaseToDefaults,
    dbStatus,
    isDbConnected,
    slots,
    metrics,
    createParkingSlot,
    editParkingSlot,
    toggleParkingSlotStatus,
    deleteParkingSlot,
    getNextSlotId,
    setCurrentTab
  } = useApp();

  // Top Tabs: 'tariffs' vs 'slots'
  const [activeTab, setActiveTab] = useState('slots');

  // Tariffs / General Settings Form State
  const [formState, setFormState] = useState({ ...settings });
  const [savedNotice, setSavedNotice] = useState(false);

  // Slot Management Filters & Search
  const [slotSearch, setSlotSearch] = useState('');
  const [filterType, setFilterType] = useState('All'); // 'All', 'Two-Wheeler', 'Four-Wheeler'
  const [filterZone, setFilterZone] = useState('All'); // 'All', 'two-wheeler', 'four-wheeler', custom
  const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'Available', 'Occupied', 'Detection Pending', 'Disabled'
  const [filterGate, setFilterGate] = useState('All'); // 'All', 'Universal', 'Student', 'Staff', 'Visitor'

  // Modals: 'add' | 'edit' | null
  const [modalMode, setModalMode] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [modalSuccess, setModalSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active Slot Form for Modal
  const [activeSlotForm, setActiveSlotForm] = useState({
    id: '',
    type: 'Four-Wheeler',
    zone: 'four-wheeler',
    customZone: '',
    gateCategory: 'Universal',
    status: 'Available',
    floor: 'Ground Level',
    row: '',
    location: '',
    sensorType: 'System-Managed'
  });

  // Handle General Settings Save
  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSettings(formState);
    playSound('success', soundEnabled);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  // Open Add Slot Modal
  const handleOpenAddModal = async () => {
    playSound('beep', soundEnabled);
    setModalError(null);
    setModalSuccess(null);

    // Auto-generate next standardized Slot ID
    let suggestedId = 'F-06';
    if (getNextSlotId) {
      suggestedId = await getNextSlotId('Four-Wheeler');
    }

    setActiveSlotForm({
      id: suggestedId,
      type: 'Four-Wheeler',
      zone: 'four-wheeler',
      customZone: '',
      gateCategory: 'Universal',
      status: 'Available',
      floor: 'Zone F — Ground Level',
      row: 'Row A',
      location: `Zone F Ground Bay ${suggestedId}`,
      sensorType: 'System-Managed'
    });

    setModalMode('add');
  };

  // Open Edit Slot Modal
  const handleOpenEditModal = (slot) => {
    playSound('beep', soundEnabled);
    setModalError(null);
    setModalSuccess(null);

    setActiveSlotForm({
      id: slot.id,
      type: slot.type || (slot.zone === 'two-wheeler' ? 'Two-Wheeler' : 'Four-Wheeler'),
      zone: slot.zone || 'four-wheeler',
      customZone: '',
      gateCategory: slot.gateCategory || 'Universal',
      status: slot.status || 'Available',
      floor: slot.floor || (slot.zone === 'four-wheeler' ? 'Zone F — Ground Level' : 'Zone T — East Wing'),
      row: slot.row || '',
      location: slot.location || '',
      sensorType: slot.sensorType || 'System-Managed',
      occupied: Boolean(slot.occupied),
      vehicleNumber: slot.vehicleNumber || null
    });

    setModalMode('edit');
  };

  // Handle Auto-Generate ID Click
  const handleAutoGenerateId = async (vehicleType) => {
    if (getNextSlotId) {
      const nextId = await getNextSlotId(vehicleType);
      setActiveSlotForm(prev => ({
        ...prev,
        id: nextId,
        location: prev.location.includes(prev.id) ? prev.location.replace(prev.id, nextId) : prev.location
      }));
    }
  };

  // Handle Vehicle Type Change in Modal
  const handleVehicleTypeChange = async (type) => {
    const isTwo = type === 'Two-Wheeler';
    const zone = isTwo ? 'two-wheeler' : 'four-wheeler';
    const floor = isTwo ? 'Zone T — East Wing' : 'Zone F — Ground Level';

    let nextId = activeSlotForm.id;
    if (modalMode === 'add') {
      nextId = await getNextSlotId(type);
    }

    setActiveSlotForm(prev => ({
      ...prev,
      type,
      zone,
      id: nextId,
      floor,
      location: `${floor} ${nextId}`
    }));
  };

  // Submit Modal Form (Add or Edit)
  const handleSlotFormSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);

    const cleanId = (activeSlotForm.id || '').trim().toUpperCase();
    if (!cleanId) {
      setModalError('Slot ID is required.');
      return;
    }

    // Pattern validation (e.g. T-11, F-06, VIP-01)
    const idPattern = /^[A-Z0-9]{1,6}-\d{1,}$/i;
    if (!idPattern.test(cleanId)) {
      setModalError(`Invalid format '${cleanId}'. Slot ID must follow a consistent pattern such as T-11 or F-06.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const finalZone = activeSlotForm.zone === 'custom'
        ? (activeSlotForm.customZone.trim().toLowerCase() || 'custom-zone')
        : activeSlotForm.zone;

      const payload = {
        id: cleanId,
        type: activeSlotForm.type,
        zone: finalZone,
        gateCategory: activeSlotForm.gateCategory,
        status: activeSlotForm.status,
        floor: activeSlotForm.floor,
        row: activeSlotForm.row,
        location: activeSlotForm.location || `${activeSlotForm.floor} ${cleanId}`,
        sensorType: activeSlotForm.sensorType
      };

      if (modalMode === 'add') {
        const res = await createParkingSlot(payload);
        if (res.success) {
          setModalSuccess(`✓ Parking slot ${cleanId} successfully created in persistent SQLite database!`);
          setTimeout(() => {
            setModalMode(null);
            setIsSubmitting(false);
          }, 1200);
        } else {
          setModalError(res.error || 'Failed to create slot.');
          setIsSubmitting(false);
        }
      } else if (modalMode === 'edit') {
        const res = await editParkingSlot(cleanId, payload);
        if (res.success) {
          setModalSuccess(`✓ Parking slot ${cleanId} details successfully updated in SQLite database!`);
          setTimeout(() => {
            setModalMode(null);
            setIsSubmitting(false);
          }, 1200);
        } else {
          setModalError(res.error || 'Failed to update slot.');
          setIsSubmitting(false);
        }
      }
    } catch (err) {
      setModalError(err.message);
      setIsSubmitting(false);
    }
  };

  // Toggle Slot Status (Disable / Enable)
  const handleToggleSlotStatus = async (slot, e) => {
    e.stopPropagation();
    if (slot.occupied) {
      alert(`Cannot disable slot ${slot.id} while vehicle ${slot.vehicleNumber} is actively parked.`);
      return;
    }
    const res = await toggleParkingSlotStatus(slot.id);
    if (!res.success) {
      alert(res.error || 'Failed to toggle slot status.');
    }
  };

  // Delete Slot with Integrity Guard
  const handleDeleteSlot = async (slot, e) => {
    e.stopPropagation();
    if (slot.occupied) {
      alert(`Cannot delete slot ${slot.id}: Vehicle ${slot.vehicleNumber} is currently parked in this bay.`);
      return;
    }
    if (slot.isPending) {
      alert(`Cannot delete slot ${slot.id}: Active optical detection is pending.`);
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete Parking Slot ${slot.id} from inventory?`)) {
      const res = await deleteParkingSlot(slot.id);
      if (!res.success) {
        alert(res.error || 'Failed to delete slot.');
      }
    }
  };

  // Distinct Zones list for filtering
  const availableZones = useMemo(() => {
    const set = new Set(slots.map(s => s.zone).filter(Boolean));
    return Array.from(set);
  }, [slots]);

  // Filtered Slots for Table View
  const filteredSlots = useMemo(() => {
    return slots.filter(slot => {
      // 1. Search Query
      const q = slotSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        slot.id.toLowerCase().includes(q) ||
        (slot.vehicleNumber && slot.vehicleNumber.toLowerCase().includes(q)) ||
        (slot.driver && slot.driver.toLowerCase().includes(q)) ||
        (slot.location && slot.location.toLowerCase().includes(q)) ||
        (slot.floor && slot.floor.toLowerCase().includes(q)) ||
        (slot.zone && slot.zone.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // 2. Vehicle Type
      if (filterType !== 'All' && slot.type !== filterType) return false;

      // 3. Zone
      if (filterZone !== 'All' && slot.zone !== filterZone) return false;

      // 4. Gate Category
      if (filterGate !== 'All') {
        const slotGate = slot.gateCategory || 'Universal';
        if (slotGate !== filterGate) return false;
      }

      // 5. Status
      if (filterStatus !== 'All') {
        if (filterStatus === 'Available') {
          if (slot.occupied || slot.isPending || slot.status === 'Disabled' || slot.isDisabled) return false;
        } else if (filterStatus === 'Occupied') {
          if (!slot.occupied) return false;
        } else if (filterStatus === 'Detection Pending') {
          if (!slot.isPending && slot.status !== 'Detection Pending') return false;
        } else if (filterStatus === 'Disabled') {
          if (slot.status !== 'Disabled' && !slot.isDisabled) return false;
        }
      }

      return true;
    });
  }, [slots, slotSearch, filterType, filterZone, filterGate, filterStatus]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', paddingBottom: '40px' }}>
      
      {/* 1. Header & Navigation Sub-Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
              Settings & Inventory Configuration
            </h1>
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(0, 240, 255, 0.12)',
              color: 'var(--cyan-primary)',
              padding: '3px 9px',
              borderRadius: '6px',
              border: '1px solid rgba(0, 240, 255, 0.35)',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <ShieldCheck size={13} /> ADMIN VAULT
            </span>
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(16, 185, 129, 0.12)',
              color: 'var(--green-bright)',
              padding: '3px 9px',
              borderRadius: '6px',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Database size={13} /> SQLITE PERSISTED
            </span>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Manage dynamic campus parking bay inventory, vehicle type restrictions, dedicated gate categories & tariff parameters
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(8, 14, 28, 0.85)',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => { playSound('beep', soundEnabled); setActiveTab('slots'); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: activeTab === 'slots' ? '1px solid var(--border-neon-cyan)' : '1px solid transparent',
              background: activeTab === 'slots' ? 'rgba(0, 240, 255, 0.12)' : 'transparent',
              color: activeTab === 'slots' ? 'var(--cyan-primary)' : 'var(--text-muted)',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.18s ease'
            }}
          >
            <ParkingSquare size={16} />
            <span>Parking Slot Management</span>
            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              padding: '1px 6px',
              borderRadius: '10px',
              background: activeTab === 'slots' ? 'rgba(0, 240, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)',
              color: activeTab === 'slots' ? '#FFFFFF' : 'var(--text-dim)'
            }}>
              {slots.length}
            </span>
          </button>

          <button
            onClick={() => { playSound('beep', soundEnabled); setActiveTab('tariffs'); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: activeTab === 'tariffs' ? '1px solid var(--border-neon-cyan)' : '1px solid transparent',
              background: activeTab === 'tariffs' ? 'rgba(0, 240, 255, 0.12)' : 'transparent',
              color: activeTab === 'tariffs' ? 'var(--cyan-primary)' : 'var(--text-muted)',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.18s ease'
            }}
          >
            <Sliders size={16} />
            <span>Tariffs & System Rules</span>
          </button>

          <button
            onClick={() => setCurrentTab('vip-reservations')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(234, 179, 8, 0.4)',
              background: 'rgba(234, 179, 8, 0.12)',
              color: '#FACC15',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.18s ease'
            }}
            className="hover-bright"
            title="Jump to Fast-Track VIP & Emergency Reservation Portal"
          >
            <Crown size={15} color="#EAB308" />
            <span>VIP Reservations</span>
            {metrics.reservedSlots > 0 && (
              <span style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                padding: '1px 6px',
                borderRadius: '10px',
                background: 'rgba(234, 179, 8, 0.3)',
                color: '#FFFFFF'
              }}>
                {metrics.reservedSlots} Locked
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION A: PARKING SLOT MANAGEMENT (INVENTORY & ALLOCATION CRUD)            */}
      {/* ========================================================================= */}
      {activeTab === 'slots' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* 1. Inventory Metric Stats Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
            {/* Total Slots */}
            <div className="glass-panel" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '8px',
                background: 'rgba(58, 134, 255, 0.15)', border: '1px solid rgba(58, 134, 255, 0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-hover)'
              }}>
                <ParkingSquare size={20} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 500 }}>Total Bays</div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                  {metrics.totalSlots}
                </div>
              </div>
            </div>

            {/* Available */}
            <div className="glass-panel" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green-bright)'
              }}>
                <CheckCircle size={20} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 500 }}>Available</div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--green-bright)', fontFamily: 'var(--font-mono)' }}>
                  {metrics.available}
                </div>
              </div>
            </div>

            {/* Occupied */}
            <div className="glass-panel" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F87171'
              }}>
                <Car size={20} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 500 }}>Occupied</div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#F87171', fontFamily: 'var(--font-mono)' }}>
                  {metrics.occupied}
                </div>
              </div>
            </div>

            {/* Two-Wheeler Total */}
            <div className="glass-panel" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '8px',
                background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--purple-bright)'
              }}>
                <Bike size={20} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 500 }}>Two-Wheelers</div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                  {metrics.twoWheelersTotal}
                </div>
              </div>
            </div>

            {/* Four-Wheeler Total */}
            <div className="glass-panel" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '8px',
                background: 'rgba(0, 240, 255, 0.15)', border: '1px solid rgba(0, 240, 255, 0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan-primary)'
              }}>
                <Car size={20} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 500 }}>Four-Wheelers</div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                  {metrics.fourWheelersTotal}
                </div>
              </div>
            </div>

            {/* Disabled / Maintenance */}
            <div className="glass-panel" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '8px',
                background: 'rgba(100, 116, 139, 0.15)', border: '1px solid rgba(100, 116, 139, 0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8'
              }}>
                <Power size={20} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 500 }}>Disabled</div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
                  {metrics.disabled}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Controls Bar: Search, Filters & Prominent “+ Add Parking Slot” Button */}
          <div className="glass-panel" style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', flex: 1, minWidth: '320px' }}>
              {/* Search Box */}
              <div style={{
                position: 'relative',
                minWidth: '240px',
                flex: 1
              }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="Search Slot ID (T-01, F-06), bay location, plate..."
                  value={slotSearch}
                  onChange={(e) => setSlotSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-light)',
                    color: '#FFFFFF',
                    fontSize: '12.5px'
                  }}
                />
                {slotSearch && (
                  <button
                    onClick={() => setSlotSearch('')}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-light)',
                  color: '#FFFFFF',
                  fontSize: '12px'
                }}
              >
                <option value="All">All Vehicle Types</option>
                <option value="Two-Wheeler">Two-Wheeler</option>
                <option value="Four-Wheeler">Four-Wheeler</option>
              </select>

              {/* Zone Filter */}
              <select
                value={filterZone}
                onChange={(e) => setFilterZone(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-light)',
                  color: '#FFFFFF',
                  fontSize: '12px'
                }}
              >
                <option value="All">All Parking Zones</option>
                <option value="two-wheeler">two-wheeler (Zone T)</option>
                <option value="four-wheeler">four-wheeler (Zone F)</option>
                {availableZones.filter(z => z !== 'two-wheeler' && z !== 'four-wheeler').map(z => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>

              {/* Gate Category Filter */}
              <select
                value={filterGate}
                onChange={(e) => setFilterGate(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-light)',
                  color: '#FFFFFF',
                  fontSize: '12px'
                }}
              >
                <option value="All">All Gate Rules</option>
                <option value="Universal">Universal (All Gates)</option>
                <option value="Student">Student Gate (Gate 1)</option>
                <option value="Staff">Staff Gate (Gate 2)</option>
                <option value="Visitor">Visitor Gate (Gate 3)</option>
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-light)',
                  color: '#FFFFFF',
                  fontSize: '12px'
                }}
              >
                <option value="All">All Statuses</option>
                <option value="Available">Available Only</option>
                <option value="Occupied">Occupied Only</option>
                <option value="Detection Pending">Detection Pending</option>
                <option value="Disabled">Disabled Only</option>
              </select>
            </div>

            {/* Prominent "+ Add Parking Slot" Button */}
            <button
              onClick={handleOpenAddModal}
              className="btn-primary"
              style={{
                padding: '9px 20px',
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '0.02em',
                background: 'linear-gradient(135deg, #00F0FF 0%, #3A86FF 100%)',
                color: '#050811',
                border: 'none',
                boxShadow: '0 0 20px rgba(0, 240, 255, 0.45)',
                gap: '8px'
              }}
            >
              <Plus size={17} strokeWidth={3} />
              <span>+ Add Parking Slot</span>
            </button>
          </div>

          {/* 3. Slot Management Table */}
          <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
              <thead>
                <tr style={{
                  background: 'rgba(15, 23, 42, 0.95)',
                  borderBottom: '1px solid var(--border-light)',
                  color: 'var(--text-dim)',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em'
                }}>
                  <th style={{ padding: '14px 18px' }}>Slot ID</th>
                  <th style={{ padding: '14px 14px' }}>Vehicle Type</th>
                  <th style={{ padding: '14px 14px' }}>Zone</th>
                  <th style={{ padding: '14px 14px' }}>Gate Rule</th>
                  <th style={{ padding: '14px 14px' }}>Location / Floor</th>
                  <th style={{ padding: '14px 14px' }}>Detection Mode</th>
                  <th style={{ padding: '14px 14px' }}>Status</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSlots.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No parking slots match the selected filters. Click <strong>“+ Add Parking Slot”</strong> to register a new slot.
                    </td>
                  </tr>
                ) : (
                  filteredSlots.map((slot) => {
                    const isOccupied = slot.occupied;
                    const isPending = slot.isPending || slot.status === 'Detection Pending';
                    const isDisabled = slot.status === 'Disabled' || slot.isDisabled;

                    let statusBadge = (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        background: 'rgba(16, 185, 129, 0.15)', color: 'var(--green-bright)',
                        border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '6px',
                        padding: '3px 8px', fontSize: '10.5px', fontWeight: 800, fontFamily: 'var(--font-mono)'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green-bright)' }} />
                        AVAILABLE
                      </span>
                    );

                    if (isOccupied) {
                      statusBadge = (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          background: 'rgba(239, 68, 68, 0.15)', color: '#F87171',
                          border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '6px',
                          padding: '3px 8px', fontSize: '10.5px', fontWeight: 800, fontFamily: 'var(--font-mono)'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444' }} />
                          OCCUPIED ({slot.vehicleNumber || 'Parked'})
                        </span>
                      );
                    } else if (isPending) {
                      statusBadge = (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          background: 'rgba(245, 158, 11, 0.15)', color: 'var(--orange-bright)',
                          border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '6px',
                          padding: '3px 8px', fontSize: '10.5px', fontWeight: 800, fontFamily: 'var(--font-mono)'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--orange-bright)' }} />
                          PENDING ({slot.vehicleNumber || 'Scan'})
                        </span>
                      );
                    } else if (isDisabled) {
                      statusBadge = (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          background: 'rgba(100, 116, 139, 0.15)', color: '#94A3B8',
                          border: '1px solid rgba(100, 116, 139, 0.4)', borderRadius: '6px',
                          padding: '3px 8px', fontSize: '10.5px', fontWeight: 800, fontFamily: 'var(--font-mono)'
                        }}>
                          <Power size={11} />
                          DISABLED (MAINTENANCE)
                        </span>
                      );
                    } else if (slot.isReserved || slot.reservationStatus === 'Reserved' || slot.reservationStatus === 'Arrived / Checked In') {
                      statusBadge = (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          background: 'rgba(234, 179, 8, 0.18)', color: '#FACC15',
                          border: '1px solid rgba(234, 179, 8, 0.5)', borderRadius: '6px',
                          padding: '3px 8px', fontSize: '10.5px', fontWeight: 800, fontFamily: 'var(--font-mono)'
                        }}>
                          <Crown size={11} color="#EAB308" />
                          VIP LOCKED
                        </span>
                      );
                    }

                    return (
                      <tr
                        key={slot.id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          background: isDisabled ? 'rgba(15, 23, 42, 0.4)' : 'transparent',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        {/* Slot ID */}
                        <td style={{ padding: '12px 18px' }}>
                          <span className="plate-badge" style={{ fontSize: '12px', fontWeight: 900 }}>
                            {slot.id}
                          </span>
                        </td>

                        {/* Vehicle Type */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                            {slot.type === 'Four-Wheeler' ? (
                              <Car size={15} style={{ color: 'var(--cyan-primary)' }} />
                            ) : (
                              <Bike size={15} style={{ color: 'var(--blue-hover)' }} />
                            )}
                            <span style={{ fontWeight: 600, color: '#FFFFFF' }}>{slot.type}</span>
                          </div>
                        </td>

                        {/* Zone */}
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            fontSize: '11px',
                            fontFamily: 'var(--font-mono)',
                            color: slot.zone === 'four-wheeler' ? 'var(--cyan-primary)' : slot.zone === 'two-wheeler' ? 'var(--blue-hover)' : 'var(--purple-bright)',
                            background: 'rgba(255, 255, 255, 0.03)',
                            padding: '2px 7px',
                            borderRadius: '4px'
                          }}>
                            {slot.zone}
                          </span>
                        </td>

                        {/* Gate Rule */}
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontWeight: 700,
                            background: slot.gateCategory === 'Student'
                              ? 'rgba(58, 134, 255, 0.15)'
                              : slot.gateCategory === 'Staff'
                              ? 'rgba(139, 92, 246, 0.15)'
                              : slot.gateCategory === 'Visitor'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(255, 255, 255, 0.06)',
                            color: slot.gateCategory === 'Student'
                              ? 'var(--blue-hover)'
                              : slot.gateCategory === 'Staff'
                              ? 'var(--purple-bright)'
                              : slot.gateCategory === 'Visitor'
                              ? 'var(--green-bright)'
                              : '#E2E8F0',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }}>
                            {slot.gateCategory ? `${slot.gateCategory} Gate` : 'Universal'}
                          </span>
                        </td>

                        {/* Location / Floor */}
                        <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <MapPin size={12} style={{ color: 'var(--text-dim)' }} />
                            <span>{slot.location || slot.floor || `${slot.zone} bay`}</span>
                          </div>
                        </td>

                        {/* Sensor Mode */}
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            fontSize: '10.5px',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-dim)',
                            background: 'rgba(255, 255, 255, 0.03)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-subtle)'
                          }}>
                            {slot.sensorType || 'System-Managed'}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '12px 14px' }}>
                          {statusBadge}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEditModal(slot)}
                              title="Edit Slot Details"
                              style={{
                                background: 'rgba(0, 240, 255, 0.1)',
                                border: '1px solid rgba(0, 240, 255, 0.3)',
                                color: 'var(--cyan-primary)',
                                padding: '5px 8px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Edit2 size={13} />
                            </button>

                            {/* Disable / Enable Button */}
                            <button
                              onClick={(e) => handleToggleSlotStatus(slot, e)}
                              disabled={Boolean(slot.occupied)}
                              title={slot.occupied ? 'Cannot disable while occupied' : isDisabled ? 'Enable Slot' : 'Disable Slot'}
                              style={{
                                background: isDisabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                border: isDisabled ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                                color: isDisabled ? 'var(--green-bright)' : 'var(--orange-bright)',
                                padding: '5px 8px',
                                borderRadius: '6px',
                                cursor: slot.occupied ? 'not-allowed' : 'pointer',
                                opacity: slot.occupied ? 0.4 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Power size={13} />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={(e) => handleDeleteSlot(slot, e)}
                              disabled={Boolean(slot.occupied || slot.isPending)}
                              title={slot.occupied ? 'Cannot delete while vehicle is parked' : 'Delete Slot'}
                              style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#EF4444',
                                padding: '5px 8px',
                                borderRadius: '6px',
                                cursor: (slot.occupied || slot.isPending) ? 'not-allowed' : 'pointer',
                                opacity: (slot.occupied || slot.isPending) ? 0.35 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Trash2 size={13} />
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
      )}

      {/* ========================================================================= */}
      {/* SECTION B: TARIFFS & OPERATIONAL RULES (EXISTING FEATURES PRESERVED)      */}
      {/* ========================================================================= */}
      {activeTab === 'tariffs' && (
        <form onSubmit={handleSaveSettings} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          {/* Card 1: Tariffs & Parking Rules */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.2)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: 'var(--orange-bright)'
              }}>
                <CircleDollarSign size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>Campus Parking Tariffs</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Automated hourly fee schedules computed during vehicle check-out</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Visitor Hourly Fee (₹)
                </label>
                <input
                  type="number"
                  value={formState.visitorRateHourly}
                  onChange={(e) => setFormState({ ...formState, visitorRateHourly: Number(e.target.value) })}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-light)',
                    color: '#FFFFFF', fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Student Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={formState.studentRate}
                    onChange={(e) => setFormState({ ...formState, studentRate: Number(e.target.value) })}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-light)',
                      color: '#FFFFFF', fontFamily: 'var(--font-mono)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Faculty / Staff Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={formState.staffRate}
                    onChange={(e) => setFormState({ ...formState, staffRate: Number(e.target.value) })}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-light)',
                      color: '#FFFFFF', fontFamily: 'var(--font-mono)'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Security & Barrier Controls */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'rgba(0, 240, 255, 0.15)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: 'var(--cyan-primary)'
              }}>
                <Shield size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>Security Officer Profile & Barrier</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Guard on duty badge and barrier gate servo controls</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Duty Officer Name
                </label>
                <input
                  type="text"
                  value={formState.officerName}
                  onChange={(e) => setFormState({ ...formState, officerName: e.target.value })}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-light)',
                    color: '#FFFFFF'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Officer Badge ID
                </label>
                <input
                  type="text"
                  value={formState.officerBadge}
                  onChange={(e) => setFormState({ ...formState, officerBadge: e.target.value })}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-light)',
                    color: 'var(--cyan-primary)', fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>

              {/* Barrier Auto-Open */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)'
              }}>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#FFFFFF' }}>Auto-Open Barrier on Whitelist Plate</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Sends instantaneous relay pulse to barrier servo motor</div>
                </div>
                <input
                  type="checkbox"
                  checked={formState.barrierAutoOpen}
                  onChange={(e) => setFormState({ ...formState, barrierAutoOpen: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--cyan-primary)' }}
                />
              </div>
            </div>
          </div>

          {/* Save Bar & SQLite Maintenance */}
          <div style={{
            gridColumn: 'span 2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            padding: '14px 18px',
            background: 'rgba(8, 14, 28, 0.7)',
            border: '1px solid var(--border-light)',
            borderRadius: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={15} style={{ color: isDbConnected ? 'var(--green-bright)' : '#EF4444' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Storage Engine: <strong style={{ color: '#FFFFFF' }}>SQLite 3 (ACID Persistent)</strong> • File: <code style={{ color: 'var(--cyan-primary)', fontSize: '11px' }}>database/cpvts.db</code>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to restore the SQLite database to factory default institutional seed records? All modifications will be reset.')) {
                    resetDatabaseToDefaults();
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#EF4444',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={14} /> Restore Factory DB Defaults
              </button>

              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '9px 22px' }}
              >
                <Save size={15} /> Save Configuration to SQLite
              </button>
            </div>
          </div>

        </form>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT PARKING SLOT                                            */}
      {/* ========================================================================= */}
      {modalMode && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(2, 6, 17, 0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(10, 16, 32, 0.98)',
            border: '1px solid var(--border-neon-cyan)',
            boxShadow: '0 0 35px rgba(0, 240, 255, 0.25)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'rgba(0, 240, 255, 0.15)', border: '1px solid var(--border-neon-cyan)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan-primary)'
                }}>
                  <ParkingSquare size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
                    {modalMode === 'add' ? '+ Add New Parking Slot' : `Edit Parking Slot: ${activeSlotForm.id}`}
                  </h2>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {modalMode === 'add' ? 'Register a new bay in persistent database inventory' : 'Update bay parameters & allocation constraints'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModalMode(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: 'var(--text-dim)',
                  padding: '6px',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Error & Success Feedback Banners */}
            {modalError && (
              <div style={{
                padding: '10px 14px', borderRadius: '8px', marginBottom: '14px',
                background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444',
                color: '#FCA5A5', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <AlertCircle size={16} color="#EF4444" flexShrink={0} />
                <span>{modalError}</span>
              </div>
            )}

            {modalSuccess && (
              <div style={{
                padding: '10px 14px', borderRadius: '8px', marginBottom: '14px',
                background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--border-neon-green)',
                color: 'var(--green-bright)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <CheckCircle size={16} color="var(--green-bright)" flexShrink={0} />
                <span>{modalSuccess}</span>
              </div>
            )}

            {/* Occupied Warning in Edit Mode */}
            {modalMode === 'edit' && activeSlotForm.occupied && (
              <div style={{
                padding: '10px 14px', borderRadius: '8px', marginBottom: '14px',
                background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#FEF3C7', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <AlertTriangle size={16} color="var(--orange-bright)" flexShrink={0} />
                <span>
                  <strong>Active Vehicle Parked:</strong> Vehicle <strong>{activeSlotForm.vehicleNumber}</strong> is currently parked here. Status cannot be marked available without vehicle check-out.
                </span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSlotFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Vehicle Type Selector */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  Vehicle Type *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    disabled={modalMode === 'edit' && activeSlotForm.occupied}
                    onClick={() => handleVehicleTypeChange('Four-Wheeler')}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      padding: '10px', borderRadius: '8px',
                      border: activeSlotForm.type === 'Four-Wheeler' ? '1.5px solid var(--border-neon-cyan)' : '1px solid var(--border-light)',
                      background: activeSlotForm.type === 'Four-Wheeler' ? 'rgba(0, 240, 255, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                      color: activeSlotForm.type === 'Four-Wheeler' ? 'var(--cyan-primary)' : 'var(--text-muted)',
                      fontWeight: 700, fontSize: '12.5px', cursor: (modalMode === 'edit' && activeSlotForm.occupied) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Car size={16} /> Four-Wheeler (Car / SUV)
                  </button>

                  <button
                    type="button"
                    disabled={modalMode === 'edit' && activeSlotForm.occupied}
                    onClick={() => handleVehicleTypeChange('Two-Wheeler')}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      padding: '10px', borderRadius: '8px',
                      border: activeSlotForm.type === 'Two-Wheeler' ? '1.5px solid var(--border-neon-cyan)' : '1px solid var(--border-light)',
                      background: activeSlotForm.type === 'Two-Wheeler' ? 'rgba(0, 240, 255, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                      color: activeSlotForm.type === 'Two-Wheeler' ? 'var(--cyan-primary)' : 'var(--text-muted)',
                      fontWeight: 700, fontSize: '12.5px', cursor: (modalMode === 'edit' && activeSlotForm.occupied) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Bike size={16} /> Two-Wheeler (Bike / Scooter)
                  </button>
                </div>
              </div>

              {/* Slot ID Field with Auto-Generate button */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                    Slot ID (e.g. T-11 or F-06) *
                  </label>
                  {modalMode === 'add' && (
                    <button
                      type="button"
                      onClick={() => handleAutoGenerateId(activeSlotForm.type)}
                      style={{
                        background: 'rgba(0, 240, 255, 0.1)',
                        border: '1px solid rgba(0, 240, 255, 0.3)',
                        borderRadius: '4px',
                        color: 'var(--cyan-primary)',
                        fontSize: '10.5px',
                        padding: '2px 8px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ⚡ Auto-Generate Next ID
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  disabled={modalMode === 'edit'}
                  value={activeSlotForm.id}
                  onChange={(e) => setActiveSlotForm({ ...activeSlotForm, id: e.target.value.toUpperCase() })}
                  placeholder={activeSlotForm.type === 'Two-Wheeler' ? 'T-11' : 'F-06'}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: modalMode === 'edit' ? 'rgba(15, 23, 42, 0.4)' : 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-light)',
                    color: 'var(--cyan-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    fontWeight: 700
                  }}
                />
              </div>

              {/* Parking Zone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    Parking Zone *
                  </label>
                  <select
                    value={activeSlotForm.zone}
                    onChange={(e) => setActiveSlotForm({ ...activeSlotForm, zone: e.target.value })}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-light)',
                      color: '#FFFFFF', fontSize: '12.5px'
                    }}
                  >
                    <option value="four-wheeler">Zone F (Four-Wheeler)</option>
                    <option value="two-wheeler">Zone T (Two-Wheeler)</option>
                    <option value="custom">Create Custom Zone...</option>
                  </select>
                </div>

                {/* Gate Category */}
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    Gate Category Rule *
                  </label>
                  <select
                    value={activeSlotForm.gateCategory}
                    onChange={(e) => setActiveSlotForm({ ...activeSlotForm, gateCategory: e.target.value })}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-light)',
                      color: '#FFFFFF', fontSize: '12.5px'
                    }}
                  >
                    <option value="Universal">Universal (All Gates)</option>
                    <option value="Student">Student Gate (Gate 1 Priority)</option>
                    <option value="Staff">Staff Gate (Gate 2 Priority)</option>
                    <option value="Visitor">Visitor Gate (Gate 3 Priority)</option>
                  </select>
                </div>
              </div>

              {/* Custom Zone Name Input (if custom selected) */}
              {activeSlotForm.zone === 'custom' && (
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Custom Zone Identifier
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. vip-zone, ev-charging, staff-west"
                    value={activeSlotForm.customZone}
                    onChange={(e) => setActiveSlotForm({ ...activeSlotForm, customZone: e.target.value })}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-light)',
                      color: '#FFFFFF', fontSize: '12.5px'
                    }}
                  />
                </div>
              )}

              {/* Floor & Row details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Floor / Wing Level
                  </label>
                  <input
                    type="text"
                    value={activeSlotForm.floor}
                    onChange={(e) => setActiveSlotForm({ ...activeSlotForm, floor: e.target.value })}
                    placeholder="Ground Level / East Wing"
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-light)',
                      color: '#FFFFFF', fontSize: '12.5px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Row / Bay Identifier
                  </label>
                  <input
                    type="text"
                    value={activeSlotForm.row}
                    onChange={(e) => setActiveSlotForm({ ...activeSlotForm, row: e.target.value })}
                    placeholder="Row A / Bay 6"
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-light)',
                      color: '#FFFFFF', fontSize: '12.5px'
                    }}
                  />
                </div>
              </div>

              {/* Sensor Mode & Initial Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Detection / Sensor Mode
                  </label>
                  <select
                    value={activeSlotForm.sensorType}
                    onChange={(e) => setActiveSlotForm({ ...activeSlotForm, sensorType: e.target.value })}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-light)',
                      color: '#FFFFFF', fontSize: '12.5px'
                    }}
                  >
                    <option value="System-Managed">System-Managed (Default)</option>
                    <option value="Optical Hardware Mapped">Optical Hardware CCTV Mapped</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Operational Status
                  </label>
                  <select
                    disabled={modalMode === 'edit' && activeSlotForm.occupied}
                    value={activeSlotForm.status}
                    onChange={(e) => setActiveSlotForm({ ...activeSlotForm, status: e.target.value })}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-light)',
                      color: '#FFFFFF', fontSize: '12.5px'
                    }}
                  >
                    <option value="Available">Available (Open for Allocation)</option>
                    <option value="Disabled">Disabled (Maintenance / Offline)</option>
                  </select>
                </div>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  style={{
                    padding: '9px 16px', borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-light)',
                    color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ padding: '9px 22px', fontSize: '13px' }}
                >
                  {isSubmitting ? 'Saving...' : modalMode === 'add' ? 'Save Parking Slot' : 'Update Slot Details'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
