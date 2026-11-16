# CLAUDE.md — Diamond Arena (vkdashboard)

> Read this file first, every session. It is the operating manual for this repo.
> Deeper detail lives in `docs/` — see the map at the bottom.

## What this is

Accountability dashboard for a paid, one-year business-coaching program
(~117 members, batches 1–4, India). Replaces three Google Sheets: member
activity, points, and payments.

**It is live and in daily use by real paying customers.** There is no staging
environment and no separate dev database. Treat every write as production
unless you have deliberately pointed it at a local DB (see
`docs/OPERATIONS.md` → *Local test DB*).

Three roles, all in one Next.js app:

| Role | Who | Sees |
|---|---|---|
| `MENTOR` | program owner + back-office admins | everything |
| `CAPTAIN` | leads an AG (accountability group) of ~10 | their group |
| `MEMBER` | a founder in the program | themselves |

"Super admin" is not a role — it's an email allow-list (`SUPER_ADMIN_EMAILS`
in `src/lib/audit-context.ts`). It gates the audit log only.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · Prisma 5 · Postgres 18 ·
custom JWT auth (`jose`, cookie `diamond_session`) · bcryptjs · Recharts ·
react-hook-form + zod · runs on our own VPS (Caddy + systemd + Postgres 18),
not Vercel or Neon, since 2026-11-05. See `docs/OPERATIONS.md`.

Not used, despite what old docs say: Supabase, NextAuth, Resend, SQLite.

## Hard rules

1. **`.env` points at `localhost:5432`, NOT production.** Verified 2026-09-07.
   `tsx scripts/*.ts` and `npm run dev` hit a LOCAL Postgres. This file used to
   claim the opposite, and a whole session was spent diagnosing production from
   a stale local copy — reporting channels as disabled when prod had them on.
   **Always check which database you are on before trusting a read:**

   ```bash
   grep -o '@[^/]*' .env | head -1     # localhost:5432 = local
   ```

   Production is Postgres 18 on the VPS (database `app_vkdashboard`), reachable
   only from inside the server. The old Neon database is a frozen copy with no
   new data: never read it as if it were production, and `vercel env pull` no
   longer gives production values. To inspect production, ssh to the VPS and
   run a read-only script from `/srv/vkdashboard` with `node --env-file=.env`.

   Still ask before any WRITE against prod. Use `DRY=1` (the import scripts
   default to it) for anything that mutates.
2. **Schema changes use `prisma db push`, never `prisma migrate`.** There is
   no `prisma/migrations/` directory and creating one would fight the live DB.
   Only additive changes; ask before pushing.
3. **Deploy with `scripts/deploy-vps.sh main`.** It builds separately, then
   restarts only this app. Never run `vercel --prod`, and don't resume the
   paused Vercel project: its crons would send reminders twice. Git auto-deploy
   is disconnected, so a `git push` deploys nothing.
4. **Ask before anything that touches prod**: `db push`, deploy, an importer
   with `DRY=0`, or a script that sends WhatsApp/email/voice to real members.
   Past approval for one prod write is not standing approval for the next.
5. **Do not re-apply the 2026-07-08 UI redesign.** It was built, rejected, and
   reverted (stash `claude-ui-session-2026-07-08`). Keep the app's existing
   look unless the user explicitly asks for a redesign.
6. **Push your branch before you finish.** Local-only branches are the main
   way work has been lost here.

## Everyday commands

```bash
npm install          # postinstall runs prisma generate
npm run dev          # http://localhost:3000 (no basePath in dev)
npx tsc --noEmit     # typecheck — run this before saying "done"
npm run build        # prisma generate + next build
scripts/deploy-vps.sh main   # deploy (ask first); add --build-only to test a build
```

In prod the app is served under `basePath: /diamondarena`; in dev it's `/`.
That's set in `next.config.js`, so client fetches must go through `apiPath()`
in `src/lib/utils.ts` — never hardcode `/api/...` in a client component.

## Working in a git worktree

Worktrees under `.claude/worktrees/*` have no `node_modules` and no `.env`:

```bash
ln -sfn /Users/harshsharma/Downloads/notesai/vkdashboard/node_modules node_modules
ln -sf  /Users/harshsharma/Downloads/notesai/vkdashboard/.env .env
npx prisma generate && npx tsc --noEmit
```

`.gitignore` has `node_modules/` **with a trailing slash**, so the *symlink*
shows as untracked. Stage explicit paths — never `git add -A` — and remove the
symlink when done.

## Where things are

| Path | What |
|---|---|
| `src/app/(auth)`, `src/app/member`, `captain`, `mentor` | pages by role |
| `src/app/api/**/route.ts` | ~60 API routes |
| `src/app/api/cron/*` | 4 cron endpoints, all behind `x-cron-secret` |
| `src/lib/` | the real logic — read before writing anything |
| `prisma/schema.prisma` | 32 models, no enums (statuses are strings) |
| `scripts/` | one-off importers and maintenance, run with `tsx` |
| `docs/` | setup, operations, accumulated knowledge |

Key `src/lib` modules and what they own: `session.ts` (auth + audit actor),
`payments.ts` (balloon rows, forward dues, standing), `csv-importer.ts` (all
sheet formats), `points-calculator.ts` (`awardPoints`), `risk-calculator.ts`,
`notifications.ts`, `aisensy.ts` / `email.ts` / `obligr.ts` (WhatsApp /
email / voice), `checkin.ts` + `quantum.ts` (check-in portal), `prisma.ts`
(client + the audit-log extension).

## Before you change code

Per the user's global rules: read the whole file first, grep every caller of a
function before modifying it, and don't edit blindly. `src/lib/payments.ts`
and `src/lib/csv-importer.ts` in particular have subtle invariants documented
in `docs/KNOWLEDGE.md` — read that section before touching money code.

## Docs map

- `docs/SETUP.md` — from a blank Mac to a running app. Start here after a reset.
- `docs/OPERATIONS.md` — deploy, database, crons, integrations, imports, runbooks.
- `docs/KNOWLEDGE.md` — domain invariants, feature history, known bugs, gotchas.
  This is the memory that used to live outside the repo. Read it before
  debugging anything that looks wrong-but-intentional.
- `PROJECT.md`, `DESIGN_PROMPTS.md` — original 2026-05 spec and design briefs.
  Historical: the stack section in `PROJECT.md` is wrong. Trust this file.
