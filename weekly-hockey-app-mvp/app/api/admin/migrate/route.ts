import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "defenceRequirement" INTEGER NOT NULL DEFAULT 0;`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "forwardRequirement" INTEGER NOT NULL DEFAULT 0;`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "TeamSettings" ADD COLUMN IF NOT EXISTS "defenceRequirement" INTEGER NOT NULL DEFAULT 0;`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "TeamSettings" ADD COLUMN IF NOT EXISTS "forwardRequirement" INTEGER NOT NULL DEFAULT 0;`
    );
    return NextResponse.redirect(new URL("/admin/migrate?result=success", req.url));
  } catch (err: any) {
    const message = encodeURIComponent(String(err?.message || err));
    return NextResponse.redirect(new URL(`/admin/migrate?result=error&message=${message}`, req.url));
  }
}
