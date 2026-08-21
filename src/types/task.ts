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

// 1. ADD: Status filter enum matching backend
export enum TaskStatusFilter {
  ALL = 'all',
  PENDING = 'pending',
  COMPLETED = 'completed',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  energyRequired: EnergyRequirement;
  isCompleted: boolean;
  isTopPriority: boolean;
  dueDate: string | null;
  category: string | null;
  habitId?: string | null;
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

// 2. UPDATE: PaginationQuery to accept status filter string/enum
export interface PaginationQuery {
  cursor?: string;
  limit?: number;
  search?: string;
  status?: TaskStatusFilter | 'all' | 'pending' | 'completed';
}

// 3. UPDATE: PaginatedTaskResponse to include 'total' inside meta
export interface PaginatedTaskResponse {
  success: boolean;
  data: Task[];
  meta: {
    total: number; // Added total count from Prisma
    nextCursor?: string;
    hasNextPage: boolean;
  };
}

export interface GetSingleTaskResponse {
  success: boolean;
  task: Task;
}

export interface SingleEntityResponse<T> {
  success: boolean;
  data?: T;
  task?: T;
}

export interface ApiResponse {
  success: boolean;
  message: string;
}