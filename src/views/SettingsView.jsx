import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings,
  CircleDollarSign,
  Shield,
  Volume2,
  CheckCircle,
  Save,
  RotateCcw,
  Database
} from 'lucide-react';
import { playSound } from '../utils/audio';

export default function SettingsView() {
  const { settings, setSettings, soundEnabled, setSoundEnabled, resetDatabaseToDefaults, dbStatus, isDbConnected } = useApp();
  const [formState, setFormState] = useState({ ...settings });
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSettings(formState);
    playSound('success', soundEnabled);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '30px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
            System Configuration & Operational Parameters
          </h1>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Institutional tariffs, access control barrier rules, audio feedback, and security personnel profiles
          </p>
        </div>

        {savedNotice && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid var(--border-neon-green)',
            color: 'var(--green-bright)',
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease'
          }}>
            <CheckCircle size={15} /> Settings Saved Successfully!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Card 1: Tariffs & Parking Rules */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--orange-bright)'
            }}>
              <CircleDollarSign size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                Campus Parking Tariffs
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Automated hourly fee schedules computed during vehicle check-out
              </p>
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
                  width: '100%',
                  padding: '9px 12px',
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
                  Student Fee (₹)
                </label>
                <input
                  type="number"
                  value={formState.studentRate}
                  onChange={(e) => setFormState({ ...formState, studentRate: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-light)',
                    color: '#FFFFFF',
                    fontFamily: 'var(--font-mono)'
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
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-light)',
                    color: '#FFFFFF',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Security Personnel & Barrier Rules */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(0, 240, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cyan-primary)'
            }}>
              <Shield size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                Access Control & Security Shift
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Officer on duty details and physical boom barrier gate triggers
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                On-Duty Security Officer Name
              </label>
              <input
                type="text"
                value={formState.officerName}
                onChange={(e) => setFormState({ ...formState, officerName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-light)',
                  color: '#FFFFFF'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Officer Badge Identifier
              </label>
              <input
                type="text"
                value={formState.officerBadge}
                onChange={(e) => setFormState({ ...formState, officerBadge: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--cyan-primary)',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>

            {/* Barrier Gate Auto-Trigger Checkbox */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)'
            }}>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#FFFFFF' }}>Auto-Open Barrier on Whitelist Plate</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Sends instantaneous relay pulse to barrier gate servo motor</div>
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

        {/* Save Bar & DB Maintenance */}
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
    </div>
  );
}
