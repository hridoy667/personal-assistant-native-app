export interface DayBounds {
  dayStart: string;
  dayEnd: string;
  logicalDate: string;
  isCurrentlyAwake: boolean;
  wakeUpTime: string;
}

export interface MoodItem {
  id: string;
  mood: string;
  energyScore: number | null;
  loggedAt: string;
}

export interface LatestMood extends MoodItem {
  symptoms: string[];
}

export interface MoodOverview {
  latest: LatestMood | null;
  allToday: MoodItem[];
}

export interface TaskItem {
  id: string;
  title: string;
  isCompleted: boolean;
  priority: 'P1_URGENT' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW'; // Adjust based on your TaskPriority enum
  energyRequired: 'LOW' | 'MEDIUM' | 'HIGH';
  category: string | null;
  dueDate: string | null;
}

export interface TasksOverview {
  total: number;
  completedCount: number;
  pendingCount: number;
  items: TaskItem[];
}

export interface ActivityLogItem {
  id: string;
  type: string;
  durationMin: number | null;
  note: string | null;
  loggedAt: string;
}

export interface ActivitiesOverview {
  totalMinutes: number;
  count: number;
  logs: ActivityLogItem[];
}

export interface TopAppUsage {
  appName: string;
  category: string | null;
  timeSpentMins: number;
}

export interface AppUsageOverview {
  totalScreenTimeMins: number;
  productivityScore: number | null;
  topApps: TopAppUsage[];
}

export interface TodayOverviewResponse {
  dayBounds: DayBounds;
  mood: MoodOverview;
  tasks: TasksOverview;
  activities: ActivitiesOverview;
  appUsage: AppUsageOverview;
}