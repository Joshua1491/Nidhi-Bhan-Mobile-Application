# Dr. Nidhi Bhan — iOS App

Native mobile app for the drnidhibhan.com member portal, built with Expo (SDK 57) +
React Native + TypeScript. It reuses the website's astro engine verbatim and talks to
the same Supabase database, so web and app stay perfectly in sync.

## Architecture

| Concern | Where it runs |
|---|---|
| Auth (email + password, OTP verify) | Supabase Auth, session stored on-device |
| Profile, moods, journeys, remedies, journal, notes, flags | Supabase direct (RLS) |
| Panchang, day windows, muhurta, dasha display, daily practices | **On-device** — `src/lib/astro/*` (same files as the website) |
| Canonical chart (VedAstro), geocoding | Website route `/api/app/astro/bundle`, `/api/app/geocode` |
| AI readings (daily, horizon, remedies, journal prompt, festival note, chart insight, compatibility) | Website route `/api/app/ai` — cached per user/day in the same tables the web portal uses |

The app authenticates to the website routes with its Supabase JWT (`Authorization:
Bearer`), so RLS and caching behave identically to the web portal. No secrets ship in
the app binary.

**Prerequisite:** deploy the `website-additions/` routes to the Next.js site first.

## Screens

Login · Signup · OTP Verify · Onboarding (birth details) · **Today** (panchang, AI
reading, practices, mood) · **Horizon** (dasha chapter, Sade Sati) · **Journeys**
(+detail, streaks) · **Explore**: Auspicious Dates, Compatibility, Remedies,
Reflections, Festivals, Dr. Nidhi's Notes · **You** (chart, birth details, sign out).
Feature flags (`feature_flags` table) hide tools exactly as on the web.

## Run it

```bash
npm install
npx expo start        # scan the QR with the Expo Go app on your iPhone
```

## Ship it (App Store)

1. `npm i -g eas-cli && eas login` (free Expo account)
2. `eas build --platform ios --profile production` — EAS builds in the cloud; you
   need an Apple Developer account ($99/yr) and EAS will handle certificates.
3. `eas submit --platform ios` — uploads to App Store Connect.
4. Fill in the listing (screenshots, privacy: account data + journal content are
   collected and linked to identity) and submit for review.

## Config

Copy `.env.example` to `.env` to override Supabase or the API base URL. Bundle id:
`com.drnidhibhan.app`.
