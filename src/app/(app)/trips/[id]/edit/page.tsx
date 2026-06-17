import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getOwnedTrip } from "@/lib/session";
import { updateTrip } from "@/lib/actions";
import { TripForm } from "@/components/trip-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trip = await getOwnedTrip(id);
  if (!trip) notFound();

  const updateAction = updateTrip.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/trips/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to trip
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Edit trip</CardTitle>
        </CardHeader>
        <CardContent>
          <TripForm action={updateAction} trip={trip} submitLabel="Save changes" />
        </CardContent>
      </Card>
    </div>
  );
}
