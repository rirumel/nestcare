from typing import Tuple, Optional, List, Dict, Any
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
    df["report_count"] = df["report_count"].astype(float)
    return df


def detect_anomaly(df: pd.DataFrame) -> bool:
    """
    Anomaly detection using rolling mean + standard deviation.
    Flags if the latest value exceeds mean + 2*std (Z-score style).
    """
    if len(df) < 7:
        return (False, 0.0)
    
    rolling_mean = df["report_count"].rolling(window=7).mean()
    rolling_std = df["report_count"].rolling(window=7).std()
    
    latest = df["report_count"].iloc[-1]
    mean = rolling_mean.iloc[-1]
    std = rolling_std.iloc[-1]
    
    if pd.isna(std) or std == 0:
        return (False, 0.0)
    
    z_score = (latest - mean) / std
    return bool(z_score > 2.0), round(float(z_score), 2)


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
    intervals = [int((active_days[i] - active_days[i-1]).days) for i in range(1, len(active_days))]
    avg_interval = float(np.mean(intervals))
    std_interval = float(np.std(intervals))
    
    # Confidence: lower std = higher confidence
    confidence = max(0.0, min(1.0, 1.0 - (std_interval / (avg_interval + 1))))
    
    last_occurrence = active_days[-1]
    predicted_date = active_days[-1] + timedelta(days=int(avg_interval))
    
    return (predicted_date.strftime("%Y-%m-%d"), round(float(confidence), 2))

def get_trend(df: pd.DataFrame) -> dict:
    """Linear regression trend — is frequency increasing or decreasing?"""
    if len(df) < 14:
        return {"direction": "insufficient_data", "slope": 0.0, "strength": 0.0}
    # Use last 90 days
    recent = df.tail(90).copy().reset_index(drop=True)
    recent["day_num"] = range(len(recent))
    x = recent["day_num"].values.astype(float)
    y = recent["report_count"].values.astype(float)
    # numpy polyfit for linear regression
    coeffs = np.polyfit(x, y, 1)
    slope = float(coeffs[0])
    # R-squared
    y_pred = np.polyval(coeffs, x)
    ss_res = float(np.sum((y - y_pred) ** 2))
    ss_tot = float(np.sum((y - np.mean(y)) ** 2))
    r_squared = float(1 - (ss_res / ss_tot)) if ss_tot != 0 else 0.0
    direction = "increasing" if slope > 0.01 else "decreasing" if slope < -0.01 else "stable"
    return {
        "direction": direction,
        "slope": round(slope, 4),
        "strength": round(r_squared, 3)
    }
 
 
def get_seasonality(db: Session, issue_category: str) -> dict:
    """Monthly aggregation to detect seasonal patterns."""
    query = text("""
        SELECT
            EXTRACT(MONTH FROM stat_date) as month,
            SUM(report_count) as total,
            COUNT(*) as days
        FROM daily_stats
        WHERE issue_category = :category
        GROUP BY EXTRACT(MONTH FROM stat_date)
        ORDER BY month
    """)
    result = db.execute(query, {"category": issue_category}).fetchall()
    if not result:
        return {}
    month_names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    data = {}
    for row in result:
        idx = int(float(row[0])) - 1
        total = float(row[1]) if row[1] else 0.0
        days = float(row[2]) if row[2] else 1.0
        data[month_names[idx]] = round(total / days, 2)
    return data


def get_report_count_last_30_days(db: Session, issue_category: str) -> int:
    """Count reports in the last 30 days for a category."""
    query = text("""
        SELECT COALESCE(SUM(report_count), 0)
        FROM daily_stats
        WHERE issue_category = :category
        AND stat_date >= NOW() - INTERVAL '30 days'
    """)
    result = db.execute(query, {"category": issue_category}).scalar()
    return int(result) if result else 0


def run_prediction(db: Session, issue_category: str) -> Dict[str, Any]:
    """
    Full prediction pipeline for a given issue category.
    Returns anomaly status, forecast, confidence and recent count.
    """
    df = get_issue_timeseries(db, issue_category)
    
    anomaly_result = detect_anomaly(df)
    is_anomaly = bool(anomaly_result[0])
    z_score = float(anomaly_result[1])
    forecast_result = forecast_next_occurrence(df)
    predicted_date = forecast_result[0]
    confidence = float(forecast_result[1])
    count_30d = get_report_count_last_30_days(db, issue_category)
    trend = get_trend(df)
    seasonality = get_seasonality(db, issue_category)
    
    return {
        "issue_category": str(issue_category),
        "anomaly_detected": is_anomaly,
        "z_score": z_score,
        "predicted_next_occurrence": predicted_date,
        "confidence_score": confidence,
        "report_count_last_30_days": int(count_30d),
        "trend": trend,
        "seasonality": seasonality,
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

def get_timeseries_for_chart(db: Session, days: int = 90) -> List[Dict]:
    """Daily totals across all categories for the trend chart."""
    query = text("""
        SELECT stat_date, issue_category, report_count
        FROM daily_stats
        WHERE stat_date >= NOW() - INTERVAL ':{days} days'
        ORDER BY stat_date ASC
    """.replace(":days", str(days)))
    result = db.execute(query).fetchall()
    return [
        {"date": str(row[0]), "category": str(row[1]), "count": int(row[2])}
        for row in result
    ]
 
 
def get_kpi_summary(db: Session) -> Dict[str, Any]:
    """Top-level KPIs for dashboard header."""
    categories = [
        "Heating is not functioning", "Window is damaged",
        "Stove is not working", "Plumbing issue",
        "Electrical issue", "Other issue"
    ]
    total = int(db.execute(text("SELECT COUNT(*) FROM issue_reports"))).scalar() or 0
    this_month = int(db.execute(text("""
        SELECT COUNT(*) FROM issue_reports
        WHERE submitted_at >= DATE_TRUNC('month', NOW())
    """))).scalar()
    top_issue_row = db.execute(text("""
        SELECT issue_category, COUNT(*) as cnt
        FROM issue_reports
        GROUP BY issue_category
        ORDER BY cnt DESC LIMIT 1
    """)).fetchone()
    top_issue = str(top_issue_row[0]) if top_issue_row else None
    anomaly_count = 0
    for cat in categories:
        df = get_issue_timeseries(db, cat)
        result = detect_anomaly(df)
        if bool(result[0]):
            anomaly_count += 1
    last_7 = int(db.execute(text("""
        SELECT COUNT(*) FROM issue_reports
        WHERE submitted_at >= NOW() - INTERVAL '7 days'
    """)).scalar() or 0)
    prev_7 = int(db.execute(text("""
        SELECT COUNT(*) FROM issue_reports
        WHERE submitted_at >= NOW() - INTERVAL '14 days'
        AND submitted_at < NOW() - INTERVAL '7 days'
    """)).scalar() or 0)
    change_pct = 0.0
    if prev_7 and prev_7 > 0:
        change_pct = round(((last_7 - prev_7) / prev_7) * 100, 1)
    return {
        "total_reports": total,
        "reports_this_month": this_month,
        "top_issue": top_issue,
        "active_anomalies": int(anomaly_count),
        "reports_last_7_days": last_7,
        "week_over_week_change": float(change_pct),
    }