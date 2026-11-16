# Diamond Accountability — Screen-by-Screen Design Prompts

Use these to commission a redesign from any AI design tool (v0.dev, Figma AI,
Vercel's `v0`, Claude, ChatGPT image gen, etc.). Each section is self-contained
— paste **one section at a time** into the tool of your choice and you'll get
back coherent screen designs that match the existing data model.

---

## 0. Product context (paste this once at the top of every conversation)

> You are redesigning a B2B SaaS dashboard called **Diamond Accountability**.
> The product is used inside a one-year coaching/mentorship program for ~80
> small-business founders in India. Three roles use it:
>
> - **Mentor / Superadmin** — runs the whole program. Sees every member,
>   awards points, tracks payment dues, monitors risk, imports CSVs.
> - **AG Captain** — leads a small Accountability Group (AG) of ~10 members.
>   Sees only their AG.
> - **Member** — a founder. Sees their own progress: weekly updates,
>   activities, points, payments, peer partner.
>
> Visual direction: clean, calm, business-class. White or near-white surfaces,
> generous whitespace, sober typography (Inter / system sans). The brand
> identity uses **deep purple `#a838ab`** and **soft pink `#e56881`** as
> accents — use these for primary buttons, focus states, charts, and small
> brand touches. **Do not** wash whole pages or sidebars in those colors;
> dense data must stay readable. Think Linear, Stripe Dashboard, Notion — not
> a marketing site.
>
> Data is denominated in Indian Rupees (₹), dates in DD.MM.YYYY format.
> Currency uses Indian numbering (lakhs / crores). Risk levels are visualized
> as colored chips: GREEN → safe, YELLOW → warning, RED → urgent, BLACK →
> critical.

---

## 1. Login screen — `/login`

> Single centered card on a soft neutral page background. Brand mark "💎
> Diamond Accountability" at the top.
>
> Fields:
> 1. **Username, email, or mobile** — single text input. Placeholder:
>    `superadmin / you@example.com / 98765xxxxx`.
> 2. **Password** — password input.
> 3. **Sign in** primary button, full-width.
>
> Below the form, small helper text in muted gray:
> *"Don't have an account? Contact your mentor — only mentors can create
> logins."* (No signup link, no "forgot password" link — password reset is
> handled by the mentor via the members panel.)
>
> States: idle, loading (button shows "Signing in…"), error toast.
> Mobile: card fills the viewport with comfortable padding.

---

## 2. Member dashboard — `/member/dashboard`

> The most important screen — a founder opens this 3-5x per week.
>
> **Top: Pending Action card** (only renders if there's an unread
> notification). Amber-tinted card with an alert icon, title *"Pending
> action (N)"* where N is total unread count, then a single notification row
> with title, body, and an "Open" button when the notification has a link.
> Below the row a small underlined link: *"Click to view N more
> notifications →"* that goes to `/notifications`.
>
> **Stat strip — 4 cards in a row** (stack to 2x2 on mobile):
> 1. This week's revenue (₹) — with hint "Week of DD.MM.YYYY"
> 2. Total points
> 3. Current rank — `#N` with hint "of X members"
> 4. Risk status — colored risk chip (GREEN/YELLOW/RED/BLACK)
>
> **Weekly update CTA** (renders only if this week's update is missing) —
> primary-tinted card with title "Submit your weekly update", subtitle
> "Week of DD.MM.YYYY — earn 100 points", "Submit Update" button on the
> right.
>
> **Middle row — 2 columns, stack on mobile:**
> - *My active commitments* — list of ongoing activity-area commitments with
>   name, commitment text, deadline. Empty state: "No active commitments."
> - *Upcoming payment* — big ₹ amount, due date, and a colored badge that
>   says either "N days remaining" (gray) or "N days overdue" (red).
> - *My Peer Partner* — partner name, their AG group, weekly commitment text.
>   Empty state: "No peer partner assigned yet."
>
> **Bottom — My 15 activity areas** — a 3-column grid (1 col mobile, 2
> tablet) of tiles, one per activity area. Each tile is **clickable** and
> opens an update dialog. Tile shows:
> - Activity name (bold)
> - Status chip in the top-right (PENDING / ONGOING / COMPLETED / PAUSED)
> - Optional current-status line in smaller muted text
> - Small hint at the bottom: "Click to update"
> - Background tint matches status: gray for PENDING, soft amber for
>   ONGOING, soft emerald for COMPLETED, soft red for PAUSED. Tiles have a
>   subtle hover state.
>
> The 15 activity area names are:
> *Organized Database, SIT (Stay In Touch), Marketing Campaigns, Customer
> Interviews, IRB, C1 – Offline System, 4C & Categories, Team & Training,
> ARC (Top 20 Customers), Market 2.0 & Ideal Customer, Capacity Utilization,
> Customer Journey, Digital Marketing, Numbers & Review System, Next 60
> Days Priority.*

---

## 3. Weekly update form — `/member/weekly-update`

> A single-column form, max-width ~640px.
>
> Header: "Submit weekly update — Week of DD.MM.YYYY (earn 100 points)"
>
> Fields:
> - **Revenue this week** (₹, number input)
> - **Tasks completed** (textarea, multi-line)
> - **Next week's commitment** (textarea)
> - **Challenges faced** (textarea, optional)
> - **Success story / breakthrough** (textarea, optional)
> - **Evidence files** — file picker with preview chips for already-uploaded
>   URLs
>
> Footer: "Submit update" primary button, "Save draft" secondary (optional).
>
> If a member has already submitted for this week, show a read-only view of
> what they submitted with an "Edit" button.

---

## 4. Member activities — `/member/activities`

> Full list view of all 15 activity areas as a single table.
>
> Columns: Activity | Status (chip) | Current | Commitment | Deadline | (action: "Update" button)
>
> Clicking "Update" opens a modal:
> - Activity name as title
> - Status dropdown (PENDING / ONGOING / COMPLETED / PAUSED)
> - Current status (text)
> - Output (text)
> - Commitment (textarea)
> - Deadline (date)
> - Evidence URL (text + file upload)
> - Footer: Cancel / Save

---

## 5. Member payments — `/member/payments`

> Table of all dues for the logged-in member with columns:
> Due # | Amount (₹) | Due date | Status chip | Received date | Received amount | Remarks
>
> Status chip variants: PAID (green/solid), PENDING (outline), OVERDUE
> (red/solid), WAIVED (gray).
>
> Top of page: summary strip — Total dues, Total paid, Remaining balance.
>
> Mobile: collapse to cards, one per due.

---

## 6. Member leaderboard — `/member/leaderboard`

> Ranked list of all members by `totalPoints`. Show top 10 prominently
> (medal icons for top 3), then a divider, then "You are #N" highlighted in
> the list of remaining members.
>
> Each row: rank | member name | AG group chip | points.
>
> Tab/filter at top: *All members* | *My AG only*.

---

## 7. Mentor dashboard — `/mentor/dashboard`

> The control room. 6 stat cards in a 3x2 grid (responsive 2x3 / 1x6):
>
> 1. **Active Members** — count, person icon.
> 2. **Top 3 AGs (this month)** — special card; instead of a single number,
>    it's a mini ranked list: `#1 AG-04  4,500 pts`, `#2 AG-02  3,800 pts`,
>    `#3 AG-05  2,950 pts`. Trophy icon top-right.
> 3. **Collection Rate** — percentage, with hint `₹X received of ₹Y due
>    this month`. Percent icon.
> 4. **At Risk** — count of members not GREEN, warning icon.
> 5. **Avg Revenue Growth** — `+12%` or `-5%`, hint `This month ₹X vs last
>    ₹Y (from weekly updates)`. Empty state: "—" with hint "No weekly
>    revenue updates yet". TrendingUp icon.
> 6. **Pending Payments** — count, hint `₹X due this month`, wallet icon.
> 7. **Payments Received** — full amount, with a **dropdown** in the
>    top-right corner offering: This Week / This Month / This Quarter /
>    Last Quarter / This Year / Last Year. Subtitle: "N payments • <selected
>    range>". Wallet icon.
>
> Below the stat strip, a 2-column grid of large cards:
> - **Risk Flags** — table of at-risk members (Risk chip, Member name link,
>   AG, comma-separated reason list).
> - **Recent Weekly Updates** — table of latest 10 (Member, Week date, Revenue).
> - **Payment Dues This Week** — table of dues in current week (Member, Due
>   #, Amount, Date).
> - **AG Group Comparison** — bar chart of avg points per AG.
> - **Revenue Trend (Last 12 Weeks)** — line chart (full-width, spans 2 cols).

---

## 8. Mentor members table — `/mentor/members`

> Search bar at top, then a table.
>
> Columns (all sortable, click header to cycle asc/desc/off):
> Name | Email | Mobile | Batch | AG Group | Status chip | Risk chip | Points | (action: "View" link)
>
> Top-right: **"Add member"** button → `/mentor/members/new`.
> Top-left: filters as dropdown chips — Status, Risk level, Batch, AG.
>
> Empty state when no members: "No members yet — import CSV or add manually."

---

## 9. Mentor member detail — `/mentor/members/[id]`

> Full profile screen. Layout:
>
> **Header**: avatar circle with initials, member name, mobile, email,
> business name, joining date. Right side: Risk chip + Status chip + a
> kebab menu (Edit, Reset password, Record exit).
>
> **Stat strip** below header: Total points, Current rank, This week's
> revenue, Total paid.
>
> **Tabs or sectioned content**:
> 1. **Activities** — 15 tiles (same component as member dashboard) but
>    read-only for mentor.
> 2. **Weekly updates** — timeline of submissions (most recent first).
> 3. **Payments** — full payment schedule + history.
> 4. **Points log** — every award/deduction with reason + category.
> 5. **Risk flags** — open + resolved flags with timestamps.
> 6. **Peer partner** — current pairing.
> 7. **Call logs** — mentor's call notes.

---

## 10. Mentor: add member — `/mentor/members/new`

> Single-column form, max-width 560px.
>
> Fields: Name, Email, Mobile, Initial password (auto-generated, copy
> button), Batch (select), AG Group (select), Business name, Joining date.
>
> Footer: Cancel / Create member.

---

## 11. Mentor payments — `/mentor/payments`

> Top: filter dropdown — Due This Week / Overdue / Pending / Paid / All.
> Counter `N of M`.
>
> Sortable table with columns:
> Member | Due # | Amount | Due Date | Status chip | Received | Received Amt | Remarks | (action: "Mark Paid" button)
>
> Clicking "Mark Paid" opens a modal: Received date (date picker, defaults
> to today), Received amount (defaults to due amount), Cancel / Record.

---

## 12. Mentor: upload data — `/mentor/import`

> Top: a help card listing the three uploads in order, with the exact sheet
> names from the source workbooks:
>
> 1. **Members** — Diamond Members Accountability Sheet.xlsx → Dimond
>    Access List.
> 2. **Payments** — Diamond Payment Update.xlsx → 2) Active Diamond
>    payments. Note: handles 2-row merged headers; creates both paid and
>    pending dues; batches inferred from onboarding date.
> 3. **Points** — Diamond Point System (Responses).xlsx → Form Responses 1.
>
> Below, three independent upload sections (Members / Points / Payments).
> Each:
> - File picker that accepts .csv .tsv .xlsx .xls.
> - If the workbook has multiple sheets, show a sheet picker as small
>   buttons.
> - After parse, show a preview: a count badge (e.g. "82 valid · 0 errors"),
>   an error panel if any, and a scrollable HTML table of the first 50
>   parsed rows.
> - **Confirm Import (N)** primary + **Cancel** secondary.
>
> After commit, a toast: "Imported X, skipped Y, errors Z."

---

## 13. Mentor: AG Groups — `/mentor/ag-groups`

> Cards-grid layout. Each AG group is a card with:
> - AG name (e.g. "AG-01")
> - Member count
> - Captain (avatar + name) if assigned
> - Average points
> - "View members" link
>
> Top-right: "Create AG" button.

---

## 14. Mentor: Batches — `/mentor/batches`

> Table:
> Batch name | Start date | Member count | Active members | (actions: Rename, Archive)
>
> Default seeded batches: Batch 01 (Nov 2024 – Mar 2025), Batch 02 (Apr –
> Aug 2025), Batch 03 (Sep 2025 – Feb 2026), Batch 04 (Mar 2026 +).
>
> Top-right: "Create batch" button.

---

## 15. Mentor: Peer pairs — `/mentor/peer-pairs`

> Table of active pairings:
> Member 1 | Member 2 | AG | Weekly commitment | Created | (action: Unpair)
>
> Top-right: "Create pair" button → modal with two member selects + AG +
> commitment textarea.

---

## 16. Mentor: Award points — `/mentor/points`

> Form to award points to one or many members.
> Fields: Member multi-select (chips), Points (+/-), Reason (text), Category
> (dropdown: ATTENDANCE / BONUS / WEEKLY_UPDATE / PENALTY / OTHER).
>
> Below: recent points log table — Member, Points, Reason, Category, Awarded
> at, Awarded by.

---

## 17. Mentor: Progression — `/mentor/progression`

> Three big columns, one per stage: FOUNDATION, GROWTH, SCALE.
> Each column shows a list of members currently in that stage with
> avatar + name + AG + points.
>
> Top: "Recompute stages" button (recalculates which stage each member is
> in based on a rubric).

---

## 18. Mentor: Analytics — `/mentor/analytics`

> A page full of charts:
> - Revenue trend line (weekly, last 12 weeks)
> - Active vs inactive members over time
> - Risk distribution donut
> - Points by AG bar chart
> - Payment collection trend
> - Activity completion heatmap
>
> Use Recharts. Each chart in its own card. 2-column grid on desktop.

---

## 19. Mentor: Risk flags — `/mentor/risk-flags`

> Two tabs: **Open** and **Resolved**.
>
> Sortable table:
> Severity chip | Member | AG | Trigger type | Description | Created at |
> (action: "Resolve" / "Reopen")
>
> Trigger types: MISSED_UPDATE, MISSED_CALL, PAYMENT_SKIP, REVENUE_DROP,
> NO_COMPLETION (display as nicely-spaced text not enum values).

---

## 20. Mentor: Send reminders — `/mentor/reminders`

> Two sections:
>
> 1. **Bulk reminder** — pick a template (Weekly update missing / Payment
>    due / Payment overdue / Custom), filter who it goes to (All members /
>    By AG / By risk / By batch / Just unpaid), preview the message,
>    "Send N reminders" button.
>
> 2. **Individual reminder** — search member, pick template, customize
>    title + body, "Send".
>
> Each delivery creates an in-app notification (we don't do email/WhatsApp
> in this MVP).

---

## 21. Mentor: Exits — `/mentor/exits`

> Table of recorded exits:
> Member | Exit date | Disengagement month | Main reason | Would rejoin?
>
> Top-right: "Record exit" → modal form with member select, exit date,
> struggling area, main reason, feedback, would-rejoin checkbox, rejoin
> timeframe text.

---

## 22. AG Captain dashboard — `/captain/dashboard`

> Like mentor dashboard but scoped to the captain's AG only.
> Stats: Active members in my AG | At risk in my AG | Avg revenue this
> month | Top 3 members in my AG.
> Below: list of all members in the AG with risk + last update + this
> week's revenue.

---

## 23. AG Captain group — `/captain/group`

> Detailed view of the captain's AG: roster of members with mini-profile
> cards, recent weekly updates, risk flags, upcoming dues.

---

## 24. AG Captain risk — `/captain/risk`

> Same as mentor's risk-flags page but filtered to the captain's AG.

---

## 25. Notifications — `/notifications`

> Inbox layout. Two columns on desktop:
> - **Left** (narrow): filter chips — Unread, All, Risk alerts, Payment
>   reminders, Weekly reminders.
> - **Right**: notification list. Each row:
>   - Icon by kind (alert / wallet / calendar / megaphone)
>   - Title (bold if unread)
>   - Body (one line, truncated)
>   - Time ago ("2h", "yesterday", "3d")
>   - "Open" if it has a link, "Mark read" otherwise.
>
> Top of list: "Mark all as read" button.

---

## 26. Change password — `/change-password`

> Single-column form: Current password, New password, Confirm new password,
> Save button. Form gets disabled if `mustChangePassword` is the only reason
> the user is on this page (no current-password field — silent reset).

---

## 27. Reset password (token link) — `/reset-password/[token]`

> Public page that the recipient lands on from an email/SMS link.
> Fields: New password, Confirm new password, "Set password" button. After
> success, redirect to login with a toast "Password set — sign in".

---

## Shared chrome (applies to all signed-in screens except auth)

> **Sidebar** (collapsible on mobile): brand mark at top "💎 Diamond",
> grouped nav items with lucide icons. For mentor:
> Dashboard, Members, Batches, AG Groups, Peer Pairs, Payments, Award
> Points, Progression, Analytics, Risk Flags, Send Reminders, Exits,
> Upload Data.
>
> Footer of sidebar: signed-in user's name + role.
>
> **Top bar** (sticky): current page title on the left. Right: notification
> bell with unread badge, "Change password" icon-link, "Logout" button.
>
> **Mobile bottom nav**: shows the first 5 sidebar items as tabs.

---

## Cross-cutting visual rules

> 1. **Risk chip colors**: GREEN `#10b981`, YELLOW `#f59e0b`, RED `#ef4444`,
>    BLACK `#1f2937`. White text on solid background.
> 2. **Currency**: prefix `₹`, Indian thousands grouping (e.g. `₹1,40,000`).
> 3. **Date format**: `DD.MM.YYYY` everywhere unless explicitly a calendar
>    picker.
> 4. **Empty states**: short helpful sentence in muted gray, no oversized
>    illustration unless the screen is otherwise blank.
> 5. **Loading states**: skeleton blocks (not spinners) for first paint;
>    button-internal spinners for in-flight actions.
> 6. **Toasts**: top-right, auto-dismiss in 3s. Sonner-style.
> 7. **Tables**: zebra rows optional, sticky header on long lists, all
>    columns sortable by default with chevron indicator.
> 8. **Forms**: labels above inputs, helper text below, error text in red
>    below helper. Required asterisk on labels.
> 9. **Buttons**: primary (filled brand purple `#a838ab`), secondary
>    (outline), destructive (filled red), ghost (no border, hover bg).
> 10. **Spacing**: 4/8/16/24 px scale (Tailwind defaults).
> 11. **Cards**: 1px border, 8px radius, white background, subtle shadow.

---

## How to use these prompts

1. Pick a screen above (start with the dashboards — most impact per pixel).
2. Open v0.dev / Figma AI / your favorite tool.
3. Paste **Section 0 (Product context)** + the chosen screen section.
4. Add a sentence at the end: *"Output should be a single Next.js + Tailwind
   + shadcn/ui React component, server-rendered where possible."*
5. Iterate — most tools will give 2-4 variants; pick one and refine.

Once you have designs you like, share the screenshots back here and I'll
port them into the codebase one screen at a time.
