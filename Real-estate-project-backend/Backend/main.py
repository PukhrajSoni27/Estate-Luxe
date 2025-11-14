# Backend/main.py  — copy all

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Union, Optional
from pathlib import Path
import numpy as np
import pandas as pd
import joblib
import os

# ---- Toggle dummy mode here ----
TEST_MODE = os.getenv("TEST_MODE", "0") == "1"   # set TEST_MODE=1 to force dummy

APP_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = APP_DIR.parent
MODEL_PATH = PROJECT_ROOT / "app" / "xgboost_best.pkl"

# Load model once (unless TEST_MODE)
model = None
prep = None
train_columns: Optional[list[str]] = None

if not TEST_MODE:
    try:
        model = joblib.load(MODEL_PATH)
        prep = model.named_steps.get("prep")
        if hasattr(prep, "feature_names_in_"):
            train_columns = list(prep.feature_names_in_)
    except Exception as e:
        raise RuntimeError(f"Failed to load {MODEL_PATH}: {e}")

app = FastAPI(title="House Price Predictor API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RawRow(BaseModel):
    features_by_name: Dict[str, Union[str, float, int]]

FX_INR = 83.0  # USD → INR

@app.get("/")
def root():
    return {"message": "API running", "test_mode": TEST_MODE}

@app.get("/health")
def health():
    return {
        "ok": True,
        "test_mode": TEST_MODE,
        "model_loaded": model is not None,
        "columns_count": len(train_columns) if train_columns else None,
        "model_path": str(MODEL_PATH),
    }

@app.get("/columns")
def columns():
    if TEST_MODE:
        return {"columns": ["(test mode) send any raw fields"]}
    if not train_columns:
        raise HTTPException(500, "Training columns not found")
    return {"columns": train_columns}

@app.post("/predict")
def predict(payload: RawRow):
    # ---- Dummy output for hard proof ----
    if TEST_MODE:
        return {
            "price_usd": 111,
            "price_inr": 222,
            "currency": "INR",
            "source": "DUMMY_TEST ✅"
        }

    # ---- Real prediction ----
    X = pd.DataFrame([payload.features_by_name]).replace(
        {"": np.nan, "NA": np.nan, "NaN": np.nan, None: np.nan}
    )
    if train_columns:
        X = X.reindex(columns=train_columns)

    try:
        pred = model.predict(X)
    except Exception as e:
        raise HTTPException(500, f"Prediction error: {e}")

    usd = float(np.asarray(pred).ravel()[0])
    inr = usd * FX_INR
    return {
        "price_usd": round(usd, 2),
        "price_inr": round(inr, 2),
        "currency": "INR",
        "source": "FASTAPI_BACKEND ✅"
    }

# ---- UNIQUE TEST ENDPOINT (only your server has this) ----
@app.post("/predict_local")
def predict_local(payload: RawRow):
    X = pd.DataFrame([payload.features_by_name])
    X = X.replace({"": np.nan, "NA": np.nan, "NaN": np.nan, "null": np.nan, None: np.nan})
    if train_columns:
        X = X.reindex(columns=train_columns)

    try:
        y = model.predict(X)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model prediction failed: {type(e).__name__}: {e}")

    # make it obviously YOUR server by changing FX_INR for this route
    fx = 91.23
    usd = float(np.asarray(y).ravel()[0])
    inr = usd * fx
    return {
        "price_usd": usd,
        "price_inr": inr,
        "currency": "INR",
        "server": "LOCAL_FASTAPI",
        "endpoint": "/predict_local",
        "fx_used": fx
    }

