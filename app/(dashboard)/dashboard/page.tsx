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
import MessagesTab from "./MessagesTab";
import BlockedPanel from "./BlockedPanel";
import CardDesignerPanel from "./CardDesignerPanel";
import AnalyticsPanel from "./AnalyticsPanel";
import SafetyPanel from "./SafetyPanel";
import DashboardShell from "./DashboardShell";
import Card3DPreview from "@/components/Card3DPreview";
import { DEFAULT_CARD_COLOR } from "@/lib/card/templates";
import OrderCardsWidget from "./OrderCardsWidget";
import RecentActivityWidget from "./RecentActivityWidget";

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
  if (profile.role === "wali") redirect("/wali");
  if (!profile.onboardingComplete) redirect("/onboarding");
  if (!profile.profileSetupComplete) redirect("/setup");

  return (
    <DashboardShell
      email={profile.email ?? profile.phone ?? ""}
      pendingCount={pendingRequests.length}
      gender={(profile as any).gender}
      sections={{
        dashboard: (
          <div className="space-y-10">
            <AnalyticsPanel {...analytics} />
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
              <div className="xl:col-span-7 space-y-10">
                {/* Read-only card preview */}
                <div className="bg-sanctuary-surface-lowest rounded-xl p-8 space-y-6">
                  <h3 className="font-serif text-xl text-sanctuary-on-surface">Your Card</h3>
                  <Card3DPreview
                    displayName={profile.displayName ?? "Your Name"}
                    location={profile.location ?? null}
                    bio={profile.bio ?? null}
                    color={(profile as any).cardColor ?? DEFAULT_CARD_COLOR}
                    waliActive={profile.waliActive}
                  />
                </div>
                <CardPanel profile={profile} />
              </div>
              <div className="xl:col-span-5 space-y-10">
                <OrderCardsWidget />
                <RecentActivityWidget />
                {pendingRequests.length > 0 && (
                  <RequestsPanel requests={pendingRequests} />
                )}
              </div>
            </div>
          </div>
        ),

        "card-designer": (
          <CardDesignerPanel profile={profile} />
        ),

        profile: (
          <ProfileForm profile={profile} />
        ),

        messages: (
          <MessagesTab
            connections={approvedConnections as any}
            currentUserId={user.id}
            waliActive={profile.waliActive ?? false}
          />
        ),

        guardian: (
          <div className="space-y-10">
            <WaliPanel
              settings={{
                waliEmail:  profile.waliEmail  ?? null,
                waliPhone:  profile.waliPhone  ?? null,
                waliActive: profile.waliActive ?? false,
              }}
              gender={(profile as any).gender}
            />
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
