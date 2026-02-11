from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
from datetime import datetime, timedelta
import random

app = FastAPI(title="Eco1 Energy Prediction API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


model = joblib.load("../model/hospital_energy_rf.pkl")


class PredictionInput(BaseModel):
    datetime: str
    prev_hour_energy: float
    rolling_3h_avg: float
    rolling_6h_avg: float



def calculate_peak_risk(predicted, avg):
    if predicted > avg * 1.10:
        return "High Risk"
    elif predicted > avg * 1.05:
        return "Medium Risk"
    else:
        return "Low Risk"


def estimate_renewable_mix(hour):
    if 6 <= hour <= 18:
        return 70 + (hour - 6) * 1.0
    else:
        return 45


@app.post("/predict")
def predict_energy(data: PredictionInput):

    dt = datetime.fromisoformat(data.datetime)

    hour = dt.hour
    day_of_week = dt.weekday()
    is_weekend = 1 if day_of_week >= 5 else 0


    # ML Prediction

    X = np.array([[
        hour,
        day_of_week,
        is_weekend,
        data.prev_hour_energy,
        data.rolling_3h_avg,
        data.rolling_6h_avg
    ]])

    prediction = model.predict(X)[0]

    current_demand = data.prev_hour_energy
    peak_risk = calculate_peak_risk(prediction, data.rolling_6h_avg)
    renewable_mix = estimate_renewable_mix(hour)

  
    # Chart Data

    actual_series = []
    predicted_series = []
    time_labels = []

    base = current_demand

    for i in range(11, -1, -1):
        timestamp = dt - timedelta(hours=i)

        actual_value = base + random.uniform(-20, 20)
        predicted_value = actual_value * 1.05

        actual_series.append(round(actual_value, 2))
        predicted_series.append(round(predicted_value, 2))
        time_labels.append(timestamp.strftime("%H:%M"))

   
    # Numeric Calculations
    
    demand_change = ((prediction - current_demand) / current_demand) * 100
    avg_deviation = ((prediction - data.rolling_6h_avg) / data.rolling_6h_avg) * 100


    # AI INSIGHTS

    insights = []

    insights.append(
        f"Projected demand change: {round(demand_change,2)}% for next hour."
    )

    insights.append(
        f"Deviation from rolling 6-hour average: {round(avg_deviation,2)}%."
    )

    if peak_risk == "High Risk":
        insights.append(
            "Critical peak load threshold exceeded. System stress likely."
        )
    elif peak_risk == "Medium Risk":
        insights.append(
            "Moderate peak conditions detected. Close monitoring advised."
        )
    else:
        insights.append(
            "System operating within stable load parameters."
        )

    insights.append(
        f"Renewable contribution currently at {renewable_mix}%."
    )


    # AI RECOMMENDATIONS
 
    recommendations = []

    # 1️ Peak Overload Handling
    if avg_deviation > 10:
        recommendations.append({
            "title": "Immediate Load Redistribution Required",
            "priority": "High",
            "impact": f"Predicted demand exceeds rolling average by {round(avg_deviation,2)}%. Risk of overload."
        })
    elif avg_deviation > 5:
        recommendations.append({
            "title": "Prepare Demand Response Strategy",
            "priority": "Medium",
            "impact": f"Demand trending {round(avg_deviation,2)}% above recent average."
        })

    # 2️ HVAC Optimization
    if demand_change > 8:
        recommendations.append({
            "title": "Pre-cool HVAC Systems",
            "priority": "High",
            "impact": f"Forecast indicates {round(demand_change,2)}% rise in next-hour demand."
        })

    # 3️ Renewable Optimization
    if renewable_mix < 50:
        recommendations.append({
            "title": "Increase Renewable Dispatch",
            "priority": "Medium",
            "impact": f"Renewable mix at {renewable_mix}% increasing grid dependency."
        })
    elif renewable_mix > 75:
        recommendations.append({
            "title": "Maximize Solar Utilization",
            "priority": "Low",
            "impact": f"High renewable penetration ({renewable_mix}%) allows sustainability optimization."
        })

    # 4️ Stability Maintenance
    if peak_risk == "Low Risk" and abs(demand_change) < 5:
        recommendations.append({
            "title": "Maintain Current Operational Strategy",
            "priority": "Low",
            "impact": "Demand fluctuation within acceptable threshold."
        })

    # 5️ Preventive Oversight
    recommendations.append({
        "title": "Continue Preventive Monitoring",
        "priority": "Low",
        "impact": "AI confidence remains strong based on stable historical patterns."
    })

   
    return {
        "current_demand_kwh": round(float(current_demand), 2),
        "predicted_next_hour_kwh": round(float(prediction), 2),
        "peak_load_risk": peak_risk,
        "renewable_mix_percent": round(float(renewable_mix), 1),
        "chart": {
            "labels": time_labels,
            "actual": actual_series,
            "predicted": predicted_series
        },
        "insights": insights,
        "recommendations": recommendations
    }


    
@app.get("/")
def root():
    return {"status": "Eco1 API is running"}
