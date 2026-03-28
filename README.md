# ProjectExpo

A mobile weather dashboard built with Expo Router, React Native, NativeWind, and Supabase.

The app has three primary tabs:
- Current: Live weather snapshot with an interactive trend chart.
- History: Last-week trend exploration and day-by-day summaries.
- Settings: Display preferences and app info.

## Tech Stack

- Expo SDK 54
- React Native 0.81
- Expo Router (file-based routing)
- NativeWind + Tailwind CSS
- Supabase (Postgres + Realtime)
- TypeScript

## Project Structure

- app/(tabs)/index.tsx
   Current weather dashboard screen.
- app/(tabs)/history.tsx
   History and trend analysis screen.
- app/(tabs)/settings.tsx
   Settings and app metadata screen.
- components/weather-trend-chart.tsx
   Reusable SVG line + area trend chart.
- lib/supabase.ts
   Supabase client initialization.
- lib/weather-data-template.ts
   Data mapping layer, mock fallbacks, and realtime subscriptions.
- scripts/dev-doctor.ps1
   Local diagnostics for network, Supabase, and Metro port usage.

## Prerequisites

- Node.js 20+ (recommended LTS)
- npm 10+
- Expo CLI via npx
- Supabase CLI (for local database workflow)
- PowerShell (for dev doctor scripts on Windows)

## Environment Variables

Create a local env file at .env.local with:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional aliases supported by lib/supabase.ts
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Important:
- Do not commit real keys.
- The app throws at startup if required Supabase variables are missing.

## Getting Started

1. Install dependencies

```bash
npm install
```

2. (Optional) Start local Supabase services

```bash
npx supabase start
```

3. Run the Expo app

```bash
npx expo start --lan --clear
```

Open on:
- Expo Go
- Android emulator
- iOS simulator
- Web

## npm Scripts

- npm run start
   Start Expo dev server.
- npm run android
   Start with Android target.
- npm run ios
   Start with iOS target.
- npm run web
   Start web target.
- npm run lint
   Run Expo ESLint checks.
- npm run dev:doctor
   Run local diagnostics (IPv4, Supabase status, port 8081).
- npm run dev:doctor:fix
   Run diagnostics and attempt to release port 8081.
- npm run reset-project
   Reset scaffold folders to a blank starter structure.

## Data Layer Notes

The data module currently assumes a primary readings table:

- Table: temperature_and_humidity
- Fields:
   - created_at
   - temperature
   - humidity

These mappings are configured in lib/weather-data-template.ts under WEATHER_DB_TEMPLATE.

The app also includes:
- Realtime INSERT subscription via Supabase channel.
- Mock data fallbacks when no rows are returned.
- Placeholder values for wind, pressure, and UV until an external API is wired.

## Realtime Behavior

On the Current and History tabs, the app subscribes to new row inserts and refreshes data when fresh readings arrive.

If Realtime errors occur, a status callback can surface channel issues like:
- CHANNEL_ERROR
- TIMED_OUT

## Troubleshooting

### Metro config fails on Windows with ESM URL scheme error

Symptom:
- Error [ERR_UNSUPPORTED_ESM_URL_SCHEME]
- Received protocol 'c:'

Common cause:
- A config file (especially tailwind.config.js) saved as UTF-16 instead of UTF-8.

Fix:
1. In VS Code, re-save tailwind.config.js as UTF-8 (without BOM).
2. Re-run:

```bash
npx expo start --lan --clear
```

### Port 8081 already in use

Use:

```bash
npm run dev:doctor
npm run dev:doctor:fix
```

### Supabase connection issues

Check:
- npx supabase status
- EXPO_PUBLIC_SUPABASE_URL in .env.local points to the running instance
- Network/LAN IP is reachable from your device

### Missing env variables

If startup throws missing env var errors:
- Confirm .env.local exists
- Confirm variable names match exactly
- Restart Expo after env changes

## Local Supabase Config

Supabase local project configuration is located at:
- supabase/config.toml

This repo is configured with custom local ports (API, DB, Studio, etc.), so check that file when debugging local environment conflicts.

## Notes

- Keep project files in UTF-8 to avoid tooling issues on Windows.
