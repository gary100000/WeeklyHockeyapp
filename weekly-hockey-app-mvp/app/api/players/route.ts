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

export async function POST(req: Request) {
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
    return NextResponse.redirect(new URL(`/players/new?error=${message}`, req.url));
  }
  const data = parsed.data;

  const existing = await prisma.player.findFirst({ where: { mobileNumber: data.mobileNumber } });
  if (existing) {
    const message = encodeURIComponent("A player with this mobile number already exists.");
    return NextResponse.redirect(new URL(`/players/new?error=${message}`, req.url));
  }

  const player = await prisma.player.create({ data });

  if (data.playerType === "Substitute") {
    const maxPriority = await prisma.substitute.aggregate({
      _max: { priority: true },
      where: { player: { position: data.position } },
    });
    await prisma.substitute.create({
      data: { playerId: player.id, priority: (maxPriority._max.priority ?? 0) + 1 },
    });
  }

  return NextResponse.redirect(new URL("/players", req.url));
}
