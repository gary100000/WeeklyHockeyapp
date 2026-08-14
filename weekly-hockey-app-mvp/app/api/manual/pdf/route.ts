import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

type Section = { heading: string; paragraphs: string[] };

function sections(teamName: string): Section[] {
  return [
    {
      heading: "Getting Started",
      paragraphs: [
        `Weekly Hockey automates checking player availability, building a roster, and contacting substitutes for ${teamName}. Everything is managed from your phone through this web app — log in with your admin password to get started.`,
        "The typical weekly flow is: create the game, send availability, let replies come in (the app fills substitute spots automatically as needed), then check the Roster page before puck drop.",
      ],
    },
    {
      heading: "Setup Wizard",
      paragraphs: [
        "Run once to configure your team, then re-run anytime to update your defaults. It covers: Team & Admin info, Arena details, Game defaults (how many Goalies, Defence, and Forwards you normally need), Sub Rules (when the app should start texting substitutes and how many total it should accept), and Response Rules (reminder and deadline timing).",
        "Changing Setup only affects the defaults new games are pre-filled with — it does not retroactively change any game you've already created. Use Edit Game for that.",
      ],
    },
    {
      heading: "Players",
      paragraphs: [
        "Add every player who might play. Each one is tagged as Regular or Substitute, given a position (Forward, Defence, or Goalie), and a Country (Canada or USA) — the country determines which of your two Twilio numbers texts them, so it matters for delivery, not just organization.",
        "Deactivating a player stops them from being contacted without deleting anything — their history stays intact and they can be reactivated later. Deleting a player is permanent: if they've ever played, their game history is removed too. Use Deactivate for anyone who's actually played; reserve Delete for a player added by mistake.",
      ],
    },
    {
      heading: "Substitute Priority",
      paragraphs: [
        "The Subs page groups your bench by position — Goalies, Defence, Forwards — because a departing defenceman is only ever backfilled by another substitute defenceman, never a forward or goalie, and vice versa. Use the up and down arrows to set contact order within each group.",
        "Pause a substitute to skip them temporarily (they're unavailable this stretch, but still on your roster) without removing them from the list entirely. Resume brings them back into rotation at their same priority spot.",
      ],
    },
    {
      heading: "Creating a Game",
      paragraphs: [
        "Create Game asks for the date, time, and how many players you need at each position, plus two rule sets specific to that game: Sub Rules (how many regulars need to decline before the app starts texting subs at that position, and the max total it will fill up to once it does) and Response Rules (reminder and deadline hours before game time).",
        `"Copy Last Week's Settings" pre-fills all of the above from your most recently created game, rolling the date forward exactly 7 days — handy since most weeks look the same.`,
        "Edit Game lets you change any of these numbers on an already-created game, and is also where you mark a game Complete or Cancelled once it's done.",
      ],
    },
    {
      heading: "How Automatic Texting Works",
      paragraphs: [
        "Tapping SEND AVAILABILITY on the Dashboard texts every active Regular player at once, asking if they're playing. This only happens once per game and only while its status is Draft.",
        "As YES/NO replies come in, the app automatically re-checks every position. If Defence or Forward has crossed its configured decline threshold, the next substitute in that position's priority list gets texted — one at a time, waiting for their reply before moving to the next. Goalies are simpler: a substitute goalie gets contacted as soon as you're short one, with no tolerance built in.",
        "Substitutes who confirm get a reply back automatically. Anyone who texts something the app can't parse as yes or no gets asked to reply YES or NO again.",
      ],
    },
    {
      heading: "Reminders & the Response Deadline",
      paragraphs: [
        "If a player hasn't responded, a single reminder text goes out automatically once your configured reminder window (hours before game time) is reached. This only ever fires once per game, and only to players still marked Waiting — nobody gets texted twice.",
        `Separately, if "treat no-response as No" is turned on for a game, anyone still unanswered once the response deadline passes gets silently marked No — no text is sent for this, it's a quiet cutoff that lets the substitute-fill logic take over from there. If that setting is off, non-responders are simply left as Waiting indefinitely.`,
        "This check runs once a day automatically, so the exact timing can drift by up to a day depending on when in your window the daily check lands — it isn't minute-precise, but that's not usually necessary for a once-a-week game.",
      ],
    },
    {
      heading: "Roster & PDF Export",
      paragraphs: [
        "The Roster page shows everyone associated with the current game, grouped by status: Playing (broken down by position), Waiting, and Not Playing.",
        "Download PDF produces a printable sheet with checkboxes next to each confirmed player for check-in at the rink, everyone's phone number, and your team logo — useful to have on hand at the door.",
      ],
    },
    {
      heading: "Game Status, Explained",
      paragraphs: [
        "Draft — created, availability not yet sent. AvailabilityOpen — texts sent, waiting on replies. FillingSubs — actively contacting the bench for at least one position. Full — nothing is currently actionable; this can mean every position is genuinely at its target, or that a shortfall exists but hasn't crossed the decline threshold yet, in which case the Dashboard and Roster pages will say so explicitly. Complete / Cancelled — closed out and no longer treated as the active game.",
      ],
    },
    {
      heading: "Wrapping Up a Game",
      paragraphs: [
        "From the Dashboard or Roster page, open Edit Game and mark it Complete once it's been played, or Cancelled if it falls through. This matters because the app always treats your most recently created, still-open game as \"the current game\" — closing one out cleanly means the next one you create takes over properly.",
      ],
    },
    {
      heading: "Settings",
      paragraphs: [
        "Settings shows your current team configuration and links back into the Setup Wizard to change it. As with Setup itself, changes here only affect new games going forward, not ones already created.",
      ],
    },
  ];
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function GET() {
  const settings = await prisma.teamSettings.findUnique({ where: { id: 1 } });
  const teamName = settings?.teamName || "Weekly Hockey";

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const firstPage = page;
  let y = PAGE_HEIGHT - MARGIN;

  try {
    const logoBytes = fs.readFileSync(path.join(process.cwd(), "public", "logo.png"));
    const logoImage = await pdfDoc.embedPng(logoBytes);
    const logoSize = 46;
    const logoDims = logoImage.scale(logoSize / logoImage.width);
    firstPage.drawImage(logoImage, {
      x: PAGE_WIDTH - MARGIN - logoDims.width,
      y: PAGE_HEIGHT - MARGIN - logoDims.height + 14,
      width: logoDims.width,
      height: logoDims.height,
    });
  } catch (err) {
    console.error("Failed to embed logo in manual PDF:", err);
  }

  function drawLine(text: string, opts: { size?: number; bold?: boolean; color?: [number, number, number]; gapAfter?: number } = {}) {
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

  function drawParagraph(text: string, opts: { size?: number; color?: [number, number, number]; gapAfter?: number } = {}) {
    const size = opts.size ?? 11;
    const lines = wrapText(text, font, size, CONTENT_WIDTH);
    for (const line of lines) {
      drawLine(line, { size, color: opts.color, gapAfter: 4 });
    }
    y -= (opts.gapAfter ?? 10) - 4;
  }

  drawLine(`${teamName} — App Manual`, { size: 22, bold: true, gapAfter: 4 });
  drawLine(
    `Generated ${new Date().toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}`,
    { size: 9, color: [0.55, 0.55, 0.55], gapAfter: 20 }
  );

  for (const section of sections(teamName)) {
    drawLine(section.heading, { size: 15, bold: true, color: [0.11, 0.16, 0.28], gapAfter: 8 });
    for (const paragraph of section.paragraphs) {
      drawParagraph(paragraph, { gapAfter: 12 });
    }
    y -= 6;
  }

  const pages = pdfDoc.getPages();
  const totalPages = pages.length;
  pages.forEach((p, i) => {
    const label = `Page ${i + 1} of ${totalPages}`;
    const labelWidth = font.widthOfTextAtSize(label, 9);
    p.drawText(label, {
      x: PAGE_WIDTH - MARGIN - labelWidth,
      y: 25,
      size: 9,
      font,
      color: rgb(0.55, 0.55, 0.55),
    });
  });

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="weekly-hockey-manual.pdf"`,
    },
  });
}
