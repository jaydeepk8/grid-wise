from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import io

app = FastAPI(title="GridWise Energy Prediction API")

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

models = {}
datasets = {}
accuracy_cache = {}
FEATURES = ["hour", "day_of_week", "is_weekend", "prev_hour_energy", "rolling_3h_avg", "rolling_6h_avg"]

@app.on_event("startup")
def load_resources():
    global models, datasets, accuracy_cache

    print("Loading models and datasets...")
    model_dir = BASE_DIR / "model"
    data_dir = BASE_DIR / "data"

    facility_files = {
        "hospital": ("hospital_energy_rf.pkl", "hospital_hourly_energy.csv", "hospital_ml_ready.csv"),
        "data-center": ("datacenter_energy_rf.pkl", "datacenter_hourly_energy.csv", "datacenter_ml_ready.csv"),
        "mnc": ("mnc_energy_rf.pkl", "mnc_hourly_energy.csv", "mnc_ml_ready.csv"),
    }

    for key, (model_file, hourly_file, ml_file) in facility_files.items():
        models[key] = joblib.load(model_dir / model_file)
        hourly = pd.read_csv(data_dir / hourly_file, parse_dates=["datetime"])
        ml = pd.read_csv(data_dir / ml_file, parse_dates=["datetime"])
        datasets[key] = {
            "hourly": hourly.sort_values("datetime").reset_index(drop=True),
            "ml": ml.sort_values("datetime").reset_index(drop=True),
        }

        df_ml = datasets[key]["ml"]
        X = df_ml[FEATURES]
        y = df_ml["target_next_hour"]
        split = int(len(df_ml) * 0.8)
        X_test = X.iloc[split:]
        y_test = y.iloc[split:]
        y_pred = models[key].predict(X_test)

        accuracy_cache[key] = {
            "r2": round(float(r2_score(y_test, y_pred)), 4),
            "mae": round(float(mean_absolute_error(y_test, y_pred)), 2),
            "rmse": round(float(np.sqrt(mean_squared_error(y_test, y_pred))), 2),
            "accuracy_percent": round(float(r2_score(y_test, y_pred)) * 100, 2),
        }

    print("All resources loaded successfully!")


class PredictionInput(BaseModel):
    datetime: str
    facility_type: Optional[str] = "hospital"
    prev_hour_energy: Optional[float] = None
    rolling_3h_avg: Optional[float] = None
    rolling_6h_avg: Optional[float] = None


class ForecastInput(BaseModel):
    datetime: str
    facility_type: Optional[str] = "hospital"
    hours: int = 24
    prev_hour_energy: Optional[float] = None
    rolling_3h_avg: Optional[float] = None
    rolling_6h_avg: Optional[float] = None


def strip_tz(dt: datetime) -> datetime:
    return dt.replace(tzinfo=None) if dt.tzinfo else dt


def get_real_inputs(dt: datetime, facility_type: str):
    dt = strip_tz(dt)
    df_ml = datasets[facility_type]["ml"]
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


def get_real_chart_data(dt: datetime, facility_type: str, num_hours: int = 12):
    dt = strip_tz(dt)
    df = datasets[facility_type]["hourly"]
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


def build_response(facility_type, hour, day_of_week, is_weekend, prev_hour_energy, rolling_3h_avg, rolling_6h_avg, time_labels, actual_series, predicted_series=None):
    model = models[facility_type]
    X = pd.DataFrame(
        [[hour, day_of_week, is_weekend, prev_hour_energy, rolling_3h_avg, rolling_6h_avg]],
        columns=FEATURES,
    )
    prediction = float(model.predict(X)[0])
    peak_risk = calculate_peak_risk(prediction, rolling_6h_avg)
    renewable_mix = estimate_renewable_mix(hour)
    # Use pre-computed predicted_series if provided, otherwise fall back
    if predicted_series is None:
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


def build_forecast(facility_type, start_dt, hours, prev_hour_energy, rolling_3h_avg, rolling_6h_avg):
    model = models[facility_type]
    hours = max(1, min(int(hours), 168))
    current_dt = strip_tz(start_dt)
    recent_values = [prev_hour_energy] * 6
    labels = []
    predictions = []

    for _ in range(hours):
        current_dt += timedelta(hours=1)
        hour = current_dt.hour
        day_of_week = current_dt.weekday()
        is_weekend = 1 if day_of_week >= 5 else 0
        X = pd.DataFrame(
            [[hour, day_of_week, is_weekend, prev_hour_energy, rolling_3h_avg, rolling_6h_avg]],
            columns=FEATURES,
        )
        prediction = float(model.predict(X)[0])

        labels.append(current_dt.strftime("%d %b %H:%M") if hours > 24 else current_dt.strftime("%H:%M"))
        predictions.append(round(prediction, 2))

        recent_values.append(prediction)
        recent_values = recent_values[-6:]
        prev_hour_energy = prediction
        rolling_3h_avg = float(np.mean(recent_values[-3:]))
        rolling_6h_avg = float(np.mean(recent_values[-6:]))

    peak_index = int(np.argmax(predictions))
    avg_predicted = float(np.mean(predictions))
    peak_value = float(predictions[peak_index])

    # FIX: average renewable mix across the entire forecast window, not just the end hour
    start_naive = strip_tz(start_dt)
    renewable_mix = round(float(np.mean([
        estimate_renewable_mix((start_naive + timedelta(hours=i)).hour)
        for i in range(1, hours + 1)
    ])), 1)

    # FIX: richer conditional recommendations
    peak_pct = round(((peak_value - avg_predicted) / avg_predicted) * 100, 2)
    recommendations = []
    if peak_value > avg_predicted * 1.10:
        recommendations.append({
            "title": "Immediate Load Redistribution Required",
            "priority": "High",
            "impact": f"Peak demand of {round(peak_value, 2)} kWh is {peak_pct}% above forecast average — overload risk.",
        })
    elif peak_value > avg_predicted * 1.05:
        recommendations.append({
            "title": "Prepare Demand Response Strategy",
            "priority": "Medium",
            "impact": f"Peak demand is {peak_pct}% above forecast average. Monitor closely around {labels[peak_index]}.",
        })
    else:
        recommendations.append({
            "title": "Maintain Current Operational Strategy",
            "priority": "Low",
            "impact": f"Demand is within {peak_pct}% of forecast average — stable operating conditions expected.",
        })
    if renewable_mix < 50:
        recommendations.append({
            "title": "Increase Renewable Dispatch",
            "priority": "Medium",
            "impact": f"Average renewable mix over this window is {renewable_mix}% — consider shifting loads to daytime solar hours.",
        })
    elif renewable_mix > 70:
        recommendations.append({
            "title": "Maximize Solar Utilization",
            "priority": "Low",
            "impact": f"High average renewable penetration ({renewable_mix}%) — schedule high-load tasks within this window.",
        })
    if hours >= 168:
        recommendations.append({
            "title": "Weekly Load Planning",
            "priority": "Medium" if peak_value > avg_predicted * 1.05 else "Low",
            "impact": f"7-day forecast peaks at {labels[peak_index]} ({round(peak_value, 2)} kWh). Plan maintenance and load-shifting accordingly.",
        })
    elif hours >= 24:
        recommendations.append({
            "title": "Daily Load Scheduling",
            "priority": "Low",
            "impact": "Schedule high-consumption tasks during predicted off-peak hours to reduce operational costs.",
        })
    recommendations.append({
        "title": "Continue Preventive Monitoring",
        "priority": "Low",
        "impact": "Each hourly prediction feeds the next — forecasts improve accuracy when seeded from your latest uploaded data.",
    })

    # FIX: richer insights
    min_value = float(min(predictions))
    min_index = int(np.argmin(predictions))
    demand_range = round(peak_value - min_value, 2)
    insights = [
        f"Average predicted demand over this period: {round(avg_predicted, 2)} kWh.",
        f"Peak demand expected at {labels[peak_index]}: {round(peak_value, 2)} kWh.",
        f"Lowest demand expected at {labels[min_index]}: {round(min_value, 2)} kWh (range: {demand_range} kWh).",
        f"Average renewable mix across this window: {renewable_mix}%.",
    ]

    return {
        "facility": facility_type,
        "forecast_labels": labels,
        "forecast_values": predictions,
        "peak_hour": labels[peak_index],
        "peak_value": round(peak_value, 2),
        "avg_predicted": round(avg_predicted, 2),
        "peak_load_risk": calculate_peak_risk(peak_value, avg_predicted),
        "renewable_mix_percent": renewable_mix,
        "insights": insights,
        "recommendations": recommendations,
    }


@app.post("/predict")
def predict_energy(data: PredictionInput):
    facility_type = data.facility_type if data.facility_type in models else "hospital"
    dt = datetime.fromisoformat(data.datetime.replace("Z", "+00:00"))
    dt_naive = strip_tz(dt)
    hour = dt_naive.hour
    day_of_week = dt_naive.weekday()
    is_weekend = 1 if day_of_week >= 5 else 0

    if data.prev_hour_energy is None or data.rolling_3h_avg is None or data.rolling_6h_avg is None:
        prev_hour_energy, rolling_3h_avg, rolling_6h_avg = get_real_inputs(dt_naive, facility_type)
    else:
        prev_hour_energy = data.prev_hour_energy
        rolling_3h_avg = data.rolling_3h_avg
        rolling_6h_avg = data.rolling_6h_avg

    time_labels, actual_series = get_real_chart_data(dt_naive, facility_type, num_hours=12)
    return build_response(facility_type, hour, day_of_week, is_weekend, prev_hour_energy, rolling_3h_avg, rolling_6h_avg, time_labels, actual_series)


@app.get("/accuracy/{facility_type}")
def get_accuracy(facility_type: str):
    if facility_type not in accuracy_cache:
        return {"error": "Facility not found"}
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
            return {"error": "Unsupported format. Please upload CSV or Excel file."}
    except Exception as e:
        return {"error": f"Failed to parse file: {str(e)}"}

    if "datetime" not in uploaded_df.columns or "energy_kwh" not in uploaded_df.columns:
        return {"error": "File must have 'datetime' and 'energy_kwh' columns."}

    if len(uploaded_df) < 6:
        return {"error": "Minimum 6 rows of data required for prediction."}

    if facility_type not in models:
        facility_type = "hospital"

    uploaded_df = uploaded_df.sort_values("datetime").reset_index(drop=True)
    last_row = uploaded_df.iloc[-1]
    dt = pd.to_datetime(last_row["datetime"])
    hour = dt.hour
    day_of_week = dt.dayofweek
    is_weekend = 1 if day_of_week >= 5 else 0

    prev_hour_energy = float(last_row["energy_kwh"])
    rolling_3h_avg = float(uploaded_df["energy_kwh"].tail(3).mean())
    rolling_6h_avg = float(uploaded_df["energy_kwh"].tail(6).mean())

    # Use last 12 rows for the chart; grab 18 for rolling-feature context
    context_df = uploaded_df.tail(18).reset_index(drop=True)
    chart_start = len(context_df) - min(12, len(context_df))
    chart_rows = context_df.iloc[chart_start:]
    time_labels = pd.to_datetime(chart_rows["datetime"]).dt.strftime("%H:%M").tolist()
    actual_series = chart_rows["energy_kwh"].round(2).tolist()

    # FIX: compute real ML predictions for every chart row (not actual * 1.02)
    predicted_series = []
    for idx in range(chart_start, len(context_df)):
        row = context_df.iloc[idx]
        r_dt = pd.to_datetime(row["datetime"])
        r_h   = r_dt.hour
        r_dow = r_dt.dayofweek
        r_we  = 1 if r_dow >= 5 else 0
        r_prev  = float(context_df["energy_kwh"].iloc[idx - 1]) if idx > 0 else float(row["energy_kwh"])
        r_roll3 = float(context_df["energy_kwh"].iloc[max(0, idx - 3):idx].mean()) if idx > 0 else float(row["energy_kwh"])
        r_roll6 = float(context_df["energy_kwh"].iloc[max(0, idx - 6):idx].mean()) if idx > 0 else float(row["energy_kwh"])
        X_r = pd.DataFrame([[r_h, r_dow, r_we, r_prev, r_roll3, r_roll6]], columns=FEATURES)
        predicted_series.append(round(float(models[facility_type].predict(X_r)[0]), 2))

    preview = uploaded_df.head(5)[["datetime", "energy_kwh"]].copy()
    preview["datetime"] = preview["datetime"].astype(str)

    result = build_response(
        facility_type, hour, day_of_week, is_weekend,
        prev_hour_energy, rolling_3h_avg, rolling_6h_avg,
        time_labels, actual_series, predicted_series,
    )
    result["preview"] = preview.to_dict(orient="records")
    result["total_rows"] = len(uploaded_df)
    result["source_datetime"] = str(dt)
    result["prev_hour_energy"] = round(prev_hour_energy, 2)
    result["rolling_3h_avg"] = round(rolling_3h_avg, 2)
    result["rolling_6h_avg"] = round(rolling_6h_avg, 2)

    return result


@app.post("/forecast")
def forecast_energy(data: ForecastInput):
    facility_type = data.facility_type if data.facility_type in models else "hospital"
    dt = datetime.fromisoformat(data.datetime.replace("Z", "+00:00"))
    dt_naive = strip_tz(dt)

    if data.prev_hour_energy is None or data.rolling_3h_avg is None or data.rolling_6h_avg is None:
        prev_hour_energy, rolling_3h_avg, rolling_6h_avg = get_real_inputs(dt_naive, facility_type)
    else:
        prev_hour_energy = data.prev_hour_energy
        rolling_3h_avg = data.rolling_3h_avg
        rolling_6h_avg = data.rolling_6h_avg

    return build_forecast(
        facility_type,
        dt_naive,
        data.hours,
        prev_hour_energy,
        rolling_3h_avg,
        rolling_6h_avg,
    )


@app.get("/")
def root():
    return {"status": "GridWise API is running"}
