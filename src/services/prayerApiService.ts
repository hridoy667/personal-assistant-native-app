import { apiClient } from "@/lib/client";
import { PrayerTimeResponse } from "@/types/prayer.types";

export const PrayerApiService = {
  /**
   * Fetch daily prayer times for the authenticated user based on their saved location.
   */
  async getPrayerTime(): Promise<PrayerTimeResponse> {
    return apiClient<PrayerTimeResponse>('/dashboard/prayer-time', {
      method: 'GET',
      requiresAuth: true,
    });
  },
};