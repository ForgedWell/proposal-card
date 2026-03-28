import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/resend";

export async function executePanic(userId: string): Promise<void> {
  const now = new Date();

  // 1. Deactivate card
  const user = await db.user.update({
    where: { id: userId },
    data: { cardActive: false },
    select: { email: true, displayName: true },
  });

  // 2. Close all open proxy connections
  await db.proxyConnection.updateMany({
    where: { ownerId: userId, closedAt: null },
    data: { closedAt: now },
  });

  // 3. Send confirmation email
  if (user.email) {
    const html = `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h1 style="font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">
          Safety Lockdown Activated
        </h1>
        <p style="color: #475569; margin-bottom: 16px;">
          Hi${user.displayName ? ` ${user.displayName}` : ""}, your safety lockdown has been activated.
        </p>
        <ul style="color: #475569; line-height: 1.8;">
          <li>Your card is now <strong>hidden</strong> (deactivated)</li>
          <li>All active proxy connections have been <strong>closed</strong></li>
        </ul>
        <p style="color: #475569; margin-top: 16px;">
          You can reactivate your card at any time from your dashboard when you feel safe to do so.
        </p>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 24px;">
          If you need further assistance, reply to this email.
        </p>
      </div>
    `;
    await sendEmail(user.email, "Proposal Card — Safety lockdown activated", html).catch((err) =>
      console.error("[panic email]", err)
    );
  }
}
