import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { parse12hTo24h } from "@/lib/gameTime";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function EditGame({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const gameId = Number(id);

  const [game, settings] = await Promise.all([
    prisma.game.findUnique({ where: { id: gameId }, include: { arena: true } }),
    prisma.teamSettings.findUnique({ where: { id: 1 } }),
  ]);
  if (!game) notFound();

  return (
    <main className="shell">
      <div className="top">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Image src="/logo.png" alt="Team logo" width={28} height={28} />
          <h1>Edit Game</h1>
        </div>
        <a href="/" className="button" style={{ textDecoration: "none" }}>Dashboard</a>
      </div>

      <div className="card">
        <h2>Game status</h2>
        <p style={{ fontSize: 13, opacity: 0.75, marginBottom: 10 }}>
          Current status: <b>{game.status}</b>
        </p>
        {game.status !== "Complete" && game.status !== "Cancelled" ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <form action={`/api/games/${game.id}/status`} method="post">
              <input type="hidden" name="status" value="Complete" />
              <button className="button primary" type="submit">Mark Complete</button>
            </form>
            <form action={`/api/games/${game.id}/status`} method="post">
              <input type="hidden" name="status" value="Cancelled" />
              <button className="button danger" type="submit">Cancel Game</button>
            </form>
          </div>
        ) : (
          <p style={{ fontSize: 13, opacity: 0.75 }}>
            This game is {game.status.toLowerCase()} and no longer active. Create a new game to
            continue.
          </p>
        )}
      </div>

      <div className="card">
        {sp.error && <p className="red">{sp.error}</p>}
        <p style={{ marginTop: -4, marginBottom: 14, opacity: 0.75, fontSize: 14 }}>
          Arena: {game.arena.name} · {game.arena.address}
        </p>

        <form action={`/api/games/${game.id}/update`} method="post">
          <label>Game date</label>
          <input
            className="input"
            type="date"
            name="gameDate"
            defaultValue={game.gameDate.toISOString().slice(0, 10)}
            required
          />

          <label>Game time</label>
          <input
            className="input"
            type="time"
            name="gameTime"
            defaultValue={parse12hTo24h(game.gameTime)}
            required
          />

          <label>Goalies required</label>
          <input className="input" type="number" min={0} name="goalieRequirement" defaultValue={game.goalieRequirement} required />

          <label>Defence required</label>
          <input className="input" type="number" min={0} name="defenceRequirement" defaultValue={game.defenceRequirement} required />

          <label>Forwards required</label>
          <input className="input" type="number" min={0} name="forwardRequirement" defaultValue={game.forwardRequirement} required />

          <p style={{ fontSize: 13, fontWeight: 700, marginTop: 18, marginBottom: 4 }}>Sub rules</p>
          <p style={{ fontSize: 13, opacity: 0.75, marginTop: 0, marginBottom: 10 }}>
            Max totals can&apos;t exceed the required numbers above.
          </p>

          <label>Defence: start texting subs after this many decline</label>
          <input className="input" type="number" min={0} name="defenceDeclineThreshold" defaultValue={game.defenceDeclineThreshold} required />
          <label>Defence: max total once subs are involved</label>
          <input className="input" type="number" min={0} name="defenceMaxWithSubs" defaultValue={game.defenceMaxWithSubs} required />

          <label>Forwards: start texting subs after this many decline</label>
          <input className="input" type="number" min={0} name="forwardDeclineThreshold" defaultValue={game.forwardDeclineThreshold} required />
          <label>Forwards: max total once subs are involved</label>
          <input className="input" type="number" min={0} name="forwardMaxWithSubs" defaultValue={game.forwardMaxWithSubs} required />

          <p style={{ fontSize: 13, fontWeight: 700, marginTop: 18, marginBottom: 4 }}>Response rules</p>

          <label>Response deadline (hours before game)</label>
          <input className="input" type="number" min={1} name="responseDeadlineHours" defaultValue={game.responseDeadlineHours} required />

          <label>Reminder (hours before game)</label>
          <input className="input" type="number" min={1} name="reminderHours" defaultValue={game.reminderHours} required />

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <input type="checkbox" name="finalDeadlineTreatNo" defaultChecked={game.finalDeadlineTreatNo} />
            Treat no-response as &quot;No&quot; once the deadline passes
          </label>

          <button className="button primary" type="submit" style={{ marginTop: 12 }}>
            Save changes
          </button>
        </form>
      </div>
    </main>
  );
}
