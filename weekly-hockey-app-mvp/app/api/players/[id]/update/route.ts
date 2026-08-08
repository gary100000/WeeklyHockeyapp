import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const playerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  mobileNumber: z.string().regex(/^\+[1-9]\d{6,14}$/, "Use E.164 format, e.g. +15195551234"),
  playerType: z.enum(["Regular", "Substitute"]),
  position: z.enum(["Forward", "Defence", "Goalie"]),
  country: z.enum(["US", "CA"]),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const playerId = Number(id);

  const form = await req.formData();
  const parsed = playerSchema.safeParse({
    firstName: form.get("firstName"),
    lastName: form.get("lastName"),
    mobileNumber: form.get("mobileNumber"),
    playerType: form.get("playerType"),
    position: form.get("position"),
    country: form.get("country"),
  });

  if (!parsed.success) {
    const message = encodeURIComponent(parsed.error.issues[0]?.message || "Invalid player data");
    return NextResponse.redirect(new URL(`/players/${playerId}/edit?error=${message}`, req.url));
  }
  const data = parsed.data;

  const duplicate = await prisma.player.findFirst({
    where: { mobileNumber: data.mobileNumber, NOT: { id: playerId } },
  });
  if (duplicate) {
    const message = encodeURIComponent("Another player already uses this mobile number.");
    return NextResponse.redirect(new URL(`/players/${playerId}/edit?error=${message}`, req.url));
  }

  const existingSub = await prisma.substitute.findUnique({ where: { playerId } });
  const existingPlayer = await prisma.player.findUnique({ where: { id: playerId } });
  const positionChanged = existingPlayer && existingPlayer.position !== data.position;

  await prisma.player.update({ where: { id: playerId }, data });

  // Keep the Substitute table in sync with playerType changes, and keep priority
  // numbers scoped to the player's current position group.
  if (data.playerType === "Substitute" && !existingSub) {
    const maxPriority = await prisma.substitute.aggregate({
      _max: { priority: true },
      where: { player: { position: data.position } },
    });
    await prisma.substitute.create({
      data: { playerId, priority: (maxPriority._max.priority ?? 0) + 1 },
    });
  } else if (data.playerType === "Regular" && existingSub) {
    await prisma.substitute.delete({ where: { playerId } });
  } else if (data.playerType === "Substitute" && existingSub && positionChanged) {
    const maxPriority = await prisma.substitute.aggregate({
      _max: { priority: true },
      where: { player: { position: data.position } },
    });
    await prisma.substitute.update({
      where: { playerId },
      data: { priority: (maxPriority._max.priority ?? 0) + 1 },
    });
  }

  return NextResponse.redirect(new URL("/players", req.url));
}
