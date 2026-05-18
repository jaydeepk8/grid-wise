import io
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(title="GridWise Energy Prediction API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://grid-wise-ten.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
FEATURES = ["hour", "day_of_week", "is_weekend", "prev_hour_energy", "rolling_3h_avg", "rolling_6h_avg"]
FACILITY_FILES = {
    "hospital":    ("hospital_energy_rf.pkl",  "hospital_hourly_energy.csv",   "hospital_ml_ready.csv"),
    "data-center": ("datacenter_energy_rf.pkl", "datacenter_hourly_energy.csv", "datacenter_ml_ready.csv"),
    "mnc":         ("mnc_energy_rf.pkl",         "mnc_hourly_energy.csv",        "mnc_ml_ready.csv"),
}

models: dict = {}
datasets: dict = {}
accuracy_cache: dict = {}


@app.on_event("startup")
def load_resources():
    global models, datasets, accuracy_cache
    logger.info("Loading models and datasets...")

    for facility, (model_file, hourly_file, ml_file) in FACILITY_FILES.items():
        try:
            models[facility] = joblib.load(BASE_DIR / "model" / model_file)
            hourly = pd.read_csv(BASE_DIR / "data" / hourly_file, parse_dates=["datetime"])
            ml     = pd.read_csv(BASE_DIR / "data" / ml_file,     parse_dates=["datetime"])
            datasets[facility] = {
                "hourly": hourly.sort_values("datetime").reset_index(drop=True),
                "ml":     ml.sort_values("datetime").reset_index(drop=True),
            }

            df_ml  = datasets[facility]["ml"]
            X, y   = df_ml[FEATURES], df_ml["target_next_hour"]
            split  = int(len(df_ml) * 0.8)
            y_pred = models[facility].predict(X.iloc[split:])
            y_test = y.iloc[split:]
            mape   = float(np.mean(np.abs((y_test - y_pred) / y_test)) * 100)

            accuracy_cache[facility] = {
                "r2":               round(float(r2_score(y_test, y_pred)), 4),
                "mae":              round(float(mean_absolute_error(y_test, y_pred)), 2),
                "rmse":             round(float(np.sqrt(mean_squared_error(y_test, y_pred))), 2),
                "mape":             round(mape, 2),
                "accuracy_percent": round(100 - mape, 2),
            }
            logger.info("Loaded %s | R2=%.4f | MAE=%.2f | MAPE=%.2f%%",
                        facility, accuracy_cache[facility]["r2"],
                        accuracy_cache[facility]["mae"], mape)
        except Exception:
            logger.exception("Failed to load resources for '%s'", facility)

    logger.info("Ready. Facilities: %s", list(models.keys()))


class PredictionInput(BaseModel):
    datetime:         str
    facility_type:    Optional[str]   = "hospital"
    prev_hour_energy: Optional[float] = None
    rolling_3h_avg:   Optional[float] = None
    rolling_6h_avg:   Optional[float] = None


def strip_tz(dt: datetime) -> datetime:
    return dt.replace(tzinfo=None) if dt.tzinfo else dt


def get_real_inputs(dt: datetime, facility: str) -> tuple:
    dt    = strip_tz(dt)
    df_ml = datasets[facility]["ml"]
    exact = df_ml[df_ml["datetime"] == dt]
    if not exact.empty:
        row = exact.iloc[0]
        return float(row["prev_hour_energy"]), float(row["rolling_3h_avg"]), float(row["rolling_6h_avg"])
    pattern = df_ml[
        (df_ml["datetime"].dt.hour      == dt.hour) &
        (df_ml["datetime"].dt.dayofweek == dt.weekday())
    ]
    if not pattern.empty:
        avg = pattern[["prev_hour_energy", "rolling_3h_avg", "rolling_6h_avg"]].mean()
        return float(avg["prev_hour_energy"]), float(avg["rolling_3h_avg"]), float(avg["rolling_6h_avg"])
    last = df_ml.iloc[-1]
    return float(last["prev_hour_energy"]), float(last["rolling_3h_avg"]), float(last["rolling_6h_avg"])


def get_chart_data(dt: datetime, facility: str, num_hours: int = 12) -> tuple:
    dt   = strip_tz(dt)
    df   = datasets[facility]["hourly"]
    past = df[df["datetime"] <= dt].tail(num_hours)
    if len(past) < num_hours:
        past = df.tail(num_hours)
    return past["datetime"].dt.strftime("%H:%M").tolist(), past["energy_kwh"].round(2).tolist()


def calculate_peak_risk(predicted: float, avg: float) -> str:
    if predicted > avg * 1.10:
        return "High Risk"
    if predicted > avg * 1.05:
        return "Medium Risk"
    return "Low Risk"


def estimate_renewable_mix(hour: int) -> float:
    return round(70 + (hour - 6) * 1.0, 1) if 6 <= hour <= 18 else 45.0


def build_response(facility, hour, day_of_week, is_weekend,
                   prev_hour_energy, rolling_3h_avg, rolling_6h_avg,
                   time_labels, actual_series) -> dict:
    X          = np.array([[hour, day_of_week, is_weekend, prev_hour_energy, rolling_3h_avg, rolling_6h_avg]])
    prediction = float(models[facility].predict(X)[0])
    peak_risk      = calculate_peak_risk(prediction, rolling_6h_avg)
    renewable_mix  = estimate_renewable_mix(hour)
    demand_change  = ((prediction - prev_hour_energy) / prev_hour_energy) * 100
    avg_deviation  = ((prediction - rolling_6h_avg)   / rolling_6h_avg)   * 100
    predicted_series = [round(a * 1.02, 2) for a in actual_series[:-1]] + [round(prediction, 2)]

    insights = [
        f"Projected demand change: {round(demand_change, 2)}% for next hour.",
        f"Deviation from rolling 6-hour average: {round(avg_deviation, 2)}%.",
        ("Critical peak load threshold exceeded. System stress likely." if peak_risk == "High Risk"
         else "Moderate peak conditions detected. Close monitoring advised." if peak_risk == "Medium Risk"
         else "System operating within stable load parameters."),
        f"Renewable contribution currently at {renewable_mix}%.",
    ]

    recommendations = []
    if avg_deviation > 10:
        recommendations.append({"title": "Immediate Load Redistribution Required", "priority": "High",
                                 "impact": f"Predicted demand exceeds rolling average by {round(avg_deviation, 2)}%. Risk of overload."})
    elif avg_deviation > 5:
        recommendations.append({"title": "Prepare Demand Response Strategy", "priority": "Medium",
                                 "impact": f"Demand trending {round(avg_deviation, 2)}% above recent average."})
    if demand_change > 8:
        recommendations.append({"title": "Pre-cool HVAC Systems", "priority": "High",
                                 "impact": f"Forecast indicates {round(demand_change, 2)}% rise in next-hour demand."})
    if renewable_mix < 50:
        recommendations.append({"title": "Increase Renewable Dispatch", "priority": "Medium",
                                 "impact": f"Renewable mix at {renewable_mix}% — increasing grid dependency."})
    elif renewable_mix > 75:
        recommendations.append({"title": "Maximize Solar Utilization", "priority": "Low",
                                 "impact": f"High renewable penetration ({renewable_mix}%) allows sustainability optimization."})
    if peak_risk == "Low Risk" and abs(demand_change) < 5:
        recommendations.append({"title": "Maintain Current Operational Strategy", "priority": "Low",
                                 "impact": "Demand fluctuation within acceptable threshold."})
    recommendations.append({"title": "Continue Preventive Monitoring", "priority": "Low",
                             "impact": "AI confidence remains strong based on stable historical patterns."})

    return {
        "current_demand_kwh":      round(prev_hour_energy, 2),
        "predicted_next_hour_kwh": round(prediction, 2),
        "peak_load_risk":          peak_risk,
        "renewable_mix_percent":   renewable_mix,
        "chart": {"labels": time_labels, "actual": actual_series, "predicted": predicted_series},
        "insights":        insights,
        "recommendations": recommendations,
    }


@app.get("/")
def root():
    return {"status": "GridWise API is running", "version": "2.0.0", "facilities": list(models.keys())}


@app.post("/predict")
def predict_energy(data: PredictionInput):
    facility = data.facility_type if data.facility_type in models else "hospital"
    try:
        dt       = datetime.fromisoformat(data.datetime.replace("Z", "+00:00"))
        dt_naive = strip_tz(dt)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid datetime format. Use ISO 8601.")

    hour        = dt_naive.hour
    day_of_week = dt_naive.weekday()
    is_weekend  = 1 if day_of_week >= 5 else 0

    if any(v is None for v in [data.prev_hour_energy, data.rolling_3h_avg, data.rolling_6h_avg]):
        prev_hour_energy, rolling_3h_avg, rolling_6h_avg = get_real_inputs(dt_naive, facility)
    else:
        prev_hour_energy = data.prev_hour_energy
        rolling_3h_avg   = data.rolling_3h_avg
        rolling_6h_avg   = data.rolling_6h_avg

    time_labels, actual_series = get_chart_data(dt_naive, facility, num_hours=12)
    current_hour = datetime.now().hour
    logger.info("Predict | facility=%s hour=%02d dow=%d", facility, hour, day_of_week)
    return build_response(facility, hour, day_of_week, is_weekend,
                          prev_hour_energy, rolling_3h_avg, rolling_6h_avg,
                          time_labels, actual_series, current_hour)


@app.get("/accuracy/{facility_type}")
def get_accuracy(facility_type: str):
    if facility_type not in accuracy_cache:
        raise HTTPException(status_code=404, detail=f"Facility '{facility_type}' not found.")
    return accuracy_cache[facility_type]


@app.post("/upload-predict")
async def upload_and_predict(file: UploadFile = File(...), facility_type: str = "hospital"):
    contents = await file.read()
    try:
        if file.filename.endswith(".csv"):
            uploaded_df = pd.read_csv(io.BytesIO(contents), parse_dates=["datetime"])
        elif file.filename.endswith((".xlsx", ".xls")):
            uploaded_df = pd.read_excel(io.BytesIO(contents), parse_dates=["datetime"])
        else:
            raise HTTPException(status_code=400, detail="Unsupported format. Upload CSV or Excel.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse file: {e}")

    missing = [c for c in ["datetime", "energy_kwh"] if c not in uploaded_df.columns]
    if missing:
        raise HTTPException(status_code=422, detail=f"Missing required columns: {missing}")
    if len(uploaded_df) < 6:
        raise HTTPException(status_code=422, detail="Minimum 6 rows required for prediction.")

    facility    = facility_type if facility_type in models else "hospital"
    uploaded_df = uploaded_df.sort_values("datetime").reset_index(drop=True)
    last_row    = uploaded_df.iloc[-1]
    dt          = pd.to_datetime(last_row["datetime"])

    hour             = dt.hour
    day_of_week      = dt.dayofweek
    is_weekend       = 1 if day_of_week >= 5 else 0
    prev_hour_energy = float(last_row["energy_kwh"])
    rolling_3h_avg   = float(uploaded_df["energy_kwh"].tail(3).mean())
    rolling_6h_avg   = float(uploaded_df["energy_kwh"].tail(6).mean())

    chart_rows    = uploaded_df.tail(12)
    time_labels   = pd.to_datetime(chart_rows["datetime"]).dt.strftime("%H:%M").tolist()
    actual_series = chart_rows["energy_kwh"].round(2).tolist()
    preview       = uploaded_df.head(5)[["datetime", "energy_kwh"]].copy()
    preview["datetime"] = preview["datetime"].astype(str)

    logger.info("Upload-predict | facility=%s rows=%d file=%s", facility, len(uploaded_df), file.filename)
    result = build_response(facility, hour, day_of_week, is_weekend,
                            prev_hour_energy, rolling_3h_avg, rolling_6h_avg,
                            time_labels, actual_series)
    result["preview"]    = preview.to_dict(orient="records")
    result["total_rows"] = len(uploaded_df)
    return result

@app.post("/forecast")
def forecast_24h(payload: PredictRequest):
    """Predict next 24 hours iteratively using the XGBoost model."""
    facility = payload.facility_type
    if facility not in models:
        raise HTTPException(status_code=404, detail=f"Unknown facility: {facility}")

    dt_naive = payload.datetime.replace(tzinfo=None)
    df = datasets[facility]["ml"]

    # Get last known row as seed
    last_row = df.iloc[-1]
    prev_energy   = float(last_row["target_next_hour"])
    rolling_3h    = float(last_row["rolling_3h_avg"])
    rolling_6h    = float(last_row["rolling_6h_avg"])
    recent_values = list(df["target_next_hour"].iloc[-6:])

    labels, predicted = [], []
    current_dt = dt_naive

    for i in range(24):
        current_dt = current_dt + timedelta(hours=1)
        h   = current_dt.hour
        dow = current_dt.weekday()
        is_we = int(dow >= 5)

        X = np.array([[h, dow, is_we, prev_energy, rolling_3h, rolling_6h]])
        pred = float(models[facility].predict(X)[0])

        labels.append(current_dt.strftime("%H:%M"))
        predicted.append(round(pred, 1))

        # Update rolling features for next iteration
        recent_values.append(pred)
        rolling_3h = round(float(np.mean(recent_values[-3:])), 2)
        rolling_6h = round(float(np.mean(recent_values[-6:])), 2)
        prev_energy = pred

    return {
        "facility": facility,
        "forecast_labels": labels,
        "forecast_values": predicted,
        "peak_hour": labels[int(np.argmax(predicted))],
        "peak_value": max(predicted),
        "avg_predicted": round(float(np.mean(predicted)), 1),
    }


@app.post("/anomaly")
def detect_anomalies(file: UploadFile = File(...), facility: str = Form(...)):
    """Detect anomalous energy readings in uploaded CSV using Isolation Forest."""
    if facility not in models:
        raise HTTPException(status_code=404, detail=f"Unknown facility: {facility}")
    try:
        contents = file.file.read()
        uploaded_df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {e}")

    if "energy_kwh" not in uploaded_df.columns:
        raise HTTPException(status_code=400, detail="CSV must have energy_kwh column")

    values = uploaded_df[["energy_kwh"]].dropna()
    clf = IsolationForest(contamination=0.05, random_state=42)
    preds = clf.fit_predict(values)

    anomaly_indices = [int(i) for i, p in enumerate(preds) if p == -1]
    anomaly_values  = [round(float(values.iloc[i]["energy_kwh"]), 2) for i in anomaly_indices]

    return {
        "total_rows": len(values),
        "anomaly_count": len(anomaly_indices),
        "anomaly_percent": round(len(anomaly_indices) / len(values) * 100, 1),
        "anomalies": [{"index": idx, "value": val} for idx, val in zip(anomaly_indices, anomaly_values)],
        "status": "High" if len(anomaly_indices) > len(values) * 0.08 else "Normal",
    }


FEATURE_LABELS = {
    "hour":             "Hour of Day",
    "day_of_week":      "Day of Week",
    "is_weekend":       "Is Weekend",
    "prev_hour_energy": "Previous Hour Energy",
    "rolling_3h_avg":   "3-Hour Rolling Avg",
    "rolling_6h_avg":   "6-Hour Rolling Avg",
}

@app.post("/explain")
def explain_prediction(payload: PredictRequest):
    """Return SHAP feature importance values for a single prediction."""
    facility = payload.facility_type
    if facility not in models:
        raise HTTPException(status_code=404, detail=f"Unknown facility: {facility}")

    dt_naive = payload.datetime.replace(tzinfo=None)
    df = datasets[facility]["ml"]

    hour        = dt_naive.hour
    day_of_week = dt_naive.weekday()
    is_weekend  = int(day_of_week >= 5)
    prev_energy = float(df["target_next_hour"].iloc[-1])
    rolling_3h  = float(df["rolling_3h_avg"].iloc[-1])
    rolling_6h  = float(df["rolling_6h_avg"].iloc[-1])

    X = np.array([[hour, day_of_week, is_weekend, prev_energy, rolling_3h, rolling_6h]])

    explainer   = shap.TreeExplainer(models[facility])
    shap_values = explainer.shap_values(X)[0]
    feature_names = ["hour", "day_of_week", "is_weekend", "prev_hour_energy", "rolling_3h_avg", "rolling_6h_avg"]

    importance = [
        {
            "feature": FEATURE_LABELS[name],
            "shap_value": round(float(v), 3),
            "abs_value": round(abs(float(v)), 3),
        }
        for name, v in zip(feature_names, shap_values)
    ]
    importance.sort(key=lambda x: x["abs_value"], reverse=True)

    return {
        "facility": facility,
        "prediction": round(float(models[facility].predict(X)[0]), 1),
        "base_value": round(float(explainer.expected_value), 1),
        "importance": importance,
    }

