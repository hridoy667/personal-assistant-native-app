export enum SuggestionContextType {
  DAILY_BRIEFING = 'DAILY_BRIEFING',
  MENTAL_HEALTH = 'MENTAL_HEALTH',
  PHYSICAL_ACTIVITY = 'PHYSICAL_ACTIVITY',
  TASK_OPTIMIZATION = 'TASK_OPTIMIZATION',
  FINANCE_ADVICE = 'FINANCE_ADVICE',
  GENERAL = 'GENERAL',
}

export interface GenerateSuggestionDto {
  contextType: SuggestionContextType;
  userContext?: string;
}

export interface SuggestionResponse {
  suggestion: string;
  contextType: SuggestionContextType;
}

export interface ClearCacheResponse {
  success: boolean;
  message: string;
}