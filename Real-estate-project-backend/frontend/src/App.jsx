import { useState } from "react";
import "./App.css";

const API_BASE = "http://127.0.0.1:8000";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function App() {
  const [form, setForm] = useState({
    OverallQual: 7,
    YearBuilt: 2003,
    GrLivArea: 1710,
    GarageCars: 2,
    FullBath: 2,
    TotalBsmtSF: 856,
  });

  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState(null);
  const [err, setErr] = useState("");

  const onChange = (k) => (e) =>
    setForm((s) => ({ ...s, [k]: e.target.value }));

  async function predict() {
    setErr("");
    setPrice(null);
    setLoading(true);
    try {
      const payload = {
        features_by_name: Object.fromEntries(
          Object.entries(form).map(([k, v]) => [k, Number(v)])
        ),
      };
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Prediction failed");
      // backend returns USD — convert to INR quickly (or remove if your API already returns INR)
      const USD_TO_INR = 85;
      const predictedINR = Math.round(Number(data.prediction || 0) * USD_TO_INR);
      setPrice(predictedINR);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="header">
        <div className="logo">🏠</div>
        <div>
          <div className="title">House Price Predictor</div>
          <div className="subtitle">
            Enter key features to estimate the property price instantly.
          </div>
        </div>
      </div>

      <div className="card">
        <div className="grid">
          <div>
            <label className="label">OverallQual</label>
            <input className="input" type="number" value={form.OverallQual} onChange={onChange("OverallQual")} />
          </div>
          <div>
            <label className="label">YearBuilt</label>
            <input className="input" type="number" value={form.YearBuilt} onChange={onChange("YearBuilt")} />
          </div>
          <div>
            <label className="label">GrLivArea (sq ft)</label>
            <input className="input" type="number" value={form.GrLivArea} onChange={onChange("GrLivArea")} />
          </div>
          <div>
            <label className="label">GarageCars</label>
            <input className="input" type="number" value={form.GarageCars} onChange={onChange("GarageCars")} />
          </div>
          <div>
            <label className="label">FullBath</label>
            <input className="input" type="number" value={form.FullBath} onChange={onChange("FullBath")} />
          </div>
          <div>
            <label className="label">TotalBsmtSF (sq ft)</label>
            <input className="input" type="number" value={form.TotalBsmtSF} onChange={onChange("TotalBsmtSF")} />
          </div>
        </div>

        <div className="actions">
          <button className="button" onClick={predict} disabled={loading}>
            {loading ? "Predicting…" : "Predict Price"}
          </button>
        </div>

        {err && (
          <div className="result" style={{ borderColor: "#ff7b7b" }}>
            <div className="result-title">Error</div>
            <div>{err}</div>
          </div>
        )}

        {price !== null && !err && (
          <div className="result">
            <div className="result-title">Predicted Price</div>
            <div className="price">
              <span className="spark" /> {inr.format(price)}
            </div>
            <div className="footer">
              * Quick INR conversion shown for demo purpose.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
