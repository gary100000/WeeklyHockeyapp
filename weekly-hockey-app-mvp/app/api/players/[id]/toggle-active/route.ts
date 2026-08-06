import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const playerId = Number(id);

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    return NextResponse.redirect(new URL("/players", req.url));
  }

  const nextActive = !player.active;
  await prisma.player.update({ where: { id: playerId }, data: { active: nextActive } });

  // A deactivated substitute shouldn't be contacted for open spots.
  await prisma.substitute.updateMany({ where: { playerId }, data: { active: nextActive } });

  return NextResponse.redirect(new URL("/players", req.url));
}
