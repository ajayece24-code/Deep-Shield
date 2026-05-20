"""
visual_analyzer.py
Loads the EfficientNet model (Phase 2) and detects fake faces in video frames.
"""

import torch
import torch.nn as nn
import cv2
import numpy as np
from torchvision import models, transforms
from PIL import Image


def build_visual_model():
    """Match Phase 2 training architecture."""
    model = models.efficientnet_b0(weights=None)
    num_features = model.classifier[1].in_features
    # Phase 2 only replaced the final Linear layer (position [1])
    model.classifier[1] = nn.Linear(num_features, 2)
    return model


class VisualAnalyzer:
    def __init__(self, model_path="models/best_model.pth"):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"[Visual] Using device: {self.device}")

        self.model = build_visual_model()
        self.model.load_state_dict(torch.load(model_path, map_location=self.device))
        self.model.to(self.device)
        self.model.eval()

        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406],
                                 [0.229, 0.224, 0.225])
        ])
        print("[Visual] Model loaded")

    def extract_frames(self, video_path, num_frames=10):
        cap = cv2.VideoCapture(video_path)
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if total == 0:
            cap.release()
            return []
        indices = np.linspace(0, total - 1, num_frames, dtype=int)

        frames = []
        for idx in indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ok, frame = cap.read()
            if ok:
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frames.append(Image.fromarray(rgb))
        cap.release()
        return frames

    def analyze(self, video_path):
        frames = self.extract_frames(video_path, num_frames=10)
        if not frames:
            return {"verdict": "ERROR", "confidence": 0.0, "frames_analyzed": 0}

        scores = []
        with torch.no_grad():
            for frame in frames:
                tensor = self.transform(frame).unsqueeze(0).to(self.device)
                output = self.model(tensor)
                probs = torch.softmax(output, dim=1)
                fake_prob = probs[0, 0].item()
                scores.append(fake_prob)

        avg_fake = float(np.mean(scores))
        verdict = "FAKE" if avg_fake > 0.5 else "REAL"
        confidence = avg_fake if verdict == "FAKE" else 1 - avg_fake

        return {
            "verdict": verdict,
            "confidence": round(confidence * 100, 2),
            "fake_score": round(avg_fake * 100, 2),
            "frames_analyzed": len(frames)
        }