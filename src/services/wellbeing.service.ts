import { apiClient } from "@/lib/client";
import {
  WellbeingResponse,
  CreateMoodLogDto,
  MoodLogResponse,
  GetDailyMoodLogsQueryDto,
  DailyMoodLogsResponse,
  CreateActivityLogDto,
  ActivityLogResponse,
  SleepSession,
  StartSleepDto,
  WakeUpDto,
  UpsertSleepLogDto,
  SleepStatsQueryDto,
  SleepStatPoint,
} from '@/types/health';

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
   * Log a new time-series mood entry
   */
  async createMoodLog(dto: CreateMoodLogDto): Promise<MoodLogResponse> {
    return apiClient<MoodLogResponse>('/mood', {
      method: 'POST',
      body: JSON.stringify(dto),
      requiresAuth: true,
    });
  },

  /**
   * Fetch all mood entries logged within today's logical day bounds
   */
  async getDailyMoodLogs(query?: GetDailyMoodLogsQueryDto): Promise<DailyMoodLogsResponse> {
    const headers: Record<string, string> = {};
    if (query?.timezone) {
      headers['x-timezone'] = query.timezone;
    }

    return apiClient<DailyMoodLogsResponse>('/mood/today', {
      method: 'GET',
      headers,
      requiresAuth: true,
    });
  },

  /**
   * Log a new activity entry
   */
  async createActivityLog(dto: CreateActivityLogDto): Promise<ActivityLogResponse> {
    return apiClient<ActivityLogResponse>('/activity/create', {
      method: 'POST',
      body: JSON.stringify(dto),
      requiresAuth: true,
    });
  },

  // --- SLEEP & STATS API SERVICES ---

  /**
   * Get current active ongoing sleep session (or null if awake)
   */
  async getActiveSleepSession(): Promise<SleepSession | null> {
    return apiClient<SleepSession | null>('/health/active', {
      method: 'GET',
      requiresAuth: true,
    });
  },

  /**
   * Start a new live sleep session
   */
  async startSleepSession(dto?: StartSleepDto): Promise<SleepSession> {
    return apiClient<SleepSession>('/health/start', {
      method: 'POST',
      body: JSON.stringify(dto ?? {}),
      requiresAuth: true,
    });
  },

  /**
   * End an active sleep session
   */
  async wakeUpSession(sessionId: string, dto?: WakeUpDto): Promise<SleepSession> {
    return apiClient<SleepSession>(`/health/${sessionId}/wake`, {
      method: 'POST',
      body: JSON.stringify(dto ?? {}),
      requiresAuth: true,
    });
  },

  /**
   * Create or update a manual sleep log for a past date (up to 7 days back)
   */
  async upsertHistoricalSleepLog(dto: UpsertSleepLogDto): Promise<SleepSession> {
    return apiClient<SleepSession>('/health/manual-log', {
      method: 'PATCH',
      body: JSON.stringify(dto),
      requiresAuth: true,
    });
  },

  /**
   * Fetch sleep chart analytics aggregated by timeframe
   */
  async getSleepStats(query?: SleepStatsQueryDto): Promise<SleepStatPoint[]> {
    const params = new URLSearchParams();
    if (query?.timeframe) params.append('timeframe', query.timeframe);
    if (query?.date) params.append('date', query.date);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient<SleepStatPoint[]>(`/health/stats${queryString}`, {
      method: 'GET',
      requiresAuth: true,
    });
  },
};