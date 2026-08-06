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

export default async function NewGame({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const settings = await prisma.teamSettings.findUnique({
    where: { id: 1 },
    include: { arena: true },
  });

  if (!settings || !settings.arenaId) {
    redirect("/setup");
  }

  const suggestedDate = nextDateForDay(settings.defaultGameDay);

  return (
    <main className="shell">
      <div className="top">
        <h1>Create Game</h1>
        <a href="/">Dashboard</a>
      </div>
      <div className="card">
        {sp.error && <p className="red">{sp.error}</p>}
        <p style={{ marginTop: -4, marginBottom: 14, opacity: 0.75, fontSize: 14 }}>
          Arena: {settings.arena?.name} · {settings.arena?.address}
        </p>
        <form action="/api/games" method="post">
          <label>Game date</label>
          <input className="input" type="date" name="gameDate" defaultValue={suggestedDate} required />

          <label>Game time</label>
          <input
            className="input"
            type="time"
            name="gameTime"
            defaultValue={settings.defaultGameTime}
            required
          />

          <label>Maximum players</label>
          <input
            className="input"
            type="number"
            min={1}
            name="maximumPlayers"
            defaultValue={settings.maximumPlayers}
            required
          />

          <label>Goalies required</label>
          <input
            className="input"
            type="number"
            min={0}
            name="goalieRequirement"
            defaultValue={settings.goalieRequirement}
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
