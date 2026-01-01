import { useEffect, useState } from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "../components/ui/card";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import WeeklyAvailabilityCard from "@/components/dashboard/WeeklyAvailabilityCard";
import WeeklyTimeline from "@/components/dashboard/WeeklyTimeline";

type Activity = {
    id: number;
    name: string;
    tier: string;
    priority: string;
    estimated_minutes: number;
};

export default function App() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const { user, loading, logout } = useAuth();
    const [schedule, setSchedule] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [lastGenerated, setLastGenerated] = useState<string | null>(null);
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: "",
        tier: "",
        priority: "",
        estimated_hours: 0,
        estimated_minutes: 30,
    });
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
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
        "Free Play": "orchid",
    };

    const priorityOrder: Record<string, number> = {
        High: 3,
        Medium: 2,
        Low: 1,
    };

    const priorityIcons: Record<string, string> = {
        High: "🔥",
        Medium: "⭐",
        Low: "⬤",
    };

    const tierIcons: Record<string, string> = {
        "Main Quest": "⚔️",
        "Side Quest": "🎒",
        "Bonus Round": "🎁",
        "Free Play": "🧘",
    };

    // if (loading) {
    // 	return <div className="text-zinc-400 p-6">Loading...</div>;
    // }

    // if (!user) {
    // 	return <Navigate to="/login" replace />;
    // }
    // if (loading) return <div> Loading user...</div>;
    // if (!user) return <Navigate to="/login" replace />;

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
                    {
                        id: number;
                        day_of_week: number;
                        available_minutes: number;
                    }[]
                >("/availability");

                const byDay = new Map(
                    availRes.data.map((r) => [
                        r.day_of_week,
                        r.available_minutes,
                    ])
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
            } catch (err) {
                console.error("Failed to load availability:", err);
            }
        };

        load();
    }, []);

    const validateForm = () => {
        if (!form.name.trim()) return "Name is required.";
        if (!form.tier || form.tier === "Select option")
            return "Choose a tier.";
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
        const totalMinutes = form.estimated_hours * 60 + form.estimated_minutes;
        try {
            await api.post<Activity>("/activities", {
                name: form.name,
                tier: form.tier,
                priority: form.priority,
                estimated_minutes: totalMinutes,
                user_id: 1,
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
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-zinc-50">
                        TimeForge
                    </h1>
                    <p className="text-zinc-400 max-w-xl">
                        Allocate your limited time across activities and
                        priorities to build an clear, intentional weekly
                        schedule.
                    </p>
                </div>

                <button
                    className="text-sm text-red-400 hover:underline"
                    onClick={async () => {
                        await logout();
                        navigate("/login", { replace: true });
                    }}
                >
                    Logout
                </button>
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-zinc-50">
                        Weekly Availability
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-zinc-100">
                    <WeeklyAvailabilityCard avail={avail} setAvail={setAvail} />
                </CardContent>
            </Card>

            <p className="text-sm text-zinc-400">
                Click a day to block time, or click an exisiting block to edit
                it.
            </p>
            <WeeklyTimeline avail={avail} onSelectDay={setSelectedDay} />

            <div className="pt-4">
                <button className="px-5 py-2 rounded-md bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 font-medium">
                    {selectedDay !== null
                        ? `Block time for ${
                              ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][
                                  selectedDay
                              ]
                          }`
                        : "+ Block Time"}
                </button>
            </div>
        </div>
    );

    // <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 space-y-6">
    //     <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
    //         <CardHeader className="flex flex-row items-center justify-between">
    //             <CardTitle className="text-2xl font-bold text-zinc-50">
    //                 TimeForge Dashboard
    //             </CardTitle>
    //             <button
    //                 className="text-sm text-red-400 hover:underline"
    //                 onClick={async () => {
    //                     await logout();
    //                     navigate("/login", { replace: true });
    //                 }}
    //             >
    //                 Logout
    //             </button>
    //         </CardHeader>
    //     </Card>

    //     <WeeklyAvailabilityCard avail={avail} setAvail={setAvail} />

    //     <button
    //         className="px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition"
    //         style={{ marginTop: 12 }}
    //         onClick={async () => {
    //             try {
    //                 // Ensure correct data shape
    //                 const payload = avail.map((a) => ({
    //                     day_of_week: a.day_of_week,
    //                     available_minutes: a.hours * 60 + a.minutes,
    //                 }));

    //                 await api.post("/availability", payload);
    //                 alert("Availability saved!");

    //                 // Refresh the UI
    //                 const res = await api.get<
    //                     {
    //                         id: number;
    //                         day_of_week: number;
    //                         available_minutes: number;
    //                     }[]
    //                 >("/availability");
    //                 const byDay = new Map(
    //                     res.data.map((r) => [
    //                         r.day_of_week,
    //                         r.available_minutes,
    //                     ])
    //                 );
    //                 setAvail((prev) =>
    //                     prev.map((x) => {
    //                         const total = byDay.get(x.day_of_week) ?? 0;
    //                         return {
    //                             ...x,
    //                             hours: Math.floor(total / 60),
    //                             minutes: total % 60,
    //                         };
    //                     })
    //                 );
    //             } catch (err: any) {
    //                 console.error("Error saving availability:", err);
    //                 alert(
    //                     "Failed to save availability — check console and backend logs."
    //                 );
    //             }
    //         }}
    //     >
    //         Save Availability
    //     </button>
    //     <button
    //         className="px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition"
    //         style={{ marginTop: 12 }}
    //         onClick={async () => {
    //             try {
    //                 setError(null);
    //                 setIsGenerating(true);
    //                 const res = await api.get(
    //                     "/schedule/generate?user_id=1"
    //                 );
    //                 setSchedule(res.data);
    //                 const now = new Date();
    //                 setLastGenerated(
    //                     now.toLocaleTimeString([], {
    //                         hour: "2-digit",
    //                         minute: "2-digit",
    //                     })
    //                 );
    //             } catch (err: any) {
    //                 if (err.response?.status === 404) {
    //                     setError(
    //                         "You haven’t set your availability for today."
    //                     );
    //                 } else {
    //                     setError(
    //                         "Something went wrong while generating your schedule."
    //                     );
    //                 }
    //             } finally {
    //                 setIsGenerating(false);
    //             }
    //         }}
    //     >
    //         {isGenerating ? "Generating..." : "Generate Schedule"}
    //     </button>
    //     <button
    //         className="px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition"
    //         style={{ marginTop: 12, marginLeft: 8 }}
    //         onClick={() => {
    //             setSchedule(null);
    //             setError(null);
    //             setLastGenerated(null);
    //         }}
    //     >
    //         Clear Schedule
    //     </button>
    //     <button
    //         className="px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition"
    //         style={{ marginTop: 12, marginLeft: 8 }}
    //         onClick={async () => {
    //             try {
    //                 setError(null);
    //                 setIsGenerating(true);
    //                 const res = await api.get(
    //                     "/schedule/generate?user_id=1"
    //                 );
    //                 setSchedule(res.data);
    //                 const now = new Date();
    //                 setLastGenerated(
    //                     now.toLocaleTimeString([], {
    //                         hour: "2-digit",
    //                         minute: "2-digit",
    //                     })
    //                 );
    //             } catch (err: any) {
    //                 console.error("Error regenerating schedule:", err);
    //                 setError("Failed to regenerate schedule.");
    //             } finally {
    //                 setIsGenerating(false);
    //             }
    //         }}
    //     >
    //         {isGenerating ? "Regenerating..." : "Regenerate Schedule"}
    //     </button>
    //     {/* New Save/Load buttons */}
    //     <button
    //         className="px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition"
    //         style={{ marginTop: 12, marginLeft: 8 }}
    //         onClick={handleSaveSchedule}
    //     >
    //         Save Schedule
    //     </button>
    //     <button
    //         className="px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition"
    //         style={{ marginTop: 12, marginLeft: 8 }}
    //         onClick={handleLoadSchedule}
    //     >
    //         Load Last Schedule
    //     </button>
    //     {error && <p className="text-red-400">{error}</p>}

    //     <div
    //         style={{
    //             display: "grid",
    //             gap: 8,
    //             maxWidth: 420,
    //             marginBottom: 24,
    //         }}
    //     >
    //         {/* Activity Name */}
    //         <label style={{ fontWeight: 600 }}>Activity Name</label>
    //         <input
    //             placeholder="Enter activity name"
    //             value={form.name}
    //             onChange={(e) => setForm({ ...form, name: e.target.value })}
    //         />

    //         {/* Tier */}
    //         <label style={{ fontWeight: 600 }}>Tier</label>
    //         <select
    //             value={form.tier}
    //             onChange={(e) => setForm({ ...form, tier: e.target.value })}
    //         >
    //             <option>Select option</option>
    //             <option>Main Quest</option>
    //             <option>Side Quest</option>
    //             <option>Bonus Round</option>
    //             <option>Free Play</option>
    //         </select>

    //         {/* Priority */}
    //         <label style={{ fontWeight: 600 }}>Priority</label>
    //         <select
    //             value={form.priority}
    //             onChange={(e) =>
    //                 setForm({ ...form, priority: e.target.value })
    //             }
    //         >
    //             <option>High</option>
    //             <option>Medium</option>
    //             <option>Low</option>
    //         </select>

    //         {/* Estimated Time */}
    //         <label style={{ fontWeight: 600 }}>Estimated Time</label>
    //         <div style={{ display: "flex", gap: "6px" }}>
    //             <div
    //                 style={{
    //                     display: "flex",
    //                     alignItems: "center",
    //                     gap: "4px",
    //                 }}
    //             >
    //                 <input
    //                     type="number"
    //                     min={0}
    //                     max={12}
    //                     value={form.estimated_hours}
    //                     onChange={(e) =>
    //                         setForm({
    //                             ...form,
    //                             estimated_hours: Number(e.target.value),
    //                         })
    //                     }
    //                     style={{ width: "60px" }}
    //                     placeholder="H"
    //                 />
    //                 <span style={{ fontSize: "0.9rem", color: "#666" }}>
    //                     hours
    //                 </span>
    //             </div>

    //             <div
    //                 style={{
    //                     display: "flex",
    //                     alignItems: "center",
    //                     gap: "4px",
    //                 }}
    //             >
    //                 <input
    //                     type="number"
    //                     min={0}
    //                     max={59}
    //                     value={form.estimated_minutes}
    //                     onChange={(e) =>
    //                         setForm({
    //                             ...form,
    //                             estimated_minutes: Number(e.target.value),
    //                         })
    //                     }
    //                     style={{ width: "60px" }}
    //                     placeholder="M"
    //                 />
    //                 <span style={{ fontSize: "0.9rem", color: "#666" }}>
    //                     minutes
    //                 </span>
    //             </div>
    //         </div>

    //         <button onClick={create}>Add Activity</button>

    //         {error && <p className="text-red-400">{error}</p>}
    //     </div>

    //     {successMsg && <p className="text-green-400">{successMsg}</p>}
    //     <ul style={{ paddingLeft: 16 }}>
    //         {activities.map((a) => (
    //             <li key={a.id}>
    //                 {a.name} — {tierIcons[a.tier]} {a.tier} /
    //                 {priorityIcons[a.priority]} {a.priority}(
    //                 {formatMinutes(a.estimated_minutes)})
    //             </li>
    //         ))}
    //     </ul>
    //     {schedule && (
    //         <div style={{ marginTop: 24 }}>
    //             <h2>Today's Schedule</h2>
    //             <p>
    //                 Date: {schedule.date} <br />
    //                 Available: {formatMinutes(
    //                     schedule.available_minutes
    //                 )}{" "}
    //                 <br />
    //                 Used: {formatMinutes(schedule.used_minutes)}
    //             </p>

    //             <div
    //                 style={{
    //                     display: "grid",
    //                     gridTemplateColumns:
    //                         "repeat(auto-fit, minmax(220px, 1fr))",
    //                     gap: 12,
    //                     marginTop: 16,
    //                 }}
    //             >
    //                 {(() => {
    //                     const sortedActivities = [
    //                         ...schedule.activities,
    //                     ].sort((a, b) => {
    //                         const pDiff =
    //                             (priorityOrder[b.priority] ?? 0) -
    //                             (priorityOrder[a.priority] ?? 0);
    //                         if (pDiff !== 0) return pDiff;
    //                         return (
    //                             (b.allocated_minutes ?? 0) -
    //                             (a.allocated_minutes ?? 0)
    //                         );
    //                     });
    //                     return sortedActivities.map((act: any) => (
    //                         <div
    //                             key={act.id}
    //                             style={{
    //                                 backgroundColor:
    //                                     tierColors[act.tier] || "#333",
    //                                 color: "white",
    //                                 padding: "12px",
    //                                 borderRadius: "8px",
    //                                 boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
    //                             }}
    //                         >
    //                             <h3
    //                                 style={{
    //                                     margin: "0 0 6px 0",
    //                                     fontSize: "1.1rem",
    //                                 }}
    //                             >
    //                                 {act.name}
    //                             </h3>
    //                             <p style={{ margin: 0 }}>
    //                                 <strong>{act.tier}</strong> •{" "}
    //                                 {act.priority ?? "N/A"} <br />⏱{" "}
    //                                 {formatMinutes(act.allocated_minutes)}
    //                             </p>
    //                         </div>
    //                     ));
    //                 })()}
    //             </div>
    //             {lastGenerated && (
    //                 <p className="text-zinc-400">
    //                     Last generated at {lastGenerated}
    //                 </p>
    //             )}
    //         </div>
    //     )}
    // </div>
    // );
}
