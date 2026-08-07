import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const gameSchema = z.object({
  gameDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  gameTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time"),
  goalieRequirement: z.coerce.number().int().min(0),
  defenceRequirement: z.coerce.number().int().min(0),
  forwardRequirement: z.coerce.number().int().min(0),
});

function formatTime12h(hhmm: string) {
  const [hStr, mStr] = hhmm.split(":");
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${mStr} ${ampm}`;
}

export async function POST(req: Request) {
  const form = await req.formData();
  const parsed = gameSchema.safeParse({
    gameDate: form.get("gameDate"),
    gameTime: form.get("gameTime"),
    goalieRequirement: form.get("goalieRequirement"),
    defenceRequirement: form.get("defenceRequirement"),
    forwardRequirement: form.get("forwardRequirement"),
  });

  if (!parsed.success) {
    const message = encodeURIComponent(parsed.error.issues[0]?.message || "Invalid game data");
    return NextResponse.redirect(new URL(`/games/new?error=${message}`, req.url));
  }
  const data = parsed.data;

  const totalPlayers = data.goalieRequirement + data.defenceRequirement + data.forwardRequirement;
  if (totalPlayers <= 0) {
    const message = encodeURIComponent("Total roster size must be greater than zero.");
    return NextResponse.redirect(new URL(`/games/new?error=${message}`, req.url));
  }

  const settings = await prisma.teamSettings.findUnique({ where: { id: 1 } });
  if (!settings?.arenaId) {
    return NextResponse.redirect(new URL("/setup", req.url));
  }

  await prisma.game.create({
    data: {
      gameDate: new Date(`${data.gameDate}T00:00:00.000Z`),
      gameTime: formatTime12h(data.gameTime),
      arenaId: settings.arenaId,
      maximumPlayers: totalPlayers,
      goalieRequirement: data.goalieRequirement,
      defenceRequirement: data.defenceRequirement,
      forwardRequirement: data.forwardRequirement,
      status: "Draft",
    },
  });

  return NextResponse.redirect(new URL("/", req.url));
}
