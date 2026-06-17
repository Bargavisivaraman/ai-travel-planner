"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

type Trip = {
  title: string;
  description: string | null;
  coverImage: string | null;
  startDate: Date | string | null;
  endDate: Date | string | null;
  budget: number;
  currency: string;
  travelers: number;
  status: string;
  isPublic: boolean;
};

function toDateInput(value: Date | string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function TripForm({
  action,
  trip,
  submitLabel = "Save trip",
}: {
  action: (formData: FormData) => void;
  trip?: Trip;
  submitLabel?: string;
}) {
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      action={action}
      onSubmit={() => setSubmitting(true)}
      className="space-y-5"
    >
      <div>
        <Label htmlFor="title">Trip title *</Label>
        <Input
          id="title"
          name="title"
          placeholder="Summer in Italy"
          defaultValue={trip?.title}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="What's this trip about?"
          defaultValue={trip?.description ?? ""}
        />
      </div>

      <div>
        <Label htmlFor="coverImage">Cover image URL</Label>
        <Input
          id="coverImage"
          name="coverImage"
          type="url"
          placeholder="https://images.unsplash.com/..."
          defaultValue={trip?.coverImage ?? ""}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="startDate">Start date</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={toDateInput(trip?.startDate ?? null)}
          />
        </div>
        <div>
          <Label htmlFor="endDate">End date</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={toDateInput(trip?.endDate ?? null)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="budget">Budget</Label>
          <Input
            id="budget"
            name="budget"
            type="number"
            min="0"
            step="50"
            defaultValue={trip?.budget ?? 1000}
          />
        </div>
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select id="currency" name="currency" defaultValue={trip?.currency ?? "USD"}>
            {["USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="travelers">Travelers</Label>
          <Input
            id="travelers"
            name="travelers"
            type="number"
            min="1"
            defaultValue={trip?.travelers ?? 1}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={trip?.status ?? "PLANNING"}>
            <option value="PLANNING">Planning</option>
            <option value="BOOKED">Booked</option>
            <option value="COMPLETED">Completed</option>
          </Select>
        </div>
        <div className="flex items-end">
          <Card className="w-full">
            <CardContent className="flex items-center gap-3 py-3">
              <input
                id="isPublic"
                name="isPublic"
                type="checkbox"
                defaultChecked={trip?.isPublic}
                className="h-4 w-4 accent-[hsl(var(--primary))]"
              />
              <Label htmlFor="isPublic" className="mb-0 cursor-pointer">
                Make itinerary public & shareable
              </Label>
            </CardContent>
          </Card>
        </div>
      </div>

      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
