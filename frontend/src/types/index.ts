export interface Builder {
  id: string;
  name: string;
  email: string;
  team: string | null;
  created_at: string;
}

export interface SectionScore {
  score: number;
  earned: number;
  max_points: number;
}

export interface ItemGrade {
  item_name: string;
  category_name: string;
  overall_score: number;
  neatness: number;
  organization: number;
  accuracy: number;
  thoroughness: number;
  issues: string[];
}

export interface GradingReport {
  id: string;
  merchant_name: string;
  market: string;
  graded_by: string;
  overall_score: number;
  section_scores: {
    neatness: SectionScore;
    organization: SectionScore;
    accuracy: SectionScore;
    thoroughness: SectionScore;
  };
  item_grades: ItemGrade[];
  issues: {
    price_discrepancies: number;
    capitalization_errors: number;
    modifier_issues: number;
    duplicates: number;
    missing_items: number;
    extra_items: number;
  };
  builder_name: string;
  builder_email: string;
  builder_team: string | null;
  builder_id: string | null;
  feedback_status: string;
  feedback_sent_at: string | null;
  feedback_notes: string | null;
  created_at: string;
}

export interface BuilderQualityMetrics {
  builder: Builder;
  total_menus: number;
  avg_score: number;
  trend: string;
  trend_delta: number;
  top_issue: string;
  recent_scores: number[];
}

export interface GraderQualityMetrics {
  grader_email: string;
  total_graded: number;
  avg_time_minutes: number;
  avg_score_given: number;
  override_rate: number;
  consistency: string;
}

export interface FeedbackPreview {
  to_email: string;
  to_name: string;
  cc_email: string;
  reply_to: string;
  subject: string;
  sections: Array<{ name: string; earned: number; max: number }>;
  top_issues: Array<{ item: string; issue: string }>;
  recommendations: string[];
}
