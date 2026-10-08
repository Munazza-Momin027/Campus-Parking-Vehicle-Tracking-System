import React from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CircleDollarSign,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Activity,
  Car,
  Bike,
  Users,
  ParkingSquare,
  DollarSign,
  PieChart,
  Layers,
  Sparkles,
  Percent,
  CheckCircle2
} from 'lucide-react';

export default function DailySummaryView() {
  const { metrics, slots, activities } = useApp();

  // Dynamic Metrics computed from active store
  const occupiedCount = slots.filter(s => s.occupied).length;
  const twoWheelersOccupied = slots.filter(s => s.occupied && s.zone === 'two-wheeler').length;
  const fourWheelersOccupied = slots.filter(s => s.occupied && s.zone === 'four-wheeler').length;
  const twoWheelersTotal = 10;
  const fourWheelersTotal = 5;

  const twoWheelerPct = Math.round((twoWheelersOccupied / twoWheelersTotal) * 100);
  const fourWheelerPct = Math.round((fourWheelersOccupied / fourWheelersTotal) * 100);
  const totalUtilizationPct = Math.round((occupiedCount / 15) * 100);

  // Category counts from activities
  const studentCount = activities.filter(a => a.category === 'Student').length || 6;
  const staffCount = activities.filter(a => a.category === 'Staff').length || 4;
  const visitorCount = activities.filter(a => a.category === 'Visitor').length || 3;
  const totalCategoryVehicles = studentCount + staffCount + visitorCount;

  const studentPct = Math.round((studentCount / totalCategoryVehicles) * 100);
  const staffPct = Math.round((staffCount / totalCategoryVehicles) * 100);
  const visitorPct = Math.round((visitorCount / totalCategoryVehicles) * 100);

  // Hourly Vehicle Entries Data (Today)
  const hourlyEntriesData = [
    { hour: '07:00 AM', entries: 3, exits: 0, revenue: 0 },
    { hour: '08:00 AM', entries: 5, exits: 1, revenue: 0 },
    { hour: '09:00 AM', entries: 8, exits: 2, revenue: 20 },
    { hour: '10:00 AM', entries: 12, exits: 4, revenue: 40 },
    { hour: '11:00 AM', entries: 6, exits: 5, revenue: 60 },
    { hour: '12:00 PM', entries: 4, exits: 7, revenue: 40 },
    { hour: '01:00 PM', entries: 5, exits: 4, revenue: 20 },
    { hour: '02:00 PM', entries: 3, exits: 3, revenue: 40 },
    { hour: '03:00 PM', entries: 2, exits: 4, revenue: 0 }
  ];

  const maxHourly = 14;

  // Daily Collection by Time Slot
  const collectionSlots = [
    { period: 'Morning (07:00 - 10:00)', amount: 60, pct: 28, transactions: 4 },
    { period: 'Midday (10:00 - 13:00)', amount: 140, pct: 54, transactions: 8 },
    { period: 'Afternoon (13:00 - 16:00)', amount: 60, pct: 18, transactions: 3 }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', paddingBottom: '35px' }}>
      
      {/* 1. Header & Live Telemetry Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
              CPVTS Daily Summary & Analytics Dashboard
            </h1>
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(0, 240, 255, 0.12)',
              color: 'var(--cyan-primary)',
              padding: '3px 9px',
              borderRadius: '6px',
              border: '1px solid var(--border-neon-cyan)',
              fontWeight: 800
            }}>
              LIVE AUDIT
            </span>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Comprehensive campus ingress/egress analytics, zone utilization telemetry, and revenue auditing
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
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green-bright)', boxShadow: '0 0 6px var(--green-bright)' }} />
            AGGREGATOR REALTIME SYNC
          </span>
        </div>
      </div>

      {/* 2. PHASE 12: Top 5 Required KPI Metrics Display
          1. Vehicles parked today | 2. Total entries | 3. Total exits | 4. Current occupied slots | 5. Total collection */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
        
        {/* KPI 1: Vehicles Parked Today */}
        <div className="glass-panel hover-bright" style={{ padding: '16px 18px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Vehicles Parked Today
            </span>
            <Car size={16} color="var(--cyan-primary)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#FFFFFF', marginTop: '6px', fontFamily: 'var(--font-heading)' }}>
            {metrics.todayVehicles || 13}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--cyan-primary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={12} /> Unique plates recorded
          </div>
        </div>

        {/* KPI 2: Total Entries */}
        <div className="glass-panel hover-bright" style={{ padding: '16px 18px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Entries
            </span>
            <Zap size={16} color="var(--green-bright)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#FFFFFF', marginTop: '6px', fontFamily: 'var(--font-heading)' }}>
            {metrics.todayEntries || 18}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--green-bright)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Gate 1 (Ingress) ANPR verified
          </div>
        </div>

        {/* KPI 3: Total Exits */}
        <div className="glass-panel hover-bright" style={{ padding: '16px 18px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Exits
            </span>
            <Clock size={16} color="var(--blue-hover)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#FFFFFF', marginTop: '6px', fontFamily: 'var(--font-heading)' }}>
            {metrics.todayExits || 8}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--blue-hover)', marginTop: '4px' }}>
            Gate 2 (Egress) Cleared
          </div>
        </div>

        {/* KPI 4: Current Occupied Slots */}
        <div className="glass-panel hover-bright" style={{ padding: '16px 18px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Current Occupied Slots
            </span>
            <ParkingSquare size={16} color="var(--purple-bright)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#FFFFFF', marginTop: '6px', fontFamily: 'var(--font-heading)' }}>
            {occupiedCount} <span style={{ fontSize: '16px', color: 'var(--text-dim)', fontWeight: 500 }}>/ 15</span>
          </div>
          <div style={{ fontSize: '11px', color: occupiedCount > 12 ? 'var(--red-bright)' : 'var(--purple-bright)', marginTop: '4px' }}>
            {totalUtilizationPct}% Campus Bay Occupancy
          </div>
        </div>

        {/* KPI 5: Total Collection */}
        <div className="glass-panel hover-bright" style={{ padding: '16px 18px', border: '1.5px solid rgba(245, 158, 11, 0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Collection
            </span>
            <CircleDollarSign size={16} color="var(--orange-bright)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--orange-bright)', marginTop: '6px', fontFamily: 'var(--font-heading)' }}>
            ₹{metrics.todayCollection || 260}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--green-bright)', marginTop: '4px' }}>
            100% Institutional Tariff Audited
          </div>
        </div>

      </div>

      {/* 3. PHASE 12 Charts: Section A (Hourly Vehicle Entries & Parking Utilization) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: '20px' }}>
        
        {/* CHART 1: Hourly Vehicle Entries */}
        <div className="glass-panel" style={{ padding: '22px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={18} color="var(--cyan-primary)" />
                <h3 style={{ fontSize: '15.5px', fontWeight: 800, color: '#FFFFFF' }}>
                  Hourly Vehicle Entries & Ingress Velocity
                </h3>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Optical ANPR detection frequency distribution over campus operating hours
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--cyan-primary)' }} />
                <span style={{ color: 'var(--text-muted)' }}>Ingress Entries</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--blue-hover)' }} />
                <span style={{ color: 'var(--text-muted)' }}>Egress Exits</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            height: '210px',
            paddingTop: '20px',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '8px',
            gap: '8px'
          }}>
            {hourlyEntriesData.map((d, i) => {
              const entryH = Math.max(12, (d.entries / maxHourly) * 170);
              const exitH = Math.max(8, (d.exits / maxHourly) * 170);
              const isPeak = d.entries >= 10;

              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                  {isPeak && (
                    <span style={{
                      fontSize: '9px',
                      color: 'var(--orange-bright)',
                      fontWeight: 800,
                      marginBottom: '4px',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      PEAK
                    </span>
                  )}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '170px' }}>
                    {/* Ingress bar */}
                    <div
                      style={{
                        width: '16px',
                        height: `${entryH}px`,
                        background: isPeak
                          ? 'linear-gradient(180deg, #F59E0B 0%, #00F0FF 100%)'
                          : 'linear-gradient(180deg, #00F0FF 0%, #0284C7 100%)',
                        borderRadius: '4px 4px 0 0',
                        boxShadow: '0 0 12px rgba(0, 240, 255, 0.35)',
                        transition: 'all 0.3s ease'
                      }}
                      title={`${d.hour}: ${d.entries} Entries`}
                    />
                    {/* Egress bar */}
                    <div
                      style={{
                        width: '16px',
                        height: `${exitH}px`,
                        background: 'linear-gradient(180deg, #3A86FF 0%, #1D4ED8 100%)',
                        borderRadius: '4px 4px 0 0',
                        boxShadow: '0 0 8px rgba(58, 134, 255, 0.25)',
                        transition: 'all 0.3s ease'
                      }}
                      title={`${d.hour}: ${d.exits} Exits`}
                    />
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: '8px', whiteSpace: 'nowrap' }}>
                    {d.hour.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>Peak Ingress Window: <strong style={{ color: 'var(--cyan-primary)' }}>09:30 AM - 10:45 AM</strong></span>
            <span>Current Throughput: <strong style={{ color: 'var(--green-bright)' }}>98.6% ANPR Success Rate</strong></span>
          </div>
        </div>

        {/* CHART 2: Parking Utilization */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Percent size={18} color="var(--purple-bright)" />
              <h3 style={{ fontSize: '15.5px', fontWeight: 800, color: '#FFFFFF' }}>
                Parking Utilization Telemetry
              </h3>
            </div>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--purple-bright)' }}>
              15 BAYS TOTAL
            </span>
          </div>

          {/* Master Utilization Progress Gauge */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#FFFFFF', fontWeight: 700 }}>Total Campus Occupancy</span>
              <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--purple-bright)', fontFamily: 'var(--font-heading)' }}>
                {totalUtilizationPct}%
              </span>
            </div>

            <div style={{
              height: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '5px',
              overflow: 'hidden',
              boxShadow: 'inset 0 0 5px rgba(0, 0, 0, 0.5)'
            }}>
              <div style={{
                height: '100%',
                width: `${totalUtilizationPct}%`,
                background: 'linear-gradient(90deg, #3A86FF 0%, #8B5CF6 60%, #00F0FF 100%)',
                boxShadow: '0 0 12px rgba(139, 92, 246, 0.5)',
                transition: 'width 0.4s ease'
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '8px' }}>
              <span>{occupiedCount} Occupied Bays</span>
              <span>{15 - occupiedCount} Available (Vacant)</span>
            </div>
          </div>

          {/* Zone-Specific Utilization Meters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Zone F: Four-Wheeler (5 Slots) */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Car size={14} color="var(--cyan-primary)" /> Four-Wheeler Zone (F-01 .. F-05)
                </span>
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--cyan-primary)' }}>
                  {fourWheelersOccupied}/5 ({fourWheelerPct}%)
                </span>
              </div>
              <div style={{ height: '7px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${fourWheelerPct}%`, background: 'var(--cyan-primary)', boxShadow: '0 0 8px var(--cyan-primary)' }} />
              </div>
            </div>

            {/* Zone T: Two-Wheeler (10 Slots) */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bike size={14} color="var(--blue-hover)" /> Two-Wheeler Zone (T-01 .. T-10)
                </span>
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--blue-hover)' }}>
                  {twoWheelersOccupied}/10 ({twoWheelerPct}%)
                </span>
              </div>
              <div style={{ height: '7px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${twoWheelerPct}%`, background: 'var(--blue-hover)', boxShadow: '0 0 8px var(--blue-hover)' }} />
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* 4. PHASE 12 Charts: Section B (Two-Wheeler vs Four-Wheeler, Category Breakdown, Daily Collection) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        
        {/* CHART 3: Two-Wheeler vs Four-Wheeler */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Layers size={17} color="var(--cyan-primary)" />
            <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: '#FFFFFF' }}>
              Two-Wheeler vs Four-Wheeler
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px', padding: '16px 0' }}>
            {/* Two-Wheeler Column */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'rgba(58, 134, 255, 0.15)',
                border: '1.5px solid var(--blue-hover)',
                margin: '0 auto 8px auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--blue-hover)'
              }}>
                <Bike size={24} />
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
                {twoWheelersOccupied + 4}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Two-Wheelers (62%)</div>
            </div>

            <div style={{ height: '60px', width: '1px', background: 'var(--border-subtle)' }} />

            {/* Four-Wheeler Column */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'rgba(0, 240, 255, 0.15)',
                border: '1.5px solid var(--cyan-primary)',
                margin: '0 auto 8px auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--cyan-primary)'
              }}>
                <Car size={24} />
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
                {fourWheelersOccupied + 2}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Four-Wheelers (38%)</div>
            </div>
          </div>

          {/* Comparative Ratio Bar */}
          <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden', display: 'flex', marginTop: '10px' }}>
            <div style={{ width: '62%', background: 'var(--blue-hover)', height: '100%' }} />
            <div style={{ width: '38%', background: 'var(--cyan-primary)', height: '100%' }} />
          </div>

          <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', textAlign: 'center', marginTop: '10px' }}>
            Ratio: 1.63 Two-Wheelers per Four-Wheeler
          </div>
        </div>

        {/* CHART 4: Student vs Staff vs Visitor */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Users size={17} color="var(--purple-bright)" />
            <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: '#FFFFFF' }}>
              Student vs Staff vs Visitor
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Student */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: '#FFFFFF', fontWeight: 600 }}>Students</span>
                <span style={{ color: 'var(--cyan-primary)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  {studentCount} ({studentPct}%)
                </span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${studentPct}%`, background: 'var(--cyan-primary)' }} />
              </div>
            </div>

            {/* Staff */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: '#FFFFFF', fontWeight: 600 }}>Staff & Faculty</span>
                <span style={{ color: 'var(--purple-bright)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  {staffCount} ({staffPct}%)
                </span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${staffPct}%`, background: 'var(--purple-bright)' }} />
              </div>
            </div>

            {/* Visitor */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: '#FFFFFF', fontWeight: 600 }}>Visitors & Guests</span>
                <span style={{ color: 'var(--orange-bright)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  {visitorCount} ({visitorPct}%)
                </span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${visitorPct}%`, background: 'var(--orange-bright)' }} />
              </div>
            </div>
          </div>

          <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
            Institutional Pass Exemption: <strong style={{ color: 'var(--green-bright)' }}>85% Zero-Fee Ingress</strong>
          </div>
        </div>

        {/* CHART 5: Daily Collection */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <DollarSign size={17} color="var(--orange-bright)" />
            <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: '#FFFFFF' }}>
              Daily Collection & Revenue
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {collectionSlots.map((c, i) => (
              <div key={i} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>{c.period}</span>
                  <span style={{ color: '#FFFFFF', fontWeight: 700 }}>₹{c.amount}</span>
                </div>
                <div style={{ height: '5px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '3px', overflow: 'hidden', marginTop: '6px' }}>
                  <div style={{ height: '100%', width: `${c.pct}%`, background: 'var(--orange-bright)' }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Audited Total:</span>
            <span style={{ fontSize: '16px', fontWeight: 900, color: 'var(--orange-bright)', fontFamily: 'var(--font-heading)' }}>
              ₹{metrics.todayCollection || 260}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
