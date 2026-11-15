import { createClient } from "@supabase/supabase-js";
import { cloudConfig } from "./cloud-config.js";

const url = import.meta.env?.VITE_SUPABASE_URL || cloudConfig.url;
const key = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || cloudConfig.publishableKey;
export const cloud = url && key ? createClient(url, key) : null;
export const SETTINGS_KEY = "chanmyay.display.v1";
export function readSettings() {
  const raw = localStorage.getItem(SETTINGS_KEY);
  const value = raw ? JSON.parse(raw) : {};
  if (!value || typeof value !== "object" || (value.eventName !== undefined && typeof value.eventName !== "string"))
    throw new Error("Saved TV settings could not be read.");
  return { eventName: value.eventName || "", version: value.version || 0 };
}
export function fromRow(row) {
  return {
    id: row.id, name: row.name, phone: row.phone || "", dedication: row.dedication || "",
    startDate: row.start_date, endDate: row.end_date, categories: row.categories,
    status: row.status, createdAt: row.created_at, updatedAt: row.updated_at, version: row.version,
  };
}
export function toRow(donor) {
  return { id: donor.id, name: donor.name, phone: donor.phone, dedication: donor.dedication,
    start_date: donor.startDate, end_date: donor.endDate, categories: donor.categories, status: donor.status };
}
export async function loadShared(isTv, date) {
  if (isTv) {
    const { data, error } = await cloud.rpc("cm_tv_display", { p_date: date });
    if (error) throw error;
    return { donors: data.donors.map(fromRow), settings: { eventName: data.event_name || "", version: 0 } };
  }
  const donors = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await cloud.from("cm_offerings").select("*").order("id").range(from, from + 999);
    if (error) throw error;
    donors.push(...data.map(fromRow));
    if (data.length < 1000) break;
  }
  const { data, error } = await cloud.from("cm_display_settings").select("*").eq("id", 1).single();
  if (error) throw error;
  return { donors, settings: { eventName: data.event_name, version: data.version } };
}
