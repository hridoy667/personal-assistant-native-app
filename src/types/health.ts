export type MoodLevel = 'LOW_ENERGY' | 'DEPRESSED' | 'ANXIOUS' | 'BALANCED' | 'HIGH_ENERGY';

export interface HealthProfile {
  age: number;
  bmi: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  activityLevel: 'SEDENTARY' | 'LIGHTLY_ACTIVE' | 'MODERATELY_ACTIVE' | 'VERY_ACTIVE';
}

export interface MetabolicMetrics {
  bmr: number;
  tdee: number;
  tdeeNote: string;
}

export interface HydrationData {
  targetMl: number;
  breakdown: string;
}

export interface WorkoutAdvisory {
  isOutdoorExerciseRecommended: boolean;
  warnings: string[];
}

export interface HealthInsight {
  category: string;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
}

export interface WeatherAlert {
  senderName: string;
  event: string;
  start: number;
  end: number;
  description: string;
  tags: string[];
}

export interface WellbeingData {
  location: string;
  userProfile: HealthProfile;
  metabolicMetrics: MetabolicMetrics;
  hydration: HydrationData;
  workoutAdvisory: WorkoutAdvisory;
  healthInsights: HealthInsight[];
  activeWeatherAlerts: WeatherAlert[];
}

export interface WellbeingResponse {
  success: boolean;
  message?: string;
  isUpdateRequired?: boolean;
  cached?: boolean;
  data?: WellbeingData;
}

export interface CreateMoodLogDto {
  date?: string;
  mood?: MoodLevel;
  energyScore?: number;
  note?: string;
}

export interface MoodLogResponse {
  id: string;
  userId: string;
  mood: MoodLevel;
  energyScore?: number;
  contextTags: string[];
  symptoms: string[];
  note?: string;
  loggedAt: string;
  createdAt: string;
}

// --- NEWLY ADDED DAILY MOOD LOGS TYPES ---

export interface GetDailyMoodLogsQueryDto {
  timezone?: string;
}

export type DailyMoodLogsResponse = MoodLogResponse[];

export type ActivityType =
  | 'WALKING'
  | 'RUNNING'
  | 'EXERCISING'
  | 'WORKING'
  | 'DEEP_WORK'
  | 'MEETING'
  | 'EATING'
  | 'RESTING'
  | 'COMMUTING'
  | 'SOCIALIZING'
  | 'CHORES'
  | 'TIMEKILL'
  | 'ENTERTAINMENT'
  | 'OTHER';

export interface CreateActivityLogDto {
  type: ActivityType;
  durationMin?: number;
  note?: string;
  date?: string;
}

export interface ActivityLogResponse {
  success: boolean;
  message: string;
}

// --- SLEEP & STATS TYPES ---

export interface SleepSession {
  id: string;
  userId: string;
  sleptAt: string;
  wokeUpAt: string | null;
  isFallback: boolean;
  qualityRating?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface StartSleepDto {
  sleptAt?: string;
}

export interface WakeUpDto {
  wokeUpAt?: string;
  qualityRating?: number;
}

export interface UpsertSleepLogDto {
  targetDate: string;
  sleptAt: string;
  wokeUpAt: string;
  qualityRating?: number;
}

export type StatsTimeframe = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export interface SleepStatsQueryDto {
  timeframe?: StatsTimeframe;
  date?: string;
}

export interface SleepStatPoint {
  label: string;
  avgHours: number;
}