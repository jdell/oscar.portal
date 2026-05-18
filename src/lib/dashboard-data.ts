import { api, ApiError } from "@/lib/api";
import type {
  DashboardActivityEvent,
  DashboardOverview,
  DashboardPeriod,
  DashboardTrends,
} from "@/lib/types";

export async function loadOverview(
  period: DashboardPeriod,
): Promise<DashboardOverview | null> {
  try {
    return await api.get<DashboardOverview>("/admin/dashboard/overview", {
      searchParams: { period },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 429) throw error;
      console.error("dashboard overview failed", error.status);
    }
    return null;
  }
}

export async function loadTrends(
  period: DashboardPeriod,
): Promise<DashboardTrends | null> {
  try {
    return await api.get<DashboardTrends>("/admin/dashboard/trends", {
      searchParams: { period },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 429) throw error;
      console.error("dashboard trends failed", error.status);
    }
    return null;
  }
}

export async function loadRecentActivity(
  limit = 20,
): Promise<DashboardActivityEvent[]> {
  try {
    const result = await api.get<
      DashboardActivityEvent[] | { items: DashboardActivityEvent[] }
    >("/admin/dashboard/recent-activity", {
      searchParams: { limit },
    });
    return Array.isArray(result) ? result : (result.items ?? []);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 429) throw error;
      console.error("dashboard recent activity failed", error.status);
    }
    return [];
  }
}
