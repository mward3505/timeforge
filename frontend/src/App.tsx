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
    const [schedule, setSchedule] = useState<any | null>(null);
    const [form, setForm] = useState({
        name: "",
        tier: "",
        priority: "",
        estimated_minutes: 0,
    });
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const [avail, setAvail] = useState<
        { day_of_week: number; available_minutes: number }[]
    >(
        Array.from({ length: 7 }, (_, i) => ({
            day_of_week: i,
            available_minutes: 0,
        }))
    );

    useEffect(() => {
        api.get<Activity[]>("/activities").then((res) =>
            setActivities(res.data)
        );

        // effect for availability
        api.get<
            { id: number; day_of_week: number; available_minutes: number }[]
        >("/availability").then((res) => {
            const byDay = new Map(
                res.data.map((r) => [r.day_of_week, r.available_minutes])
            );
            setAvail((prev) =>
                prev.map((x) => ({
                    ...x,
                    available_minutes: byDay.get(x.day_of_week) ?? 0,
                }))
            );
        });
    }, []);

    const create = async () => {
        if (!form.name.trim()) return;
        await api.post<Activity>("/activities", form);
        const res = await api.get<Activity[]>("/activities");
        setActivities(res.data);
        setForm({
            name: "",
            tier: "Main Quest",
            priority: "High",
            estimated_minutes: 30,
        });
    };

    return (
        <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
            <h1>TimeForge MVP</h1>

            <h2>Weekly Availability</h2>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: 8,
                    maxWidth: 700,
                }}
            >
                {avail.map((row) => (
                    <div
                        key={row.day_of_week}
                        style={{ display: "grid", gap: 6 }}
                    >
                        <div style={{ textAlign: "center", fontWeight: 600 }}>
                            {dayNames[row.day_of_week]}
                        </div>
                        <input
                            type="number"
                            min={0}
                            step={15}
                            value={row.available_minutes}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setAvail((curr) =>
                                    curr.map((x) =>
                                        x.day_of_week === row.day_of_week
                                            ? { ...x, available_minutes: val }
                                            : x
                                    )
                                );
                            }}
                        />
                    </div>
                ))}
            </div>

            <button
                style={{ marginTop: 12 }}
                onClick={async () => {
                  try {
                    // Ensure correct data shape
                    const payload = avail.map(a => ({
                      day_of_week: a.day_of_week,
                      available_minutes: a.available_minutes
                    }));

                    await api.post("/availability", payload);
                    alert("Availability saved!");

                    // Refresh the UI
                    const res = await api.get<
                      { id: number; day_of_week: number; available_minutes: number }[]
                    >("/availability");
                    const byDay = new Map(
                      res.data.map((r) => [r.day_of_week, r.available_minutes])
                    );
                    setAvail((prev) =>
                      prev.map((x) => ({
                        ...x,
                        available_minutes: byDay.get(x.day_of_week) ?? 0,
                      }))
                    );
                  } catch (err: any) {
                    console.error("Error saving availability:", err);
                    alert("Failed to save availability — check console and backend logs.");
                  }
                }}
            >
                Save Availability
            </button>
            <button
                style={{ marginTop: 12 }}
                onClick={async () => {
                    try {
                    const res = await api.get("/schedule/generate?user_id=1");
                    setSchedule(res.data);
                    console.log("Generated schedule:", res.data);
                    } catch (err: any) {
                    console.error("Error generating schedule:", err);
                    alert("Could not generate schedule — check backend logs.");
                    }
                }}
                >
                Generate Schedule
            </button>

            <div
                style={{
                    display: "grid",
                    gap: 8,
                    maxWidth: 420,
                    marginBottom: 24,
                }}
            >
                <input
                    placeholder="Activity name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <select
                    value={form.tier}
                    onChange={(e) => setForm({ ...form, tier: e.target.value })}
                >
                    <option>Select option</option>
                    <option>Main Quest</option>
                    <option>Side Quest</option>
                    <option>Bonus Round</option>
                    <option>Free Play</option>
                </select>
                <select
                    value={form.priority}
                    onChange={(e) =>
                        setForm({ ...form, priority: e.target.value })
                    }
                >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                </select>
                <input
                    type="number"
                    min={5}
                    step={5}
                    value={form.estimated_minutes}
                    onChange={(e) =>
                        setForm({
                            ...form,
                            estimated_minutes: Number(e.target.value),
                        })
                    }
                />
                <button onClick={create}>Add Activity</button>
            </div>

            <ul style={{ paddingLeft: 16 }}>
                {activities.map((a) => (
                    <li key={a.id}>
                        {a.name} — {a.tier} / {a.priority} (
                        {a.estimated_minutes}m)
                    </li>
                ))}
            </ul>
            {schedule && (
                <div style={{ marginTop: 24 }}>
                    <h2>Today's Schedule</h2>
                    <p>
                    Date: {schedule.date} <br />
                    Available: {schedule.available_minutes}m <br />
                    Used: {schedule.used_minutes}m
                    </p>

                    <ul>
                    {schedule.activities.map((act: any) => (
                        <li key={act.id}>
                        {act.name} — {act.tier} ({act.allocated_minutes}m)
                        </li>
                    ))}
                    </ul>
                </div>
                )}
        </div>
    );
}
