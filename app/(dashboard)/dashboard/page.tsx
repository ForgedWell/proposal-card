import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateSession } from "@/lib/auth/jwt";
import { getProfile } from "@/lib/profile/profile";
import { getPendingRequests } from "@/lib/connect/requests";
import ProfileForm from "./ProfileForm";
import RequestsPanel from "./RequestsPanel";
import CardPanel from "./CardPanel";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) redirect("/login");

  const user = await validateSession(token);
  if (!user) redirect("/login");

  const [profile, pendingRequests] = await Promise.all([
    getProfile(user.id),
    getPendingRequests(user.id),
  ]);

  if (!profile) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <nav className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">P</span>
          </div>
          <span className="font-semibold text-slate-900 text-sm">Proposal Card</span>
        </div>
        <div className="flex items-center gap-3">
          {pendingRequests.length > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {pendingRequests.length}
            </span>
          )}
          <span className="text-sm text-slate-500">{profile.email ?? profile.phone}</span>
          <form action="/api/auth/logout" method="POST">
            <button className="text-xs text-slate-400 hover:text-red-500 transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Card status + QR */}
        <CardPanel profile={profile} />

        {/* Pending requests */}
        {pendingRequests.length > 0 && (
          <RequestsPanel requests={pendingRequests} />
        )}

        {/* Profile form */}
        <ProfileForm profile={profile} />
      </main>
    </div>
  );
}
