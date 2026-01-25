import { useState, useEffect } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

type Activity = {
    id: number;
    name: string;
    tier: string;
    priority: string;
    estimated_minutes: number;
};

// Helper to translate tier/priority values from database
function translateTier(tier: string, t: (key: string) => string): string {
    const tierMap: Record<string, string> = {
        "Main Quest": t("tiers.mainQuest"),
        "Side Quest": t("tiers.sideQuest"),
        "Bonus Round": t("tiers.bonusRound"),
        "Free Play": t("tiers.freePlay"),
    };
    return tierMap[tier] || tier;
}

function translatePriority(priority: string, t: (key: string) => string): string {
    const priorityMap: Record<string, string> = {
        "High": t("priority.high"),
        "Medium": t("priority.medium"),
        "Low": t("priority.low"),
    };
    return priorityMap[priority] || priority;
}

export default function Activities() {
    const { user, loading } = useAuth();
    const { t } = useTranslation();

    const [activities, setActivities] = useState<Activity[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingActivity, setEditingActivity] = useState<Activity | null>(
        null
    );

    // -----------------------------
    // Load activities
    // -----------------------------
    useEffect(() => {
        if (loading || !user) return;

        const loadActivities = async () => {
            try {
                const res = await api.get("/activities");
                if (Array.isArray(res.data)) {
                    setActivities(res.data);
                } else {
                    console.error("Unexpected activities response:", res.data);
                    setActivities([]);
                }
            } catch (err) {
                console.error("Failed to load activities", err);
                setActivities([]);
            }
        };

        loadActivities();
    }, [loading, user]);

    // -----------------------------
    // Delete activity
    // -----------------------------
    const deleteActivity = async (id: number) => {
        try {
            await api.delete(`/activities/${id}`);
            setActivities((prev) => prev.filter((a) => a.id !== id));
        } catch (err) {
            console.error("Failed to delete activity", err);
            alert("Failed to delete activity");
        }
    };

    if (loading) {
        return <div className="text-zinc-400 p-6">{t("common.loading")}</div>;
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-50">
                            {t("activities.title")}
                        </h1>
                        <p className="text-zinc-400">
                            {t("activities.description")}
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            setEditingActivity(null);
                            setShowModal(true);
                        }}
                        className="px-5 py-2 rounded-md bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 font-medium"
                    >
                        {t("activities.addActivity")}
                    </button>
                </div>

                {/* Empty state */}
                {activities.length === 0 && (
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center text-zinc-400">
                        {t("activities.emptyState")}
                    </div>
                )}

                {/* Activity list */}
                <ul className="space-y-3">
                    {activities.map((activity) => (
                        <li
                            key={activity.id}
                            className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 flex justify-between items-center"
                        >
                            <div>
                                <p className="font-medium text-zinc-100">
                                    {activity.name}
                                </p>
                                <p className="text-sm text-zinc-400">
                                    {translateTier(activity.tier, t)} • {translatePriority(activity.priority, t)} •{" "}
                                    {activity.estimated_minutes} min
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setEditingActivity(activity);
                                        setShowModal(true);
                                    }}
                                    className="text-sm text-zinc-400 hover:text-zinc-100"
                                >
                                    {t("common.edit")}
                                </button>

                                <button
                                    onClick={() => deleteActivity(activity.id)}
                                    className="text-sm text-red-400 hover:text-red-300"
                                >
                                    {t("common.delete")}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>

                {/* Modal */}
                {showModal && (
                    <AddActivityModal
                        editing={editingActivity}
                        onClose={() => {
                            setShowModal(false);
                            setEditingActivity(null);
                        }}
                        onSave={(activity) => {
                            setActivities((prev) =>
                                prev.map((a) =>
                                    a.id === activity.id ? activity : a
                                )
                            );
                        }}
                        onCreate={(activity) => {
                            setActivities((prev) => [...prev, activity]);
                        }}
                    />
                )}
            </div>
        </div>
    );
}

// =======================================================
// Modal
// =======================================================

function AddActivityModal({
    onClose,
    onCreate,
    onSave,
    editing,
}: {
    onClose: () => void;
    onCreate: (activity: Activity) => void;
    onSave: (activity: Activity) => void;
    editing?: Activity | null;
}) {
    const { t } = useTranslation();
    const [name, setName] = useState(editing?.name ?? "");
    const [tier, setTier] = useState(editing?.tier ?? "Main Quest");
    const [priority, setPriority] = useState(editing?.priority ?? "Medium");
    const [estimatedMinutes, setEstimatedMinutes] = useState(
        editing?.estimated_minutes ?? 60
    );

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        try {
            if (editing) {
                // ✅ UPDATE
                const res = await api.put<Activity>(
                    `/activities/${editing.id}`,
                    {
                        name,
                        tier,
                        priority,
                        estimated_minutes: estimatedMinutes,
                    }
                );
                onSave(res.data);
            } else {
                // ✅ CREATE
                const res = await api.post<Activity>("/activities", {
                    name,
                    tier,
                    priority,
                    estimated_minutes: estimatedMinutes,
                });
                onCreate(res.data);
            }

            onClose();
        } catch (err) {
            console.error("Failed to save activity", err);
            alert("Failed to save activity");
        }
    }

    const inputClass =
        "w-full rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500";

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full max-w-md text-zinc-100">
                <h2 className="text-lg font-semibold mb-4">
                    {editing ? t("activities.editActivity") : t("activities.addActivity")}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm mb-1 text-zinc-400">
                            {t("activities.name")}
                        </label>
                        <input
                            className={inputClass}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1 text-zinc-400">
                            {t("activities.tier")}
                        </label>
                        <select
                            className={inputClass}
                            value={tier}
                            onChange={(e) => setTier(e.target.value)}
                        >
                            <option value="Main Quest">{t("tiers.mainQuest")}</option>
                            <option value="Side Quest">{t("tiers.sideQuest")}</option>
                            <option value="Bonus Round">{t("tiers.bonusRound")}</option>
                            <option value="Free Play">{t("tiers.freePlay")}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm mb-1 text-zinc-400">
                            {t("activities.priority")}
                        </label>
                        <select
                            className={inputClass}
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                        >
                            <option value="High">{t("priority.high")}</option>
                            <option value="Medium">{t("priority.medium")}</option>
                            <option value="Low">{t("priority.low")}</option>
                        </select>
                        <p className="text-xs text-zinc-500 mt-1">
                            {t("activities.priorityHint")}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm mb-1 text-zinc-400">
                            {t("activities.estimatedMinutes")}
                        </label>
                        <input
                            type="number"
                            min={5}
                            step={5}
                            className={inputClass}
                            value={estimatedMinutes}
                            onChange={(e) =>
                                setEstimatedMinutes(Number(e.target.value))
                            }
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-md border border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
                        >
                            {t("common.cancel")}
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-md bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 font-medium"
                        >
                            {editing ? t("common.save") : t("common.add")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
