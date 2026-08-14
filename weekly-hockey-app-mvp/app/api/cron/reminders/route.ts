import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";
import { fillNextSub } from "@/lib/roster";
import { combineDateAndTime } from "@/lib/gameTime";
import { CURRENT_GAME_WHERE } from "@/lib/currentGame";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const game = await prisma.game.findFirst({
    where: CURRENT_GAME_WHERE,
    orderBy: { createdAt: "desc" },
    include: { arena: true, availabilities: { include: { player: true } } },
  });

  if (!game) {
    return NextResponse.json({ ok: true, message: "No active game" });
  }

  const gameDateTime = combineDateAndTime(game.gameDate, game.gameTime);
  const hoursUntilGame = (gameDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

  const results: string[] = [];

  // Deadline takes priority over reminder if both would apply in the same run —
  // once the deadline has passed, sending a "please respond" reminder afterward
  // doesn't make sense.
  if (hoursUntilGame > 0 && hoursUntilGame <= game.responseDeadlineHours && game.finalDeadlineTreatNo) {
    const stillWaiting = await prisma.gameAvailability.findMany({
      where: { gameId: game.id, status: "Waiting" },
    });

    if (stillWaiting.length > 0) {
      // No SMS goes out for this — it's a silent status change only.
      await prisma.gameAvailability.updateMany({
        where: { gameId: game.id, status: "Waiting" },
        data: { status: "No", responseTime: new Date() },
      });
      results.push(`Marked ${stillWaiting.length} non-responder(s) as No (deadline passed)`);

      // A batch of new "No"s may open up spots that need backfilling.
      await fillNextSub(game.id);
    }
  } else if (hoursUntilGame > 0 && hoursUntilGame <= game.reminderHours && !game.reminderSentAt) {
    const waiting = game.availabilities.filter((a) => a.status === "Waiting");
    const body = `Reminder: still need your answer for hockey ${game.gameDate.toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })} at ${game.gameTime} at ${game.arena.name}.\n\nReply YES or NO.`;

    for (const a of waiting) {
      try {
        await sendSms(a.player.mobileNumber, body, a.player.country);
        results.push(`Reminded ${a.player.firstName} ${a.player.lastName}`);
      } catch (err) {
        console.error(`Failed to send reminder to ${a.player.firstName} ${a.player.lastName}:`, err);
        results.push(`FAILED to remind ${a.player.firstName} ${a.player.lastName}`);
      }
    }

    // Mark as sent even if the game has zero waiting players, so we don't
    // re-check every day for a game that's already fully responded to.
    await prisma.game.update({ where: { id: game.id }, data: { reminderSentAt: new Date() } });
  }

  return NextResponse.json({ ok: true, hoursUntilGame: Math.round(hoursUntilGame), results });
}
