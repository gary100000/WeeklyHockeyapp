import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { CURRENT_GAME_WHERE } from "@/lib/currentGame";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ smsError?: string; smsSent?: string }>;
}) {
  const sp = await searchParams;

  const game = await prisma.game.findFirst({
    where: CURRENT_GAME_WHERE,
    orderBy: { createdAt: "desc" },
    include: { arena: true, availabilities: { include: { player: true } } }
  });

  if (!game) {
    const settings = await prisma.teamSettings.findUnique({ where: { id: 1 } });

    return <main className="shell">
      <header className="top"><div className="brand" style={{display:"flex",alignItems:"center",gap:8}}><Image src="/logo.png" alt="Team logo" width={28} height={28} /> Weekly Hockey</div><nav className="nav">
        <a href="/" className="button">Dashboard</a><a href="/players" className="button">Players</a><a href="/subs" className="button">Subs</a><a href="/settings" className="button">Settings</a>
        <form action="/api/logout" method="post" style={{display:"inline"}}><button className="button" type="submit" style={{padding:"9px 12px"}}>Log out</button></form>
      </nav></header>
      <section className="card hero">
        <div style={{opacity:.75}}>WEEKLY HOCKEY</div>
        <h1>No game scheduled</h1>
        <p>{settings ? "Create this week's game to get started." : "Let's get your team set up first."}</p>
      </section>
      <section className="card">
        {settings ? (
          <>
            <h2>Getting started</h2>
            <p>Add players, then create the next weekly game.</p>
            <a href="/games/new" className="button primary" style={{display:"inline-block",marginTop:10,textDecoration:"none"}}>Create this week's game</a>
          </>
        ) : (
          <>
            <h2>Run the setup wizard</h2>
            <p>Set your team name, arena, and game defaults before adding players or creating a game.</p>
            <a href="/setup" className="button primary" style={{display:"inline-block",marginTop:10,textDecoration:"none"}}>Start setup</a>
          </>
        )}
      </section>
    </main>;
  }

  const playing = game.availabilities.filter(a => a.status === "Yes").length;
  const subs = game.availabilities.filter(a => a.status === "AddedAsSub").length;
  const waiting = game.availabilities.filter(a => a.status === "Waiting").length;
  const notPlaying = game.availabilities.filter(a => a.status === "No").length;

  const confirmedFor = (position: string) =>
    game.availabilities.filter((a) => (a.status === "Yes" || a.status === "AddedAsSub") && a.player.position === position).length;

  const shortfalls = [
    { label: "Goalie", short: Math.max(0, game.goalieRequirement - confirmedFor("Goalie")) },
    { label: "Defence", short: Math.max(0, game.defenceRequirement - confirmedFor("Defence")) },
    { label: "Forward", short: Math.max(0, game.forwardRequirement - confirmedFor("Forward")) },
  ].filter((s) => s.short > 0);

  return <main className="shell">
    <header className="top"><div className="brand" style={{display:"flex",alignItems:"center",gap:8}}><Image src="/logo.png" alt="Team logo" width={28} height={28} /> Weekly Hockey</div><nav className="nav">
      <a href="/" className="button">Dashboard</a><a href="/roster" className="button">Roster</a><a href="/players" className="button">Players</a><a href="/subs" className="button">Subs</a><a href="/settings" className="button">Settings</a>
      <form action="/api/logout" method="post" style={{display:"inline"}}><button className="button" type="submit" style={{padding:"9px 12px"}}>Log out</button></form>
    </nav></header>
    {sp.smsError && <section className="card" style={{borderColor:"var(--goal-red)"}}><p className="red" style={{margin:0}}>{sp.smsError}</p></section>}
    {sp.smsSent && <section className="card" style={{borderColor:"var(--confirmed-green)"}}><p className="green" style={{margin:0}}>Sent to {sp.smsSent} player{sp.smsSent === "1" ? "" : "s"}.</p></section>}
    <section className="card hero">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap"}}>
        <div style={{flex:"1 1 220px",minWidth:0}}>
          <div style={{opacity:.75}}>NEXT GAME</div>
          <h1>{game.gameDate.toLocaleDateString("en-CA",{weekday:"long",month:"long",day:"numeric"})}</h1>
          <h2>{game.gameTime} · {game.arena.name}</h2>
          <div>{game.arena.address}</div>
        </div>
        <Image src="/logo.png" alt="Team logo" width={84} height={84} style={{flexShrink:0}} priority />
      </div>
    </section>
    <section className="card">
      <h2>Roster {playing + subs} / {game.maximumPlayers}</h2>
      <div className="grid">
        <div className="stat"><div>Playing</div><div className="big green">{playing}</div></div>
        <div className="stat"><div>Subs</div><div className="big blue">{subs}</div></div>
        <div className="stat"><div>Waiting</div><div className="big yellow">{waiting}</div></div>
        <div className="stat"><div>Not Playing</div><div className="big red">{notPlaying}</div></div>
      </div>
    </section>
    <section className="card">
      <h2>Game Status</h2>
      <p>
        {game.status}
        {game.status === "Full" && shortfalls.length > 0 && (
          <span className="yellow"> — still short {shortfalls.map((s) => `${s.short} ${s.label}`).join(", ")}, tolerated below the decline threshold</span>
        )}
      </p>
      {game.status === "Draft" && (
        <form action="/api/send-availability" method="post"><button className="button primary">SEND AVAILABILITY</button></form>
      )}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}>
        <a href="/games/new" className="button" style={{textDecoration:"none"}}>+ Create next week's game</a>
        <a href={`/games/${game.id}/edit`} className="button" style={{textDecoration:"none"}}>Edit this game</a>
      </div>
    </section>
  </main>;
}
