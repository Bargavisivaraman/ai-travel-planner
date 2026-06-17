import { Shield, Users, Plane, Globe } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { adminDeleteUser, adminSetRole } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteButton, ActionRunner } from "@/components/action-helpers";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await requireAdmin();

  const [users, tripCount, publicCount] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { trips: true } } },
    }),
    prisma.trip.count(),
    prisma.trip.count({ where: { isPublic: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Shield className="h-7 w-7 text-primary" /> Admin dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage users and monitor platform activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={<Users className="h-5 w-5" />} label="Users" value={users.length} />
        <Stat icon={<Plane className="h-5 w-5" />} label="Trips" value={tripCount} />
        <Stat icon={<Globe className="h-5 w-5" />} label="Public itineraries" value={publicCount} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium">Role</th>
                  <th className="py-2 pr-4 font-medium">Trips</th>
                  <th className="py-2 pr-4 font-medium">Joined</th>
                  <th className="py-2 pr-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{u.name || "—"}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{u.email}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                        {u.role.toLowerCase()}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">{u._count.trips}</td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1">
                        <ActionRunner
                          variant="secondary"
                          action={adminSetRole.bind(
                            null,
                            u.id,
                            u.role === "ADMIN" ? "USER" : "ADMIN"
                          )}
                        >
                          {u.role === "ADMIN" ? "Demote" : "Promote"}
                        </ActionRunner>
                        {u.id !== admin.id && (
                          <DeleteButton
                            action={adminDeleteUser.bind(null, u.id)}
                            iconOnly
                            confirm={`Delete ${u.email} and all their trips?`}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-accent text-accent-foreground">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
