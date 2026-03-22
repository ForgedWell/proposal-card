import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateSession } from "@/lib/auth/jwt";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) redirect("/login");

  const user = await validateSession(token);
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center">
              <span className="text-white text-lg font-bold">
                {(user.email ?? user.phone ?? "U")[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                {user.email ?? user.phone}
              </p>
              <p className="text-sm text-slate-500">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="bg-brand-50 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-brand-800">🎉 Phase 1 Complete</p>
            <p className="text-sm text-brand-600 mt-0.5">
              Auth is working. User ID: <code className="font-mono">{user.id}</code>
            </p>
          </div>

          <p className="text-slate-500 text-sm mb-6">
            Your Proposal Card dashboard is coming in Phase 2 — profile builder, QR code, and shareable link.
          </p>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="text-sm text-slate-500 hover:text-red-500 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
