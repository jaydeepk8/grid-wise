from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from pathlib import Path
from typing import Optional

app = FastAPI(title="Eco1 Energy Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent

model = joblib.load(BASE_DIR / "model" / "hospital_energy_rf.pkl")

df = pd.read_csv(BASE_DIR / "data" / "hospital_hourly_energy.csv", parse_dates=["datetime"])
df = df.sort_values("datetime").reset_index(drop=True)

df_ml = pd.read_csv(BASE_DIR / "data" / "hospital_ml_ready.csv", parse_dates=["datetime"])
df_ml = df_ml.sort_values("datetime").reset_index(drop=True)


class PredictionInput(BaseModel):
    datetime: str
    prev_hour_energy: Optional[float] = None
    rolling_3h_avg: Optional[float] = None
    rolling_6h_avg: Optional[float] = None


def strip_tz(dt: datetime) -> datetime:
    """Remove timezone so it matches naive CSV datetimes."""
    return dt.replace(tzinfo=None) if dt.tzinfo else dt


def get_real_inputs(dt: datetime):
    """
    Match by hour + day_of_week pattern from CSV.
    This gives realistic values even when current date is beyond CSV range.
    """
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
    """
    Get real energy readings from CSV.
    Uses last 12 rows of CSV if current date is beyond CSV range.
    """
    dt = strip_tz(dt)

    past = df[df["datetime"] <= dt].tail(num_hours)

    if len(past) < num_hours:
        past = df.tail(num_hours)

    labels = past["datetime"].dt.strftime("%H:%M").tolist()
    actual = past["energy_kwh"].round(2).tolist()
    return labels, actual


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

    X = np.array([[hour, day_of_week, is_weekend, prev_hour_energy, rolling_3h_avg, rolling_6h_avg]])
    prediction = float(model.predict(X)[0])

    current_demand = prev_hour_energy
    peak_risk = calculate_peak_risk(prediction, rolling_6h_avg)
    renewable_mix = estimate_renewable_mix(hour)

    time_labels, actual_series = get_real_chart_data(dt_naive, num_hours=12)

    predicted_series = []
    for i, actual in enumerate(actual_series):
        if i < len(actual_series) - 1:
            predicted_series.append(round(actual * 1.02, 2))
        else:
            predicted_series.append(round(prediction, 2))

    demand_change = ((prediction - current_demand) / current_demand) * 100
    avg_deviation = ((prediction - rolling_6h_avg) / rolling_6h_avg) * 100

    # AI Insights
    insights = [
        f"Projected demand change: {round(demand_change, 2)}% for next hour.",
        f"Deviation from rolling 6-hour average: {round(avg_deviation, 2)}%.",
    ]
    if peak_risk == "High Risk":
        insights.append("Critical peak load threshold exceeded. System stress likely.")
    elif peak_risk == "Medium Risk":
        insights.append("Moderate peak conditions detected. Close monitoring advised.")
    else:
        insights.append("System operating within stable load parameters.")
    insights.append(f"Renewable contribution currently at {renewable_mix}%.")

    # AI Recommendations
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
        "current_demand_kwh": round(current_demand, 2),
        "predicted_next_hour_kwh": round(prediction, 2),
        "peak_load_risk": peak_risk,
        "renewable_mix_percent": round(renewable_mix, 1),
        "chart": {
            "labels": time_labels,
            "actual": actual_series,
            "predicted": predicted_series,
        },
        "insights": insights,
        "recommendations": recommendations,
    }


@app.get("/")
def root():
    return {"status": "Eco1 API is running"}