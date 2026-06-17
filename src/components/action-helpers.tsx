"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DeleteButton({
  action,
  label = "Delete",
  confirm,
  iconOnly = false,
  className,
}: {
  action: () => Promise<void>;
  label?: string;
  confirm?: string;
  iconOnly?: boolean;
  className?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size={iconOnly ? "icon" : "sm"}
      disabled={pending}
      className={cn("text-muted-foreground hover:text-destructive", className)}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          try {
            await action();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Action failed");
          }
        });
      }}
    >
      <Trash2 className="h-4 w-4" />
      {!iconOnly && <span>{label}</span>}
    </Button>
  );
}

export function CheckToggle({
  checked,
  action,
  label,
  strikethrough = true,
}: {
  checked: boolean;
  action: (next: boolean) => Promise<void>;
  label: string;
  strikethrough?: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <label className="flex flex-1 cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        checked={checked}
        disabled={pending}
        className="h-4 w-4 accent-[hsl(var(--primary))]"
        onChange={(e) => {
          const next = e.target.checked;
          start(async () => {
            try {
              await action(next);
            } catch {
              toast.error("Could not update");
            }
          });
        }}
      />
      <span
        className={cn(
          "text-sm",
          checked && strikethrough && "text-muted-foreground line-through"
        )}
      >
        {label}
      </span>
    </label>
  );
}

export function ActionRunner({
  action,
  children,
  variant = "outline",
}: {
  action: () => Promise<void>;
  children: React.ReactNode;
  variant?: "default" | "outline" | "secondary";
}) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant={variant}
      disabled={pending}
      onClick={() =>
        start(async () => {
          try {
            await action();
            toast.success("Done");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Action failed");
          }
        })
      }
    >
      {children}
    </Button>
  );
}
