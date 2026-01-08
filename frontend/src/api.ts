import axios from "axios";

export const api = axios.create({
    baseURL: "https://timeforge-production.up.railway.app",
});

// Availability types
export type Availability = { id: number; day_of_week: number; available_minutes: number };
export type AvailabilityUpsert = { day_of_week: number; available_minutes: number };

// API calls
export const listAvailability = () => api.get<Availability[]>("/availability");
export const saveAvailability = (rows: AvailabilityUpsert[]) =>
    api.post<Availability[]>("/availability", rows);

export const saveSchedule = (schedule: any) =>
    api.post("/schedule/save", schedule);

export const loadScheďule = (userID: number) =>
    api.get(`/schedule/load?user_id=${userID}`);

export async function getTimeBlocks() {
    const res = await fetch("/time-blocks", {
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Failed to load time blocks");
    }

    return res.json();
}