# Weather App

Next.js (App Router) + NestJS monorepo. Real-time conditions, a 7-day forecast
and saved locations, backed by PostgreSQL.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the system design, DB schema and folder layout.

## Prerequisites

- Node 20+
- PostgreSQL 14+ (local install, or `docker compose up -d postgres`)
- **No weather API key.** The default provider is Open-Meteo: no account, no card.

## Setup

```bash
cp .env.example .env
```

```bash
npm install
```

### Database

Create the database (you will be prompted for your `postgres` password):

```bash
createdb -U postgres -h localhost weather
```

On Windows the PostgreSQL binaries are usually not on PATH. Full path for v17:

```bash
"/c/Program Files/PostgreSQL/17/bin/createdb.exe" -U postgres -h localhost weather
```

Then set `DATABASE_URL` in `.env` to your own credentials:

```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/weather?schema=public"
```

If your password contains `@ : / ? # [ ] %`, percent-encode it (`@` becomes `%40`).

```bash
npm run db:migrate -w @weather/api -- --name init
```

## Run

```bash
npm run dev
```

Starts both processes in parallel. Web on <http://localhost:3000>, API on
<http://localhost:4000/api>.

## Troubleshooting

**`EADDRINUSE: address already in use :::4000`**

On Windows, `nest start --watch` leaves a child process behind after Ctrl+C. It
keeps the port *and* keeps answering requests using the `.env` it booted with —
so edits to your config appear to have no effect. Free the port:

```bash
npm run kill:api
```

**Favourites return 401 or 500** — check `DATABASE_URL` and that the migration ran.
Weather itself does not need the database and keeps working without it.

## Switching weather providers

`WeatherProvider` is the vendor seam. Both implementations live in
`apps/api/src/weather/providers/`:

| Provider | Key required | Notes |
| --- | --- | --- |
| `OpenMeteoProvider` | no | Default. Free for non-commercial use. |
| `OpenWeatherProvider` | yes | Needs a One Call 3.0 subscription (card on file). |

Change the one `useClass` line in
[weather.module.ts](apps/api/src/weather/weather.module.ts). Nothing else moves.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | API + web in parallel |
| `npm run dev:api` / `dev:web` | one at a time |
| `npm run kill:api` | free port 4000 |
| `npm run db:migrate` | Prisma migrate dev |
| `npm run db:studio` | Prisma Studio |
| `npm run typecheck` | `tsc --noEmit` across both workspaces |

## Status

Feature-complete. Geolocation on first load, debounced city search with keyboard
navigation, current conditions with UV index, a 7-day forecast as chart or list,
and favourites persisted to PostgreSQL — no API key, no paid plan.

Deliberately not built: real authentication (the anonymous cookie is the seam —
see `apps/web/src/lib/server/user-session.ts`), drag-to-reorder favourites, and
automated tests. The cache's single-flight and stale-fallback paths are the two
places most worth covering first if tests are added.
