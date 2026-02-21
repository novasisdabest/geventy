# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Dev server with Turbopack
npm run build     # Production build
npm run start     # Serve production build
npm run lint      # Next.js ESLint
```

No test runner configured. No formatter configured.

## Architecture

Next.js 16 App Router with Supabase backend. Czech-language UI for an interactive event platform with real-time multiplayer minigames.

### Data Flow Pattern

Server Components fetch data + check auth → pass props to Client Components → Client Components use Zustand for transient game state + Supabase Realtime for sync.

### Supabase Clients

- `src/lib/supabase/client.ts` — Browser client (`createBrowserClient<Database>`). Used in `"use client"` components and hooks.
- `src/lib/supabase/server.ts` — Server client (`createServerClient<Database>` with cookies). Used in server actions and server pages.
- `src/lib/supabase/middleware.ts` — Session refresh + route protection. Protects `/dashboard/*` and `/event/*/moderator`.
- `src/lib/supabase/typed.ts` — **Critical.** `from()` and `rpc()` helpers that bypass Supabase v2 PostgREST v14 RLS type inference (`never` issue). Always use `from(supabase, "table")` instead of `supabase.from("table")`.

### Server Actions (`src/app/actions/`)

All mutations go through server actions. Pattern:
```typescript
"use server";
const supabase = await createClient();                    // server client
const { data: { user } } = await supabase.auth.getUser(); // auth check
const { data, error } = await from(supabase, "table")...  // typed.ts helper
revalidatePath("/dashboard");                              // cache bust
```

Files: `auth.ts`, `events.ts`, `attendees.ts`, `program.ts`.

### Realtime (`src/hooks/useEventChannel.ts`)

Single Supabase channel per event (`event:{eventId}`) using:
- **Presence** — online player tracking
- **Broadcast `game_command`** — moderator → all players (phase changes, facts, results)
- **Broadcast `vote_cast`** — player → moderator (live vote aggregation)

The hook dispatches all received events to the Zustand store.

### State Management (`src/stores/game-store.ts`)

Zustand store for transient game state: phase, current round, votes, scores, online players. Not persisted — synced via Realtime broadcasts. Phase flow: `lobby → collecting → voting → results → finished`.

### Game Components

Each game lives in `src/components/games/{game-name}/` with:
- `ModeratorControls.tsx` — phase control buttons
- `FactCollection.tsx` — player input during collecting phase
- `VotingScreen.tsx` — vote option grid
- `ResultsScreen.tsx` — correct answer + scores
- `ProjectorScreen.tsx` — full-screen display variant

Currently only `who-am-i` is implemented. `games_library` table has 6 seeded games.

### View Split

- `src/components/event/PlayerView.tsx` — mobile-first player interface (`max-w-md`)
- `src/components/event/ModeratorView.tsx` — full-width moderator dashboard with game picker + controls

Server pages (`src/app/event/[slug]/page.tsx` and `moderator/page.tsx`) handle auth/data, then render the appropriate client view.

## Database

Supabase Postgres with RLS on all tables using `(select auth.uid())`. Key tables: `profiles`, `events` (auto-slug), `event_attendees` (invite tokens), `games_library`, `event_program` (JSONB `game_state`), `game_responses` (unique per round).

Regenerate types: use Supabase MCP `generate_typescript_types` → write to `src/lib/database.types.ts`.

## Conventions

- All UI copy in Czech. Code comments in English.
- Use `from(supabase, "table")` from `@/lib/supabase/typed` for every DB query — never `supabase.from()` directly.
- Server actions return `{ error: string }` or `{ success: true }`, use `redirect()` for navigation.
- Design system: `slate-950` background, purple/pink accents, `font-black italic uppercase` headings, `rounded-2xl` cards.
- No light mode.
