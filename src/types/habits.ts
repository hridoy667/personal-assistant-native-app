export enum HabitType {
  BINARY = 'BINARY',
  NUMERIC = 'NUMERIC',
}

export enum WeekDay {
  DAILY = 'DAILY',
  SUNDAY = 'SUNDAY',
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
}

export interface HabitTask {
  id: string;
  userId: string;
  habitId: string;
  title: string;
  description?: string | null;
  priority: string;
  energyRequired: string;
  isCompleted: boolean;
  completedAt?: string | null;
  dueDate?: string | null;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  type: HabitType;
  targetValue: number;
  unit?: string | null;
  currentStreak: number;
  longestStreak: number;
  streakSavers: number;
  frequency: (WeekDay | string)[];
  tasks?: HabitTask[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateHabitDto {
  title: string;
  type?: HabitType;
  targetValue?: number;
  unit?: string;
  frequency: (WeekDay | string)[];
}

export interface UpdateHabitDto {
  title?: string;
  type?: HabitType;
  targetValue?: number;
  unit?: string;
  frequency?: (WeekDay | string)[];
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  startDate: string;
}

export interface StreakResponse {
  success: boolean;
  data: StreakData;
}

export interface DeleteHabitResponse {
  success: boolean;
  message: string;
}