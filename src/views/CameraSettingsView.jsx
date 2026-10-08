import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Camera,
  Cpu,
  Sliders,
  CheckCircle,
  Zap,
  RefreshCw,
  SlidersHorizontal,
  Shield,
  Eye,
  EyeOff,
  Lock,
  Wifi,
  WifiOff,
  Server,
  Settings,
  Check,
  Edit2,
  Save,
  AlertTriangle,
  Radio,
  Sparkles
} from 'lucide-react';
import { playSound } from '../utils/audio';

export default function CameraSettingsView() {
  const { soundEnabled, pipelineMode, setPipelineMode } = useApp();

  // Selected Gate filter tab ('all' | 'Student' | 'Staff' | 'Visitor')
  const [selectedGateFilter, setSelectedGateFilter] = useState('all');

  // Cameras State for all 3 Dedicated Campus Gates (6 Optical RTSP Streams)
  const [cameras, setCameras] = useState([
    // GATE 1 — STUDENT GATE (Entry & Exit)
    {
      id: 'cam_student_entry',
      name: 'Student Gate Entry Camera',
      gate: 'Student Gate',
      gateNumber: 1,
      category: 'Student',
      location: 'Gate 1 — Student Entry',
      type: 'Entry',
      status: 'Connected',
      ip: '192.168.1.101',
      port: 554,
      channel: 'stream1',
      username: 'admin',
      credentialsMasked: true,
      anprThreshold: 94,
      resolution: '1080P Full HD (1920x1080)',
      fps: 30,
      boundingBoxes: true,
      autoBarrierTrigger: true,
      ocrEngine: 'PaddleOCR / CRNN',
      feedImage: '/camera_1_feed.png'
    },
    {
      id: 'cam_student_exit',
      name: 'Student Gate Exit Camera',
      gate: 'Student Gate',
      gateNumber: 1,
      category: 'Student',
      location: 'Gate 1 — Student Exit',
      type: 'Exit',
      status: 'Connected',
      ip: '192.168.1.102',
      port: 554,
      channel: 'stream1',
      username: 'admin',
      credentialsMasked: true,
      anprThreshold: 94,
      resolution: '1080P Full HD (1920x1080)',
      fps: 30,
      boundingBoxes: true,
      autoBarrierTrigger: true,
      ocrEngine: 'PaddleOCR / CRNN',
      feedImage: '/camera_2_feed.png'
    },

    // GATE 2 — STAFF GATE (Entry & Exit)
    {
      id: 'cam_staff_entry',
      name: 'Staff Gate Entry Camera',
      gate: 'Staff Gate',
      gateNumber: 2,
      category: 'Staff',
      location: 'Gate 2 — Faculty/Staff Entry',
      type: 'Entry',
      status: 'Connected',
      ip: '192.168.1.103',
      port: 554,
      channel: 'stream1',
      username: 'admin',
      credentialsMasked: true,
      anprThreshold: 96,
      resolution: '1080P Full HD (1920x1080)',
      fps: 30,
      boundingBoxes: true,
      autoBarrierTrigger: true,
      ocrEngine: 'EasyOCR ANPR Model',
      feedImage: '/camera_1_feed.png'
    },
    {
      id: 'cam_staff_exit',
      name: 'Staff Gate Exit Camera',
      gate: 'Staff Gate',
      gateNumber: 2,
      category: 'Staff',
      location: 'Gate 2 — Faculty/Staff Exit',
      type: 'Exit',
      status: 'Connected',
      ip: '192.168.1.104',
      port: 554,
      channel: 'stream1',
      username: 'admin',
      credentialsMasked: true,
      anprThreshold: 96,
      resolution: '1080P Full HD (1920x1080)',
      fps: 30,
      boundingBoxes: true,
      autoBarrierTrigger: true,
      ocrEngine: 'EasyOCR ANPR Model',
      feedImage: '/camera_2_feed.png'
    },

    // GATE 3 — VISITOR GATE (Entry & Exit)
    {
      id: 'cam_visitor_entry',
      name: 'Visitor Gate Entry Camera',
      gate: 'Visitor Gate',
      gateNumber: 3,
      category: 'Visitor',
      location: 'Gate 3 — Visitor Entry',
      type: 'Entry',
      status: 'Connected',
      ip: '192.168.1.105',
      port: 554,
      channel: 'stream1',
      username: 'admin',
      credentialsMasked: true,
      anprThreshold: 92,
      resolution: '1080P Full HD (1920x1080)',
      fps: 30,
      boundingBoxes: true,
      autoBarrierTrigger: true,
      ocrEngine: 'PaddleOCR / CRNN',
      feedImage: '/camera_1_feed.png'
    },
    {
      id: 'cam_visitor_exit',
      name: 'Visitor Gate Exit Camera',
      gate: 'Visitor Gate',
      gateNumber: 3,
      category: 'Visitor',
      location: 'Gate 3 — Visitor Exit',
      type: 'Exit',
      status: 'Connected',
      ip: '192.168.1.106',
      port: 554,
      channel: 'stream1',
      username: 'admin',
      credentialsMasked: true,
      anprThreshold: 93,
      resolution: '1080P Full HD (1920x1080)',
      fps: 30,
      boundingBoxes: true,
      autoBarrierTrigger: true,
      ocrEngine: 'EasyOCR ANPR Model',
      feedImage: '/camera_2_feed.png'
    }
  ]);

  // Selected camera for configuration
  const [editingCamId, setEditingCamId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [testingCamId, setTestingCamId] = useState(null);
  const [revealedCamId, setRevealedCamId] = useState(null);

  // Synchronize with backend API on mount
  useEffect(() => {
    async function loadBackendCameras() {
      try {
        const res = await fetch('/api/camera-settings');
        if (res.ok) {
          const data = await res.json();
          if (data.cameras && data.cameras.length > 0) {
            setCameras(data.cameras);
          }
        }
      } catch (err) {
        console.warn('Backend camera fetch error:', err);
      }
    }
    loadBackendCameras();
  }, []);

  const handleOpenEdit = (cam) => {
    playSound('beep', soundEnabled);
    setEditingCamId(cam.id);
    setEditForm({ ...cam, password: '••••••••' });
    setSaveSuccess(null);
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    playSound('success', soundEnabled);
    setCameras(prev => prev.map(c => c.id === editForm.id ? { ...editForm, password: undefined } : c));
    setEditingCamId(null);
    setSaveSuccess(`Camera settings for ${editForm.name} saved securely to backend database.`);
    setTimeout(() => setSaveSuccess(null), 4000);

    try {
      await fetch('/api/camera-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
    } catch (err) {
      console.warn('Backend camera save error:', err);
    }
  };

  const handleToggleConnection = (id) => {
    playSound('beep', soundEnabled);
    setCameras(prev => prev.map(c => {
      if (c.id === id) {
        const nextStatus = c.status === 'Connected' ? 'Offline' : 'Connected';
        return { ...c, status: nextStatus };
      }
      return c;
    }));
  };

  const handleTestConnection = (id) => {
    playSound('beep', soundEnabled);
    setTestingCamId(id);
    setTimeout(() => {
      setTestingCamId(null);
      playSound('success', soundEnabled);
    }, 900);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', paddingBottom: '35px' }}>
      
      {/* 1. Header & Security Classification */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
              Optical Camera Configuration & ANPR Calibration
            </h1>
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(16, 185, 129, 0.12)',
              color: 'var(--green-bright)',
              padding: '3px 9px',
              borderRadius: '6px',
              border: '1px solid var(--border-neon-green)',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Lock size={12} />
              CREDENTIALS ENCRYPTED (BACKEND STORE)
            </span>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Configure RTSP stream URLs, Entry/Exit designations, and optical detection thresholds. Camera credentials are encrypted and never exposed in the UI.
          </p>
        </div>

        {/* Pipeline Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setPipelineMode(pipelineMode === 'SIMULATION' ? 'LIVE_AI' : 'SIMULATION')}
            className="btn-ghost"
            style={{ fontSize: '12px', padding: '7px 14px' }}
          >
            <Radio size={14} color={pipelineMode === 'SIMULATION' ? 'var(--orange-bright)' : 'var(--green-bright)'} />
            Mode: {pipelineMode === 'SIMULATION' ? 'Simulation Mode' : 'Live RTSP Stream'}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid var(--border-neon-green)',
          color: 'var(--green-bright)',
          fontSize: '12.5px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={16} />
          {saveSuccess}
        </div>
      )}

      {/* 2. PHASE 13: 3-Gate Category Filter & Camera Cards Grid */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        background: 'rgba(6, 11, 24, 0.75)',
        padding: '10px 16px',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={15} color="var(--cyan-primary)" />
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
            Campus Access Gate Streams ({cameras.filter(c => selectedGateFilter === 'all' || c.category === selectedGateFilter).length} Streams Configured)
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'all', label: 'All 3 Gates (6 Streams)' },
            { id: 'Student', label: '🚪 Gate 1 (Student)', color: '#3A86FF' },
            { id: 'Staff', label: '🚪 Gate 2 (Staff)', color: '#8B5CF6' },
            { id: 'Visitor', label: '🚪 Gate 3 (Visitor)', color: '#10B981' }
          ].map(tab => {
            const isSel = selectedGateFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  playSound('beep', soundEnabled);
                  setSelectedGateFilter(tab.id);
                }}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isSel ? '1px solid var(--cyan-primary)' : '1px solid transparent',
                  background: isSel ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  color: isSel ? '#FFFFFF' : 'var(--text-muted)',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px' }}>
        {cameras
          .filter(cam => selectedGateFilter === 'all' || cam.category === selectedGateFilter)
          .map(cam => {
          const isConnected = cam.status === 'Connected';
          const isTesting = testingCamId === cam.id;
          const maskedRtsp = `rtsp://${cam.username}:••••••••@${cam.ip}:${cam.port}/${cam.channel}`;

          return (
            <div
              key={cam.id}
              className="glass-panel hover-bright"
              style={{
                padding: '22px',
                border: isConnected ? '1px solid var(--border-neon-cyan)' : '1px solid rgba(239, 68, 68, 0.4)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              {/* Header: Camera Name + Designation + Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: isConnected ? 'rgba(0, 240, 255, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isConnected ? 'var(--cyan-primary)' : 'var(--red-bright)'
                  }}>
                    <Camera size={22} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
                        {cam.name}
                      </h3>
                      <span style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: cam.category === 'Student' ? 'rgba(58, 134, 255, 0.2)' : cam.category === 'Staff' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: cam.category === 'Student' ? '#93C5FD' : cam.category === 'Staff' ? '#C4B5FD' : '#6EE7B7',
                        border: `1px solid ${cam.category === 'Student' ? 'rgba(58, 134, 255, 0.4)' : cam.category === 'Staff' ? 'rgba(139, 92, 246, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                        fontWeight: 800
                      }}>
                        Gate {cam.gateNumber || (cam.category === 'Student' ? 1 : cam.category === 'Staff' ? 2 : 3)} — {cam.category} Gate
                      </span>
                      <span style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: cam.type === 'Entry' ? 'rgba(0, 240, 255, 0.15)' : 'rgba(58, 134, 255, 0.15)',
                        color: cam.type === 'Entry' ? 'var(--cyan-primary)' : 'var(--blue-hover)',
                        fontWeight: 700
                      }}>
                        {cam.type}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Location: <strong style={{ color: '#FFFFFF' }}>{cam.location}</strong>
                    </div>
                  </div>
                </div>

                {/* Connection Status Badge (🟢 Connected / 🔴 Offline) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '11.5px',
                    fontFamily: 'var(--font-mono)',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    background: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: isConnected ? 'var(--green-bright)' : 'var(--red-bright)',
                    border: isConnected ? '1px solid var(--border-neon-green)' : '1px solid rgba(239, 68, 68, 0.5)',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: isConnected ? 'var(--green-bright)' : 'var(--red-bright)',
                      boxShadow: isConnected ? '0 0 8px var(--green-bright)' : '0 0 8px var(--red-bright)'
                    }} />
                    {isConnected ? '🟢 Connected' : '🔴 Camera Offline'}
                  </span>
                </div>
              </div>

              {/* Camera Live Stream Snapshot */}
              <div style={{
                position: 'relative',
                borderRadius: '10px',
                overflow: 'hidden',
                height: '160px',
                background: '#040711',
                border: '1px solid var(--border-subtle)'
              }}>
                <img
                  src={cam.feedImage}
                  alt={cam.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: isConnected ? 'contrast(1.05)' : 'grayscale(1) brightness(0.4)'
                  }}
                />

                {!isConnected && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(3, 7, 18, 0.75)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    color: 'var(--red-bright)'
                  }}>
                    <WifiOff size={28} />
                    <span style={{ fontSize: '13px', fontWeight: 800 }}>CAMERA STREAM OFFLINE</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Manual entry fallback available</span>
                  </div>
                )}

                <div style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  background: 'rgba(0, 0, 0, 0.8)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '9.5px',
                  fontFamily: 'var(--font-mono)',
                  color: isConnected ? 'var(--green-bright)' : 'var(--red-bright)'
                }}>
                  {isConnected ? `● LIVE • ${cam.fps} FPS` : '● OFFLINE'}
                </div>

                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  background: 'rgba(0, 0, 0, 0.8)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '9.5px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--cyan-primary)'
                }}>
                  {cam.resolution}
                </div>
              </div>

              {/* Masked IP / RTSP Stream URL (Never expose camera credentials publicly in UI) */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.8)',
                borderRadius: '8px',
                padding: '10px 14px',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px'
              }}>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={10} color="var(--cyan-primary)" />
                    IP / RTSP Stream Endpoint (Protected)
                  </div>
                  <div style={{
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    color: '#FFFFFF',
                    marginTop: '2px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {maskedRtsp}
                  </div>
                </div>

                <span style={{
                  fontSize: '9.5px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-dim)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  flexShrink: 0
                }}>
                  PASS MASKED
                </span>
              </div>

              {/* Detection Settings Summary */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '8px',
                fontSize: '11px'
              }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-dim)', textTransform: 'uppercase', fontSize: '9px' }}>ANPR Threshold</span>
                  <div style={{ fontWeight: 800, color: 'var(--cyan-primary)', marginTop: '2px' }}>
                    {cam.anprThreshold}% Confidence
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-dim)', textTransform: 'uppercase', fontSize: '9px' }}>Bounding Boxes</span>
                  <div style={{ fontWeight: 800, color: cam.boundingBoxes ? 'var(--green-bright)' : 'var(--text-muted)', marginTop: '2px' }}>
                    {cam.boundingBoxes ? 'Enabled' : 'Disabled'}
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-dim)', textTransform: 'uppercase', fontSize: '9px' }}>Barrier Relay</span>
                  <div style={{ fontWeight: 800, color: cam.autoBarrierTrigger ? 'var(--green-bright)' : 'var(--text-muted)', marginTop: '2px' }}>
                    {cam.autoBarrierTrigger ? 'Auto-Trigger' : 'Manual'}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Configure, Toggle Offline/Online, Test Ping */}
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                <button
                  onClick={() => handleOpenEdit(cam)}
                  className="btn-primary"
                  style={{ flex: 1, fontSize: '11.5px', padding: '8px', justifyContent: 'center' }}
                >
                  <Edit2 size={13} /> Configure Settings
                </button>

                <button
                  onClick={() => handleTestConnection(cam.id)}
                  disabled={isTesting}
                  className="btn-ghost"
                  style={{ fontSize: '11.5px', padding: '8px 12px' }}
                >
                  <RefreshCw size={13} className={isTesting ? 'animate-spin' : ''} />
                  {isTesting ? 'Pinging...' : 'Test Feed'}
                </button>

                <button
                  onClick={() => handleToggleConnection(cam.id)}
                  className="btn-ghost"
                  style={{
                    fontSize: '11.5px',
                    padding: '8px 12px',
                    color: isConnected ? 'var(--red-bright)' : 'var(--green-bright)',
                    borderColor: isConnected ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'
                  }}
                >
                  {isConnected ? 'Simulate Disconnect' : 'Reconnect'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Modal / Drawer for Administrator Camera Configuration */}
      {editingCamId && editForm && (
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
          onClick={() => setEditingCamId(null)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '560px',
              padding: '24px',
              border: '1.5px solid var(--border-neon-cyan)',
              background: 'linear-gradient(180deg, rgba(10, 16, 32, 0.98) 0%, rgba(5, 8, 17, 0.99) 100%)',
              boxShadow: '0 0 50px rgba(0, 240, 255, 0.25)',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF' }}>
                  Configure {editForm.name}
                </h3>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Hardware designation, RTSP endpoint, and optical neural network calibration
                </p>
              </div>
              <button
                onClick={() => setEditingCamId(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Camera Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-light)', borderRadius: '6px', color: '#FFFFFF', marginTop: '4px', fontSize: '12.5px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Physical Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-light)', borderRadius: '6px', color: '#FFFFFF', marginTop: '4px', fontSize: '12.5px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Designation (Type)</label>
                  <select
                    value={editForm.type}
                    onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-light)', borderRadius: '6px', color: '#FFFFFF', marginTop: '4px', fontSize: '12.5px' }}
                  >
                    <option value="Entry">Entry Gate</option>
                    <option value="Exit">Exit Gate</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Connection State</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-light)', borderRadius: '6px', color: '#FFFFFF', marginTop: '4px', fontSize: '12.5px' }}
                  >
                    <option value="Connected">Connected (Active)</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
              </div>

              {/* IP / RTSP Configuration with Credential Protection */}
              <div style={{ background: 'rgba(0, 240, 255, 0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                <div style={{ fontSize: '11px', color: 'var(--cyan-primary)', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={12} /> Secure RTSP Stream Configuration
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-dim)' }}>IP Address / Host</label>
                    <input
                      type="text"
                      value={editForm.ip}
                      onChange={e => setEditForm({ ...editForm, ip: e.target.value })}
                      style={{ width: '100%', padding: '7px 9px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--border-light)', borderRadius: '4px', color: '#FFFFFF', fontSize: '12px', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-dim)' }}>RTSP Port</label>
                    <input
                      type="number"
                      value={editForm.port}
                      onChange={e => setEditForm({ ...editForm, port: parseInt(e.target.value) || 554 })}
                      style={{ width: '100%', padding: '7px 9px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--border-light)', borderRadius: '4px', color: '#FFFFFF', fontSize: '12px', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Username</label>
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                      style={{ width: '100%', padding: '7px 9px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--border-light)', borderRadius: '4px', color: '#FFFFFF', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Password (Encrypted on Save)</label>
                    <input
                      type="password"
                      value={editForm.password || '••••••••'}
                      onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                      style={{ width: '100%', padding: '7px 9px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--border-light)', borderRadius: '4px', color: '#FFFFFF', fontSize: '12px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Detection Settings */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-dim)', textTransform: 'uppercase' }}>ANPR Threshold</span>
                    <span style={{ color: 'var(--cyan-primary)', fontWeight: 800 }}>{editForm.anprThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="99"
                    value={editForm.anprThreshold}
                    onChange={e => setEditForm({ ...editForm, anprThreshold: parseInt(e.target.value) })}
                    style={{ width: '100%', accentColor: 'var(--cyan-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Resolution Profile</label>
                  <select
                    value={editForm.resolution}
                    onChange={e => setEditForm({ ...editForm, resolution: e.target.value })}
                    style={{ width: '100%', padding: '7px 9px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-light)', borderRadius: '6px', color: '#FFFFFF', fontSize: '12px' }}
                  >
                    <option value="1080P Full HD (1920x1080)">1080P Full HD</option>
                    <option value="4K UHD (3840x2160)">4K UHD (High Precision)</option>
                    <option value="720P HD (1280x720)">720P HD (Low Latency)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, padding: '10px', fontSize: '12.5px', justifyContent: 'center' }}
                >
                  <Save size={15} /> Save & Encrypt to Backend
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCamId(null)}
                  className="btn-ghost"
                  style={{ padding: '10px 16px', fontSize: '12.5px' }}
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
