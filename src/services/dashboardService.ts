import { apiClient } from "@/lib/client";
import { TodayOverviewResponse } from "@/types/dashboard";

export const dashboardService = {
  /**
   * Fetches today's consolidated overview including day bounds,
   * mood logs, tasks, activities, and digital app usage.
   */
  async getTodayOverview(): Promise<TodayOverviewResponse> {
    return apiClient<TodayOverviewResponse>('/dashboard/today', {
      method: 'GET',
      requiresAuth: true,
    });
  },
};