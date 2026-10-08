import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Video,
  LogIn,
  LogOut,
  ParkingSquare,
  Search,
  BarChart3,
  FileText,
  Users,
  Camera,
  Settings,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function Sidebar() {
  const { currentTab, setCurrentTab, soundEnabled, setSoundEnabled, metrics } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cctv', label: 'Live CCTV Monitoring', icon: Video, badge: '2 Feeds' },
    { id: 'checkin', label: 'Vehicle Check-In', icon: LogIn },
    { id: 'checkout', label: 'Vehicle Check-Out', icon: LogOut },
    { id: 'slots', label: 'Parking Slots', icon: ParkingSquare, badge: `${metrics.occupied}/15` },
    { id: 'finder', label: 'Vehicle Finder', icon: Search },
    { id: 'summary', label: 'Daily Summary', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'registered', label: 'Registered Vehicles', icon: Users },
    { id: 'cameras', label: 'Camera Settings', icon: Camera },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside style={{
      width: '270px',
      minWidth: '270px',
      height: '100vh',
      position: 'sticky',
      top: 0,
      background: 'rgba(8, 12, 22, 0.94)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 40,
      userSelect: 'none'
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '20px 18px 16px 18px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          position: 'relative',
          width: '46px',
          height: '46px',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)',
          border: '1px solid rgba(0, 240, 255, 0.5)',
          background: '#030712',
          flexShrink: 0
        }}>
          <img
            src="/logo.png"
            alt="CPVTS Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '18px',
            fontWeight: 800,
            letterSpacing: '0.04em',
            background: 'linear-gradient(135deg, #00F0FF 0%, #FFFFFF 60%, #3A86FF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            CPVTS
            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              padding: '2px 5px',
              borderRadius: '4px',
              background: 'rgba(0, 240, 255, 0.15)',
              color: 'var(--cyan-primary)',
              WebkitTextFillColor: 'initial',
              border: '1px solid rgba(0, 240, 255, 0.3)'
            }}>AI 2.0</span>
          </div>
          <div style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden'
          }}>
            Smart Campus Parking
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-dim)',
          padding: '6px 12px 4px 12px'
        }}>
          System Controls
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: isActive ? '1px solid rgba(0, 240, 255, 0.35)' : '1px solid transparent',
                background: isActive
                  ? 'linear-gradient(90deg, rgba(0, 240, 255, 0.14) 0%, rgba(58, 134, 255, 0.08) 100%)'
                  : 'transparent',
                color: isActive ? '#00F0FF' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                textAlign: 'left',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.color = 'var(--text-main)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                <div style={{
                  color: isActive ? 'var(--cyan-primary)' : 'inherit',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Icon size={18} strokeWidth={isActive ? 2.3 : 1.8} />
                </div>
                <span style={{
                  fontSize: '13.5px',
                  fontWeight: isActive ? 600 : 450,
                  color: isActive ? '#FFFFFF' : 'inherit'
                }}>
                  {item.label}
                </span>
              </div>

              {item.badge && (
                <span style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  background: isActive ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  color: isActive ? 'var(--cyan-primary)' : 'var(--text-dim)',
                  border: isActive ? '1px solid rgba(0, 240, 255, 0.4)' : 'none'
                }}>
                  {item.badge}
                </span>
              )}

              {isActive && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '18%',
                  bottom: '18%',
                  width: '3.5px',
                  borderRadius: '0 4px 4px 0',
                  background: 'var(--cyan-primary)',
                  boxShadow: '0 0 10px var(--cyan-primary)'
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info & Audio Toggle */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(5, 8, 17, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--green-bright)',
              boxShadow: '0 0 8px var(--green-bright)',
              display: 'inline-block'
            }} />
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 500 }}>
              AI Vision Core
            </span>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute AI HUD sounds' : 'Enable AI HUD sounds'}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-subtle)',
              color: soundEnabled ? 'var(--cyan-primary)' : 'var(--text-dim)',
              borderRadius: '6px',
              padding: '5px 7px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              transition: 'all 0.15s ease'
            }}
          >
            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            <span>{soundEnabled ? 'Sound' : 'Muted'}</span>
          </button>
        </div>

        <div style={{
          fontSize: '10.5px',
          color: 'var(--text-dim)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)'
        }}>
          <span>YOLOv8 + OCR</span>
          <span style={{ color: 'var(--green-bright)' }}>99.4% Acc</span>
        </div>
      </div>
    </aside>
  );
}
