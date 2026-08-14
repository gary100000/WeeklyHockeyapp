import { prisma } from "@/lib/prisma";
import SubsPriorityList from "@/components/SubsPriorityList";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function Subs() {
  const subs = await prisma.substitute.findMany({
    orderBy: { priority: "asc" },
    include: { player: true },
  });

  return (
    <main className="shell">
      <div className="top">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Image src="/logo.png" alt="Team logo" width={28} height={28} />
          <h1>Substitute Priority</h1>
        </div>
        <a href="/" className="button" style={{ textDecoration: "none" }}>Dashboard</a>
      </div>
      <p style={{ marginTop: -8, marginBottom: 16, opacity: 0.75, fontSize: 14 }}>
        Subs are grouped by position. Use ↑/↓ to reorder within a group, or add new substitutes
        from the Players page.
      </p>
      <SubsPriorityList initialSubs={subs} />
    </main>
  );
}
