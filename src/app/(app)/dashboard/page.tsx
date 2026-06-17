import Link from "next/link";
import { Plus, MapPin, Calendar, Wallet, Plane } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, dateRange, tripDuration } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_VARIANT = {
  PLANNING: "secondary",
  BOOKED: "warning",
  COMPLETED: "success",
} as const;

export default async function DashboardPage() {
  const user = await requireUser();
  const trips = await prisma.trip.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { cities: true, days: true, expenses: true } },
      expenses: { select: { amount: true } },
    },
  });

  const totalBudget = trips.reduce((s, t) => s + t.budget, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Hi, {user.name?.split(" ")[0] || "traveler"} 👋
          </h1>
          <p className="text-muted-foreground">
            {trips.length === 0
              ? "Let's plan your first adventure."
              : `You have ${trips.length} trip${trips.length > 1 ? "s" : ""} planned.`}
          </p>
        </div>
        <Link href="/trips/new" className={cn(buttonVariants())}>
          <Plus className="h-4 w-4" /> New trip
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-accent text-accent-foreground">
              <Plane className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{trips.length}</p>
              <p className="text-sm text-muted-foreground">Total trips</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-accent text-accent-foreground">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {trips.filter((t) => t.status !== "COMPLETED").length}
              </p>
              <p className="text-sm text-muted-foreground">Upcoming</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-accent text-accent-foreground">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
              <p className="text-sm text-muted-foreground">Total budget</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {trips.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-foreground">
              <Plane className="h-7 w-7" />
            </div>
            <div>
              <p className="text-lg font-semibold">No trips yet</p>
              <p className="text-muted-foreground">
                Create your first trip and let AI build the itinerary.
              </p>
            </div>
            <Link href="/trips/new" className={cn(buttonVariants())}>
              <Plus className="h-4 w-4" /> Create a trip
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => {
            const spent = trip.expenses.reduce((s, e) => s + e.amount, 0);
            const days = tripDuration(trip.startDate, trip.endDate);
            return (
              <Link key={trip.id} href={`/trips/${trip.id}`}>
                <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
                  <div
                    className="h-28 bg-cover bg-center bg-gradient-to-br from-primary/30 to-purple-500/30"
                    style={
                      trip.coverImage
                        ? { backgroundImage: `url(${trip.coverImage})` }
                        : undefined
                    }
                  />
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="line-clamp-1">{trip.title}</CardTitle>
                      <Badge variant={STATUS_VARIANT[trip.status]}>
                        {trip.status.toLowerCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {dateRange(trip.startDate, trip.endDate)}
                      {days ? ` · ${days}d` : ""}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {trip._count.cities} cities · {trip._count.days} days planned
                    </p>
                    <p className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      {formatCurrency(spent, trip.currency)} /{" "}
                      {formatCurrency(trip.budget, trip.currency)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
