# ProjectExpo

A mobile weather dashboard built with Expo Router, React Native, NativeWind, Supabase, and Open-Meteo enrichment.

The app has three primary tabs:
- Current: live weather snapshot with an interactive trend chart.
- History: rolling 7-day trend exploration and daily records.
- Settings: local display and preference controls.

## Tech Stack

- Expo SDK 54
- React Native 0.81
- Expo Router (file-based routing)
- NativeWind + Tailwind CSS
- Supabase (Postgres + Realtime)
- Open-Meteo API (`openmeteo` package)
- TypeScript

## Project Structure

- `app/(tabs)/index.tsx`
  Current weather dashboard screen.
- `app/(tabs)/history.tsx`
  History and trend analysis screen.
- `app/(tabs)/settings.tsx`
  Settings and app metadata screen.
- `components/weather-trend-chart.tsx`
  Reusable SVG line and area trend chart.
- `lib/supabase.ts`
  Supabase client initialization and env validation.
- `lib/weather-data-template.ts`
  Data mapping layer, fetch templates, realtime subscriptions, and fallbacks.
- `scripts/dev-doctor.ps1`
  Local diagnostics for network, Supabase, and Metro port usage.

## Prerequisites

- Node.js 20+ (recommended LTS)
- npm 10+
- Expo CLI via `npx`
- Supabase CLI (for local database workflow)
- PowerShell (for dev doctor scripts on Windows)

## Environment Variables

Create a local env file at `.env.local`:

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

1. Install dependencies:

```bash
npm install
```

2. (Optional) Start local Supabase services:

```bash
npx supabase start
```

3. Start Expo dev server:

```bash
npx expo start --lan --clear
```

Open on:
- Expo Go
- Android emulator
- iOS simulator
- Web

## npm Scripts

- `npm run start` - Start Expo dev server.
- `npm run android` - Start with Android target.
- `npm run ios` - Start with iOS target.
- `npm run web` - Start web target.
- `npm run lint` - Run Expo ESLint checks.
- `npm run dev:doctor` - Run local diagnostics (IPv4, Supabase status, port 8081).
- `npm run dev:doctor:fix` - Run diagnostics and attempt to release port 8081.
- `npm run reset-project` - Reset scaffold folders to a blank starter structure.

## Data Flow and Fallbacks

The data module (`lib/weather-data-template.ts`) expects a primary readings table:

- Table: `temperature_and_humidity`
- Fields:
  - `created_at`
  - `temperature`
  - `humidity`

Current dashboard data (`fetchCurrentWeatherTemplate`) follows this order:
1. Use today rows from Supabase as the source of truth for temperature and humidity.
2. Patch with Open-Meteo values for wind, pressure, UV, and weather icon resolution.
3. If there are no local rows, build from Open-Meteo only.
4. If both are unavailable, return mock data.

History data (`fetchHistoryTemplate`) builds a 7-day view from Supabase rows:
- Temperature and humidity hourly trends by day.
- Daily record cards derived from recent rows.
- Mock defaults only when no rows exist.

Settings data (`fetchSettingsTemplate`) is currently static template data and does not yet persist to a dedicated settings table.

## Realtime Behavior

Current and History tabs subscribe to Supabase `INSERT` events on the readings table and refresh when new rows arrive.

Realtime status issues can be surfaced through callback messages, including:
- `CHANNEL_ERROR`
- `TIMED_OUT`

## Open-Meteo Notes

- Provider endpoint: `https://api.open-meteo.com/v1/forecast`
- Current implementation uses fixed coordinates/timezone in `lib/weather-data-template.ts`.
- Dashboard enrichment values are cached briefly in memory to reduce repeated requests during development sessions.

## Troubleshooting

### Metro config fails on Windows with ESM URL scheme error

Symptom:
- `Error [ERR_UNSUPPORTED_ESM_URL_SCHEME]`
- `Received protocol 'c:'`

Common cause:
- A config file (especially `tailwind.config.js`) saved as UTF-16 instead of UTF-8.

Fix:
1. In VS Code, re-save `tailwind.config.js` as UTF-8 (without BOM).
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
- `npx supabase status`
- `EXPO_PUBLIC_SUPABASE_URL` in `.env.local` points to the running instance
- Network/LAN IP is reachable from your device

### Missing env variables

If startup throws missing env var errors:
- Confirm `.env.local` exists
- Confirm variable names match exactly
- Restart Expo after env changes

## Local Supabase Config

Supabase local project configuration lives at `supabase/config.toml`.

This repo uses custom local ports (API, DB, Studio, etc.), so check that file when debugging local environment conflicts.

## Notes

- Keep project files in UTF-8 to avoid tooling issues on Windows.
