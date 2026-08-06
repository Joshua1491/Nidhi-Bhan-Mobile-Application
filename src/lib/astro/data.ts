// ============================================================
// Reference data for the sample Vedic engine.
// NOTE: This is curated demonstration data, not live ephemeris.
// Swap engine.ts internals for a real calculation source later;
// the page-facing types stay the same.
// ============================================================

export const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
];

export const RASIS = [
  "Mesha (Aries)", "Vrishabha (Taurus)", "Mithuna (Gemini)", "Karka (Cancer)",
  "Simha (Leo)", "Kanya (Virgo)", "Tula (Libra)", "Vrishchika (Scorpio)",
  "Dhanu (Sagittarius)", "Makara (Capricorn)", "Kumbha (Aquarius)", "Meena (Pisces)",
];

export const RASI_SHORT = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

// Vimshottari Dasha lords in sequence, with their period length in years.
export const DASHA_SEQUENCE: { lord: string; years: number; theme: string }[] = [
  { lord: "Ketu", years: 7, theme: "release, spirituality, letting go of the old" },
  { lord: "Venus", years: 20, theme: "love, beauty, comfort, relationships and creativity" },
  { lord: "Sun", years: 6, theme: "identity, authority, visibility and self-worth" },
  { lord: "Moon", years: 10, theme: "emotion, home, nurture and inner peace" },
  { lord: "Mars", years: 7, theme: "courage, drive, action and bold decisions" },
  { lord: "Rahu", years: 18, theme: "ambition, reinvention, unconventional growth" },
  { lord: "Jupiter", years: 16, theme: "wisdom, expansion, fortune and meaning" },
  { lord: "Saturn", years: 19, theme: "discipline, maturity, hard-earned mastery" },
  { lord: "Mercury", years: 17, theme: "intellect, communication, learning and skill" },
];

export const TITHIS = [
  "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi",
  "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi",
  "Trayodashi", "Chaturdashi", "Purnima",
];

export const YOGAS = [
  "Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda",
  "Sukarma", "Dhriti", "Shula", "Ganda", "Vriddhi", "Dhruva",
  "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyana",
  "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla",
  "Brahma", "Indra", "Vaidhriti",
];

// Standard Rahu Kaal slots by weekday (Sun..Sat) — the inauspicious window.
export const RAHU_KAAL_BY_DAY = [
  "4:30 – 6:00 PM", // Sunday
  "7:30 – 9:00 AM", // Monday
  "3:00 – 4:30 PM", // Tuesday
  "12:00 – 1:30 PM", // Wednesday
  "1:30 – 3:00 PM", // Thursday
  "10:30 – 12:00 PM", // Friday
  "9:00 – 10:30 AM", // Saturday
];

// Auspicious window of the day, by weekday — kept simple & believable.
export const ABHIJIT_MUHURTA = "11:48 AM – 12:36 PM";

export const LUCKY_COLORS = [
  "Soft gold", "Ivory", "Deep plum", "Sage green", "Blush rose",
  "Lavender", "Warm peach", "Pearl white", "Midnight blue", "Marigold",
];

export const LUCKY_DIRECTIONS = ["East", "North", "North-East", "West", "South-East", "North-West"];

// ------------------------------------------------------------
// Voice-of-Dr.-Nidhi content pools — astrology framed through
// subconscious transformation. Each daily reading pairs a
// "cosmic weather" line with an inner practice.
// ------------------------------------------------------------

export const FOCUS_LINES = [
  "Lean into one meaningful conversation — the planets favour honest words today.",
  "Begin the thing you've been postponing. Today's energy rewards the first small step.",
  "Protect your mornings. Your clearest decisions will arrive before noon.",
  "Choose depth over speed. A single task done with full presence moves your chart forward.",
  "Reconnect with someone who steadies you. Supportive bonds are highlighted.",
  "Trust your intuition over other people's urgency. Your inner compass is unusually accurate.",
  "Put your energy into creating, not reacting. You are the author today, not the audience.",
  "Tend to your body — rest, water, breath. A calm nervous system is your advantage now.",
  "Say a quiet yes to an opportunity that feels slightly too big. You're being expanded.",
  "Close one open loop. Completion, not addition, brings relief today.",
  "Speak your worth out loud — in a price, a request, or a boundary. The Sun backs you.",
  "Let yourself be seen. Hiding costs more than visibility does today.",
];

export const CAUTION_LINES = [
  "Avoid signing or committing during the Rahu Kaal window — wait it out.",
  "Don't take a sharp comment personally; someone else's storm isn't your weather.",
  "Resist the urge to over-explain. Less said, more held.",
  "Hold off on a big purchase — clarity improves after tomorrow.",
  "Watch a tendency to shrink. Notice it, breathe, and stay your full size.",
  "Don't mistake restlessness for a sign to quit. Sit with it a day longer.",
  "Guard against doom-scrolling tonight; it will distort an otherwise steady mind.",
  "Sidestep an old argument. The same loop, replayed, only deepens the groove.",
  "Avoid making promises from guilt. A clean 'not now' protects you both.",
  "Don't rush a reply that deserves a slept-on answer.",
];

export const PRACTICE_LIBRARY = [
  {
    title: "Ground Before You Rise",
    minutes: 3,
    kind: "Breath",
    note: "A slow 4-7-8 breath to settle the nervous system before the day claims you.",
    script: "Inhale for 4, hold for 7, release for 8. Repeat six rounds. With each exhale, silently say: 'I meet today from calm, not fear.'",
  },
  {
    title: "Install Today's Intention",
    minutes: 4,
    kind: "Subliminal Affirmation",
    note: "Plant one belief into the subconscious while it's most receptive — just after waking.",
    script: "Place a hand on your chest. Repeat slowly: 'I am safe to want what I want. I am allowed to receive it.' Let the words land in the body, not just the mind.",
  },
  {
    title: "Release the Replay",
    minutes: 5,
    kind: "Visualisation",
    note: "Clear a looping thought so it stops driving your behaviour beneath awareness.",
    script: "Picture the thought as written on water. Watch the current carry it away. Each time it returns, gently return it to the water. Nothing to fix — only to release.",
  },
  {
    title: "Reclaim Your Size",
    minutes: 3,
    kind: "Embodiment",
    note: "Counter the subconscious habit of shrinking when you're seen.",
    script: "Stand. Widen your stance, soften your jaw, lift your gaze. Breathe into the space you occupy. Say: 'I take up the room I was given.'",
  },
  {
    title: "Evening Unwind",
    minutes: 6,
    kind: "Sleep Subliminal",
    note: "Hand the day back to the universe so the mind can stop guarding.",
    script: "Lying down, scan from crown to feet, releasing each area. Whisper: 'The day is complete. I am held. I can let go now.' Let the breath grow slow and long.",
  },
  {
    title: "Forgive the Past Self",
    minutes: 4,
    kind: "Inner-Child",
    note: "Soften self-criticism that runs underneath your confidence.",
    script: "Recall a younger you who did their best with what they knew. Place a hand where you feel it. Say: 'You were never the problem. I've got us now.'",
  },
];

export const RARE_EVENTS = [
  {
    title: "A Manifestation Window Opens",
    body: "The Moon moves through your birth Nakshatra today — a rare alignment that makes your intentions unusually potent. Write down one clear desire as if it were already done.",
    accent: "#C5A66B",
  },
  {
    title: "A Karmic Door (Rahu–Ketu Axis)",
    body: "The lunar nodes brush a sensitive point in your chart. Old patterns may surface — not to haunt you, but to be released. Notice what asks for closure.",
    accent: "#C4A0B9",
  },
  {
    title: "Jupiter's Blessing Touches Your Chart",
    body: "An expansive transit favours bold, faith-led moves. If there's a leap you've been weighing, the next 48 hours carry tailwind.",
    accent: "#B8935A",
  },
];
