import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  MapPin,
  Car,
  Bike,
  Clock,
  Printer,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Camera,
  Database,
  Radio,
  Sparkles,
  Layers,
  ShieldCheck,
  ChevronRight,
  Eye,
  Maximize2
} from 'lucide-react';
import { playSound } from '../utils/audio';
import { searchVehiclesBackend } from '../services/backendApi';

export default function VehicleFinderView() {
  const { slots, setInspectItem, soundEnabled, setCurrentTab } = useApp();
  const [query, setQuery] = useState('KA-22-XY-9876');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeVehicle, setActiveVehicle] = useState(null);
  const [searchMode, setSearchMode] = useState('all'); // 'all' | 'plate' | 'slot'

  // Execute backend search when query changes
  useEffect(() => {
    let isCancelled = false;

    async function executeSearch() {
      if (!query.trim()) {
        setSearchResults([]);
        setActiveVehicle(null);
        return;
      }

      setLoading(true);
      try {
        const results = await searchVehiclesBackend(query.trim());
        if (!isCancelled) {
          setSearchResults(results);
          if (results.length > 0) {
            setActiveVehicle(results[0]);
          } else {
            setActiveVehicle(null);
          }
        }
      } catch (err) {
        console.error('Error in backend vehicle search:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    const timer = setTimeout(executeSearch, 150);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const handleSelectResult = (item) => {
    playSound('beep', soundEnabled);
    setActiveVehicle(item);
  };

  const handleQuickChip = (text) => {
    playSound('beep', soundEnabled);
    setQuery(text);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '35px' }}>
      
      {/* 1. Header & Backend Search Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
              Intelligent Campus Vehicle Finder & CCTV Telemetry
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
              <Database size={13} />
              BACKEND DATABASE SEARCH
            </span>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Locate parked campus vehicles by Vehicle Number or Parking Slot with live optical CCTV source verification
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            padding: '5px 12px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.12)',
            color: 'var(--green-bright)',
            border: '1px solid var(--border-neon-green)',
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
            POSTGRES/SQLITE ANPR INDEXED
          </span>
        </div>
      </div>

      {/* 2. Interactive Search Bar & Filter Switcher */}
      <div className="glass-panel" style={{ padding: '20px', background: 'rgba(8, 14, 28, 0.85)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1.5px solid var(--border-neon-cyan)',
          borderRadius: '12px',
          padding: '6px 16px',
          boxShadow: '0 0 25px rgba(0, 240, 255, 0.15)'
        }}>
          <Search size={22} color="var(--cyan-primary)" />
          <input
            type="text"
            placeholder="Search by Vehicle Number (e.g. KA-22-XY-9876) or Parking Slot (e.g. F-02, T-01)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 0',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#FFFFFF',
              fontSize: '15px',
              fontFamily: 'var(--font-mono)'
            }}
          />

          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: 'var(--text-muted)',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px'
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Search Helper Chips & Quick Preset Prompts */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '14px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>Quick Search by Plate:</span>
            {['KA-22-XY-9876', 'KA-22-AB-1234', 'KA-22-MH-3311', 'KA-22-GH-7890'].map(p => (
              <button
                key={p}
                onClick={() => handleQuickChip(p)}
                style={{
                  background: query === p ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  border: query === p ? '1px solid var(--border-neon-cyan)' : '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '4px 9px',
                  color: query === p ? 'var(--cyan-primary)' : 'var(--text-muted)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                {p}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>Quick Search by Slot:</span>
            {['F-02', 'F-03', 'T-01', 'T-05'].map(s => (
              <button
                key={s}
                onClick={() => handleQuickChip(s)}
                style={{
                  background: query.toUpperCase() === s ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  border: query.toUpperCase() === s ? '1px solid var(--border-neon-green)' : '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '4px 9px',
                  color: query.toUpperCase() === s ? 'var(--green-bright)' : 'var(--text-muted)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                Bay {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Search Results State & Display */}
      {loading ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Radio size={28} className="animate-pulse" style={{ margin: '0 auto 12px auto', display: 'block', color: 'var(--cyan-primary)' }} />
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
            Querying Backend Parking Records & ANPR OCR Database...
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
            Matching plate hashes across active bay records and institutional whitelist
          </div>
        </div>
      ) : activeVehicle ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', alignItems: 'start' }}>
          
          {/* Left Column: Required Telemetry Card matching Codethon Problem Statement */}
          <div className="glass-panel" style={{
            padding: '24px',
            border: '1.5px solid var(--border-neon-cyan)',
            boxShadow: '0 0 30px rgba(0, 240, 255, 0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Header: Verified Match & CCTV Source */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '14px'
            }}>
              <div>
                <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--cyan-primary)', letterSpacing: '0.08em' }}>
                  CPVTS BACKEND RECORD LOCATED
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                  Vehicle Wayfinding & Ingress Telemetry
                </h3>
              </div>

              {/* CCTV Source Badge */}
              <div style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(0, 240, 255, 0.12)',
                border: '1px solid var(--border-neon-cyan)',
                color: 'var(--cyan-primary)',
                fontWeight: 800,
                fontSize: '11.5px',
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Camera size={14} />
                {activeVehicle.cctvSource}
              </div>
            </div>

            {/* Core Output Banner:
                Vehicle image, Number plate, Vehicle type, Category, Slot, Entry time, Current status, Last detection, CCTV source */}
            <div style={{
              display: 'flex',
              gap: '20px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '18px',
              marginBottom: '20px',
              alignItems: 'center'
            }}>
              {/* Vehicle Image */}
              <div style={{
                position: 'relative',
                width: '120px',
                height: '85px',
                borderRadius: '10px',
                overflow: 'hidden',
                background: '#040711',
                border: '1px solid var(--border-neon-cyan)',
                boxShadow: '0 0 15px rgba(0, 240, 255, 0.25)',
                flexShrink: 0
              }}>
                <img
                  src={activeVehicle.image || '/thumb_car.png'}
                  alt="Vehicle Image"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '3px',
                  left: '3px',
                  background: 'rgba(0, 0, 0, 0.8)',
                  padding: '2px 5px',
                  borderRadius: '3px',
                  fontSize: '8.5px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--cyan-primary)'
                }}>
                  {activeVehicle.vehicleType}
                </div>
              </div>

              {/* Number Plate & Driver Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  Registered License Plate
                </div>
                <div className="plate-badge" style={{ fontSize: '20px', marginTop: '3px', letterSpacing: '0.06em' }}>
                  {activeVehicle.vehicleNumber}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {activeVehicle.driver} • <span style={{ color: 'var(--cyan-primary)', fontWeight: 600 }}>{activeVehicle.department}</span>
                </div>
              </div>

              {/* Slot & Current Status */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  Assigned Bay
                </div>
                <div className="slot-badge" style={{
                  fontSize: '22px',
                  marginTop: '3px',
                  padding: '6px 16px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--green-bright)',
                  border: '1.5px solid var(--border-neon-green)'
                }}>
                  {activeVehicle.slot}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--green-bright)',
                  fontWeight: 800,
                  marginTop: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '4px'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green-bright)', boxShadow: '0 0 6px var(--green-bright)' }} />
                  {activeVehicle.status}
                </div>
              </div>
            </div>

            {/* Complete Field Telemetry Grid (All Required Fields from Problem Statement) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Vehicle Type</span>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                  {activeVehicle.vehicleType}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Category</span>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--cyan-primary)', marginTop: '2px' }}>
                  {activeVehicle.category}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Parking Slot</span>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--green-bright)', marginTop: '2px' }}>
                  {activeVehicle.slot}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Entry Time</span>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                  {activeVehicle.entryTime}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Current Status</span>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--green-bright)', marginTop: '2px' }}>
                  {activeVehicle.status}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Last Detection</span>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                  {activeVehicle.lastDetection}
                </div>
              </div>
            </div>

            {/* Split: CCTV Snapshot Verification + Navigation Guidance */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {/* CCTV Source Snapshot */}
              <div style={{
                position: 'relative',
                borderRadius: '10px',
                overflow: 'hidden',
                height: '180px',
                border: '1px solid var(--border-neon-cyan)',
                background: '#040711'
              }}>
                <img
                  src={activeVehicle.vehicleType === 'Four-Wheeler' ? '/camera_1_feed.png' : '/camera_2_feed.png'}
                  alt="CCTV Source"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  background: 'rgba(4, 7, 17, 0.85)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '9.5px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--cyan-primary)',
                  border: '1px solid rgba(0, 240, 255, 0.3)'
                }}>
                  ● CCTV SOURCE: {activeVehicle.cctvSource}
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '8px',
                  right: '8px',
                  background: 'rgba(4, 7, 17, 0.85)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  color: '#FFFFFF'
                }}>
                  Plate: {activeVehicle.vehicleNumber} • Bay {activeVehicle.slot}
                </div>
              </div>

              {/* Wayfinding directions */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.7)',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--cyan-primary)', fontSize: '12.5px', fontWeight: 800, marginBottom: '6px' }}>
                    <Navigation size={14} /> Campus Wayfinding Guide
                  </div>
                  <ol style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: '1.6', paddingLeft: '16px' }}>
                    <li>Enter through Campus Gate 1 barrier.</li>
                    <li>
                      Proceed towards{' '}
                      <strong style={{ color: '#FFFFFF' }}>{activeVehicle.floor || 'Designated Zone'}</strong>.
                    </li>
                    <li>Target vehicle is parked at <strong style={{ color: 'var(--green-bright)' }}>Slot {activeVehicle.slot}</strong>.</li>
                  </ol>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button
                    onClick={() => setCurrentTab('slots')}
                    className="btn-primary"
                    style={{ flex: 1, fontSize: '11.5px', padding: '7px 10px', justifyContent: 'center' }}
                  >
                    View Slot on Grid
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="btn-ghost"
                    style={{ fontSize: '11.5px', padding: '7px 10px', justifyContent: 'center' }}
                  >
                    <Printer size={13} /> Print
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Other Matching Records & Slot Map Visualizer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Multi-result selector (if multiple matches) */}
            {searchResults.length > 1 && (
              <div className="glass-panel" style={{ padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>
                  Found {searchResults.length} Matching Records in Backend:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {searchResults.map((item) => (
                    <button
                      key={item.vehicleNumber}
                      onClick={() => handleSelectResult(item)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: activeVehicle?.vehicleNumber === item.vehicleNumber ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: activeVehicle?.vehicleNumber === item.vehicleNumber ? '1px solid var(--border-neon-cyan)' : '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="plate-badge" style={{ fontSize: '11.5px' }}>{item.vehicleNumber}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.driver}</span>
                      </div>
                      <span className="slot-badge" style={{ fontSize: '11px' }}>{item.slot}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Campus Bay Highlight Map */}
            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} color="var(--cyan-primary)" />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
                    Campus Parking Zone Map
                  </span>
                </div>
                <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--green-bright)' }}>
                  BAY {activeVehicle.slot} ACTIVE
                </span>
              </div>

              {/* Mini 15-Slot Map Layout */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Four-Wheeler Zone (F-01 to F-05)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                  {['F-01', 'F-02', 'F-03', 'F-04', 'F-05'].map(sid => {
                    const isTarget = activeVehicle.slot === sid;
                    return (
                      <div
                        key={sid}
                        style={{
                          padding: '8px 4px',
                          textAlign: 'center',
                          borderRadius: '6px',
                          background: isTarget ? 'rgba(0, 240, 255, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                          border: isTarget ? '1.5px solid var(--cyan-primary)' : '1px solid var(--border-subtle)',
                          color: isTarget ? '#FFFFFF' : 'var(--text-dim)',
                          fontWeight: 800,
                          fontSize: '11.5px',
                          boxShadow: isTarget ? '0 0 12px rgba(0, 240, 255, 0.4)' : 'none'
                        }}
                      >
                        {sid}
                        {isTarget && <div style={{ fontSize: '8px', color: 'var(--cyan-primary)' }}>TARGET</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Two-Wheeler Zone (T-01 to T-10)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                  {['T-01', 'T-02', 'T-03', 'T-04', 'T-05', 'T-06', 'T-07', 'T-08', 'T-09', 'T-10'].map(sid => {
                    const isTarget = activeVehicle.slot === sid;
                    return (
                      <div
                        key={sid}
                        style={{
                          padding: '6px 4px',
                          textAlign: 'center',
                          borderRadius: '6px',
                          background: isTarget ? 'rgba(0, 240, 255, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                          border: isTarget ? '1.5px solid var(--cyan-primary)' : '1px solid var(--border-subtle)',
                          color: isTarget ? '#FFFFFF' : 'var(--text-dim)',
                          fontWeight: 800,
                          fontSize: '11px',
                          boxShadow: isTarget ? '0 0 12px rgba(0, 240, 255, 0.4)' : 'none'
                        }}
                      >
                        {sid}
                        {isTarget && <div style={{ fontSize: '7.5px', color: 'var(--cyan-primary)' }}>TARGET</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
          <AlertCircle size={28} style={{ margin: '0 auto 10px auto', display: 'block', color: 'var(--text-dim)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', marginBottom: '4px' }}>
            No Backend Record Found Matching "{query}"
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto' }}>
            Searched across occupied bays, parking logs, and registered student/staff directories in the backend database. Try searching for "KA-22-XY-9876", "F-02", or "T-01".
          </p>
        </div>
      )}

    </div>
  );
}
