import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateWithEngine, suggestPackingList, defaultChecklist } from "../src/lib/ai";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database…");

  const demoPassword = await bcrypt.hash("demo1234", 10);
  const adminPassword = await bcrypt.hash("admin1234", 10);

  const demo = await prisma.user.upsert({
    where: { email: "demo@wanderlust.app" },
    update: { password: demoPassword },
    create: {
      email: "demo@wanderlust.app",
      name: "Demo Traveler",
      password: demoPassword,
      role: "USER",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@wanderlust.app" },
    update: { password: adminPassword, role: "ADMIN" },
    create: {
      email: "admin@wanderlust.app",
      name: "Admin",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // Reset demo user's trips for a clean, repeatable seed.
  await prisma.trip.deleteMany({ where: { userId: demo.id } });
  await prisma.favoriteDestination.deleteMany({ where: { userId: demo.id } });

  // ---- Trip 1: Japan (rich, fully populated, public) ----
  const japan = await prisma.trip.create({
    data: {
      userId: demo.id,
      title: "Cherry Blossoms in Japan",
      description:
        "A 5-day spring trip through Tokyo and Kyoto chasing sakura, food and temples.",
      coverImage:
        "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=1200&q=80",
      startDate: new Date("2026-04-02"),
      endDate: new Date("2026-04-06"),
      budget: 3500,
      currency: "USD",
      travelers: 2,
      status: "BOOKED",
      isPublic: true,
    },
  });

  await prisma.city.createMany({
    data: [
      {
        tripId: japan.id,
        name: "Tokyo",
        country: "Japan",
        arrivalDate: new Date("2026-04-02"),
        departureDate: new Date("2026-04-04"),
        order: 0,
        notes: "Stay near Shinjuku for easy transit.",
      },
      {
        tripId: japan.id,
        name: "Kyoto",
        country: "Japan",
        arrivalDate: new Date("2026-04-04"),
        departureDate: new Date("2026-04-06"),
        order: 1,
        notes: "Bullet train from Tokyo (~2h 15m).",
      },
    ],
  });

  const japanItinerary = generateWithEngine({
    destination: "Tokyo & Kyoto, Japan",
    days: 5,
    interests: "temples, sushi, gardens, nightlife",
    pace: "balanced",
    budgetLevel: "mid",
  });

  for (let i = 0; i < japanItinerary.days.length; i++) {
    const day = japanItinerary.days[i];
    await prisma.itineraryDay.create({
      data: {
        tripId: japan.id,
        dayNumber: day.dayNumber,
        city: i < 2 ? "Tokyo" : "Kyoto",
        summary: day.summary,
        activities: {
          create: day.activities.map((a, idx) => ({
            time: a.time,
            title: a.title,
            description: a.description,
            location: i < 2 ? "Tokyo" : "Kyoto",
            type: a.type,
            cost: a.cost,
            order: idx,
          })),
        },
      },
    });
  }

  await prisma.expense.createMany({
    data: [
      { tripId: japan.id, category: "Transport", description: "Round-trip flights", amount: 1600, date: new Date("2026-03-01") },
      { tripId: japan.id, category: "Lodging", description: "Tokyo hotel (2 nights)", amount: 420, date: new Date("2026-04-02") },
      { tripId: japan.id, category: "Lodging", description: "Kyoto ryokan (2 nights)", amount: 510, date: new Date("2026-04-04") },
      { tripId: japan.id, category: "Food", description: "Sushi dinner", amount: 140, date: new Date("2026-04-03") },
      { tripId: japan.id, category: "Activities", description: "Temple entries & tours", amount: 95, date: new Date("2026-04-05") },
    ],
  });

  await prisma.packingItem.createMany({
    data: suggestPackingList({ days: 5, season: "spring" }).map((p) => ({
      tripId: japan.id,
      name: p.name,
      category: p.category,
    })),
  });

  await prisma.checklistItem.createMany({
    data: defaultChecklist().map((text, i) => ({
      tripId: japan.id,
      text,
      done: i < 4,
    })),
  });

  await prisma.note.createMany({
    data: [
      { tripId: japan.id, type: "HOTEL", title: "Shinjuku Granbell Hotel", content: "Confirmation #JP-48213. Check-in 3pm.", location: "Shinjuku, Tokyo" },
      { tripId: japan.id, type: "FLIGHT", title: "Outbound NH-101", content: "Dep 11:20, Gate updates day-of.", location: "Narita Airport" },
      { tripId: japan.id, type: "LOCATION", title: "Fushimi Inari Shrine", content: "Go early (before 8am) to beat crowds.", location: "Fushimi Inari, Kyoto" },
    ],
  });

  // ---- Trip 2: Italy (planning stage) ----
  const italy = await prisma.trip.create({
    data: {
      userId: demo.id,
      title: "Italian Summer Escape",
      description: "Rome, Florence and the Amalfi Coast over 7 days.",
      coverImage:
        "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=80",
      startDate: new Date("2026-07-10"),
      endDate: new Date("2026-07-16"),
      budget: 4200,
      currency: "EUR",
      travelers: 2,
      status: "PLANNING",
      isPublic: false,
    },
  });

  await prisma.city.createMany({
    data: [
      { tripId: italy.id, name: "Rome", country: "Italy", order: 0 },
      { tripId: italy.id, name: "Florence", country: "Italy", order: 1 },
      { tripId: italy.id, name: "Amalfi", country: "Italy", order: 2 },
    ],
  });

  await prisma.expense.createMany({
    data: [
      { tripId: italy.id, category: "Lodging", description: "Rome Airbnb deposit", amount: 300, date: new Date("2026-05-01") },
      { tripId: italy.id, category: "Activities", description: "Colosseum tickets", amount: 80, date: new Date("2026-05-02") },
    ],
  });

  // ---- Favorites ----
  await prisma.favoriteDestination.createMany({
    data: [
      { userId: demo.id, name: "Santorini", country: "Greece", notes: "Sunset in Oia." },
      { userId: demo.id, name: "Banff", country: "Canada", notes: "Lake Louise hikes." },
      { userId: demo.id, name: "Marrakech", country: "Morocco", notes: "Medina & markets." },
    ],
  });

  console.log("✅ Seed complete");
  console.log(`   Demo user:  demo@wanderlust.app / demo1234`);
  console.log(`   Admin user: admin@wanderlust.app / admin1234`);
  console.log(`   Created trips for ${demo.email} and admin ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
