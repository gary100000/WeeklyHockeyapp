"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Availability = {
  id: number;
  status: string;
  player: { id: number; firstName: string; lastName: string; position: string; playerType: string };
};

type UnlistedPlayer = { id: number; firstName: string; lastName: string; position: string; playerType: string };

const STATUS_OPTIONS = ["Yes", "AddedAsSub", "No", "Waiting", "Removed"];
const GROUPS: Array<[string, string, string]> = [
  ["Yes", "green", "PLAYING"],
  ["AddedAsSub", "blue", "SUBS"],
  ["No", "red", "NOT PLAYING"],
  ["Waiting", "yellow", "WAITING"],
  ["Removed", "yellow", "REMOVED"],
];

export default function RosterEditor({
  gameId,
  availabilities,
  unlistedPlayers,
}: {
  gameId: number;
  availabilities: Availability[];
  unlistedPlayers: UnlistedPlayer[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [addingPlayerId, setAddingPlayerId] = useState("");
  const [addingStatus, setAddingStatus] = useState("Yes");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function saveOverride(playerId: number, status: string) {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/roster/override", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId, playerId, status }),
        });
        if (!res.ok) throw new Error("Failed to save.");
        router.refresh();
      } catch (e: any) {
        setError(e.message || "Failed to save.");
      }
    });
  }

  return (
    <div className="card">
      {error && <p className="red">{error}</p>}

      {GROUPS.map(([status, cls, label]) => {
        const list = availabilities.filter((a) => a.status === status);
        if (status === "Removed" && list.length === 0) return null;

        return (
          <section key={status}>
            <h3 className={cls}>{label}</h3>
            {list.map((a) => (
              <div className="row" key={a.id}>
                <span>{a.player.firstName} {a.player.lastName} — {a.player.position}</span>
                {editingId === a.id ? (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <select
                      className="input"
                      style={{ margin: 0, width: "auto", padding: "6px 8px" }}
                      defaultValue={a.status}
                      disabled={isPending}
                      onChange={(e) => {
                        saveOverride(a.player.id, e.target.value);
                        setEditingId(null);
                      }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      className="button"
                      type="button"
                      onClick={() => setEditingId(null)}
                      style={{ padding: "6px 10px" }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span className={cls}>{status}</span>
                    <button
                      className="button"
                      type="button"
                      onClick={() => setEditingId(a.id)}
                      disabled={isPending}
                      style={{ padding: "6px 10px" }}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            ))}
          </section>
        );
      })}

      {unlistedPlayers.length > 0 && (
        <section>
          <h3 style={{ opacity: 0.75 }}>Add to roster</h3>
          <p style={{ fontSize: 12, opacity: 0.65, marginTop: -4, marginBottom: 8 }}>
            Active players not yet on this game&apos;s list.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <select
              className="input"
              style={{ width: "auto", margin: 0 }}
              value={addingPlayerId}
              onChange={(e) => setAddingPlayerId(e.target.value)}
              disabled={isPending}
            >
              <option value="">Select player…</option>
              {unlistedPlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} — {p.position}
                </option>
              ))}
            </select>
            <select
              className="input"
              style={{ width: "auto", margin: 0 }}
              value={addingStatus}
              onChange={(e) => setAddingStatus(e.target.value)}
              disabled={isPending}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              className="button primary"
              type="button"
              disabled={!addingPlayerId || isPending}
              onClick={() => {
                saveOverride(Number(addingPlayerId), addingStatus);
                setAddingPlayerId("");
              }}
            >
              Add
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
