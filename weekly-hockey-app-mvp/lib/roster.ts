import { prisma } from "./prisma";
import { sendSms } from "./sms";

type SubCandidate = {
  playerId: number;
  priority: number;
  player: { id: number; firstName: string; lastName: string; mobileNumber: string };
};

async function contactCandidate(
  candidates: SubCandidate[],
  gameId: number,
  gameDateText: string,
  gameTime: string,
  arenaName: string
) {
  for (const sub of candidates) {
    const body = `🏒 A spot is available for hockey ${gameDateText} at ${gameTime} at ${arenaName}.\n\nAre you available?\n\nReply YES or NO.`;

    try {
      const sms = await sendSms(sub.player.mobileNumber, body);

      await prisma.gameAvailability.create({
        data: {
          gameId,
          playerId: sub.playerId,
          playerType: "Substitute",
          status: "Waiting",
          contactedAt: new Date(),
          smsMessageId: sms.sid,
        },
      });
      await prisma.smsMessage.create({
        data: { playerId: sub.playerId, gameId, direction: "Outgoing", message: body, providerId: sms.sid, status: sms.status },
      });
      return { player: sub.player.firstName };
    } catch (err) {
      // This substitute couldn't be reached (invalid/unverified number, Twilio error, etc).
      // Log it and move on to the next candidate instead of failing the whole operation.
      console.error(`Failed to text substitute ${sub.player.firstName} ${sub.player.lastName} (${sub.player.mobileNumber}):`, err);
      continue;
    }
  }
  return null;
}

type Position = "Goalie" | "Defence" | "Forward";

/**
 * Re-checks the current roster against the game's per-position targets and, if a
 * position is short, texts the next available substitute for that exact position —
 * a departing defenceman is only ever backfilled by a substitute defenceman, etc.
 * Safe to call after any status change: it's a no-op (and marks the game Full) once
 * every position is covered.
 */
export async function fillNextSub(gameId: number) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { availabilities: { include: { player: true } }, arena: true },
  });
  if (!game) throw new Error("Game not found");

  const confirmed = game.availabilities.filter((a) => a.status === "Yes" || a.status === "AddedAsSub");

  const countFor = (position: Position) => confirmed.filter((a) => a.player.position === position).length;

  const openSpots: Record<Position, number> = {
    Goalie: Math.max(0, game.goalieRequirement - countFor("Goalie")),
    Defence: Math.max(0, game.defenceRequirement - countFor("Defence")),
    Forward: Math.max(0, game.forwardRequirement - countFor("Forward")),
  };

  const totalOpen = openSpots.Goalie + openSpots.Defence + openSpots.Forward;

  if (totalOpen === 0) {
    await prisma.game.update({ where: { id: gameId }, data: { status: "Full" } });
    return { status: "Full" as const, openSpots };
  }

  const alreadyInvolvedIds = new Set(game.availabilities.map((a) => a.playerId));
  const gameDateText = game.gameDate.toLocaleDateString();

  // Goalie spots take priority — a game with no goalie is a bigger problem than
  // being one skater short. Between Defence and Forward, whichever is checked
  // first here just breaks ties when both happen to be short in the same call.
  for (const position of ["Goalie", "Defence", "Forward"] as Position[]) {
    if (openSpots[position] === 0) continue;

    const candidates = await prisma.substitute.findMany({
      where: { active: true, player: { active: true, position } },
      orderBy: { priority: "asc" },
      include: { player: true },
    });
    const available = candidates.filter((s) => !alreadyInvolvedIds.has(s.playerId));

    const result = await contactCandidate(available, gameId, gameDateText, game.gameTime, game.arena.name);
    if (result) {
      await prisma.game.update({ where: { id: gameId }, data: { status: "FillingSubs" } });
      return { status: "Contacted" as const, ...result, position };
    }
  }

  await prisma.game.update({ where: { id: gameId }, data: { status: "FillingSubs" } });
  return { status: "StillShort" as const, openSpots };
}
