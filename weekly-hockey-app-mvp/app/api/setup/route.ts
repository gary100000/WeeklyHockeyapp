import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const setupSchema = z.object({
  teamName: z.string().min(1),
  adminName: z.string().min(1),
  adminMobileNumber: z.string().min(7),
  arenaName: z.string().min(1),
  arenaAddress: z.string().min(1),
  defaultGameDay: z.string().min(1),
  defaultGameTime: z.string().min(1),
  goalieRequirement: z.coerce.number().int().min(0),
  defenceRequirement: z.coerce.number().int().min(0),
  forwardRequirement: z.coerce.number().int().min(0),
  responseDeadline: z.string().min(1),
  reminderTime: z.string().min(1),
  finalDeadlineTreatNo: z.boolean(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  if (!json) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = setupSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid setup data" },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const totalPlayers = data.goalieRequirement + data.defenceRequirement + data.forwardRequirement;
  if (totalPlayers <= 0) {
    return NextResponse.json(
      { error: "Total roster size must be greater than zero." },
      { status: 400 }
    );
  }

  // Single-arena assumption for v1: reuse the existing arena if settings already exist,
  // otherwise create a new one.
  const existingSettings = await prisma.teamSettings.findUnique({ where: { id: 1 } });

  const arena = existingSettings?.arenaId
    ? await prisma.arena.update({
        where: { id: existingSettings.arenaId },
        data: { name: data.arenaName, address: data.arenaAddress },
      })
    : await prisma.arena.create({
        data: { name: data.arenaName, address: data.arenaAddress },
      });

  const settingsData = {
    teamName: data.teamName,
    adminName: data.adminName,
    adminMobileNumber: data.adminMobileNumber,
    defaultGameDay: data.defaultGameDay,
    defaultGameTime: data.defaultGameTime,
    maximumPlayers: totalPlayers,
    goalieRequirement: data.goalieRequirement,
    defenceRequirement: data.defenceRequirement,
    forwardRequirement: data.forwardRequirement,
    responseDeadline: data.responseDeadline,
    reminderTime: data.reminderTime,
    finalDeadlineTreatNo: data.finalDeadlineTreatNo,
    arenaId: arena.id,
  };

  await prisma.teamSettings.upsert({
    where: { id: 1 },
    update: settingsData,
    create: { id: 1, ...settingsData },
  });

  return NextResponse.json({ ok: true });
}
