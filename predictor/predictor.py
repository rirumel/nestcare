import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, text

def get_issue_timeseries(db: Session, issue_category: str) -> pd.DataFrame:
    """Fetch daily report counts for a given issue category."""
    query = text("""
        SELECT stat_date, report_count 
        FROM daily_stats 
        WHERE issue_category = :category
        ORDER BY stat_date ASC
    """)
    result = db.execute(query, {"category": issue_category}).fetchall()
    
    if not result:
        return pd.DataFrame(columns=["stat_date", "report_count"])
    
    df = pd.DataFrame(result, columns=["stat_date", "report_count"])
    df["stat_date"] = pd.to_datetime(df["stat_date"])
    return df


def detect_anomaly(df: pd.DataFrame) -> bool:
    """
    Anomaly detection using rolling mean + standard deviation.
    Flags if the latest value exceeds mean + 2*std (Z-score style).
    """
    if len(df) < 7:
        return False
    
    rolling_mean = df["report_count"].rolling(window=7).mean()
    rolling_std = df["report_count"].rolling(window=7).std()
    
    latest = df["report_count"].iloc[-1]
    mean = rolling_mean.iloc[-1]
    std = rolling_std.iloc[-1]
    
    if pd.isna(std) or std == 0:
        return False
    
    z_score = (latest - mean) / std
    return z_score > 2.0


def forecast_next_occurrence(df: pd.DataFrame) -> tuple[str | None, float]:
    """
    Simple time-series forecasting using rolling average interval.
    Returns predicted next date and confidence score.
    """
    if len(df) < 3:
        return None, 0.0
    
    # Find days where reports occurred
    active_days = df[df["report_count"] > 0]["stat_date"].tolist()
    
    if len(active_days) < 2:
        return None, 0.0
    
    # Calculate intervals between occurrences
    intervals = []
    for i in range(1, len(active_days)):
        delta = (active_days[i] - active_days[i-1]).days
        intervals.append(delta)
    
    avg_interval = np.mean(intervals)
    std_interval = np.std(intervals)
    
    # Confidence: lower std = higher confidence
    confidence = max(0.0, min(1.0, 1.0 - (std_interval / (avg_interval + 1))))
    
    last_occurrence = active_days[-1]
    predicted_date = last_occurrence + timedelta(days=int(avg_interval))
    
    return predicted_date.strftime("%Y-%m-%d"), round(confidence, 2)


def get_report_count_last_30_days(db: Session, issue_category: str) -> int:
    """Count reports in the last 30 days for a category."""
    query = text("""
        SELECT COALESCE(SUM(report_count), 0)
        FROM daily_stats
        WHERE issue_category = :category
        AND stat_date >= NOW() - INTERVAL '30 days'
    """)
    result = db.execute(query, {"category": issue_category}).scalar()
    return int(result)


def run_prediction(db: Session, issue_category: str) -> dict:
    """
    Full prediction pipeline for a given issue category.
    Returns anomaly status, forecast, confidence and recent count.
    """
    df = get_issue_timeseries(db, issue_category)
    
    anomaly = detect_anomaly(df)
    predicted_date, confidence = forecast_next_occurrence(df)
    count_30d = get_report_count_last_30_days(db, issue_category)
    
    return {
        "issue_category": issue_category,
        "anomaly_detected": anomaly,
        "predicted_next_occurrence": predicted_date,
        "confidence_score": confidence,
        "report_count_last_30_days": count_30d,
        "generated_at": datetime.now().isoformat()
    }


def update_daily_stats(db: Session, issue_category: str):
    """
    Upsert today's count into daily_stats.
    Called every time a new report comes in.
    """
    today = datetime.now().date()
    query = text("""
        INSERT INTO daily_stats (stat_date, issue_category, report_count)
        VALUES (:date, :category, 1)
        ON CONFLICT (stat_date, issue_category)
        DO UPDATE SET report_count = daily_stats.report_count + 1
    """)
    db.execute(query, {"date": today, "category": issue_category})
    db.commit()