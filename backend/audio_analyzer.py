"""
audio_analyzer.py
Loads Wav2Vec2 (Phase 3) and detects fake voices.
Uses soundfile instead of torchaudio.load to avoid torchcodec dependency.
"""

import torch
import torch.nn as nn
import numpy as np
import soundfile as sf
import librosa
from transformers import Wav2Vec2Model
import os
import subprocess


class AudioDeepfakeDetector(nn.Module):
    """Same architecture as Phase 3 training."""
    def __init__(self):
        super().__init__()
        self.wav2vec = Wav2Vec2Model.from_pretrained("facebook/wav2vec2-base")
        self.classifier = nn.Sequential(
            nn.Linear(768, 256), nn.ReLU(), nn.Dropout(0.3),
            nn.Linear(256, 64),  nn.ReLU(), nn.Dropout(0.2),
            nn.Linear(64, 2)
        )

    def forward(self, audio):
        outputs = self.wav2vec(audio)
        features = outputs.last_hidden_state.mean(dim=1)
        return self.classifier(features)


class AudioAnalyzer:
    def __init__(self, model_path="models/best_audio_model.pth"):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"[Audio] Using device: {self.device}")

        self.model = AudioDeepfakeDetector()
        self.model.load_state_dict(torch.load(model_path, map_location=self.device))
        self.model.to(self.device)
        self.model.eval()
        print("[Audio] Model loaded")

    def extract_audio_from_video(self, video_path, out_path="temp/extracted.wav"):
        """Use ffmpeg (bundled via imageio-ffmpeg) to extract audio from the video."""
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        try:
            import imageio_ffmpeg
            ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
            cmd = [
                ffmpeg_exe, "-y", "-i", video_path,
                "-vn", "-ac", "1", "-ar", "16000",
                "-f", "wav", out_path
            ]
            subprocess.run(cmd, capture_output=True, check=True)
            return out_path if os.path.exists(out_path) else None
        except Exception as e:
            print(f"[Audio] Extraction failed: {e}")
            return None

    def load_audio(self, path):
        """Load audio with soundfile — no torchcodec needed."""
        audio_np, sr = sf.read(path)

        # Stereo → mono
        if audio_np.ndim > 1:
            audio_np = audio_np.mean(axis=1)

        # Resample to 16000 Hz if needed
        if sr != 16000:
            audio_np = librosa.resample(
                audio_np.astype(np.float32),
                orig_sr=sr,
                target_sr=16000
            )
            sr = 16000

        # Convert to torch tensor with shape [1, samples]
        waveform = torch.from_numpy(audio_np.astype(np.float32)).unsqueeze(0)
        return waveform, sr

    def analyze(self, video_path):
        audio_path = self.extract_audio_from_video(video_path)
        if audio_path is None:
            return {"verdict": "NO_AUDIO", "confidence": 0.0, "fake_score": 0.0}

        # Load using soundfile (avoids torchcodec)
        waveform, sr = self.load_audio(audio_path)

        # Trim/pad to exactly 4 seconds (64000 samples at 16kHz)
        target_len = 64000
        if waveform.shape[1] > target_len:
            waveform = waveform[:, :target_len]
        else:
            pad = target_len - waveform.shape[1]
            waveform = torch.nn.functional.pad(waveform, (0, pad))

        tensor = waveform.squeeze(0).unsqueeze(0).to(self.device)

        with torch.no_grad():
            output = self.model(tensor)
            probs = torch.softmax(output, dim=1)
            fake_prob = probs[0, 0].item()

        verdict = "FAKE" if fake_prob > 0.5 else "REAL"
        confidence = fake_prob if verdict == "FAKE" else 1 - fake_prob

        # Cleanup
        try: os.remove(audio_path)
        except: pass

        return {
            "verdict": verdict,
            "confidence": round(confidence * 100, 2),
            "fake_score": round(fake_prob * 100, 2)
        }