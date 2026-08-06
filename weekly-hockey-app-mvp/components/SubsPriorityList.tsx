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
    position: string;
    active: boolean;
  };
};

export default function SubsPriorityList({ initialSubs }: { initialSubs: Sub[] }) {
  const [subs, setSubs] = useState(initialSubs);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function move(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= subs.length) return;

    const reordered = [...subs];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    // Renumber priorities to match the new order (1-based, sequential).
    const withPriorities = reordered.map((s, i) => ({ ...s, priority: i + 1 }));
    setSubs(withPriorities);
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/subs/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order: withPriorities.map((s) => ({ id: s.id, priority: s.priority })),
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
    <div className="card">
      {error && <p className="red" style={{ marginBottom: 10 }}>{error}</p>}
      {subs.map((s, i) => (
        <div className="row" key={s.id}>
          <div>
            <b>{i + 1}. {s.player.firstName} {s.player.lastName}</b>
            <div style={{ fontSize: 13, opacity: 0.75 }}>
              {s.player.position}
              {!s.player.active && " · player inactive"}
              {!s.active && " · paused"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              className="button"
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0 || isPending}
              style={{ padding: "9px 12px" }}
              aria-label="Move up"
            >
              ↑
            </button>
            <button
              className="button"
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === subs.length - 1 || isPending}
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
}
