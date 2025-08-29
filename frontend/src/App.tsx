import { useEffect, useState } from "react";
import { api } from "./api";

type Activity = {
  id: number;
  name: string;
  tier: string;
  priority: string;
  estimated_minutes: number;
};

export default function App() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [form, setForm] = useState({ name: "", tier: "Main Quest", priority: "High", estimated_minutes: 30 });

  useEffect(() => {
    api.get<Activity[]>("/activities").then(res => setActivities(res.data));
  }, []);

  const create = async () => {
    if (!form.name.trim()) return;
    await api.post<Activity>("/activities", form);
    const res = await api.get<Activity[]>("/activities");
    setActivities(res.data);
    setForm({ name: "", tier: "Main Quest", priority: "High", estimated_minutes: 30 });
  };

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>TimeForge MVP</h1>

      <div style={{ display: "grid", gap: 8, maxWidth: 420, marginBottom: 24 }}>
        <input
          placeholder="Activity name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />
        <select value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value })}>
          <option>Main Quest</option>
          <option>Side Quest</option>
          <option>Bonus Round</option>
          <option>Free Play</option>
        </select>
        <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <input
          type="number"
          min={5}
          step={5}
          value={form.estimated_minutes}
          onChange={e => setForm({ ...form, estimated_minutes: Number(e.target.value) })}
        />
        <button onClick={create}>Add Activity</button>
      </div>

      <ul style={{ paddingLeft: 16 }}>
        {activities.map(a => (
          <li key={a.id}>
            {a.name} — {a.tier} / {a.priority} ({a.estimated_minutes}m)
          </li>
        ))}
      </ul>
    </div>
  );
}
