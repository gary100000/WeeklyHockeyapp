import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { CURRENT_GAME_WHERE } from "@/lib/currentGame";
import RosterEditor from "@/components/RosterEditor";

export const dynamic = "force-dynamic";

export default async function Roster() {
  const game = await prisma.game.findFirst({
    where: CURRENT_GAME_WHERE,
    orderBy: { createdAt: "desc" },
    include: { arena: true, availabilities: { include: { player: true } } },
  });
  if (!game) return <main className="shell"><h1>No game</h1></main>;

  const confirmedFor = (position: string) =>
    game.availabilities.filter((a) => (a.status === "Yes" || a.status === "AddedAsSub") && a.player.position === position).length;

  // Raw shortfall against the normal target (not the tolerance-adjusted sub-fill numbers),
  // so "Full" can be clarified when a shortfall is just being tolerated rather than truly filled.
  const shortfalls = [
    { label: "Goalie", short: Math.max(0, game.goalieRequirement - confirmedFor("Goalie")) },
    { label: "Defence", short: Math.max(0, game.defenceRequirement - confirmedFor("Defence")) },
    { label: "Forward", short: Math.max(0, game.forwardRequirement - confirmedFor("Forward")) },
  ].filter((s) => s.short > 0);

  const listedPlayerIds = game.availabilities.map((a) => a.player.id);
  const unlistedPlayers = await prisma.player.findMany({
    where: { active: true, id: { notIn: listedPlayerIds } },
    orderBy: [{ playerType: "asc" }, { lastName: "asc" }],
  });

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
      </div>

      <RosterEditor
        gameId={game.id}
        availabilities={game.availabilities}
        unlistedPlayers={unlistedPlayers}
      />

      <a href="/api/roster/pdf" className="button primary" style={{ textDecoration: "none", display: "inline-block", marginTop: 16 }}>⬇ Download PDF</a>
    </main>
  );
}
