import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { CURRENT_GAME_WHERE } from "@/lib/currentGame";

export const dynamic = "force-dynamic";

export default async function Roster() {
  const game = await prisma.game.findFirst({
    where: CURRENT_GAME_WHERE,
    orderBy: { createdAt: "desc" },
    include: { arena: true, availabilities: { include: { player: true } } },
  });
  if (!game) return <main className="shell"><h1>No game</h1></main>;

  const groups: [string, string][] = [["Yes", "green"], ["AddedAsSub", "blue"], ["No", "red"], ["Waiting", "yellow"]];

  const confirmedFor = (position: string) =>
    game.availabilities.filter((a) => (a.status === "Yes" || a.status === "AddedAsSub") && a.player.position === position).length;

  // Raw shortfall against the normal target (not the tolerance-adjusted sub-fill numbers),
  // so "Full" can be clarified when a shortfall is just being tolerated rather than truly filled.
  const shortfalls = [
    { label: "Goalie", short: Math.max(0, game.goalieRequirement - confirmedFor("Goalie")) },
    { label: "Defence", short: Math.max(0, game.defenceRequirement - confirmedFor("Defence")) },
    { label: "Forward", short: Math.max(0, game.forwardRequirement - confirmedFor("Forward")) },
  ].filter((s) => s.short > 0);

  return (
    <main className="shell">
      <div className="top">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Image src="/logo.png" alt="Team logo" width={32} height={32} />
          <h1>Roster</h1>
        </div>
        <a href="/" className="button" style={{ textDecoration: "none" }}>Dashboard</a>
      </div>
      <div className="card">
        <h2>{game.gameDate.toLocaleDateString()} · {game.availabilities.filter(a => a.status === "Yes" || a.status === "AddedAsSub").length}/{game.maximumPlayers}</h2>
        <p style={{ fontSize: 13, opacity: 0.75, marginTop: -4 }}>
          Status: <b>{game.status}</b>
          {game.status === "Full" && shortfalls.length > 0 && (
            <span className="yellow">
              {" "}— still short {shortfalls.map((s) => `${s.short} ${s.label}`).join(", ")}, tolerated below the decline threshold
            </span>
          )}
        </p>
        {groups.map(([status, cls]) => (
          <section key={status}>
            <h3 className={cls}>{status === "AddedAsSub" ? "SUBS" : status === "Yes" ? "PLAYING" : status.toUpperCase()}</h3>
            {game.availabilities.filter(a => a.status === status).map(a => (
              <div className="row" key={a.id}>
                <span>{a.player.firstName} {a.player.lastName} — {a.player.position}</span>
                <span className={cls}>{status}</span>
              </div>
            ))}
          </section>
        ))}
      </div>
      <a href="/api/roster/pdf" className="button primary" style={{ textDecoration: "none", display: "inline-block" }}>⬇ Download PDF</a>
    </main>
  );
}
