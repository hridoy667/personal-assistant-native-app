export type InsightCardType = 'SLEEP' | 'WAKE' | 'AI_SUGGESTION' | 'CRITICAL_TASK';

export interface SleepSession {
  id: string;
  userId?:string;
  sleptAt: string;
  wokeUpAt?: string | null;
  isFallback:boolean;
  createdAt:string;
  updatedAt:string
}

export interface HomeInsightData {
  type: InsightCardType;
  userId?: string;
  title: string;
  description: string;
  actionText?: string;
  currentSession?: SleepSession | null;
  taskId?: string;
  suggestedAction?: string;
}