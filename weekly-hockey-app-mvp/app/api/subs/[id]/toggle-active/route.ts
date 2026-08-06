import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const subId = Number(id);

  const sub = await prisma.substitute.findUnique({ where: { id: subId } });
  if (!sub) {
    return NextResponse.json({ error: "Substitute not found" }, { status: 404 });
  }

  await prisma.substitute.update({ where: { id: subId }, data: { active: !sub.active } });

  return NextResponse.json({ ok: true });
}
