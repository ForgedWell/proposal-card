import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateSession } from "@/lib/auth/jwt";
import { db } from "@/lib/db";
import { getWardsForWali, getWaliConnections } from "@/lib/wali/wali";
import WaliDashboard from "./WaliDashboard";

export default async function WaliPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) redirect("/login");

  const user = await validateSession(token);
  if (!user) redirect("/login");

  const profile = await db.user.findUnique({
    where: { id: user.id },
    select: { role: true, waliFor: true, displayName: true, email: true },
  });

  if (!profile || profile.role !== "wali") redirect("/dashboard");

  const wards = await getWardsForWali(user.id);
  const wardIds = wards.map(w => w.id);
  const connections = await getWaliConnections(wardIds);

  return (
    <WaliDashboard
      waliName={profile.displayName ?? profile.email ?? "Guardian"}
      wards={wards as any}
      connections={connections as any}
    />
  );
}
