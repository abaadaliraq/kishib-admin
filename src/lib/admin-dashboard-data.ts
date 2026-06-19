import "server-only";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type ProfileAnalyticsRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  country: string | null;
  province: string | null;
  city: string | null;
  provider: string | null;
  gender: string | null;
  app_language: string | null;
  device_locale: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type EvaluationAdminRow = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  user_phone: string | null;
  user_country: string | null;
  user_city: string | null;
  user_province: string | null;
  title: string | null;
  locale: string | null;
  item_type: string | null;
  image_url: string | null;
  cloudinary_public_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CountBucket = {
  label: string;
  count: number;
};

export type UserActivityRow = {
  user_id: string;
  last_seen_at: string | null;
  current_page: string | null;
  platform: string | null;
  app_version: string | null;
  device_locale: string | null;
  updated_at: string | null;
};

const profileBaseColumns =
  "id,email,full_name,avatar_url,phone,country,city,province,provider,created_at,updated_at";

const profileAnalyticsColumns =
  "id,email,full_name,avatar_url,phone,country,city,province,provider,gender,app_language,device_locale,created_at,updated_at";

const evaluationColumns =
  "id,user_id,user_email,user_name,user_phone,user_country,user_city,user_province,title,locale,item_type,image_url,cloudinary_public_id,created_at,updated_at";

const userActivityColumns =
  "user_id,last_seen_at,current_page,platform,app_version,device_locale,updated_at";

function textField(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : null;
}

function profileFromUnknown(value: unknown): ProfileAnalyticsRow | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = textField(record, "id");
  if (!id) return null;

  return {
    id,
    email: textField(record, "email"),
    full_name: textField(record, "full_name"),
    avatar_url: textField(record, "avatar_url"),
    phone: textField(record, "phone"),
    country: textField(record, "country"),
    province: textField(record, "province"),
    city: textField(record, "city"),
    provider: textField(record, "provider"),
    gender: textField(record, "gender"),
    app_language: textField(record, "app_language"),
    device_locale: textField(record, "device_locale"),
    created_at: textField(record, "created_at"),
    updated_at: textField(record, "updated_at"),
  };
}

function evaluationFromUnknown(value: unknown): EvaluationAdminRow | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = textField(record, "id");
  if (!id) return null;

  return {
    id,
    user_id: textField(record, "user_id"),
    user_email: textField(record, "user_email"),
    user_name: textField(record, "user_name"),
    user_phone: textField(record, "user_phone"),
    user_country: textField(record, "user_country"),
    user_city: textField(record, "user_city"),
    user_province: textField(record, "user_province"),
    title: textField(record, "title"),
    locale: textField(record, "locale"),
    item_type: textField(record, "item_type"),
    image_url: textField(record, "image_url"),
    cloudinary_public_id: textField(record, "cloudinary_public_id"),
    created_at: textField(record, "created_at"),
    updated_at: textField(record, "updated_at"),
  };
}

function userActivityFromUnknown(value: unknown): UserActivityRow | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const userId = textField(record, "user_id");
  if (!userId) return null;

  return {
    user_id: userId,
    last_seen_at: textField(record, "last_seen_at"),
    current_page: textField(record, "current_page"),
    platform: textField(record, "platform"),
    app_version: textField(record, "app_version"),
    device_locale: textField(record, "device_locale"),
    updated_at: textField(record, "updated_at"),
  };
}

function parseProfiles(data: unknown) {
  return (Array.isArray(data) ? data : [])
    .map(profileFromUnknown)
    .filter((profile): profile is ProfileAnalyticsRow => Boolean(profile));
}

function parseEvaluations(data: unknown) {
  return (Array.isArray(data) ? data : [])
    .map(evaluationFromUnknown)
    .filter((evaluation): evaluation is EvaluationAdminRow => Boolean(evaluation));
}

function parseUserActivity(data: unknown) {
  return (Array.isArray(data) ? data : [])
    .map(userActivityFromUnknown)
    .filter((activity): activity is UserActivityRow => Boolean(activity));
}

export function cleanValue(value: string | null | undefined) {
  const cleaned = value?.trim();
  return cleaned || null;
}

export function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}

export function getLanguageLabel(profile: Pick<ProfileAnalyticsRow, "app_language" | "device_locale">) {
  return cleanValue(profile.app_language) || cleanValue(profile.device_locale);
}

export function aggregateValues(values: Array<string | null | undefined>, limit = 8): CountBucket[] {
  const counts = new Map<string, number>();

  values.forEach((value) => {
    const label = cleanValue(value);
    if (!label) return;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

export async function fetchProfilesForAdmin(ids?: string[]) {
  const supabase = createAdminSupabaseClient();
  const uniqueIds = Array.from(new Set((ids ?? []).filter(Boolean)));

  async function runSelect(columns: string) {
    let query = supabase.from("profiles").select(columns);

    if (uniqueIds.length > 0) {
      query = query.in("id", uniqueIds);
    }

    return query;
  }

  try {
    const { data, error } = await runSelect(profileAnalyticsColumns);

    if (!error) {
      return parseProfiles(data);
    }

    const fallback = await runSelect(profileBaseColumns);
    if (fallback.error) {
      return [];
    }

    return parseProfiles(fallback.data);
  } catch {
    return [];
  }
}

export async function fetchEvaluationsForAdmin(limit = 200) {
  const supabase = createAdminSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("evaluations")
      .select(evaluationColumns)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return [];
    }

    return parseEvaluations(data);
  } catch {
    return [];
  }
}

export async function fetchUserActivityForAdmin() {
  const supabase = createAdminSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("user_activity")
      .select(userActivityColumns)
      .order("last_seen_at", { ascending: false });

    if (error) {
      return { rows: [], available: false };
    }

    return { rows: parseUserActivity(data), available: true };
  } catch {
    return { rows: [], available: false };
  }
}

export function activitySummary(rows: UserActivityRow[]) {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  const thirtyMinutes = 30 * 60 * 1000;
  const day = 24 * 60 * 60 * 1000;
  const sevenDays = 7 * day;

  return {
    activeNow: rows.filter((row) => {
      const seen = row.last_seen_at ? new Date(row.last_seen_at).getTime() : 0;
      return Number.isFinite(seen) && now - seen <= fiveMinutes;
    }).length,
    activeLast30Minutes: rows.filter((row) => {
      const seen = row.last_seen_at ? new Date(row.last_seen_at).getTime() : 0;
      return Number.isFinite(seen) && now - seen <= thirtyMinutes;
    }).length,
    activeToday: rows.filter((row) => {
      const seen = row.last_seen_at ? new Date(row.last_seen_at).getTime() : 0;
      return Number.isFinite(seen) && now - seen <= day;
    }).length,
    inactive7Days: rows.filter((row) => {
      const seen = row.last_seen_at ? new Date(row.last_seen_at).getTime() : 0;
      return !row.last_seen_at || !Number.isFinite(seen) || now - seen > sevenDays;
    }).length,
  };
}

export function profileMapById(profiles: ProfileAnalyticsRow[]) {
  return new Map(profiles.map((profile) => [profile.id, profile]));
}
