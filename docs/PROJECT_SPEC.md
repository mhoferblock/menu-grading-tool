# Menu Grading Tool — Technical Specification

## Project Overview

A standalone web-based Menu QA Grading Tool that enables GSO and BPO team members to quality-check menu builds completed for Square sellers. The tool compares a seller's physical menu (PDF/image) against their Square Catalog or Excel export, applies a standardized rubric, and produces scored QA reports with AI-assisted analysis.

## Target Users

| Team | Location | Role |
|------|----------|------|
| GT BPO | Guatemala | Menu QA reviewers |
| MNL BPO | Manila | Menu QA reviewers |
| GSO Internal | US | Team leads, directors |

### Initial User Allowlist
- `*@squareup.com` / `*@block.xyz` (domain-level)
- `yecheverria-bpo@bpofit.com`
- `sebastianguzman-bpo@bpofit.com`
- `layshanayeliquevedo-bpo@bpofit.com`
- `czamora-bpo@bpofit.com`
- `candreapiedrasantaanleu-bpo@bpofit.com`
- `leonel-bpo@bpofit.com`
- `amauricio-bpo@bpofit.com`
- `alyanna-bpo@bpofit.com`
- `randell-bpo@bpofit.com`

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Next.js 14 App                      │
├─────────────────┬────────────────────────────────────┤
│   App Router    │         API Routes                   │
│   (React SSR)   │    /api/v1/*                         │
│                 │                                      │
│  ┌───────────┐  │  ┌──────────────┐ ┌──────────────┐  │
│  │ Upload    │  │  │ PDF Parser   │ │ Square API   │  │
│  │ Flow      │──│──│ (pdf.js +    │ │ Client       │  │
│  │           │  │  │  OCR)        │ │ (pagination) │  │
│  ├───────────┤  │  ├──────────────┤ ├──────────────┤  │
│  │ Report    │  │  │ Comparison   │ │ Excel Parser │  │
│  │ Dashboard │──│──│ Engine       │ │ (SheetJS)    │  │
│  │           │  │  │ (match/diff) │ │              │  │
│  ├───────────┤  │  ├──────────────┤ ├──────────────┤  │
│  │ AI        │  │  │ Grading      │ │ Claude AI    │  │
│  │ Insights  │──│──│ Engine       │ │ Layer        │  │
│  │           │  │  │ (rubric)     │ │ (adaptive)   │  │
│  └───────────┘  │  └──────────────┘ └──────────────┘  │
│                 │           │                          │
│                 │    ┌──────┴──────┐                   │
│                 │    │ PostgreSQL  │                   │
│                 │    │ (Prisma)    │                   │
│                 │    └─────────────┘                   │
└─────────────────┴────────────────────────────────────┘
```

## Core Features

### Phase 1: Foundation (Milestone 1)
- [x] Project scaffolding (Next.js 14, TypeScript, Tailwind, shadcn/ui)
- [ ] Prisma schema and database setup (including Builder, QualitySnapshot models)
- [ ] NextAuth.js email authentication with allowlist
- [ ] Basic layout (sidebar navigation, header, theme)
- [ ] Landing/dashboard page

### Phase 2: Grading Engine (Milestone 2)
- [ ] Title case validation engine
- [ ] Spelling check integration
- [ ] Variation ordering validator
- [ ] Modifier alphabetization checker
- [ ] Auto-add-to-check rules (US/EU/AU)
- [ ] Price comparison engine (cents-based)
- [ ] Duplicate detection (exact + fuzzy via fuse.js)
- [ ] "Or" in item names detector
- [ ] Unit format validator
- [ ] Missing/extra item cross-reference

### Phase 3: Upload Pipeline (Milestone 3)
- [ ] PDF text extraction (pdf.js)
- [ ] Image OCR (Tesseract.js / Google Vision API)
- [ ] Claude AI structured extraction from raw text
- [ ] Square API catalog fetcher (full pagination)
- [ ] Excel catalog parser (SheetJS)
- [ ] Parsed menu preview with edit capability
- [ ] Catalog normalization layer
- [ ] Builder attribution input (name, email, team with autocomplete)

### Phase 4: Report UI & Feedback (Milestone 4)
- [ ] Overall score ring display
- [ ] Section breakdown bar charts
- [ ] Per-item grade cards (expandable)
- [ ] Side-by-side comparison view
- [ ] Issue highlighting with severity pills
- [ ] Builder attribution display on reports
- [ ] Feedback email preview modal
- [ ] Send feedback email (to builder, CC menugradingtoolresponses@squareup.com)
- [ ] Feedback status tracking (draft → sent)
- [ ] PDF export (jspdf)
- [ ] Shareable report links

### Phase 5: Claude AI Layer (Milestone 5)
- [ ] Menu extraction prompts
- [ ] AI-assisted grading for subjective criteria
- [ ] Correction capture workflow
- [ ] Pattern recognition engine
- [ ] Learned rules management
- [ ] Confidence indicators in UI
- [ ] Graceful degradation when AI unavailable
- [ ] Per-builder pattern detection (Claude identifies recurring issues per builder)

### Phase 6: Quality Tracking & Analytics (Milestone 6)
- [ ] Quality snapshot capture per submission
- [ ] Grading history table (filterable, sortable) with builder column
- [ ] Builder profile page (avg score, trends, common issues, improvement rate)
- [ ] Grader profile page (volume, avg time, score distribution, override rate)
- [ ] Per-builder quality trend charts
- [ ] Per-grader quality metrics
- [ ] Team performance dashboard (GT vs MNL comparison)
- [ ] Score distribution charts
- [ ] SLA / turnaround time tracking
- [ ] Export functionality

### Phase 7: Review Workflow & Notifications (Milestone 7)
- [ ] Review & approval workflow (lead reviews before feedback is sent)
- [ ] Direct-send vs review-then-send modes (configurable per team)
- [ ] In-app notification system for status changes
- [ ] Audit trail / change log
- [ ] Role-based dashboards (grader vs lead vs director views)

### Phase 8: Polish & Deploy (Milestone 8)
- [ ] Error handling (all error states from spec)
- [ ] Loading skeletons and progress states
- [ ] Auto-save / draft persistence
- [ ] Responsive design (tablet support)
- [ ] Keyboard shortcuts
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] Production deployment

## Quality Tracking System

### Per-Submission Quality Snapshots
Every grading submission captures a point-in-time quality record for both the grader (reviewer) and the builder. This powers all trend analytics without recomputing from raw reports.

**Tracked per submission:**
- Overall score and section breakdown scores
- Issue count and categorized issue summary
- Time-to-grade (how long the grader spent)
- Builder and grader attribution
- Market and merchant context

### Per-Builder Quality Tracking
Tracks how well each menu builder performs over time:
- Average score + trend line (improving or declining?)
- Most common issue categories
- Score by rubric section (strengths/weaknesses)
- Recent reports list
- Improvement rate (score delta between first and latest)

### Per-Grader (Reviewer) Quality Tracking
Tracks grader consistency and throughput:
- Total menus graded (all time, this month, this week)
- Average time per grade (SLA tracking)
- Score distribution (are they consistently harsh or lenient?)
- Override rate (how often leads change their grades on review)

## Builder Attribution

### How Builders Are Tracked
The grader manually enters the builder's information during the upload flow:
- **Builder Name** — text input with autocomplete from previous entries
- **Builder Email** — validated email, used as the feedback destination
- **Builder Team** — dropdown: GT, MNL, GSO, External

The Builder database is built organically as graders enter names. After the first entry, autocomplete suggests matching builders on future grades.

## Feedback Email System

### Compilation
The feedback email is a structured summary of the grading report:
- Subject: `Menu QA Report — {Merchant Name} — Score: {Score}/100`
- Overall score with grade letter (A/B/C/D/F)
- Section breakdown (Neatness, Organization, Accuracy, Thoroughness)
- Top issues found (bulleted, max 10)
- Per-item issues table
- Recommendations for improvement
- Claude AI suggestions (if applicable)
- Link back to full report in the tool

### Submission Flow
1. Grader finishes grading
2. Grader previews the compiled feedback email
3. Grader optionally adds personal notes/context
4. Grader clicks "Send Feedback"
5. Email sent to builder's email address
6. CC always goes to `menugradingtoolresponses@squareup.com` (hardcoded)
7. Reply-To set to the grader's email for follow-up questions
8. Report status updated to "sent", delivery logged in audit trail

### Send Modes (configurable per team in settings)
1. **Direct Send** — Grader sends feedback immediately after grading
2. **Review-Then-Send** — Lead reviews and approves before feedback is sent

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/v1/auth/[...nextauth]` | * | NextAuth.js handler |
| `/api/v1/menus/upload` | POST | Upload menu PDF/image |
| `/api/v1/menus/:id` | GET | Get parsed menu data |
| `/api/v1/catalogs/square` | POST | Fetch Square catalog |
| `/api/v1/catalogs/excel` | POST | Upload Excel catalog |
| `/api/v1/catalogs/:id` | GET | Get normalized catalog |
| `/api/v1/reports` | GET | List grading reports |
| `/api/v1/reports` | POST | Create new grading report |
| `/api/v1/reports/:id` | GET | Get report detail |
| `/api/v1/reports/:id` | PUT | Update report |
| `/api/v1/reports/:id/export` | GET | Export report as PDF |
| `/api/v1/reports/:id/feedback` | GET | Preview compiled feedback email |
| `/api/v1/reports/:id/feedback` | POST | Send feedback email to builder |
| `/api/v1/reports/:id/feedback/status` | GET | Email delivery status |
| `/api/v1/builders` | GET | List/search builders (autocomplete) |
| `/api/v1/builders` | POST | Create new builder |
| `/api/v1/builders/:id` | GET | Builder profile + quality history |
| `/api/v1/builders/:id/trend` | GET | Builder score trend data |
| `/api/v1/ai/extract` | POST | AI menu extraction |
| `/api/v1/ai/grade` | POST | AI-grade items |
| `/api/v1/ai/insights` | GET | Get AI insights |
| `/api/v1/ai/corrections` | POST | Submit correction |
| `/api/v1/ai/rules` | GET | List learned rules |
| `/api/v1/quality/graders` | GET | All grader quality metrics |
| `/api/v1/quality/graders/:email` | GET | Single grader quality profile |
| `/api/v1/quality/builders` | GET | All builder quality metrics |
| `/api/v1/quality/team` | GET | Team-level quality dashboard data |
| `/api/v1/analytics/team` | GET | Team performance data |
| `/api/v1/analytics/trends` | GET | Score trend data |
| `/api/v1/users` | GET | List users |
| `/api/v1/users/me` | GET | Current user profile |

## Environment Variables

```env
DATABASE_URL=postgresql://user:pass@host:5432/menu_grading
SQUARE_ACCESS_TOKEN=your_square_access_token
SQUARE_ENVIRONMENT=production
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
GOOGLE_VISION_API_KEY=your_google_vision_key
NEXTAUTH_SECRET=your_random_secret
NEXTAUTH_URL=http://localhost:3000
ALLOWED_DOMAINS=squareup.com,block.xyz,bpofit.com

# Email (feedback delivery)
EMAIL_SERVICE=resend
RESEND_API_KEY=your_resend_api_key
FEEDBACK_CC_EMAIL=menugradingtoolresponses@squareup.com
FEEDBACK_FROM_EMAIL=noreply@menugrading.squareup.com
```

## Testing Strategy

### Unit Tests (Jest)
- Title case validation (edge cases: "Mac and Cheese", "8oz Filet", "Creme Brulee")
- Auto-add logic (all market/variation/modifier combos)
- Price comparison (cents, rounding, missing prices)
- Duplicate detection (exact, fuzzy, intentional)
- Modifier validation (alphabetization, required-first, nested)
- Variation ordering (by size, by price, mixed)

### Integration Tests
- PDF parsing pipeline
- Square API fetch with pagination
- Excel parsing with various layouts
- Full grading pipeline end-to-end

### Test Data
- **Perfect menu** — should score 95-100
- **Mediocre menu** — should score 70-85
- **Poor menu** — should score < 60

## Reference Documents
- [Menu QA Rubric](https://docs.google.com/spreadsheets/d/1qZB_T38D1zZg7qXUt6lhzD_QGXodwN1nH13fTRzeJxY/edit)
- [Menu QA Goose Convo](https://docs.google.com/document/d/1f3nd1nflS0Jl5U7s3lqFAL5GTYEd2sUogXiABNQNEkM/edit)
