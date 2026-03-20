# FinVault
## Gamified Personal Finance Manager
### Product Requirements Document · v1.0 · March 2026

---

| Field | Details |
|---|---|
| **Product Name** | FinVault |
| **Version** | 1.0 — Initial Release |
| **Author** | Deihl (Sole Developer) |
| **Target Launch** | Q3 2026 (MVP) |
| **Platform** | Web (PWA) — Desktop & Mobile |
| **Tech Stack** | Next.JS · TypeScript · Supabase Auth & DB · Prisma ORM · Tailwind CSS · shadcn/ui |
| **Status** | Draft — In Review |

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Target Users](#2-target-users)
3. [Feature Requirements](#3-feature-requirements)
4. [UX & Design Direction](#4-ux--design-direction)
5. [Technical Architecture](#5-technical-architecture)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Development Roadmap](#7-development-roadmap)
8. [Open Questions & Decisions](#8-open-questions--decisions)
9. [Appendix](#9-appendix)

---

## 1. Product Overview

### 1.1 Problem Statement

The personal finance management space is crowded with apps locked behind expensive subscriptions (YNAB at $109/yr, Monarch Money at $100/yr). Features users actually need — budgets, recurring transactions, multiple accounts, charts, and exports — are routinely paywalled. Beyond cost, most finance apps are visually flat and emotionally disengaging, making it easy to fall off the habit of tracking.

### 1.2 Product Vision

FinVault is a gamified, PWA-first personal finance manager that ships premium-tier features for free. It makes managing money feel like leveling up a character — with XP, streaks, achievements, and visual feedback — so users stay engaged long enough to build real financial habits. Built initially for personal use, with a public launch as the goal.

### 1.3 Goals

- Deliver all core "paid" features (budgets, recurring transactions, multi-wallet, charts, exports) completely free
- Gamify the finance tracking experience through XP, levels, streaks, and badges to drive habit formation
- Ship as a PWA to support mobile home-screen installation with offline capability
- Build on a robust, type-safe stack (Next.js + Prisma + Supabase) that scales to a public user base
- Provide a clean foundation for v2 AI-powered features (auto-categorization, spending insights)

### 1.4 Success Metrics (MVP)

| Metric | Target |
|---|---|
| **Daily active use** | User logs at least 1 transaction on 5+ days/week in their first month |
| **Streak retention** | 50% of users maintain a 7-day streak within the first 2 weeks |
| **Feature adoption** | Budget feature used by 80% of registered users |
| **PWA install rate** | 40% of mobile visitors install to home screen |
| **Export usage** | At least 1 CSV or PDF export per user per month |

---

## 2. Target Users

### 2.1 Primary User

A tech-comfortable individual (developer, student, or young professional) tired of paying for finance apps or bouncing off boring tools. Values clean UI, appreciates gamification from gaming and productivity apps, and wants full control of their financial data.

### 2.2 Secondary Users (Post-Public Launch)

- Budget-conscious individuals who have cancelled or are considering cancelling YNAB, Mint, or Monarch
- Freelancers managing multiple income streams and expense categories
- Couples or household members tracking shared spending across joint wallets

### 2.3 User Personas

| Persona | Description | Profile |
|---|---|---|
| **The Developer-First User** | Technical, values open tools. Wants CSV exports and clean data. Will share the app on social media. | Deihl himself — the v1 target. |
| **The Reformed Budgeter** | Was on YNAB/Mint, cancelled due to price. Wants familiar budgeting features with no friction. | Ages 22–35, employed, 3–6 expense categories they care about. |
| **The Gamification-Native** | Motivated by streaks, XP bars, and visible progress. Needs the app to feel rewarding, not like a chore. | Ages 18–28, uses Duolingo, Habitica, or similar apps. |

---

## 3. Feature Requirements

> **Scope Note:** All features below are in scope for v1 (MVP) unless explicitly marked `v2`. **"Paid elsewhere"** annotations indicate features paywalled in competing apps that FinVault ships free.

---

### 3.1 Authentication & User Management

Powered by Supabase Auth. All user records in Supabase DB are accessed via Prisma ORM.

- Email & password registration and login
- OAuth via Google (one-click sign in)
- Email verification on signup
- Password reset via email link
- User profile: display name, avatar (initials fallback), currency preference, timezone
- Account deletion with full data wipe (GDPR-aligned)

---

### 3.2 Dashboard

The central hub after login. Designed to feel like a game HUD, not a spreadsheet.

- Net balance card: total assets minus liabilities across all wallets
- XP bar and current level (see Section 3.8)
- Active streak counter with flame icon
- Quick-add transaction FAB (Floating Action Button on mobile)
- Monthly income vs expenses summary card
- Budget health mini-cards: top 3 budgets with progress bars, color coded green / amber / red
- Recent transactions list (last 7, with category icon and amount)
- Upcoming recurring transactions widget (next 3 due)

---

### 3.3 Transactions

Core CRUD for income and expense records.

- Add transaction: amount, type (income/expense), category, wallet, date, optional note/tag
- Edit and delete transactions
- Transaction list with search, filter by date range, category, wallet, and type
- Category auto-suggest based on description keywords (client-side, rule-based in v1)
- Bulk delete via multi-select
- Wallet-to-wallet transfer (internal; does not count as income or expense)

---

### 3.4 Recurring Transactions _(Free — Paid elsewhere)_

Users define repeating transactions (subscriptions, salary, rent) that auto-create entries on schedule.

- Create recurring rule: name, amount, type, category, wallet, frequency, start date, optional end date
- Frequencies supported: daily, weekly, biweekly, monthly, quarterly, yearly
- Auto-generation via Vercel scheduled function (cron) running nightly
- Dashboard widget shows next 3 upcoming recurring entries
- Pause or delete a rule without losing historical transactions
- Edit rule: apply changes from "next occurrence" or "all future"

---

### 3.5 Multiple Accounts / Wallets _(Free — Paid elsewhere)_

Track money across multiple accounts: cash, bank, e-wallet, credit card, savings, investment.

- Create wallet: name, type, starting balance, currency, color, icon
- Wallet types: Cash, Bank Account, E-Wallet (GCash/Maya), Credit Card, Savings, Investment
- Per-wallet balance displayed in a card grid
- Credit card wallets: track credit limit and available credit
- Wallet archive (hide without deleting)
- Net worth calculation aggregates all wallet balances

---

### 3.6 Budgets & Spending Limits _(Free — Paid elsewhere)_

Monthly category-based budget envelopes with real-time progress tracking.

- Create budget: category, monthly limit, optional rollover
- Real-time spend progress bar per budget (green < 60%, amber 60–85%, red > 85%)
- Budget overview page: all budgets, remaining amounts, overspend alerts
- In-app notification at 80% and 100% of budget limit
- Rollover mode: unspent budget carries over to next month (toggle per budget)
- Budget period: monthly in v1; weekly and custom periods in `v2`

---

### 3.7 Reports & Analytics _(Free — Paid elsewhere)_

Visual breakdowns of spending behavior over time using Recharts.

- Monthly summary: total income, total expenses, net savings, savings rate %
- Expense breakdown: donut chart by category
- Income vs expenses: bar chart (last 6 months)
- Category trend: line chart showing spend in a selected category over time
- Top spending categories: ranked list with % of total
- Net worth over time: line chart using snapshot data
- Date range filter: this month / last month / last 3 months / last 6 months / this year / custom

---

### 3.8 Gamification System

The core differentiator. Every financial action earns XP and progresses the user toward rewards, making the app intrinsically motivating.

#### 3.8.1 XP & Leveling

- Every meaningful action earns XP:
  - Log a transaction: **+10 XP**
  - Complete a budget setup: **+50 XP**
  - Add a recurring rule: **+30 XP**
  - Stay under budget for a full month: **+100 XP**
  - Maintain a 7-day logging streak: **+150 XP**
  - Create first wallet: **+25 XP**
  - Export a report: **+20 XP**
- XP required per level scales exponentially: **Level N requires N² × 100 XP**
- Level badge displayed on dashboard and profile
- Level-up triggers a full-screen celebration animation (confetti + level card)

#### 3.8.2 Streaks

- A streak increments when the user logs at least 1 transaction per calendar day
- Streak counter shown on dashboard with 🔥 icon and day count
- Streak broken if no transaction is logged by end of day in the user's timezone
- Streak milestones (7, 14, 30, 60, 100 days) award bonus XP and a unique badge
- 1 streak freeze earnable per 30-day period

#### 3.8.3 Achievements & Badges

One-time unlockable achievements displayed in a profile trophy case. Earned badges show in full color; unearned are grayed out with a lock icon.

| Achievement | Trigger Condition | Badge |
|---|---|---|
| **First Transaction** | Log your first expense or income | Starter 🏁 |
| **Budget Builder** | Set up 3 or more budgets | Planner 📋 |
| **Wallet Wizard** | Create 3 or more wallets | Organized 💼 |
| **Streak Warrior** | Maintain a 30-day logging streak | Consistent 🔥 |
| **Under Budget** | Stay under all budgets for a full month | Disciplined ✅ |
| **Export Pro** | Export 5 reports (CSV or PDF) | Analyst 📊 |
| **Saver of the Month** | Net savings > 20% of income in a calendar month | Saver 💰 |
| **Century Streak** | Maintain a 100-day logging streak | Legend 🏆 |

#### 3.8.4 Monthly Challenges

- System-defined monthly challenge displayed on dashboard (e.g. "Log 25 transactions this month", "Stay under dining budget")
- Progress bar shows completion percentage
- Completing a challenge awards bonus XP and a special badge
- One active challenge per month in v1; custom challenges in `v2`

---

### 3.9 Categories

- Default categories seeded on account creation: Food, Transport, Housing, Entertainment, Health, Shopping, Savings, Salary, Freelance, Other
- User can create custom categories with name, emoji icon, and color
- Categories used for transactions, budgets, and reports
- Category cannot be deleted if it has associated transactions (archive instead)

---

### 3.10 CSV & PDF Export _(Free — Paid elsewhere)_

- Export transactions as CSV: scoped by date range, wallet, and/or category
- Export monthly report as PDF: summary stats + category breakdown chart + transaction table
- PDF generated server-side via `@react-pdf/renderer`
- Export actions available on both the Reports page and Transactions list

---

### 3.11 PWA Features

- `next-pwa` for service worker setup and Web App Manifest generation
- Offline mode: previously loaded data readable without connection; new transactions queued in IndexedDB and synced on reconnect
- Add to Home Screen prompt on mobile browsers
- Browser push notifications: budget alerts, streak reminders, upcoming recurring transactions
- App shell caching for fast subsequent loads

---

### 3.12 Notifications & Reminders

- Budget at 80% threshold — in-app toast + optional browser push notification
- Budget exceeded — alert card on dashboard
- Daily streak reminder — browser push at user-defined time (default: 8 PM local)
- Upcoming recurring transaction — 1-day advance notice
- Level-up celebration — full-screen modal with confetti
- All notification types individually toggleable in Settings

---

## 4. UX & Design Direction

### 4.1 Design Philosophy

FinVault should feel like a premium mobile game crossed with a financial dashboard — not a spreadsheet. The UI takes cues from **Duolingo** (streak + XP mechanics), **Linear** (clean, fast, keyboard-friendly), and **Cash App** (dark card-based layouts). The experience should be delightful, fast, and legible.

### 4.2 Visual Language

| Element | Direction |
|---|---|
| **Color Palette** | Dark base (`#0F0F1A`) with vibrant purple primary (`#6C47FF`) and orange accent (`#F97316`). Category colors are pastel. Success green and danger red for budget states. |
| **Typography** | Geist (Next.js native) for UI text. Tabular numerals for all financial figures. Bold for totals, regular for labels. |
| **Component Library** | shadcn/ui on Radix UI primitives. Custom gamification components (XP bar, streak counter, level badge) built from scratch with Framer Motion. |
| **Motion** | Framer Motion for page transitions, level-up animations, XP bar fill, and number counting animations. No animations on scroll-heavy lists. |
| **Icons** | Lucide icons for UI actions. Emoji for category icons and achievement badges — approachable, cross-platform. |
| **Layout** | Card-based grid on desktop. Single-column stack on mobile. Sidebar nav on desktop; bottom tab bar on mobile. |

### 4.3 Core UI Screens

| Screen | Description |
|---|---|
| **Dashboard** | HUD-style layout: XP bar, streak counter, net balance hero card, budget mini-cards, recent transactions, upcoming recurring |
| **Transactions** | Filterable list + Quick Add sheet (bottom drawer on mobile, dialog on desktop) |
| **Wallets** | Card grid per wallet with balance, type icon, and color accent |
| **Budgets** | Envelope cards with animated progress bars, colored by spend level |
| **Reports** | Tabbed chart views: Overview, Categories, Trends, Net Worth |
| **Achievements** | Trophy case grid — earned badges full color, unearned grayed out with lock icon |
| **Settings** | User profile, notification preferences, currency/timezone, data export, danger zone (account deletion) |

### 4.4 Mobile-First Considerations

- Bottom navigation bar: Dashboard, Transactions, Budgets, Reports, Profile
- FAB for quick transaction entry on all main screens
- Bottom sheet dialogs for forms (more ergonomic than centered modals on small screens)
- Touch targets minimum 44×44px for all interactive elements
- Swipe-to-delete on transaction list items

---

## 5. Technical Architecture

### 5.1 Tech Stack

| Layer | Technology | Role |
|---|---|---|
| **Framework** | Next.JS (App Router) | Server components, API routes, server actions, PWA via next-pwa |
| **Language** | TypeScript | Strict mode throughout |
| **Auth + DB Host** | Supabase | Supabase Auth for sign-in/OAuth; Supabase-hosted Postgres as the database instance |
| **ORM** | Prisma | Type-safe DB queries, schema management, migrations; connects via pgBouncer connection pooling |
| **Styling** | Tailwind CSS | Utility-first; custom design tokens in `tailwind.config.ts` |
| **UI Components** | shadcn/ui | Radix UI primitives; customized to FinVault design system |
| **Animations** | Framer Motion | Page transitions, XP animations, level-up celebrations |
| **Charts** | Recharts | All analytics and report visualizations |
| **Validation** | Zod | Schema validation for all API inputs and form data |
| **Forms** | React Hook Form | Integrated with Zod resolvers |
| **PWA** | next-pwa | Service worker and manifest generation |
| **Deployment** | Vercel | Hosting + scheduled functions for recurring transaction cron |

### 5.2 Database Schema (Prisma Models)

All models include `id` (cuid), `createdAt`, and `updatedAt` fields.

| Model | Key Fields | Notes |
|---|---|---|
| **User** | Mirrors Supabase Auth user; stores profile, XP, level, streak data, currency, timezone | Synced via Supabase Auth webhook on first login |
| **Wallet** | `userId`, `name`, `type` (enum), `balance`, `currency`, `color`, `icon`, `isArchived` | Types: CASH, BANK, EWALLET, CREDIT_CARD, SAVINGS, INVESTMENT |
| **Category** | `userId`, `name`, `emoji`, `color`, `isDefault`, `isArchived` | Default set seeded on account creation |
| **Transaction** | `userId`, `walletId`, `categoryId`, `amount`, `type` (INCOME/EXPENSE/TRANSFER), `date`, `note`, `isRecurringGenerated` | Core financial record |
| **RecurringRule** | `userId`, `walletId`, `categoryId`, `name`, `amount`, `type`, `frequency`, `startDate`, `endDate`, `nextDueDate`, `isPaused` | Drives cron-based auto-generation |
| **Budget** | `userId`, `categoryId`, `monthlyLimit`, `month`, `year`, `rolloverEnabled` | Evaluated against transactions monthly |
| **Achievement** | `userId`, `type` (enum), `unlockedAt` | One row per earned achievement per user |
| **MonthlyChallenge** | `userId`, `challengeType`, `month`, `year`, `targetValue`, `currentValue`, `completedAt` | v1: system-defined challenges only |
| **XPLog** | `userId`, `action` (enum), `xpEarned`, `createdAt` | Audit trail for all XP events |

### 5.3 Architecture Patterns

- Server Components for all data-fetching routes (dashboard, reports, transaction list)
- Server Actions for all mutations (create/update/delete transactions, wallets, budgets)
- API Routes only where server actions are insufficient (e.g. webhook handlers, cron endpoints)
- Prisma Client instantiated as a singleton to prevent connection pool exhaustion in dev mode
- Supabase connection via `DATABASE_URL` (pgBouncer) for queries; `DIRECT_URL` for migrations
- All Prisma queries include `userId` filter — no cross-user data leakage possible

### 5.4 Authentication Flow

1. User signs up or logs in via Supabase Auth (email or Google OAuth)
2. On first login, a Supabase Auth webhook triggers a server action that creates the Prisma `User` record and seeds default categories
3. Session cookie managed by `@supabase/ssr` — compatible with Next.js App Router middleware
4. Route protection via Next.js middleware: unauthenticated requests redirected to `/login`
5. Server components access session via `createServerClient` from `@supabase/ssr`

### 5.5 Gamification Logic

- XP and streak updates handled in server actions, co-located with the triggering mutation (e.g. `createTransaction` server action also calls `awardXP`)
- Streak evaluated at transaction creation by comparing `lastTransactionDate` on the `User` model with today in the user's timezone
- Level-up check runs after every XP award; `levelUpPending` flag set on `User` when threshold is crossed
- Client reads `levelUpPending` on next page load, triggers celebration animation, then clears the flag via a server action
- Achievement checks are idempotent — query `Achievement` table before inserting to prevent duplicates

### 5.6 Recurring Transactions Cron

- Vercel Cron Job runs daily at **00:05 UTC**
- Protected API route (`/api/cron/process-recurring`) called by Vercel with a shared secret header
- Query `RecurringRule` where `nextDueDate <= today` AND `isPaused = false`
- For each rule: create `Transaction`, update `nextDueDate` to next occurrence, award XP to user
- Failed rules are logged and do not block other rules from processing

---

## 6. Non-Functional Requirements

| Requirement | Specification |
|---|---|
| **Performance** | Dashboard initial load < 2s on 4G. Lighthouse PWA score ≥ 90. All chart renders < 500ms. |
| **Security** | All routes protected by Supabase Auth session. `userId` filter mandatory on all Prisma queries. No client-side secrets. CSP headers via Next.js config. |
| **Accessibility** | WCAG 2.1 AA for all core flows. shadcn/ui Radix primitives provide baseline a11y. Keyboard navigable. ARIA labels on all chart elements. |
| **Offline Support** | App shell cached via service worker. Recent dashboard data readable offline. Transaction entry queued in IndexedDB and synced on reconnect. |
| **Scalability** | Prisma + Supabase Postgres supports multi-user public launch. Connection pooling via pgBouncer. No global state dependencies that break with concurrent users. |
| **Data Privacy** | No third-party analytics in v1. User data scoped per `userId`. Full export and account deletion required before public launch. |
| **Browser Support** | Chrome 110+, Safari 16+, Firefox 115+, Edge 110+. PWA install on iOS Safari 16.4+ and Android Chrome. |

---

## 7. Development Roadmap

### Phase 1 — Foundation (Weeks 1–3)

- Project setup: Next.JS, TypeScript, Tailwind, shadcn/ui, ESLint/Prettier, Husky
- Supabase project + Prisma schema with all v1 models; migration pipeline established
- Supabase Auth integration: email signup/login, Google OAuth, middleware route protection
- User onboarding wizard: account creation → default category seeding → first wallet setup
- PWA manifest and basic service worker via next-pwa

### Phase 2 — Core Finance Features (Weeks 4–7)

- Wallets: full CRUD, balance tracking, all wallet types
- Transactions: add, edit, delete, list with filters
- Categories: default set + custom category management
- Recurring transactions: rule creation + Vercel cron setup
- Budgets: create, track spend, progress bars, overspend alerts

### Phase 3 — Gamification (Weeks 8–10)

- XP system: award XP on all defined actions, XP log table
- Leveling: level calculation, level-up flag, Framer Motion celebration animation
- Streaks: daily streak logic, streak counter on dashboard
- Achievements: all 8 v1 achievements with trigger logic and trophy case UI
- Monthly challenges: system-defined display and progress tracking

### Phase 4 — Reports & Exports (Weeks 11–12)

- Reports page: all 7 chart types using Recharts
- Date range filter for all report views
- CSV export: transactions by filter
- PDF report export via `@react-pdf/renderer`

### Phase 5 — PWA & Polish (Weeks 13–14)

- Mobile layout: bottom nav, FAB, swipe-to-delete, bottom sheet forms
- Offline mode: app shell caching, IndexedDB transaction queue and sync
- Browser push notifications: budget alerts, streak reminders, recurring previews
- Performance audit: Lighthouse PWA ≥ 90, Core Web Vitals green
- Security audit: all routes scoped, CSP headers, no client secrets

### Phase 6 — Pre-Launch (Week 15)

- Personal dogfooding: use app daily for 2 weeks post-feature-complete
- Landing page (single Next.js route with product overview)
- Account deletion and full data export (required for public launch)
- Production Supabase project setup, environment variable audit
- Soft public launch: Twitter/X, dev.to, Reddit r/webdev

### 7.1 v2 Backlog

- AI-powered features: auto-categorization, spending insights (OpenAI integration)
- Custom monthly challenges
- Weekly and custom-period budgets
- Multi-currency support with live exchange rates
- Household / shared wallets (invite user to co-manage a wallet)
- Dark/light mode toggle (v1 ships dark only)
- Mobile native app (React Native or Capacitor wrapper)

---

## 8. Open Questions & Decisions

| Topic | Notes |
|---|---|
| **App name** | FinVault is a working title. Final branding TBD before public launch. |
| **PDF generation** | Recommend `@react-pdf/renderer` over Puppeteer for Vercel compatibility (no headless Chrome cold-start issues). |
| **Offline sync conflicts** | Last-write-wins for v1. Timestamps used to order queued transactions on reconnect. |
| **PWA push infrastructure** | Requires push subscription table in DB + `web-push` npm package with Vercel background functions. |
| **Supabase RLS vs Prisma scoping** | v1: enforce at Prisma query layer (`userId` filter). Add full RLS policies before public launch as defense-in-depth. |
| **Multi-currency in wallets** | v1 scopes all amounts to user-selected base currency. Cross-wallet totals assume same currency. Multi-currency is v2. |
| **Streak freeze UX** | Earned via XP milestone (e.g. Level 5 reward) or simply granted monthly. TBD during Phase 3. |

---

## 9. Appendix

### 9.1 XP Earning Reference

| Action | XP Award | Frequency |
|---|---|---|
| Log a transaction | +10 XP | Per transaction, every time |
| Set up a budget | +50 XP | One-time per budget |
| Create a recurring rule | +30 XP | One-time per rule |
| Stay under budget (full month) | +100 XP | Per budget per month |
| 7-day streak milestone | +150 XP | Per milestone |
| 30-day streak milestone | +300 XP | Per milestone |
| 100-day streak milestone | +750 XP | Per milestone |
| Create first wallet | +25 XP | One-time |
| Export a report | +20 XP | Per export |
| Complete monthly challenge | +200 XP | Per challenge |
| Unlock any achievement | +50 XP | Per achievement |

### 9.2 Level Thresholds (First 10 Levels)

| Level | XP Required | Title |
|---|---|---|
| 1 | 0 XP | Newcomer 🌱 |
| 2 | 400 XP | Tracker 📓 |
| 3 | 900 XP | Budgeter 📋 |
| 4 | 1,600 XP | Saver 💰 |
| 5 | 2,500 XP | Planner 📊 |
| 6 | 3,600 XP | Investor 📈 |
| 7 | 4,900 XP | Strategist 🧠 |
| 8 | 6,400 XP | Optimizer ⚙️ |
| 9 | 8,100 XP | Wealth Builder 🏦 |
| 10 | 10,000 XP | Finance Lord 👑 |

### 9.3 Competing Feature Comparison

| Feature | FinVault | Competitors |
|---|---|---|
| Budgets & Spending Limits | ✅ Free | Paid (YNAB $109/yr, Monarch $100/yr) |
| Recurring Transactions | ✅ Free | Paid (most apps) |
| Multiple Accounts/Wallets | ✅ Free | Paid (Monarch, YNAB) |
| Reports & Analytics | ✅ Free | Paid or limited |
| CSV / PDF Export | ✅ Free | Paid (most apps) |
| Gamification (XP, Streaks) | ✅ Free | Not available in any major finance app |
| PWA / Offline Mode | ✅ Free | Rare; most require native app install |

---

*FinVault PRD v1.0 · March 2026 · Author: Deihl*