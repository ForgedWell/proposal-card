import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID!;

export async function sendPhoneOtp(phoneNumber: string): Promise<void> {
  await client.verify.v2.services(SERVICE_SID).verifications.create({
    to: phoneNumber,
    channel: "sms",
  });
}

export async function verifyPhoneOtp(
  phoneNumber: string,
  code: string
): Promise<boolean> {
  const result = await client.verify.v2
    .services(SERVICE_SID)
    .verificationChecks.create({ to: phoneNumber, code });

  return result.status === "approved";
}
