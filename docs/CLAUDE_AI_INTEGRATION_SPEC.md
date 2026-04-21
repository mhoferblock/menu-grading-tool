# Claude AI Integration Specification
## Adaptive Learning Agent for Menu Grading Tool

### 1. Overview

Claude serves as an intelligent co-pilot within the Menu Grading Tool, performing three core functions:

1. **Menu Analysis** — Structured extraction from messy PDF/image menus
2. **Intelligent Grading** — AI-assisted scoring for subjective rubric criteria
3. **Adaptive Learning** — Learning from user corrections to improve over time

### 2. Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Claude AI Layer                     │
├──────────┬──────────────┬───────────────────────────┤
│ Extractor │  Grader      │  Learning Engine           │
│           │              │                           │
│ PDF/IMG → │ Rubric-aware │ Correction DB → Pattern   │
│ Structured│ scoring with │ Recognition → Adjusted    │
│ Menu Data │ explanations │ Scoring Weights           │
└──────────┴──────────────┴───────────────────────────┘
         ↓              ↓                  ↓
    ┌─────────────────────────────────────────┐
    │         Anthropic Messages API           │
    │   Model: claude-sonnet-4-20250514       │
    │   Fallback: claude-3-5-sonnet           │
    └─────────────────────────────────────────┘
```

### 3. Module Specifications

#### 3.1 Menu Extractor (`lib/ai/extractor.ts`)

**Purpose:** Convert raw OCR/PDF text into structured menu data.

**Prompt Strategy:**
- System prompt defines the exact output schema (JSON)
- Include rubric context so Claude can flag potential issues during extraction
- Multi-pass extraction: first pass for structure, second pass for validation

**Input:** Raw text from PDF/OCR pipeline
**Output:** `ParsedMenu` object with confidence scores per field

**Key Behaviors:**
- Never assume or guess prices — flag low-confidence extractions
- Identify categories, items, variations, modifiers from unstructured text
- Handle multi-column menu layouts
- Flag ambiguous items (e.g., "Chocolate" — shake? cake? ice cream?)
- Confidence threshold: < 0.7 triggers user review

#### 3.2 Intelligent Grader (`lib/ai/grader.ts`)

**Purpose:** Score subjective rubric criteria that can't be automated.

**AI-Graded Criteria:**
| Criterion | Why AI is needed |
|-----------|-----------------|
| Menu grid organization quality | Requires understanding of category ordering logic |
| Context sufficiency in names | "Chocolate" vs "Chocolate Shake" — needs menu context |
| Modifier set logic | Should this be 1 set or 2? Requires domain knowledge |
| Nested modifier necessity | When should dressings be nested under salads? |
| Special request compliance | Did the build follow specific written instructions? |
| Critical thinking assessment | Were creative workarounds implemented? |
| Aesthetic grid assessment | Color, tile size, spacing quality |

**Prompt Strategy:**
- Provide the full rubric definition in the system prompt
- Include the matched menu item + catalog item pair
- Ask for a score (0-10) AND a brief explanation
- Include examples of correct scoring at each level

**Output per item:**
```typescript
interface AIGradeResult {
  criterion: string;
  score: number;       // 0-10
  confidence: number;  // 0-1
  explanation: string;
  suggestedIssues: string[];
}
```

#### 3.3 Adaptive Learning Engine (`lib/ai/learning.ts`)

**Purpose:** Learn from user corrections to improve future grading accuracy.

**How It Works:**

1. **Correction Capture**: When a user overrides an AI grade or marks an issue as intentional, the correction is stored:
   ```typescript
   interface Correction {
     id: string;
     reportId: string;
     itemName: string;
     criterion: string;
     aiScore: number;
     userScore: number;
     aiExplanation: string;
     userReason: string;
     context: {
       menuCategory: string;
       market: string;
       catalogData: object;
     };
     createdAt: Date;
   }
   ```

2. **Pattern Recognition**: Periodically analyze corrections to find patterns:
   - "Users consistently rate 'Mac and Cheese' title case as correct"
   - "AU market tolerates spacing in unit formats"
   - "Duplicate items for Lunch/Dinner services are always intentional"

3. **Rule Generation**: Convert patterns into explicit rules:
   ```typescript
   interface LearnedRule {
     id: string;
     pattern: string;          // "title_case_exception"
     description: string;      // "'and' in food names accepted"
     confidence: number;       // Based on correction frequency
     appliedCount: number;     // How many times this rule was used
     source: Correction[];     // Which corrections generated this
     status: 'active' | 'under_review' | 'rejected';
     createdAt: Date;
   }
   ```

4. **Score Adjustment**: On future grades, check if any learned rules apply:
   - If a rule matches with confidence > 0.8 → auto-adjust the score
   - If confidence 0.5-0.8 → flag for user review with the rule explanation
   - If confidence < 0.5 → ignore (needs more data)

### 4. Prompt Templates

#### 4.1 Menu Extraction Prompt
```
ROLE: You are a Menu Structure Extraction AI. Parse the following menu text 
into a structured JSON format.

RULES:
- Extract categories, items, descriptions, prices, variations, and modifiers
- Flag items with low confidence (< 0.7)
- Never guess prices — mark as null if uncertain
- Identify the menu layout pattern (single-column, multi-column, grid)
- Correct obvious spelling errors but preserve original text in rawText field

OUTPUT SCHEMA: [ParsedMenu JSON schema]

MENU TEXT:
{rawText}
```

#### 4.2 Intelligent Grading Prompt
```
ROLE: You are a Menu QA Auditor AI. Score the following item against the 
grading rubric.

RUBRIC CRITERIA: {criterionDefinition}
SCORING GUIDE: {scoringGuide}

MENU ITEM: {menuItem}
CATALOG ITEM: {catalogItem}
MARKET: {market}
SPECIAL REQUESTS: {specialRequests}

LEARNED RULES (from past corrections):
{applicableLearnedRules}

Provide your assessment as JSON:
{
  "score": number (0-10),
  "confidence": number (0-1),
  "explanation": "brief rationale",
  "issues": ["list of specific issues found"],
  "appliedRules": ["IDs of learned rules that influenced this grade"]
}
```

#### 4.3 Pattern Recognition Prompt
```
ROLE: You are a Pattern Recognition AI. Analyze the following set of user 
corrections to identify systematic patterns.

CORRECTIONS: {recentCorrections}
EXISTING RULES: {currentLearnedRules}

For each pattern found, provide:
{
  "pattern": "identifier",
  "description": "human-readable explanation",
  "confidence": number (0-1),
  "evidence": ["correction IDs that support this pattern"],
  "suggestedRule": "how this should be applied in future grading"
}
```

### 5. API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/ai/extract` | POST | Extract structured menu from raw text |
| `/api/v1/ai/grade` | POST | AI-grade a single item against rubric |
| `/api/v1/ai/grade-batch` | POST | AI-grade multiple items in one request |
| `/api/v1/ai/insights` | GET | Get current AI insights and patterns |
| `/api/v1/ai/corrections` | POST | Submit a user correction |
| `/api/v1/ai/corrections` | GET | List corrections with filters |
| `/api/v1/ai/rules` | GET | List learned rules |
| `/api/v1/ai/rules/:id` | PUT | Update rule status (approve/reject) |
| `/api/v1/ai/analyze-patterns` | POST | Trigger pattern analysis |

### 6. Database Schema (Prisma)

```prisma
// ─── Builder Attribution ───────────────────────────────────
model Builder {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  team      String?  // GT, MNL, GSO, External
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  reports   GradingReport[]
}

// ─── Grading Report (with builder + feedback fields) ──────
model GradingReport {
  id              String   @id @default(cuid())
  merchantName    String
  market          String   // US, EU, AU
  gradedBy        String   // grader email
  overallScore    Float
  sectionScores   Json     // { neatness, organization, accuracy, thoroughness }
  itemGrades      Json     // per-item grade array
  issues          Json     // categorized issue counts
  specialRequests String?
  menuSourceId    String
  catalogSourceId String

  // Builder attribution
  builderId       String?
  builder         Builder? @relation(fields: [builderId], references: [id])
  builderName     String   // denormalized for quick display
  builderEmail    String   // where feedback gets sent

  // Feedback tracking
  feedbackStatus  String   @default("draft") // draft, pending_review, approved, sent, disputed
  feedbackSentAt  DateTime?
  feedbackSentBy  String?  // email of person who hit Send
  feedbackNotes   String?  // grader's personal notes appended to email
  reviewerNotes   String?  // internal notes from lead, not sent to builder

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  corrections     AiCorrection[]
  qualitySnapshot QualitySnapshot?
  feedbackLogs    FeedbackLog[]
}

// ─── Quality Snapshot (per-submission metrics) ────────────
model QualitySnapshot {
  id             String   @id @default(cuid())
  reportId       String   @unique
  report         GradingReport @relation(fields: [reportId], references: [id])
  graderEmail    String
  builderEmail   String
  overallScore   Float
  sectionScores  Json     // { neatness, organization, accuracy, thoroughness }
  issueCount     Int
  issueSummary   Json     // { priceDiscrepancies, capitalizationErrors, ... }
  gradeTimeMs    Int      // how long the grader took
  createdAt      DateTime @default(now())

  @@index([graderEmail])
  @@index([builderEmail])
  @@index([createdAt])
}

// ─── Feedback Email Log ───────────────────────────────────
model FeedbackLog {
  id            String   @id @default(cuid())
  reportId      String
  report        GradingReport @relation(fields: [reportId], references: [id])
  sentTo        String   // builder email
  ccTo          String   // menugradingtoolresponses@squareup.com
  sentBy        String   // grader/lead who triggered
  subject       String
  bodyHtml      String
  status        String   // sent, delivered, bounced, failed
  externalId    String?  // email service message ID for tracking
  createdAt     DateTime @default(now())
}

// ─── AI Models (unchanged) ────────────────────────────────
model AiCorrection {
  id            String   @id @default(cuid())
  reportId      String
  itemName      String
  criterion     String
  aiScore       Float
  userScore     Float
  aiExplanation String
  userReason    String
  context       Json
  createdAt     DateTime @default(now())
  report        GradingReport @relation(fields: [reportId], references: [id])
}

model LearnedRule {
  id           String   @id @default(cuid())
  pattern      String
  description  String
  confidence   Float
  appliedCount Int      @default(0)
  status       String   @default("under_review") // active, under_review, rejected
  evidence     Json     // correction IDs
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model AiGradeLog {
  id            String   @id @default(cuid())
  reportId      String
  itemName      String
  criterion     String
  score         Float
  confidence    Float
  explanation   String
  appliedRules  String[] // learned rule IDs
  model         String   // claude-sonnet-4-20250514, etc.
  promptTokens  Int
  outputTokens  Int
  latencyMs     Int
  createdAt     DateTime @default(now())
}
```

### 7. Per-Builder Pattern Analysis

Claude analyzes quality patterns on a per-builder basis to generate targeted coaching recommendations.

**Trigger:** Runs after every 5th submission for a given builder, or on-demand.

**Prompt Template:**
```
ROLE: You are a Menu Build Quality Analyst. Analyze the grading history for 
this specific builder and identify patterns, strengths, and areas for improvement.

BUILDER: {builderName} ({builderEmail})
TEAM: {builderTeam}
RECENT REPORTS (last N):
{recentReportSummaries}

Provide your analysis as JSON:
{
  "strengths": ["areas where builder consistently scores well"],
  "weaknesses": ["recurring issue patterns"],
  "trend": "improving" | "stable" | "declining",
  "recommendations": ["specific, actionable coaching tips"],
  "comparedToTeam": "above_average" | "average" | "below_average"
}
```

**Output:** Stored per builder, surfaced on Builder Profile page and optionally included in feedback emails as a "coaching summary" section.

### 8. Graceful Degradation

If Claude API is unavailable:
1. All automated checks (title case, pricing, alphabetization, etc.) still run
2. AI-only criteria are marked as "Ungraded — AI Unavailable"
3. Overall score is calculated from automated checks only, with a note
4. User can still manually score the AI-only criteria
5. Retry logic: 3 attempts with exponential backoff (1s, 3s, 9s)
6. Circuit breaker: after 5 consecutive failures, disable AI for 5 minutes

### 9. Cost Management

- **Token budget per menu**: ~4,000 input + ~1,000 output tokens per item
- **Batch optimization**: Group items by category for context-efficient prompting
- **Caching**: Cache extraction results — re-grade without re-extracting
- **Model tiering**: Use Haiku for simple checks, Sonnet for complex grading
- **Monthly estimate**: ~50 menus/day × 30 items × 5k tokens = ~7.5M tokens/month

### 10. Confidence Display in UI

| Confidence | Display | Color |
|------------|---------|-------|
| 0.9 - 1.0 | High confidence | Green |
| 0.7 - 0.89 | Moderate confidence | Amber |
| 0.5 - 0.69 | Low confidence — Review recommended | Orange |
| < 0.5 | Very low — Manual review required | Red |

Each AI-graded item shows a small confidence indicator so users know when to trust the AI vs. review manually.
