# Electricity Bill Manager

A full-stack web application for managing and tracking electricity bills across multiple houses and rooms. Provides real-time cost calculations, consumption reports, and administrative controls — built for hostels, multi-tenant properties, and shared living spaces.

## Features

- **Dashboard** — Overview of total consumption, costs, and per-house summaries with interactive charts
- **House Management** — Add and manage houses, rooms, and extra meters (e.g., water pump, common area). Supports grouped meters and individual room tracking
- **Reports** — Monthly consumption reports broken down by house and room, with unit price configuration
- **Admin** — Centralized unit price control, data seeding, and system-wide configuration

## Tech Stack

- [Next.js 15](https://nextjs.org/) — React framework with App Router
- [React 19](https://react.dev/) — UI library
- [TypeScript](https://www.typescriptlang.org/) — Type safety
- [Prisma](https://www.prisma.io/) + PostgreSQL — Database ORM
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first styling
- [Radix UI](https://www.radix-ui.com/) — Accessible headless UI primitives
- [Recharts](https://recharts.org/) — Charting library
- [Vitest](https://vitest.dev/) — Unit and integration testing
- [Zod](https://zod.dev/) — Schema validation

## Prerequisites

- **Node.js** 20 or later
- **PostgreSQL** 14 or later
- **npm** (ships with Node.js)

## Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd electricity-bill

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and set your DATABASE_URL (see .env.example for format)

# 4. Run database migrations
npm run db:migrate

# 5. Seed sample data (optional but recommended)
npm run db:seed

# 6. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Script             | Description                                      |
| ------------------ | ------------------------------------------------ |
| `dev`              | Start the Next.js development server             |
| `build`            | Build the application for production             |
| `start`            | Start the production server                      |
| `lint`             | Run ESLint                                       |
| `test`             | Run Vitest in watch mode                         |
| `test:run`         | Run Vitest once (CI mode)                        |
| `test:coverage`    | Run tests with coverage report                   |
| `db:migrate`       | Apply Prisma migrations                         |
| `db:seed`          | Seed the database with sample data               |
| `db:reset`         | Drop, re-migrate, and re-seed the database       |
| `db:studio`        | Open Prisma Studio (GUI database browser)        |

## Testing

This project uses [Vitest](https://vitest.dev/) for unit and integration tests.

```bash
npm test          # Watch mode
npm run test:run  # Single run (CI)
npm run test:coverage  # With coverage
```

Tests live alongside the code they test (co-located `*.test.ts` files in `src/`).

## Project Structure

```
src/
├── app/                # Next.js App Router pages and API routes
│   ├── admin/          # Admin panel (unit price config)
│   ├── api/            # REST API routes
│   │   ├── config/     # Configuration endpoints
│   │   ├── extra-meters/
│   │   ├── houses/
│   │   ├── readings/
│   │   └── rooms/
│   ├── primary/        # Primary (main) house page
│   ├── reports/        # Consumption reports
│   └── secondary/      # Secondary house page
├── components/         # Reusable React components
│   └── ui/             # Primitive UI components (Radix-based)
├── hooks/              # Custom React hooks
├── lib/                # Utility functions, calculations, validations
├── test/               # Test setup and utilities
└── types/              # TypeScript type definitions

prisma/
├── schema.prisma       # Database schema
├── seed.ts             # Seed script
└── migrations/         # Prisma migration history
```

## Usage Guide

- **Dashboard** (`/`) — View overall stats across all houses, including total units consumed and total cost
- **Primary House** (`/primary`) — Manage rooms and submit monthly readings for the main house
- **Secondary House** (`/secondary`) — Manage rooms and readings for the secondary property
- **Reports** (`/reports`) — Compare monthly consumption across houses; filter by month and house
- **Admin** (`/admin`) — Adjust the per-unit electricity price used in all cost calculations

## Database Schema

- **House** — A property containing rooms and extra meters
- **Room** — An individual room/unit within a house, with a meter type (`separate` or `group`) and an optional group key
- **ExtraMeter** — A shared utility meter (e.g., water pump, common area lights) linked to a house
- **Reading** — Monthly meter readings (previous and current values) for each room
- **ExtraMeterReading** — Monthly readings for extra meters
- **Config** — Singleton table storing the global unit price

The `month` field on readings uses the `YYYY-MM` format.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

Ensure all tests pass before submitting (`npm run test:run`).
