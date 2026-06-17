import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center gradient-hero p-4 text-center">
      <div>
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <Compass className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-bold">Lost your way?</h1>
        <p className="mt-2 text-muted-foreground">
          This page could not be found, or you don&apos;t have access to it.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
