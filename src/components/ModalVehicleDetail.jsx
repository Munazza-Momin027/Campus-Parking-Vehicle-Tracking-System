import React from 'react';
import { useApp } from '../context/AppContext';
import { X, CheckCircle, Clock, Shield, Car, Bike, Printer, LogOut, Video } from 'lucide-react';

export default function ModalVehicleDetail() {
  const { inspectItem, setInspectItem, checkOutVehicle, setCurrentTab } = useApp();

  if (!inspectItem) return null;

  const { type, data } = inspectItem;

  // Normalize data for display
  const plate = data.vehicleNumber || (data.occupied ? data.vehicleNumber : 'None');
  const slotId = data.slot || data.id || 'N/A';
  const driver = data.driver || data.ownerName || 'Unregistered Visitor';
  const category = data.category || 'Visitor';
  const isCar = data.type === 'Four-Wheeler' || data.vehicleType === 'Four-Wheeler' || (data.zone === 'four-wheeler');
  const entryTime = data.entryTime || '10:24 AM';
  const fee = data.fee !== undefined ? data.fee : (category === 'Visitor' ? 40 : 0);
  const status = data.status || (data.occupied ? 'Parked' : 'Available');
  const photo = data.photo || (isCar ? '/camera_1_feed.png' : '/camera_2_feed.png');

  const handleCheckOut = () => {
    if (plate && plate !== 'None') {
      checkOutVehicle({ vehicleNumber: plate, slotId, fee });
      setInspectItem(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
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
      <div
        id="cpvts-printable-pass"
        style={{
        width: '100%',
        maxWidth: '560px',
        background: '#0D1424',
        border: '1px solid rgba(0, 240, 255, 0.35)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 240, 255, 0.2)',
        borderRadius: '16px',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
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
              {isCar ? <Car size={18} /> : <Bike size={18} />}
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
                Vehicle & Slot Telemetry
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Real-time ANPR Inspection • AI Verified
              </p>
            </div>
          </div>
          <button
            onClick={() => setInspectItem(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Plate & Slot Highlight */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.7)',
            padding: '14px 18px',
            borderRadius: '12px',
            border: '1px solid var(--border-light)'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>
                License Plate
              </div>
              <div className="plate-badge" style={{ fontSize: '18px', padding: '6px 12px' }}>
                {plate}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Slot Assigned
              </div>
              <div className="slot-badge" style={{ fontSize: '18px', padding: '6px 14px' }}>
                {slotId}
              </div>
            </div>
          </div>

          {/* CCTV Capture Preview */}
          <div style={{
            position: 'relative',
            borderRadius: '10px',
            overflow: 'hidden',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            height: '180px',
            background: '#050811'
          }}>
            <img
              src={photo}
              alt="CCTV Verification"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              padding: '3px 8px',
              borderRadius: '4px',
              background: 'rgba(239, 68, 68, 0.85)',
              fontSize: '10px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFFFFF' }} />
              CCTV AI CAPTURE
            </div>
            <div style={{
              position: 'absolute',
              bottom: '8px',
              left: '8px',
              right: '8px',
              background: 'rgba(5, 8, 17, 0.85)',
              backdropFilter: 'blur(8px)',
              padding: '6px 10px',
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'var(--text-muted)'
            }}>
              <span>Entry Gate Camera 1</span>
              <span style={{ color: 'var(--green-bright)' }}>Confidence: 99.4%</span>
            </div>
          </div>

          {/* Details Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            fontSize: '13px'
          }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Driver / Owner</div>
              <div style={{ fontWeight: 600, color: '#FFFFFF', marginTop: '2px' }}>{driver}</div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Category</div>
              <div style={{ fontWeight: 600, color: 'var(--cyan-primary)', marginTop: '2px' }}>{category}</div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Entry Time</div>
              <div style={{ fontWeight: 600, color: '#FFFFFF', marginTop: '2px' }}>{entryTime}</div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Current Fee</div>
              <div style={{ fontWeight: 600, color: 'var(--orange-report)', marginTop: '2px' }}>
                ₹{fee} {category !== 'Visitor' && '(Permit Exemption)'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(5, 8, 17, 0.4)'
        }}>
          <button
            onClick={handlePrint}
            className="btn-ghost"
            style={{ fontSize: '12px', padding: '7px 12px' }}
          >
            <Printer size={14} /> Print Pass
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            {status === 'Parked' && plate && plate !== 'None' && (
              <button
                onClick={handleCheckOut}
                style={{
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '12px',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 0 12px rgba(239, 68, 68, 0.4)'
                }}
              >
                <LogOut size={14} /> Release Slot (Check-Out)
              </button>
            )}

            <button
              onClick={() => {
                setInspectItem(null);
                setCurrentTab('cctv');
              }}
              className="btn-primary"
              style={{ fontSize: '12px', padding: '8px 14px' }}
            >
              <Video size={14} /> View Live Camera
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
