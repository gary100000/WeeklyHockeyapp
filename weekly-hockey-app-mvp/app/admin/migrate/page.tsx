export const dynamic = "force-dynamic";

export default async function MigratePage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string; message?: string }>;
}) {
  const sp = await searchParams;

  return (
    <main className="shell">
      <div className="top">
        <h1>One-Time Database Update</h1>
        <a href="/" className="button" style={{ textDecoration: "none" }}>Dashboard</a>
      </div>
      <div className="card">
        {sp.result === "success" && (
          <p className="green">
            ✅ Done — all pending columns (position requirements, sub rules, player country, and
            response/reminder hours) are now on your database. You can delete this page and its
            API route from the code now (<code>app/admin/migrate</code> and{" "}
            <code>app/api/admin/migrate</code>).
          </p>
        )}
        {sp.result === "error" && (
          <p className="red">⚠️ Something went wrong: {sp.message || "Unknown error"}</p>
        )}
        <p>
          This adds the columns the app needs — <code>defenceRequirement</code>,{" "}
          <code>forwardRequirement</code>, and the four sub-rule fields (decline thresholds and
          max-with-subs caps for Defence and Forward) — to the Game and TeamSettings tables. Safe
          to run more than once; it only adds a column if it doesn&apos;t already exist.
        </p>
        <form action="/api/admin/migrate" method="post">
          <button className="button primary" type="submit">
            Run update
          </button>
        </form>
      </div>
    </main>
  );
}
