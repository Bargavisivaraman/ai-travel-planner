import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Plane, Calendar, Users, MapPin, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/mode-toggle";
import { formatCurrency, dateRange, tripDuration } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ACTIVITY_EMOJI: Record<string, string> = {
  SIGHTSEEING: "📸",
  FOOD: "🍽️",
  TRANSPORT: "🚌",
  HOTEL: "🏨",
  FLIGHT: "✈️",
  RELAX: "🌴",
  OTHER: "📌",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const trip = await prisma.trip.findFirst({
    where: { shareSlug: slug, isPublic: true },
  });
  if (!trip) return { title: "Itinerary not found" };
  return {
    title: `${trip.title} — Shared itinerary`,
    description: trip.description ?? `A ${trip.title} travel itinerary.`,
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const trip = await prisma.trip.findFirst({
    where: { shareSlug: slug, isPublic: true },
    include: {
      user: { select: { name: true } },
      cities: { orderBy: { order: "asc" } },
      days: {
        orderBy: { dayNumber: "asc" },
        include: { activities: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!trip) notFound();

  const days = tripDuration(trip.startDate, trip.endDate);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Plane className="h-5 w-5" />
            </span>
            Wanderlust
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Public itinerary</Badge>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="container max-w-3xl py-10">
        <div
          className="mb-6 h-48 rounded-2xl bg-cover bg-center bg-gradient-to-br from-primary/40 to-purple-500/40"
          style={
            trip.coverImage ? { backgroundImage: `url(${trip.coverImage})` } : undefined
          }
        />
        <h1 className="text-4xl font-extrabold tracking-tight">{trip.title}</h1>
        {trip.description && (
          <p className="mt-2 text-lg text-muted-foreground">{trip.description}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {dateRange(trip.startDate, trip.endDate)}
            {days ? ` · ${days} days` : ""}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" /> {trip.travelers} traveler
            {trip.travelers > 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1.5">
            <Wallet className="h-4 w-4" />
            {formatCurrency(trip.budget, trip.currency)}
          </span>
          {trip.user?.name && <span>Planned by {trip.user.name}</span>}
        </div>

        {trip.cities.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {trip.cities.map((c) => (
              <Badge key={c.id} variant="outline" className="text-sm">
                <MapPin className="mr-1 h-3 w-3" /> {c.name}
                {c.country ? `, ${c.country}` : ""}
              </Badge>
            ))}
          </div>
        )}

        <h2 className="mb-4 mt-10 text-2xl font-bold">Itinerary</h2>
        {trip.days.length === 0 ? (
          <p className="text-muted-foreground">No daily schedule shared yet.</p>
        ) : (
          <div className="space-y-4">
            {trip.days.map((day) => (
              <Card key={day.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    Day {day.dayNumber}
                    {day.city ? ` — ${day.city}` : ""}
                  </CardTitle>
                  {day.summary && (
                    <p className="text-sm text-muted-foreground">{day.summary}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  {day.activities.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-start gap-3 rounded-md border bg-muted/30 p-3"
                    >
                      <span className="text-lg">{ACTIVITY_EMOJI[a.type]}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          {a.time && (
                            <span className="font-mono text-sm text-muted-foreground">
                              {a.time}
                            </span>
                          )}
                          <span className="font-medium">{a.title}</span>
                        </div>
                        {a.description && (
                          <p className="text-sm text-muted-foreground">
                            {a.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-12 rounded-xl border bg-card p-6 text-center">
          <p className="font-semibold">Plan your own trip like this</p>
          <Link
            href="/register"
            className="mt-3 inline-flex h-10 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try Wanderlust free
          </Link>
        </div>
      </main>
    </>
  );
}
