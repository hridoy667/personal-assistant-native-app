export enum TaskPriority {
  P1_URGENT = 'P1_URGENT',
  P2_HIGH = 'P2_HIGH',
  P3_MEDIUM = 'P3_MEDIUM',
  P4_LOW = 'P4_LOW',
}

export enum EnergyRequirement {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface Task {
  id: string;
  title: string;
  priority: TaskPriority;
  energyRequired: EnergyRequirement;
  isCompleted: boolean;
  isTopPriority: boolean;
  dueDate: string | null;
  category: string | null;
  tags: string[];
  createdAt: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority?: TaskPriority;
  energyRequired?: EnergyRequirement;
  dueDate?: string;
  estimatedMinutes?: number;
  isTopPriority?: boolean;
  recurrenceRule?: string;
  category?: string;
  tags?: string[];
  parentId?: string;
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {}

export interface PaginationQuery {
  cursor?: string;
  limit?: number;
  search?: string;
}

export interface PaginatedTaskResponse {
  success: boolean;
  data: Task[];
  meta: {
    nextCursor?: string;
    hasNextPage: boolean;
  };
}

// Single task API response matching your NestJS service return { success: true, task }
export interface GetSingleTaskResponse {
  success: boolean;
  task: Task;
}

// Generic single entity wrapper if you want to reuse across other modules
export interface SingleEntityResponse<T> {
  success: boolean;
  data?: T;
  task?: T;
}

export interface ApiResponse {
  success: boolean;
  message: string;
}