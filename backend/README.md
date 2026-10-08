# CPVTS AI Detection Pipeline & Backend Architecture

This backend implements the AI vehicle detection and Automated Number Plate Recognition (ANPR) architecture for the **Campus Parking & Vehicle Tracking System (CPVTS)**.

---

## 🏛️ Pipeline Architecture

```
[ CCTV / IP Camera ]
        │  (RTSP / H.264 Video Stream)
        ▼
[ Video Stream Ingestion ]
        │  (OpenCV cv2.VideoCapture)
        ▼
[ Vehicle Detection ]
        │  (YOLOv8 Model: Bounding Box & Class)
        ▼
[ Number Plate Detection ]
        │  (LPR Localizer: Bounding Box Crop)
        ▼
[ OCR / ANPR Engine ]
        │  (EasyOCR / PaddleOCR: Character Recognition)
        ▼
[ Direction & Tripwire Tracker ]
        │  (Vector Calculation: ENTRY vs EXIT)
        ▼
[ Flask Backend REST API ]
        │  (JSON Telemetry Payload)
        ▼
[ React Frontend Dashboard ]
```

---

## 🔬 Modes & Architectural Honesty

Per the design guidelines of CPVTS, **AI results are never faked or misrepresented**:

1. **`SIMULATION` Mode (Default for Development & Demos)**:
   - When real CCTV feeds or trained YOLO/OCR weight files are not loaded, the system operates in an explicit **Simulation Sandbox**.
   - All generated detection events are visibly tagged as **`DEMO / SIMULATION`**.
   - This ensures clarity that synthetic data is in use rather than real live camera ANPR.

2. **`LIVE_AI` Mode**:
   - Engaged when live IP cameras/webcams and trained YOLO/OCR weights (`models/yolov8n.pt`, etc.) are connected.
   - Real OpenCV frames are captured, processed through YOLO bounding box inference, and license plate crops are passed to the OCR recognition engine.

---

## 🔌 How to Connect Real Models Later

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
2. **Place Model Weights**:
   - Place trained vehicle detection weights into `backend/models/yolov8n.pt`.
   - Place plate localization weights into `backend/models/plate_yolo.pt`.
3. **Configure Camera Streams**:
   - Edit the camera RTSP endpoints in `backend/pipeline.py` or via `POST /api/cameras/config`:
     ```json
     {
       "camera_id": "cam1",
       "rtsp_url": "rtsp://username:password@192.168.1.101:554/stream1"
     }
     ```
4. **Switch Mode**:
   - Send `POST /api/mode` with `{"mode": "LIVE_AI"}`.

---

## 📡 API Endpoints

- `GET /api/status`: System mode, camera status, and architecture health.
- `POST /api/mode`: Switch between `SIMULATION` and `LIVE_AI`.
- `POST /api/simulation/trigger`: Explicitly triggers predefined synthetic demo events (e.g. `entry_car`, `exit_bike`).
- `POST /api/detect`: Executes live OpenCV + YOLO inference on a frame.
- `GET /api/detections`: Historical detection audit log with simulation provenance flags.
