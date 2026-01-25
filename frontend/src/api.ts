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

// ===== Schedule Items =====

// TypeScript type for schedule item from API
export type ScheduleItem = {
  id: number;
  activity_id: number;
  day_of_week: number;  // 0=Monday, 6=Sunday
  start_minute: number;  // Minutes from midnight (cumulative for abstract budget)
  end_minute: number;    // Minutes from midnight
};

// TypeScript type for creating new schedule item
export type ScheduleItemCreate = {
  activity_id: number;
  day_of_week: number;
  start_minute: number;
  end_minute: number;
};

// Get all schedule items for current user
export const listScheduleItems = () =>
  api.get<ScheduleItem[]>("/schedule-items");

// Create a new schedule item
export const createScheduleItem = (item: ScheduleItemCreate) =>
  api.post<ScheduleItem>("/schedule-items", item);

// Delete a schedule item by ID
export const deleteScheduleItem = (itemId: number) =>
  api.delete(`/schedule-items/${itemId}`);

// Generate schedule for today only (passes local day of week for timezone accuracy)
export const generateTodaySchedule = () => {
  // Get local day of week (JavaScript: 0=Sunday, Python expects 0=Monday)
  const jsDay = new Date().getDay();
  // Convert: JS Sunday(0) -> Python 6, JS Monday(1) -> Python 0, etc.
  const pythonDay = jsDay === 0 ? 6 : jsDay - 1;
  return api.post(`/schedule/generate-today?day_of_week=${pythonDay}`);
};

// Generate schedule for entire week
export const generateWeekSchedule = () =>
  api.post("/schedule/generate-week");
