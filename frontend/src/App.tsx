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
    const [error, setError]= useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [lastGenerated, setLastGenerated] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: "",
        tier: "",
        priority: "",
        estimated_hours: 0,
        estimated_minutes: 30,
    });
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const [avail, setAvail] = useState(
        Array.from({ length: 7 }, (_, i) => ({
            day_of_week: i,
            hours: 0,
            minutes: 0,
        }))
    );

    const tierColors: Record<string, string> = {
        "Main Quest": "orange",
        "Side Quest": "deepskyblue",
        "Bonus Round": "mediumseagreen",
        "Free Play": "orchid"
    };

    const priorityOrder: Record<string, number> = { High: 3, Medium: 2, Low: 1 };

    const priorityIcons: Record<string, string> = {
      High: "🔥",
      Medium: "⭐",
      Low: "⬤"
    };

    const tierIcons: Record<string, string> = {
      "Main Quest": "⚔️",
      "Side Quest": "🎒",
      "Bonus Round": "🎁",
      "Free Play": "🧘"
    }

    useEffect(() => {
        const load = async () => {
            // Reset backend first so fresh data is guaranteed
            try {
                await api.delete("/activities/clear");
                await api.delete("/availability/clear");
                console.log("Backend reset — fresh start.");
            } catch (err) {
                console.error("Failed to reset backend:", err);
            }

            // Now fetch activities
            try {
                const actRes = await api.get<Activity[]>("/activities");
                setActivities(actRes.data);
            } catch (err) {
                console.error("Failed to load activities:", err);
            }

            // Now fetch availability
            try {
                const availRes = await api.get<
                    { id: number; day_of_week: number; available_minutes: number }[]
                >("/availability");

                const byDay = new Map(
                    availRes.data.map(r => [r.day_of_week, r.available_minutes])
                );

                setAvail(prev =>
                    prev.map(x => {
                        const total = byDay.get(x.day_of_week) ?? 0;
                        return {
                            ...x,
                            hours: Math.floor(total / 60),
                            minutes: total % 60,
                        };
                    })
                );
            } catch (err) {
                console.error("Failed to load availability:", err);
            }
        };

        load();
    }, []);

	const validateForm = () => {
		if (!form.name.trim()) return "Name is required.";
		if (!form.tier || form.tier === "Select option") return "Choose a tier.";
		if (!form.priority) return "Choose a priority.";
		
		const totalMinutes = form.estimated_hours * 60 + form.estimated_minutes;
		if (totalMinutes < 5) return "Duration must be at least 5 minutes.";
	
		return null;
	};

    const create = async () => {
		const validationError = validateForm();
		if (validationError) {
			setError(validationError);
			return;
		}
		setError(null);

		if (!form.name.trim()) return;

		// Convert to total minutes
		const totalMinutes =
			form.estimated_hours * 60 + form.estimated_minutes;
		try {
		await api.post<Activity>("/activities", {
			name: form.name,
			tier: form.tier,
			priority: form.priority,
			estimated_minutes: totalMinutes,
			user_id: 1
		});

		const res = await api.get<Activity[]>("/activities");
		setActivities(res.data);

		setForm({
			name: "",
			tier: "Main Quest",
			priority: "High",
			estimated_hours: 0,
			estimated_minutes: 30,
		});

		setSuccessMsg("Activity added successfully!");
		setTimeout(() => setSuccessMsg(null), 2000);
		} catch (err) {
		console.error("Error adding activity:", err);
		alert("Failed to add activity — please check your backend.");
		}
  };

    // Save/Load schedule handlers
    const handleSaveSchedule = async () => {
      if (!schedule) return;
      try {
        await api.post("/schedule/save", { ...schedule, user_id: 1 });
        setSuccessMsg("Schedule saved!");
        setTimeout(() => setSuccessMsg(null), 2000);
      } catch (err) {
        console.error("Error saving schedule:", err);
        setError("Failed to save schedule.");
      }
    };

    const handleLoadSchedule = async () => {
      try {
        const res = await api.get("/schedule/load?user_id=1");
        setSchedule(res.data);
        setSuccessMsg("Loaded last saved schedule!");
        setTimeout(() => setSuccessMsg(null), 2000);
      } catch (err) {
        console.error("Error loading schedule:", err);
        setError("Failed to load schedule.");
      }
    };

    const formatMinutes = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
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
                        <div style={{ display: "flex", gap: "4px", justifyContent: "center", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                            <input
                              type="number"
                              min={0}
                              max={12}
                              value={row.hours}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setAvail((curr) =>
                                  curr.map((x) =>
                                    x.day_of_week === row.day_of_week
                                      ? { ...x, hours: val }
                                      : x
                                  )
                                );
                              }}
                              placeholder="H"
                              style={{ width: "50px" }}
                            />
                            <span style={{ fontSize: "0.9rem", color: "#666" }}>h</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                            <input
                              type="number"
                              min={0}
                              max={59}
                              value={row.minutes}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setAvail((curr) =>
                                  curr.map((x) =>
                                    x.day_of_week === row.day_of_week
                                      ? { ...x, minutes: val }
                                      : x
                                  )
                                );
                              }}
                              placeholder="M"
                              style={{ width: "50px" }}
                            />
                            <span style={{ fontSize: "0.9rem", color: "#666" }}>m</span>
                          </div>
                        </div>
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
                      available_minutes: a.hours * 60 + a.minutes
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
                      prev.map((x) => {
                        const total = byDay.get(x.day_of_week) ?? 0;
                        return {
                          ...x,
                          hours: Math.floor(total / 60),
                          minutes: total % 60,
                        };
                      })
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
                        setError(null);
                        setLoading(true);
                        const res = await api.get("/schedule/generate?user_id=1");
                        setSchedule(res.data);
                        const now = new Date();
                        setLastGenerated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                    } catch (err: any) {
                        if (err.response?.status === 404) {
                        setError("You haven’t set your availability for today.");
                        } else {
                        setError("Something went wrong while generating your schedule.");
                        }
                    } finally {
                        setLoading(false);
                    }
                }}
                >
                {loading ? "Generating..." : "Generate Schedule"}
            </button>
            <button
              style={{ marginTop: 12, marginLeft: 8 }}
              onClick={() => {
                setSchedule(null);
                setError(null);
                setLastGenerated(null);
              }}
            >
              Clear Schedule
            </button>
            <button
              style={{ marginTop: 12, marginLeft: 8 }}
              onClick={async () => {
                try {
                  setError(null);
                  setLoading(true);
                  const res = await api.get("/schedule/generate?user_id=1");
                  setSchedule(res.data);
                  const now = new Date();
                  setLastGenerated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                } catch (err: any) {
                  console.error("Error regenerating schedule:", err);
                  setError("Failed to regenerate schedule.");
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? "Regenerating..." : "Regenerate Schedule"}
            </button>
            {/* New Save/Load buttons */}
            <button
              style={{ marginTop: 12, marginLeft: 8 }}
              onClick={handleSaveSchedule}
            >
              Save Schedule
            </button>
            <button
              style={{ marginTop: 12, marginLeft: 8 }}
              onClick={handleLoadSchedule}
            >
              Load Last Schedule
            </button>
            {error && <p style={{ color: "tomato" }}>{error}</p>}

            <div
                style={{
                    display: "grid",
                    gap: 8,
                    maxWidth: 420,
                    marginBottom: 24,
                }}
            >
                {/* Activity Name */}
                <label style={{ fontWeight: 600 }}>Activity Name</label>
                <input
                    placeholder="Enter activity name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                />

                {/* Tier */}
                <label style={{ fontWeight: 600 }}>Tier</label>
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

                {/* Priority */}
                <label style={{ fontWeight: 600 }}>Priority</label>
                <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                </select>

                {/* Estimated Time */}
                <label style={{ fontWeight: 600 }}>Estimated Time</label>
                <div style={{ display: "flex", gap: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <input
                            type="number"
                            min={0}
                            max={12}
                            value={form.estimated_hours}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    estimated_hours: Number(e.target.value),
                                })
                            }
                            style={{ width: "60px" }}
                            placeholder="H"
                        />
                        <span style={{ fontSize: "0.9rem", color: "#666" }}>hours</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <input
                            type="number"
                            min={0}
                            max={59}
                            value={form.estimated_minutes}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    estimated_minutes: Number(e.target.value),
                                })
                            }
                            style={{ width: "60px" }}
                            placeholder="M"
                        />
                        <span style={{ fontSize: "0.9rem", color: "#666" }}>minutes</span>
                    </div>
                </div>

                <button onClick={create}>Add Activity</button>

                {error && <p style={{ color: "tomato" }}>{error}</p>}
            </div>

            {successMsg && <p style={{ color: "limegreen" }}>{successMsg}</p>}
            <ul style={{ paddingLeft: 16 }}>
                {activities.map((a) => (
                    <li key={a.id}>
                      {a.name} — {tierIcons[a.tier]} {a.tier} /
                      {priorityIcons[a.priority]} {a.priority}
                      ({formatMinutes(a.estimated_minutes)})
                    </li>
                ))}
            </ul>
            {schedule && (
                <div style={{ marginTop: 24 }}>
                    <h2>Today's Schedule</h2>
                    <p>
                    Date: {schedule.date} <br />
                    Available: {formatMinutes(schedule.available_minutes)} <br />
                    Used: {formatMinutes(schedule.used_minutes)}
                    </p>

                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: 12,
                      marginTop: 16
                    }}>
                      {(() => {
                        
                        const sortedActivities = [...schedule.activities].sort((a, b) => {
                            const pDiff = (priorityOrder[b.priority] ?? 0) - (priorityOrder[a.priority] ?? 0);
                            if (pDiff !== 0) return pDiff;
                            return (b.allocated_minutes ?? 0) - (a.allocated_minutes ?? 0);
                        });
                        return sortedActivities.map((act: any) => (
                          <div
                            key={act.id}
                            style={{
                              backgroundColor: tierColors[act.tier] || "#333",
                              color: "white",
                              padding: "12px",
                              borderRadius: "8px",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
                            }}
                          > 
                            <h3 style={{ margin: "0 0 6px 0", fontSize: "1.1rem" }}>
                              {act.name}
                            </h3>
                            <p style={{ margin: 0 }}>
                              <strong>{act.tier}</strong> • {act.priority ?? "N/A"} <br />
                              ⏱ {formatMinutes(act.allocated_minutes)}
                            </p>
                          </div>
                        ));
                      })()}
                    </div>
                    {lastGenerated && (
                      <p style={{ color: "#888" }}>
                        Last generated at {lastGenerated}
                      </p>
                    )}
                </div>
                )}
        </div>
    );
}
