import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  Bell,
  Cpu,
  Clock,
  Shield,
  CheckCircle,
  X,
  ExternalLink,
  ChevronDown,
  Database
} from 'lucide-react';

export default function TopBar() {
  const {
    searchQuery,
    setSearchQuery,
    slots,
    activities,
    registeredVehicles,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    setInspectItem,
    settings,
    pipelineMode,
    setPipelineMode,
    isDbConnected,
    dbStatus,
    lastSavedNotice
  } = useApp();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);
  const notifRef = useRef(null);

  // Live ticking clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close popups when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadNotifs = notifications.filter(n => !n.read).length;

  // Search filter
  const searchResults = searchQuery.trim() === '' ? [] : [
    ...slots.filter(s =>
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.vehicleNumber && s.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.driver && s.driver.toLowerCase().includes(searchQuery.toLowerCase()))
    ).map(s => ({ type: 'slot', data: s })),

    ...activities.filter(a =>
      a.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.driver.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 4).map(a => ({ type: 'activity', data: a })),

    ...registeredVehicles.filter(r =>
      r.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 4).map(r => ({ type: 'registered', data: r }))
  ];

  return (
    <header style={{
      height: '68px',
      position: 'sticky',
      top: 0,
      background: 'rgba(7, 11, 20, 0.88)',
      backdropFilter: 'blur(18px)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      zIndex: 35
    }}>
      {/* Left: Tagline / Status Banner matching PDF Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(0, 240, 255, 0.06)',
          border: '1px solid rgba(0, 240, 255, 0.22)',
          borderRadius: '20px',
          padding: '6px 14px',
          boxShadow: '0 0 12px rgba(0, 240, 255, 0.1)'
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: 'var(--cyan-primary)',
            boxShadow: '0 0 8px var(--cyan-primary)',
            animation: 'pulseGlow 2s infinite ease-in-out'
          }} />
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.04em',
            background: 'linear-gradient(90deg, #00F0FF 0%, #E2E8F0 50%, #8B5CF6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            AI • CCTV • Automatic Vehicle Detection • Real-time Parking Management
          </span>
        </div>
      </div>

      {/* Middle: Global Search Input */}
      <div ref={searchRef} style={{ position: 'relative', width: '380px' }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '10px',
          transition: 'all 0.2s ease',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
        }}>
          <Search size={16} style={{ marginLeft: '12px', color: 'var(--text-dim)' }} />
          <input
            type="text"
            placeholder="Search vehicle number or slot... (e.g. KA-22, F-02)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            style={{
              width: '100%',
              padding: '9px 12px',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#FFFFFF',
              fontSize: '13px',
              fontFamily: 'var(--font-body)'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                padding: '4px 8px',
                cursor: 'pointer'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && searchQuery.trim() !== '' && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: '#0D1424',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            borderRadius: '12px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.85)',
            maxHeight: '380px',
            overflowY: 'auto',
            zIndex: 50,
            padding: '8px'
          }}>
            {searchResults.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px' }}>
                No vehicle or slot matching "{searchQuery}"
              </div>
            ) : (
              searchResults.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setInspectItem(item);
                    setShowSearchResults(false);
                  }}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 240, 255, 0.12)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="plate-badge" style={{ fontSize: '12px' }}>
                        {item.type === 'slot' ? item.data.id : item.data.vehicleNumber}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {item.type === 'slot'
                          ? (item.data.occupied ? `Occupied (${item.data.vehicleNumber})` : 'Available')
                          : (item.data.ownerName || item.data.driver)}
                      </span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--cyan-primary)'
                  }}>
                    {item.type.toUpperCase()}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Live Clock */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border-subtle)',
          padding: '6px 12px',
          borderRadius: '8px'
        }}>
          <Clock size={14} style={{ color: 'var(--cyan-primary)' }} />
          <span style={{
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: 'var(--text-main)',
            letterSpacing: '0.04em'
          }}>
            {currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </span>
        </div>

        {/* Pipeline Mode Provenance Badge */}
        <button
          onClick={() => setPipelineMode(pipelineMode === 'SIMULATION' ? 'LIVE_AI' : 'SIMULATION')}
          title="Click to toggle between Simulation Mode and Live Model Pipeline"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: pipelineMode === 'SIMULATION' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(0, 240, 255, 0.12)',
            border: pipelineMode === 'SIMULATION' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(0, 240, 255, 0.4)',
            padding: '5px 10px',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.18s ease'
          }}
        >
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: pipelineMode === 'SIMULATION' ? 'var(--orange-bright)' : 'var(--cyan-primary)',
            boxShadow: pipelineMode === 'SIMULATION' ? '0 0 6px var(--orange-bright)' : '0 0 6px var(--cyan-primary)'
          }} />
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            color: pipelineMode === 'SIMULATION' ? 'var(--orange-bright)' : 'var(--cyan-primary)'
          }}>
            {pipelineMode === 'SIMULATION' ? '🧪 SIMULATION (DEMO)' : '⚡ LIVE AI PIPELINE'}
          </span>
        </button>

        {/* AI System Status Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(0, 240, 255, 0.1) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          padding: '6px 12px',
          borderRadius: '8px',
          boxShadow: '0 0 10px rgba(139, 92, 246, 0.2)'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--green-bright)',
            boxShadow: '0 0 8px var(--green-bright)'
          }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>AI Core</span>
          <span style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-dim)',
            marginLeft: '2px'
          }}>18ms</span>
        </div>

        {/* Persistent SQLite Database Badge */}
        <div
          title={dbStatus ? `SQLite DB Active: ${dbStatus.counts?.registeredVehicles} vehicles, ${dbStatus.counts?.occupiedSlots}/15 occupied bays, file: ${dbStatus.dbFile}` : 'Persistent SQLite Database Active'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            background: isDbConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: isDbConnected ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
            padding: '5px 11px',
            borderRadius: '8px',
            cursor: 'default'
          }}
        >
          <Database size={13} style={{ color: isDbConnected ? 'var(--green-bright)' : '#EF4444' }} />
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            color: isDbConnected ? 'var(--green-bright)' : '#EF4444'
          }}>
            {isDbConnected ? 'SQLITE DB: CONNECTED' : 'SQLITE DB: OFFLINE'}
          </span>
        </div>

        {/* Database Floating Save Toast */}
        {lastSavedNotice && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(0, 240, 255, 0.15)',
            border: '1px solid var(--border-neon-cyan)',
            color: 'var(--cyan-primary)',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 700,
            animation: 'fadeIn 0.2s ease'
          }}>
            <CheckCircle size={13} /> {lastSavedNotice}
          </div>
        )}

        {/* Notifications Bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              position: 'relative',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-subtle)',
              padding: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              color: unreadNotifs > 0 ? 'var(--cyan-primary)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            title="Notifications & Alerts"
          >
            <Bell size={17} />
            {unreadNotifs > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--red-bright)',
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: 700,
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 8px var(--red-bright)'
              }}>
                {unreadNotifs}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              right: 0,
              width: '340px',
              background: '#0D1424',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              borderRadius: '12px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.9)',
              zIndex: 50,
              padding: '12px',
              animation: 'fadeIn 0.2s ease'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>
                  Live System Alerts
                </div>
                {unreadNotifs > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--cyan-primary)',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationAsRead(n.id)}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      background: n.read ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 240, 255, 0.08)',
                      border: n.read ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 240, 255, 0.2)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: n.read ? 'var(--text-muted)' : '#FFFFFF' }}>
                        {n.title}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                        {n.time}
                      </span>
                    </div>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      {n.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Security Staff Profile */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '4px 10px 4px 4px',
          borderRadius: '24px',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00F0FF 0%, #3A86FF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#050811',
            fontWeight: 700,
            fontSize: '13px'
          }}>
            RS
          </div>
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#FFFFFF', lineHeight: '1.2' }}>
              {settings.officerName}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--cyan-primary)', fontFamily: 'var(--font-mono)' }}>
              Gate 1 • Active
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
