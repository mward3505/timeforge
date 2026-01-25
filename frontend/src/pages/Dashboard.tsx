import { useEffect, useState } from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "../components/ui/card";
import {
    api,
    listScheduleItems,
    generateTodaySchedule,
    generateWeekSchedule,
    deleteScheduleItem,
    type ScheduleItem
} from "../api";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import WeeklyAvailabilityCard from "@/components/dashboard/WeeklyAvailabilityCard";
import { useTranslation } from "react-i18next";

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

// Helper to translate tier values from database
function translateTier(tier: string, t: (key: string) => string): string {
    const tierMap: Record<string, string> = {
        "Main Quest": t("tiers.mainQuest"),
        "Side Quest": t("tiers.sideQuest"),
        "Bonus Round": t("tiers.bonusRound"),
        "Free Play": t("tiers.freePlay"),
    };
    return tierMap[tier] || tier;
}

export default function Dashboard() {
    const { user, loading: authLoading } = useAuth();
    const { t } = useTranslation();

    const [activities, setActivities] = useState<Activity[]>([]);
    const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const [avail, setAvail] = useState(
        Array.from({ length: 7 }, (_, i) => ({
            day_of_week: i,
            hours: 0,
            minutes: 0,
        }))
    );

    // State for manual activity adding
    const [addingToDayIndex, setAddingToDayIndex] = useState<number | null>(null);
    const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);

    // ✅ Boot loader: only runs AFTER auth is ready
    useEffect(() => {
        if (authLoading || !user) return;

        const boot = async () => {
            setError(null);

            // 1) Load activities (safe array)
            try {
                const actRes = await api.get("/activities");
                setActivities(Array.isArray(actRes.data) ? actRes.data : []);
            } catch (err) {
                console.error("Failed to load activities", err);
                setActivities([]);
            }

            // 2) Load schedule items (safe array)
            try {
                const schedRes = await listScheduleItems();
                setScheduleItems(Array.isArray(schedRes.data) ? schedRes.data : []);
            } catch (err) {
                console.error("Failed to load schedule items", err);
                setScheduleItems([]);
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
            } catch (err: any) {
                // 404 is normal on first use - no availability set yet
                if (err.response?.status !== 404) {
                    console.error("Failed to load availability", err);
                }
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

    // Group schedule items by day and enrich with activity data
    const getScheduleByDay = (dayOfWeek: number) => {
        return scheduleItems
            .filter(item => item.day_of_week === dayOfWeek)
            .map(item => {
                const activity = activities.find(a => a.id === item.activity_id);
                return {
                    scheduleItemId: item.id,
                    activityId: item.activity_id,
                    name: activity?.name || "Unknown Activity",
                    tier: activity?.tier || "Free Play",
                    priority: activity?.priority || "Low",
                    duration: item.end_minute - item.start_minute,
                };
            });
    };

    // Calculate used time for a specific day
    const getUsedMinutes = (dayOfWeek: number) => {
        return scheduleItems
            .filter(item => item.day_of_week === dayOfWeek)
            .reduce((sum, item) => sum + (item.end_minute - item.start_minute), 0);
    };

    // Generate schedule for today
    const handleGenerateToday = async () => {
        try {
            setError(null);
            await generateTodaySchedule();

            // Reload schedule items to show the generated schedule
            const schedRes = await listScheduleItems();
            setScheduleItems(Array.isArray(schedRes.data) ? schedRes.data : []);

            setSuccessMsg("Today's schedule generated!");
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
            console.error("Error generating today's schedule:", err);
            setError(err.response?.data?.detail || "Failed to generate schedule. Make sure you have set your availability and created activities.");
        }
    };

    // Generate schedule for entire week
    const handleGenerateWeek = async () => {
        try {
            setError(null);
            await generateWeekSchedule();

            // Reload schedule items to show the generated schedule
            const schedRes = await listScheduleItems();
            setScheduleItems(Array.isArray(schedRes.data) ? schedRes.data : []);

            setSuccessMsg("Weekly schedule generated!");
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
            console.error("Error generating weekly schedule:", err);
            setError(err.response?.data?.detail || "Failed to generate schedule. Make sure you have set your availability and created activities.");
        }
    };

    // Delete activity from schedule
    const handleDeleteScheduleItem = async (itemId: number) => {
        try {
            await deleteScheduleItem(itemId);

            // Remove from local state
            setScheduleItems(prev => prev.filter(item => item.id !== itemId));

            setSuccessMsg("Activity removed from schedule!");
            setTimeout(() => setSuccessMsg(null), 2000);
        } catch (err) {
            console.error("Error deleting schedule item:", err);
            setError("Failed to remove activity.");
        }
    };

    // Save availability
    const handleSaveAvailability = async () => {
        try {
            setError(null);
            const payload = avail.map((a) => ({
                day_of_week: a.day_of_week,
                available_minutes: a.hours * 60 + a.minutes,
            }));

            console.log("Saving availability:", payload);
            const response = await api.post("/availability", payload);
            console.log("Save response:", response);

            setSuccessMsg("Availability saved!");
            setTimeout(() => setSuccessMsg(null), 2000);
        } catch (err: any) {
            console.error("Error saving availability:", err);
            console.error("Error response:", err.response?.data);
            setError(err.response?.data?.detail || "Failed to save availability. Please make sure you're logged in.");
        }
    };

    // Clear all scheduled activities
    const handleClearSchedule = async () => {
        if (!confirm("Are you sure you want to clear all scheduled activities? This cannot be undone.")) {
            return;
        }

        try {
            setError(null);

            // Delete all schedule items
            const deletePromises = scheduleItems.map(item => deleteScheduleItem(item.id));
            await Promise.all(deletePromises);

            // Clear local state
            setScheduleItems([]);

            setSuccessMsg("Schedule cleared!");
            setTimeout(() => setSuccessMsg(null), 2000);
        } catch (err: any) {
            console.error("Error clearing schedule:", err);
            setError("Failed to clear schedule.");
        }
    };

    // Add activity manually to a specific day
    const handleAddActivity = async (dayOfWeek: number, activityId: number) => {
        try {
            setError(null);

            // Find the selected activity to get its duration
            const activity = activities.find(a => a.id === activityId);
            if (!activity) {
                setError("Activity not found");
                return;
            }

            // Calculate time budget for this day
            const availableMinutes = avail.find(a => a.day_of_week === dayOfWeek);
            const totalAvailable = availableMinutes ? (availableMinutes.hours * 60 + availableMinutes.minutes) : 0;
            const usedMinutes = getUsedMinutes(dayOfWeek);
            const activityDuration = activity.estimated_minutes;

            // Warn user if adding this activity will exceed available time
            if (usedMinutes + activityDuration > totalAvailable) {
                const overageMinutes = (usedMinutes + activityDuration) - totalAvailable;
                const dayName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][dayOfWeek];

                if (!confirm(
                    `Adding "${activity.name}" will exceed your available time for ${dayName} by ${formatMinutes(overageMinutes)}.\n\nAdd anyway?`
                )) {
                    // User cancelled - close the form
                    setAddingToDayIndex(null);
                    setSelectedActivityId(null);
                    return;
                }
            }

            // Calculate start_minute as the cumulative time already used on this day
            // Create the schedule item with cumulative time tracking
            const newItem = {
                activity_id: activityId,
                day_of_week: dayOfWeek,
                start_minute: usedMinutes,  // Start where previous activities ended
                end_minute: usedMinutes + activityDuration  // Add duration
            };

            // Call API to create schedule item
            const response = await api.post<ScheduleItem>("/schedule-items", newItem);

            // Add to local state so UI updates immediately
            setScheduleItems(prev => [...prev, response.data]);

            // Close the modal and reset selection
            setAddingToDayIndex(null);
            setSelectedActivityId(null);

            setSuccessMsg("Activity added to schedule!");
            setTimeout(() => setSuccessMsg(null), 2000);
        } catch (err: any) {
            console.error("Error adding activity:", err);
            setError(err.response?.data?.detail || "Failed to add activity.");
        }
    };

    // ---- auth gates ----
    if (authLoading) {
        return <div className="text-zinc-400 p-6">{t("dashboard.loadingUser")}</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 space-y-6">
            {/* Page header */}
            <div className="space-y-1">
                <h2 className="text-2xl font-semibold text-zinc-100">
                    {t("dashboard.weeklySchedule")}
                </h2>
                <p className="text-zinc-400 max-w-2xl">
                    {t("dashboard.weeklyScheduleDesc")}
                </p>
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-zinc-50">
                        {t("dashboard.weeklyAvailability")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-zinc-100">
                    <WeeklyAvailabilityCard avail={avail} setAvail={setAvail} />
                    <div className="mt-4">
                        <button
                            onClick={handleSaveAvailability}
                            className="px-4 py-2 rounded-md bg-zinc-700 hover:bg-zinc-600 text-zinc-100 border border-zinc-600 font-medium transition"
                        >
                            {t("dashboard.saveAvailability")}
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* Generate Schedule Buttons */}
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleGenerateToday}
                        className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium transition"
                        title={t("dashboard.generateTodayTooltip") || "Auto-fill today's column with activities based on your available time"}
                    >
                        {t("dashboard.generateToday")}
                    </button>
                    <button
                        onClick={handleGenerateWeek}
                        className="px-5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition"
                        title={t("dashboard.generateWeekTooltip") || "Auto-fill all days with activities based on your weekly availability"}
                    >
                        {t("dashboard.generateWeek")}
                    </button>
                    {scheduleItems.length > 0 && (
                        <button
                            onClick={handleClearSchedule}
                            className="px-5 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white font-medium transition"
                        >
                            {t("dashboard.clearSchedule")}
                        </button>
                    )}
                    {scheduleItems.length > 0 && (
                        <span className="text-sm text-zinc-400">
                            {scheduleItems.length} {t("dashboard.activitiesScheduled")}
                        </span>
                    )}
                </div>
                <p className="text-sm text-zinc-500">
                    <strong>{t("dashboard.generateToday")}</strong> {t("dashboard.generateTodayDesc")}
                    <strong className="ml-2">{t("dashboard.generateWeek")}</strong> {t("dashboard.generateWeekDesc")}
                </p>
            </div>

            {/* Scheduled Activities by Day - Calendar Style */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-zinc-50">
                            {t("dashboard.yourWeeklySchedule")}
                        </CardTitle>
                        <div className="flex items-center gap-3 text-xs">
                            <span className="text-zinc-400">{t("tiers.label")}:</span>
                            <span className="px-2 py-1 rounded bg-yellow-900/30 border border-yellow-800/50 text-yellow-300">{t("tiers.mainQuest")}</span>
                            <span className="px-2 py-1 rounded bg-blue-900/30 border border-blue-800/50 text-blue-300">{t("tiers.sideQuest")}</span>
                            <span className="px-2 py-1 rounded bg-purple-900/30 border border-purple-800/50 text-purple-300">{t("tiers.bonusRound")}</span>
                            <span className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-400">{t("tiers.freePlay")}</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="text-zinc-100">
                    <div className="grid grid-cols-7 gap-3">
                        {["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((dayKey, dayIndex) => {
                            const dayName = t(`dashboard.days.${dayKey}`);
                            const daySchedule = getScheduleByDay(dayIndex);
                            const availableMinutes = avail.find(a => a.day_of_week === dayIndex);
                            const totalAvailable = availableMinutes ? (availableMinutes.hours * 60 + availableMinutes.minutes) : 0;
                            const usedMinutes = getUsedMinutes(dayIndex);
                            const isOverBudget = totalAvailable > 0 && usedMinutes > totalAvailable;
                            const overage = isOverBudget ? usedMinutes - totalAvailable : 0;

                            return (
                                <div key={dayIndex} className={`border rounded-lg p-3 bg-zinc-900/50 ${
                                    isOverBudget ? 'border-red-800' : 'border-zinc-800'
                                }`}>
                                    {/* Day header */}
                                    <div className="mb-2 pb-2 border-b border-zinc-800">
                                        <div className="font-semibold text-zinc-100 text-center">{dayName}</div>
                                        {totalAvailable > 0 && (
                                            <div className={`text-xs text-center mt-1 ${
                                                isOverBudget ? 'text-red-400 font-medium' : 'text-zinc-500'
                                            }`}>
                                                {isOverBudget ? (
                                                    <>
                                                        {formatMinutes(usedMinutes)} / {formatMinutes(totalAvailable)}
                                                        <div className="text-xs text-red-400">
                                                            ⚠️ {formatMinutes(overage)} over
                                                        </div>
                                                    </>
                                                ) : (
                                                    `${formatMinutes(usedMinutes)} / ${formatMinutes(totalAvailable)}`
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Activities for this day */}
                                    <div className="space-y-2 min-h-[100px]">
                                        {daySchedule.length === 0 ? (
                                            <div className="text-xs text-zinc-600 text-center py-4">{t("dashboard.noActivities")}</div>
                                        ) : (
                                            daySchedule.map((item) => (
                                                <div
                                                    key={item.scheduleItemId}
                                                    className={`p-2 rounded text-xs ${
                                                        item.tier === "Main Quest" ? "bg-yellow-900/30 border border-yellow-800/50" :
                                                        item.tier === "Side Quest" ? "bg-blue-900/30 border border-blue-800/50" :
                                                        item.tier === "Bonus Round" ? "bg-purple-900/30 border border-purple-800/50" :
                                                        "bg-zinc-800 border border-zinc-700"
                                                    }`}
                                                >
                                                    <div className="font-medium text-zinc-100 mb-1 truncate" title={item.name}>
                                                        {item.name}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs mb-1">
                                                        <span className={`px-1.5 py-0.5 rounded ${
                                                            item.tier === "Main Quest" ? "bg-yellow-800/50 text-yellow-300" :
                                                            item.tier === "Side Quest" ? "bg-blue-800/50 text-blue-300" :
                                                            item.tier === "Bonus Round" ? "bg-purple-800/50 text-purple-300" :
                                                            "bg-zinc-700 text-zinc-400"
                                                        }`}>
                                                            {translateTier(item.tier, t)}
                                                        </span>
                                                        <span className="text-zinc-400">
                                                            {formatMinutes(item.duration)}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteScheduleItem(item.scheduleItemId)}
                                                        className="text-red-400 hover:text-red-300 text-xs mt-1"
                                                    >
                                                        {t("dashboard.remove")}
                                                    </button>
                                                </div>
                                            ))
                                        )}

                                        {/* Add Activity Button/Form */}
                                        {addingToDayIndex === dayIndex ? (
                                            // Show dropdown form when adding to this day
                                            <div className="p-2 bg-zinc-800/50 border border-zinc-700 rounded space-y-2">
                                                <select
                                                    value={selectedActivityId || ""}
                                                    onChange={(e) => setSelectedActivityId(Number(e.target.value))}
                                                    className="w-full bg-zinc-800 text-zinc-100 border border-zinc-700 rounded px-2 py-1 text-xs"
                                                >
                                                    <option value="">{t("dashboard.selectActivity")}</option>
                                                    {activities.map(activity => (
                                                        <option key={activity.id} value={activity.id}>
                                                            {activity.name} ({formatMinutes(activity.estimated_minutes)})
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            if (selectedActivityId) {
                                                                handleAddActivity(dayIndex, selectedActivityId);
                                                            }
                                                        }}
                                                        disabled={!selectedActivityId}
                                                        className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-xs rounded transition"
                                                    >
                                                        {t("common.add")}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setAddingToDayIndex(null);
                                                            setSelectedActivityId(null);
                                                        }}
                                                        className="flex-1 px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded transition"
                                                    >
                                                        {t("common.cancel")}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            // Show "+ Add Activity" button
                                            <button
                                                onClick={() => setAddingToDayIndex(dayIndex)}
                                                className="w-full p-2 border border-dashed border-zinc-700 hover:border-zinc-600 rounded text-xs text-zinc-500 hover:text-zinc-400 transition"
                                            >
                                                {t("dashboard.addActivity")}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Feedback messages */}
            {error && (
                <div className="bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}
            {successMsg && (
                <div className="bg-green-900/20 border border-green-800 text-green-300 px-4 py-3 rounded-lg">
                    {successMsg}
                </div>
            )}
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
