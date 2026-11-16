# Diamond Accountability System — Project Specification

> ⚠️ **HISTORICAL — this is the original 2026-05 build spec, not current
> documentation.** The app shipped and moved on. In particular the tech-stack
> section below is wrong: there is no Supabase (auth is custom JWT, storage is
> unused), no Resend, and no SQLite. For how the project actually works today,
> read `CLAUDE.md` and `docs/`. Kept for the domain model, scoring rules, and
> the original product intent.

---

## 🎯 PROJECT OVERVIEW

A web-based accountability management system for a high-ticket business coaching program with ~83 SME business owners across 4 batches. Replaces 3 manual Google Sheets currently used to track member activities, points, and payments.

**Core Value:** Members self-fill their progress → System auto-calculates points, flags risks, sends reminders → Mentor sees data-driven insights instead of managing spreadsheets manually.

---

## 🛠️ TECH STACK (USE EXACTLY THIS)

```
Frontend:    Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
Backend:     Next.js API Routes (no separate backend needed)
Database:    PostgreSQL via Supabase (free tier sufficient for MVP)
ORM:         Prisma
Auth:        Supabase Auth (email/password + magic link)
Charts:      Recharts
Forms:       React Hook Form + Zod validation
Deployment:  Vercel (free tier)
File Storage: Supabase Storage (for evidence uploads)
Email:       Resend (free tier — 100 emails/day)
```

**Why this stack:**
- Single codebase (no separate backend) = fewer Claude Code credits used
- Supabase = auth + DB + storage in one (no glue code)
- All free tiers cover MVP launch
- Easy to extend later

---

## 📐 DEVELOPMENT APPROACH (CRITICAL FOR CREDIT OPTIMIZATION)

### Build in 4 Phases — Don't Build Everything at Once

```
PHASE 1 (MVP):   Modules 1, 2, 4 + Auth + Member/Mentor dashboards
PHASE 2:         Modules 3, 5 (Points + Analytics)
PHASE 3:         Modules 6, 7 (Early Warning + Exit)
PHASE 4:         Modules 8, 9 (Progression + Peer Pairs)
```

**RULES FOR CLAUDE CODE:**
1. Complete one phase fully before starting next
2. Get user approval after each phase
3. Don't add features not in this spec
4. Reuse components aggressively (build a component library once)
5. Use shadcn/ui defaults — don't custom-design components
6. Skip animations, transitions, fancy effects in MVP
7. No tests for MVP (add in Phase 4 if time permits)
8. Write minimal, clear code — no over-abstraction

---

## 👥 USER ROLES

```
1. MENTOR        → Full access to everything
2. AG_CAPTAIN    → Sees only their AG group members + restricted reports
3. MEMBER        → Sees only their own data
```

Role stored in `users.role` enum. Use Row Level Security (RLS) in Supabase to enforce.

---

## 🗄️ DATABASE SCHEMA (PRISMA)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  MENTOR
  AG_CAPTAIN
  MEMBER
}

enum MembershipStatus {
  ACTIVE
  INACTIVE
  ON_BREAK
  EXITED
}

enum PaymentStatus {
  PENDING
  PAID
  OVERDUE
  WAIVED
}

enum TaskStatus {
  ONGOING
  COMPLETED
  PAUSED
  PENDING
}

enum RiskLevel {
  GREEN
  YELLOW
  RED
  BLACK
}

enum ProgressionStage {
  FOUNDATION  // < 25L/year
  GROWTH      // 25L - 2Cr/year
  SCALE       // 2Cr+ /year
}

model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String
  mobile      String?
  role        UserRole @default(MEMBER)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  member      Member?
  agCaptainOf AGGroup[]
}

model Batch {
  id        String   @id @default(cuid())
  name      String   // "Batch 1", "Batch 2"
  startDate DateTime
  createdAt DateTime @default(now())
  
  members   Member[]
}

model AGGroup {
  id          String   @id @default(cuid())
  name        String   // "AG-01", "AG-02"
  captainId   String?
  captain     User?    @relation(fields: [captainId], references: [id])
  createdAt   DateTime @default(now())
  
  members     Member[]
}

model Member {
  id                String           @id @default(cuid())
  userId            String           @unique
  user              User             @relation(fields: [userId], references: [id])
  batchId           String
  batch             Batch            @relation(fields: [batchId], references: [id])
  agGroupId         String?
  agGroup           AGGroup?         @relation(fields: [agGroupId], references: [id])
  
  businessName      String?
  businessCategory  String?
  businessLocation  String?
  joiningDate       DateTime
  membershipValidTill DateTime?
  
  yearlyRevenue     Decimal?         @db.Decimal(15, 2)
  monthlyRevenue    Decimal?         @db.Decimal(15, 2)
  teamSize          Int?
  targetRevenue     Decimal?         @db.Decimal(15, 2)
  
  status            MembershipStatus @default(ACTIVE)
  progressionStage  ProgressionStage @default(FOUNDATION)
  currentRiskLevel  RiskLevel        @default(GREEN)
  
  totalPoints       Int              @default(0)
  
  weeklyUpdates     WeeklyUpdate[]
  payments          Payment[]
  paymentSchedule   PaymentSchedule?
  activityProgress  ActivityProgress[]
  pointsLog         PointsLog[]
  riskFlags         RiskFlag[]
  exitInterview     ExitInterview?
  peerPairAsMember1 PeerPair[]       @relation("PairMember1")
  peerPairAsMember2 PeerPair[]       @relation("PairMember2")
  
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
}

// 15 Activity Areas — the core framework
model ActivityArea {
  id          String   @id @default(cuid())
  name        String   @unique // "Organized Database", "SIT", "Customer Interviews"...
  description String?
  order       Int
  
  progress    ActivityProgress[]
}

model ActivityProgress {
  id              String       @id @default(cuid())
  memberId        String
  member          Member       @relation(fields: [memberId], references: [id])
  activityAreaId  String
  activityArea    ActivityArea @relation(fields: [activityAreaId], references: [id])
  
  status          TaskStatus   @default(PENDING)
  currentStatus   String?      // free text: "3500/8000 done"
  output          String?      // outcome description
  commitment      String?      // what they committed to
  deadline        DateTime?
  evidenceUrl     String?      // uploaded file URL
  
  updatedAt       DateTime     @updatedAt
  createdAt       DateTime     @default(now())
  
  @@unique([memberId, activityAreaId])
}

model WeeklyUpdate {
  id            String   @id @default(cuid())
  memberId      String
  member        Member   @relation(fields: [memberId], references: [id])
  weekStartDate DateTime
  
  revenueThisWeek    Decimal? @db.Decimal(15, 2)
  tasksCompleted     String?  // JSON array of activity IDs
  nextCommitment     String?
  challenges         String?
  successStory       String?
  evidenceUrls       String?  // JSON array
  
  pointsAwarded      Int      @default(0)
  submittedOnTime    Boolean  @default(true)
  
  createdAt          DateTime @default(now())
  
  @@unique([memberId, weekStartDate])
}

model PaymentSchedule {
  id              String   @id @default(cuid())
  memberId        String   @unique
  member          Member   @relation(fields: [memberId], references: [id])
  
  basePrice       Decimal  @db.Decimal(15, 2)
  gstAmount       Decimal  @db.Decimal(15, 2)
  totalAmount     Decimal  @db.Decimal(15, 2)
  bookingAmount   Decimal  @db.Decimal(15, 2)
  numberOfDues    Int      // 1, 3, 6, 9, 12, etc
  perDueAmount    Decimal  @db.Decimal(15, 2)
  offerType       String?  // "Unlimited 1-1", "4-1-1 Plus GST", etc
  
  createdAt       DateTime @default(now())
}

model Payment {
  id              String        @id @default(cuid())
  memberId        String
  member          Member        @relation(fields: [memberId], references: [id])
  
  dueNumber       Int           // 1st due, 2nd due, etc
  dueAmount       Decimal       @db.Decimal(15, 2)
  dueDate         DateTime
  receivedDate    DateTime?
  receivedAmount  Decimal?      @db.Decimal(15, 2)
  status          PaymentStatus @default(PENDING)
  remarks         String?
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

model PointsLog {
  id          String   @id @default(cuid())
  memberId    String
  member      Member   @relation(fields: [memberId], references: [id])
  
  points      Int
  reason      String   // "Weekly update submitted", "Success story shared", etc
  category    String   // "ATTENDANCE", "TASK_COMPLETION", "BONUS"
  awardedAt   DateTime @default(now())
}

model RiskFlag {
  id              String    @id @default(cuid())
  memberId        String
  member          Member    @relation(fields: [memberId], references: [id])
  
  triggerType     String    // "MISSED_UPDATE", "MISSED_CALL", "PAYMENT_SKIP", "REVENUE_DROP"
  severity        RiskLevel
  description     String
  resolvedAt      DateTime?
  
  createdAt       DateTime  @default(now())
}

model ExitInterview {
  id                  String   @id @default(cuid())
  memberId            String   @unique
  member              Member   @relation(fields: [memberId], references: [id])
  
  strugglingArea      String?
  disengagementMonth  String?
  mainReason          String?
  feedback            String?
  wouldRejoin         Boolean?
  rejoinTimeframe     String?
  
  exitDate            DateTime
  createdAt           DateTime @default(now())
}

model PeerPair {
  id          String   @id @default(cuid())
  member1Id   String
  member1     Member   @relation("PairMember1", fields: [member1Id], references: [id])
  member2Id   String
  member2     Member   @relation("PairMember2", fields: [member2Id], references: [id])
  
  agGroupId   String?
  weeklyCommitment String?
  isActive    Boolean  @default(true)
  
  createdAt   DateTime @default(now())
}

model CallLog {
  id          String   @id @default(cuid())
  memberId    String
  callDate    DateTime
  notes       String   @db.Text
  commitments String?  @db.Text
  status      String?  // "Completed", "Pending", "Not connected"
  conductedBy String?  // mentor or AG captain name
  
  createdAt   DateTime @default(now())
}
```

---

## 📋 THE 15 ACTIVITY AREAS (SEED DATA)

Insert these into `ActivityArea` table on first run:

```javascript
const ACTIVITY_AREAS = [
  { order: 1,  name: "Organized Database",         description: "Build a categorized customer database" },
  { order: 2,  name: "SIT (Stay In Touch)",        description: "Regular touchpoints with existing customers" },
  { order: 3,  name: "Marketing Campaigns",        description: "Active marketing initiatives" },
  { order: 4,  name: "Customer Interviews",        description: "Structured customer feedback sessions" },
  { order: 5,  name: "IRB",                        description: "Ideal Reference Bank — testimonials & social proof" },
  { order: 6,  name: "C1 – Offline System",        description: "Offline customer engagement system" },
  { order: 7,  name: "4C & Categories",            description: "Sales script framework (Connection, Curiosity, Conviction, Closing)" },
  { order: 8,  name: "Team & Training",            description: "Team building and skill development" },
  { order: 9,  name: "ARC (Top 20 Customers)",     description: "Focused engagement with top 20 customers" },
  { order: 10, name: "Market 2.0 & Ideal Customer", description: "Identifying and targeting ideal customers" },
  { order: 11, name: "Capacity Utilization",       description: "Optimizing production/service capacity" },
  { order: 12, name: "Customer Journey",           description: "Mapping and refining customer experience" },
  { order: 13, name: "Digital Marketing",          description: "Online marketing presence and campaigns" },
  { order: 14, name: "Numbers & Review System",    description: "Metrics tracking and review cadence" },
  { order: 15, name: "Next 60 Days Priority",      description: "Short-term strategic priorities" },
];
```

---

## 🎯 POINTS SYSTEM RULES

```javascript
const POINTS_RULES = {
  WEEKLY_UPDATE_SUBMITTED: 100,        // On time submission
  WEEKLY_UPDATE_LATE: 50,              // Late submission
  TASK_COMPLETED: 100,                 // Per task marked complete
  SUCCESS_STORY_SHARED: 100,           // Per success story
  ATTENDANCE_BOSS_SESSION: 100,
  ATTENDANCE_DIAMOND_CALL: 100,
  ATTENDANCE_COFFEE_MORNING: 50,
  TOP_TAKEAWAY_SHARED: 100,
  
  // Bonus points (manually awarded by mentor)
  OFFLINE_PARTICIPATION: 500,
  SPEAKER_BONUS: 1000,
  AWARD_WINNER: 1000,
};
```

---

## ⚠️ EARLY WARNING SYSTEM RULES

```javascript
function calculateRiskLevel(member) {
  const triggers = [];
  
  // Trigger 1: Missed weekly update for 1+ weeks
  if (daysSinceLastUpdate > 7) triggers.push("MISSED_UPDATE");
  
  // Trigger 2: No call attendance for 2+ sessions
  if (missedCallsInRow >= 2) triggers.push("MISSED_CALL");
  
  // Trigger 3: Payment overdue
  if (hasOverduePayment) triggers.push("PAYMENT_SKIP");
  
  // Trigger 4: Revenue drop >20% month-on-month
  if (revenueDropPercent > 20) triggers.push("REVENUE_DROP");
  
  // Trigger 5: No task completion for 3 weeks
  if (weeksWithoutCompletion >= 3) triggers.push("NO_COMPLETION");
  
  if (triggers.length === 0) return "GREEN";
  if (triggers.length === 1) return "YELLOW";
  if (triggers.length === 2) return "RED";
  return "BLACK";
}

// Notification flow:
// YELLOW → AG Captain notified
// RED    → Mentor + AG Captain notified
// BLACK  → Top of mentor's priority list with red badge
```

Run this check daily via Vercel Cron Job (`/api/cron/risk-check`).

---

## 🏗️ PROJECT STRUCTURE

```
diamond-accountability/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                    # Seed activity areas + admin user
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (member)/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── weekly-update/page.tsx
│   │   │   ├── activities/page.tsx
│   │   │   ├── payments/page.tsx
│   │   │   └── leaderboard/page.tsx
│   │   ├── (captain)/
│   │   │   └── group/page.tsx
│   │   ├── (mentor)/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── members/page.tsx
│   │   │   ├── members/[id]/page.tsx
│   │   │   ├── batches/page.tsx
│   │   │   ├── ag-groups/page.tsx
│   │   │   ├── payments/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   ├── risk-flags/page.tsx
│   │   │   └── import/page.tsx
│   │   ├── api/
│   │   │   ├── weekly-updates/route.ts
│   │   │   ├── payments/route.ts
│   │   │   ├── members/route.ts
│   │   │   ├── import/csv/route.ts
│   │   │   ├── cron/risk-check/route.ts
│   │   │   ├── cron/payment-reminders/route.ts
│   │   │   └── points/award/route.ts
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── dashboard/
│   │   │   ├── StatCard.tsx
│   │   │   ├── RiskBadge.tsx
│   │   │   ├── RevenueChart.tsx
│   │   │   └── LeaderboardTable.tsx
│   │   ├── forms/
│   │   │   ├── WeeklyUpdateForm.tsx
│   │   │   ├── MemberForm.tsx
│   │   │   └── PaymentForm.tsx
│   │   └── layouts/
│   │       ├── MentorLayout.tsx
│   │       ├── MemberLayout.tsx
│   │       └── CaptainLayout.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── supabase.ts
│   │   ├── auth.ts
│   │   ├── points-calculator.ts
│   │   ├── risk-calculator.ts
│   │   ├── csv-importer.ts
│   │   └── email.ts
│   ├── hooks/
│   │   ├── useUser.ts
│   │   └── useRole.ts
│   └── types/
│       └── index.ts
├── public/
├── .env.local
├── package.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

---

## 📄 CSV IMPORT SPEC (FROM EXISTING SHEETS)

Build a single import page at `/mentor/import` that accepts 3 CSV files:

### CSV 1: Members Master (from Accountability Sheet)
```
Columns expected:
- S no, Name, Mobile Number, AG Group, Active Status, Dues Status
```

### CSV 2: Points Data (from Point System sheet)
```
Columns expected:
- S No, Name, Mobile Number, AG group, Total Points, Rank
```

### CSV 3: Payment Data (from Payment sheet)
```
Columns expected:
- Serial No, Name, Onboarding Date, Business Name, Mobile,
- Base Price, GST, Total, Booking Amount, Number of Dues,
- Per-month payment columns (Dec/Amount, Dec/Date, Dec/Remark, etc)
```

**Importer must:**
1. Auto-detect columns by header name (case-insensitive, fuzzy match)
2. Show preview before final import
3. Flag conflicts (duplicate mobile numbers, missing AG groups)
4. Allow manual corrections in the preview
5. Run import in a transaction (all or nothing)

---

## 🎨 UI/UX GUIDELINES

**Keep it simple. Use shadcn/ui defaults.**

```
Layout:
- Sidebar navigation on desktop
- Bottom navigation on mobile
- Top bar shows: user name, role, logout

Colors (for risk levels):
- Green:  #10b981
- Yellow: #f59e0b
- Red:    #ef4444
- Black:  #1f2937

Typography:
- Inter font
- Headings: font-semibold
- Body: font-normal

Components:
- Use Card for all dashboard widgets
- Use Table for lists
- Use Tabs for member detail views
- Use Dialog for forms
- Use Toast (sonner) for notifications
```

**Mobile-first.** Most members will use phones to submit updates.

---

## 🔐 AUTHENTICATION & AUTHORIZATION

```
Supabase Auth:
- Email + password
- Magic link (preferred for less-techy members)

On signup:
- Auto-create User record with role=MEMBER
- Mentor manually upgrades roles via admin panel

Authorization (middleware.ts):
- /member/*  → role=MEMBER, AG_CAPTAIN, or MENTOR
- /captain/* → role=AG_CAPTAIN or MENTOR
- /mentor/*  → role=MENTOR only
```

**Use Supabase RLS policies** for database-level security:
```sql
-- Members can only see their own data
CREATE POLICY "members_own_data" ON members
FOR SELECT USING (auth.uid() = user_id OR 
                  (SELECT role FROM users WHERE id = auth.uid()) IN ('AG_CAPTAIN', 'MENTOR'));
```

---

## 📧 EMAIL/NOTIFICATION TEMPLATES (RESEND)

Build these 4 templates as React Email components:

```
1. PaymentReminder
   - 5 days before, on due, after due

2. WeeklyUpdateReminder  
   - Friday evening if not submitted

3. RiskAlert
   - To AG Captain when member goes YELLOW
   - To Mentor when member goes RED/BLACK

4. WelcomeEmail
   - New member onboarding
```

---

## 🚀 DEVELOPMENT PHASES — DETAILED

### PHASE 1: MVP (Estimated: 60% of credits)
**Goal: Working system that replaces current sheets**

```
Tasks:
1. Setup Next.js + Supabase + Prisma
2. Build auth flow (login/signup)
3. Build database schema + migrations
4. Seed activity areas
5. Build Member Profile module
6. Build Accountability Tracker (Module 2)
   - Weekly update form
   - Activity progress tracker
   - View own data
7. Build Payment Tracker (Module 4)
   - Payment schedule creation
   - Payment recording
   - Status tracking
8. Build basic Mentor dashboard
   - Member list
   - Member detail view
   - Add/edit members
9. Build CSV import for all 3 sheet types
10. Deploy to Vercel

Deliverable: Mentor can import all existing data, members can submit weekly updates, payments are tracked.
```

### PHASE 2: Engagement (Estimated: 15% of credits)
```
Tasks:
1. Build Points & Rewards module (Module 3)
   - Auto point calculation on actions
   - Points log
2. Build leaderboard (overall + AG-wise)
3. Build Mentor Analytics (Module 5)
   - Revenue trends
   - Activity completion heatmap
   - AG comparison

Deliverable: Gamification live, analytics visible.
```

### PHASE 3: Intelligence (Estimated: 15% of credits)
```
Tasks:
1. Build Early Warning System (Module 6)
   - Cron job for daily risk check
   - Risk badges on UI
   - Auto-notifications
2. Build Exit Management (Module 7)
   - Exit interview form
   - Pattern reporting

Deliverable: System is now proactive, not just reactive.
```

### PHASE 4: Advanced (Estimated: 10% of credits)
```
Tasks:
1. Build Progression Tracks (Module 8)
   - Auto-stage assignment
   - Stage-specific dashboards
2. Build Peer Pairs (Module 9)
   - Pair management
   - Peer check-in flow
3. Build AG Captain dashboard
4. Add WhatsApp reminder integration (optional)

Deliverable: Full system, all 9 modules complete.
```

---

## ⚡ CLAUDE CODE OPTIMIZATION RULES

**MUST FOLLOW to save credits:**

1. **One task at a time** — Don't try to scaffold everything at once
2. **Use shadcn CLI** — `npx shadcn-ui@latest add button card table` (don't write components from scratch)
3. **Reuse Prisma client** — Single instance in `lib/prisma.ts`
4. **No premature optimization** — Use Supabase's built-in features (auth, RLS, storage) instead of custom solutions
5. **Server Components by default** — Only use client components for forms and interactivity
6. **Skip these in MVP:**
   - Animations
   - Dark mode (add later if needed)
   - Tests
   - Storybook
   - Internationalization
   - Custom design system
7. **Use TypeScript strictly** — Catches errors early, saves debugging credits
8. **Don't refactor working code** — If it works, leave it
9. **Ask before adding new dependencies** — Check if it's truly needed
10. **Commit after each module** — Git history = recovery if something breaks

---

## 📦 INITIAL DEPENDENCIES

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@prisma/client": "^5.20.0",
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.0",
    "tailwindcss": "^3.4.0",
    "lucide-react": "^0.445.0",
    "recharts": "^2.12.0",
    "react-hook-form": "^7.53.0",
    "zod": "^3.23.0",
    "@hookform/resolvers": "^3.9.0",
    "papaparse": "^5.4.0",
    "date-fns": "^4.1.0",
    "resend": "^4.0.0",
    "sonner": "^1.5.0"
  },
  "devDependencies": {
    "prisma": "^5.20.0",
    "typescript": "^5.6.0",
    "@types/node": "^22.7.0",
    "@types/react": "^18.3.0",
    "@types/papaparse": "^5.3.0"
  }
}
```

---

## 🔧 ENVIRONMENT VARIABLES

```
DATABASE_URL=                    # Supabase Postgres connection string
DIRECT_URL=                      # Supabase direct connection (for migrations)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # For admin operations
RESEND_API_KEY=                  # For email
CRON_SECRET=                     # For securing cron endpoints
NEXT_PUBLIC_APP_URL=             # https://yourapp.vercel.app
```

---

## 🧪 SAMPLE TEST DATA

After import, system should have:
- 4 Batches (Nov 2024, July 2025, Nov 2025, March 2026)
- ~7 AG Groups (AG-01 through AG-07)
- ~83 Members across batches
- 15 Activity Areas
- Payment schedules for each member
- Historical points data (from existing leaderboard)

---

## 📊 KEY DASHBOARDS — WHAT EACH MUST SHOW

### Member Dashboard
```
Top row: 4 stat cards
- This week's revenue
- Total points
- Current rank
- Risk status badge

Below:
- "Submit Weekly Update" CTA (big button if not submitted this week)
- My active commitments (list)
- Upcoming payment (with amount + days remaining)
- My 15 activity areas (grid with status colors)
```

### AG Captain Dashboard
```
- My group's leaderboard
- Group activity completion %
- Members at risk (yellow/red flagged)
- Group revenue trend
- (Restricted views configured by mentor)
```

### Mentor Dashboard
```
Top row: 6 stat cards
- Total active members
- Total points awarded this month
- Collection rate this month
- Members at risk count (red badge)
- Avg revenue growth %
- Pending payments

Below:
- Risk flags table (sortable, with action buttons)
- Recent weekly updates
- Payment dues this week
- AG group comparison chart
- Revenue trend across cohort
```

---

## 🔄 DATA IMPORT STRATEGY

**Day 1 after build:**
1. Export 3 Google Sheets as CSV
2. Use `/mentor/import` page
3. System auto-detects columns
4. Review flagged conflicts
5. Confirm import
6. All historical data live in system

**Known issues to handle during import:**
- "Acive" typo for "Active" — normalize during import
- Rathakrishna VG due count (12 vs 9) — flag for manual confirmation
- Vibin fee inconsistency — flag for manual confirmation
- Empty AG groups — assign default or skip
- Duplicate mobile numbers — flag and ask user to resolve

---

## 🎯 SUCCESS CRITERIA

**Phase 1 is complete when:**
- [ ] Mentor can log in and see member list
- [ ] Mentor can import all 3 sheets via CSV
- [ ] Members can log in and submit weekly updates
- [ ] Payment status auto-updates when payment recorded
- [ ] Mobile responsive
- [ ] Deployed on Vercel and accessible

**Full project is complete when:**
- [ ] All 9 modules functional
- [ ] All 3 user roles working with proper permissions
- [ ] Risk flags auto-update daily
- [ ] Payment reminders auto-send
- [ ] Leaderboard live
- [ ] AG Captain can see group reports
- [ ] Exit interviews captured for inactive members

---

## 🚨 IMPORTANT REMINDERS FOR CLAUDE CODE

1. **READ THIS DOC FULLY before writing code**
2. **Build Phase 1 first — don't skip ahead**
3. **Use shadcn/ui — don't custom design**
4. **Mobile-first responsive design**
5. **All forms must validate with Zod**
6. **All API routes must check authorization**
7. **Use Supabase RLS for database security**
8. **Commit after each major feature**
9. **Ask user before adding any dependency not in the list**
10. **No over-engineering — ship working features**

---

## 📞 USER CONTEXT (THE COACH'S PROGRAM)

```
Program name: Diamond Membership
Coach reference: "VK Ma'am" / "Sir"
Members: SME business owners in Tamil Nadu, India
Languages: English + Tamil (UI in English, content can be either)
Batches so far: 4 batches (Nov 2024, July 2025, Nov 2025, March 2026)
Current member count: ~83 active members
Membership fee range: ₹1.4L - ₹4L per member
EMI options: 1, 3, 6, 9, 12 installments
Currency: INR (₹)
Date format: DD.MM.YYYY (Indian convention)
```

---

## 🎁 FINAL NOTE

This system replaces ~3 hours/day of manual spreadsheet work. Every feature has a real purpose — don't skip the early warning system or peer pairs even if they seem "extra." They're what make this a coaching platform, not just a CRM.

**Build it lean. Build it right. Ship Phase 1 fast.**

— End of Specification —
