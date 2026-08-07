import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Settings() {
  const s = await prisma.teamSettings.findUnique({ where: { id: 1 }, include: { arena: true } });

  return (
    <main className="shell">
      <div className="top">
        <h1>Settings</h1>
        <a href="/" className="button" style={{ textDecoration: "none" }}>Dashboard</a>
      </div>
      <div className="card">
        {s ? (
          <>
            <h2>{s.teamName}</h2>
            <p>Admin: {s.adminName} · {s.adminMobileNumber}</p>
            <p>Arena: {s.arena?.name}</p>
            <p>Address: {s.arena?.address}</p>
            <p>Default game: {s.defaultGameDay} · {s.defaultGameTime}</p>
            <p>Roster size: {s.maximumPlayers} ({s.goalieRequirement}G / {s.defenceRequirement}D / {s.forwardRequirement}F)</p>
            <p>Defence subs: after {s.defenceDeclineThreshold} decline(s), up to {s.defenceMaxWithSubs} total</p>
            <p>Forward subs: after {s.forwardDeclineThreshold} decline(s), up to {s.forwardMaxWithSubs} total</p>
            <p>Response deadline: {s.responseDeadline}</p>
            <p>Reminder: {s.reminderTime}</p>
            <p>No-response treated as No: {s.finalDeadlineTreatNo ? "Yes" : "No"}</p>
            <a href="/setup" className="button primary" style={{ display: "inline-block", marginTop: 12, textDecoration: "none" }}>
              Edit setup
            </a>
          </>
        ) : (
          <>
            <p>You haven&apos;t set up your team yet.</p>
            <a href="/setup" className="button primary" style={{ display: "inline-block", marginTop: 8, textDecoration: "none" }}>
              Run setup wizard
            </a>
          </>
        )}
      </div>
    </main>
  );
}
