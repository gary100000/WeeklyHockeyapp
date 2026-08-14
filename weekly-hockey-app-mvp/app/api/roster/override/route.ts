import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fillNextSub } from "@/lib/roster";

const schema = z.object({
  gameId: z.coerce.number().int(),
  playerId: z.coerce.number().int(),
  status: z.enum(["Waiting", "Yes", "No", "AddedAsSub", "Removed"]),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
  const { gameId, playerId, status } = parsed.data;

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  try {
    await prisma.gameAvailability.upsert({
      where: { gameId_playerId: { gameId, playerId } },
      update: { status, responseTime: new Date() },
      create: { gameId, playerId, playerType: player.playerType, status, responseTime: new Date() },
    });

    // A manual override triggers the same automation an SMS reply would — e.g.
    // overriding someone to No can immediately open a substitute spot, exactly
    // as if they'd texted back No themselves.
    await fillNextSub(gameId);
  } catch (err) {
    console.error(`Failed to override roster status for player ${playerId} on game ${gameId}:`, err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
