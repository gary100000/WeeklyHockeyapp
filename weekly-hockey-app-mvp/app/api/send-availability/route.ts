import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";
import { NextResponse } from "next/server";

export async function POST() {
  const game = await prisma.game.findFirst({ orderBy: { createdAt: "desc" }, include: { arena: true }});
  if (!game) return NextResponse.json({error:"No game"}, {status:404});
  const players = await prisma.player.findMany({ where: { active:true, playerType:"Regular" }});
  for (const player of players) {
    const body = `🏒 Hockey this ${game.gameDate.toLocaleDateString("en-CA",{weekday:"long"})} at ${game.gameTime} at ${game.arena.name}.\\n\\nAre you playing?\\n\\nReply YES or NO.`;
    const sms = await sendSms(player.mobileNumber, body);
    await prisma.gameAvailability.upsert({
      where:{gameId_playerId:{gameId:game.id,playerId:player.id}},
      update:{status:"Waiting",smsMessageId:sms.sid,contactedAt:new Date()},
      create:{gameId:game.id,playerId:player.id,playerType:"Regular",status:"Waiting",smsMessageId:sms.sid,contactedAt:new Date()}
    });
    await prisma.smsMessage.create({data:{playerId:player.id,gameId:game.id,direction:"Outgoing",message:body,providerId:sms.sid,status:sms.status}});
  }
  await prisma.game.update({where:{id:game.id},data:{status:"AvailabilityOpen"}});
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}