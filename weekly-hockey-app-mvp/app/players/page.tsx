import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Players() {
  const players = await prisma.player.findMany({
    orderBy: [{ active: "desc" }, { lastName: "asc" }],
  });

  return (
    <main className="shell">
      <div className="top">
        <h1>Players</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/players/new" className="button primary" style={{ textDecoration: "none" }}>
            + Add player
          </a>
          <a href="/" className="button" style={{ textDecoration: "none" }}>Dashboard</a>
        </div>
      </div>
      <div className="card">
        {players.length === 0 && <p>No players yet. Add your first one above.</p>}
        {players.map((p) => (
          <div className="row" key={p.id}>
            <div>
              <b>{p.firstName} {p.lastName}</b>
              <div style={{ fontSize: 13, opacity: 0.75 }}>
                {p.position} · {p.playerType} · {p.mobileNumber}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className={p.active ? "green" : "red"}>{p.active ? "Active" : "Inactive"}</span>
              <a href={`/players/${p.id}/edit`} className="button" style={{ textDecoration: "none", padding: "9px 12px" }}>
                Edit
              </a>
              <form action={`/api/players/${p.id}/toggle-active`} method="post">
                <button className="button" type="submit" style={{ padding: "9px 12px" }}>
                  {p.active ? "Deactivate" : "Reactivate"}
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
