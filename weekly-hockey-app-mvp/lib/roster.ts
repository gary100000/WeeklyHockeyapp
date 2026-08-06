import { prisma } from "./prisma";
import { sendSms } from "./sms";

export async function fillNextSub(gameId: number) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { availabilities: { include: { player: true } }, arena: true }
  });
  if (!game) throw new Error("Game not found");

  const confirmed = game.availabilities.filter(a => a.status === "Yes" || a.status === "AddedAsSub").length;
  const openSpots = Math.max(0, game.maximumPlayers - confirmed);

  if (openSpots === 0) {
    await prisma.game.update({ where: { id: gameId }, data: { status: "Full" } });
    return { status: "Full", openSpots: 0 };
  }

  const candidates = await prisma.substitute.findMany({
    where: { active: true, player: { active: true } },
    orderBy: { priority: "asc" },
    include: { player: true }
  });

  for (const sub of candidates) {
    const existing = game.availabilities.find(a => a.playerId === sub.playerId);
    if (existing) continue;

    const body = `🏒 A spot is available for hockey ${game.gameDate.toLocaleDateString()} at ${game.gameTime} at ${game.arena.name}.\n\nAre you available?\n\nReply YES or NO.`;

    try {
      const sms = await sendSms(sub.player.mobileNumber, body);

      await prisma.gameAvailability.create({
        data: {
          gameId,
          playerId: sub.playerId,
          playerType: "Substitute",
          status: "Waiting",
          contactedAt: new Date(),
          smsMessageId: sms.sid
        }
      });
      await prisma.smsMessage.create({
        data: { playerId: sub.playerId, gameId, direction: "Outgoing", message: body, providerId: sms.sid, status: sms.status }
      });
      await prisma.game.update({ where: { id: gameId }, data: { status: "FillingSubs" } });
      return { status: "Contacted", player: sub.player.firstName };
    } catch (err) {
      // This substitute couldn't be reached (invalid/unverified number, Twilio error, etc).
      // Log it and move on to the next candidate instead of failing the whole operation.
      console.error(`Failed to text substitute ${sub.player.firstName} ${sub.player.lastName} (${sub.player.mobileNumber}):`, err);
      continue;
    }
  }

  await prisma.game.update({ where: { id: gameId }, data: { status: "FillingSubs" } });
  return { status: "StillShort", openSpots };
}
