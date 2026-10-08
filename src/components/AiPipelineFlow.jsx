import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Cpu,
  Video,
  Film,
  Eye,
  ScanLine,
  Type,
  Server,
  ArrowRight,
  ShieldAlert,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Sliders,
  Code
} from 'lucide-react';

export default function AiPipelineFlow() {
  const { pipelineMode, setPipelineMode } = useApp();
  const [showArchDetails, setShowArchDetails] = useState(false);

  const stages = [
    {
      num: 1,
      title: 'CCTV / IP Camera',
      icon: Video,
      tech: 'RTSP Stream',
      detail: 'Hikvision / Dahua IP cameras streaming H.264 over RTSP (Port 554)',
      status: pipelineMode === 'SIMULATION' ? 'Simulated Stream' : 'Awaiting RTSP Input',
      color: '#00F0FF'
    },
    {
      num: 2,
      title: 'Video Stream',
      icon: Film,
      tech: 'H.264 / 30 FPS',
      detail: 'Network video stream packet ingestion, timestamp extraction, and FPS synchronization',
      status: 'Stream Buffer',
      color: '#3A86FF'
    },
    {
      num: 3,
      title: 'OpenCV Ingestion',
      icon: Eye,
      tech: 'cv2.VideoCapture',
      detail: 'cv2 frame decoding, BGR numpy matrix conversion (1920x1080), ROI cropping',
      status: 'OpenCV Ingest',
      color: '#8B5CF6'
    },
    {
      num: 4,
      title: 'Vehicle Detection',
      icon: ScanLine,
      tech: 'YOLOv8 Detector',
      detail: 'Detects vehicle bounding boxes, classifies Four-Wheeler vs Two-Wheeler',
      status: pipelineMode === 'SIMULATION' ? 'Simulated Detector' : 'YOLOv8 Slot Ready',
      color: '#A855F7'
    },
    {
      num: 5,
      title: 'Plate Localization',
      icon: ScanLine,
      tech: 'LPR BBox Localizer',
      detail: 'Isolates high-resolution Region of Interest (ROI) bounding box for license plate',
      status: pipelineMode === 'SIMULATION' ? 'Simulated Crop' : 'LPR Crop Ready',
      color: '#EC4899'
    },
    {
      num: 6,
      title: 'OCR / ANPR Engine',
      icon: Type,
      tech: 'EasyOCR / PaddleOCR',
      detail: 'Optical Character Recognition reads alphanumeric plate characters with confidence',
      status: pipelineMode === 'SIMULATION' ? 'Simulated OCR' : 'EasyOCR Ready',
      color: '#F59E0B'
    },
    {
      num: 7,
      title: 'Flask Backend',
      icon: Server,
      tech: 'Python REST API',
      detail: 'Direction tracker (Entry/Exit), vehicle database lookup, slot assignment & barrier relay',
      status: 'Flask Active',
      color: '#10B981'
    }
  ];

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(8, 14, 28, 0.95) 0%, rgba(5, 9, 18, 0.95) 100%)',
      border: pipelineMode === 'SIMULATION' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(0, 240, 255, 0.4)',
      borderRadius: '14px',
      padding: '16px 20px',
      boxShadow: pipelineMode === 'SIMULATION' ? '0 8px 30px rgba(245, 158, 11, 0.1)' : '0 8px 30px rgba(0, 240, 255, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px'
    }}>
      {/* Top Header & Mode Disclosure Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: pipelineMode === 'SIMULATION' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(0, 240, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: pipelineMode === 'SIMULATION' ? 'var(--orange-bright)' : 'var(--cyan-primary)',
            border: pipelineMode === 'SIMULATION' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(0, 240, 255, 0.4)'
          }}>
            <Cpu size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
                CPVTS AI Computer Vision Architecture
              </h2>
              <span style={{
                fontSize: '10.5px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                background: pipelineMode === 'SIMULATION' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(0, 240, 255, 0.15)',
                color: pipelineMode === 'SIMULATION' ? 'var(--orange-bright)' : 'var(--cyan-primary)',
                border: pipelineMode === 'SIMULATION' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(0, 240, 255, 0.4)',
                fontFamily: 'var(--font-mono)'
              }}>
                {pipelineMode === 'SIMULATION' ? '🧪 SIMULATION MODE' : '⚡ LIVE AI PIPELINE'}
              </span>
            </div>
            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0 }}>
              End-to-end processing pipeline: CCTV/IP Camera → Video Stream → OpenCV → Vehicle Detection → Plate Detection → OCR/ANPR → Flask Backend
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setPipelineMode(pipelineMode === 'SIMULATION' ? 'LIVE_AI' : 'SIMULATION')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              background: pipelineMode === 'SIMULATION'
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.3) 100%)'
                : 'linear-gradient(135deg, rgba(0, 240, 255, 0.25) 0%, rgba(58, 134, 255, 0.3) 100%)',
              border: pipelineMode === 'SIMULATION' ? '1px solid rgba(245, 158, 11, 0.6)' : '1px solid rgba(0, 240, 255, 0.6)',
              color: pipelineMode === 'SIMULATION' ? '#FDE68A' : '#E0F2FE'
            }}
            title="Toggle between Simulation Mode and Live Model Pipeline"
          >
            <Sliders size={13} />
            <span>Switch to {pipelineMode === 'SIMULATION' ? 'Live AI Mode' : 'Simulation Mode'}</span>
          </button>

          <button
            onClick={() => setShowArchDetails(!showArchDetails)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-main)'
            }}
          >
            <Code size={13} />
            <span>{showArchDetails ? 'Hide Details' : 'Architecture Specs'}</span>
            {showArchDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Prominent Provenance Notice (Required by prompt) */}
      {pipelineMode === 'SIMULATION' ? (
        <div style={{
          padding: '10px 14px',
          borderRadius: '8px',
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          fontSize: '11.5px',
          color: '#FEF3C7',
          lineHeight: '1.45'
        }}>
          <ShieldAlert size={16} color="var(--orange-bright)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: 'var(--orange-bright)' }}>HONEST SIMULATION / DEMO MODE ACTIVE: </strong>
            All vehicle detections, plate readings, and timestamps below are triggered via predefined simulation scenarios.
            A normal webcam or CCTV feed does <strong>NOT</strong> perform real ANPR without the actual YOLOv8 and OCR models connected.
            The backend architecture (<code style={{ color: 'var(--cyan-primary)' }}>backend/pipeline.py</code>) is fully prepared to attach real model weights (<code style={{ color: 'var(--cyan-primary)' }}>models/yolov8n.pt</code>) and RTSP streams when deployed.
          </div>
        </div>
      ) : (
        <div style={{
          padding: '10px 14px',
          borderRadius: '8px',
          background: 'rgba(0, 240, 255, 0.08)',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          fontSize: '11.5px',
          color: '#E0F2FE',
          lineHeight: '1.45'
        }}>
          <CheckCircle2 size={16} color="var(--cyan-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: 'var(--cyan-primary)' }}>LIVE AI PIPELINE ARCHITECTURE ACTIVE: </strong>
            Backend OpenCV ingestion and YOLOv8 inference classes are listening for live video frames.
            To ingest real CCTV, configure RTSP credentials in Camera Settings or drop weights into <code style={{ color: 'var(--cyan-primary)' }}>backend/models/yolov8n.pt</code>.
            Real detections will be flagged as <code style={{ color: 'var(--green-bright)' }}>LIVE AI INFERENCE</code>.
          </div>
        </div>
      )}

      {/* Visual 7-Stage Architectural Workflow */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '8px',
        alignItems: 'stretch'
      }}>
        {stages.map((stage, idx) => {
          const IconComp = stage.icon;
          return (
            <div
              key={stage.num}
              style={{
                position: 'relative',
                background: 'rgba(11, 18, 33, 0.75)',
                border: `1px solid ${stage.color}35`,
                borderRadius: '10px',
                padding: '10px 8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                transition: 'all 0.2s ease',
                overflow: 'hidden'
              }}
            >
              {/* Step Number Badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: `${stage.color}25`,
                  color: stage.color,
                  fontSize: '10px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {stage.num}
                </span>

                <IconComp size={14} color={stage.color} />
              </div>

              <div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  lineHeight: '1.2',
                  marginBottom: '2px'
                }}>
                  {stage.title}
                </div>
                <div style={{
                  fontSize: '9.5px',
                  color: stage.color,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600
                }}>
                  {stage.tech}
                </div>
              </div>

              {/* Status pill */}
              <div style={{
                marginTop: 'auto',
                fontSize: '8.5px',
                padding: '2px 4px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'var(--text-muted)',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {stage.status}
              </div>

              {/* Step Arrow (except last) */}
              {idx < stages.length - 1 && (
                <div style={{
                  position: 'absolute',
                  right: '-6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 2,
                  color: stage.color,
                  opacity: 0.6,
                  pointerEvents: 'none'
                }}>
                  <ArrowRight size={10} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detected 5-Attribute Specification Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '8px',
        background: 'rgba(5, 9, 18, 0.7)',
        padding: '10px 14px',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '9.5px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            1. Detected Vehicle
          </span>
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#FFFFFF' }}>
            Bounding Box [x, y, w, h]
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '9.5px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            2. Vehicle Type
          </span>
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--cyan-primary)' }}>
            Two-Wheeler / Four-Wheeler
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '9.5px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            3. Number Plate
          </span>
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--green-bright)', fontFamily: 'var(--font-mono)' }}>
            Alphanumeric Text + Conf%
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '9.5px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            4. Direction
          </span>
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#60A5FA' }}>
            ENTRY (Ingress) / EXIT (Egress)
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '9.5px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            5. Timestamp
          </span>
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#FCD34D', fontFamily: 'var(--font-mono)' }}>
            High-Precision Date & Time
          </span>
        </div>
      </div>

      {/* Expandable Architecture Specs & Backend Integration Code */}
      {showArchDetails && (
        <div style={{
          padding: '14px',
          borderRadius: '10px',
          background: '#040711',
          border: '1px solid rgba(0, 240, 255, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          fontSize: '11.5px',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, color: '#FFFFFF' }}>
              Backend Integration Architecture (<code style={{ color: 'var(--cyan-primary)' }}>backend/pipeline.py</code> & <code style={{ color: 'var(--cyan-primary)' }}>backend/app.py</code>)
            </span>
            <span style={{ color: 'var(--text-dim)', fontSize: '10.5px' }}>
              Flask REST API • Port 5000 • CORS Enabled
            </span>
          </div>

          <div style={{
            background: '#02040A',
            padding: '10px 12px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontFamily: 'var(--font-mono)',
            fontSize: '10.5px',
            color: '#94A3B8',
            overflowX: 'auto',
            lineHeight: '1.5'
          }}>
            <span style={{ color: '#64748B' }}># To connect live YOLOv8 weights and EasyOCR:</span><br />
            <span style={{ color: '#00F0FF' }}>pip install</span> ultralytics easyocr opencv-python flask flask-cors<br />
            <span style={{ color: '#64748B' }}># Drop YOLO model weights into:</span><br />
            <span style={{ color: '#38BDF8' }}>cpms/backend/models/yolov8n.pt</span><br />
            <span style={{ color: '#64748B' }}># Start Flask Vision Backend:</span><br />
            <span style={{ color: '#10B981' }}>cd backend && python app.py</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', color: 'var(--text-muted)' }}>
            <div>
              <strong style={{ color: '#FFFFFF' }}>OpenCV Ingestion:</strong> Decodes RTSP H.264 packets into BGR matrix. Frame skipping applies when GPU latency exceeds 33ms (30 FPS ceiling).
            </div>
            <div>
              <strong style={{ color: '#FFFFFF' }}>Tripwire & Direction:</strong> Virtual tripwire bounding box detects if vehicle centroid is moving Ingress (Gate 1) or Egress (Gate 2).
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
