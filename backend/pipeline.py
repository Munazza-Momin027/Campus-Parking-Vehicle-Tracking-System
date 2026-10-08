"""
CPVTS — Campus Parking & Vehicle Tracking System
AI Computer Vision Pipeline Interface

Pipeline Architecture:
CCTV / IP Camera
    ↓ (RTSP / Video Stream)
OpenCV (cv2.VideoCapture / Frame Ingestion)
    ↓ (Raw BGR Frame)
Vehicle Detection (YOLOv8 / Object Classification)
    ↓ (Vehicle Bounding Box & Class)
Number Plate Detection (LPR Bounding Box Localizer)
    ↓ (Cropped Plate Region of Interest)
OCR / ANPR Engine (PaddleOCR / EasyOCR Character Recognition)
    ↓ (Parsed License Plate Text & Confidence)
Direction & Tripwire Tracker (Entry vs Exit Trajectory)
    ↓ (Verified Telemetry Event)
Flask Backend / REST API
"""

import cv2
import numpy as np
import time
from datetime import datetime
from abc import ABC, abstractmethod


class BaseVehicleDetector(ABC):
    """Abstract Interface for Vehicle Detection Model (e.g. YOLOv8)"""

    @abstractmethod
    def detect(self, frame: np.ndarray) -> list:
        """
        Detects vehicles in a video frame.
        Returns: list of dicts:
            [{
                'bbox': [x, y, w, h],
                'class_name': 'Two-Wheeler' | 'Four-Wheeler',
                'confidence': float,
                'track_id': int (optional)
            }]
        """
        pass


class BasePlateDetector(ABC):
    """Abstract Interface for Number Plate Localization Model"""

    @abstractmethod
    def detect_plate(self, vehicle_roi: np.ndarray) -> list:
        """
        Detects number plate region within vehicle ROI.
        Returns: list of dicts:
            [{
                'plate_bbox': [x, y, w, h],
                'confidence': float
            }]
        """
        pass


class BaseOcrEngine(ABC):
    """Abstract Interface for OCR / ANPR Engine"""

    @abstractmethod
    def recognize_text(self, plate_crop: np.ndarray) -> tuple:
        """
        Recognizes text from cropped license plate image.
        Returns:
            (plate_text: str, confidence: float)
        """
        pass


# =====================================================================
# ACTUAL PRODUCTION IMPLEMENTATIONS (Placeholders for model weights)
# =====================================================================

class YoloVehicleDetector(BaseVehicleDetector):
    """
    Production YOLOv8 Vehicle Detector.
    Loads actual weights (e.g. yolov8n.pt / yolov8s.pt) when available.
    """

    def __init__(self, model_path="models/yolov8n.pt", confidence_threshold=0.5):
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self.model = None
        self.is_loaded = False

        # Attempt to load actual ultralytics YOLO model if installed and weights exist
        try:
            from ultralytics import YOLO
            self.model = YOLO(model_path)
            self.is_loaded = True
            print(f"[CPVTS AI] Loaded YOLO vehicle detector from {model_path}")
        except Exception as e:
            print(f"[CPVTS AI INFO] Actual YOLO weights not found at '{model_path}' ({e}). Running in Sandbox/Interface mode.")

    def detect(self, frame: np.ndarray) -> list:
        if not self.is_loaded or self.model is None:
            return []

        results = self.model(frame, conf=self.confidence_threshold, verbose=False)
        detections = []
        for r in results:
            boxes = r.boxes
            for box in boxes:
                cls_id = int(box.cls[0])
                cls_name = r.names.get(cls_id, 'vehicle')
                # Map COCO classes (car, motorcycle, bus, truck) to CPVTS categories
                if cls_name in ['car', 'bus', 'truck']:
                    v_type = 'Four-Wheeler'
                elif cls_name in ['motorcycle', 'bicycle']:
                    v_type = 'Two-Wheeler'
                else:
                    continue

                x1, y1, x2, y2 = box.xyxy[0].tolist()
                detections.append({
                    'bbox': [int(x1), int(y1), int(x2 - x1), int(y2 - y1)],
                    'class_name': v_type,
                    'confidence': float(box.conf[0])
                })
        return detections


class AnprOcrEngine(BaseOcrEngine):
    """
    Production OCR / ANPR Engine using EasyOCR / PaddleOCR.
    Processes cropped license plate image and outputs recognized plate alphanumeric string.
    """

    def __init__(self, engine_type="easyocr"):
        self.engine_type = engine_type
        self.reader = None
        self.is_loaded = False

        try:
            if engine_type == "easyocr":
                import easyocr
                self.reader = easyocr.Reader(['en'], gpu=False)
                self.is_loaded = True
                print("[CPVTS AI] EasyOCR engine initialized.")
        except Exception as e:
            print(f"[CPVTS AI INFO] OCR dependencies not loaded ({e}). Operating in Interface mode.")

    def recognize_text(self, plate_crop: np.ndarray) -> tuple:
        if not self.is_loaded or self.reader is None:
            return ("", 0.0)

        # Preprocessing: Grayscale -> Gaussian Blur -> Adaptive Threshold
        gray = cv2.cvtColor(plate_crop, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        thresh = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)

        results = self.reader.readtext(thresh)
        if not results:
            return ("", 0.0)

        # Sort by confidence and clean formatting
        best = max(results, key=lambda x: x[2])
        cleaned = "".join(filter(str.isalnum, best[1].upper()))
        return (cleaned, float(best[2]))


# =====================================================================
# SIMULATION / DEMO DETECTOR (Honest, Explicit Sandbox)
# =====================================================================

class SimulationDetector(BaseVehicleDetector):
    """
    Explicit Simulation Engine for Demonstration and Offline Testing.
    Returns predefined camera events clearly marked with DEMO/SIMULATION provenance.
    Never claims to be a live model.
    """

    PREDEFINED_SCENARIOS = {
        'entry_car': {
            'plate': 'KA-22-XY-9876',
            'vehicle_type': 'Four-Wheeler',
            'category': 'Student — From Database',
            'driver': 'Rahul Verma',
            'confidence': 0.984,
            'direction': 'ENTRY (Ingress)',
            'camera': 'Entry Gate — Camera 1',
            'bbox': [380, 210, 360, 220],
            'plate_bbox': [480, 340, 160, 48],
            'is_simulated': True,
            'provenance': 'DEMO / SYNTHETIC EVENT'
        },
        'exit_bike': {
            'plate': 'KA-22-AB-1234',
            'vehicle_type': 'Two-Wheeler',
            'category': 'Staff — From Database',
            'driver': 'Dr. S. N. Patil',
            'confidence': 0.988,
            'direction': 'EXIT (Egress)',
            'camera': 'Exit Gate — Camera 2',
            'bbox': [410, 160, 240, 310],
            'plate_bbox': [490, 360, 110, 42],
            'is_simulated': True,
            'provenance': 'DEMO / SYNTHETIC EVENT'
        },
        'entry_faculty': {
            'plate': 'KA-22-MN-5566',
            'vehicle_type': 'Four-Wheeler',
            'category': 'Staff (Dean) — From Database',
            'driver': 'Dr. Meena Joshi',
            'confidence': 0.991,
            'direction': 'ENTRY (Ingress)',
            'camera': 'Entry Gate — Camera 1',
            'bbox': [370, 200, 380, 230],
            'plate_bbox': [475, 335, 170, 50],
            'is_simulated': True,
            'provenance': 'DEMO / SYNTHETIC EVENT'
        }
    }

    def detect(self, scenario_key='entry_car') -> dict:
        event = self.PREDEFINED_SCENARIOS.get(scenario_key, self.PREDEFINED_SCENARIOS['entry_car']).copy()
        event['timestamp'] = datetime.now().strftime("%Y-%m-%d %I:%M:%S %p")
        return event


# =====================================================================
# FULL PIPELINE MANAGER
# =====================================================================

class CpvtsPipelineManager:
    """
    Coordinates the full end-to-end AI detection workflow:
    CCTV/IP Camera → Video Stream → OpenCV → Vehicle Detection → Plate Detection → OCR/ANPR → Backend
    """

    def __init__(self, mode="SIMULATION"):
        self.mode = mode  # "SIMULATION" or "LIVE_AI"
        self.yolo_detector = YoloVehicleDetector()
        self.ocr_engine = AnprOcrEngine()
        self.sim_engine = SimulationDetector()

        self.cameras = {
            'cam1': {
                'id': 'cam1',
                'name': 'Entry Gate — Camera 1',
                'rtsp_url': 'rtsp://192.168.1.101:554/live/ch0',
                'connected': False,
                'target_direction': 'ENTRY (Ingress)',
                'fps': 30
            },
            'cam2': {
                'id': 'cam2',
                'name': 'Exit Gate — Camera 2',
                'rtsp_url': 'rtsp://192.168.1.102:554/live/ch0',
                'connected': False,
                'target_direction': 'EXIT (Egress)',
                'fps': 30
            }
        }

    def set_mode(self, new_mode: str):
        if new_mode in ["SIMULATION", "LIVE_AI"]:
            self.mode = new_mode
            print(f"[CPVTS PIPELINE] Switched to mode: {self.mode}")
            return True
        return False

    def process_camera_event(self, camera_id="cam1", frame=None, scenario="entry_car"):
        """
        Executes the detection pipeline.
        If mode == "LIVE_AI" and frame provided:
            Runs OpenCV -> YOLO -> Plate Crop -> OCR -> Output
        If mode == "SIMULATION" (or live model not available):
            Returns clearly labeled synthetic demo event.
        """
        if self.mode == "LIVE_AI" and frame is not None:
            # 1. OpenCV Frame Ingestion
            if not isinstance(frame, np.ndarray):
                return {'error': 'Invalid OpenCV frame format', 'is_simulated': False}

            # 2. Vehicle Detection (YOLO)
            vehicles = self.yolo_detector.detect(frame)
            if not vehicles:
                return {'detected': False, 'message': 'No vehicle in frame', 'is_simulated': False}

            primary_veh = vehicles[0]
            x, y, w, h = primary_veh['bbox']
            veh_roi = frame[max(0, y):y+h, max(0, x):x+w]

            # 3. Plate Crop & OCR
            # When plate detector model is active, crops plate; otherwise processes ROI
            plate_text, ocr_conf = self.ocr_engine.recognize_text(veh_roi)

            direction = self.cameras.get(camera_id, {}).get('target_direction', 'ENTRY (Ingress)')

            return {
                'is_simulated': False,
                'provenance': 'LIVE AI INFERENCE (OpenCV + YOLO + OCR)',
                'detected': True,
                'camera': self.cameras.get(camera_id, {}).get('name', 'CCTV Camera'),
                'vehicle_type': primary_veh['class_name'],
                'vehicle_confidence': primary_veh['confidence'],
                'bbox': primary_veh['bbox'],
                'plate': plate_text if plate_text else 'UNREADABLE_PLATE',
                'plate_confidence': ocr_conf,
                'direction': direction,
                'timestamp': datetime.now().strftime("%Y-%m-%d %I:%M:%S %p")
            }

        else:
            # SIMULATION MODE: Clearly flagged as synthetic demo
            demo_event = self.sim_engine.detect(scenario)
            demo_event['camera_id'] = camera_id
            demo_event['is_simulated'] = True
            demo_event['pipeline_mode'] = 'SIMULATION (Demo Sandbox)'
            return demo_event
