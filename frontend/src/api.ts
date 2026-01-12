import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Availability types
export type Availability = {
  id: number;
  day_of_week: number;
  available_minutes: number;
};

export type AvailabilityUpsert = {
  day_of_week: number;
  available_minutes: number;
};

// API calls
export const listAvailability = () =>
  api.get<Availability[]>("/availability");

export const saveAvailability = (rows: AvailabilityUpsert[]) =>
  api.post<Availability[]>("/availability", rows);

export const saveSchedule = (schedule: any) =>
  api.post("/schedule/save", schedule);

export const loadSchedule = (userID: number) =>
  api.get(`/schedule/load?user_id=${userID}`);

export const getTimeBlocks = async () => {
  const res = await api.get("/time-blocks");
  return res.data;
};
