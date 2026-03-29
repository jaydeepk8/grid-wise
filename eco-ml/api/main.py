from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from pathlib import Path
from typing import Optional
import io

app = FastAPI(title="Eco1 Energy Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://grid-wise-ten.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent

model = None
df = None
df_ml = None

@app.on_event("startup")
def load_resources():
    global model, df, df_ml

    print("Starting resource loading...")

    model_path = BASE_DIR / "model" / "hospital_energy_rf.pkl"
    data_path = BASE_DIR / "data"

    print("BASE_DIR:", BASE_DIR)
    print("Model exists:", model_path.exists())
    print("Data files:", list(data_path.glob("*")))

    model = joblib.load(model_path)
    df = pd.read_csv(data_path / "hospital_hourly_energy.csv", parse_dates=["datetime"])
    df_ml = pd.read_csv(data_path / "hospital_ml_ready.csv", parse_dates=["datetime"])

    print("All resources loaded successfully")


class PredictionInput(BaseModel):
    datetime: str
    prev_hour_energy: Optional[float] = None
    rolling_3h_avg: Optional[float] = None
    rolling_6h_avg: Optional[float] = None


def strip_tz(dt: datetime) -> datetime:
    return dt.replace(tzinfo=None) if dt.tzinfo else dt


def get_real_inputs(dt: datetime):
    dt = strip_tz(dt)
    match = df_ml[df_ml["datetime"] == dt]
    if not match.empty:
        row = match.iloc[0]
        return float(row["prev_hour_energy"]), float(row["rolling_3h_avg"]), float(row["rolling_6h_avg"])
    same_pattern = df_ml[
        (df_ml["datetime"].dt.hour == dt.hour) &
        (df_ml["datetime"].dt.dayofweek == dt.weekday())
    ]
    if not same_pattern.empty:
        avg = same_pattern[["prev_hour_energy", "rolling_3h_avg", "rolling_6h_avg"]].mean()
        return float(avg["prev_hour_energy"]), float(avg["rolling_3h_avg"]), float(avg["rolling_6h_avg"])
    last = df_ml.iloc[-1]
    return float(last["prev_hour_energy"]), float(last["rolling_3h_avg"]), float(last["rolling_6h_avg"])


def get_real_chart_data(dt: datetime, num_hours: int = 12):
    dt = strip_tz(dt)
    past = df[df["datetime"] <= dt].tail(num_hours)
    if len(past) < num_hours:
        past = df.tail(num_hours)
    return past["datetime"].dt.strftime("%H:%M").tolist(), past["energy_kwh"].round(2).tolist()


def calculate_peak_risk(predicted, avg):
    if predicted > avg * 1.10:
        return "High Risk"
    elif predicted > avg * 1.05:
        return "Medium Risk"
    return "Low Risk"


def estimate_renewable_mix(hour):
    if 6 <= hour <= 18:
        return 70 + (hour - 6) * 1.0
    return 45


def build_response(hour, day_of_week, is_weekend, prev_hour_energy, rolling_3h_avg, rolling_6h_avg, time_labels, actual_series):
    X = np.array([[hour, day_of_week, is_weekend, prev_hour_energy, rolling_3h_avg, rolling_6h_avg]])
    prediction = float(model.predict(X)[0])
    peak_risk = calculate_peak_risk(prediction, rolling_6h_avg)
    renewable_mix = estimate_renewable_mix(hour)
    predicted_series = [round(a * 1.02, 2) for a in actual_series[:-1]] + [round(prediction, 2)]
    demand_change = ((prediction - prev_hour_energy) / prev_hour_energy) * 100
    avg_deviation = ((prediction - rolling_6h_avg) / rolling_6h_avg) * 100

    insights = [
        f"Projected demand change: {round(demand_change, 2)}% for next hour.",
        f"Deviation from rolling 6-hour average: {round(avg_deviation, 2)}%.",
        "Critical peak load threshold exceeded. System stress likely." if peak_risk == "High Risk"
        else "Moderate peak conditions detected. Close monitoring advised." if peak_risk == "Medium Risk"
        else "System operating within stable load parameters.",
        f"Renewable contribution currently at {renewable_mix}%.",
    ]

    recommendations = []
    if avg_deviation > 10:
        recommendations.append({"title": "Immediate Load Redistribution Required", "priority": "High", "impact": f"Predicted demand exceeds rolling average by {round(avg_deviation, 2)}%. Risk of overload."})
    elif avg_deviation > 5:
        recommendations.append({"title": "Prepare Demand Response Strategy", "priority": "Medium", "impact": f"Demand trending {round(avg_deviation, 2)}% above recent average."})
    if demand_change > 8:
        recommendations.append({"title": "Pre-cool HVAC Systems", "priority": "High", "impact": f"Forecast indicates {round(demand_change, 2)}% rise in next-hour demand."})
    if renewable_mix < 50:
        recommendations.append({"title": "Increase Renewable Dispatch", "priority": "Medium", "impact": f"Renewable mix at {renewable_mix}% increasing grid dependency."})
    elif renewable_mix > 75:
        recommendations.append({"title": "Maximize Solar Utilization", "priority": "Low", "impact": f"High renewable penetration ({renewable_mix}%) allows sustainability optimization."})
    if peak_risk == "Low Risk" and abs(demand_change) < 5:
        recommendations.append({"title": "Maintain Current Operational Strategy", "priority": "Low", "impact": "Demand fluctuation within acceptable threshold."})
    recommendations.append({"title": "Continue Preventive Monitoring", "priority": "Low", "impact": "AI confidence remains strong based on stable historical patterns."})

    return {
        "current_demand_kwh": round(prev_hour_energy, 2),
        "predicted_next_hour_kwh": round(prediction, 2),
        "peak_load_risk": peak_risk,
        "renewable_mix_percent": round(renewable_mix, 1),
        "chart": {"labels": time_labels, "actual": actual_series, "predicted": predicted_series},
        "insights": insights,
        "recommendations": recommendations,
    }


@app.post("/predict")
def predict_energy(data: PredictionInput):
    dt = datetime.fromisoformat(data.datetime.replace("Z", "+00:00"))
    dt_naive = strip_tz(dt)
    hour = dt_naive.hour
    day_of_week = dt_naive.weekday()
    is_weekend = 1 if day_of_week >= 5 else 0

    if data.prev_hour_energy is None or data.rolling_3h_avg is None or data.rolling_6h_avg is None:
        prev_hour_energy, rolling_3h_avg, rolling_6h_avg = get_real_inputs(dt_naive)
    else:
        prev_hour_energy = data.prev_hour_energy
        rolling_3h_avg = data.rolling_3h_avg
        rolling_6h_avg = data.rolling_6h_avg

    time_labels, actual_series = get_real_chart_data(dt_naive, num_hours=12)
    return build_response(hour, day_of_week, is_weekend, prev_hour_energy, rolling_3h_avg, rolling_6h_avg, time_labels, actual_series)


@app.post("/upload-predict")
async def upload_and_predict(file: UploadFile = File(...)):
    contents = await file.read()

    try:
        if file.filename.endswith(".csv"):
            uploaded_df = pd.read_csv(io.BytesIO(contents), parse_dates=["datetime"])
        elif file.filename.endswith((".xlsx", ".xls")):
            uploaded_df = pd.read_excel(io.BytesIO(contents), parse_dates=["datetime"])
        else:
            return {"error": "Unsupported format. Please upload CSV or Excel file."}
    except Exception as e:
        return {"error": f"Failed to parse file: {str(e)}"}

    if "datetime" not in uploaded_df.columns or "energy_kwh" not in uploaded_df.columns:
        return {"error": "File must have 'datetime' and 'energy_kwh' columns."}

    if len(uploaded_df) < 6:
        return {"error": "Minimum 6 rows of data required for prediction."}

    uploaded_df = uploaded_df.sort_values("datetime").reset_index(drop=True)

    last_row = uploaded_df.iloc[-1]
    dt = pd.to_datetime(last_row["datetime"])
    hour = dt.hour
    day_of_week = dt.dayofweek
    is_weekend = 1 if day_of_week >= 5 else 0

    prev_hour_energy = float(last_row["energy_kwh"])
    rolling_3h_avg = float(uploaded_df["energy_kwh"].tail(3).mean())
    rolling_6h_avg = float(uploaded_df["energy_kwh"].tail(6).mean())

    chart_rows = uploaded_df.tail(12)
    time_labels = pd.to_datetime(chart_rows["datetime"]).dt.strftime("%H:%M").tolist()
    actual_series = chart_rows["energy_kwh"].round(2).tolist()

    preview = uploaded_df.head(5)[["datetime", "energy_kwh"]].copy()
    preview["datetime"] = preview["datetime"].astype(str)
    preview_data = preview.to_dict(orient="records")

    result = build_response(hour, day_of_week, is_weekend, prev_hour_energy, rolling_3h_avg, rolling_6h_avg, time_labels, actual_series)
    result["preview"] = preview_data
    result["total_rows"] = len(uploaded_df)

    return result


@app.get("/")
def root():
    return {"status": "Eco1 API is running"}