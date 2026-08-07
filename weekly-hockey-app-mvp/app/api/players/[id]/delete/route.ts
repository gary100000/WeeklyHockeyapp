import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const playerId = Number(id);

  try {
    await prisma.player.delete({ where: { id: playerId } });
  } catch (err) {
    console.error(`Failed to delete player ${playerId}:`, err);
    const message = encodeURIComponent("Couldn't delete this player. Try deactivating them instead.");
    return NextResponse.redirect(new URL(`/players/${playerId}/edit?error=${message}`, req.url));
  }

  return NextResponse.redirect(new URL("/players", req.url));
}
