import { apiClient } from '@/lib/client';
import { aiService } from '@/services/aiService';
import { SuggestionContextType } from '@/types/ai'; 
import { HomeInsightData, SleepSession } from '@/types/homeInsight';

export const homeInsightService = {
  async getContextualInsight(
    userDefaultSleepTime = '23:00',
    forceRefresh = false
  ): Promise<HomeInsightData> {
    try {
      // 1. Fetch active sleep session
      const activeSession = await apiClient<SleepSession | null>('/health/active', {
        method: 'GET',
      });

      const currentHour = new Date().getHours();
      const targetSleepHour = parseInt(userDefaultSleepTime.split(':')[0], 10) || 23;
      const eveningStartHour = Math.max(18, targetSleepHour - 3);

      // SCENARIO 1: Active sleep session -> Show "I'm Awake" card
      if (activeSession && !activeSession.wokeUpAt) {
        return {
          type: 'WAKE',
          title: 'Currently Resting',
          description: `Slept at ${new Date(activeSession.sleptAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          actionText: "I'm Awake",
          currentSession: activeSession,
        };
      }

      // SCENARIO 2: Evening / Night time window -> Show "Going to Sleep" prompt
      if (currentHour >= eveningStartHour || currentHour < 5) {
        return {
          type: 'SLEEP',
          title: 'Ready to sleep?',
          description: 'Log your sleep to define your day bounds for tomorrow.',
          actionText: 'Going to Sleep',
          currentSession: null,
        };
      }

      // SCENARIO 3: Daytime -> Fetch AI Daily Briefing Suggestion
      const dto = { contextType: SuggestionContextType.DAILY_BRIEFING };
      const aiResult = forceRefresh
        ? await aiService.refreshSuggestion(dto)
        : await aiService.generateSuggestion(dto);

      return {
        type: 'AI_SUGGESTION',
        title: 'Daily Briefing',
        description: aiResult.suggestion,
        suggestedAction: 'View Priorities',
      };
    } catch (error) {
      // SCENARIO 4: Fallback on error
      return {
        type: 'AI_SUGGESTION',
        title: 'Daily Briefing',
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