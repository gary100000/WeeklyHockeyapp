import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";

const schema = z.object({
  playerIds: z.array(z.coerce.number().int()).min(1, "Select at least one recipient."),
  message: z.string().trim().min(1, "Message can't be empty.").max(1600, "Message is too long."),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid data" },
      { status: 400 }
    );
  }
  const { playerIds, message } = parsed.data;

  const players = await prisma.player.findMany({ where: { id: { in: playerIds }, active: true } });

  let sent = 0;
  const failed: string[] = [];

  for (const player of players) {
    try {
      const sms = await sendSms(player.mobileNumber, message, player.country);
      await prisma.smsMessage.create({
        data: {
          playerId: player.id,
          direction: "Outgoing",
          message,
          providerId: sms.sid,
          status: sms.status,
        },
      });
      sent++;
    } catch (err) {
      console.error(`Failed to send custom message to ${player.firstName} ${player.lastName} (${player.mobileNumber}):`, err);
      failed.push(`${player.firstName} ${player.lastName}`);
    }
  }

  return NextResponse.json({ ok: true, sent, failed });
}
