import { prisma } from "@/lib/prisma";
import SubsPriorityList from "@/components/SubsPriorityList";

export const dynamic = "force-dynamic";

export default async function Subs() {
  const subs = await prisma.substitute.findMany({
    orderBy: { priority: "asc" },
    include: { player: true },
  });

  return (
    <main className="shell">
      <div className="top">
        <h1>Substitute Priority</h1>
        <a href="/" className="button" style={{ textDecoration: "none" }}>Dashboard</a>
      </div>
      <p style={{ marginTop: -8, marginBottom: 16, opacity: 0.75, fontSize: 14 }}>
        This is the order subs get contacted when a spot opens up. Use ↑/↓ to reorder, or add new
        substitutes from the Players page.
      </p>
      <SubsPriorityList initialSubs={subs} />
    </main>
  );
}
