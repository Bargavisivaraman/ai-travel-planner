import Link from "next/link";
import {
  Sparkles,
  Map,
  Wallet,
  ListChecks,
  Luggage,
  CloudSun,
  Share2,
  Globe,
} from "lucide-react";
import { auth } from "@/auth";
import { Navbar } from "@/components/navbar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: Sparkles, title: "AI itinerary generator", desc: "Describe your trip and get a day-by-day plan in seconds." },
  { icon: Globe, title: "Multi-city trips", desc: "Chain destinations together with arrival and departure dates." },
  { icon: Wallet, title: "Budget & expenses", desc: "Set a budget and track spending by category in real time." },
  { icon: Luggage, title: "Smart packing lists", desc: "Auto-generated packing lists tuned to your trip length and season." },
  { icon: ListChecks, title: "Travel checklist", desc: "Never forget visas, insurance or bookings again." },
  { icon: CloudSun, title: "Weather-ready tips", desc: "Practical suggestions so you pack for the conditions." },
  { icon: Map, title: "Map & location notes", desc: "Save hotels, flights and places with quick map links." },
  { icon: Share2, title: "Shareable itineraries", desc: "Publish a public page and share your plan with anyone." },
];

export default async function HomePage() {
  const session = await auth();

  return (
    <>
      <Navbar />
      <main>
        <section className="gradient-hero">
          <div className="container flex flex-col items-center py-20 text-center sm:py-28">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/60 px-4 py-1.5 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              AI-powered trip planning
            </span>
            <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
              Plan unforgettable trips in{" "}
              <span className="text-primary">minutes</span>, not weeks
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              Wanderlust generates complete, customizable itineraries with
              budgets, packing lists, checklists and expense tracking — all in
              one place. Save, edit and share your perfect trip.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={session?.user ? "/dashboard" : "/register"}
                className={cn(buttonVariants({ size: "lg" }))}
              >
                {session?.user ? "Go to dashboard" : "Start planning free"}
              </Link>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                Try the demo account
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Demo login — <code className="font-mono">demo@wanderlust.app</code> /{" "}
              <code className="font-mono">demo1234</code>
            </p>
          </div>
        </section>

        <section className="container py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Everything you need for the perfect trip
            </h2>
            <p className="mt-3 text-muted-foreground">
              From the first spark of an idea to the day you fly home.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <Card key={f.title} className="transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="container pb-24">
          <div className="rounded-2xl border bg-card p-10 text-center shadow-sm">
            <h2 className="text-3xl font-bold">Ready to plan your next adventure?</h2>
            <p className="mt-3 text-muted-foreground">
              Create a free account and generate your first itinerary today.
            </p>
            <Link
              href={session?.user ? "/trips/new" : "/register"}
              className={cn(buttonVariants({ size: "lg" }), "mt-6")}
            >
              {session?.user ? "Create a trip" : "Get started — it's free"}
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          Wanderlust — AI Travel Planner. Built with Next.js, Prisma & PostgreSQL.
        </div>
      </footer>
    </>
  );
}
