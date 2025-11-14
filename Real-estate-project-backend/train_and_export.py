# train_and_export.py
# Trains on Kaggle House Prices, saves full pipeline (preprocess + model)
# to app/xgboost_best.pkl, and writes data/X_preprocessed.csv + data/columns.json

import json
from pathlib import Path
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder
from sklearn.metrics import mean_squared_error
from xgboost import XGBRegressor

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
APP = ROOT / "app"
APP.mkdir(exist_ok=True)

train_csv = DATA / "train.csv"
if not train_csv.exists():
    raise FileNotFoundError(f"Missing {train_csv}. Put Kaggle train.csv in data/")

# 1) Load data
df = pd.read_csv(train_csv)
TARGET = "SalePrice"
if TARGET not in df.columns:
    raise ValueError("train.csv must contain 'SalePrice' (Kaggle House Prices dataset).")

y = df[TARGET]
X = df.drop(columns=[TARGET])

# 2) Split column types
num_cols = X.select_dtypes(include=["number"]).columns.tolist()
cat_cols = X.select_dtypes(exclude=["number"]).columns.tolist()

# 3) Preprocess
num_pipe = Pipeline([("imputer", SimpleImputer(strategy="median"))])
cat_pipe = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
])

preprocess = ColumnTransformer(
    transformers=[
        ("num", num_pipe, num_cols),
        ("cat", cat_pipe, cat_cols),
    ],
    remainder="drop"
)

# 4) Model
model = XGBRegressor(
    n_estimators=700,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    tree_method="hist",
    n_jobs=0
)

pipe = Pipeline([
    ("prep", preprocess),
    ("model", model),
])

# 5) Train/validate
X_tr, X_va, y_tr, y_va = train_test_split(X, y, test_size=0.2, random_state=42)
pipe.fit(X_tr, y_tr)
rmse = np.sqrt(mean_squared_error(y_va, pipe.predict(X_va)))  # no squared kwarg
print(f"✅ Validation RMSE: {rmse:,.2f}")

# 6) Save full pipeline
model_path = APP / "xgboost_best.pkl"
joblib.dump(pipe, model_path)
print(f"💾 Saved model pipeline to {model_path}")

# 7) Derive final feature names (after one-hot)
prep = pipe.named_steps["prep"].fit(X)  # fit on full X to lock categories
num_names = num_cols[:]
oh = prep.named_transformers_["cat"].named_steps["onehot"]
cat_names = oh.get_feature_names_out(cat_cols).tolist()
feature_names = num_names + cat_names
print(f"➡️  Final feature count: {len(feature_names)}")

# 8) Write a single zero-row CSV with correct columns (schema helper for API/tests)
xpp = DATA / "X_preprocessed.csv"
pd.DataFrame([np.zeros(len(feature_names))], columns=feature_names).to_csv(xpp, index=False)
print(f"💾 Wrote schema header to {xpp}")

# 9) Also save columns.json for reference
with open(DATA / "columns.json", "w", encoding="utf-8") as f:
    json.dump(feature_names, f, indent=2)
print("💾 Saved data/columns.json")
