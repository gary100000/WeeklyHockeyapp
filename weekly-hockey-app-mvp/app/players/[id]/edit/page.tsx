import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditPlayer({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const player = await prisma.player.findUnique({ where: { id: Number(id) } });
  if (!player) notFound();

  return (
    <main className="shell">
      <div className="top">
        <h1>Edit Player</h1>
        <a href="/players" className="button" style={{ textDecoration: "none" }}>Players</a>
      </div>
      <div className="card">
        {sp.error && <p className="red">{sp.error}</p>}
        <form action={`/api/players/${player.id}/update`} method="post">
          <label>First name</label>
          <input className="input" name="firstName" required defaultValue={player.firstName} />

          <label>Last name</label>
          <input className="input" name="lastName" required defaultValue={player.lastName} />

          <label>Mobile number</label>
          <input
            className="input"
            name="mobileNumber"
            required
            defaultValue={player.mobileNumber}
            pattern="^\+[1-9]\d{6,14}$"
            title="Use E.164 format, e.g. +15195551234"
          />

          <label>Player type</label>
          <select className="input" name="playerType" defaultValue={player.playerType}>
            <option value="Regular">Regular</option>
            <option value="Substitute">Substitute</option>
          </select>

          <label>Position</label>
          <select className="input" name="position" defaultValue={player.position}>
            <option value="Forward">Forward</option>
            <option value="Defence">Defence</option>
            <option value="Goalie">Goalie</option>
          </select>

          <button className="button primary" type="submit" style={{ marginTop: 12 }}>
            Save changes
          </button>
        </form>
      </div>
    </main>
  );
}
