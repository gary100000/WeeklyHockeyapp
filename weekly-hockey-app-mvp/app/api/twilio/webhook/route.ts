import { prisma } from "@/lib/prisma";
import { fillNextSub } from "@/lib/roster";
import { sendSms } from "@/lib/sms";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const from = String(form.get("From") || "");
  const body = String(form.get("Body") || "").trim().toUpperCase();
  const player = await prisma.player.findFirst({ where:{mobileNumber:from,active:true} });
  if (!player) return new NextResponse("Unknown number", {status:404});

  const game = await prisma.game.findFirst({orderBy:{gameDate:"asc"}});
  if (!game) return new NextResponse("No active game", {status:404});

  const yes = ["YES","Y","YEP","YUP","IN"].includes(body);
  const no = ["NO","N","NOPE","OUT"].includes(body);
  if (!yes && !no) {
    await sendSms(from,"Sorry, I didn’t understand. Please reply YES or NO.");
    return new NextResponse("OK");
  }

  const status = yes ? "Yes" : "No";
  const av = await prisma.gameAvailability.upsert({
    where:{gameId_playerId:{gameId:game.id,playerId:player.id}},
    update:{status,responseTime:new Date()},
    create:{gameId:game.id,playerId:player.id,playerType:player.playerType,status,responseTime:new Date()}
  });

  await prisma.smsMessage.create({data:{playerId:player.id,gameId:game.id,direction:"Incoming",message:body}});

  if (player.playerType === "Substitute" && yes) {
    await prisma.gameAvailability.update({where:{id:av.id},data:{status:"AddedAsSub"}});
    await sendSms(from,"You’re in! 🏒 See you at the game.");
  }

  const confirmed = await prisma.gameAvailability.count({where:{gameId:game.id,status:{in:["Yes","AddedAsSub"]}}});
  if (confirmed >= game.maximumPlayers) {
    await prisma.game.update({where:{id:game.id},data:{status:"Full"}});
  } else if (player.playerType === "Substitute" && no) {
    await fillNextSub(game.id);
  } else if (player.playerType === "Regular" && yes === true) {
    await fillNextSub(game.id);
  }
  return new NextResponse("OK");
}