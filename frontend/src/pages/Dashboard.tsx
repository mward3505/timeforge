import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { api, getTimeBlocks } from "../api";
import { useAuth } from "../context/AuthContext";
import { Navigate, useNavigate, Link } from "react-router-dom";
import WeeklyAvailabilityCard from "@/components/dashboard/WeeklyAvailabilityCard";
import WeeklyTimeline from "@/components/dashboard/WeeklyTimeline";

type Activity = {
  id: number;
  name: string;
  tier: string;
  priority: string;
  estimated_minutes: number;
};

type AvailabilityRow = {
  id: number;
  day_of_week: number;
  available_minutes: number;
};

export default function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<any[]>([]);
  const [blocksLoading, setBlocksLoading] = useState<boolean>(true);

  const [schedule, setSchedule] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);

  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const [avail, setAvail] = useState(
    Array.from({ length: 7 }, (_, i) => ({
      day_of_week: i,
      hours: 0,
      minutes: 0,
    }))
  );

  // ✅ Boot loader: only runs AFTER auth is ready
  useEffect(() => {
    if (authLoading || !user) return;

    const boot = async () => {
      setError(null);
      setBlocksLoading(true);

      // 1) Load time blocks (safe array)
      try {
        const blocks = await getTimeBlocks();
        setTimeBlocks(Array.isArray(blocks) ? blocks : []);
      } catch (err) {
        console.error("Failed to load time blocks", err);
        setTimeBlocks([]);
      } finally {
        setBlocksLoading(false);
      }

      // 2) Load activities (safe array)
      try {
        const actRes = await api.get("/activities");
        setActivities(Array.isArray(actRes.data) ? actRes.data : []);
      } catch (err) {
        console.error("Failed to load activities", err);
        setActivities([]);
      }

      // 3) Load availability (safe array)
      try {
        const availRes = await api.get("/availability");
        const rows: AvailabilityRow[] = Array.isArray(availRes.data)
          ? availRes.data
          : [];

        const byDay = new Map<number, number>(
          rows.map((r) => [r.day_of_week, r.available_minutes])
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
        console.error("Failed to load availability", err);
        // keep default 0s
      }
    };

    boot();
  }, [authLoading, user]);

  // ---- helpers ----
  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  // Save/Load schedule handlers (keeping your existing behavior)
  const handleSaveSchedule = async () => {
    if (!schedule) return;
    try {
      await api.post("/schedule/save", schedule);
      setSuccessMsg("Schedule saved!");
      setTimeout(() => setSuccessMsg(null), 2000);
    } catch (err) {
      console.error("Error saving schedule:", err);
      setError("Failed to save schedule.");
    }
  };

  const handleLoadSchedule = async () => {
    try {
      const res = await api.get("/schedule/load");
      setSchedule(res.data);
      setSuccessMsg("Loaded last saved schedule!");
      setTimeout(() => setSuccessMsg(null), 2000);
    } catch (err) {
      console.error("Error loading schedule:", err);
      setError("Failed to load schedule.");
    }
  };

  // ---- auth gates ----
  if (authLoading) {
    return <div className="text-zinc-400 p-6">Loading user...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-zinc-50">TimeForge</h1>
          <p className="text-zinc-400 max-w-xl">
            Allocate your limited time across activities and priorities to build
            a clear, intentional weekly schedule.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/activities"
            className="px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-sm"
          >
            Activities
          </Link>

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
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-50">Weekly Availability</CardTitle>
        </CardHeader>
        <CardContent className="text-zinc-100">
          <WeeklyAvailabilityCard avail={avail} setAvail={setAvail} />
        </CardContent>
      </Card>

      <p className="text-sm text-zinc-400">
        Click a day to block time, or click an existing block to edit it.
      </p>

      <WeeklyTimeline
        avail={avail}
        timeBlocks={Array.isArray(timeBlocks) ? timeBlocks : []}
        loading={blocksLoading}
        onSelectDay={setSelectedDay}
      />

      <div className="pt-4">
        <button className="px-5 py-2 rounded-md bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 font-medium">
          {selectedDay !== null
            ? `Block time for ${
                ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][selectedDay]
              }`
            : "+ Block Time"}
        </button>
      </div>

      {/* Optional feedback area */}
      {error && <p className="text-red-400">{error}</p>}
      {successMsg && <p className="text-green-400">{successMsg}</p>}
      {lastGenerated && (
        <p className="text-zinc-400">Last generated at {lastGenerated}</p>
      )}

      {/* (Keeping schedule buttons if you wire them back into UI later) */}
      {/* <button onClick={handleSaveSchedule}>Save</button>
      <button onClick={handleLoadSchedule}>Load</button> */}
    </div>
  );
}

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
