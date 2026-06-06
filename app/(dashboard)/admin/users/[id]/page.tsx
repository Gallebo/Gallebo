import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusPill } from "@/components/admin/admin-status-pill";
import { AdminUserActions } from "@/components/admin/admin-user-actions";
import { getAdminUserDetail } from "@/lib/admin/queries";
import { privatePageRobots } from "@/lib/seo/site";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAdminUserDetail(id);
  return {
    title: user ? `${user.name} — Users — Admin` : "User — Admin",
    robots: privatePageRobots,
  };
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAdminUserDetail(id);

  if (!user) notFound();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="User management"
        title={user.name}
        description={user.email}
        trailing={
          <Link
            href="/admin/users"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            ← Back to users
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              Profile
              <AdminStatusPill variant={user.roleVariant}>{user.role}</AdminStatusPill>
              <AdminStatusPill
                variant={
                  user.statusVariant === "kyc"
                    ? "kyc"
                    : user.statusVariant === "scheduled"
                      ? "scheduled"
                      : "completed"
                }
              >
                {user.status}
              </AdminStatusPill>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <dl className="grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">User ID</dt>
                <dd className="font-mono text-xs">{user.id}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Joined</dt>
                <dd>{user.joinedLabel}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Last updated</dt>
                <dd>{user.updatedLabel}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Flights (as pilot)</dt>
                <dd>{user.flightsCount}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Bookings (as passenger)</dt>
                <dd>{user.bookingsCount}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admin actions</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminUserActions
              userId={user.id}
              rawRole={user.rawRole}
              rawStatus={user.rawStatus}
              openVerificationId={user.openVerificationId}
              isAdmin={user.isAdmin}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verification history</CardTitle>
        </CardHeader>
        <CardContent>
          {user.verificationHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No verification requests on record.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Submitted</th>
                    <th className="pb-2 pr-4 font-medium">Role</th>
                    <th className="pb-2 pr-4 font-medium">Didit KYC</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {user.verificationHistory.map((vr) => (
                    <tr key={vr.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">{vr.createdLabel}</td>
                      <td className="py-3 pr-4 uppercase">{vr.requestedRole}</td>
                      <td className="py-3 pr-4">
                        <span>{vr.diditStatusLabel}</span>
                        {vr.autoApproved ? (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (auto)
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4">
                        {vr.isOpen ? (
                          <AdminStatusPill variant="kyc">Open</AdminStatusPill>
                        ) : vr.rejectionReason ? (
                          <span className="text-destructive">Rejected</span>
                        ) : (
                          <AdminStatusPill variant="completed">Reviewed</AdminStatusPill>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/admin/verifications/${vr.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
