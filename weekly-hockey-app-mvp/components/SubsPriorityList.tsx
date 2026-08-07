"use client";

import { useState, useTransition } from "react";

type Sub = {
  id: number;
  priority: number;
  active: boolean;
  player: {
    id: number;
    firstName: string;
    lastName: string;
    position: "Goalie" | "Defence" | "Forward";
    active: boolean;
  };
};

const POSITION_ORDER: Array<Sub["player"]["position"]> = ["Goalie", "Defence", "Forward"];
const POSITION_LABELS: Record<Sub["player"]["position"], string> = {
  Goalie: "Goalies",
  Defence: "Defence",
  Forward: "Forwards",
};

export default function SubsPriorityList({ initialSubs }: { initialSubs: Sub[] }) {
  const [subs, setSubs] = useState(initialSubs);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function groupFor(position: Sub["player"]["position"]) {
    return subs
      .filter((s) => s.player.position === position)
      .sort((a, b) => a.priority - b.priority);
  }

  function move(sub: Sub, direction: -1 | 1) {
    const group = groupFor(sub.player.position);
    const idx = group.findIndex((s) => s.id === sub.id);
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= group.length) return;
    const other = group[targetIdx];

    // Swap just these two priority values — reordering stays scoped to this position group.
    const updated = subs.map((s) => {
      if (s.id === sub.id) return { ...s, priority: other.priority };
      if (s.id === other.id) return { ...s, priority: sub.priority };
      return s;
    });
    setSubs(updated);
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/subs/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order: [
              { id: sub.id, priority: other.priority },
              { id: other.id, priority: sub.priority },
            ],
          }),
        });
        if (!res.ok) throw new Error("Failed to save new order.");
      } catch (e: any) {
        setError(e.message || "Failed to save new order.");
        setSubs(initialSubs); // revert on failure
      }
    });
  }

  function togglePause(id: number) {
    const target = subs.find((s) => s.id === id);
    if (!target) return;
    const nextActive = !target.active;

    setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, active: nextActive } : s)));
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/subs/${id}/toggle-active`, { method: "POST" });
        if (!res.ok) throw new Error("Failed to update status.");
      } catch (e: any) {
        setError(e.message || "Failed to update status.");
        setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, active: target.active } : s)));
      }
    });
  }

  if (subs.length === 0) {
    return (
      <div className="card">
        <p>No substitutes yet.</p>
        <a href="/players/new" className="button primary" style={{ display: "inline-block", marginTop: 8, textDecoration: "none" }}>
          Add a substitute
        </a>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="card" style={{ borderColor: "var(--goal-red)" }}>
          <p className="red" style={{ margin: 0 }}>{error}</p>
        </div>
      )}
      {POSITION_ORDER.map((position) => {
        const group = groupFor(position);
        return (
          <div className="card" key={position}>
            <h2 style={{ marginTop: 0 }}>{POSITION_LABELS[position]}</h2>
            {group.length === 0 && (
              <p style={{ opacity: 0.6, fontSize: 14 }}>No substitute {POSITION_LABELS[position].toLowerCase()} yet.</p>
            )}
            {group.map((s, i) => (
              <div className="row" key={s.id}>
                <div>
                  <b>{i + 1}. {s.player.firstName} {s.player.lastName}</b>
                  <div style={{ fontSize: 13, opacity: 0.75 }}>
                    {!s.player.active && "player inactive"}
                    {!s.player.active && !s.active && " · "}
                    {!s.active && "paused"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button
                    className="button"
                    type="button"
                    onClick={() => move(s, -1)}
                    disabled={i === 0 || isPending}
                    style={{ padding: "9px 12px" }}
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    className="button"
                    type="button"
                    onClick={() => move(s, 1)}
                    disabled={i === group.length - 1 || isPending}
                    style={{ padding: "9px 12px" }}
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    className="button"
                    type="button"
                    onClick={() => togglePause(s.id)}
                    disabled={isPending}
                    style={{ padding: "9px 12px" }}
                  >
                    {s.active ? "Pause" : "Resume"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}
