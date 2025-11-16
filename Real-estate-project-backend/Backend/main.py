# Backend/main.py  — copy all

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Dict, Union, Optional
from pathlib import Path
import numpy as np
import pandas as pd
import joblib
import os
import sqlite3
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt, JWTError
import io
from fastapi.responses import StreamingResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

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

# ---- Authentication Setup ----
SECRET_KEY = "your-secret-key-here"  # Change this in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
security = HTTPBearer()

DATABASE_PATH = APP_DIR / "users.db"

def get_db():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            avatar TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()

    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return dict(user)

# ---- Pydantic Models ----
class UserSignup(BaseModel):
    email: str
    name: str
    password: str
    avatar: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str


class ReportRequest(BaseModel):
    title: Optional[str] = "Property Valuation Report"
    valuation: Optional[Dict[str, Union[str, float, int]]] = None
    features: Optional[Dict[str, Union[str, float, int]]] = None
    notes: Optional[str] = None

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

# ---- Authentication Endpoints ----
@app.post("/auth/signup", response_model=Token)
def signup(user: UserSignup):
    conn = get_db()
    try:
        # Check if user already exists
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (user.email,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Hash password and insert user
        hashed_password = get_password_hash(user.password)
        conn.execute(
            "INSERT INTO users (email, name, password_hash, avatar) VALUES (?, ?, ?, ?)",
            (user.email, user.name, hashed_password, user.avatar)
        )
        conn.commit()

        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Signup failed: {str(e)}")
    finally:
        conn.close()

@app.post("/auth/login", response_model=Token)
def login(user: UserLogin):
    conn = get_db()
    db_user = conn.execute("SELECT * FROM users WHERE email = ?", (user.email,)).fetchone()
    conn.close()

    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "name": current_user["name"],
        "avatar": current_user["avatar"],
        "created_at": current_user["created_at"]
    }

@app.post("/auth/logout")
def logout():
    # In a stateless JWT system, logout is handled client-side by removing the token
    return {"message": "Logged out successfully"}


@app.post("/report")
def generate_report(payload: ReportRequest):
    """Generate a simple PDF valuation report.

    The endpoint accepts a small JSON payload with `valuation`, `features`, and `notes`.
    It returns an `application/pdf` attachment.
    """
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    width, height = letter

    # Header
    c.setFont("Helvetica-Bold", 18)
    c.drawString(72, height - 72, payload.title or "Property Valuation Report")
    c.setFont("Helvetica", 10)
    c.drawString(72, height - 92, f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")

    y = height - 120

    # Valuation block
    if payload.valuation:
        c.setFont("Helvetica-Bold", 12)
        c.drawString(72, y, "Valuation:")
        y -= 18
        c.setFont("Helvetica", 10)
        for k, v in payload.valuation.items():
            line = f"{k}: {v}"
            c.drawString(80, y, line)
            y -= 14
            if y < 80:
                c.showPage()
                y = height - 72

    # Features / property details
    if payload.features:
        y -= 6
        c.setFont("Helvetica-Bold", 12)
        c.drawString(72, y, "Property Details:")
        y -= 18
        c.setFont("Helvetica", 10)
        for idx, (k, v) in enumerate(payload.features.items()):
            if idx and y < 80:
                c.showPage()
                y = height - 72
            line = f"{k}: {v}"
            c.drawString(80, y, line)
            y -= 12

    # Notes
    if payload.notes:
        y -= 12
        if y < 120:
            c.showPage()
            y = height - 72
        c.setFont("Helvetica-Bold", 12)
        c.drawString(72, y, "Notes:")
        y -= 16
        c.setFont("Helvetica", 10)
        text = c.beginText(80, y)
        for ln in str(payload.notes).splitlines():
            text.textLine(ln)
        c.drawText(text)

    c.showPage()
    c.save()
    buf.seek(0)

    headers = {"Content-Disposition": "attachment; filename=estate-luxe-valuation-report.pdf"}
    return StreamingResponse(buf, media_type="application/pdf", headers=headers)

