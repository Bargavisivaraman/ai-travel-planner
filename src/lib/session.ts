import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}

/** Loads a trip the current user owns (or any trip if admin). Returns null otherwise. */
export async function getOwnedTrip(tripId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) return null;
  if (trip.userId !== session.user.id && session.user.role !== "ADMIN") {
    return null;
  }
  return trip;
}
