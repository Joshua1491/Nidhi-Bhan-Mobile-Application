// ============================================================
// Festival & Fasting calendar.
// Dates verified against published 2026 Hindu panchang sources
// (drikpanchang, mpanchang, ISKCON). Lunar dates can vary slightly
// by region — the UI carries a "confirm locally" note.
// ============================================================

export type ObservanceType = "festival" | "fast";

export interface Observance {
  date: string; // ISO YYYY-MM-DD
  name: string;
  type: ObservanceType;
  significance: string;
  observe: string;
  accent: string;
}

// Ordered by date.
export const OBSERVANCES: Observance[] = [
  {
    date: "2026-07-29",
    name: "Guru Purnima",
    type: "festival",
    significance:
      "The full moon honouring teachers and the inner guru — a day of gratitude for those who light the way.",
    observe:
      "Thank a teacher or mentor. Sit in quiet meditation; set an intention to keep learning.",
    accent: "#C5A66B",
  },
  {
    date: "2026-08-28",
    name: "Raksha Bandhan",
    type: "festival",
    significance:
      "The bond of protection between siblings, tied in a sacred thread (rakhi).",
    observe: "Tie a rakhi, share sweets, and renew a promise of care with family.",
    accent: "#D4A0A0",
  },
  {
    date: "2026-09-04",
    name: "Krishna Janmashtami",
    type: "festival",
    significance:
      "The birth of Lord Krishna — a celebration of divine love, courage and dharma.",
    observe:
      "Many fast until midnight, sing bhajans, and reflect on the Gita's call to act without attachment.",
    accent: "#9DB4A0",
  },
  {
    date: "2026-09-14",
    name: "Ganesh Chaturthi",
    type: "festival",
    significance:
      "The arrival of Lord Ganesha, remover of obstacles and patron of new beginnings.",
    observe:
      "Begin something you've delayed. Offer modak; ask for a clear path ahead.",
    accent: "#C98B7A",
  },
  {
    date: "2026-09-26",
    name: "Sharad Purnima",
    type: "fast",
    significance:
      "The luminous autumn full moon, associated with nectar, healing and abundance.",
    observe:
      "Keep a light fast; place kheer under the moonlight. A gentle reset for body and mind.",
    accent: "#B9A7C9",
  },
  {
    date: "2026-10-11",
    name: "Sharad Navratri begins",
    type: "festival",
    significance:
      "Nine nights honouring the Goddess in her many forms — strength, abundance and wisdom.",
    observe:
      "Many fast or eat sattvic food for nine days. A powerful window for discipline and devotion.",
    accent: "#D4A0A0",
  },
  {
    date: "2026-10-20",
    name: "Dussehra (Vijayadashami)",
    type: "festival",
    significance:
      "The triumph of good over evil — Rama's victory over Ravana, light over the shadow self.",
    observe:
      "Name one inner 'demon' (a fear, a habit) to release. An auspicious day for new ventures.",
    accent: "#C5A66B",
  },
  {
    date: "2026-10-29",
    name: "Karva Chauth",
    type: "fast",
    significance:
      "A day-long fast kept for the wellbeing and longevity of one's partner, broken at moonrise.",
    observe:
      "Those observing fast from sunrise until the moon is sighted (moonrise ~8:07 PM IST).",
    accent: "#C4A0B9",
  },
  {
    date: "2026-11-06",
    name: "Dhanteras",
    type: "festival",
    significance:
      "The opening of Diwali — honouring Dhanvantari and Lakshmi; prosperity and health.",
    observe:
      "Traditionally a day to buy metal or begin something prosperous. Clean and light the home.",
    accent: "#C5A66B",
  },
  {
    date: "2026-11-08",
    name: "Diwali (Lakshmi Puja)",
    type: "festival",
    significance:
      "The festival of lights — the inner lamp of awareness overcoming darkness; Lakshmi's blessings.",
    observe:
      "Light diyas, offer Lakshmi puja at dusk, and set heartfelt intentions for the year ahead.",
    accent: "#C5A66B",
  },
  {
    date: "2026-11-10",
    name: "Govardhan Puja",
    type: "festival",
    significance:
      "Gratitude to nature and Krishna's lifting of Govardhan hill — protection and provision.",
    observe: "Honour food and the earth; share a meal generously.",
    accent: "#9DB4A0",
  },
  {
    date: "2026-11-11",
    name: "Bhai Dooj",
    type: "festival",
    significance: "A celebration of the bond between brothers and sisters.",
    observe: "Siblings share blessings, tilak and sweets.",
    accent: "#D4A0A0",
  },
  {
    date: "2026-11-15",
    name: "Chhath Puja (Sandhya Arghya)",
    type: "fast",
    significance:
      "A four-day devotion to the Sun and Chhathi Maiya — purity, gratitude and discipline.",
    observe:
      "Devotees keep a rigorous fast and offer arghya to the setting and rising sun by water.",
    accent: "#C98B7A",
  },
  {
    date: "2026-11-24",
    name: "Kartik Purnima",
    type: "fast",
    significance:
      "A deeply auspicious full moon — charity, light and bathing in sacred waters.",
    observe: "Offer light and donate (daan). A favoured day for giving.",
    accent: "#B9A7C9",
  },
  {
    date: "2027-01-14",
    name: "Makar Sankranti",
    type: "festival",
    significance:
      "The Sun's turn toward the north — longer days, new beginnings, and harvest gratitude.",
    observe: "Share sesame & jaggery, fly kites, and give thanks for warmth returning.",
    accent: "#C5A66B",
  },
];

// Recurring monthly observances (described, not dated) — for the
// "every month" section.
export const RECURRING_FASTS = [
  {
    name: "Ekadashi",
    cadence: "Twice each lunar month",
    note: "The 11th day after each new and full moon — a fast for clarity and lightness of body and mind.",
  },
  {
    name: "Purnima",
    cadence: "Each full moon",
    note: "A day for charity, devotion and release; emotions run full — a good time to let go.",
  },
  {
    name: "Amavasya",
    cadence: "Each new moon",
    note: "A quiet, inward day — rest, honour ancestors, and plant new intentions in the dark soil.",
  },
  {
    name: "Pradosh Vrat",
    cadence: "Twice each lunar month (13th tithi)",
    note: "A dusk fast to Lord Shiva for the removal of obstacles and inner peace.",
  },
];

export function upcomingObservances(now = new Date()): Observance[] {
  const today = now.toISOString().slice(0, 10);
  return OBSERVANCES.filter((o) => o.date >= today);
}
