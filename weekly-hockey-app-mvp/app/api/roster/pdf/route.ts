import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_WIDTH = 595; // A4 in points
const PAGE_HEIGHT = 842;
const MARGIN = 50;

export async function GET() {
  const game = await prisma.game.findFirst({
    orderBy: { createdAt: "desc" },
    include: { arena: true, availabilities: { include: { player: true } } },
  });

  if (!game) {
    return NextResponse.json({ error: "No game found" }, { status: 404 });
  }

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  function drawLine(
    text: string,
    opts: { size?: number; bold?: boolean; color?: [number, number, number]; gapAfter?: number } = {}
  ) {
    const size = opts.size ?? 11;
    const useFont = opts.bold ? boldFont : font;
    const [r, g, b] = opts.color ?? [0.07, 0.09, 0.16];

    if (y < MARGIN + size) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }

    page.drawText(text, { x: MARGIN, y, size, font: useFont, color: rgb(r, g, b) });
    y -= size + (opts.gapAfter ?? 5);
  }

  const availabilities = game.availabilities;
  const playing = availabilities.filter((a) => a.status === "Yes" || a.status === "AddedAsSub");
  const waiting = availabilities.filter((a) => a.status === "Waiting");
  const declined = availabilities.filter((a) => a.status === "No");

  drawLine("Weekly Hockey Roster", { size: 20, bold: true, gapAfter: 8 });
  drawLine(
    game.gameDate.toLocaleDateString("en-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) +
      "  ·  " +
      game.gameTime,
    { size: 12 }
  );
  drawLine(`${game.arena.name} — ${game.arena.address}`, { size: 12, color: [0.4, 0.4, 0.4], gapAfter: 14 });

  drawLine(`Roster: ${playing.length} / ${game.maximumPlayers}`, { size: 14, bold: true, gapAfter: 12 });

  const positionGroups: Array<[string, typeof playing]> = [
    ["Goalies", playing.filter((a) => a.player.position === "Goalie")],
    ["Defence", playing.filter((a) => a.player.position === "Defence")],
    ["Forwards", playing.filter((a) => a.player.position === "Forward")],
  ];

  for (const [label, list] of positionGroups) {
    drawLine(`${label} (${list.length})`, { size: 13, bold: true, gapAfter: 6 });
    if (list.length === 0) {
      drawLine("—", { size: 11, color: [0.55, 0.55, 0.55] });
    } else {
      for (const a of list) {
        const tag = a.playerType === "Substitute" ? "   (sub)" : "";
        drawLine(`${a.player.firstName} ${a.player.lastName}${tag}`, { size: 11 });
      }
    }
    y -= 8;
  }

  if (waiting.length > 0) {
    drawLine(`Waiting (${waiting.length})`, { size: 13, bold: true, gapAfter: 6 });
    for (const a of waiting) {
      drawLine(`${a.player.firstName} ${a.player.lastName} — ${a.player.position}`, { size: 11 });
    }
    y -= 8;
  }

  if (declined.length > 0) {
    drawLine(`Not Playing (${declined.length})`, { size: 13, bold: true, gapAfter: 6 });
    for (const a of declined) {
      drawLine(`${a.player.firstName} ${a.player.lastName} — ${a.player.position}`, {
        size: 11,
        color: [0.55, 0.2, 0.2],
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  const filename = `roster-${game.gameDate.toISOString().slice(0, 10)}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
