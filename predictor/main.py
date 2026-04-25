from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import models
from database import engine, get_db, Base
from predictor import run_prediction, update_daily_stats

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NestCare Predictor API",
    description="Smart maintenance prediction service for NestCare",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic schemas ──────────────────────────────────────────────

class ReportIn(BaseModel):
    ref_number: str
    tenant_name: str
    first_name: str
    issue_category: str
    description: Optional[str] = None
    contact: str
    contact_type: str
    unit_number: Optional[str] = None

class ReportOut(BaseModel):
    id: int
    ref_number: str
    tenant_name: str
    issue_category: str
    submitted_at: Optional[datetime]

    class Config:
        from_attributes = True

# ── Routes ───────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "service": "NestCare Predictor API",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
def health(db: Session = Depends(get_db)):
    """Health check — verifies DB connection."""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/report", response_model=ReportOut)
def save_report(report: ReportIn, db: Session = Depends(get_db)):
    """
    Save a new issue report from n8n and trigger daily stats update.
    Called by n8n after every form submission.
    """
    # Check for duplicate ref_number
    existing = db.query(models.IssueReport).filter(
        models.IssueReport.ref_number == report.ref_number
    ).first()
    if existing:
        return existing

    # Save to issue_reports
    db_report = models.IssueReport(
        ref_number=report.ref_number,
        tenant_name=report.tenant_name,
        first_name=report.first_name,
        issue_category=report.issue_category,
        description=report.description,
        contact=report.contact,
        contact_type=report.contact_type,
        unit_number=report.unit_number,
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)

    # Update time-series stats
    update_daily_stats(db, report.issue_category)

    return db_report


@app.get("/predict/{issue_category}")
def predict(issue_category: str, db: Session = Depends(get_db)):
    """
    Run ML prediction for a given issue category.
    Returns anomaly detection + next occurrence forecast.
    """
    valid_categories = [
        "Window is damaged",
        "Stove is not working",
        "Heating is not functioning",
        "Plumbing issue",
        "Electrical issue",
        "Other issue"
    ]
    if issue_category not in valid_categories:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown category. Valid options: {valid_categories}"
        )

    result = run_prediction(db, issue_category)
    return result


@app.get("/predict/all")
def predict_all(db: Session = Depends(get_db)):
    """Run predictions for all issue categories at once."""
    categories = [
        "Window is damaged",
        "Stove is not working",
        "Heating is not functioning",
        "Plumbing issue",
        "Electrical issue",
        "Other issue"
    ]
    return [run_prediction(db, cat) for cat in categories]


@app.get("/reports")
def list_reports(
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """List all submitted reports with pagination."""
    reports = db.query(models.IssueReport)\
        .order_by(models.IssueReport.submitted_at.desc())\
        .offset(offset)\
        .limit(limit)\
        .all()
    return reports


@app.get("/stats/summary")
def stats_summary(db: Session = Depends(get_db)):
    """Summary stats for dashboard — total reports per category."""
    query = text("""
        SELECT 
            issue_category,
            COUNT(*) as total_reports,
            MAX(submitted_at) as last_reported
        FROM issue_reports
        GROUP BY issue_category
        ORDER BY total_reports DESC
    """)
    result = db.execute(query).fetchall()
    return [
        {
            "issue_category": row[0],
            "total_reports": row[1],
            "last_reported": row[2]
        }
        for row in result
    ]