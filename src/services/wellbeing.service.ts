import { apiClient } from "@/lib/client";
import { WellbeingResponse, UpsertHealthLogDto, MoodLogResponse, CreateActivityLogDto, ActivityLogResponse } from '@/types/health';

export const WellbeingApiService = {
  /**
   * Fetch Wellbeing context, health advisories, and metabolic metrics
   */
  async getWellbeingContext(latitude?: number, longitude?: number): Promise<WellbeingResponse> {
    const params = new URLSearchParams();
    if (latitude !== undefined) params.append('latitude', latitude.toString());
    if (longitude !== undefined) params.append('longitude', longitude.toString());

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient<WellbeingResponse>(`/health/wellbeing${queryString}`, {
      method: 'GET',
      requiresAuth: true,
    });
  },

  /**
   * Upsert daily health metrics (sleep, water intake, weight)
   */
  async upsertHealthLog(dto: UpsertHealthLogDto): Promise<any> {
    return apiClient('/health/log', {
      method: 'POST',
      body: JSON.stringify(dto),
      requiresAuth: true,
    });
  },

  /**
   * Log a new time-series mood entry
   */
  async createMoodLog(dto: UpsertHealthLogDto): Promise<MoodLogResponse> {
    return apiClient<MoodLogResponse>('/health/mood', {
      method: 'POST',
      body: JSON.stringify(dto),
      requiresAuth: true,
    });
  },

  async createActivityLog(dto: CreateActivityLogDto): Promise<ActivityLogResponse> {
    return apiClient<ActivityLogResponse>('/activity/create', {
      method: 'POST',
      body: JSON.stringify(dto),
      requiresAuth: true,
    });
  },
};