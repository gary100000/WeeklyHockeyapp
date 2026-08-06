import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const reorderSchema = z.object({
  order: z
    .array(
      z.object({
        id: z.number().int(),
        priority: z.number().int().positive(),
      })
    )
    .min(1),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  if (!json) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = reorderSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid order data" },
      { status: 400 }
    );
  }

  try {
    await prisma.$transaction(
      parsed.data.order.map(({ id, priority }) =>
        prisma.substitute.update({ where: { id }, data: { priority } })
      )
    );
  } catch {
    return NextResponse.json({ error: "Failed to save new order" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
