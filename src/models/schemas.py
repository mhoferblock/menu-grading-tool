from __future__ import annotations

from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field


class Builder(BaseModel):
    id: str
    name: str
    email: str
    team: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Grader(BaseModel):
    id: str
    name: str
    email: str
    team: Optional[str] = None
    role: str = "grader"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SectionScore(BaseModel):
    score: float
    earned: float
    max_points: float


class ItemGrade(BaseModel):
    item_name: str
    category_name: str
    overall_score: float
    neatness: float
    organization: float
    accuracy: float
    thoroughness: float
    issues: List[str] = Field(default_factory=list)


class GradingReport(BaseModel):
    id: str
    merchant_name: str
    market: str
    graded_by: str
    overall_score: float
    section_scores: dict
    item_grades: List[ItemGrade] = Field(default_factory=list)
    issues: dict = Field(default_factory=dict)
    builder_name: str
    builder_email: str
    builder_team: Optional[str] = None
    builder_id: Optional[str] = None
    feedback_status: str = "draft"
    feedback_sent_at: Optional[datetime] = None
    feedback_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class QualitySnapshot(BaseModel):
    id: str
    report_id: str
    grader_email: str
    builder_email: str
    overall_score: float
    section_scores: dict
    issue_count: int
    issue_summary: dict
    grade_time_ms: int
    created_at: datetime = Field(default_factory=datetime.utcnow)


class FeedbackPreview(BaseModel):
    to_email: str
    to_name: str
    cc_email: str
    reply_to: str
    subject: str
    sections: List[dict] = Field(default_factory=list)
    top_issues: List[dict] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)


class FeedbackSendRequest(BaseModel):
    personal_notes: Optional[str] = None


class BuilderQualityMetrics(BaseModel):
    builder: Builder
    total_menus: int
    avg_score: float
    trend: str
    trend_delta: float
    top_issue: str
    recent_scores: List[float] = Field(default_factory=list)


class GraderQualityMetrics(BaseModel):
    grader_email: str
    total_graded: int
    avg_time_minutes: float
    avg_score_given: float
    override_rate: float
    consistency: str


# --- Request/Response wrappers ---

class ApiResponse(BaseModel):
    data: object
    meta: dict = Field(default_factory=dict)


class ApiErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None


class ReportCreateRequest(BaseModel):
    merchant_name: str
    market: str
    builder_name: str
    builder_email: str
    builder_team: Optional[str] = None
    builder_id: Optional[str] = None
    item_grades: List[ItemGrade] = Field(default_factory=list)
    feedback_notes: Optional[str] = None


class ReportUpdateRequest(BaseModel):
    merchant_name: Optional[str] = None
    market: Optional[str] = None
    overall_score: Optional[float] = None
    section_scores: Optional[dict] = None
    item_grades: Optional[List[ItemGrade]] = None
    issues: Optional[dict] = None
    feedback_status: Optional[str] = None
    feedback_notes: Optional[str] = None


class BuilderCreateRequest(BaseModel):
    name: str
    email: str
    team: Optional[str] = None


class GraderCreateRequest(BaseModel):
    name: str
    email: str
    team: Optional[str] = None
    role: str = "grader"


class AICorrectionRequest(BaseModel):
    report_id: str
    item_name: str
    field: str
    original_value: str
    corrected_value: str
    reason: Optional[str] = None
