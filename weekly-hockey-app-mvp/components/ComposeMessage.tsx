"use client";

import { useState, useTransition } from "react";

type Player = {
  id: number;
  firstName: string;
  lastName: string;
  playerType: "Regular" | "Substitute";
};

export default function ComposeMessage({ players }: { players: Player[] }) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ sent: number; failed: string[] } | null>(null);

  const regulars = players.filter((p) => p.playerType === "Regular");
  const substitutes = players.filter((p) => p.playerType === "Substitute");

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll(ids: number[]) {
    setSelected(new Set(ids));
  }

  function send() {
    setError(null);
    setResult(null);

    if (selected.size === 0) {
      setError("Select at least one recipient.");
      return;
    }
    if (!message.trim()) {
      setError("Write a message first.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/messages/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerIds: Array.from(selected), message: message.trim() }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Failed to send.");
        setResult({ sent: data.sent ?? 0, failed: data.failed ?? [] });
        if (!data.failed || data.failed.length === 0) {
          setMessage("");
          setSelected(new Set());
        }
      } catch (e: any) {
        setError(e.message || "Failed to send.");
      }
    });
  }

  const overSegment = message.length > 160;

  return (
    <div className="card">
      {error && <p className="red">{error}</p>}
      {result && (
        <p className={result.failed.length > 0 ? "red" : "green"}>
          {result.failed.length > 0
            ? `Sent to ${result.sent}. Failed: ${result.failed.join(", ")}`
            : `Sent to ${result.sent} player${result.sent === 1 ? "" : "s"}.`}
        </p>
      )}

      <h2>Recipients</h2>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <button className="button" type="button" onClick={() => selectAll(players.map((p) => p.id))} disabled={isPending}>All</button>
        <button className="button" type="button" onClick={() => selectAll(regulars.map((p) => p.id))} disabled={isPending}>Regulars only</button>
        <button className="button" type="button" onClick={() => selectAll(substitutes.map((p) => p.id))} disabled={isPending}>Subs only</button>
        <button className="button" type="button" onClick={() => selectAll([])} disabled={isPending}>None</button>
      </div>

      <p style={{ fontSize: 12, opacity: 0.65, marginBottom: 4 }}>{selected.size} selected</p>

      {regulars.length > 0 && (
        <>
          <h3 style={{ opacity: 0.75 }}>Regulars</h3>
          {regulars.map((p) => (
            <label key={p.id} className="row" style={{ cursor: "pointer" }}>
              <span>{p.firstName} {p.lastName}</span>
              <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} disabled={isPending} />
            </label>
          ))}
        </>
      )}

      {substitutes.length > 0 && (
        <>
          <h3 style={{ opacity: 0.75, marginTop: 12 }}>Substitutes</h3>
          {substitutes.map((p) => (
            <label key={p.id} className="row" style={{ cursor: "pointer" }}>
              <span>{p.firstName} {p.lastName}</span>
              <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} disabled={isPending} />
            </label>
          ))}
        </>
      )}

      <h2 style={{ marginTop: 18 }}>Message</h2>
      <textarea
        className="input"
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="e.g. Bring $5 for ice fees tonight"
        disabled={isPending}
        style={{ fontFamily: "inherit", resize: "vertical" }}
      />
      <p style={{ fontSize: 12, opacity: 0.6, marginTop: -6, marginBottom: 10 }}>
        {message.length} characters{overSegment ? " — over 160 will send as more than one SMS segment" : ""}
      </p>

      <button className="button primary" type="button" onClick={send} disabled={isPending}>
        {isPending ? "Sending…" : "Send message"}
      </button>
    </div>
  );
}
