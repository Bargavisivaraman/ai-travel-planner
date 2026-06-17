import Link from "next/link";
import { Plane } from "lucide-react";
import { auth, signOut } from "@/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { initials, cn } from "@/lib/utils";

export async function Navbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Plane className="h-5 w-5" />
          </span>
          Wanderlust
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {user ? (
            <>
              <Link href="/dashboard" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                Dashboard
              </Link>
              <Link
                href="/favorites"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}
              >
                Favorites
              </Link>
              {user.role === "ADMIN" && (
                <Link href="/admin" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                  Admin
                </Link>
              )}
              <ModeToggle />
              <span
                title={user.email ?? ""}
                className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-xs font-semibold"
              >
                {initials(user.name, user.email)}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button variant="outline" size="sm" type="submit">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
              <ModeToggle />
              <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                Log in
              </Link>
              <Link href="/register" className={cn(buttonVariants({ size: "sm" }))}>
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
