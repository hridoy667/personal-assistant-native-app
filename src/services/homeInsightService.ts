import { apiClient } from '@/lib/client';
import { HomeInsightData, SleepSession } from '@/types/homeInsight';

export const homeInsightService = {
  async getContextualInsight(userDefaultSleepTime = '23:00'): Promise<HomeInsightData> {
    try {
      // 1. Always fetch active sleep session first
      const activeSession = await apiClient<SleepSession | null>('/health/active', {
        method: 'GET',
      });

      const currentHour = new Date().getHours();
      const targetSleepHour = parseInt(userDefaultSleepTime.split(':')[0], 10) || 23;
      const eveningStartHour = Math.max(18, targetSleepHour - 3); // e.g., 8 PM

      // SCENARIO 1: User is currently marked as sleeping -> Show "I'm Awake" card
      if (activeSession && !activeSession.wokeUpAt) {
        return {
          type: 'WAKE',
          title: 'Currently Resting',
          description: `Slept at ${new Date(activeSession.sleptAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          actionText: "I'm Awake",
          currentSession: activeSession,
        };
      }

      // SCENARIO 2: Night time window (or late night past midnight) -> Show "Going to Sleep" prompt
      if (currentHour >= eveningStartHour || currentHour < 5) {
        return {
          type: 'SLEEP',
          title: 'Ready to sleep?',
          description: 'Log your sleep to define your day bounds for tomorrow.',
          actionText: 'Going to Sleep',
          currentSession: null,
        };
      }

      // SCENARIO 3: Daytime fallback -> Default focus/AI prompt
      const insightData = await apiClient<HomeInsightData>('/ai/daily-focus', {
        method: 'GET',
      });
      return insightData;

    } catch (error) {
      // SCENARIO 4: Graceful offline/error fallback
      return {
        type: 'AI_SUGGESTION',
        title: 'Focus Peak',
        description: 'Complete your highest-priority task before taking a break.',
        suggestedAction: 'View Priorities',
      };
    }
  },

  async logSleep(): Promise<SleepSession> {
    return await apiClient<SleepSession>('/health/start', {
      method: 'POST',
      body: JSON.stringify({
        sleptAt: new Date().toISOString(),
      }),
    });
  },

  async logWake(sessionId: string): Promise<void> {
    if (!sessionId || sessionId === 'undefined') {
      console.warn('No active session ID provided for logWake. Skipping API call.');
      return;
    }

    await apiClient<void>(`/health/${sessionId}/wake`, {
      method: 'POST',
      body: JSON.stringify({
        wokeUpAt: new Date().toISOString(),
      }),
    });
  },
};