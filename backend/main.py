"""
Backend API untuk aplikasi mobile Deteksi Deepfake Audio.

Model yang dipakai SAMA PERSIS dengan yang ada di app.py (Streamlit) kamu:
YAMNet (ekstraksi embedding) -> StandardScaler -> DNN (Dense+BatchNorm+Dropout).

Jalankan dengan:
    uvicorn main:app --host 0.0.0.0 --port 8000

Lalu dari HP (yang terhubung ke WiFi yang sama dengan laptop), aplikasi mobile
akan memanggil http://<IP-LAPTOP>:8000
"""

import os
import tempfile

import joblib
import numpy as np
import tensorflow as tf
import tensorflow_hub as hub
import librosa
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from tensorflow.keras.layers import BatchNormalization, Dense, Dropout, Input
from tensorflow.keras.models import Sequential
from tensorflow.keras.regularizers import l2

# ----------------------------------------------------------------------------
# CONFIG (identik dengan app.py Streamlit)
# ----------------------------------------------------------------------------
SAMPLE_RATE = 16000
TARGET_DURATION = 5.0
TARGET_SAMPLES = int(SAMPLE_RATE * TARGET_DURATION)
THRESHOLD = 0.5

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEIGHTS_PATH = os.path.join(BASE_DIR, "model.weights.h5")
SCALER_PATH = os.path.join(BASE_DIR, "scaler.pkl")

ALLOWED_EXTENSIONS = {".wav", ".mp3", ".m4a", ".aac", ".caf", ".3gp", ".ogg"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

app = FastAPI(title="Deteksi Deepfake Audio API", version="1.0.0")

# CORS dibuka lebar karena ini API internal untuk aplikasi mobile skripsi,
# bukan aplikasi publik yang diakses banyak website berbeda.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------------------------------------------------------------
# MODEL (lazy-loaded sekali saat startup)
# ----------------------------------------------------------------------------
class ModelBundle:
    yamnet = None
    dnn = None
    scaler = None


bundle = ModelBundle()


def build_dnn_model(input_dim: int = 1024) -> Sequential:
    model = Sequential([
        Input(shape=(input_dim,)),
        Dense(256, activation="relu", kernel_regularizer=l2(0.0005)),
        BatchNormalization(),
        Dropout(0.5),
        Dense(128, activation="relu", kernel_regularizer=l2(0.0005)),
        BatchNormalization(),
        Dropout(0.4),
        Dense(1, activation="sigmoid"),
    ])
    return model


@app.on_event("startup")
def load_models():
    print("Memuat YAMNet dari TF-Hub (butuh koneksi internet saat pertama kali)...")
    bundle.yamnet = hub.load("https://tfhub.dev/google/yamnet/1")

    print("Memuat bobot DNN klasifikasi...")
    bundle.dnn = build_dnn_model()
    bundle.dnn.load_weights(WEIGHTS_PATH)

    print("Memuat scaler...")
    bundle.scaler = joblib.load(SCALER_PATH)

    print("Model siap. Backend dapat menerima request.")


# ----------------------------------------------------------------------------
# AUDIO PROCESSING (identik dengan app.py)
# ----------------------------------------------------------------------------
def load_and_resample(filepath: str) -> np.ndarray:
    y, sr = librosa.load(filepath, sr=SAMPLE_RATE, mono=True)
    if len(y) > TARGET_SAMPLES:
        start = (len(y) - TARGET_SAMPLES) // 2
        y = y[start:start + TARGET_SAMPLES]
    else:
        y = np.pad(y, (0, max(0, TARGET_SAMPLES - len(y))))
    return y.astype(np.float32)


def extract_embedding(audio: np.ndarray) -> np.ndarray:
    audio_tensor = tf.constant(audio, dtype=tf.float32)
    _, embeddings, _ = bundle.yamnet(audio_tensor)
    return tf.reduce_mean(embeddings, axis=0).numpy()


def predict(audio_path: str):
    audio = load_and_resample(audio_path)
    emb = extract_embedding(audio)
    emb = bundle.scaler.transform(emb.reshape(1, -1))
    prob_fake = float(bundle.dnn.predict(emb, verbose=0)[0][0])
    label = "FAKE" if prob_fake >= THRESHOLD else "REAL"
    confidence = prob_fake if label == "FAKE" else (1 - prob_fake)
    return label, confidence, prob_fake, len(audio) / SAMPLE_RATE


# ----------------------------------------------------------------------------
# SCHEMAS
# ----------------------------------------------------------------------------
class PredictResponse(BaseModel):
    label: str            # "REAL" atau "FAKE"
    confidence: float     # 0.0 - 1.0
    prob_fake: float      # 0.0 - 1.0 (probabilitas mentah dari model)
    duration_sec: float


# ----------------------------------------------------------------------------
# ROUTES
# ----------------------------------------------------------------------------
@app.get("/health")
def health():
    ready = bundle.yamnet is not None and bundle.dnn is not None and bundle.scaler is not None
    return {"status": "ok", "model_ready": ready}


@app.post("/predict", response_model=PredictResponse)
async def predict_audio(file: UploadFile = File(...)):
    """
    Menerima file audio (hasil upload ATAU hasil rekaman dari aplikasi mobile)
    dan mengembalikan hasil klasifikasi REAL / FAKE beserta confidence-nya.
    """
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Format {ext or '(tidak diketahui)'} tidak didukung. "
                   f"Gunakan salah satu dari: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    if bundle.dnn is None:
        raise HTTPException(status_code=503, detail="Model belum siap, coba lagi sebentar.")

    tmp_path = None
    try:
        content = await file.read()

        if len(content) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"Ukuran file melebihi batas maksimal "
                       f"{MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB.",
            )

        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        label, confidence, prob_fake, duration = predict(tmp_path)

        return PredictResponse(
            label=label,
            confidence=confidence,
            prob_fake=prob_fake,
            duration_sec=duration,
        )
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Gagal memproses audio: {exc}") from exc
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
