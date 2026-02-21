# SPEC.md — Geventy Product Specification

## 0. Authentication

### 0.1 Login / Sign Up Methods

- **Email + password** (already implemented)
- **Google OAuth** (via Supabase Auth)
- **Apple OAuth** (via Supabase Auth — "Sign in with Apple")

All three methods create the same `profiles` row via the existing database trigger. OAuth users get their `full_name` and `avatar_url` populated from the provider metadata.

Login and signup pages show social buttons above the email/password form with a divider ("nebo").

### 0.2 Provider Setup

Requires configuration in Supabase Dashboard → Authentication → Providers:
- **Google**: OAuth client ID + secret from Google Cloud Console
- **Apple**: Service ID + private key from Apple Developer Console

Redirect URL for both: `https://<domain>/auth/callback`

---

## 1. Games

### 1.1 Game Library (6 games)

All games follow the same architecture: Moderator Controls + Player Input + Voting/Guessing + Results + Projector Screen.

| Slug | Name (CZ) | Status | Description |
|------|-----------|--------|-------------|
| `who-am-i` | Kdo jsem teď? | **Done** | Each player submits a fact about themselves. Others guess who wrote it. |
| `two-truths` | Dvě pravdy, jedna lež | TODO | Each player writes 3 statements — one is a lie. Others vote which is the lie. |
| `hot-take` | Hot Take | TODO | Controversial/fun questions. Everyone votes, then results are revealed as a poll. |
| `drawing-battle` | Kreslící souboj | TODO | Draw a given prompt. Others guess what it is. |
| `quiz` | Kvíz | TODO | Classic quiz with multiple-choice answers. Points awarded for speed + correctness. |
| `bingo` | Party Bingo | TODO | Find a person matching a description. First to complete a row wins. |

### 1.2 Game Details

**Dvě pravdy, jedna lež (two-truths)**
- Phase: `collecting` → each player submits 3 statements (2 true, 1 lie)
- Phase: `voting` → one player's statements shown, others vote which is the lie
- Phase: `results` → reveal the lie, award points to correct guessers
- Rounds: one per player (like who-am-i)

**Hot Take (hot-take)**
- Moderator prepares a set of controversial/fun statements beforehand (or picks from game variant)
- Phase: `voting` → statement shown, players vote on a scale (Agree / Disagree / Neutral, or custom options)
- Phase: `results` → poll results revealed as animated bar chart
- No scoring — this is a discussion/icebreaker game
- Rounds: one per statement

**Kreslící souboj (drawing-battle)**
- Phase: `drawing` → one player gets a word prompt, draws on a canvas (touch-friendly)
- Phase: `guessing` → others type guesses in real-time (first correct guess wins most points)
- Phase: `results` → reveal word, show who guessed correctly and fastest
- Rounds: each player draws once (or configurable number)
- Requires: canvas component with touch drawing, real-time guess stream

**Kvíz (quiz)**
- Moderator creates questions beforehand OR picks a game variant with pre-made questions
- Phase: `question` → question + 4 options shown, countdown timer (e.g. 15s)
- Phase: `results` → correct answer revealed, points awarded (faster = more points)
- Scoring: e.g. 1000 points max, decreasing by time taken
- Rounds: one per question
- Leaderboard shown between rounds

**Party Bingo (bingo)**
- Each player gets a 4x4 or 5x5 bingo card with descriptions (e.g. "Find someone who has been to Japan")
- Players walk around, find matching people, tap the cell to mark it
- Verification: the matched person confirms on their phone (or honor system)
- First player to complete a row/column/diagonal wins
- This is a physical-interaction game — less projector-focused, more mobile-focused

### 1.3 Game Configurator & Variants

Any user can create a **game variant** — a custom configuration of an existing game type.

- A variant belongs to a base game (e.g. a Quiz variant = a specific set of questions)
- Variants are **public** — visible and usable by all organizers
- Creating a variant costs a **fixed price** (monetization)
- When building an event program, organizers browse game variants and see the price per variant

**What's configurable per game type:**

| Game | Variant contains |
|------|-----------------|
| Quiz | Set of questions + answers + optional time limit per question |
| Hot Take | Set of statements/questions |
| Two Truths | Optional theme/category prompt |
| Drawing Battle | Word list for drawing prompts |
| Bingo | Set of cell descriptions for the bingo card |
| Who Am I | Optional theme prompt (e.g. "facts about your childhood") |

**Variant creation flow:**
1. User picks a base game
2. Fills in the variant-specific content (questions, word lists, etc.)
3. Pays the fixed fee
4. Variant is published and available in the game picker

---

## 2. Event Configuration

### 2.1 Event Types

Events have a **type** that determines the default program template:

- Silvestr (New Year's Eve party)
- Narozeninová oslava (Birthday party)
- Firemní akce (Company event)
- Sraz spolužáků (Class reunion)
- Custom / Other

### 2.2 Seriousness Scale (1–5)

Every event has a **seriousness level** that affects AI moderation behavior:

| Level | Label | AI Behavior |
|-------|-------|-------------|
| 1 | Formální (Formal) | Strict moderation. Professional tone. No jokes. AI filters inappropriate content. |
| 2 | Poloformální | Light moderation. Polite tone. Minimal humor. |
| 3 | Neutrální (Default) | Balanced. AI adds light commentary. Moderate filtering. |
| 4 | Uvolněná (Relaxed) | AI makes jokes, playful commentary. Loose filtering. |
| 5 | Crazy mode | AI roasts participants, makes jokes from submitted content, wild commentary on projector. |

**Gemini API integration** — used for:
- Generating witty commentary during game rounds (based on seriousness level)
- Moderating chat messages (filtering inappropriate content at levels 1–3)
- Auto-generating fun facts or quiz questions from submitted content
- Creating humorous player introductions at higher seriousness levels

### 2.3 Event Timeline / Program Builder

Organizers build the event program as a **timeline of blocks**.

**Default templates** are generated based on event type (e.g. a birthday party gets: Arrival → Welcome speech → Quiz about birthday person → Photo slideshow → Cake → Voting → Free time).

**Timeline block types:**
- **Game block** — linked to a game + variant from the library
- **Custom block** — free text (e.g. "Cake cutting", "DJ set")
- **Photo slideshow block** — displays uploaded photos
- **Chat/message wall block** — live messages from attendees on projector

Each block has:
- Start time (absolute or relative to previous block)
- Estimated duration
- Status: pending / active / completed

Organizer can: reorder blocks, add/remove blocks, adjust times. The system calculates estimated end time.

**Visibility:**
- Before event: program visible to all attendees (read-only preview)
- During event: visible to organizers (with controls) + attendees (current block highlighted)

### 2.4 Active Event Mode

When current time is between event start and end:
- **Organizers** see the moderator/control panel (live controls, game management)
- **Attendees** see the player mode (current game, chat, reactions)
- This is **forced** — no option to browse other sections during a live event

---

## 3. Display / Projector System

### 3.1 Architecture: Controller + Display

- **Controller**: Organizer's phone (moderator panel with big action buttons)
- **Display**: Web page at `/event/[slug]/live` — runs on device connected to TV/projector
- Communication: Supabase Broadcast (real-time, <100ms)

### 3.2 Display Modes

The projector/TV screen shows content based on the active program block:
- Game screen (questions, voting, results, leaderboards)
- Photo slideshow (full-screen photos with reactions overlay)
- Message wall (live chat messages, scrolling feed)
- Countdown / welcome screen (before event starts)
- Legendaryness index dashboard (scores, timeline, leaderboards)

### 3.3 TV Compatibility Guide

Show organizers a setup guide in the dashboard based on their equipment:
- Modern TV/Projector (HDMI) → laptop + HDMI cable
- Old TV (SCART/RCA) → laptop + HDMI-to-AV converter
- No display → "screenless mode" where everything shows on attendees' phones

---

## 4. Chat & Photo Sharing

### 4.1 Live Chat (Message Wall)

During an event, attendees can send messages visible on the projector display.

**Reporting system:**
- Any attendee can report a message
- **3 unique reports** → message author is banned from chat for the rest of the event
- Banned users see a notice but cannot post

**Reactions:**
- Attendees can react to messages (emoji reactions)
- Reactions appear animated on the projector display alongside the message

### 4.2 Photo Sharing

Attendees can upload photos during the event (and before, for slideshow blocks like "Memory wall").

**Same reporting system as chat:**
- 3 unique reports on a user → they lose the ability to upload photos

**Reactions on photos:**
- Same emoji reaction system as chat
- Reactions overlay on the projector during photo slideshow

---

## 5. Legendaryness Index (Gamification)

A scoring system that measures how "legendary" an event is. Displayed live on the projector dashboard.

### 5.1 Scoring Activities

**Pre-event (automatic):**
| Activity | Points | Condition |
|----------|--------|-----------|
| Early planner | +50 | Event created 2+ months before date |
| Master planner | +100 | 80%+ of invitees confirmed |
| Memory wall | +10 per 10 photos | Photos uploaded before event |

**During event (confirmed by organizer or automatic):**
| Activity | Points | Condition |
|----------|--------|-----------|
| Full attendance | +150 | 90%+ of confirmed attendees present |
| Group photo | +50 | Organizer marks as done (photo uploaded) |
| Icebreaker complete | +50 | Intro round completed |
| Game completed | +100 | Any game from program finished |
| Midnight surprise | +75 | Special moment confirmed by organizer |
| Bonus: Table dance | +200 | Photo evidence submitted |

### 5.2 Live Dashboard

Displayed on projector during event:
- **Large score number** — current legendaryness index
- **Activity feed** — timeline of earned achievements with timestamps
- **Leaderboards:**
  - "King of the night" — compare with other events happening today
  - "Top events this week"
  - "Legends of all time" — historical leaderboard across all events

### 5.3 Monetization Tie-in

The legendaryness system is a premium feature (see Section 6).

---

## 6. Monetization (Tiers)

| Tier | Price | Features |
|------|-------|----------|
| Free | 0 | Basic event creation, limited attendees, screenless mode only |
| Standard | TBD | Full event management, all games, projector mode, chat |
| Legendary | TBD | Everything in Standard + Legendaryness Index + live leaderboards + AI moderation (Gemini) |

**Additional revenue:**
- Game variant creation: fixed fee per variant published

---

## 7. Dashboard Redesign

### 7.1 Event List (Landing after login)

Grid of upcoming events with:
- Event name, date, countdown ("za 12 dní")
- Attendee status ("25/40 přihlášeno")
- CTA button: "Spravovat akci" (Manage event)

### 7.2 Event Management Panel (3 tabs)

**Tab 1: Příprava (Preparation)**
- Countdown to event
- Guest status summary (invited / confirmed / paid)
- Invite link generation
- Co-organizer appointment
- Guest list table with status and actions

**Tab 2: Program a zábava (Program & Entertainment)**
- Timeline builder (drag & drop blocks)
- Game picker with variant browser
- Block configuration (time, duration, content)
- Estimated end time calculation

**Tab 3: Režie (Live Control) — active during event**
- Big action buttons per program block ("Spustit kvíz", "Spustit fotogalerii")
- Current block indicator
- Online attendee count
- Quick stats (chat messages, photos uploaded, legendaryness score)

---

## 8. Implementation Priority

Suggested order for chunked implementation:

1. **Remaining games** — two-truths, hot-take, quiz, drawing-battle, bingo (reuse who-am-i architecture)
2. **Game configurator + variants** — variant CRUD, public variant browser, pricing
3. **Event timeline builder** — block types, default templates, reordering
4. **Chat + photo sharing** — message wall, photo upload, reporting, reactions, projector display
5. **AI moderation (Gemini)** — seriousness scale, content moderation, commentary generation
6. **Legendaryness index** — scoring engine, live dashboard, cross-event leaderboards
7. **Monetization** — tier system, payment for variants, feature gating
8. **Dashboard redesign** — 3-tab layout, preparation view, live control view
9. **Active event forcing** — auto-redirect to moderator/attendee mode during live events
