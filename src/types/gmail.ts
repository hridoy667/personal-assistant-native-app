export enum TaskPriority {
  P0_URGENT = 'P0_URGENT',
  P1_CRITICAL = 'P1_CRITICAL',
  P2_HIGH = 'P2_HIGH',
  P3_MEDIUM = 'P3_MEDIUM',
  P4_LOW = 'P4_LOW',
}

export enum EnergyRequirement {
  VERY_HIGH = 'VERY_HIGH',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  VERY_LOW = 'VERY_LOW',
}

export interface IngestSyncedEmailPayload {
  gmailMessageId: string;
  sender: string;
  subject: string;
  snippet?: string;
  isActionRequired?: boolean;
  receivedAt: string; // ISO 8601 String
}

export interface ConvertEmailToTaskPayload {
  dueDate?: string; // ISO 8601 String
  priority?: TaskPriority;
  energyRequired?: EnergyRequirement;
}

export interface SyncedEmailItem {
  id: string;
  userId: string;
  gmailMessageId: string;
  sender: string;
  subject: string;
  snippet?: string;
  isActionRequired: boolean;
  receivedAt: string;
  createdAt: string;
  updatedAt: string;
  task?: {
    id: string;
    isCompleted: boolean;
    priority: TaskPriority;
  } | null;
}

export interface SyncedEmailPaginationMeta {
  nextCursor?: string;
  hasNextPage: boolean;
}

export interface SyncedEmailsResponse {
  data: SyncedEmailItem[];
  meta: SyncedEmailPaginationMeta;
}