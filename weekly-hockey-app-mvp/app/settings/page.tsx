import { prisma } from "@/lib/prisma";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function Settings() {
  const s = await prisma.teamSettings.findUnique({ where: { id: 1 }, include: { arena: true } });

  return (
    <main className="shell">
      <div className="top">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Image src="/logo.png" alt="Team logo" width={28} height={28} />
          <h1>Settings</h1>
        </div>
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
            <p>Response deadline: {s.responseDeadlineHours}h before game (silent cutoff, no text sent)</p>
            <p>Reminder: {s.reminderHours}h before game (texts only players still waiting)</p>
            <p>No-response treated as No at deadline: {s.finalDeadlineTreatNo ? "Yes" : "No"}</p>
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
      <div className="card">
        <h2>App Manual</h2>
        <p style={{ fontSize: 13, opacity: 0.75, marginBottom: 10 }}>
          A printable guide covering every feature — Setup, Players, Substitutes, Games, how the
          automatic texting and reminders work, and what each game status means.
        </p>
        <a href="/api/manual/pdf" className="button primary" style={{ display: "inline-block", textDecoration: "none" }}>
          ⬇ Download App Manual (PDF)
        </a>
      </div>
    </main>
  );
}
