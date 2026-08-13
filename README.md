# Grain Infestation Monitoring Dashboard

Interactive showcase for an early-warning grain infestation monitoring system. The interface demonstrates how acoustic sensors inside grain silos could report sustained insect activity to an elevator operator.

## Live demo

- GitHub Pages: https://andreymakar56.github.io/grain-infestation-dashboard/
- Current showcase: https://kazan-grain-monitor.circularjar.chatgpt.site

## What is included

- facility overview with 12 silos and status KPIs
- silo detail view showing sensor depth and the suspected activity location
- sensor table with filters
- alerts and recommended operator actions
- practical activity analytics
- responsive desktop and mobile layouts
- `Simulate Infestation` demo that gradually raises Sensor C in Silo 04 to a sustained critical state

All readings are simulated. There is no database, authentication, live sensor connection, or external notification delivery in this repository.

## Run locally

Requirements: Node.js 22 and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Build

```bash
npm run build
```

The static output is written to `out/`. A GitHub Actions workflow deploys that directory to GitHub Pages after pushes to `main`.

## Future data connection

The UI currently imports mock records from `lib/mock-data.ts`. The interfaces in `lib/types.ts` and provider in `lib/data-source.ts` are the intended boundary for replacing mock data with a Supabase or REST API implementation later.

## Important limitation

This is a competition prototype, not a validated pest-detection system. The alert logic demonstrates the intended rule that a critical event requires sustained activity over time, rather than one isolated reading.
