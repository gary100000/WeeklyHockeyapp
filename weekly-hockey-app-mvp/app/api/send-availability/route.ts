import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";
import { CURRENT_GAME_WHERE } from "@/lib/currentGame";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const game = await prisma.game.findFirst({ where: CURRENT_GAME_WHERE, orderBy: { createdAt: "desc" }, include: { arena: true } });
  if (!game) return NextResponse.json({ error: "No game" }, { status: 404 });

  const players = await prisma.player.findMany({ where: { active: true, playerType: "Regular" } });

  let sent = 0;
  const failed: string[] = [];

  for (const player of players) {
    const body = `Hockey ${game.gameDate.toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })} at ${game.gameTime} at ${game.arena.name}.\n\nAre you playing?\n\nReply YES or NO.`;

    try {
      const sms = await sendSms(player.mobileNumber, body, player.country);
      await prisma.gameAvailability.upsert({
        where: { gameId_playerId: { gameId: game.id, playerId: player.id } },
        update: { status: "Waiting", smsMessageId: sms.sid, contactedAt: new Date() },
        create: { gameId: game.id, playerId: player.id, playerType: "Regular", status: "Waiting", smsMessageId: sms.sid, contactedAt: new Date() },
      });
      await prisma.smsMessage.create({
        data: { playerId: player.id, gameId: game.id, direction: "Outgoing", message: body, providerId: sms.sid, status: sms.status },
      });
      sent++;
    } catch (err) {
      console.error(`Failed to text ${player.firstName} ${player.lastName} (${player.mobileNumber}):`, err);
      failed.push(`${player.firstName} ${player.lastName}`);
    }
  }

  await prisma.game.update({ where: { id: game.id }, data: { status: "AvailabilityOpen" } });

  const url = new URL("/", req.url);
  if (failed.length > 0) {
    url.searchParams.set("smsError", `${failed.length} message(s) failed: ${failed.join(", ")}`);
  } else {
    url.searchParams.set("smsSent", String(sent));
  }
  return NextResponse.redirect(url);
}
