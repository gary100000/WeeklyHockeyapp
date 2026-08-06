export default async function NewPlayer({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;

  return (
    <main className="shell">
      <div className="top">
        <h1>Add Player</h1>
        <a href="/players">Players</a>
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

          <button className="button primary" type="submit" style={{ marginTop: 12 }}>
            Add player
          </button>
        </form>
      </div>
    </main>
  );
}
