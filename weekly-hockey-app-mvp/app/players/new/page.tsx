import Image from "next/image";

export default async function NewPlayer({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;

  return (
    <main className="shell">
      <div className="top">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Image src="/logo.png" alt="Team logo" width={28} height={28} />
          <h1>Add Player</h1>
        </div>
        <a href="/players" className="button" style={{ textDecoration: "none" }}>Players</a>
      </div>
      <div className="card">
        {sp.error && <p className="red">{sp.error}</p>}
        <form action="/api/players" method="post">
          <label>First name</label>
          <input className="input" name="firstName" required placeholder="Jamie" />

          <label>Last name</label>
          <input className="input" name="lastName" required placeholder="Smith" />

          <label>Mobile number</label>
          <input
            className="input"
            name="mobileNumber"
            required
            placeholder="+15195551234"
            pattern="^\+[1-9]\d{6,14}$"
            title="Use E.164 format, e.g. +15195551234"
          />

          <label>Player type</label>
          <select className="input" name="playerType" defaultValue="Regular">
            <option value="Regular">Regular</option>
            <option value="Substitute">Substitute</option>
          </select>

          <label>Position</label>
          <select className="input" name="position" defaultValue="Forward">
            <option value="Forward">Forward</option>
            <option value="Defence">Defence</option>
            <option value="Goalie">Goalie</option>
          </select>

          <label>Country</label>
          <select className="input" name="country" defaultValue="CA">
            <option value="CA">Canada</option>
            <option value="US">USA</option>
          </select>
          <p style={{ fontSize: 12, opacity: 0.65, marginTop: -6, marginBottom: 4 }}>
            Determines which Twilio number texts this player.
          </p>

          <button className="button primary" type="submit" style={{ marginTop: 12 }}>
            Add player
          </button>
        </form>
      </div>
    </main>
  );
}
