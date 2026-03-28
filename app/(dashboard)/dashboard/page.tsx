import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateSession } from "@/lib/auth/jwt";
import { getProfile } from "@/lib/profile/profile";
import { getPendingRequests } from "@/lib/connect/requests";
import { getApprovedConnections } from "@/lib/connect/messages";
import { getAnalytics } from "@/lib/profile/analytics";
import ProfileForm from "./ProfileForm";
import RequestsPanel from "./RequestsPanel";
import CardPanel from "./CardPanel";
import WaliPanel from "./WaliPanel";
import MessagesPanel from "./MessagesPanel";
import BlockedPanel from "./BlockedPanel";
import CardDesignerPanel from "./CardDesignerPanel";
import AnalyticsPanel from "./AnalyticsPanel";
import SafetyPanel from "./SafetyPanel";
import DashboardShell from "./DashboardShell";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) redirect("/login");

  const user = await validateSession(token);
  if (!user) redirect("/login");

  const [profile, pendingRequests, approvedConnections, analytics] = await Promise.all([
    getProfile(user.id),
    getPendingRequests(user.id),
    getApprovedConnections(user.id),
    getAnalytics(user.id),
  ]);

  if (!profile) redirect("/login");

  return (
    <DashboardShell
      email={profile.email ?? profile.phone ?? ""}
      pendingCount={pendingRequests.length}
      sections={{
        dashboard: (
          <div className="space-y-10">
            <AnalyticsPanel {...analytics} />
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
              <div className="xl:col-span-7 space-y-10">
                <CardDesignerPanel profile={profile} />
                <CardPanel profile={profile} />
              </div>
              <div className="xl:col-span-5 space-y-10">
                {pendingRequests.length > 0 && (
                  <RequestsPanel requests={pendingRequests} />
                )}
                {approvedConnections.length > 0 && (
                  <MessagesPanel
                    connections={approvedConnections as any}
                    currentUserId={user.id}
                  />
                )}
              </div>
            </div>
          </div>
        ),

        "card-designer": (
          <div className="space-y-10">
            <CardDesignerPanel profile={profile} />
            <CardPanel profile={profile} />
          </div>
        ),

        profile: (
          <ProfileForm profile={profile} />
        ),

        guardian: (
          <div className="space-y-10">
            <WaliPanel settings={{
              waliEmail:  profile.waliEmail  ?? null,
              waliPhone:  profile.waliPhone  ?? null,
              waliActive: profile.waliActive ?? false,
            }} />
            <BlockedPanel />
          </div>
        ),

        safety: (
          <SafetyPanel />
        ),
      }}
    />
  );
}
