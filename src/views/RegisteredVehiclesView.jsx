import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  UserPlus,
  Search,
  Car,
  Bike,
  ShieldCheck,
  CheckCircle,
  X,
  CreditCard,
  Phone,
  Edit2,
  Power,
  Trash2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Info,
  Check,
  Tag,
  Building,
  Database
} from 'lucide-react';
import { playSound } from '../utils/audio';

export default function RegisteredVehiclesView() {
  const {
    registeredVehicles,
    addRegisteredVehicle,
    updateRegisteredVehicle,
    toggleRegistrationStatus,
    deleteRegisteredVehicle,
    soundEnabled
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All'); // 'All', 'Student', 'Staff', 'Visitor', 'Disabled'

  // Modal State for Add & Edit
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [activeVehicle, setActiveVehicle] = useState({
    id: '',
    vehicleNumber: '',
    vehicleType: 'Four-Wheeler',
    ownerName: '',
    category: 'Student',
    idRef: '',
    department: '',
    model: '',
    contact: '+91 98XXX XXXXX',
    status: 'Active'
  });

  // Filtered vehicles list
  const filtered = registeredVehicles.filter(veh => {
    const matchesSearch =
      veh.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      veh.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (veh.department && veh.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (veh.idRef && veh.idRef.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterCategory === 'All') return true;
    if (filterCategory === 'Disabled') return veh.status === 'Disabled';
    return veh.category === filterCategory;
  });

  const handleOpenAdd = () => {
    playSound('beep', soundEnabled);
    setActiveVehicle({
      id: '',
      vehicleNumber: '',
      vehicleType: 'Four-Wheeler',
      ownerName: '',
      category: 'Student',
      idRef: '',
      department: 'Computer Science',
      model: 'Sedan / Hatchback',
      contact: '+91 98451 00000',
      status: 'Active'
    });
    setModalMode('add');
  };

  const handleOpenEdit = (veh) => {
    playSound('beep', soundEnabled);
    setActiveVehicle({ ...veh });
    setModalMode('edit');
  };

  const handleModalSubmit = (e) => {
    e.preventDefault();
    if (!activeVehicle.vehicleNumber.trim()) return;

    if (modalMode === 'add') {
      addRegisteredVehicle({
        ...activeVehicle,
        vehicleNumber: activeVehicle.vehicleNumber.trim().toUpperCase()
      });
    } else if (modalMode === 'edit') {
      updateRegisteredVehicle(activeVehicle.id, {
        ...activeVehicle,
        vehicleNumber: activeVehicle.vehicleNumber.trim().toUpperCase()
      });
    }
    setModalMode(null);
  };

  const handleToggleStatus = (id, e) => {
    e.stopPropagation();
    toggleRegistrationStatus(id);
  };

  const handleDelete = (id, plate, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to remove ${plate} from the registered database?`)) {
      deleteRegisteredVehicle(id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '35px' }}>
      
      {/* 1. Header & Admin Mode Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
              Institutional Registered Vehicles & Whitelist Database
            </h1>
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(139, 92, 246, 0.15)',
              color: 'var(--purple-bright)',
              padding: '3px 9px',
              borderRadius: '6px',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <ShieldCheck size={13} />
              ADMIN OPERATION ONLY
            </span>
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
              <Database size={13} />
              SQLITE DATABASE PERSISTED
            </span>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Manage campus vehicle authorizations. CCTV optical cameras query this database to automatically resolve Student/Staff/Visitor categories without guard intervention.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-primary"
          style={{ fontSize: '12.5px', padding: '9px 18px', gap: '8px' }}
        >
          <UserPlus size={16} /> Register New Vehicle
        </button>
      </div>

      {/* 2. Automated CCTV Resolution Architectural Banner */}
      <div className="glass-panel" style={{
        padding: '16px 20px',
        background: 'rgba(8, 14, 28, 0.85)',
        border: '1px solid var(--border-neon-cyan)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: 'rgba(0, 240, 255, 0.12)',
            border: '1px solid var(--border-neon-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--cyan-primary)'
          }}>
            <Sparkles size={22} />
          </div>

          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#FFFFFF' }}>
              Autonomous ANPR Categorization Architecture
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Optical Character Recognition matches incoming plate against this institutional whitelist in milliseconds:
            </div>
          </div>
        </div>

        {/* Step Flow Visualization */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(15, 23, 42, 0.9)',
          padding: '6px 14px',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)'
        }}>
          <span className="plate-badge" style={{ fontSize: '11px' }}>KA-22-XY-9876</span>
          <ArrowRight size={13} color="var(--cyan-primary)" />
          <span style={{ color: 'var(--green-bright)', fontWeight: 700 }}>Whitelist Match</span>
          <ArrowRight size={13} color="var(--cyan-primary)" />
          <span style={{ color: 'var(--purple-bright)', fontWeight: 700 }}>Category: Student</span>
          <ArrowRight size={13} color="var(--cyan-primary)" />
          <span style={{ color: 'var(--cyan-primary)', fontWeight: 700 }}>Auto-Check-In</span>
        </div>
      </div>

      {/* 3. Search Bar, Category Filters & Metrics */}
      <div className="glass-panel" style={{
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Search Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '7px 14px',
          width: '340px'
        }}>
          <Search size={15} color="var(--cyan-primary)" />
          <input
            type="text"
            placeholder="Search license plate, owner, reference ID, dept..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#FFFFFF',
              fontSize: '12px'
            }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['All', 'Student', 'Staff', 'Visitor', 'Disabled'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              style={{
                padding: '6px 12px',
                borderRadius: '16px',
                border: filterCategory === cat ? '1px solid var(--cyan-primary)' : '1px solid var(--border-subtle)',
                background: filterCategory === cat ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                color: filterCategory === cat ? 'var(--cyan-primary)' : 'var(--text-muted)',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Whitelist Stats Count */}
        <div style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          Showing: <strong style={{ color: '#FFFFFF' }}>{filtered.length}</strong> / {registeredVehicles.length} Whitelisted
        </div>
      </div>

      {/* 4. Registered Vehicles Grid Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {filtered.map(veh => {
          const isFour = veh.vehicleType === 'Four-Wheeler';
          const isDisabled = veh.status === 'Disabled';

          return (
            <div
              key={veh.id}
              className="glass-panel hover-bright"
              style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                position: 'relative',
                border: isDisabled ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid var(--border-subtle)',
                background: isDisabled ? 'rgba(20, 10, 15, 0.7)' : 'rgba(8, 14, 28, 0.85)',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Header: Plate + Category Badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="plate-badge" style={{ fontSize: '13.5px', padding: '3px 8px' }}>
                    {veh.vehicleNumber}
                  </span>
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    background: isFour ? 'rgba(0, 240, 255, 0.12)' : 'rgba(58, 134, 255, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isFour ? 'var(--cyan-primary)' : 'var(--blue-hover)'
                  }}>
                    {isFour ? <Car size={15} /> : <Bike size={15} />}
                  </div>
                </div>

                {/* Category Pill */}
                <span style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: veh.category === 'Student'
                    ? 'rgba(16, 185, 129, 0.16)'
                    : veh.category === 'Staff'
                      ? 'rgba(139, 92, 246, 0.16)'
                      : 'rgba(245, 158, 11, 0.16)',
                  color: veh.category === 'Student'
                    ? 'var(--green-bright)'
                    : veh.category === 'Staff'
                      ? 'var(--purple-bright)'
                      : 'var(--orange-bright)',
                  border: veh.category === 'Student'
                    ? '1px solid rgba(16, 185, 129, 0.35)'
                    : veh.category === 'Staff'
                      ? '1px solid rgba(139, 92, 246, 0.35)'
                      : '1px solid rgba(245, 158, 11, 0.35)'
                }}>
                  {veh.category}
                </span>
              </div>

              {/* Owner Info & Optional ID Reference */}
              <div>
                <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#FFFFFF' }}>
                  {veh.ownerName}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building size={12} />
                  <span>{veh.department || 'Campus Department'}</span>
                </div>
                {veh.idRef && (
                  <div style={{
                    fontSize: '10.5px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--cyan-primary)',
                    marginTop: '3px',
                    background: 'rgba(0, 240, 255, 0.06)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    display: 'inline-block'
                  }}>
                    ID Ref: {veh.idRef}
                  </div>
                )}
              </div>

              {/* Vehicle Model & Metadata */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Vehicle Type</span>
                  <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{veh.vehicleType}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Make / Model</span>
                  <span style={{ color: '#FFFFFF' }}>{veh.model || 'Standard'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Permit Status</span>
                  <span style={{ color: isDisabled ? 'var(--red-bright)' : 'var(--green-bright)', fontWeight: 700 }}>
                    {isDisabled ? '🔴 Registration Disabled' : '🟢 Active Whitelist'}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Edit, Disable/Enable, Delete */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {/* Edit Button */}
                  <button
                    onClick={() => handleOpenEdit(veh)}
                    className="btn-ghost"
                    style={{ fontSize: '11px', padding: '5px 9px', color: '#FFFFFF' }}
                    title="Edit vehicle details"
                  >
                    <Edit2 size={12} /> Edit
                  </button>

                  {/* Disable / Enable Toggle Button */}
                  <button
                    onClick={(e) => handleToggleStatus(veh.id, e)}
                    style={{
                      fontSize: '11px',
                      padding: '5px 9px',
                      borderRadius: '6px',
                      border: isDisabled ? '1px solid var(--border-neon-green)' : '1px solid rgba(239, 68, 68, 0.4)',
                      background: isDisabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                      color: isDisabled ? 'var(--green-bright)' : 'var(--red-bright)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600
                    }}
                    title={isDisabled ? 'Enable vehicle registration' : 'Disable registration (will require manual guard check)'}
                  >
                    <Power size={12} />
                    <span>{isDisabled ? 'Enable' : 'Disable'}</span>
                  </button>
                </div>

                {/* Delete Button */}
                <button
                  onClick={(e) => handleDelete(veh.id, veh.vehicleNumber, e)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Remove from database"
                >
                  <Trash2 size={13} />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* 5. Add / Edit Vehicle Modal Dialog */}
      {modalMode && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(3, 7, 18, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '540px',
            background: '#0D1424',
            border: '1px solid var(--border-neon-cyan)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(0, 240, 255, 0.2)',
            borderRadius: '16px',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="var(--cyan-primary)" />
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>
                  {modalMode === 'add' ? 'Register New Campus Vehicle' : `Edit Vehicle: ${activeVehicle.vehicleNumber}`}
                </h3>
              </div>
              <button
                onClick={() => setModalMode(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleModalSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Row 1: Plate & Vehicle Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Vehicle Number (License Plate) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. KA-22-XY-9876"
                    value={activeVehicle.vehicleNumber}
                    onChange={(e) => setActiveVehicle({ ...activeVehicle, vehicleNumber: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      color: '#FFFFFF',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Vehicle Type *
                  </label>
                  <select
                    value={activeVehicle.vehicleType}
                    onChange={(e) => setActiveVehicle({ ...activeVehicle, vehicleType: e.target.value })}
                    style={{
                      width: '100%',
                      background: '#0F172A',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      color: '#FFFFFF',
                      fontSize: '13px'
                    }}
                  >
                    <option value="Four-Wheeler">Four-Wheeler (Car/SUV)</option>
                    <option value="Two-Wheeler">Two-Wheeler (Bike/Scooter)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Owner Name & Owner Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Owner Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Verma"
                    value={activeVehicle.ownerName}
                    onChange={(e) => setActiveVehicle({ ...activeVehicle, ownerName: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      color: '#FFFFFF',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Owner Category *
                  </label>
                  <select
                    value={activeVehicle.category}
                    onChange={(e) => setActiveVehicle({ ...activeVehicle, category: e.target.value })}
                    style={{
                      width: '100%',
                      background: '#0F172A',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      color: '#FFFFFF',
                      fontSize: '13px'
                    }}
                  >
                    <option value="Student">Student (100% Pass Exemption)</option>
                    <option value="Staff">Staff / Faculty (100% Pass Exemption)</option>
                    <option value="Visitor">Visitor (Standard Tariff)</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Optional ID Reference & Department */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Optional ID / Registration Ref
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. USN 2BV21CS089 / EMP-104"
                    value={activeVehicle.idRef || ''}
                    onChange={(e) => setActiveVehicle({ ...activeVehicle, idRef: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      color: '#FFFFFF',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12.5px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Department / Campus Affiliation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={activeVehicle.department || ''}
                    onChange={(e) => setActiveVehicle({ ...activeVehicle, department: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      color: '#FFFFFF',
                      fontSize: '12.5px'
                    }}
                  />
                </div>
              </div>

              {/* Row 4: Vehicle Model & Registration Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Vehicle Model & Color
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Toyota Fortuner (White)"
                    value={activeVehicle.model || ''}
                    onChange={(e) => setActiveVehicle({ ...activeVehicle, model: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      color: '#FFFFFF',
                      fontSize: '12.5px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Registration Status
                  </label>
                  <select
                    value={activeVehicle.status || 'Active'}
                    onChange={(e) => setActiveVehicle({ ...activeVehicle, status: e.target.value })}
                    style={{
                      width: '100%',
                      background: '#0F172A',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      color: '#FFFFFF',
                      fontSize: '13px'
                    }}
                  >
                    <option value="Active">Active (Whitelisted)</option>
                    <option value="Disabled">Disabled (Suspended)</option>
                  </select>
                </div>
              </div>

              {/* Informational Help Note */}
              <div style={{
                background: 'rgba(0, 240, 255, 0.05)',
                border: '1px solid rgba(0, 240, 255, 0.2)',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '11px',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Info size={14} color="var(--cyan-primary)" />
                <span>
                  Admin Tip: Once registered, when ANPR cameras detect this plate at Gate 1, the system automatically resolves category <strong>{activeVehicle.category}</strong> without manual guard input.
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="btn-ghost"
                  style={{ flex: 1, padding: '10px', fontSize: '12.5px', justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, padding: '10px', fontSize: '12.5px', justifyContent: 'center' }}
                >
                  <Check size={14} /> {modalMode === 'add' ? 'Save Registration' : 'Update Record'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
