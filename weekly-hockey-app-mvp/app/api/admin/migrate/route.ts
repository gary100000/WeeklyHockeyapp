import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const statements = [
  `ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "defenceRequirement" INTEGER NOT NULL DEFAULT 0;`,
  `ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "forwardRequirement" INTEGER NOT NULL DEFAULT 0;`,
  `ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "defenceDeclineThreshold" INTEGER NOT NULL DEFAULT 2;`,
  `ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "defenceMaxWithSubs" INTEGER NOT NULL DEFAULT 8;`,
  `ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "forwardDeclineThreshold" INTEGER NOT NULL DEFAULT 4;`,
  `ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "forwardMaxWithSubs" INTEGER NOT NULL DEFAULT 14;`,
  `ALTER TABLE "TeamSettings" ADD COLUMN IF NOT EXISTS "defenceRequirement" INTEGER NOT NULL DEFAULT 0;`,
  `ALTER TABLE "TeamSettings" ADD COLUMN IF NOT EXISTS "forwardRequirement" INTEGER NOT NULL DEFAULT 0;`,
  `ALTER TABLE "TeamSettings" ADD COLUMN IF NOT EXISTS "defenceDeclineThreshold" INTEGER NOT NULL DEFAULT 2;`,
  `ALTER TABLE "TeamSettings" ADD COLUMN IF NOT EXISTS "defenceMaxWithSubs" INTEGER NOT NULL DEFAULT 8;`,
  `ALTER TABLE "TeamSettings" ADD COLUMN IF NOT EXISTS "forwardDeclineThreshold" INTEGER NOT NULL DEFAULT 4;`,
  `ALTER TABLE "TeamSettings" ADD COLUMN IF NOT EXISTS "forwardMaxWithSubs" INTEGER NOT NULL DEFAULT 14;`,
  `DO $$ BEGIN
     CREATE TYPE "PlayerCountry" AS ENUM ('US', 'CA');
   EXCEPTION
     WHEN duplicate_object THEN null;
   END $$;`,
  `ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS "country" "PlayerCountry" NOT NULL DEFAULT 'CA';`,
];

export async function POST(req: Request) {
  try {
    for (const statement of statements) {
      await prisma.$executeRawUnsafe(statement);
    }
    return NextResponse.redirect(new URL("/admin/migrate?result=success", req.url));
  } catch (err: any) {
    const message = encodeURIComponent(String(err?.message || err));
    return NextResponse.redirect(new URL(`/admin/migrate?result=error&message=${message}`, req.url));
  }
}
