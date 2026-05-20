"""
main.py
DeepShield FastAPI server.
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import shutil
import os
import uuid
import time

from visual_analyzer import VisualAnalyzer
from audio_analyzer import AudioAnalyzer
from fusion import fuse_results

app = FastAPI(
    title="DeepShield API",
    description="Deepfake detection: visual + audio fusion",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "temp"
os.makedirs(TEMP_DIR, exist_ok=True)

visual = None
audio = None


@app.on_event("startup")
async def startup():

    global visual, audio

    print("\nBooting DeepShield...")

    try:
        visual = VisualAnalyzer(
            r"C:\Users\Lenovo\deepshield\models\best_model.pth"
        )

        audio = AudioAnalyzer(
            r"C:\Users\Lenovo\deepshield\models\best_audio_model.pth"
        )

        print("DeepShield ready!\n")

    except Exception as e:
        print(f"Model loading failed: {e}")


@app.get("/")
def root():
    return {
        "message":"DeepShield API is running",
        "status":"ok"
    }


@app.get("/health")
def health():

    return {
        "status":"healthy",
        "models_loaded":{
            "visual":visual is not None,
            "audio":audio is not None
        }
    }


@app.post("/analyze")
async def analyze_video(
    file: UploadFile = File(...)
):

    if visual is None or audio is None:
        raise HTTPException(
            503,
            "Models not loaded"
        )

    allowed=(
        ".mp4",
        ".mov",
        ".avi",
        ".mkv",
        ".webm"
    )

    if not file.filename.lower().endswith(
        allowed
    ):
        raise HTTPException(
            400,
            f"Unsupported file type {allowed}"
        )

    unique_id = uuid.uuid4().hex[:8]

    temp_path = os.path.join(
        TEMP_DIR,
        f"{unique_id}_{file.filename}"
    )

    with open(temp_path,"wb") as f:
        shutil.copyfileobj(
            file.file,
            f
        )

    try:

        start=time.time()

        visual_result=visual.analyze(
            temp_path
        )

        audio_result=audio.analyze(
            temp_path
        )

        final=fuse_results(
            visual_result,
            audio_result
        )

        final["processing_time_sec"]=round(
            time.time()-start,
            2
        )

        final["filename"]=file.filename

        return JSONResponse(final)

    except Exception as e:

        raise HTTPException(
            500,
            f"Analysis failed:{str(e)}"
        )

    finally:

        if os.path.exists(
            temp_path
        ):
            os.remove(temp_path)