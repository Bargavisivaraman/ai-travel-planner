"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, getOwnedTrip } from "@/lib/session";
import { tripSchema } from "@/lib/validations";
import {
  suggestPackingList,
  defaultChecklist,
  type GeneratedItinerary,
} from "@/lib/ai";

function parseDate(value: FormDataEntryValue | null): Date | null {
  if (!value || typeof value !== "string" || value.trim() === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// --------------------------- Trips ---------------------------

export async function createTrip(formData: FormData) {
  const user = await requireUser();
  const parsed = tripSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || null,
    coverImage: formData.get("coverImage") || null,
    startDate: formData.get("startDate") || null,
    endDate: formData.get("endDate") || null,
    budget: formData.get("budget") || 0,
    currency: formData.get("currency") || "USD",
    travelers: formData.get("travelers") || 1,
    status: formData.get("status") || "PLANNING",
    isPublic: formData.get("isPublic") === "on",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Invalid trip data");
  }
  const data = parsed.data;
  const trip = await prisma.trip.create({
    data: {
      userId: user.id,
      title: data.title,
      description: data.description || null,
      coverImage: data.coverImage || null,
      startDate: parseDate(formData.get("startDate")),
      endDate: parseDate(formData.get("endDate")),
      budget: data.budget,
      currency: data.currency,
      travelers: data.travelers,
      status: data.status,
      isPublic: data.isPublic,
    },
  });
  revalidatePath("/dashboard");
  redirect(`/trips/${trip.id}`);
}

export async function updateTrip(tripId: string, formData: FormData) {
  const trip = await getOwnedTrip(tripId);
  if (!trip) throw new Error("Trip not found");

  const parsed = tripSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || null,
    coverImage: formData.get("coverImage") || null,
    startDate: formData.get("startDate") || null,
    endDate: formData.get("endDate") || null,
    budget: formData.get("budget") || 0,
    currency: formData.get("currency") || "USD",
    travelers: formData.get("travelers") || 1,
    status: formData.get("status") || "PLANNING",
    isPublic: formData.get("isPublic") === "on",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Invalid trip data");
  }
  const data = parsed.data;
  await prisma.trip.update({
    where: { id: tripId },
    data: {
      title: data.title,
      description: data.description || null,
      coverImage: data.coverImage || null,
      startDate: parseDate(formData.get("startDate")),
      endDate: parseDate(formData.get("endDate")),
      budget: data.budget,
      currency: data.currency,
      travelers: data.travelers,
      status: data.status,
      isPublic: data.isPublic,
    },
  });
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/dashboard");
  redirect(`/trips/${tripId}`);
}

export async function deleteTrip(tripId: string) {
  const trip = await getOwnedTrip(tripId);
  if (!trip) throw new Error("Trip not found");
  await prisma.trip.delete({ where: { id: tripId } });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function toggleTripPublic(tripId: string, isPublic: boolean) {
  const trip = await getOwnedTrip(tripId);
  if (!trip) throw new Error("Trip not found");
  await prisma.trip.update({ where: { id: tripId }, data: { isPublic } });
  revalidatePath(`/trips/${tripId}`);
}

// --------------------------- Cities ---------------------------

export async function addCity(tripId: string, formData: FormData) {
  const trip = await getOwnedTrip(tripId);
  if (!trip) throw new Error("Trip not found");
  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("City name is required");
  const count = await prisma.city.count({ where: { tripId } });
  await prisma.city.create({
    data: {
      tripId,
      name,
      country: (formData.get("country") as string) || null,
      arrivalDate: parseDate(formData.get("arrivalDate")),
      departureDate: parseDate(formData.get("departureDate")),
      notes: (formData.get("notes") as string) || null,
      order: count,
    },
  });
  revalidatePath(`/trips/${tripId}`);
}

export async function deleteCity(tripId: string, cityId: string) {
  const trip = await getOwnedTrip(tripId);
  if (!trip) throw new Error("Trip not found");
  await prisma.city.delete({ where: { id: cityId } });
  revalidatePath(`/trips/${tripId}`);
}

// --------------------------- Itinerary ---------------------------

export async function saveGeneratedItinerary(
  tripId: string,
  itinerary: GeneratedItinerary,
  replace: boolean
) {
  const trip = await getOwnedTrip(tripId);
  if (!trip) throw new Error("Trip not found");

  if (replace) {
    await prisma.itineraryDay.deleteMany({ where: { tripId } });
  }
  const existingCount = replace
    ? 0
    : await prisma.itineraryDay.count({ where: { tripId } });

  for (let i = 0; i < itinerary.days.length; i++) {
    const day = itinerary.days[i];
    await prisma.itineraryDay.create({
      data: {
        tripId,
        dayNumber: existingCount + i + 1,
        city: day.city,
        summary: day.summary,
        activities: {
          create: day.activities.map((a, idx) => ({
            time: a.time,
            title: a.title,
            description: a.description,
            location: a.location,
            type: a.type,
            cost: a.cost,
            order: idx,
          })),
        },
      },
    });
  }
  revalidatePath(`/trips/${tripId}`);
}

export async function addDay(tripId: string, formData: FormData) {
  const trip = await getOwnedTrip(tripId);
  if (!trip) throw new Error("Trip not found");
  const count = await prisma.itineraryDay.count({ where: { tripId } });
  await prisma.itineraryDay.create({
    data: {
      tripId,
      dayNumber: count + 1,
      date: parseDate(formData.get("date")),
      city: (formData.get("city") as string) || null,
      summary: (formData.get("summary") as string) || null,
    },
  });
  revalidatePath(`/trips/${tripId}`);
}

export async function deleteDay(tripId: string, dayId: string) {
  const trip = await getOwnedTrip(tripId);
  if (!trip) throw new Error("Trip not found");
  await prisma.itineraryDay.delete({ where: { id: dayId } });
  revalidatePath(`/trips/${tripId}`);
}

export async function addActivity(
  tripId: string,
  dayId: string,
  formData: FormData
) {
  const trip = await getOwnedTrip(tripId);
  if (!trip) throw new Error("Trip not found");
  const title = (formData.get("title") as string)?.trim();
  if (!title) throw new Error("Activity title required");
  const count = await prisma.activity.count({ where: { dayId } });
  await prisma.activity.create({
    data: {
      dayId,
      title,
      time: (formData.get("time") as string) || null,
      description: (formData.get("description") as string) || null,
      location: (formData.get("location") as string) || null,
      type: (formData.get("type") as
        | "SIGHTSEEING"
        | "FOOD"
        | "TRANSPORT"
        | "HOTEL"
        | "FLIGHT"
        | "RELAX"
        | "OTHER") || "SIGHTSEEING",
      cost: Number(formData.get("cost")) || 0,
      order: count,
    },
  });
  revalidatePath(`/trips/${tripId}`);
}

export async function deleteActivity(tripId: string, activityId: string) {
  const trip = await getOwnedTrip(tripId);
  if (!trip) throw new Error("Trip not found");
  await prisma.activity.delete({ where: { id: activityId } });
  revalidatePath(`/trips/${tripId}`);
}

// --------------------------- Expenses ---------------------------

export async function addExpense(tripId: string, formData: FormData) {
  const trip = await getOwnedTrip(tripId);
  if (!trip) throw new Error("Trip not found");
  const description = (formData.get("description") as string)?.trim();
  const amount = Number(formData.get("amount"));
  if (!description || Number.isNaN(amount)) {
    throw new Error("Description and amount are required");
  }
  await prisma.expense.create({
    data: {
      tripId,
      description,
      amount,
      category: (formData.get("category") as string) || "General",
      date: parseDate(formData.get("date")) ?? new Date(),
    },
  });
  revalidatePath(`/trips/${tripId}`);
}

export async function deleteExpense(tripId: string, expenseId: string) {
  const trip = await getOwnedTrip(tripId);
  if (!trip) throw new Error("Trip not found");
  await prisma.expense.delete({ where: { id: expenseId } });
  revalidatePath(`/trips/${tripId}`);
}

// --------------------------- Packing ---------------------------

export async function addPackingItem(tripId: string, formData: FormData) {
  const trip = await getOwnedTrip(tripId);
  if (!trip) throw new Error("Trip not found");
  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Item name required");
  await prisma.packingItem.create({
    data: {
      tripId,
      name,
      category: (formData.get("category") as string) || "General",
      quantity: Number(formData.get("quantity")) || 1,
    },
  });
  revalidatePath(`/trips/${tripId}`);
}

export async function togglePackingItem(tripId: string, itemId: string, packed: boolean) {
  const trip = await getOwnedTrip(tripId);
  if (!trip) throw new Error("Trip not found");
  await prisma.packingItem.update({ where: { id: itemId }, data: { packed } });
  revalidatePath(`/trips/${tripId}`);
}

export async function deletePackingItem(tripId: string, itemId: string) {
  const trip = await getOwnedTrip(tripId);
  if (!trip) throw new Error("Trip not found");
  await prisma.packingItem.delete({ where: { id: itemId } });
  revalidatePath(`/trips/${tripId}`);
}

export async function generatePackingList(tripId: string) {
  const trip = await getOwnedTrip(tripId);
  if (!trip) throw new Error("Trip not found");
  const days =
    trip.startDate && trip.endDate
      ? Math.max(
          1,
          Math.round(
            (new Date(trip.endDate).getTime() -
              new Date(trip.startDate).getTime()) /
              86400000
          ) + 1
        )
      : 4;
  const month = trip.startDate ? new Date(trip.startDate).getMonth() : 5;
  const season =
    month >= 11 || month <= 1 ? "winter" : month >= 5 && month <= 8 ? "summer" : "";
  const suggestions = suggestPackingList({ days, season });

  const existing = await prisma.packingItem.findMany({ where: { tripId } });
  const existingNames = new Set(existing.map((i) => i.name.toLowerCase()));
  const toCreate = suggestions.filter(
    (s) => !existingNames.has(s.name.toLowerCase())
  );
  if (toCreate.length) {
    await prisma.packingItem.createMany({
      data: toCreate.map((s) => ({
        tripId,
        name: s.name,
        category: s.category,
      })),
    });
  }
  revalidatePath(`/trips/${tripId}`);
}

// --------------------------- Checklist ---------------------------

export async function addChecklistItem(tripId: string, formData: FormData) {
  const trip = await getOwnedTrip(tripId);
  if (!trip) throw new Error("Trip not found");
  const text = (formData.get("text") as string)?.trim();
  if (!text) throw new Error("Checklist text required");
  await prisma.checklistItem.create({
    data: { tripId, text, dueDate: parseDate(formData.get("dueDate")) },
  });
  revalidatePath(`/trips/${tripId}`);
}

export async function toggleChecklistItem(tripId: string, itemId: string, done: boolean) {
  const trip = await getOwnedTrip(tripId);
  if (!trip) throw new Error("Trip not found");
  await prisma.checklistItem.update({ where: { id: itemId }, data: { done } });
  revalidatePath(`/trips/${tripId}`);
}

export async function deleteChecklistItem(tripId: string, itemId: string) {
  const trip = await getOwnedTrip(tripId);
  if (!trip) throw new Error("Trip not found");
  await prisma.checklistItem.delete({ where: { id: itemId } });
  revalidatePath(`/trips/${tripId}`);
}

export async function generateChecklist(tripId: string) {
  const trip = await getOwnedTrip(tripId);
  if (!trip) throw new Error("Trip not found");
  const items = defaultChecklist();
  const existing = await prisma.checklistItem.findMany({ where: { tripId } });
  const existingText = new Set(existing.map((i) => i.text.toLowerCase()));
  const toCreate = items.filter((t) => !existingText.has(t.toLowerCase()));
  if (toCreate.length) {
    await prisma.checklistItem.createMany({
      data: toCreate.map((text) => ({ tripId, text })),
    });
  }
  revalidatePath(`/trips/${tripId}`);
}

// --------------------------- Notes ---------------------------

export async function addNote(tripId: string, formData: FormData) {
  const trip = await getOwnedTrip(tripId);
  if (!trip) throw new Error("Trip not found");
  const title = (formData.get("title") as string)?.trim();
  if (!title) throw new Error("Note title required");
  await prisma.note.create({
    data: {
      tripId,
      title,
      content: (formData.get("content") as string) || null,
      location: (formData.get("location") as string) || null,
      type: (formData.get("type") as
        | "HOTEL"
        | "FLIGHT"
        | "ACTIVITY"
        | "LOCATION"
        | "GENERAL") || "GENERAL",
    },
  });
  revalidatePath(`/trips/${tripId}`);
}

export async function deleteNote(tripId: string, noteId: string) {
  const trip = await getOwnedTrip(tripId);
  if (!trip) throw new Error("Trip not found");
  await prisma.note.delete({ where: { id: noteId } });
  revalidatePath(`/trips/${tripId}`);
}

// --------------------------- Favorites ---------------------------

export async function addFavorite(formData: FormData) {
  const user = await requireUser();
  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Destination name required");
  await prisma.favoriteDestination.create({
    data: {
      userId: user.id,
      name,
      country: (formData.get("country") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });
  revalidatePath("/favorites");
}

export async function deleteFavorite(favoriteId: string) {
  const user = await requireUser();
  const fav = await prisma.favoriteDestination.findUnique({
    where: { id: favoriteId },
  });
  if (!fav || fav.userId !== user.id) throw new Error("Not found");
  await prisma.favoriteDestination.delete({ where: { id: favoriteId } });
  revalidatePath("/favorites");
}

// --------------------------- Admin ---------------------------

export async function adminDeleteUser(userId: string) {
  const { requireAdmin } = await import("@/lib/session");
  const admin = await requireAdmin();
  if (admin.id === userId) throw new Error("You cannot delete your own account");
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin");
}

export async function adminSetRole(userId: string, role: "USER" | "ADMIN") {
  const { requireAdmin } = await import("@/lib/session");
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin");
}
