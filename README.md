# Menu Grading Tool

AI-powered Menu QA Grading Tool for Square sellers. Built with Next.js 14, TypeScript, and Claude AI.

## What It Does

Enables GSO and BPO team members to QA menu builds for Square sellers by:

1. **Uploading** a seller's physical menu (PDF or image)
2. **Comparing** it against a Square Catalog (API) or Excel export
3. **Grading** against a standardized rubric (Neatness, Organization, Accuracy, Thoroughness)
4. **Producing** a detailed scored report with per-item grades and AI-powered recommendations
5. **Tracking** builder and grader quality over time with trend analytics
6. **Emailing** compiled feedback directly to the menu builder (CC: menugradingtoolresponses@squareup.com)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL + Prisma |
| AI | Anthropic Claude (adaptive learning) |
| PDF/OCR | pdf.js + Tesseract.js + Google Vision |
| Catalog | Square Node.js SDK |
| Charts | Recharts |
| Auth | NextAuth.js |

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your API keys

# Set up database
npx prisma migrate dev

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   ├── ui/          # shadcn/ui primitives
│   ├── upload/      # Upload flow
│   ├── grading/     # Grading engine UI
│   ├── report/      # Report display
│   ├── ai/          # Claude AI panel
│   └── layout/      # Navigation, sidebar
├── lib/             # Core business logic
│   ├── grading/     # Rubric scoring engine
│   ├── parsers/     # PDF, image, Excel parsers
│   ├── square/      # Square API client
│   ├── ai/          # Claude AI integration
│   └── utils/       # Shared utilities
├── prisma/          # Database schema
├── hooks/           # Custom React hooks
├── types/           # TypeScript definitions
└── constants/       # Rubric weights, thresholds
```

## Scoring Rubric

| Section | Weight | Description |
|---------|--------|-------------|
| Neatness | 10 | Capitalization, punctuation, spelling |
| Organization | 30 | Variations, modifiers, menu grid |
| Accuracy | 40 | Auto-add, modifiers, naming, locations |
| Thoroughness | 20 | Special instructions, critical thinking |
| **Total** | **100** | |

## Claude AI Integration

Claude serves as an adaptive learning agent that:
- **Extracts** structured menu data from PDFs and images
- **Grades** subjective rubric criteria with explanations
- **Learns** from user corrections to improve over time
- **Recognizes** patterns across all graded menus
- **Coaches** per-builder recommendations based on quality trends

## Quality Tracking

- **Per-builder quality** — average scores, trend lines, common issues, improvement rate
- **Per-grader metrics** — volume, avg grade time, consistency, override rate
- **Quality snapshots** — every submission captures a point-in-time record for analytics
- **Feedback loop** — compiled QA reports emailed to builders with coaching notes

## License

Internal tool — Block, Inc.
