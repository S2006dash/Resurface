"""
ai_utils.py — reused from SecureBank.
z-score anomaly detection + linear regression balance forecast.
The money engine (engine/) calls these directly.
"""

import numpy as np


def analyze_fraud_risk(amounts: list[float]) -> dict:
    """
    Z-score anomaly check on a list of transaction amounts.
    Returns each amount with its z-score and whether it is unusual (|z| > 2).
    """
    if not amounts:
        return {"anomalies": [], "mean": 0, "std": 0}

    arr = np.array(amounts, dtype=float)
    mean = float(arr.mean())
    std = float(arr.std()) or 1.0  # avoid divide-by-zero

    anomalies = []
    for i, amt in enumerate(amounts):
        z = (amt - mean) / std
        if abs(z) > 2:
            anomalies.append({"index": i, "amount": amt, "z_score": round(z, 2)})

    return {"anomalies": anomalies, "mean": round(mean, 2), "std": round(std, 2)}


def predict_balance_trend(balances: list[float], periods: int = 3) -> dict:
    """
    Simple linear regression over a sequence of balance snapshots.
    Returns predicted values for the next `periods` points.
    """
    if len(balances) < 2:
        return {"trend": "insufficient_data", "predictions": []}

    x = np.arange(len(balances), dtype=float)
    y = np.array(balances, dtype=float)

    # least-squares fit
    coeffs = np.polyfit(x, y, 1)
    slope, intercept = float(coeffs[0]), float(coeffs[1])

    predictions = [
        round(slope * (len(balances) + i) + intercept, 2)
        for i in range(periods)
    ]

    trend = "up" if slope > 0 else "down" if slope < 0 else "flat"
    return {
        "trend": trend,
        "slope": round(slope, 2),
        "predictions": predictions,
    }
