from sqlalchemy import Column, Integer, String, Text, Float, Boolean, Date, DateTime
from sqlalchemy.sql import func
from database import Base

class IssueReport(Base):
    __tablename__ = "issue_reports"

    id = Column(Integer, primary_key=True, index=True)
    ref_number = Column(String(20), unique=True, nullable=False)
    tenant_name = Column(String(255), nullable=False)
    first_name = Column(String(100))
    issue_category = Column(String(100), nullable=False)
    description = Column(Text)
    contact = Column(String(255), nullable=False)
    contact_type = Column(String(20), nullable=False)
    unit_number = Column(String(50))
    submitted_at = Column(DateTime, server_default=func.now())

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    issue_category = Column(String(100), nullable=False)
    predicted_next_occurrence = Column(Date)
    confidence_score = Column(Float)
    anomaly_detected = Column(Boolean, default=False)
    report_count_last_30_days = Column(Integer, default=0)
    generated_at = Column(DateTime, server_default=func.now())

class DailyStat(Base):
    __tablename__ = "daily_stats"

    id = Column(Integer, primary_key=True, index=True)
    stat_date = Column(Date, nullable=False)
    issue_category = Column(String(100), nullable=False)
    report_count = Column(Integer, default=0)