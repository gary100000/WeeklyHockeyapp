import { prisma } from "@/lib/prisma";
import Image from "next/image";
import ComposeMessage from "@/components/ComposeMessage";

export const dynamic = "force-dynamic";

export default async function NewMessage() {
  const players = await prisma.player.findMany({
    where: { active: true },
    orderBy: [{ playerType: "asc" }, { lastName: "asc" }],
    select: { id: true, firstName: true, lastName: true, playerType: true },
  });

  return (
    <main className="shell">
      <div className="top">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Image src="/logo.png" alt="Team logo" width={28} height={28} />
          <h1>Send Message</h1>
        </div>
        <a href="/" className="button" style={{ textDecoration: "none" }}>Dashboard</a>
      </div>

      <div className="card">
        <p style={{ fontSize: 13, opacity: 0.75 }}>
          Send a one-off text outside the normal YES/NO flow — for announcements like fees, rink
          changes, or anything else. This doesn&apos;t affect any game&apos;s roster or trigger the
          substitute-fill engine.
        </p>
      </div>

      {players.length === 0 ? (
        <div className="card">
          <p>No active players yet.</p>
        </div>
      ) : (
        <ComposeMessage players={players} />
      )}
    </main>
  );
}
