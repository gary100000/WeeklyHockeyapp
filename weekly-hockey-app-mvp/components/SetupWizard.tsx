"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FormState = {
  teamName: string;
  adminName: string;
  adminMobileNumber: string;
  arenaName: string;
  arenaAddress: string;
  defaultGameDay: string;
  defaultGameTime: string;
  goalieRequirement: string;
  defenceRequirement: string;
  forwardRequirement: string;
  defenceDeclineThreshold: string;
  defenceMaxWithSubs: string;
  forwardDeclineThreshold: string;
  forwardMaxWithSubs: string;
  responseDeadline: string;
  reminderTime: string;
  finalDeadlineTreatNo: boolean;
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const STEPS = ["Team", "Arena", "Game defaults", "Sub rules", "Response rules", "Review"];

const DEFAULTS: FormState = {
  teamName: "",
  adminName: "",
  adminMobileNumber: "",
  arenaName: "",
  arenaAddress: "",
  defaultGameDay: "Wednesday",
  defaultGameTime: "20:00",
  goalieRequirement: "1",
  defenceRequirement: "8",
  forwardRequirement: "14",
  defenceDeclineThreshold: "2",
  defenceMaxWithSubs: "8",
  forwardDeclineThreshold: "4",
  forwardMaxWithSubs: "14",
  responseDeadline: "24 hours before game",
  reminderTime: "48 hours before game",
  finalDeadlineTreatNo: true,
};

export default function SetupWizard({ initialData }: { initialData?: Partial<FormState> }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...DEFAULTS, ...initialData });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const totalPlayers =
    (Number(form.goalieRequirement) || 0) + (Number(form.defenceRequirement) || 0) + (Number(form.forwardRequirement) || 0);

  function stepError(i: number): string | null {
    if (i === 0) {
      if (!form.teamName.trim() || !form.adminName.trim() || !form.adminMobileNumber.trim()) {
        return "Please fill in all fields on this step before continuing.";
      }
      return null;
    }
    if (i === 1) {
      if (!form.arenaName.trim() || !form.arenaAddress.trim()) {
        return "Please fill in all fields on this step before continuing.";
      }
      return null;
    }
    if (i === 2) {
      if (Number(form.goalieRequirement) < 0 || Number(form.defenceRequirement) < 0 || Number(form.forwardRequirement) < 0 || totalPlayers <= 0) {
        return "Please fill in all fields on this step before continuing.";
      }
      return null;
    }
    if (i === 3) {
      if (
        Number(form.defenceDeclineThreshold) < 0 ||
        Number(form.defenceMaxWithSubs) < 0 ||
        Number(form.forwardDeclineThreshold) < 0 ||
        Number(form.forwardMaxWithSubs) < 0
      ) {
        return "Please fill in all fields on this step before continuing.";
      }
      if (Number(form.defenceMaxWithSubs) > Number(form.defenceRequirement)) {
        return `Defence max with subs (${form.defenceMaxWithSubs}) can't be higher than Defence required (${form.defenceRequirement}).`;
      }
      if (Number(form.forwardMaxWithSubs) > Number(form.forwardRequirement)) {
        return `Forwards max with subs (${form.forwardMaxWithSubs}) can't be higher than Forwards required (${form.forwardRequirement}).`;
      }
      return null;
    }
    if (i === 4) {
      if (!form.responseDeadline.trim() || !form.reminderTime.trim()) {
        return "Please fill in all fields on this step before continuing.";
      }
      return null;
    }
    return null;
  }

  function next() {
    const message = stepError(step);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    for (let i = 0; i < STEPS.length - 1; i++) {
      const message = stepError(i);
      if (message) {
        setError(message);
        setStep(i);
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong saving setup.");
      }
      router.push("/");
      router.refresh();
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <main className="shell">
      <div className="top">
        <h1>Setup Wizard</h1>
        <a href="/" className="button" style={{ textDecoration: "none" }}>Dashboard</a>
      </div>
      <div className="card">
        <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
          {STEPS.map((label, i) => (
            <div
              key={label}
              style={{
                flex: 1,
                minWidth: 60,
                textAlign: "center",
                padding: "6px 4px",
                borderRadius: 8,
                background: i === step ? "#111827" : i < step ? "#d1fae5" : "#f1f5f9",
                color: i === step ? "#fff" : "#111827",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {i + 1}. {label}
            </div>
          ))}
        </div>

        {step === 0 && (
          <section>
            <h2>Team &amp; Admin</h2>
            <label>Team name</label>
            <input
              className="input"
              value={form.teamName}
              onChange={(e) => update("teamName", e.target.value)}
              placeholder="e.g. Thursday Night Hockey"
            />
            <label>Your name (admin)</label>
            <input
              className="input"
              value={form.adminName}
              onChange={(e) => update("adminName", e.target.value)}
              placeholder="Gary"
            />
            <label>Your mobile number</label>
            <input
              className="input"
              value={form.adminMobileNumber}
              onChange={(e) => update("adminMobileNumber", e.target.value)}
              placeholder="+15195551234"
            />
          </section>
        )}

        {step === 1 && (
          <section>
            <h2>Arena</h2>
            <label>Arena name</label>
            <input
              className="input"
              value={form.arenaName}
              onChange={(e) => update("arenaName", e.target.value)}
              placeholder="e.g. WFCU Centre"
            />
            <label>Arena address</label>
            <input
              className="input"
              value={form.arenaAddress}
              onChange={(e) => update("arenaAddress", e.target.value)}
              placeholder="Street address"
            />
          </section>
        )}

        {step === 2 && (
          <section>
            <h2>Game defaults</h2>
            <label>Default game day</label>
            <select
              className="input"
              value={form.defaultGameDay}
              onChange={(e) => update("defaultGameDay", e.target.value)}
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <label>Default game time</label>
            <input
              type="time"
              className="input"
              value={form.defaultGameTime}
              onChange={(e) => update("defaultGameTime", e.target.value)}
            />
            <label>Goalies required</label>
            <input
              type="number"
              min={0}
              className="input"
              value={form.goalieRequirement}
              onChange={(e) => update("goalieRequirement", e.target.value)}
            />
            <label>Defence required</label>
            <input
              type="number"
              min={0}
              className="input"
              value={form.defenceRequirement}
              onChange={(e) => update("defenceRequirement", e.target.value)}
            />
            <label>Forwards required</label>
            <input
              type="number"
              min={0}
              className="input"
              value={form.forwardRequirement}
              onChange={(e) => update("forwardRequirement", e.target.value)}
            />
            <p style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>
              Total roster size: <b>{totalPlayers}</b> players
            </p>
          </section>
        )}

        {step === 3 && (
          <section>
            <h2>Sub rules</h2>
            <p style={{ fontSize: 13, opacity: 0.75, marginTop: -4, marginBottom: 14 }}>
              Controls when the app starts texting substitutes. A single decline is tolerated —
              subs only get contacted once the threshold below is crossed, then filling continues
              up to the max total for that position. Max totals can&apos;t exceed the required
              numbers from the previous step.
            </p>

            <label>Defence: start texting subs after this many decline</label>
            <input
              type="number"
              min={0}
              className="input"
              value={form.defenceDeclineThreshold}
              onChange={(e) => update("defenceDeclineThreshold", e.target.value)}
            />
            <label>Defence: max total once subs are involved</label>
            <input
              type="number"
              min={0}
              className="input"
              value={form.defenceMaxWithSubs}
              onChange={(e) => update("defenceMaxWithSubs", e.target.value)}
            />

            <label>Forwards: start texting subs after this many decline</label>
            <input
              type="number"
              min={0}
              className="input"
              value={form.forwardDeclineThreshold}
              onChange={(e) => update("forwardDeclineThreshold", e.target.value)}
            />
            <label>Forwards: max total once subs are involved</label>
            <input
              type="number"
              min={0}
              className="input"
              value={form.forwardMaxWithSubs}
              onChange={(e) => update("forwardMaxWithSubs", e.target.value)}
            />
          </section>
        )}

        {step === 4 && (
          <section>
            <h2>Response rules</h2>
            <label>Response deadline</label>
            <input
              className="input"
              value={form.responseDeadline}
              onChange={(e) => update("responseDeadline", e.target.value)}
              placeholder="e.g. 24 hours before game"
            />
            <label>Reminder time</label>
            <input
              className="input"
              value={form.reminderTime}
              onChange={(e) => update("reminderTime", e.target.value)}
              placeholder="e.g. 48 hours before game"
            />
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <input
                type="checkbox"
                checked={form.finalDeadlineTreatNo}
                onChange={(e) => update("finalDeadlineTreatNo", e.target.checked)}
              />
              Treat no-response as &quot;No&quot; once the deadline passes
            </label>
          </section>
        )}

        {step === 5 && (
          <section>
            <h2>Review</h2>
            <div className="row"><span>Team</span><b>{form.teamName || "—"}</b></div>
            <div className="row"><span>Admin</span><b>{form.adminName || "—"} · {form.adminMobileNumber || "—"}</b></div>
            <div className="row"><span>Arena</span><b>{form.arenaName || "—"}</b></div>
            <div className="row"><span>Address</span><b>{form.arenaAddress || "—"}</b></div>
            <div className="row"><span>Game day/time</span><b>{form.defaultGameDay} · {form.defaultGameTime}</b></div>
            <div className="row"><span>Goalies required</span><b>{form.goalieRequirement}</b></div>
            <div className="row"><span>Defence required</span><b>{form.defenceRequirement}</b></div>
            <div className="row"><span>Forwards required</span><b>{form.forwardRequirement}</b></div>
            <div className="row"><span>Total roster size</span><b>{totalPlayers}</b></div>
            <div className="row"><span>Defence sub threshold</span><b>{form.defenceDeclineThreshold} decline(s) → up to {form.defenceMaxWithSubs} total</b></div>
            <div className="row"><span>Forward sub threshold</span><b>{form.forwardDeclineThreshold} decline(s) → up to {form.forwardMaxWithSubs} total</b></div>
            <div className="row"><span>Response deadline</span><b>{form.responseDeadline}</b></div>
            <div className="row"><span>Reminder</span><b>{form.reminderTime}</b></div>
            <div className="row"><span>No-response treated as No</span><b>{form.finalDeadlineTreatNo ? "Yes" : "No"}</b></div>
          </section>
        )}

        {error && <p className="red" style={{ marginTop: 12 }}>{error}</p>}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, gap: 10 }}>
          <button className="button" type="button" onClick={back} disabled={step === 0 || saving}>
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button className="button primary" type="button" onClick={next}>
              Next
            </button>
          ) : (
            <button className="button primary" type="button" onClick={submit} disabled={saving}>
              {saving ? "Saving…" : "Finish setup"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
