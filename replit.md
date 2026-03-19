# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains the ECOFLIX streaming website — a Netflix-style movie and TV show streaming site powered by the XCASPER API.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 (api-server artifact)
- **Frontend**: React + Vite (ecoflix artifact)
- **Database**: PostgreSQL + Drizzle ORM (available but not used by ECOFLIX)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle for api-server), Vite (frontend)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── ecoflix/            # ECOFLIX streaming website (React + Vite)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## ECOFLIX — Streaming Website

ECOFLIX is a fully functional Netflix-style streaming website at `/` (preview path root).

### Features
- **Homepage**: Hero banner with trending content, horizontal scrollable rows (Trending Now, Hot This Week, Popular Movies, Continue Watching)
- **Search**: Debounced search with filter tabs (All/Movies/TV Shows) and popular search terms
- **Movie Detail**: Backdrop hero, IMDb rating, genre badges, cast grid, Add to List, Play button, recommendations
- **TV Detail**: Same as movie detail + season/episode selector with episode list
- **Player**: HTML5 video player with stream from XCASPER API, progress saving to localStorage
- **Browse**: Genre filter buttons, paginated grid, Load More
- **Rankings**: Top Movies/TV Shows with gold/silver/bronze numbering
- **Wishlist**: localStorage-persisted list with remove and clear all

### External API
- **Base URL**: `https://movieapi.xcasper.space/api`
- **Authentication**: None required (CORS-enabled, browser requests only)
- **Key Endpoints**: `/trending`, `/hot`, `/search`, `/detail`, `/play`, `/recommend`, `/browse`, `/ranking`
- **API Field Notes**: Items use `subjectId` (not `id`), `cover.url` for images, `subjectType` (1=movie, 2=tv)

### Key Files
- `artifacts/ecoflix/src/hooks/use-ecoflix.ts` — All API call hooks
- `artifacts/ecoflix/src/lib/api-types.ts` — TypeScript types matching XCASPER API
- `artifacts/ecoflix/src/lib/utils.ts` — Helper functions (getTitle, getPoster, getType, etc.)
- `artifacts/ecoflix/src/hooks/use-local-state.ts` — Wishlist & Continue Watching localStorage hooks
- `artifacts/ecoflix/src/components/` — Navbar, MediaCard, ContentRow, HeroBanner, Layout
- `artifacts/ecoflix/src/pages/` — Home, Search, MovieDetail, TVDetail, Player, Browse, Ranking, Wishlist

### localStorage Keys
- `ecoflix_wishlist` — Array of saved WishlistItems
- `ecoflix_continue` — Array of ContinueWatchingItems with progress %

## Packages (api-server)

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Serves health check at `/api/healthz`.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.
