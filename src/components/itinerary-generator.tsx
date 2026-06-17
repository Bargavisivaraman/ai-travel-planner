"use client";

import { useState, useTransition } from "react";
import { Sparkles, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { saveGeneratedItinerary } from "@/lib/actions";
import type { GeneratedItinerary } from "@/lib/ai";

export function ItineraryGenerator({
  tripId,
  defaultDestination,
  hasExistingDays,
}: {
  tripId: string;
  defaultDestination: string;
  hasExistingDays: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedItinerary | null>(null);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    destination: defaultDestination,
    days: 3,
    interests: "",
    pace: "balanced",
    budgetLevel: "mid",
  });

  async function generate() {
    if (!form.destination.trim()) {
      toast.error("Enter a destination");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Generation failed");
        return;
      }
      setResult(data);
      toast.success(
        data.source === "openai"
          ? "Itinerary generated with AI"
          : "Itinerary generated"
      );
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  function save(replace: boolean) {
    if (!result) return;
    startTransition(async () => {
      try {
        await saveGeneratedItinerary(tripId, result, replace);
        toast.success("Itinerary saved to your trip");
        setResult(null);
      } catch {
        toast.error("Could not save itinerary");
      }
    });
  }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" /> AI itinerary generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Destination</Label>
            <Input
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              placeholder="Tokyo, Japan"
            />
          </div>
          <div>
            <Label>Number of days</Label>
            <Input
              type="number"
              min={1}
              max={21}
              value={form.days}
              onChange={(e) =>
                setForm({ ...form, days: Number(e.target.value) || 1 })
              }
            />
          </div>
          <div>
            <Label>Pace</Label>
            <Select
              value={form.pace}
              onChange={(e) => setForm({ ...form, pace: e.target.value })}
            >
              <option value="relaxed">Relaxed</option>
              <option value="balanced">Balanced</option>
              <option value="packed">Packed</option>
            </Select>
          </div>
          <div>
            <Label>Budget level</Label>
            <Select
              value={form.budgetLevel}
              onChange={(e) => setForm({ ...form, budgetLevel: e.target.value })}
            >
              <option value="budget">Budget</option>
              <option value="mid">Mid-range</option>
              <option value="luxury">Luxury</option>
            </Select>
          </div>
        </div>
        <div>
          <Label>Interests (optional)</Label>
          <Input
            value={form.interests}
            onChange={(e) => setForm({ ...form, interests: e.target.value })}
            placeholder="food, museums, hiking, nightlife"
          />
        </div>
        <Button onClick={generate} disabled={loading} className="w-full sm:w-auto">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Generate itinerary
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-4 rounded-lg border bg-muted/40 p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">
                Preview · {result.days.length} days for {result.destination}
              </p>
              <Badge variant={result.source === "openai" ? "default" : "secondary"}>
                {result.source === "openai" ? "OpenAI" : "Smart engine"}
              </Badge>
            </div>
            <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
              {result.days.map((d) => (
                <div key={d.dayNumber} className="rounded-md border bg-background p-3">
                  <p className="font-medium">
                    Day {d.dayNumber} — {d.city}
                  </p>
                  <p className="mb-2 text-sm text-muted-foreground">{d.summary}</p>
                  <ul className="space-y-1 text-sm">
                    {d.activities.map((a, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="font-mono text-muted-foreground">
                          {a.time}
                        </span>
                        <span>{a.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => save(false)} disabled={pending}>
                <Check className="h-4 w-4" /> Add to trip
              </Button>
              {hasExistingDays && (
                <Button
                  variant="outline"
                  onClick={() => save(true)}
                  disabled={pending}
                >
                  Replace existing days
                </Button>
              )}
              <Button variant="ghost" onClick={() => setResult(null)}>
                Discard
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
