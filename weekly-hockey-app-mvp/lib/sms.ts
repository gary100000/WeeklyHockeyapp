import twilio from "twilio";

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export type PlayerCountry = "US" | "CA";

function fromNumberFor(country: PlayerCountry): string {
  const number =
    country === "US" ? process.env.TWILIO_PHONE_NUMBER_US : process.env.TWILIO_PHONE_NUMBER_CA;
  if (!number) {
    throw new Error(
      `Missing Twilio number env var for country "${country}" (expected TWILIO_PHONE_NUMBER_${country})`
    );
  }
  return number;
}

export async function sendSms(to: string, body: string, country: PlayerCountry) {
  const result = await client.messages.create({
    body,
    from: fromNumberFor(country),
    to,
  });
  return result;
}
