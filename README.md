# 🧩 Puzzle Race

A premium, mobile-first multiplayer jigsaw puzzle racing game. Upload a photo, invite friends with a link, and race to solve the same puzzle first.

Built as a single Next.js 15 project — no separate backend, no WebSocket server. Deploys directly to Vercel.

---

## Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS + Framer Motion + Lucide React
- **Backend:** Next.js API Routes (serverless)
- **Database:** PostgreSQL via Prisma ORM (designed for Neon on Vercel)
- **Image processing:** Sharp
- **Storage:** Supabase Storage by default, with a swappable abstraction (Cloudflare R2 or local disk also supported)
- **Drag & drop:** dnd-kit (mobile touch support built in)
- **Sync:** Database polling (no WebSocket server required)

---

## Project Structure

```
app/
  page.tsx                     Home page
  create/page.tsx               Create Room page
  room/[code]/page.tsx           Lobby
  room/[code]/join/page.tsx      Join page (nickname only)
  room/[code]/play/page.tsx      Live gameplay
  room/[code]/results/page.tsx   Leaderboard
  api/rooms/create/route.ts               Create room + generate puzzle
  api/rooms/[code]/route.ts               Get room info
  api/rooms/[code]/join/route.ts          Join room
  api/rooms/[code]/players/route.ts       Poll players (lobby)
  api/rooms/[code]/start/route.ts         Host starts game
  api/rooms/[code]/pieces/route.ts        Get puzzle pieces
  api/rooms/[code]/move/route.ts          Submit a move (server-validated)
  api/rooms/[code]/state/route.ts         Poll live game state
  api/rooms/[code]/leaderboard/route.ts   Final/live leaderboard

components/
  ui/           Button, Card, Skeleton, AnimatedBackground
  game/         PuzzleBoard, PuzzlePiece, PieceTray, RoomCard, PlayerList,
                Leaderboard, Timer, UploadBox, DifficultySelector, WinnerModal

lib/
  prisma.ts                Prisma client singleton
  storage/                 Storage abstraction (Supabase / R2 / local)
  game/
    difficulty.ts           Grid size configs (3x3, 4x4, 6x6, 8x8)
    room-code.ts             Short invite code generator
    puzzle-generator.ts      Sharp-based image splitting
    validation.ts            Server-authoritative move/progress validation
  hooks/usePlayerSession.ts  LocalStorage-backed player identity per room

prisma/schema.prisma      Room, Player, PuzzlePiece models
```

---

## How It Works

1. **Host creates a room** — uploads an image, picks a difficulty, enters a nickname.
   The server validates the image with Sharp, resizes it to a square canvas, splits
   it into pieces, uploads each piece + the full preview to storage, and creates the
   `Room`, `Player` (host), and `PuzzlePiece` rows in one request.
2. **Players join** via `/room/[code]/join` — just a nickname, no account needed.
3. **Lobby** (`/room/[code]`) polls `/api/rooms/[code]/players` every 2s and shows
   the live player list, puzzle preview, and room code/invite link. Only the host
   sees the "Start Game" button.
4. **Host starts the game** — the server sets `Room.startedAt` a few seconds in the
   future so every client's countdown (3, 2, 1, GO) is synced to the same moment.
5. **Gameplay** — pieces are shuffled into a tray; players drag pieces onto the grid
   using dnd-kit (full touch support). Every move posts the current board state to
   `/api/rooms/[code]/move`. **The server — not the client — computes progress %,
   increments the move counter, and determines completion.** Finish time is always
   `now - Room.startedAt`, computed server-side, never trusted from the client.
6. **Results** (`/room/[code]/results`) polls the leaderboard every 3s, ranked by
   fastest completion time, then fewest moves — with confetti for the current
   player's own completion via `WinnerModal`.

### Why polling instead of WebSockets?

Per the spec, there's no persistent WebSocket server — this keeps the whole app
deployable as stateless serverless functions on Vercel. Lobby and results poll
every 2–3 seconds, which is more than responsive enough for a casual multiplayer
puzzle game.

---

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Fill in:

- **`DATABASE_URL`** / **`DIRECT_URL`** — your Neon Postgres connection strings.
  If you're using **Vercel + Neon**: go to your Vercel project → **Storage** →
  **Create Database** → **Neon Postgres**. Vercel auto-populates both variables
  for you (locally, copy them from the Neon dashboard's "Connect" panel — use the
  pooled connection string for `DATABASE_URL` and the direct one for `DIRECT_URL`).
- **Supabase Storage** (default provider):
  1. Create a free project at [supabase.com](https://supabase.com).
  2. Go to **Storage** → create a bucket named `puzzle-images` and mark it **Public**.
  3. Go to **Project Settings → API** and copy the **Project URL** and
     **service_role key** into `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

### 3. Push the database schema

```bash
npx prisma db push
```

(Or `npm run db:migrate` if you prefer tracked migrations.)

### 4. Run the dev server

```bash
npm run dev
```

Visit `http://localhost:3000`.

---

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it into Vercel.
3. Add a **Neon Postgres** database from the Vercel Storage tab (auto-fills
   `DATABASE_URL` / `DIRECT_URL`).
4. Add the Supabase env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `SUPABASE_BUCKET`) in **Project Settings → Environment Variables**.
5. Set `NEXT_PUBLIC_APP_URL` to your production URL (e.g. `https://your-app.vercel.app`)
   so invite links are correct.
6. Deploy. Vercel runs `prisma generate && next build` automatically via the
   `build` script and `postinstall` hook.

---

## Switching Storage Providers

The storage layer is fully abstracted behind `StorageProvider` in `lib/storage/`.
To switch from Supabase to Cloudflare R2, just change one environment variable:

```bash
STORAGE_PROVIDER="r2"
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET="..."
R2_PUBLIC_URL="https://your-bucket.r2.dev"
```

No application code changes required — `getStorageProvider()` picks the right
implementation automatically.

---

## Security Notes

- All game-critical values (moves, progress, finish time, completion) are computed
  **server-side** in `/api/rooms/[code]/move`. The client only ever sends the current
  board layout; it cannot claim an arbitrary time or move count.
- Room codes are 6 characters from an unambiguous alphabet (no `0/O`, `1/I`) and
  checked for collisions on creation.
- Image uploads are validated (type, size, real decodable image, minimum dimensions)
  before any processing happens.

---

## Difficulty Levels

| Level  | Grid | Pieces |
|--------|------|--------|
| Easy   | 3×3  | 9      |
| Medium | 4×4  | 16     |
| Hard   | 6×6  | 36     |
| Expert | 8×8  | 64     |

---

## License

Built for demonstration purposes. Customize freely.
