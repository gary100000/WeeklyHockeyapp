import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Roster() {
 const game=await prisma.game.findFirst({orderBy:{createdAt:"desc"},include:{arena:true,availabilities:{include:{player:true}}}});
 if(!game)return <main className="shell"><h1>No game</h1></main>;
 const groups=[["Yes","green"],["AddedAsSub","blue"],["No","red"],["Waiting","yellow"]];
 return <main className="shell"><div className="top"><h1>Roster</h1><a href="/">Dashboard</a></div>
 <div className="card"><h2>{game.gameDate.toLocaleDateString()} · {game.availabilities.filter(a=>a.status==="Yes"||a.status==="AddedAsSub").length}/{game.maximumPlayers}</h2>
 {groups.map(([status,cls])=><section key={status}><h3 className={cls}>{status==="AddedAsSub"?"SUBS":status==="Yes"?"PLAYING":status.toUpperCase()}</h3>
 {game.availabilities.filter(a=>a.status===status).map(a=><div className="row" key={a.id}><span>{a.player.firstName} {a.player.lastName} — {a.player.position}</span><span className={cls}>{status}</span></div>)}</section>)}
 </div></main>
}