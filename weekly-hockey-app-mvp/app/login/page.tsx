import Image from "next/image";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const action = sp.next ? `/api/login?next=${encodeURIComponent(sp.next)}` : "/api/login";

  return (
    <main className="shell">
      <section
        className="card hero"
        style={{ textAlign: "center", maxWidth: 380, margin: "60px auto 0" }}
      >
        <Image src="/logo.png" alt="Team logo" width={88} height={88} style={{ marginBottom: 10 }} priority />
        <div style={{ opacity: 0.75, fontSize: 13, marginBottom: 2 }}>WEEKLY HOCKEY</div>
        <h1 style={{ marginBottom: 16 }}>Admin Login</h1>
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
          <button className="button primary" type="submit" style={{ marginTop: 12, width: "100%" }}>
            Log in
          </button>
        </form>
      </section>
    </main>
  );
}
