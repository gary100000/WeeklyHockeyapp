import type { Prisma } from "@prisma/client";

/**
 * "The current game" is the most recently created game that hasn't been
 * explicitly closed out. Every place in the app that looks up "the" game
 * should use this so a Completed/Cancelled game doesn't linger as current.
 */
export const CURRENT_GAME_WHERE: Prisma.GameWhereInput = {
  status: { notIn: ["Complete", "Cancelled"] },
};
