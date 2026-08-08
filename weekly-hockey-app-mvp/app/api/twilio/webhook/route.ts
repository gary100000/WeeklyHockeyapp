import { prisma } from "@/lib/prisma";
import { fillNextSub } from "@/lib/roster";
import { sendSms } from "@/lib/sms";
import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    params[key] = String(value);
  }

  // Verify this request actually came from Twilio before trusting any of it.
  const signature = req.headers.get("x-twilio-signature") || "";
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const validSignature = !!authToken && twilio.validateRequest(authToken, signature, req.url, params);

  if (!validSignature) {
    return new NextResponse("Invalid signature", { status: 403 });
  }

  const from = params["From"] || "";
  const rawBody = (params["Body"] || "").trim();
  const body = rawBody.toUpperCase();

  const player = await prisma.player.findFirst({ where: { mobileNumber: from, active: true } });
  if (!player) return new NextResponse("Unknown number", { status: 404 });

  const game = await prisma.game.findFirst({ orderBy: { createdAt: "desc" } });
  if (!game) return new NextResponse("No active game", { status: 404 });

  // Log every incoming message, even ones we can't parse, so nothing is silently dropped.
  await prisma.smsMessage.create({
    data: { playerId: player.id, gameId: game.id, direction: "Incoming", message: rawBody },
  });

  const yes = ["YES", "Y", "YEP", "YUP", "IN"].includes(body);
  const no = ["NO", "N", "NOPE", "OUT"].includes(body);

  if (!yes && !no) {
    await sendSms(from, "Sorry, I didn't understand. Please reply YES or NO.", player.country);
    return new NextResponse("OK");
  }

  const isConfirmedSub = yes && player.playerType === "Substitute";
  const status = isConfirmedSub ? "AddedAsSub" : yes ? "Yes" : "No";

  await prisma.gameAvailability.upsert({
    where: { gameId_playerId: { gameId: game.id, playerId: player.id } },
    update: { status, responseTime: new Date() },
    create: { gameId: game.id, playerId: player.id, playerType: player.playerType, status, responseTime: new Date() },
  });

  if (isConfirmedSub) {
    await sendSms(from, "You're in! See you at the game.", player.country);
  }

  // Re-check the roster after every processed reply. fillNextSub recomputes
  // goalie/skater shortfalls from scratch and is a safe no-op once both are covered,
  // so it's correct to call unconditionally here rather than only for specific cases.
  await fillNextSub(game.id);

  return new NextResponse("OK");
}
