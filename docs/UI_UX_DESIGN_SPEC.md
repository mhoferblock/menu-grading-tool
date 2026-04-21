# Menu Grading Tool — UI/UX Design Specification

> **Version:** 1.0  
> **Last Updated:** April 21, 2026  
> **Status:** Implementation-Ready  
> **Target Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Design System](#2-design-system)
3. [Component Library Specification](#3-component-library-specification)
4. [Page Layouts](#4-page-layouts)
5. [Interaction Design](#5-interaction-design)
6. [Responsive Strategy](#6-responsive-strategy)
7. [Accessibility](#7-accessibility)
8. [Visual Mood Board](#8-visual-mood-board)

---

## 1. Design Philosophy

### Guiding Principles

1. **Clarity over cleverness** — BPO operators in Guatemala and Manila process hundreds of menus. Every interaction must be immediately comprehensible, even for users whose first language is not English.
2. **Data density without clutter** — QA reports contain dozens of line items. The UI presents dense information through progressive disclosure: summary first, details on demand.
3. **Trust through precision** — Scores and grades must feel authoritative. Visual treatments borrow from credit-score dashboards and financial reporting tools—premium, numerical, confident.
4. **AI as copilot, not black box** — Claude AI features are visually distinguishable from manual grades. Confidence levels, learning indicators, and override affordances keep humans in control.
5. **Speed is a feature** — Skeleton loading states, optimistic UI updates, and keyboard shortcuts keep the grading flow under 3 minutes per menu.

### Reference Aesthetics

| Reference       | What We Borrow                                    |
| --------------- | ------------------------------------------------- |
| **Linear**      | Clean sidebar nav, keyboard-first design, muted palette with strategic accent color |
| **Vercel**      | Card-based layouts, monospace data treatments, subtle gradients on hero metrics |
| **Stripe Docs** | Information hierarchy, expandable sections, inline code/pill treatments |
| **Credit Karma**| Circular score rings, grade letter treatments, animated gauge fills |

---

## 2. Design System

### 2.1 Color Palette

All colors are defined as HSL CSS custom properties for runtime theme switching.

#### Light Mode

| Token                     | HSL Value              | Tailwind Class          | Usage                              |
| ------------------------- | ---------------------- | ----------------------- | ---------------------------------- |
| `--background`            | `0 0% 100%`           | `bg-background`         | Page background                    |
| `--foreground`            | `222 47% 11%`         | `text-foreground`       | Primary text                       |
| `--muted`                 | `210 40% 96%`         | `bg-muted`              | Subtle backgrounds, disabled areas |
| `--muted-foreground`      | `215 16% 47%`         | `text-muted-foreground` | Secondary text, labels             |
| `--card`                  | `0 0% 100%`           | `bg-card`               | Card surfaces                      |
| `--card-foreground`       | `222 47% 11%`         | `text-card-foreground`  | Card text                          |
| `--border`                | `214 32% 91%`         | `border-border`         | Default borders                    |
| `--input`                 | `214 32% 91%`         | `border-input`          | Input borders                      |
| `--primary`               | `221 83% 53%`         | `bg-primary`            | Primary actions, active states     |
| `--primary-foreground`    | `210 40% 98%`         | `text-primary-foreground`| Text on primary                   |
| `--accent`                | `210 40% 96%`         | `bg-accent`             | Hover backgrounds                  |
| `--accent-foreground`     | `222 47% 11%`         | `text-accent-foreground`| Hover text                         |
| `--destructive`           | `0 84% 60%`           | `bg-destructive`        | Errors, critical issues            |
| `--ring`                  | `221 83% 53%`         | `ring-ring`             | Focus rings                        |

#### Dark Mode

| Token                     | HSL Value              | Usage                              |
| ------------------------- | ---------------------- | ---------------------------------- |
| `--background`            | `224 71% 4%`          | Page background                    |
| `--foreground`            | `213 31% 91%`         | Primary text                       |
| `--muted`                 | `223 47% 11%`         | Subtle backgrounds                 |
| `--muted-foreground`      | `215 20% 65%`         | Secondary text                     |
| `--card`                  | `224 71% 4%`          | Card surfaces                      |
| `--border`                | `216 34% 17%`         | Borders                            |
| `--primary`               | `217 91% 60%`         | Primary actions (slightly lighter) |
| `--destructive`           | `0 63% 31%`           | Error backgrounds                  |

#### Semantic / Score Colors

These colors are critical for grading. Each has been tested at 4.5:1 contrast against both light and dark card backgrounds.

| Token              | Light Mode           | Dark Mode            | Usage                          |
| ------------------ | -------------------- | -------------------- | ------------------------------ |
| `--score-excellent`| `142 71% 45%`       | `142 69% 58%`       | A grade, 90-100% (green)       |
| `--score-good`     | `162 63% 41%`       | `162 60% 50%`       | B grade, 80-89% (teal-green)   |
| `--score-average`  | `43 96% 56%`        | `43 96% 65%`        | C grade, 70-79% (amber)        |
| `--score-poor`     | `27 96% 61%`        | `27 92% 65%`        | D grade, 60-69% (orange)       |
| `--score-fail`     | `0 84% 60%`         | `0 72% 63%`         | F grade, <60% (red)            |

#### AI Accent Colors

AI-sourced data uses a distinct violet hue to be immediately distinguishable from manual data.

| Token              | Light Mode           | Dark Mode            | Usage                          |
| ------------------ | -------------------- | -------------------- | ------------------------------ |
| `--ai-primary`     | `262 83% 58%`       | `262 80% 68%`       | AI badges, confidence rings    |
| `--ai-surface`     | `262 47% 97%`       | `262 47% 12%`       | AI panel backgrounds           |
| `--ai-border`      | `262 40% 88%`       | `262 35% 22%`       | AI section borders             |

### 2.2 Typography

Use `Inter` as the primary typeface (loaded via `next/font/google`). Use `JetBrains Mono` for numerical data and scores.

#### Type Scale (rem / px at 16px base)

| Token       | Size       | Weight   | Line Height | Letter Spacing | Tailwind                          | Usage                         |
| ----------- | ---------- | -------- | ----------- | -------------- | --------------------------------- | ----------------------------- |
| `display`   | 3rem / 48  | 700      | 1.1         | -0.02em        | `text-5xl font-bold tracking-tight` | Score hero numbers          |
| `h1`        | 2rem / 32  | 700      | 1.2         | -0.02em        | `text-3xl font-bold tracking-tight` | Page titles                 |
| `h2`        | 1.5rem / 24| 600      | 1.3         | -0.01em        | `text-2xl font-semibold`          | Section headings              |
| `h3`        | 1.25rem/20 | 600      | 1.4         | 0              | `text-xl font-semibold`           | Card titles                   |
| `h4`        | 1.125rem/18| 600      | 1.4         | 0              | `text-lg font-semibold`           | Sub-section headings          |
| `body`      | 1rem / 16  | 400      | 1.6         | 0              | `text-base`                       | Default body text             |
| `body-sm`   | 0.875rem/14| 400      | 1.5         | 0              | `text-sm`                         | Table cells, secondary info   |
| `caption`   | 0.75rem/12 | 500      | 1.4         | 0.02em         | `text-xs font-medium tracking-wide` | Labels, badges, timestamps |
| `mono-lg`   | 1.5rem / 24| 700      | 1           | -0.02em        | `font-mono text-2xl font-bold`    | Score numbers in cards        |
| `mono-sm`   | 0.875rem/14| 500      | 1           | 0              | `font-mono text-sm font-medium`   | Inline data values            |

#### Font Loading

```tsx
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
```

### 2.3 Spacing System

Base unit: **4px**. Primary grid: **8px**. All spacing uses multiples of 4.

| Token  | Value | Tailwind | Usage                                  |
| ------ | ----- | -------- | -------------------------------------- |
| `0.5`  | 2px   | `p-0.5`  | Tight internal padding (badges)        |
| `1`    | 4px   | `p-1`    | Minimum spacing                        |
| `2`    | 8px   | `p-2`    | Default internal padding               |
| `3`    | 12px  | `p-3`    | Compact card padding                   |
| `4`    | 16px  | `p-4`    | Standard card padding, input padding   |
| `5`    | 20px  | `p-5`    | Enhanced padding for hero sections     |
| `6`    | 24px  | `p-6`    | Section padding                        |
| `8`    | 32px  | `p-8`    | Page-level horizontal padding          |
| `10`   | 40px  | `p-10`   | Large section gaps                     |
| `12`   | 48px  | `p-12`   | Page vertical padding                  |
| `16`   | 64px  | `p-16`   | Hero/feature section padding           |

**Layout gaps:**
- Between cards in a grid: `gap-4` (16px)
- Between sections on a page: `gap-8` (32px) or `gap-10` (40px)
- Sidebar to content area: `gap-0` (border separator, not gap)
- Between form fields: `gap-4` (16px) vertically, `gap-6` (24px) for field groups

### 2.4 Border Radius Tokens

| Token     | Value | Tailwind       | Usage                              |
| --------- | ----- | -------------- | ---------------------------------- |
| `sm`      | 4px   | `rounded-sm`   | Badges, pills, small elements      |
| `md`      | 6px   | `rounded-md`   | Buttons, inputs                    |
| `lg`      | 8px   | `rounded-lg`   | Cards, modals                      |
| `xl`      | 12px  | `rounded-xl`   | Large cards, featured sections     |
| `2xl`     | 16px  | `rounded-2xl`  | Hero metric cards                  |
| `full`    | 9999px| `rounded-full` | Avatars, score rings, pill badges  |

### 2.5 Shadow / Elevation System

Flat-first approach. Shadows are used sparingly—primarily for floating elements (dropdowns, modals, toasts). Cards rely on borders rather than shadows for definition.

| Token      | Value                                                             | Tailwind        | Usage                        |
| ---------- | ----------------------------------------------------------------- | --------------- | ---------------------------- |
| `none`     | `none`                                                            | `shadow-none`   | Default for cards (use border)|
| `sm`       | `0 1px 2px 0 rgb(0 0 0 / 0.05)`                                 | `shadow-sm`     | Slight lift on hover         |
| `md`       | `0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)` | `shadow-md` | Dropdowns, popovers         |
| `lg`       | `0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)` | `shadow-lg` | Modals, slide-overs        |
| `glow`     | `0 0 0 3px hsl(var(--primary) / 0.15)`                           | Custom          | Focus glow on score rings    |
| `ai-glow`  | `0 0 0 3px hsl(var(--ai-primary) / 0.12)`                        | Custom          | AI element focus glow        |

**Card elevation pattern:**
```
Default:   border border-border rounded-lg bg-card
Hover:     border border-border rounded-lg bg-card shadow-sm transition-shadow
Active:    border border-primary/30 rounded-lg bg-card ring-1 ring-primary/20
```

### 2.6 Dark Mode Implementation

- Toggle via `next-themes` (`ThemeProvider` wrapping `<html>`).
- CSS variables switch at `html.dark` scope.
- Default: follow system preference. Manual toggle in header.
- All score colors have separate dark-mode values (see Section 2.1).
- Score rings use slightly higher saturation in dark mode for visibility.
- AI accent surfaces use `hsl(262 47% 12%)` in dark mode to prevent eye strain.

---

## 3. Component Library Specification

All components extend or compose from shadcn/ui primitives. Custom components are documented below with their states, treatments, and responsive behavior.

### 3.1 Navigation

#### Sidebar Navigation

**Component:** Custom `<AppSidebar />` using shadcn `Sheet` for mobile, static for desktop.

**Structure:**
```
┌──────────────────┐
│  ◆ Menu Grader   │  ← Logo + app name (font-semibold text-lg)
│                  │
│  ──────────────  │  ← Separator
│                  │
│  🏠 Dashboard    │  ← nav items: icon (16px) + label (text-sm)
│  📤 Grade Menu   │     Active: bg-accent text-accent-foreground
│  📊 Reports      │     Hover: bg-accent/50
│  📈 Analytics    │     Icon: text-muted-foreground, active: text-primary
│  🤖 AI Insights  │
│                  │
│  ──────────────  │
│                  │
│  ⚙️ Settings     │  ← Bottom-pinned
│                  │
│  ┌────────────┐  │
│  │ 👤 M. Hofer│  │  ← User avatar + name, role badge
│  │  GSO Admin  │  │     Click → profile dropdown
│  └────────────┘  │
└──────────────────┘
```

**Specs:**
- Width: `w-64` (256px) desktop, full slide-over on mobile
- Background: `bg-card` with `border-r border-border`
- Collapsible to icon-only mode: `w-16` with tooltip labels
- Active indicator: `bg-accent` background + `border-l-2 border-primary` left accent bar
- Transition: `transition-all duration-200 ease-in-out`

**shadcn components:** `Sheet`, `Button` (ghost variant), `Avatar`, `Separator`, `Tooltip`

#### Breadcrumbs

**Component:** shadcn `Breadcrumb`

**Placement:** Top of content area, below page header, in a `h-10` bar.

```
Dashboard / Reports / Menu #1247 — Joe's Diner
```

- Separator: `ChevronRight` icon (12px, `text-muted-foreground`)
- Current page: `text-foreground font-medium` (not a link)
- Ancestors: `text-muted-foreground hover:text-foreground` (clickable)
- Truncation: Middle items collapse to `...` popover when > 4 items

### 3.2 Upload Area

**Component:** Custom `<FileUploadZone />` with `react-dropzone`

#### States

**Idle:**
```
┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
│                                           │
│            📄 (Upload icon, 48px)          │
│                                           │
│   Drag & drop your menu file here         │  ← text-base text-muted-foreground
│   or click to browse                      │  ← text-sm text-muted-foreground/70
│                                           │
│   PDF, PNG, JPG up to 25 MB              │  ← text-xs text-muted-foreground/50
│                                           │
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
```
- Border: `border-2 border-dashed border-border rounded-xl`
- Background: `bg-muted/30`
- Height: `min-h-[200px]`
- Cursor: `cursor-pointer`
- Full area is clickable

**Hovering (drag over):**
- Border: `border-2 border-dashed border-primary rounded-xl`
- Background: `bg-primary/5`
- Icon scales: `scale-110 transition-transform`
- Label changes to: "Drop to upload"
- Subtle pulse animation on border: `animate-pulse` (slowed to 2s)

**Uploading:**
```
┌──────────────────────────────────────────┐
│  📄 joes-diner-menu.pdf                  │
│  ████████████░░░░░░░░  62%               │  ← shadcn Progress bar
│  2.4 MB of 3.8 MB · 12s remaining       │  ← text-xs text-muted-foreground
│                                    [✕]   │  ← Cancel button (ghost, destructive)
└──────────────────────────────────────────┘
```
- Border changes to solid: `border border-border rounded-xl`
- Progress bar: shadcn `Progress` with `bg-primary`
- File icon: inferred from mime type (PDF icon, Image icon)

**Processing (AI extraction):**
```
┌──────────────────────────────────────────┐
│  ✅ joes-diner-menu.pdf uploaded          │
│                                           │
│  🤖 Claude is reading the menu...         │  ← AI accent color, animated dots
│  ●●●○○  Extracting items (34 found)      │  ← Step indicator
│                                           │
│  [Shimmer loading bar — ai-primary hue]  │
└──────────────────────────────────────────┘
```
- AI processing uses `--ai-primary` colored progress indicator
- Pulsing dot animation (`animate-pulse`) on status text
- Step counter updates in real-time via SSE

**Complete:**
```
┌──────────────────────────────────────────┐
│  ✅ joes-diner-menu.pdf                   │
│  47 items extracted · 3 pages scanned    │
│                                           │
│  [View Extracted Items]  [Re-upload]     │
└──────────────────────────────────────────┘
```
- Border: `border border-score-excellent/30 rounded-xl`
- Background: `bg-score-excellent/5`
- Success icon: `CheckCircle2` in `text-score-excellent`

**Error:**
```
┌──────────────────────────────────────────┐
│  ❌ Upload failed                         │
│  File appears to be corrupted.           │
│  Supported: PDF, PNG, JPG (max 25 MB)   │
│                                           │
│  [Try Again]                             │
└──────────────────────────────────────────┘
```
- Border: `border border-destructive/30 rounded-xl`
- Background: `bg-destructive/5`
- Error icon: `AlertCircle` in `text-destructive`

### 3.3 Score Displays

#### Circular Progress Ring

**Component:** Custom `<ScoreRing />` using SVG

**Anatomy:**
```
        ╭───────╮
      ╱    92    ╲      ← Score number: font-mono text-3xl font-bold
     │    / 100    │     ← Denominator: font-mono text-sm text-muted-foreground
      ╲    A     ╱      ← Letter grade: text-lg font-bold, score color
        ╰───────╯
         ████████░░      ← Ring track (muted) + filled arc (score color)
```

**Specs:**
- SVG-based, 120px × 120px default (configurable via `size` prop)
- Track: `stroke: hsl(var(--muted))`, `stroke-width: 8`
- Fill arc: stroke color from score tier, `stroke-width: 8`, `stroke-linecap: round`
- Animated on mount: `stroke-dashoffset` transition over 1.2s, `ease-out`
- Center text positioned with SVG `<text>` elements for crisp rendering
- Score number: `hsl(var(--foreground))`
- Letter grade: colored per score tier
- Sizes: `sm` (80px), `md` (120px), `lg` (160px), `xl` (200px, for report hero)

**Score tier mapping:**

| Range   | Grade | Color Token        | Ring Fill Animation |
| ------- | ----- | ------------------ | ------------------- |
| 90–100  | A     | `--score-excellent`| Smooth, confident   |
| 80–89   | B     | `--score-good`     | Smooth              |
| 70–79   | C     | `--score-average`  | Smooth              |
| 60–69   | D     | `--score-poor`     | Smooth              |
| 0–59    | F     | `--score-fail`     | Smooth              |

#### Horizontal Bar Gauge

**Component:** Custom `<BarGauge />` composing shadcn `Progress`

```
Neatness          ████████████████████░░░  85%
Organization      █████████████████░░░░░░  72%
Accuracy          ████████████████████████  96%
Thoroughness      ██████████████████░░░░░  78%
```

**Specs:**
- Label: `text-sm font-medium text-foreground` left-aligned
- Percentage: `font-mono text-sm font-medium` right-aligned, score-colored
- Bar: height `h-2 rounded-full`, background `bg-muted`, fill colored per score tier
- Animated on mount: width transition `transition-all duration-1000 ease-out`
- Delay stagger: each bar delays 100ms after the previous for cascade effect

#### Letter Grade Badge

**Component:** Custom `<GradeBadge />`

```
[ A ]    [ B+ ]    [ C- ]    [ F ]
```

- Size: `h-8 w-8` (single letter) or `h-8 px-2` (with modifier)
- Border radius: `rounded-md`
- Background: score color at 10% opacity
- Text: score color at 100%, `font-mono font-bold text-sm`
- Border: `border` in score color at 20% opacity
- Hover: background opacity increases to 15%

### 3.4 Report Cards

#### Item Grade Card

**Component:** Custom `<ItemGradeCard />` using shadcn `Collapsible`

**Collapsed state:**
```
┌──────────────────────────────────────────────────────────────┐
│  [A]  Pepperoni Pizza — Large          $18.99    ✅ Match    │
│                                                     ▼       │
└──────────────────────────────────────────────────────────────┘
```

**Expanded state:**
```
┌──────────────────────────────────────────────────────────────┐
│  [A]  Pepperoni Pizza — Large          $18.99    ✅ Match    │
│  ─────────────────────────────────────────────────────────── │
│                                                              │
│  Menu Says              Catalog Has           Status         │
│  ──────────             ──────────            ──────         │
│  Pepperoni Pizza        Pepperoni Pizza       ✅ Name OK     │
│  Large                  Large                 ✅ Size OK     │
│  $18.99                 $18.99                ✅ Price OK     │
│  "Fresh mozzarella..."  "Fresh mozzarella..." ✅ Desc OK     │
│                                                              │
│  Issues: None                                                │
│                                                     ▲       │
└──────────────────────────────────────────────────────────────┘
```

**With issues:**
```
┌──────────────────────────────────────────────────────────────┐
│  [C]  Chicken Wrap — Regular           $12.99    ⚠️ Issues   │
│  ─────────────────────────────────────────────────────────── │
│                                                              │
│  Menu Says              Catalog Has           Status         │
│  ──────────             ──────────            ──────         │
│  Chicken Wrap           Grilled Chicken Wrap  ⚠️ Name Diff   │
│  Regular                Regular               ✅ Size OK     │
│  $12.99                 $13.49                ❌ Price Wrong  │
│  (no description)       "Grilled chicken..."  ❌ Missing Desc │
│                                                              │
│  Issues:                                                     │
│  [Price Mismatch]  [Missing Description]  [Name Variation]  │ ← Issue pills
│                                                              │
│  🤖 Claude note: "This price difference ($0.50) may be a    │ ← AI insight
│     seasonal adjustment. Seen in 3 other menus this week."  │    callout box
│                                                     ▲       │
└──────────────────────────────────────────────────────────────┘
```

**Specs:**
- Container: `border border-border rounded-lg overflow-hidden`
- Left accent: `border-l-4` colored by score tier
- Collapsed row: `px-4 py-3 flex items-center gap-3`
- Grade badge: `<GradeBadge />` component
- Item name: `text-sm font-medium text-foreground`
- Price: `font-mono text-sm`
- Status badge: pill using `<Badge />` shadcn component
- Expand trigger: `ChevronDown` icon, rotates 180° on expand (`transition-transform duration-200`)
- Expanded content: `px-4 pb-4` with comparison table
- Issue pills: `<Badge variant="outline" />` colored by severity (red: error, amber: warning, blue: info)
- AI insight callout: `bg-ai-surface border border-ai-border rounded-md p-3 text-sm` with `Sparkles` icon

**Responsive:** On mobile, comparison table stacks vertically (menu says → catalog has → status per row).

### 3.5 Data Tables

**Component:** shadcn `Table` + `@tanstack/react-table`

**Structure:**
```
┌──────────────────────────────────────────────────────────────────┐
│  🔍 Search menus...          [Filter ▾]  [Sort ▾]  [Export ▾]  │
├──────────────────────────────────────────────────────────────────┤
│  ☐  Seller          Date       Score  Grade  Grader    Status   │
│  ─  ──────          ────       ─────  ─────  ──────    ──────   │
│  ☐  Joe's Diner     Apr 20     92%    [A]    M. Cruz   ✅ Done  │  ← row hover: bg-muted/50
│  ☐  Taco Palace     Apr 20     78%    [C+]   R. Santos ✅ Done  │
│  ☐  Sushi Express   Apr 19     —      —      —         🔄 Pend │  ← pending: text-muted-foreground
│  ☐  Pizza House     Apr 19     45%    [F]    M. Cruz   ⚠️ Flag │  ← flagged: bg-destructive/5
├──────────────────────────────────────────────────────────────────┤
│  Showing 1-20 of 847          [◀ Prev]  1 2 3 ... 43  [Next ▶] │
└──────────────────────────────────────────────────────────────────┘
```

**Specs:**
- Header: `bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider`
- Rows: `h-12 border-b border-border hover:bg-muted/50 transition-colors`
- Row status coloring:
  - Flagged rows: `bg-destructive/5` subtle red tint
  - Pending rows: entire row text `text-muted-foreground`
  - Normal rows: default styling
- Sorting: click column header toggles `asc → desc → none`, indicator arrow
- Filtering: popover filter panel using shadcn `Popover` + `Command` for search-select
- Pagination: shadcn `Pagination` component at bottom
- Bulk actions: checkbox column, sticky action bar appears when items selected
- Row click: navigates to report detail view
- Score column: uses `<GradeBadge />` component

**Responsive:**
- ≥1024px: Full table with all columns
- <1024px: Hide grader and date columns, compress to essential info
- <640px: Switch to card list view (`<MobileReportCard />` stacked)

### 3.6 AI Insights Panel

**Component:** Custom `<AIInsightsPanel />`

This panel is visually distinct from all manual-grade UI. It uses the AI color palette consistently.

**Placement:** Either as a sidebar panel (on report pages) or as an expandable section (on grade cards).

**Panel Design:**
```
┌─ AI Insights ──────────────────────────── 🤖 ──┐
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  💡 Pattern Detected                       │  │
│  │  This menu has the same layout as 12       │  │
│  │  other menus from "Fast Casual Group."     │  │
│  │  Claude accuracy for this format: 94%      │  │
│  │                           [View Pattern →] │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  Confidence: ████████████░░ 87%                  │  ← Confidence bar
│                                                  │
│  Learning this session:                          │
│  • Price rounding rules for this seller ✓        │  ← Green check = learned
│  • Modifier grouping conventions ●               │  ← Dot = learning in progress
│  • Spanish menu term translations ○              │  ← Circle = not yet learned
│                                                  │
│  ──────────────────────────────────────────────  │
│  📊 Claude Stats                                 │
│  Menus analyzed: 2,847                           │
│  Accuracy rate: 91.3%                            │
│  Avg time saved: 4.2 min / menu                  │
└──────────────────────────────────────────────────┘
```

**Visual Treatment:**
- Container: `bg-ai-surface border border-ai-border rounded-xl`
- Header: `text-sm font-semibold` with `Sparkles` icon in `text-ai-primary`
- All AI badges use `bg-ai-primary/10 text-ai-primary border-ai-primary/20`
- Confidence bar: `bg-ai-primary` fill on `bg-muted` track
- Learning indicators: three-state (learned ✓ green, learning ● amber, pending ○ muted)

**Confidence Indicator:**
- Shown next to every AI-generated grade or suggestion
- Visual: small `<ScoreRing size="sm" />` in AI purple hue
- Tooltip on hover: "Claude is 87% confident in this grade based on 2,847 similar items"

**Override Workflow:**
1. AI suggests grade → shown with purple AI badge
2. User can click "Override" → inline edit appears
3. User selects corrected grade → confirmation dialog
4. System records correction → toast: "Claude will learn from this correction"
5. AI panel updates learning feed in real-time

### 3.7 Toast / Notification System

**Component:** shadcn `Sonner` (toast library integration)

**Position:** Bottom-right, stacked upward. Max 3 visible.

**Variants:**

| Variant   | Icon           | Border Color        | Usage                          |
| --------- | -------------- | ------------------- | ------------------------------ |
| `success` | `CheckCircle2` | `border-score-excellent/30` | File uploaded, grade saved    |
| `error`   | `AlertCircle`  | `border-destructive/30`     | Upload failed, API error      |
| `warning` | `AlertTriangle`| `border-score-average/30`   | Low confidence, data mismatch |
| `info`    | `Info`         | `border-primary/30`         | Processing started, tip       |
| `ai`      | `Sparkles`     | `border-ai-primary/30`      | Claude insight, learning event|

**Specs:**
- Width: `w-96` (384px)
- Padding: `p-4`
- Border radius: `rounded-lg`
- Shadow: `shadow-lg`
- Auto-dismiss: 5s (success/info), 8s (warning), persistent (error, until dismissed)
- Animation: slide in from right + fade, `duration-300`
- Action button: optional, `text-sm font-medium text-primary`

### 3.8 Modal Dialogs

**Component:** shadcn `Dialog` and `AlertDialog`

**Confirmation Modal (e.g., "Submit Grade"):**
```
┌──────────────────────────────────────┐
│  Submit QA Grade?                    │
│  ──────────────────────────────────  │
│                                      │
│  You're about to submit the grade    │
│  for "Joe's Diner — Lunch Menu"      │
│                                      │
│  Overall Score: 92% (A)              │
│  Items Graded: 47                    │
│  Issues Found: 3                     │
│                                      │
│  This action cannot be undone.       │
│                                      │
│           [Cancel]  [Submit Grade]   │
└──────────────────────────────────────┘
```

**Specs:**
- Overlay: `bg-black/50 backdrop-blur-sm`
- Container: `bg-card border border-border rounded-xl shadow-lg max-w-md mx-auto`
- Title: `text-lg font-semibold`
- Body: `text-sm text-muted-foreground`
- Footer: `flex justify-end gap-3`
- Primary action: shadcn `Button` default variant
- Cancel: shadcn `Button` outline variant
- Animation: fade in overlay (150ms) + scale up content (200ms, `ease-out`)
- Close: X button top-right, Escape key, overlay click

**Detail View Modal (e.g., "Item Comparison"):**
- Uses `Dialog` with `max-w-2xl` width
- Scrollable body with `max-h-[70vh] overflow-y-auto`
- Sticky header and footer

---

## 4. Page Layouts

### 4.1 Dashboard / Home

**URL:** `/dashboard`

**Layout Structure:**
```
┌─────────┬───────────────────────────────────────────────────────┐
│         │  Dashboard                              [🌙] [👤]    │
│         │                                                       │
│         │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│         │  │ Graded  │ │ Avg     │ │ Pending │ │ AI      │   │
│  Side   │  │ Today   │ │ Score   │ │ Review  │ │ Accuracy│   │
│  bar    │  │   24    │ │  87%    │ │    7    │ │  91.3%  │   │
│         │  │ +3 ↑    │ │ [B+]   │ │ -2 ↓   │ │ +0.5↑   │   │
│  Nav    │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│         │                                                       │
│         │  ┌─────────────────────┐ ┌───────────────────────┐   │
│         │  │  Recent Activity    │ │  Quick Actions         │   │
│         │  │  ────────────────── │ │  ─────────────────     │   │
│         │  │  M. Cruz graded     │ │  [📤 Grade New Menu]  │   │
│         │  │  "Taco Palace"  2m  │ │  [📋 View Queue]      │   │
│         │  │                     │ │  [📊 Weekly Report]    │   │
│         │  │  AI learned new     │ │  [🤖 AI Dashboard]    │   │
│         │  │  pattern        5m  │ │                        │   │
│         │  │                     │ │                        │   │
│         │  │  R. Santos flagged  │ │                        │   │
│         │  │  "Pizza House"  8m  │ │                        │   │
│         │  └─────────────────────┘ └───────────────────────┘   │
│         │                                                       │
│         │  ┌────────────────────────────────────────────────┐   │
│         │  │  Team Performance — This Week                  │   │
│         │  │  ──────────────────────────────────────────    │   │
│         │  │  M. Cruz      ████████████████████  47 menus  │   │
│         │  │  R. Santos    ██████████████         32 menus  │   │
│         │  │  A. Garcia    ████████████           28 menus  │   │
│         │  │  J. Reyes     █████████             21 menus   │   │
│         │  └────────────────────────────────────────────────┘   │
│         │                                                       │
└─────────┴───────────────────────────────────────────────────────┘
```

**Component Breakdown:**

**Quick Stats Strip:**
- Layout: `grid grid-cols-4 gap-4` (stacks to `grid-cols-2` on tablet, `grid-cols-1` on mobile)
- Each stat card: shadcn `Card` with `p-4`
  - Label: `text-xs font-medium text-muted-foreground uppercase tracking-wide`
  - Value: `font-mono text-3xl font-bold text-foreground`
  - Trend indicator: `text-xs` with `ArrowUp` (green) or `ArrowDown` (red) icon + percentage
  - Score card includes `<GradeBadge />` inline

**Recent Activity Feed:**
- Component: Custom `<ActivityFeed />` using shadcn `ScrollArea`
- Max height: `max-h-[400px]`
- Each activity item: avatar (24px) + description + relative timestamp
- Activity types distinguished by icon: grade (CheckCircle), flag (AlertTriangle), AI (Sparkles), upload (Upload)
- Relative time: `text-xs text-muted-foreground` right-aligned
- "View All" link at bottom

**Quick Actions:**
- Layout: vertical stack of shadcn `Button variant="outline"` with icons
- Primary action ("Grade New Menu"): `variant="default"` (filled primary)
- Hover: subtle background shift + icon color change

**Team Performance:**
- Horizontal bar chart using Recharts `<BarChart layout="vertical" />`
- Avatar + name left, bar + count right
- Bars colored in `--primary` with subtle gradient
- Tooltip on hover: "47 menus graded, avg score 89%"
- Click row: navigate to individual reviewer's page

### 4.2 Upload & Grade Flow

**URL:** `/grade/new`

**Wizard Structure:** 3-step flow using a custom `<GradingWizard />` component.

#### Step Indicator Bar
```
  ① Upload Menu ──────── ② Connect Catalog ──────── ③ Review & Grade
     ✅ Complete             ● Active                   ○ Pending
```
- Position: top of content area, `py-6`
- Steps connected by lines: `border-t-2`
- Complete step: `border-primary`, circle filled `bg-primary text-white`
- Active step: `border-primary`, circle outlined `border-2 border-primary`, pulsing dot inside
- Pending step: `border-muted`, circle `bg-muted text-muted-foreground`
- Step labels: `text-sm font-medium` (active/complete) or `text-sm text-muted-foreground` (pending)

#### Step 1: Upload Menu

Full-width `<FileUploadZone />` component (see Section 3.2). Below the zone:

- Accepted formats reminder: `text-xs text-muted-foreground`
- Recent uploads list (last 5): clickable to re-grade
- Tip banner: `bg-muted rounded-lg p-3 text-sm` — "Tip: For best results, ensure the menu is well-lit and text is legible"

#### Step 2: Connect Catalog

```
┌──────────────────────────────────────────────────────────────┐
│  Connect Square Catalog                                       │
│                                                               │
│  ┌────────────────────────┐  ┌────────────────────────┐      │
│  │  🔗 Square API          │  │  📊 Excel Upload        │      │
│  │                         │  │                         │      │
│  │  Connect directly to    │  │  Upload a catalog       │      │
│  │  the seller's Square    │  │  export spreadsheet     │      │
│  │  catalog via API        │  │                         │      │
│  │                         │  │                         │      │
│  │  [Connect →]            │  │  [Upload File →]        │      │
│  └────────────────────────┘  └────────────────────────┘      │
│                                                               │
│  ── OR ──                                                     │
│                                                               │
│  🔍 Search seller: [                                    ]    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

- Two option cards: `grid grid-cols-2 gap-4`
- Each card: shadcn `Card` with `p-6`, hover `shadow-sm`, click selects
- Selected card: `border-primary ring-1 ring-primary/20`
- OR divider: horizontal rule with centered "OR" label
- Seller search: shadcn `Command` component with combobox behavior
- After catalog loaded: summary card showing item count, categories, last updated date

#### Step 3: Review & Grade — Split Pane View

This is the core grading interface. It uses a horizontally split view.

```
┌──────────────────────────────┬──────────────────────────────┐
│  MENU PREVIEW                │  CATALOG COMPARISON           │
│  ──────────                  │  ──────────────               │
│                              │                               │
│  ┌────────────────────────┐  │  🔍 Search items...           │
│  │                        │  │                               │
│  │   [Menu Image/PDF      │  │  ┌──────────────────────┐    │
│  │    rendered here        │  │  │ Pepperoni Pizza  $18 │    │
│  │    with zoom/pan]       │  │  │ ✅ Matched           │    │
│  │                        │  │  └──────────────────────┘    │
│  │   📍 Click to annotate  │  │  ┌──────────────────────┐    │
│  │                        │  │  │ Chicken Wrap    $13  │    │
│  │                        │  │  │ ⚠️ Price mismatch    │    │
│  └────────────────────────┘  │  └──────────────────────┘    │
│                              │  ┌──────────────────────┐    │
│  Page: [◀ 1/3 ▶]            │  │ Caesar Salad    $11  │    │
│  Zoom: [−] 100% [+] [Fit]   │  │ ❌ Not on menu       │    │
│                              │  └──────────────────────┘    │
│  Annotations: 3 ●           │                               │
│                              │  Items: 47 total              │
│                              │  ✅ 39 matched  ⚠️ 5 issues  │
│                              │  ❌ 3 missing                 │
│                              │                               │
│                              │  [🤖 Auto-Grade]  [Submit →] │
└──────────────────────────────┴──────────────────────────────┘
```

**Left Pane — Menu Preview:**
- Component: Custom `<MenuViewer />` using `react-pdf` for PDFs, native `<img>` for images
- Controls: zoom (slider + buttons), fit-to-width, page navigation for multi-page PDFs
- Annotation layer: overlay `<canvas>` or SVG layer
  - Click on menu image → creates annotation pin (numbered circle)
  - Annotation pins: `w-6 h-6 rounded-full bg-destructive text-white text-xs font-bold` with number
  - Pin hover: tooltip showing annotation note
  - Annotation sidebar: slide-in list of all annotations with notes
- Pane resize: draggable divider between left/right panes (`react-resizable-panels`)
- Minimum width: 400px per pane

**Right Pane — Catalog Comparison:**
- Search bar: shadcn `Input` with search icon at top (filters item list)
- Item list: virtual scrolled list (`@tanstack/react-virtual`) for performance with large catalogs
- Each item card: `<ItemGradeCard />` (collapsed, see Section 3.4)
- Summary bar at bottom: sticky, shows match/issue/missing counts
- "Auto-Grade" button: triggers Claude AI grading, uses AI accent styling (`bg-ai-primary text-white`)
- "Submit" button: primary action, opens confirmation modal

**Annotation System:**
1. User clicks "Annotate" mode toggle (or presses `A` key)
2. Cursor changes to crosshair on menu image
3. Click places a numbered pin
4. Popover appears for note entry (shadcn `Popover` with `Textarea`)
5. Pin links to specific catalog item (dropdown select in popover)
6. Annotation appears in right pane next to matched item
7. All annotations persist and appear in final report

### 4.3 QA Report View

**URL:** `/reports/:id`

**Layout:**
```
┌─────────┬───────────────────────────────────────────────────────┐
│         │  ← Back to Reports                    [Export ▾][Share]│
│         │                                                       │
│         │  ┌────────────────────────────────────────────────┐   │
│         │  │           QA Report: Joe's Diner               │   │
│         │  │           Lunch Menu — April 20, 2026          │   │
│  Side   │  │                                                │   │
│  bar    │  │     ╭──────╮                                   │   │
│         │  │    ╱  92   ╲    Neatness       ████████ 90%    │   │
│  Nav    │  │   │  /100   │   Organization   ██████   85%    │   │
│         │  │    ╲  A    ╱    Accuracy       █████████ 96%   │   │
│         │  │     ╰──────╯    Thoroughness   ███████  88%    │   │
│         │  │                                                │   │
│         │  │  Graded by: M. Cruz  ·  47 items  ·  3 issues │   │
│         │  └────────────────────────────────────────────────┘   │
│         │                                                       │
│         │  ┌─ Section Breakdown ────────────────────────────┐   │
│         │  │                                                │   │
│         │  │  Appetizers (12 items)        ████████ 94% [A] │   │
│         │  │  Entrées (18 items)           ███████  88% [B+]│   │
│         │  │  Desserts (8 items)           █████████ 96% [A]│   │
│         │  │  Beverages (9 items)          ██████   82% [B-]│   │
│         │  └────────────────────────────────────────────────┘   │
│         │                                                       │
│         │  ┌─ Item Details ─────────────────────────────────┐   │
│         │  │  [All] [Issues Only] [AI Flagged]     🔍 Search │   │
│         │  │                                                │   │
│         │  │  [A] Pepperoni Pizza — Lg      $18.99  ✅ Match │   │
│         │  │  [A] Margherita Pizza — Lg     $16.99  ✅ Match │   │
│         │  │  [C] Chicken Wrap — Reg        $12.99  ⚠️ Issue │   │ ← expandable
│         │  │  [A] Caesar Salad — Reg        $11.99  ✅ Match │   │
│         │  │  ...                                           │   │
│         │  └────────────────────────────────────────────────┘   │
│         │                                                       │
│         │  ┌─ 🤖 AI Recommendations ───────────────────────┐   │
│         │  │                                                │   │
│         │  │  3 suggestions for this menu:                  │   │
│         │  │                                                │   │
│         │  │  1. Price mismatch on "Chicken Wrap" may be   │   │
│         │  │     a seasonal update. Verify with seller.     │   │
│         │  │                                                │   │
│         │  │  2. 2 items missing descriptions. Common for   │   │
│         │  │     this seller's menu format.                 │   │
│         │  │                                                │   │
│         │  │  3. Consider re-grading "Beverages" section — │   │
│         │  │     modifier structure differs from standard.  │   │
│         │  │                                                │   │
│         │  └────────────────────────────────────────────────┘   │
│         │                                                       │
│         │  [📄 Export PDF]  [📊 Export CSV]  [🔗 Share Link]    │
│         │                                                       │
└─────────┴───────────────────────────────────────────────────────┘
```

**Hero Section:**
- Full-width card: `bg-card border border-border rounded-xl p-8`
- Left: `<ScoreRing size="xl" />` (200px) with animated fill on page load
- Right: four `<BarGauge />` components for rubric dimensions
- Bottom: metadata row with avatar, grader name, item count, issue count, timestamp
- Background: subtle gradient from `bg-card` to `bg-muted/30` (left to right)

**Section Breakdown:**
- Collapsible sections using shadcn `Collapsible`
- Each section header: category name + item count + section score bar + grade badge
- Expand reveals the item cards within that category
- Animated bar chart: Recharts horizontal bars, staggered animation on scroll-into-view

**Item Details:**
- Filter tabs: shadcn `Tabs` — "All", "Issues Only", "AI Flagged"
- Search: shadcn `Input` with `Search` icon, filters items in real-time
- List of `<ItemGradeCard />` components (see Section 3.4)
- Virtual scrolling for lists > 50 items

**Side-by-Side Comparison:**
Accessible via "Compare" button on any item card. Opens in a modal or slide-over:

```
┌──────────────────────┬──────────────────────┐
│  MENU SHOWS          │  CATALOG HAS          │
│  ─────────           │  ──────────           │
│                      │                       │
│  Chicken Wrap        │  Grilled Chicken Wrap │  ← diff highlighted
│  Regular             │  Regular              │
│  $12.99              │  $13.49               │  ← diff highlighted in red/green
│  (no description)    │  "Grilled chicken..." │  ← missing shown in red
│                      │                       │
│  Modifiers:          │  Modifiers:           │
│  - Extra cheese +$2  │  - Extra cheese +$2   │
│  - Add avocado +$3   │  - Add avocado +$2.50 │  ← diff highlighted
│                      │  - Add bacon +$2      │  ← in catalog only: green bg
└──────────────────────┴──────────────────────┘
```

- Diff highlighting: additions in `bg-score-excellent/10`, removals in `bg-destructive/10`, changes in `bg-score-average/10`
- Text diffs: inline `<mark>` tags with appropriate background color

**AI Recommendations Section:**
- Container: `bg-ai-surface border border-ai-border rounded-xl p-6`
- Header: `Sparkles` icon + "AI Recommendations" in `text-ai-primary font-semibold`
- Each recommendation: numbered, `text-sm`, with action link ("Verify", "Re-grade", "Dismiss")
- Dismissible: X button per recommendation, feeds back to Claude learning

**Export Actions:**
- Button group at page bottom: `flex gap-3`
- PDF Export: generates formatted report with all scores, issues, and recommendations
- CSV Export: tabular data for spreadsheet analysis
- Share Link: copies a shareable URL, toast confirmation
- All use shadcn `Button variant="outline"` with appropriate icons

### 4.4 History & Analytics

**URL:** `/history` and `/analytics`

#### History Page (`/history`)

Top section: filter bar
```
[Date Range ▾]  [Grader ▾]  [Score Range ▾]  [Status ▾]  [🔍 Search seller...]
```
- Filters: shadcn `Popover` + `Calendar` (date range), `Select` (grader), `Slider` (score range)
- All filters combine as AND conditions
- Active filter count badge on filter button
- "Clear All Filters" link when any active

Main content: `<DataTable />` (see Section 3.5) with all report history.

#### Analytics Page (`/analytics`)

```
┌─────────┬───────────────────────────────────────────────────────┐
│         │  Analytics                     [This Week ▾] [Export] │
│         │                                                       │
│         │  ┌──────────────────────────────────────────────┐     │
│  Side   │  │  Score Trends — Last 30 Days                 │     │
│  bar    │  │  [Line chart: avg score over time]           │     │
│         │  │  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~    │     │
│         │  └──────────────────────────────────────────────┘     │
│         │                                                       │
│         │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│         │  │ Grade Dist.  │ │ Common Issues│ │ Category     │  │
│         │  │ [Donut chart]│ │ [Horiz bars] │ │ Performance  │  │
│         │  │  A: 45%      │ │ Price: 34%   │ │ [Radar chart]│  │
│         │  │  B: 30%      │ │ Desc:  28%   │ │              │  │
│         │  │  C: 15%      │ │ Name:  22%   │ │              │  │
│         │  │  D:  7%      │ │ Mod:   16%   │ │              │  │
│         │  │  F:  3%      │ │              │ │              │  │
│         │  └──────────────┘ └──────────────┘ └──────────────┘  │
│         │                                                       │
│         │  ┌──────────────────────────────────────────────┐     │
│         │  │  Team Comparison                             │     │
│         │  │  [Grouped bar chart: grader × metric]        │     │
│         │  └──────────────────────────────────────────────┘     │
│         │                                                       │
│         │  ┌──────────────────────────────────────────────┐     │
│         │  │  Individual Reviewer: [M. Cruz ▾]            │     │
│         │  │  Menus: 234  Avg Score: 89%  Avg Time: 4.2m │     │
│         │  │  [Performance sparkline over last 30 days]   │     │
│         │  │  Top issue type: Price mismatches (38%)      │     │
│         │  └──────────────────────────────────────────────┘     │
│         │                                                       │
└─────────┴───────────────────────────────────────────────────────┘
```

**Charts (all using Recharts):**

- **Score Trends:** `<LineChart>` with area fill gradient. Smooth curves (`type="monotone"`). Tooltip shows exact values. Optional comparison overlay (this week vs last week).
- **Grade Distribution:** `<PieChart>` (donut variant). Each slice colored by score tier. Center label: total count. Legend below.
- **Common Issues:** `<BarChart layout="vertical">`. Horizontal bars sorted by frequency. Each bar labeled with count and percentage.
- **Category Performance:** `<RadarChart>`. One polygon per time period. Axes: Neatness, Organization, Accuracy, Thoroughness.
- **Team Comparison:** `<BarChart>` grouped. X-axis: team members. Grouped bars: avg score, volume, speed. Color-coded per metric.

**Date Range Selector:**
- shadcn `Popover` + `Calendar` with range selection
- Presets: "Today", "This Week", "This Month", "Last 30 Days", "Custom"
- Applies globally to all charts on the page

### 4.5 Claude AI Panel

**URL:** `/ai`

Dedicated page for AI management, transparency, and oversight.

```
┌─────────┬───────────────────────────────────────────────────────┐
│         │  🤖 Claude AI Dashboard                               │
│         │                                                       │
│         │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│         │  │ Menus   │ │ Current │ │ Human   │ │ Patterns│   │
│  Side   │  │ Analyzed│ │ Accuracy│ │ Overrides│ │ Learned │   │
│  bar    │  │  2,847  │ │  91.3%  │ │   127   │ │    48   │   │
│         │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│         │                                                       │
│         │  ┌─ Learning Feed ─────────────────────────────┐     │
│         │  │                                              │     │
│         │  │  🟢 15m ago                                  │     │
│         │  │  Learned: "El Pollo Loco" franchise menus   │     │
│         │  │  always list combo meals at bottom.          │     │
│         │  │  Confidence: 94%  Source: 23 menus           │     │
│         │  │                                              │     │
│         │  │  🟡 2h ago                                   │     │
│         │  │  Learning: Price rounding rules for fast     │     │
│         │  │  casual restaurants ($X.49 vs $X.99).        │     │
│         │  │  Confidence: 72%  Source: 8 menus            │     │
│         │  │  [Provide Feedback]                          │     │
│         │  │                                              │     │
│         │  │  🔵 Yesterday                                │     │
│         │  │  Updated: Modifier categorization rules.     │     │
│         │  │  Old accuracy: 85% → New: 92%               │     │
│         │  │  Trigger: 5 human overrides this week        │     │
│         │  │                                              │     │
│         │  └──────────────────────────────────────────────┘     │
│         │                                                       │
│         │  ┌─ Confidence Distribution ───────────────────┐     │
│         │  │  [Histogram: # of grades at each             │     │
│         │  │   confidence level, 50-100%]                  │     │
│         │  └──────────────────────────────────────────────┘     │
│         │                                                       │
│         │  ┌─ Override History ──────────────────────────┐     │
│         │  │  [Table: AI grade → Human grade → Item       │     │
│         │  │   → Grader → Date → Claude response]         │     │
│         │  └──────────────────────────────────────────────┘     │
│         │                                                       │
│         │  ┌─ Pattern Recognition ──────────────────────┐     │
│         │  │  Known Patterns (48):                        │     │
│         │  │                                              │     │
│         │  │  [Tag cloud or searchable list]              │     │
│         │  │                                              │     │
│         │  │  "Fast Casual Price Rounding"    94% conf.  │     │
│         │  │  "Mexican Menu Combo Layout"     92% conf.  │     │
│         │  │  "Sushi Roll Naming Convention"  89% conf.  │     │
│         │  │  "Modifier Price Formatting"     87% conf.  │     │
│         │  │  ...                                         │     │
│         │  └──────────────────────────────────────────────┘     │
│         │                                                       │
└─────────┴───────────────────────────────────────────────────────┘
```

**Learning Feed:**
- Chronological list, newest first
- Each entry: colored status dot (green=learned, amber=learning, blue=updated, red=corrected)
- Card format: timestamp, title, description, confidence bar, source count
- Expandable: click reveals full details, related menus, and options to provide feedback
- Infinite scroll with `IntersectionObserver`

**Confidence Distribution:**
- Recharts `<BarChart>` histogram
- X-axis: confidence buckets (50-60%, 60-70%, ..., 90-100%)
- Y-axis: number of grades
- Color gradient: red (low confidence) → green (high confidence)
- Tooltip: exact count and percentage of total

**Override History:**
- Full `<DataTable />` component
- Columns: Item Name, AI Grade, Human Grade, Grader, Date, Claude Response
- "Claude Response" column: brief text showing what Claude learned from the correction
- Sortable by date, filterable by grader
- Row expansion: full detail view of the override context

**Pattern Recognition Dashboard:**
- Searchable list of all patterns Claude has learned
- Each pattern: name, confidence percentage, source count, last updated
- Click pattern: modal with full description, example menus, contributing data points
- Admin action: "Invalidate Pattern" button (requires confirmation)

### 4.6 Settings

**URL:** `/settings`

**Layout:** Vertical tab navigation on the left, content pane on the right.

```
┌─────────┬──────────────┬────────────────────────────────────────┐
│         │  Settings    │                                        │
│         │              │  User Management                       │
│  Side   │  [Users]     │  ──────────────                        │
│  bar    │  [Rubric]    │                                        │
│         │  [API]       │  Allowed Users (24)    [+ Invite]      │
│  Nav    │  [Notifs]    │                                        │
│         │  [Display]   │  🔍 Search users...                    │
│         │              │                                        │
│         │              │  ┌──────────────────────────────────┐  │
│         │              │  │ 👤 M. Cruz     BPO Rep    Active │  │
│         │              │  │ 👤 R. Santos   BPO Lead   Active │  │
│         │              │  │ 👤 A. Garcia   GSO Admin  Active │  │
│         │              │  │ 👤 J. Reyes    BPO Rep    Invite │  │
│         │              │  └──────────────────────────────────┘  │
│         │              │                                        │
└─────────┴──────────────┴────────────────────────────────────────┘
```

**Settings Sections:**

1. **User Management:**
   - User list table: name, role, status, last active
   - Invite flow: email input + role selector → sends invite link
   - Role management: dropdown per user (rep, lead, director, admin, bpo_specialist)
   - Deactivate/reactivate toggle

2. **Rubric Customization:**
   - Four rubric dimensions displayed as editable cards
   - Each dimension: name, description, weight (percentage, must sum to 100%)
   - Weight adjustment: shadcn `Slider` with real-time percentage display
   - Sub-criteria: expandable lists of specific check items per dimension
   - "Reset to Default" button

3. **API Configuration:**
   - Square API key management: masked display, test connection button
   - Catalog sync settings: auto-sync toggle, sync frequency, last sync time
   - Claude AI settings: model selection, temperature, max tokens
   - Connection status indicators: green dot (connected), red dot (error), amber (untested)

4. **Notification Preferences:**
   - Toggle rows for each notification type
   - Channels: in-app, email
   - Types: grade complete, review needed, AI confidence alert, daily digest, weekly summary

5. **Display Settings:**
   - Theme: Light / Dark / System (radio group)
   - Language: English / Spanish (dropdown)
   - Date format: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
   - Density: Comfortable / Compact (toggles table row height and card padding)

---

## 5. Interaction Design

### 5.1 Micro-Interactions

| Interaction              | Behavior                                                    | Duration  | Easing         |
| ------------------------ | ----------------------------------------------------------- | --------- | -------------- |
| Button hover             | Slight darken/lighten of background                          | 150ms     | `ease-in-out`  |
| Button press             | Scale to 0.98, then release                                  | 100ms     | `ease-out`     |
| Card hover               | `shadow-sm` appears, border lightens slightly                | 200ms     | `ease-out`     |
| Score ring fill          | `stroke-dashoffset` animates from 100% to score value        | 1200ms    | `ease-out`     |
| Bar gauge fill           | Width animates from 0 to value, staggered 100ms per bar      | 800ms     | `ease-out`     |
| Collapse/expand          | Height auto-animates with `framer-motion` `AnimatePresence`  | 250ms     | `ease-in-out`  |
| Tab switch               | Content fades out/in, indicator slides                       | 200ms     | `ease-in-out`  |
| Toast enter              | Slide in from right + fade                                   | 300ms     | `ease-out`     |
| Toast exit               | Fade + slide right                                           | 200ms     | `ease-in`      |
| Page transition          | Content fades in, staggered children                         | 300ms     | `ease-out`     |
| Skeleton shimmer         | Left-to-right gradient sweep on placeholder shapes            | 1500ms    | `linear` loop  |
| AI confidence ring pulse | Subtle glow pulse when AI is processing                       | 2000ms    | `ease-in-out` loop |

### 5.2 Loading States

**Skeleton Strategy:** Every data-dependent section has a corresponding skeleton layout.

**Dashboard Skeletons:**
```
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ ░░░░░░  │ │ ░░░░░░  │ │ ░░░░░░  │ │ ░░░░░░  │   ← Stat cards: rounded rect placeholders
│ ░░░░    │ │ ░░░░    │ │ ░░░░    │ │ ░░░░    │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
```

- Use shadcn `Skeleton` component (`bg-muted animate-pulse rounded-md`)
- Skeleton shapes match actual content geometry (circular for avatars, rectangular for text, bar-shaped for gauges)
- Staggered appearance: skeleton shows immediately, content fades in over 200ms when loaded
- No spinners except for inline actions (button loading states use `Loader2` icon with `animate-spin`)

**Report Loading:**
- Score ring: gray ring skeleton, no number
- Bar gauges: empty bars with shimmer
- Item list: 5 skeleton cards
- Loading duration: show skeleton for minimum 300ms to avoid flash

### 5.3 Keyboard Shortcuts

Implemented via a global keyboard handler. Show shortcuts panel with `?` or `Cmd+/`.

| Shortcut       | Action                             | Context          |
| -------------- | ---------------------------------- | ---------------- |
| `G` then `D`   | Go to Dashboard                   | Global           |
| `G` then `N`   | Go to New Grade (upload)          | Global           |
| `G` then `R`   | Go to Reports                     | Global           |
| `G` then `A`   | Go to Analytics                   | Global           |
| `G` then `S`   | Go to Settings                    | Global           |
| `Cmd+K`         | Open command palette               | Global           |
| `/`             | Focus search                       | Tables, lists    |
| `J` / `K`       | Navigate down / up in lists        | Tables, item lists|
| `Enter`         | Open selected item                 | Tables, item lists|
| `Escape`        | Close modal / deselect             | Global           |
| `A`             | Toggle annotation mode             | Grade view       |
| `Cmd+Enter`     | Submit grade                       | Grade view       |
| `Cmd+E`         | Export report                      | Report view      |
| `[` / `]`       | Previous / next page (PDF)         | Menu viewer       |
| `+` / `-`       | Zoom in / out                      | Menu viewer       |
| `0`             | Fit to width                       | Menu viewer       |

**Command Palette:**
- shadcn `Command` (cmdk) in a `Dialog`
- Trigger: `Cmd+K`
- Search across: pages, recent reports, sellers, actions
- Shows keyboard shortcut hints next to each result
- Recent items section at top

### 5.4 Drag and Drop

**File Upload:**
- Implemented via `react-dropzone`
- Full-page drop zone: when dragging a file over the window (outside the upload area), a subtle overlay appears: `fixed inset-0 bg-primary/5 border-2 border-dashed border-primary z-50` with centered "Drop anywhere to upload" label
- Drop zone activates only on valid file types (PDF, PNG, JPG)
- Invalid file type: drop zone border turns `border-destructive`, label: "Unsupported file type"

### 5.5 Progressive Disclosure

Reports use progressive disclosure to manage information density:

1. **Level 0 — Summary:** Overall score ring + grade letter (visible immediately)
2. **Level 1 — Section Breakdown:** Rubric dimension bars + category scores (visible on scroll)
3. **Level 2 — Item List:** Collapsed item cards with grade + status (click section to reveal)
4. **Level 3 — Item Detail:** Expanded comparison, issues, AI notes (click item card)
5. **Level 4 — Full Comparison:** Side-by-side modal with diff highlighting (click "Compare" in item)

Each level transition is animated and reversible.

---

## 6. Responsive Strategy

### 6.1 Breakpoints

| Name      | Width    | Tailwind Prefix | Layout Changes                                      |
| --------- | -------- | --------------- | --------------------------------------------------- |
| `desktop` | ≥1440px  | `2xl:`          | Full layout, sidebar expanded, split pane grading    |
| `laptop`  | ≥1024px  | `xl:` / `lg:`   | Sidebar collapsible, narrower split pane             |
| `tablet`  | ≥768px   | `md:`           | Sidebar → hamburger menu, single pane grading        |
| `mobile`  | <768px   | default         | Stacked layout, bottom nav, card-based tables        |

### 6.2 Layout Shifts

**Sidebar:**
- ≥1024px: Static sidebar, `w-64`
- 768–1023px: Sidebar collapsed to `w-16` (icons only), expandable on hover or click
- <768px: Sidebar hidden, accessible via hamburger menu (`Sheet` slide-over from left)

**Grade Split Pane:**
- ≥1024px: Side-by-side split pane (50/50 default, resizable)
- 768–1023px: Stacked with tab toggle ("Menu" / "Catalog") at top
- <768px: Full-width tabs, swipeable between menu and catalog views

**Data Tables:**
- ≥1024px: Full table with all columns
- 768–1023px: Essential columns only (seller, score, grade, status)
- <768px: Card list view — each row becomes a stacked card

**Stat Cards:**
- ≥1024px: 4-column grid
- 768–1023px: 2-column grid
- <768px: 2-column grid with smaller text sizes, or horizontal scroll

**Charts:**
- ≥768px: Side-by-side charts in grids
- <768px: Single-column stacked charts, touch-friendly tooltips

### 6.3 Touch Considerations (Tablet)

- Minimum touch target: 44×44px (per Apple HIG)
- Annotation pins on menu images: enlarged touch target with visual affordance
- Swipe gestures: left/right on item cards to mark as reviewed
- Pull-to-refresh on activity feeds and report lists
- Pinch-to-zoom on menu viewer

---

## 7. Accessibility

### 7.1 WCAG 2.1 AA Compliance

**Color Contrast:**
- All text on backgrounds: minimum 4.5:1 contrast ratio (normal text), 3:1 (large text)
- Score tier colors tested against both light and dark card backgrounds
- Score ring: thick stroke (8px) ensures visibility even with reduced contrast
- Non-color indicators always accompany color: icons (✅❌⚠️), text labels, patterns

**Contrast Verification (Light Mode):**

| Element                    | Foreground      | Background     | Ratio | Pass? |
| -------------------------- | --------------- | -------------- | ----- | ----- |
| Body text                  | `hsl(222,47%,11%)`  | `#fff`        | 15.4:1 | ✅    |
| Muted text                 | `hsl(215,16%,47%)`  | `#fff`        | 4.6:1  | ✅    |
| Score excellent on white   | `hsl(142,71%,45%)`  | `#fff`        | 3.1:1  | ✅ (large) |
| Score fail on white        | `hsl(0,84%,60%)`    | `#fff`        | 4.0:1  | ✅ (large) |
| AI primary on ai-surface   | `hsl(262,83%,58%)`  | `hsl(262,47%,97%)` | 5.2:1 | ✅ |

### 7.2 Screen Reader Support

- All images: descriptive `alt` text, including menu images ("Uploaded menu image for Joe's Diner, page 1 of 3")
- Score rings: `aria-label="Overall score: 92 out of 100, grade A"`
- Bar gauges: `aria-label="Neatness: 90 percent"` + `role="progressbar"` with `aria-valuenow`
- Grade badges: `aria-label="Grade: A"` 
- Icon-only buttons: `aria-label` describing the action
- Toast notifications: `role="status"` with `aria-live="polite"` (info/success) or `aria-live="assertive"` (error)
- Modal dialogs: proper `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to title
- Tables: proper `<thead>`, `<th scope="col">`, `<caption>` elements
- AI-sourced content: `aria-label` prefix "AI generated:" to distinguish from manual content

### 7.3 Focus Management

- Visible focus rings: `ring-2 ring-ring ring-offset-2 ring-offset-background` (default shadcn)
- Tab order follows visual order (left-to-right, top-to-bottom)
- Modal open: focus trapped inside modal, focus moves to first interactive element
- Modal close: focus returns to trigger element
- Page navigation: focus moves to page heading (`<h1>`) on route change
- Skip links: "Skip to main content" link as first focusable element, visible on focus
- Dropdown menus: arrow key navigation within, Escape to close
- Command palette: auto-focused search input, arrow keys to navigate results

### 7.4 Motion Preferences

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- Score ring: fills immediately instead of animating
- Bar gauges: full width immediately
- Page transitions: instant swap
- Skeleton shimmer: static gray instead of sweeping gradient

### 7.5 Internationalization Readiness

- All user-facing strings externalized (i18n-ready for English + Spanish)
- RTL-safe layout: logical properties (`ms-`, `me-`, `ps-`, `pe-`) instead of `ml-`, `mr-`
- Date formatting: locale-aware via `Intl.DateTimeFormat`
- Number formatting: locale-aware via `Intl.NumberFormat`
- Currency: always `USD` with locale-appropriate formatting

---

## 8. Visual Mood Board

### Overall Aesthetic

The Menu Grading Tool presents as a **premium internal operations tool** — think Stripe Dashboard meets Linear. It is:

- **Clean but data-rich:** Generous whitespace, but no wasted screen real estate. Every pixel serves a purpose.
- **Professional without being sterile:** The palette leans neutral (slate/zinc backgrounds, subtle blue accents), but score colors inject warmth and urgency where needed.
- **Flat-first, depth-on-demand:** Cards are defined by borders, not shadows. Shadows appear only on floating elements (dropdowns, modals, toasts) to create clear hierarchy.
- **Numerically confident:** Scores and metrics use monospace typography with generous sizing. Numbers feel authoritative — like a financial dashboard, not a toy.

### Key Visual Moments

**The Score Ring:**
- Inspired by credit score displays (Credit Karma, Experian)
- SVG-based, perfectly circular, with a chunky stroke and rounded caps
- The fill animation on page load is the hero moment — smooth, confident, satisfying
- A subtle glow (`box-shadow: 0 0 20px hsl(var(--score-color) / 0.15)`) around the ring matches the score color
- The letter grade below the number uses the same score color, bold mono typeface

**The Grading Split Pane:**
- Inspired by code review tools (GitHub PR view, Linear diff view)
- Clean divider between left (menu) and right (catalog)
- The menu image feels like a document viewer — zoom controls, page navigation
- Annotation pins pop with color against the menu image — numbered circles in red
- The right pane scrolls independently, each item card clearly delineated

**AI Integration:**
- Claude-powered features use a consistent violet/purple accent throughout
- AI sections have a subtle gradient background: from `bg-ai-surface` to transparent
- The `Sparkles` icon (from Lucide) accompanies all AI-generated content
- AI confidence rings are smaller versions of the main score ring, in AI purple
- The effect is "intelligent assistant" — present and helpful, never dominant or mystifying
- AI features never auto-apply without user review. The design reinforces human oversight at every step.

**The Report Page:**
- Top half is the "hero zone" — large score ring, rubric bars, key metadata. This is the at-a-glance summary.
- Below the fold, progressive disclosure unfolds: section breakdown → item cards → detailed comparisons
- Issue pills use semantic colors (red, amber, blue) with icon + text, never color alone
- The AI recommendations section at the bottom uses the AI surface treatment — distinct but not disruptive

### Comparison to References

| Aspect               | Our Treatment                              | Reference Similarity       |
| -------------------- | ------------------------------------------ | -------------------------- |
| Navigation           | Collapsible sidebar with active accent bar | Linear                     |
| Cards                | Border-defined, flat, no gratuitous shadow | Vercel                     |
| Data tables          | Clean headers, row hover, status coloring  | Stripe Dashboard           |
| Score visualizations | SVG rings, animated fills, monospace fonts | Credit Karma               |
| AI features          | Purple accent, sparkle icon, distinct zones| GitHub Copilot badge style |
| Keyboard shortcuts   | Command palette, Vim-style nav             | Linear                     |
| Typography           | Inter body, JetBrains Mono for data        | Vercel                     |
| Empty states         | Illustrated + action prompt                | Linear                     |
| Loading              | Skeleton shapes matching content geometry  | Stripe                     |

### Empty States

Every empty state includes:
1. A simple, monochrome illustration (SVG, 120px, `text-muted-foreground/30`)
2. A clear headline: "No menus graded yet"
3. A helpful description: "Upload a menu to get started with your first QA grade."
4. A primary action button: "Upload Menu"

Empty state examples:
- Dashboard (new user): Clipboard illustration + "Welcome to Menu Grader"
- Reports (no reports): Document stack illustration + "No reports yet"
- Analytics (no data): Chart illustration + "Grade some menus to see analytics"
- AI panel (new): Robot illustration + "Claude is ready to learn"

---

## Appendix A: shadcn/ui Component Mapping

| Application Component       | shadcn/ui Base                    | Custom Additions                          |
| --------------------------- | --------------------------------- | ----------------------------------------- |
| Sidebar nav                 | `Sheet` (mobile), custom (desktop)| Active indicator bar, collapse behavior    |
| File upload zone            | Custom + `react-dropzone`         | All 6 upload states                        |
| Score ring                  | Custom SVG                        | Animated fill, tier coloring, size variants|
| Bar gauge                   | `Progress`                        | Label, value, tier coloring                |
| Grade badge                 | `Badge`                           | Tier-colored variant                       |
| Item grade card             | `Collapsible` + `Card`            | Left accent, comparison table, issue pills |
| Data table                  | `Table` + `@tanstack/react-table` | Sorting, filtering, row status, pagination |
| AI panel                    | `Card`                            | AI color system, confidence bars           |
| Toast notifications         | `Sonner`                          | AI variant, custom icons                   |
| Confirmation modal          | `AlertDialog`                     | Grade summary content                      |
| Detail modal                | `Dialog`                          | Scrollable body, sticky header/footer      |
| Command palette             | `Command` + `Dialog`              | Page/report/action search                  |
| Settings tabs               | `Tabs`                            | Vertical layout for settings page          |
| Filters                     | `Popover` + `Command` + `Calendar`| Combined filter panel                      |
| Score trend chart           | Recharts `LineChart`              | Area gradient, comparison overlay          |
| Grade distribution          | Recharts `PieChart`               | Donut variant, tier colors                 |
| Team comparison             | Recharts `BarChart`               | Grouped variant                            |
| Menu viewer                 | Custom + `react-pdf`              | Zoom, pan, annotation layer                |
| Step wizard                 | Custom                            | 3-step indicator with line connections     |
| Breadcrumbs                 | `Breadcrumb`                      | Truncation with popover                    |
| User avatars                | `Avatar`                          | Initials fallback, role badge              |
| Theme toggle                | Custom + `next-themes`            | Sun/Moon icon toggle                       |
| Search inputs               | `Input`                           | Search icon prefix, clear button           |

---

## Appendix B: File Structure

```
frontend/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── layout.tsx                # Root layout (sidebar, theme provider)
│   │   ├── page.tsx                  # Redirect to /dashboard
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── grade/
│   │   │   └── new/
│   │   │       └── page.tsx
│   │   ├── reports/
│   │   │   ├── page.tsx              # Report history list
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Individual report
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   ├── ai/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   ├── components/
│   │   ├── ui/                       # shadcn/ui primitives (generated)
│   │   ├── layout/
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── breadcrumbs.tsx
│   │   │   ├── page-header.tsx
│   │   │   └── command-palette.tsx
│   │   ├── grading/
│   │   │   ├── file-upload-zone.tsx
│   │   │   ├── menu-viewer.tsx
│   │   │   ├── catalog-panel.tsx
│   │   │   ├── grading-wizard.tsx
│   │   │   ├── annotation-layer.tsx
│   │   │   └── step-indicator.tsx
│   │   ├── scores/
│   │   │   ├── score-ring.tsx
│   │   │   ├── bar-gauge.tsx
│   │   │   ├── grade-badge.tsx
│   │   │   └── score-hero.tsx
│   │   ├── reports/
│   │   │   ├── item-grade-card.tsx
│   │   │   ├── section-breakdown.tsx
│   │   │   ├── comparison-view.tsx
│   │   │   └── report-export.tsx
│   │   ├── ai/
│   │   │   ├── ai-insights-panel.tsx
│   │   │   ├── confidence-indicator.tsx
│   │   │   ├── learning-feed.tsx
│   │   │   ├── override-workflow.tsx
│   │   │   └── pattern-card.tsx
│   │   ├── analytics/
│   │   │   ├── score-trend-chart.tsx
│   │   │   ├── grade-distribution.tsx
│   │   │   ├── issue-frequency.tsx
│   │   │   ├── team-comparison.tsx
│   │   │   └── reviewer-detail.tsx
│   │   └── shared/
│   │       ├── data-table.tsx
│   │       ├── empty-state.tsx
│   │       ├── loading-skeleton.tsx
│   │       └── status-badge.tsx
│   ├── hooks/
│   │   ├── use-keyboard-shortcuts.ts
│   │   ├── use-file-upload.ts
│   │   └── use-score-animation.ts
│   ├── lib/
│   │   ├── utils.ts                  # shadcn cn() helper
│   │   ├── score-utils.ts            # Score → tier/color/grade mapping
│   │   └── format.ts                 # Date, number, currency formatting
│   ├── styles/
│   │   └── globals.css               # CSS custom properties, Tailwind base
│   └── types/
│       ├── report.ts
│       ├── catalog.ts
│       ├── grading.ts
│       └── ai.ts
├── public/
│   └── illustrations/                # Empty state SVGs
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

---

## Appendix C: CSS Custom Properties (globals.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;
    --border: 214 32% 91%;
    --input: 214 32% 91%;
    --primary: 221 83% 53%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222 47% 11%;
    --accent: 210 40% 96%;
    --accent-foreground: 222 47% 11%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 210 40% 98%;
    --ring: 221 83% 53%;
    --radius: 0.5rem;

    /* Score tiers */
    --score-excellent: 142 71% 45%;
    --score-good: 162 63% 41%;
    --score-average: 43 96% 56%;
    --score-poor: 27 96% 61%;
    --score-fail: 0 84% 60%;

    /* AI accent */
    --ai-primary: 262 83% 58%;
    --ai-surface: 262 47% 97%;
    --ai-border: 262 40% 88%;
  }

  .dark {
    --background: 224 71% 4%;
    --foreground: 213 31% 91%;
    --muted: 223 47% 11%;
    --muted-foreground: 215 20% 65%;
    --card: 224 71% 4%;
    --card-foreground: 213 31% 91%;
    --popover: 224 71% 4%;
    --popover-foreground: 213 31% 91%;
    --border: 216 34% 17%;
    --input: 216 34% 17%;
    --primary: 217 91% 60%;
    --primary-foreground: 222 47% 11%;
    --secondary: 223 47% 11%;
    --secondary-foreground: 213 31% 91%;
    --accent: 216 34% 17%;
    --accent-foreground: 213 31% 91%;
    --destructive: 0 63% 31%;
    --destructive-foreground: 210 40% 98%;
    --ring: 217 91% 60%;

    /* Score tiers - dark */
    --score-excellent: 142 69% 58%;
    --score-good: 162 60% 50%;
    --score-average: 43 96% 65%;
    --score-poor: 27 92% 65%;
    --score-fail: 0 72% 63%;

    /* AI accent - dark */
    --ai-primary: 262 80% 68%;
    --ai-surface: 262 47% 12%;
    --ai-border: 262 35% 22%;
  }
}
```

---

*End of UI/UX Design Specification — Menu Grading Tool v1.0*
