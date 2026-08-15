# Store submission kit — Stars & Beyond

Everything App Store Connect and Google Play will ask for, answered
once, here. Copy-paste as the forms come up.

---

## Identity

| Field | Value |
|---|---|
| App name | Stars & Beyond |
| Subtitle (iOS, ≤30 chars) | Vedic astrology, lived daily |
| Bundle ID (iOS) | com.starsandbeyond.app |
| Package (Android) | com.starsandbeyond.app |
| Category | Lifestyle |
| Secondary category | Health & Fitness |
| Age rating | 4+ / Everyone (no objectionable content; astrology is presented as guidance and reflection) |
| Support URL | https://www.drnidhibhan.com/contact |
| Marketing URL | https://www.drnidhibhan.com |
| Privacy policy URL | https://www.drnidhibhan.com/privacy |

## Description (App Store / Play Store)

Your birth chart, read properly — and lived daily.

Stars & Beyond is the companion app of Dr. Nidhi Bhan, Vedic
astrologer and subconscious mind transformation expert with 25+ years
and 75,000+ consultations. It computes your real chart from your
birth details — all nine grahas, dashas, nakshatras — and turns it
into something you use every day, not a horoscope column.

— YOUR CHART, CANONICAL. Signs, houses, nakshatras and dignities from
your precise birth time and place, computed with real ephemeris.

— A MORNING THAT KNOWS YOU. Daily guidance tuned to your current
dasha and transits — never generic, never recycled.

— REMEDIES PRESCRIBED, NOT BROWSED. What Dr. Nidhi prescribes for
your chart arrives in the app with her reasoning, and you track it
day by day. Nothing here is self-serve guesswork.

— SESSIONS THAT COME TO YOU. Book a real session against her live
availability, get reminded, and join with one tap when it begins.

— A THREAD THAT STAYS. Write to Dr. Nidhi between sessions; her
notes from your readings stay with you, in your pocket.

— JOURNEYS, JOURNALING, MUHURTA. Guided multi-day practices, a
private journal with daily prompts, auspicious-date finding,
compatibility, and the festival calendar — all read from your chart.

Your data stays yours: your journal is private, your birth details
are used only to compute your chart, and account deletion is built
in, not buried.

## Keywords (iOS, ≤100 chars)

vedic,astrology,jyotish,birth chart,kundli,dasha,nakshatra,remedies,hypnotherapy,muhurta

## What's new (v1.0.0)

First release: your full Vedic chart, daily guidance, prescribed
remedies, in-app booking, session reminders, and a direct line to
Dr. Nidhi.

---

## Privacy questionnaire (Apple "App Privacy" / Play "Data safety")

Data collected, all linked to identity (account-based app):

| Data | Purpose | Notes |
|---|---|---|
| Email address | App functionality (account) | Sign-in identity |
| Name | App functionality | Shown to the practitioner |
| Date/place/time of birth | App functionality | Chart computation only |
| Journal entries, mood logs | App functionality | Private to the user; never analytics |
| Messages to the practitioner | App functionality | The client–practitioner thread |
| Push token | App functionality | Session reminders, message alerts |

- Tracking (cross-app/ATT): **NO** — the app contains no ads, no
  third-party analytics, no tracking SDKs.
- Data sold: **NO**. Data shared with third parties: **NO** (Supabase
  and Expo act as processors, not recipients).
- Account deletion: in-app (Profile → delete account), which erases
  the account and its data server-side. (App Store guideline 5.1.1(v)
  — already implemented.)

## App Review notes (the box reviewers read)

This is the client companion app for a real astrology & hypnotherapy
practice (drnidhibhan.com). A reviewer needs an account to see past
the sign-in screen:

> Demo account: [CREATE BEFORE SUBMITTING — a real prod account with
> demo birth details, at least one prescribed remedy, one booked
> session and one message in the thread, so every screen has content.
> Do NOT hand Apple a real client's login.]

Booking in the app creates a real appointment against the practice
calendar — reviewers are welcome to book; the demo account's bookings
are cleaned up by the practice.

## Assets still needed (cannot be generated here)

- iOS screenshots: 6.7" (1290×2796) and 5.5" (1242×2208) — take from
  the dev build on device or simulator once EAS is set up; the money
  shots are Today, Your Chart, Remedies (with a prescription), Book
  (slot picker), and Messages.
- Play Store: feature graphic 1024×500, phone screenshots.
- Both stores accept the existing icon (`assets/images/icon.png`).

## Pre-submission checklist

- [ ] `eas login` + `eas init` (projectId lands in app.json)
- [ ] `eas build --profile development --platform ios` → walk every
      screen on a real device, including a real push notification
- [ ] Create the Apple demo account (see review notes above)
- [ ] Screenshots captured
- [ ] `eas build --profile production --platform ios`
- [ ] `eas submit --platform ios`
- [ ] Same pair for Android when ready (Play needs a one-time $25
      developer registration)
