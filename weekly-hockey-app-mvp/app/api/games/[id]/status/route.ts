import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED = ["Complete", "Cancelled"] as const;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gameId = Number(id);

  const form = await req.formData();
  const status = form.get("status");

  if (typeof status !== "string" || !ALLOWED.includes(status as (typeof ALLOWED)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    await prisma.game.update({ where: { id: gameId }, data: { status: status as any } });
  } catch (err) {
    console.error(`Failed to update status for game ${gameId}:`, err);
    return NextResponse.json({ error: "Failed to update game status" }, { status: 500 });
  }

  return NextResponse.redirect(new URL("/", req.url));
}
