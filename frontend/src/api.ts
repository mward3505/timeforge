import axios from "axios";

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
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