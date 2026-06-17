import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Calendar,
  Users,
  Wallet,
  MapPin,
  Sparkles,
  Plane,
  ListChecks,
  Luggage,
  StickyNote,
  Globe,
  CloudSun,
  Share2,
  ExternalLink,
} from "lucide-react";
import { getOwnedTrip } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  deleteTrip,
  addCity,
  deleteCity,
  addDay,
  deleteDay,
  addActivity,
  deleteActivity,
  addExpense,
  deleteExpense,
  addPackingItem,
  togglePackingItem,
  deletePackingItem,
  generatePackingList,
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
  generateChecklist,
  addNote,
  deleteNote,
} from "@/lib/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ItineraryGenerator } from "@/components/itinerary-generator";
import { ExpenseChart } from "@/components/expense-chart";
import { DeleteButton, CheckToggle, ActionRunner } from "@/components/action-helpers";
import { ShareToggle } from "@/components/share-toggle";
import {
  cn,
  formatCurrency,
  dateRange,
  tripDuration,
  formatDate,
} from "@/lib/utils";
import { weatherTips } from "@/lib/ai";

export const dynamic = "force-dynamic";

const STATUS_VARIANT = {
  PLANNING: "secondary",
  BOOKED: "warning",
  COMPLETED: "success",
} as const;

const ACTIVITY_EMOJI: Record<string, string> = {
  SIGHTSEEING: "📸",
  FOOD: "🍽️",
  TRANSPORT: "🚌",
  HOTEL: "🏨",
  FLIGHT: "✈️",
  RELAX: "🌴",
  OTHER: "📌",
};

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const owned = await getOwnedTrip(id);
  if (!owned) notFound();

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      cities: { orderBy: { order: "asc" } },
      days: {
        orderBy: { dayNumber: "asc" },
        include: { activities: { orderBy: { order: "asc" } } },
      },
      expenses: { orderBy: { date: "desc" } },
      packing: { orderBy: { category: "asc" } },
      checklist: { orderBy: { done: "asc" } },
      notes: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!trip) notFound();

  const spent = trip.expenses.reduce((s, e) => s + e.amount, 0);
  const remaining = trip.budget - spent;
  const days = tripDuration(trip.startDate, trip.endDate);
  const packedCount = trip.packing.filter((p) => p.packed).length;
  const doneCount = trip.checklist.filter((c) => c.done).length;

  // Group expenses by category for the chart
  const byCategory = Object.entries(
    trip.expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Group packing items by category
  const packingByCat = trip.packing.reduce<Record<string, typeof trip.packing>>(
    (acc, item) => {
      (acc[item.category] ||= []).push(item);
      return acc;
    },
    {}
  );

  const deleteTripBound = deleteTrip.bind(null, id);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      {/* Header */}
      <Card className="overflow-hidden">
        <div
          className="h-40 bg-cover bg-center bg-gradient-to-br from-primary/40 to-purple-500/40"
          style={
            trip.coverImage ? { backgroundImage: `url(${trip.coverImage})` } : undefined
          }
        />
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{trip.title}</h1>
                <Badge variant={STATUS_VARIANT[trip.status]}>
                  {trip.status.toLowerCase()}
                </Badge>
              </div>
              {trip.description && (
                <p className="max-w-2xl text-muted-foreground">{trip.description}</p>
              )}
              <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1 text-sm text-muted-foreground">
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
                  <Wallet className="h-4 w-4" /> {formatCurrency(trip.budget, trip.currency)} budget
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ShareToggle
                tripId={trip.id}
                slug={trip.shareSlug}
                isPublic={trip.isPublic}
              />
              <Link
                href={`/trips/${id}/edit`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                <Pencil className="h-4 w-4" /> Edit
              </Link>
              <DeleteButton
                action={deleteTripBound}
                label="Delete trip"
                confirm="Delete this trip and all its data? This cannot be undone."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget summary strip */}
      <div className="grid gap-4 sm:grid-cols-4">
        <SummaryStat label="Budget" value={formatCurrency(trip.budget, trip.currency)} icon={<Wallet className="h-4 w-4" />} />
        <SummaryStat label="Spent" value={formatCurrency(spent, trip.currency)} icon={<Wallet className="h-4 w-4" />} />
        <SummaryStat
          label="Remaining"
          value={formatCurrency(remaining, trip.currency)}
          icon={<Wallet className="h-4 w-4" />}
          tone={remaining < 0 ? "danger" : "ok"}
        />
        <SummaryStat
          label="Packed / Checklist"
          value={`${packedCount}/${trip.packing.length} · ${doneCount}/${trip.checklist.length}`}
          icon={<ListChecks className="h-4 w-4" />}
        />
      </div>

      <Tabs defaultValue="itinerary">
        <TabsList>
          <TabsTrigger value="itinerary">
            <Sparkles className="h-4 w-4" /> Itinerary
          </TabsTrigger>
          <TabsTrigger value="cities">
            <Globe className="h-4 w-4" /> Cities
          </TabsTrigger>
          <TabsTrigger value="budget">
            <Wallet className="h-4 w-4" /> Budget
          </TabsTrigger>
          <TabsTrigger value="packing">
            <Luggage className="h-4 w-4" /> Packing
          </TabsTrigger>
          <TabsTrigger value="checklist">
            <ListChecks className="h-4 w-4" /> Checklist
          </TabsTrigger>
          <TabsTrigger value="notes">
            <StickyNote className="h-4 w-4" /> Notes
          </TabsTrigger>
          <TabsTrigger value="weather">
            <CloudSun className="h-4 w-4" /> Weather
          </TabsTrigger>
        </TabsList>

        {/* ---------------- Itinerary ---------------- */}
        <TabsContent value="itinerary" className="space-y-6">
          <ItineraryGenerator
            tripId={id}
            defaultDestination={trip.cities[0]?.name || trip.title}
            hasExistingDays={trip.days.length > 0}
          />

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Daily schedule</h2>
            <form action={addDay.bind(null, id)}>
              <input type="hidden" name="city" value={trip.cities[0]?.name || ""} />
              <Button type="submit" variant="outline" size="sm">
                + Add empty day
              </Button>
            </form>
          </div>

          {trip.days.length === 0 ? (
            <EmptyState
              icon={<Plane className="h-7 w-7" />}
              title="No days planned yet"
              desc="Use the AI generator above or add days manually."
            />
          ) : (
            <div className="space-y-4">
              {trip.days.map((day) => (
                <Card key={day.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <div>
                      <CardTitle className="text-lg">
                        Day {day.dayNumber}
                        {day.city ? ` — ${day.city}` : ""}
                      </CardTitle>
                      {day.summary && (
                        <p className="text-sm text-muted-foreground">{day.summary}</p>
                      )}
                    </div>
                    <DeleteButton action={deleteDay.bind(null, id, day.id)} iconOnly />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {day.activities.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-start gap-3 rounded-md border bg-muted/30 p-3"
                      >
                        <span className="text-lg">{ACTIVITY_EMOJI[a.type]}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {a.time && (
                              <span className="font-mono text-sm text-muted-foreground">
                                {a.time}
                              </span>
                            )}
                            <span className="font-medium">{a.title}</span>
                            {a.cost > 0 && (
                              <Badge variant="outline">
                                {formatCurrency(a.cost, trip.currency)}
                              </Badge>
                            )}
                          </div>
                          {a.description && (
                            <p className="text-sm text-muted-foreground">
                              {a.description}
                            </p>
                          )}
                          {a.location && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                a.location
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <MapPin className="h-3 w-3" /> {a.location}
                            </a>
                          )}
                        </div>
                        <DeleteButton
                          action={deleteActivity.bind(null, id, a.id)}
                          iconOnly
                        />
                      </div>
                    ))}

                    {/* Add activity */}
                    <details className="rounded-md border border-dashed p-3">
                      <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                        + Add activity
                      </summary>
                      <form
                        action={addActivity.bind(null, id, day.id)}
                        className="mt-3 grid gap-2 sm:grid-cols-2"
                      >
                        <Input name="time" placeholder="09:00" />
                        <Select name="type" defaultValue="SIGHTSEEING">
                          {Object.keys(ACTIVITY_EMOJI).map((t) => (
                            <option key={t} value={t}>
                              {t.charAt(0) + t.slice(1).toLowerCase()}
                            </option>
                          ))}
                        </Select>
                        <Input
                          name="title"
                          placeholder="Activity title"
                          required
                          className="sm:col-span-2"
                        />
                        <Input name="location" placeholder="Location" />
                        <Input name="cost" type="number" min="0" placeholder="Cost" />
                        <Input
                          name="description"
                          placeholder="Notes"
                          className="sm:col-span-2"
                        />
                        <Button type="submit" size="sm" className="sm:col-span-2">
                          Add activity
                        </Button>
                      </form>
                    </details>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ---------------- Cities ---------------- */}
        <TabsContent value="cities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add a city</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={addCity.bind(null, id)} className="grid gap-3 sm:grid-cols-2">
                <Input name="name" placeholder="City name *" required />
                <Input name="country" placeholder="Country" />
                <div>
                  <Label>Arrival</Label>
                  <Input name="arrivalDate" type="date" />
                </div>
                <div>
                  <Label>Departure</Label>
                  <Input name="departureDate" type="date" />
                </div>
                <Textarea
                  name="notes"
                  placeholder="Notes about this stop"
                  className="sm:col-span-2"
                />
                <Button type="submit" className="sm:col-span-2 sm:w-auto">
                  Add city
                </Button>
              </form>
            </CardContent>
          </Card>

          {trip.cities.length === 0 ? (
            <EmptyState
              icon={<Globe className="h-7 w-7" />}
              title="No cities yet"
              desc="Add the destinations for your multi-city trip."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {trip.cities.map((c, i) => (
                <Card key={c.id}>
                  <CardContent className="flex items-start justify-between gap-3 pt-6">
                    <div>
                      <p className="font-semibold">
                        {i + 1}. {c.name}
                        {c.country ? `, ${c.country}` : ""}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {dateRange(c.arrivalDate, c.departureDate)}
                      </p>
                      {c.notes && <p className="mt-1 text-sm">{c.notes}</p>}
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${c.name} ${c.country || ""}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <MapPin className="h-3 w-3" /> View on map
                      </a>
                    </div>
                    <DeleteButton action={deleteCity.bind(null, id, c.id)} iconOnly />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ---------------- Budget ---------------- */}
        <TabsContent value="budget" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Spending by category</CardTitle>
              </CardHeader>
              <CardContent>
                {byCategory.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Add expenses to see the breakdown.
                  </p>
                ) : (
                  <ExpenseChart
                    data={byCategory}
                    budget={trip.budget}
                    spent={spent}
                    currency={trip.currency}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add expense</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={addExpense.bind(null, id)} className="grid gap-3">
                  <Input name="description" placeholder="Description *" required />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      name="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Amount *"
                      required
                    />
                    <Select name="category" defaultValue="Food">
                      {["Food", "Lodging", "Transport", "Activities", "Shopping", "Other"].map(
                        (c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        )
                      )}
                    </Select>
                  </div>
                  <Input name="date" type="date" />
                  <Button type="submit">Add expense</Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Expenses · {formatCurrency(spent, trip.currency)} spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trip.expenses.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No expenses logged yet.
                </p>
              ) : (
                <div className="divide-y">
                  {trip.expenses.map((e) => (
                    <div key={e.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="font-medium">{e.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {e.category} · {formatDate(e.date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {formatCurrency(e.amount, trip.currency)}
                        </span>
                        <DeleteButton
                          action={deleteExpense.bind(null, id, e.id)}
                          iconOnly
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Packing ---------------- */}
        <TabsContent value="packing" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Packing list</h2>
              <p className="text-sm text-muted-foreground">
                {packedCount} of {trip.packing.length} items packed
              </p>
            </div>
            <ActionRunner action={generatePackingList.bind(null, id)}>
              <Sparkles className="h-4 w-4" /> Auto-generate list
            </ActionRunner>
          </div>

          <Card>
            <CardContent className="pt-6">
              <form
                action={addPackingItem.bind(null, id)}
                className="grid gap-2 sm:grid-cols-[1fr_auto_auto]"
              >
                <Input name="name" placeholder="Item name *" required />
                <Input name="category" placeholder="Category" defaultValue="General" />
                <Button type="submit">Add</Button>
              </form>
            </CardContent>
          </Card>

          {trip.packing.length === 0 ? (
            <EmptyState
              icon={<Luggage className="h-7 w-7" />}
              title="Nothing packed yet"
              desc="Generate a smart packing list or add items manually."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(packingByCat).map(([cat, items]) => (
                <Card key={cat}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{cat}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <CheckToggle
                          checked={item.packed}
                          label={
                            item.quantity > 1 ? `${item.name} ×${item.quantity}` : item.name
                          }
                          action={togglePackingItem.bind(null, id, item.id)}
                        />
                        <DeleteButton
                          action={deletePackingItem.bind(null, id, item.id)}
                          iconOnly
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ---------------- Checklist ---------------- */}
        <TabsContent value="checklist" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Travel checklist</h2>
              <p className="text-sm text-muted-foreground">
                {doneCount} of {trip.checklist.length} done
              </p>
            </div>
            <ActionRunner action={generateChecklist.bind(null, id)}>
              <Sparkles className="h-4 w-4" /> Add standard checklist
            </ActionRunner>
          </div>

          <Card>
            <CardContent className="pt-6">
              <form
                action={addChecklistItem.bind(null, id)}
                className="grid gap-2 sm:grid-cols-[1fr_auto_auto]"
              >
                <Input name="text" placeholder="Task *" required />
                <Input name="dueDate" type="date" />
                <Button type="submit">Add</Button>
              </form>
            </CardContent>
          </Card>

          {trip.checklist.length === 0 ? (
            <EmptyState
              icon={<ListChecks className="h-7 w-7" />}
              title="No tasks yet"
              desc="Add the standard travel checklist to get started."
            />
          ) : (
            <Card>
              <CardContent className="divide-y pt-2">
                {trip.checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 py-2.5">
                    <CheckToggle
                      checked={item.done}
                      label={item.text}
                      action={toggleChecklistItem.bind(null, id, item.id)}
                    />
                    {item.dueDate && (
                      <span className="text-xs text-muted-foreground">
                        {formatDate(item.dueDate)}
                      </span>
                    )}
                    <DeleteButton
                      action={deleteChecklistItem.bind(null, id, item.id)}
                      iconOnly
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ---------------- Notes ---------------- */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Add a note (hotel, flight, activity or location)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action={addNote.bind(null, id)} className="grid gap-3 sm:grid-cols-2">
                <Select name="type" defaultValue="GENERAL">
                  {["GENERAL", "HOTEL", "FLIGHT", "ACTIVITY", "LOCATION"].map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0) + t.slice(1).toLowerCase()}
                    </option>
                  ))}
                </Select>
                <Input name="title" placeholder="Title *" required />
                <Input
                  name="location"
                  placeholder="Location (optional)"
                  className="sm:col-span-2"
                />
                <Textarea
                  name="content"
                  placeholder="Details — confirmation numbers, addresses, links…"
                  className="sm:col-span-2"
                />
                <Button type="submit" className="sm:w-auto">
                  Add note
                </Button>
              </form>
            </CardContent>
          </Card>

          {trip.notes.length === 0 ? (
            <EmptyState
              icon={<StickyNote className="h-7 w-7" />}
              title="No notes yet"
              desc="Save hotel bookings, flight details and location info here."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {trip.notes.map((n) => (
                <Card key={n.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{n.type.toLowerCase()}</Badge>
                        <p className="font-semibold">{n.title}</p>
                      </div>
                      <DeleteButton action={deleteNote.bind(null, id, n.id)} iconOnly />
                    </div>
                    {n.content && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                        {n.content}
                      </p>
                    )}
                    {n.location && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          n.location
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <MapPin className="h-3 w-3" /> {n.location}
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ---------------- Weather ---------------- */}
        <TabsContent value="weather" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CloudSun className="h-5 w-5 text-primary" /> Weather-ready suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {weatherTips(trip.cities[0]?.name || trip.title).map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {tip}
                  </li>
                ))}
              </ul>
              {trip.cities[0]?.name && (
                <a
                  href={`https://www.google.com/search?q=weather+${encodeURIComponent(
                    trip.cities[0].name
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}
                >
                  <ExternalLink className="h-4 w-4" /> Check live forecast
                </a>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "ok" | "danger";
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
          {icon}
        </div>
        <div>
          <p
            className={cn(
              "text-lg font-bold",
              tone === "danger" && "text-destructive"
            )}
          >
            {value}
          </p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
          {icon}
        </div>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
      </CardContent>
    </Card>
  );
}
