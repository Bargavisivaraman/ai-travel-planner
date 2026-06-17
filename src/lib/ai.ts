import OpenAI from "openai";
import type { GenerateInput } from "@/lib/validations";

export type GeneratedActivity = {
  time: string;
  title: string;
  description: string;
  location: string;
  type: "SIGHTSEEING" | "FOOD" | "TRANSPORT" | "HOTEL" | "FLIGHT" | "RELAX" | "OTHER";
  cost: number;
};

export type GeneratedDay = {
  dayNumber: number;
  city: string;
  summary: string;
  activities: GeneratedActivity[];
};

export type GeneratedItinerary = {
  destination: string;
  days: GeneratedDay[];
  source: "openai" | "engine";
};

const SYSTEM_PROMPT = `You are an expert travel planner. Produce a realistic, well-paced day-by-day itinerary.
Return ONLY valid JSON matching this TypeScript type, with no markdown fences:
{
  "days": [
    {
      "dayNumber": number,
      "city": string,
      "summary": string,
      "activities": [
        { "time": string, "title": string, "description": string, "location": string,
          "type": "SIGHTSEEING"|"FOOD"|"TRANSPORT"|"HOTEL"|"FLIGHT"|"RELAX"|"OTHER", "cost": number }
      ]
    }
  ]
}`;

export async function generateItinerary(
  input: GenerateInput
): Promise<GeneratedItinerary> {
  const key = process.env.OPENAI_API_KEY;
  if (key && key.trim().length > 0) {
    try {
      const ai = await generateWithOpenAI(input, key);
      if (ai) return ai;
    } catch (err) {
      console.error("OpenAI generation failed, falling back to engine:", err);
    }
  }
  return { ...generateWithEngine(input), source: "engine" };
}

async function generateWithOpenAI(
  input: GenerateInput,
  apiKey: string
): Promise<GeneratedItinerary | null> {
  const client = new OpenAI({ apiKey });
  const userPrompt = `Plan a ${input.days}-day trip to ${input.destination}.
Pace: ${input.pace}. Budget level: ${input.budgetLevel}.
Traveler interests: ${input.interests || "general sightseeing, local food, culture"}.
Include 3-5 activities per day with approximate per-person costs in USD.`;

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.8,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) return null;

  const parsed = JSON.parse(raw) as { days?: GeneratedDay[] };
  if (!parsed.days || !Array.isArray(parsed.days) || parsed.days.length === 0) {
    return null;
  }
  return {
    destination: input.destination,
    days: parsed.days.slice(0, input.days),
    source: "openai",
  };
}

// ---------------------------------------------------------------------------
// Deterministic fallback engine — works with zero external dependencies.
// ---------------------------------------------------------------------------

const COST_MULTIPLIER: Record<GenerateInput["budgetLevel"], number> = {
  budget: 0.6,
  mid: 1,
  luxury: 2.2,
};

const ACTIVITIES_PER_PACE: Record<GenerateInput["pace"], number> = {
  relaxed: 3,
  balanced: 4,
  packed: 5,
};

type Template = {
  time: string;
  type: GeneratedActivity["type"];
  title: (dest: string) => string;
  description: string;
  baseCost: number;
};

const MORNING: Template[] = [
  {
    time: "08:30",
    type: "FOOD",
    title: (d) => `Breakfast at a local cafe in ${d}`,
    description: "Start the day with regional specialties and great coffee.",
    baseCost: 12,
  },
  {
    time: "10:00",
    type: "SIGHTSEEING",
    title: (d) => `Explore the historic center of ${d}`,
    description: "Walk the old town, landmarks and main squares.",
    baseCost: 0,
  },
  {
    time: "09:30",
    type: "SIGHTSEEING",
    title: (d) => `Visit a top museum in ${d}`,
    description: "Discover the city's art and history collections.",
    baseCost: 20,
  },
];

const AFTERNOON: Template[] = [
  {
    time: "13:00",
    type: "FOOD",
    title: (d) => `Lunch at a popular spot in ${d}`,
    description: "Try the dish the region is famous for.",
    baseCost: 18,
  },
  {
    time: "15:00",
    type: "SIGHTSEEING",
    title: (d) => `Guided walking tour of ${d}`,
    description: "Learn the local stories behind the streets.",
    baseCost: 25,
  },
  {
    time: "16:00",
    type: "RELAX",
    title: (d) => `Relax in a park or waterfront in ${d}`,
    description: "Unwind and enjoy the local atmosphere.",
    baseCost: 0,
  },
];

const EVENING: Template[] = [
  {
    time: "19:30",
    type: "FOOD",
    title: (d) => `Dinner at a recommended restaurant in ${d}`,
    description: "Reserve ahead for the best tables.",
    baseCost: 35,
  },
  {
    time: "21:00",
    type: "OTHER",
    title: (d) => `Evening stroll & nightlife in ${d}`,
    description: "Experience the city after dark.",
    baseCost: 15,
  },
];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export function generateWithEngine(input: GenerateInput): GeneratedItinerary {
  const mult = COST_MULTIPLIER[input.budgetLevel];
  const perDay = ACTIVITIES_PER_PACE[input.pace];
  const dest = input.destination.trim();
  const days: GeneratedDay[] = [];

  for (let i = 0; i < input.days; i++) {
    const dayNumber = i + 1;
    const slots: GeneratedActivity[] = [];

    if (dayNumber === 1) {
      slots.push({
        time: "12:00",
        title: `Arrive in ${dest} & hotel check-in`,
        description: "Settle in, drop your bags and get oriented.",
        location: dest,
        type: "HOTEL",
        cost: 0,
      });
    }

    const pools = [MORNING, AFTERNOON, EVENING];
    let added = slots.length;
    let p = 0;
    while (added < perDay && p < perDay * 2) {
      const pool = pools[p % pools.length];
      const t = pick(pool, i + p);
      slots.push({
        time: t.time,
        title: t.title(dest),
        description: t.description,
        location: dest,
        type: t.type,
        cost: Math.round(t.baseCost * mult),
      });
      added++;
      p++;
    }

    if (dayNumber === input.days && input.days > 1) {
      slots.push({
        time: "10:00",
        title: `Check out & departure from ${dest}`,
        description: "Last-minute souvenirs before heading home.",
        location: dest,
        type: "TRANSPORT",
        cost: 0,
      });
    }

    slots.sort((a, b) => a.time.localeCompare(b.time));

    days.push({
      dayNumber,
      city: dest,
      summary:
        dayNumber === 1
          ? `Arrival and first taste of ${dest}.`
          : dayNumber === input.days
          ? `Final highlights and departure from ${dest}.`
          : `Full day exploring ${dest} (${input.pace} pace).`,
      activities: slots,
    });
  }

  return { destination: dest, days, source: "engine" };
}

// ---------------------------------------------------------------------------
// Packing list + weather heuristics (used by generators in the UI)
// ---------------------------------------------------------------------------

export type PackingSuggestion = { name: string; category: string };

export function suggestPackingList(opts: {
  days: number;
  season?: string;
}): PackingSuggestion[] {
  const base: PackingSuggestion[] = [
    { name: "Passport / ID", category: "Documents" },
    { name: "Travel insurance copy", category: "Documents" },
    { name: "Phone + charger", category: "Electronics" },
    { name: "Power adapter", category: "Electronics" },
    { name: "Toothbrush & toiletries", category: "Toiletries" },
    { name: "Medications", category: "Health" },
    { name: "Reusable water bottle", category: "Essentials" },
    { name: "Daypack", category: "Essentials" },
  ];
  const clothesCount = Math.min(Math.max(opts.days, 2), 10);
  base.push(
    { name: `${clothesCount} sets of clothes`, category: "Clothing" },
    { name: "Comfortable walking shoes", category: "Clothing" },
    { name: "Sleepwear", category: "Clothing" }
  );

  const season = (opts.season || "").toLowerCase();
  if (season.includes("winter") || season.includes("cold")) {
    base.push(
      { name: "Warm jacket", category: "Clothing" },
      { name: "Gloves & beanie", category: "Clothing" },
      { name: "Thermal layers", category: "Clothing" }
    );
  } else if (season.includes("summer") || season.includes("hot")) {
    base.push(
      { name: "Sunscreen", category: "Health" },
      { name: "Sunglasses", category: "Essentials" },
      { name: "Hat", category: "Clothing" },
      { name: "Swimwear", category: "Clothing" }
    );
  } else {
    base.push(
      { name: "Light rain jacket", category: "Clothing" },
      { name: "Layerable clothing", category: "Clothing" }
    );
  }
  return base;
}

export function defaultChecklist(): string[] {
  return [
    "Book flights",
    "Book accommodation",
    "Check passport validity (6+ months)",
    "Apply for visa if required",
    "Get travel insurance",
    "Notify bank of travel dates",
    "Download offline maps",
    "Arrange airport transfers",
    "Check vaccination requirements",
    "Set up international roaming or eSIM",
  ];
}

export function weatherTips(destination: string): string[] {
  return [
    `Check the 10-day forecast for ${destination} before you pack.`,
    "Pack layers so you can adapt to changing conditions.",
    "Carry a compact umbrella or rain jacket for surprise showers.",
    "Bring sun protection — UV can be strong even on cloudy days.",
    "Keep electronics in a waterproof pouch during outdoor activities.",
  ];
}
