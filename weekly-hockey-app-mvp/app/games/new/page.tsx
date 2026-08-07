import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function nextDateForDay(dayName: string): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const targetIdx = days.indexOf(dayName);
  const today = new Date();
  const todayIdx = today.getDay();
  const diff = targetIdx >= 0 ? (targetIdx - todayIdx + 7) % 7 : 0;
  const result = new Date(today);
  result.setDate(today.getDate() + diff);
  return result.toISOString().slice(0, 10);
}

function parseTime12h(display: string): string {
  const match = display.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return "20:00";
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ampm = match[3].toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${m}`;
}

export default async function NewGame({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; copyLastWeek?: string }>;
}) {
  const sp = await searchParams;
  const settings = await prisma.teamSettings.findUnique({
    where: { id: 1 },
    include: { arena: true },
  });

  if (!settings || !settings.arenaId) {
    redirect("/setup");
  }

  const lastGame = await prisma.game.findFirst({ orderBy: { createdAt: "desc" } });
  const copying = sp.copyLastWeek === "1" && !!lastGame;

  let suggestedDate = nextDateForDay(settings.defaultGameDay);
  let suggestedTime = settings.defaultGameTime;
  let suggestedGoalies = settings.goalieRequirement;
  let suggestedDefence = settings.defenceRequirement;
  let suggestedForward = settings.forwardRequirement;

  if (copying && lastGame) {
    const nextWeek = new Date(lastGame.gameDate);
    nextWeek.setDate(nextWeek.getDate() + 7);
    suggestedDate = nextWeek.toISOString().slice(0, 10);
    suggestedTime = parseTime12h(lastGame.gameTime);
    suggestedGoalies = lastGame.goalieRequirement;
    suggestedDefence = lastGame.defenceRequirement;
    suggestedForward = lastGame.forwardRequirement;
  }

  return (
    <main className="shell">
      <div className="top">
        <h1>Create Game</h1>
        <a href="/" className="button" style={{ textDecoration: "none" }}>Dashboard</a>
      </div>
      <div className="card">
        {sp.error && <p className="red">{sp.error}</p>}
        <p style={{ marginTop: -4, marginBottom: 14, opacity: 0.75, fontSize: 14 }}>
          Arena: {settings.arena?.name} · {settings.arena?.address}
        </p>

        {lastGame && !copying && (
          <a
            href="/games/new?copyLastWeek=1"
            className="button"
            style={{ display: "inline-block", marginBottom: 14, textDecoration: "none" }}
          >
            ↻ Copy last week&apos;s settings
          </a>
        )}
        {copying && lastGame && (
          <p style={{ fontSize: 13, opacity: 0.75, marginBottom: 14 }}>
            Prefilled from {lastGame.gameDate.toLocaleDateString("en-CA")} — {lastGame.gameTime},{" "}
            {lastGame.goalieRequirement}G / {lastGame.defenceRequirement}D / {lastGame.forwardRequirement}F.
            Adjust below if needed.
          </p>
        )}

        <form action="/api/games" method="post">
          <label>Game date</label>
          <input className="input" type="date" name="gameDate" defaultValue={suggestedDate} required />

          <label>Game time</label>
          <input
            className="input"
            type="time"
            name="gameTime"
            defaultValue={suggestedTime}
            required
          />

          <label>Goalies required</label>
          <input
            className="input"
            type="number"
            min={0}
            name="goalieRequirement"
            defaultValue={suggestedGoalies}
            required
          />

          <label>Defence required</label>
          <input
            className="input"
            type="number"
            min={0}
            name="defenceRequirement"
            defaultValue={suggestedDefence}
            required
          />

          <label>Forwards required</label>
          <input
            className="input"
            type="number"
            min={0}
            name="forwardRequirement"
            defaultValue={suggestedForward}
            required
          />

          <button className="button primary" type="submit" style={{ marginTop: 12 }}>
            Create game
          </button>
        </form>
      </div>
    </main>
  );
}
