"use client";

import type { MouseEvent } from "react";

export default function DeletePlayerButton({
  playerId,
  playerName,
}: {
  playerId: number;
  playerName: string;
}) {
  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(`Delete ${playerName}? This can't be undone.`)) {
      e.preventDefault();
    }
  }

  return (
    <form action={`/api/players/${playerId}/delete`} method="post" style={{ display: "inline" }}>
      <button className="button danger" type="submit" onClick={handleClick} style={{ marginLeft: 8 }}>
        Delete player
      </button>
    </form>
  );
}
