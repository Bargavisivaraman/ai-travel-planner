import { Heart, MapPin } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { addFavorite, deleteFavorite } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteButton } from "@/components/action-helpers";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const user = await requireUser();
  const favorites = await prisma.favoriteDestination.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Heart className="h-7 w-7 text-primary" /> Favorite destinations
        </h1>
        <p className="text-muted-foreground">
          Your wishlist of places to visit someday.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add a destination</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addFavorite} className="grid gap-3 sm:grid-cols-2">
            <Input name="name" placeholder="Destination name *" required />
            <Input name="country" placeholder="Country" />
            <Textarea
              name="notes"
              placeholder="Why do you want to go?"
              className="sm:col-span-2"
            />
            <Button type="submit" className="sm:w-auto">
              Add to favorites
            </Button>
          </form>
        </CardContent>
      </Card>

      {favorites.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
              <Heart className="h-6 w-6" />
            </div>
            <p className="font-semibold">No favorites yet</p>
            <p className="text-sm text-muted-foreground">
              Add the places you dream of visiting.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((f) => (
            <Card key={f.id}>
              <CardContent className="flex items-start justify-between gap-2 pt-6">
                <div>
                  <p className="font-semibold">{f.name}</p>
                  {f.country && (
                    <p className="text-sm text-muted-foreground">{f.country}</p>
                  )}
                  {f.notes && <p className="mt-1 text-sm">{f.notes}</p>}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${f.name} ${f.country || ""}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <MapPin className="h-3 w-3" /> View on map
                  </a>
                </div>
                <DeleteButton action={deleteFavorite.bind(null, f.id)} iconOnly />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
