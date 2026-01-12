import { useState, useEffect } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

type Activity = {
  id: number;
  name: string;
  tier: string;
  priority: string;
  estimated_minutes: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showModal, setShowModal] = useState(false);
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-zinc-400 p-6">Loading...</div>;
  }

  useEffect(() => {
    if (loading || !user) return;

    const loadActivities = async () => {
      try {
        const res = await api.get("/activities");

        // 🔒 SAFETY GUARD (THIS IS THE FIX)
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-50">Activities</h1>
            <p className="text-zinc-400">
              Define what you want to spend time on.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2 rounded-md bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 font-medium"
          >
            + Add Activity
          </button>
        </div>

        {/* Empty state */}
        {activities.length === 0 && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center text-zinc-400">
            No activities yet. Add your first activity to get started.
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
                <p className="font-medium text-zinc-100">{activity.name}</p>
                <p className="text-sm text-zinc-400">
                  {activity.tier} • {activity.priority} •{" "}
                  {activity.estimated_minutes} min
                </p>
              </div>
            </li>
          ))}
        </ul>

        {/* Modal */}
        {showModal && (
          <AddActivityModal
            onClose={() => setShowModal(false)}
            onAdd={(activity) => setActivities((prev) => [...prev, activity])}
          />
        )}
      </div>
    </div>
  );
}

function AddActivityModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (activity: Activity) => void;
}) {
  const [name, setName] = useState("");
  const [tier, setTier] = useState("Main Quest");
  const [priority, setPriority] = useState("Medium");
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const res = await api.post<Activity>("/activities", {
        name,
        tier,
        priority,
        estimated_minutes: estimatedMinutes,
      });

      onAdd(res.data);
      onClose();
    } catch (err) {
      console.error("Failed to add activity", err);
      alert("Failed to add activity");
    }
  }

  const inputClass =
    "w-full rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500";

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full max-w-md text-zinc-100">
        <h2 className="text-lg font-semibold mb-4">Add Activity</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-zinc-400">Name</label>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-zinc-400">Tier</label>
            <select
              className={inputClass}
              value={tier}
              onChange={(e) => setTier(e.target.value)}
            >
              <option>Main Quest</option>
              <option>Side Quest</option>
              <option>Bonus Round</option>
              <option>Free Play</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1 text-zinc-400">Priority</label>
            <select
              className={inputClass}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1 text-zinc-400">
              Estimated Minutes
            </label>
            <input
              type="number"
              min={5}
              step={5}
              className={inputClass}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 font-medium"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
