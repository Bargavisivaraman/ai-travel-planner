"use client";

import { useState, useTransition } from "react";
import { Share2, Copy, Check, Globe, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleTripPublic } from "@/lib/actions";

export function ShareToggle({
  tripId,
  slug,
  isPublic,
}: {
  tripId: string;
  slug: string;
  isPublic: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
  const [pub, setPub] = useState(isPublic);

  const url =
    typeof window !== "undefined" ? `${window.location.origin}/share/${slug}` : "";

  function toggle() {
    const next = !pub;
    setPub(next);
    start(async () => {
      try {
        await toggleTripPublic(tripId, next);
        toast.success(next ? "Itinerary is now public" : "Itinerary is now private");
      } catch {
        setPub(!next);
        toast.error("Could not update");
      }
    });
  }

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)}>
        <Share2 className="h-4 w-4" /> Share
      </Button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg">
          <button
            type="button"
            onClick={toggle}
            disabled={pending}
            className="flex w-full items-center justify-between rounded-md border p-3 text-left text-sm hover:bg-accent"
          >
            <span className="flex items-center gap-2">
              {pub ? (
                <Globe className="h-4 w-4 text-primary" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              {pub ? "Public — anyone with the link" : "Private — only you"}
            </span>
            <span
              className={`h-5 w-9 rounded-full p-0.5 transition-colors ${
                pub ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                  pub ? "translate-x-4" : ""
                }`}
              />
            </span>
          </button>
          {pub && (
            <div className="mt-3 flex items-center gap-2">
              <input
                readOnly
                value={url}
                className="flex-1 truncate rounded-md border bg-muted px-2 py-1.5 text-xs"
              />
              <Button size="icon" variant="outline" onClick={copy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
