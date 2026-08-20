import { apiClient } from "@/lib/client";

export interface AppUsageDto {
  packageName: string;
  appName: string;
  category?: string;
  timeSpentMins: number;
}

export interface BatchSyncScreenTimeDto {
  date: string;
  totalScreenTimeMins: number;
  productivityScore?: number;
  deviceOs: 'ANDROID' | 'IOS';
  appUsages: AppUsageDto[];
}

// 1. Define the response structure returned by your backend endpoint
export interface DailySummaryResponse {
  summary: {
    totalScreenTimeMins: number;
    productivityScore?: number | null;
    deviceOs?: string;
  };
  appUsages: AppUsageDto[];
}

export const ScreenTimeApiService = {
  // Matches POST /screen-time/sync
  syncScreenTime: (data: BatchSyncScreenTimeDto) =>
    apiClient<{ success: boolean }>('/screen-time/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 2. Add the <DailySummaryResponse> generic to apiClient
  getDailySummary: (date?: string) =>
    apiClient<DailySummaryResponse>(`/screen-time/summary${date ? `?date=${date}` : ''}`, {
      method: 'GET',
    }),
};