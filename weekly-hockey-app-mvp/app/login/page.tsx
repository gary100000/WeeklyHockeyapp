export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const action = sp.next ? `/api/login?next=${encodeURIComponent(sp.next)}` : "/api/login";

  return (
    <main className="shell">
      <section className="card hero">
        <div style={{ opacity: 0.75 }}>WEEKLY HOCKEY</div>
        <h1>Admin Login</h1>
        {sp.error && <p className="red">Incorrect password.</p>}
        <form action={action} method="post">
          <input
            type="password"
            name="password"
            placeholder="Password"
            autoFocus
            className="input"
            required
          />
          <button className="button primary" type="submit" style={{ marginTop: 12 }}>
            Log in
          </button>
        </form>
      </section>
    </main>
  );
}
