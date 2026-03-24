import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

// ─── OTP email ────────────────────────────────────────────────────────────────

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Your Proposal Card code: ${code}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h1 style="font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">
          Sign in to Proposal Card
        </h1>
        <p style="color: #475569; margin-bottom: 32px;">
          Enter this code to continue. It expires in 10 minutes.
        </p>
        <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
          <span style="font-size: 40px; font-weight: 800; letter-spacing: 8px; color: #0ea5e9;">
            ${code}
          </span>
        </div>
        <p style="color: #94a3b8; font-size: 14px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("[Resend] Failed to send OTP email:", error);
    throw new Error("Failed to send verification email");
  }
}

// ─── Generic transactional email ──────────────────────────────────────────────

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) {
    console.error("[Resend] Failed to send email:", error);
    throw new Error("Failed to send email");
  }
}
