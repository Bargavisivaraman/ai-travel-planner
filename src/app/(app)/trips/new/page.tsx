import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { createTrip } from "@/lib/actions";
import { TripForm } from "@/components/trip-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function NewTripPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create a new trip</CardTitle>
          <CardDescription>
            Set the basics now — you can add an AI itinerary, budget and more
            once the trip is created.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TripForm action={createTrip} submitLabel="Create trip" />
        </CardContent>
      </Card>
    </div>
  );
}
