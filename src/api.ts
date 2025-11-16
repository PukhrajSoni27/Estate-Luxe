// src/api.ts
import { PropertyDetails } from "@/components/PropertyForm";

// Use environment variable if provided; otherwise default to localhost:8000 so
// development works even if .env wasn't loaded or the dev server wasn't restarted.
export const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"; // e.g. http://127.0.0.1:8000

export type PredictBody = {
  Id: number;
  LotArea: number;
  BedroomAbvGr: number;
  FullBath: number;
  OverallQual: number;
  YearBuilt: number;
  GrLivArea: number;
  TotRmsAbvGrd: number;
  HalfBath: number;
  GarageCars: number;
  GarageArea: number;
  YearRemodAdd: number;
  KitchenAbvGr: number;
  Fireplaces: number;
  MoSold: number;
  YrSold: number;
};

function mapConditionToQuality(condition: string): number {
  switch (condition.toLowerCase()) {
    case "excellent": return 10;
    case "good": return 7;
    case "fair": return 5;
    case "poor": return 3;
    default: return 5;
  }
}

export function transformPropertyDetails(details: PropertyDetails): PredictBody {
  const bedrooms = parseInt(details.bedrooms) || 3;
  const bathrooms = parseFloat(details.bathrooms) || 2;
  const sqft = parseInt(details.squareFootage) || 2000;
  const lotSize = parseInt(details.lotSize) || sqft;
  const yearBuilt = parseInt(details.yearBuilt) || 2000;
  const fullBath = Math.floor(bathrooms);
  const halfBath = bathrooms % 1 >= 0.5 ? 1 : 0;

  return {
    Id: Math.floor(Math.random() * 1000000),
    LotArea: lotSize,
    BedroomAbvGr: bedrooms,
    FullBath: fullBath,
    OverallQual: mapConditionToQuality(details.condition),
    YearBuilt: yearBuilt,
    GrLivArea: sqft,
    TotRmsAbvGrd: bedrooms + fullBath + halfBath + 1, // bedrooms + baths + kitchen
    HalfBath: halfBath,
    GarageCars: 0, // not in form
    GarageArea: 0,
    YearRemodAdd: yearBuilt,
    KitchenAbvGr: 1,
    Fireplaces: 0, // not in form
    MoSold: new Date().getMonth() + 1,
    YrSold: new Date().getFullYear(),
  };
}

// ✅ use /predict (the real model), not /predict_local
export async function predictPrice(body: PredictBody) {
  const url = `${API_BASE.replace(/\/$/, "")}/predict`;
  console.log("[predictPrice] POST ->", url, body);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features_by_name: body }),
    });
  } catch (err: any) {
    // Provide a clearer error message for network failures (e.g. connection refused,
    // mixed-content blocked, or server not running).
    const message = err?.message || String(err) || "Failed to reach backend";
    console.error("[predictPrice] Network error:", message);
    throw new Error(`Failed to reach backend at ${url}: ${message}`);
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "(no body)");
    throw new Error(`API ${res.status}: ${txt}`);
  }
  const data = await res.json();
  console.log("[predictPrice] RESP <-", data);
  return data; // expects { price_usd, price_inr, currency }
}

export async function predictPropertyPrice(details: PropertyDetails) {
  const body = transformPropertyDetails(details);
  return await predictPrice(body);
}
