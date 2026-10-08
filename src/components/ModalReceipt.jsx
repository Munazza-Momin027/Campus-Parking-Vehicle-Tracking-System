import React, { useState } from 'react';
import {
  Printer,
  Download,
  RotateCcw,
  CheckCircle2,
  X,
  ShieldCheck,
  QrCode,
  Sparkles,
  FileText
} from 'lucide-react';
import { generatePdfReceiptBackend } from '../services/backendApi';

export default function ModalReceipt({ receipt, onClose, onNewTransaction }) {
  const [downloading, setDownloading] = useState(false);

  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      const blob = await generatePdfReceiptBackend(receipt);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CPVTS_Receipt_${receipt.vehicleNumber || 'Campus'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF receipt:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'linear-gradient(180deg, rgba(10, 16, 32, 0.98) 0%, rgba(5, 8, 17, 0.99) 100%)',
          border: '1px solid var(--border-neon-cyan)',
          boxShadow: '0 0 50px rgba(0, 240, 255, 0.25), 0 20px 40px rgba(0, 0, 0, 0.8)',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Receipt Header Strip */}
        <div style={{
          padding: '12px 18px',
          background: 'rgba(0, 240, 255, 0.08)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={15} color="var(--cyan-primary)" />
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--cyan-primary)', fontWeight: 700 }}>
              OFFICIAL SETTLEMENT RECEIPT #{receipt.receiptId || 'RCPT-8821'}
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '2px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Printable Receipt Paper Container */}
        <div id="cpvts-printable-receipt" style={{ padding: '24px 24px 16px 24px' }}>
          
          {/* Logo & Institution Header */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{
              width: '54px',
              height: '54px',
              margin: '0 auto 8px auto',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 0 20px rgba(0, 240, 255, 0.35)',
              border: '1px solid rgba(0, 240, 255, 0.4)',
              background: '#040711'
            }}>
              <img
                src="/logo.png"
                alt="CPVTS Logo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            
            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '18px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              color: '#FFFFFF'
            }}>
              CPVTS
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--cyan-primary)', fontWeight: 600 }}>
              Campus Parking & Vehicle Tracking System
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
              Autonomous Ingress/Egress Smart Campus Terminal
            </div>
          </div>

          {/* Badges: AUTO CHECK-OUT & SLOT RELEASED */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <div style={{
              padding: '7px 10px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid var(--border-neon-green)',
              color: 'var(--green-bright)',
              fontSize: '11px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <CheckCircle2 size={14} />
              AUTO CHECK-OUT
            </div>

            <div style={{
              padding: '7px 10px',
              borderRadius: '8px',
              background: 'rgba(58, 134, 255, 0.15)',
              border: '1px solid rgba(58, 134, 255, 0.4)',
              color: 'var(--blue-hover)',
              fontSize: '11px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <ShieldCheck size={14} />
              SLOT RELEASED
            </div>
          </div>

          {/* Core Vehicle & Bay Details */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            padding: '12px 14px',
            marginBottom: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Vehicle Number</span>
              <span className="plate-badge" style={{ fontSize: '15px' }}>
                {receipt.vehicleNumber}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Vehicle Type</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>
                {receipt.vehicleType}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Owner Category</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyan-primary)' }}>
                {receipt.category}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Vacated Slot</span>
              <span className="slot-badge" style={{ fontSize: '13px' }}>
                {receipt.slot}
              </span>
            </div>
          </div>

          {/* Timestamps & Duration */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            padding: '10px 14px',
            marginBottom: '14px',
            fontSize: '11.5px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ color: 'var(--text-dim)' }}>Entry Time:</span>
              <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{receipt.entryTime}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ color: 'var(--text-dim)' }}>Exit Time:</span>
              <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{receipt.exitTime}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dim)' }}>Total Duration:</span>
              <span style={{ color: 'var(--cyan-primary)', fontWeight: 700 }}>{receipt.duration}</span>
            </div>
          </div>

          {/* Fee Calculation Breakdown */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            borderRadius: '10px',
            border: '1px solid rgba(0, 240, 255, 0.2)',
            padding: '12px 14px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Fee Calculation (Backend Engine)
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Free Grace Hours:</span>
              <span style={{ color: 'var(--green-bright)', fontWeight: 700 }}>{receipt.freeHours ?? 2} hrs</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Charged Hours:</span>
              <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{receipt.chargedHours ?? 0} hrs</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Hourly Tariff Rate:</span>
              <span style={{ color: '#FFFFFF', fontWeight: 600 }}>₹{receipt.rate ?? 0}/hr</span>
            </div>

            {/* Total Amount Box */}
            <div style={{
              borderTop: '1px dashed var(--border-subtle)',
              paddingTop: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>TOTAL AMOUNT</span>
              <span style={{
                fontSize: '20px',
                fontWeight: 900,
                color: receipt.totalAmount === 0 ? 'var(--green-bright)' : '#FFFFFF',
                fontFamily: 'var(--font-heading)'
              }}>
                ₹{receipt.totalAmount ?? 0}
              </span>
            </div>
          </div>

          {/* Barcode & Security Hash */}
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <div style={{
              height: '24px',
              background: 'repeating-linear-gradient(90deg, #FFFFFF 0px, #FFFFFF 2px, transparent 2px, transparent 5px, #FFFFFF 5px, #FFFFFF 9px, transparent 9px, transparent 11px)',
              margin: '0 auto 4px auto',
              width: '80%',
              opacity: 0.8
            }} />
            <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
              VERIFIED BY CPVTS BACKEND REST GATEWAY • SEC-ID-{Date.now().toString().slice(-6)}
            </div>
          </div>
        </div>

        {/* Buttons: Print, Download PDF, New Transaction */}
        <div style={{
          padding: '16px 20px',
          background: 'rgba(8, 14, 28, 0.95)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1.2fr',
          gap: '10px'
        }}>
          <button
            onClick={handlePrint}
            className="btn-ghost"
            style={{ fontSize: '12px', padding: '10px 8px', justifyContent: 'center' }}
          >
            <Printer size={15} /> Print
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="btn-ghost"
            style={{
              fontSize: '12px',
              padding: '10px 8px',
              justifyContent: 'center',
              color: 'var(--cyan-primary)',
              borderColor: 'rgba(0, 240, 255, 0.3)'
            }}
          >
            <Download size={15} /> {downloading ? 'Saving...' : 'Download PDF'}
          </button>

          <button
            onClick={() => {
              if (onNewTransaction) onNewTransaction();
              onClose();
            }}
            className="btn-primary"
            style={{ fontSize: '12px', padding: '10px 10px', justifyContent: 'center' }}
          >
            <RotateCcw size={15} /> New Transaction
          </button>
        </div>
      </div>
    </div>
  );
}
