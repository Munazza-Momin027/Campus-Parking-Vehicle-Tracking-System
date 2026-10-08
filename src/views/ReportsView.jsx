import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  Search,
  Car,
  Bike
} from 'lucide-react';

export default function ReportsView() {
  const { activities, setInspectItem } = useApp();
  const [dateRange, setDateRange] = useState('Today (10 Mar 2025)');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = activities.filter(a => {
    if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      return (
        a.vehicleNumber.toLowerCase().includes(q) ||
        a.driver.toLowerCase().includes(q) ||
        a.slot.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDownloadCsv = () => {
    const headers = ['ID', 'Vehicle Number', 'Type', 'Category', 'Slot', 'Entry Time', 'Exit Time', 'Status', 'Fee'];
    const rows = filtered.map(a => [
      `"${String(a.id).replace(/"/g, '""')}"`,
      `"${String(a.vehicleNumber || '').replace(/"/g, '""')}"`,
      `"${String(a.type || '').replace(/"/g, '""')}"`,
      `"${String(a.category || '').replace(/"/g, '""')}"`,
      `"${String(a.slot || '').replace(/"/g, '""')}"`,
      `"${String(a.entryTime || '').replace(/"/g, '""')}"`,
      `"${String(a.exitTime || '').replace(/"/g, '""')}"`,
      `"${String(a.status || '').replace(/"/g, '""')}"`,
      `"${a.fee ?? 0}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CPVTS_Parking_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '30px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
            Audit Reports & Vehicular Logs
          </h1>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Comprehensive historical logs, parking duration analysis, and regulatory campus audit exports
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleDownloadCsv}
            className="btn-primary"
            style={{ fontSize: '12px', padding: '8px 14px' }}
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="btn-ghost"
            style={{ fontSize: '12px', padding: '8px 14px' }}
          >
            <Printer size={14} /> Print Audit
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel" style={{
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '6px 12px'
          }}>
            <Calendar size={14} color="var(--cyan-primary)" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: '12px', outline: 'none' }}
            >
              <option value="Today (10 Mar 2025)">Today (10 Mar 2025)</option>
              <option value="Yesterday">Yesterday</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="This Month">This Month (Mar 2025)</option>
            </select>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '6px 12px'
          }}>
            <Filter size={14} color="var(--cyan-primary)" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: '12px', outline: 'none' }}
            >
              <option value="all">All Categories</option>
              <option value="Student">Students Only</option>
              <option value="Staff">Faculty / Staff Only</option>
              <option value="Visitor">Visitors Only</option>
            </select>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '6px 12px'
          }}>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: '12px', outline: 'none' }}
            >
              <option value="all">All Vehicle Types</option>
              <option value="Two-Wheeler">Two-Wheelers Only</option>
              <option value="Four-Wheeler">Four-Wheelers Only</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '6px 12px',
          width: '240px'
        }}>
          <Search size={14} color="var(--text-dim)" />
          <input
            type="text"
            placeholder="Search in log records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#FFFFFF', fontSize: '12px' }}
          />
        </div>
      </div>

      {/* Reports Table */}
      <div className="glass-panel" style={{ padding: '18px 20px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid var(--border-subtle)',
                color: 'var(--text-dim)',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                <th style={{ padding: '10px 12px' }}>#</th>
                <th style={{ padding: '10px 12px' }}>Vehicle Number</th>
                <th style={{ padding: '10px 12px' }}>Type</th>
                <th style={{ padding: '10px 12px' }}>Category</th>
                <th style={{ padding: '10px 12px' }}>Slot</th>
                <th style={{ padding: '10px 12px' }}>Entry Time</th>
                <th style={{ padding: '10px 12px' }}>Exit Time</th>
                <th style={{ padding: '10px 12px' }}>Duration</th>
                <th style={{ padding: '10px 12px' }}>Fee Paid</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((act, idx) => (
                <tr
                  key={act.id}
                  onClick={() => setInspectItem({ type: 'activity', data: act })}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span className="plate-badge" style={{ fontSize: '12px' }}>
                      {act.vehicleNumber}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                    {act.type}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: act.category === 'Student' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                      color: act.category === 'Student' ? 'var(--green-bright)' : 'var(--purple-bright)',
                      fontWeight: 600
                    }}>
                      {act.category}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span className="slot-badge" style={{ fontSize: '11px' }}>{act.slot}</span>
                  </td>
                  <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>{act.entryTime}</td>
                  <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: act.exitTime === '—' ? 'var(--text-dim)' : '#FFFFFF' }}>
                    {act.exitTime}
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{act.duration || '1h 30m'}</td>
                  <td style={{ padding: '12px', fontWeight: 600, color: act.fee ? 'var(--orange-bright)' : 'var(--text-dim)' }}>
                    ₹{act.fee || 0}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: act.status === 'Parked' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(58, 134, 255, 0.2)',
                      color: act.status === 'Parked' ? 'var(--green-bright)' : '#60A5FA'
                    }}>
                      {act.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
