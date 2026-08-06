import { prisma } from "@/lib/prisma";

export default async function Home() {
  const game = await prisma.game.findFirst({
    orderBy: { gameDate: "asc" },
    include: { arena: true, availabilities: { include: { player: true } } }
  });

  if (!game) return <main className="shell">
    <header className="top"><div className="brand">🏒 Weekly Hockey</div><nav className="nav">
      <a href="/">Dashboard</a><a href="/players">Players</a><a href="/subs">Subs</a><a href="/settings">Settings</a>
    </nav></header>
    <section className="card hero">
      <div style={{opacity:.75}}>WEEKLY HOCKEY</div>
      <h1>No game scheduled</h1>
      <p>Create this week's game to get started.</p>
    </section>
    <section className="card">
      <h2>Getting started</h2>
      <p>Add players, configure your arena/settings, then create the next weekly game.</p>
    </section>
  </main>;

  const playing = game.availabilities.filter(a => a.status === "Yes").length;
  const subs = game.availabilities.filter(a => a.status === "AddedAsSub").length;
  const waiting = game.availabilities.filter(a => a.status === "Waiting").length;
  const notPlaying = game.availabilities.filter(a => a.status === "No").length;

  return <main className="shell">
    <header className="top"><div className="brand">🏒 Weekly Hockey</div><nav className="nav">
      <a href="/">Dashboard</a><a href="/roster">Roster</a><a href="/players">Players</a><a href="/subs">Subs</a><a href="/settings">Settings</a>
    </nav></header>
    <section className="card hero">
      <div style={{opacity:.75}}>NEXT GAME</div>
      <h1>{game.gameDate.toLocaleDateString("en-CA",{weekday:"long",month:"long",day:"numeric"})}</h1>
      <h2>{game.gameTime} · {game.arena.name}</h2>
      <div>{game.arena.address}</div>
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
      <h2>Game Status</h2><p>{game.status}</p>
      <form action="/api/send-availability" method="post"><button className="button primary">SEND AVAILABILITY</button></form>
    </section>
  </main>;
}