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
- [ ] Prisma schema and database setup
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

### Phase 4: Report UI (Milestone 4)
- [ ] Overall score ring display
- [ ] Section breakdown bar charts
- [ ] Per-item grade cards (expandable)
- [ ] Side-by-side comparison view
- [ ] Issue highlighting with severity pills
- [ ] PDF export (jspdf)
- [ ] Share functionality

### Phase 5: Claude AI Layer (Milestone 5)
- [ ] Menu extraction prompts
- [ ] AI-assisted grading for subjective criteria
- [ ] Correction capture workflow
- [ ] Pattern recognition engine
- [ ] Learned rules management
- [ ] Confidence indicators in UI
- [ ] Graceful degradation when AI unavailable

### Phase 6: History & Analytics (Milestone 6)
- [ ] Grading history table (filterable, sortable)
- [ ] Score distribution charts
- [ ] Team performance trends
- [ ] Individual reviewer metrics
- [ ] Export functionality

### Phase 7: Polish & Deploy (Milestone 7)
- [ ] Error handling (all error states from spec)
- [ ] Loading skeletons and progress states
- [ ] Responsive design (tablet support)
- [ ] Keyboard shortcuts
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] Production deployment

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
| `/api/v1/ai/extract` | POST | AI menu extraction |
| `/api/v1/ai/grade` | POST | AI-grade items |
| `/api/v1/ai/insights` | GET | Get AI insights |
| `/api/v1/ai/corrections` | POST | Submit correction |
| `/api/v1/ai/rules` | GET | List learned rules |
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
