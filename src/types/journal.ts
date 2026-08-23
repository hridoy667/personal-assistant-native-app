export interface JournalEntry {
  id: string;
  userId: string;
  title: string | null;
  content: string | null;
  audioUrl: string | null;
  createdAt: string; // ISO date string from API
}

export interface CreateJournalDto {
  title?: string;
  content?: string;
  audioUrl?: string;
}

export type UpdateJournalDto = Partial<CreateJournalDto>;

export interface JournalPaginationParams {
  cursor?: string;
  limit?: number;
  search?: string;
}

export interface PaginatedJournalResponse {
  data: JournalEntry[];
  meta: {
    nextCursor?: string;
    hasNextPage: boolean;
  };
}