import { apiClient } from "@/lib/client";
import {
  JournalEntry,
  CreateJournalDto,
  UpdateJournalDto,
  JournalPaginationParams,
  PaginatedJournalResponse,
} from '../types/journal';

export const journalService = {
  /**
   * Create a new journal entry
   */
  async create(dto: CreateJournalDto): Promise<JournalEntry> {
    return apiClient<JournalEntry>('/journal', {
      method: 'POST',
      body: JSON.stringify(dto),
      requiresAuth: true,
    });
  },

  /**
   * Get cursor-paginated list of journal entries
   */
  async findAll(params?: JournalPaginationParams): Promise<PaginatedJournalResponse> {
    const query = new URLSearchParams();

    if (params?.cursor) query.append('cursor', params.cursor);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);

    const queryString = query.toString();
    const endpoint = queryString ? `/journal?${queryString}` : '/journal';

    return apiClient<PaginatedJournalResponse>(endpoint, {
      method: 'GET',
      requiresAuth: true,
    });
  },

  /**
   * Fetch a single journal entry by ID
   */
  async findOne(id: string): Promise<JournalEntry> {
    return apiClient<JournalEntry>(`/journal/${id}`, {
      method: 'GET',
      requiresAuth: true,
    });
  },

  /**
   * Update an existing journal entry
   */
  async update(id: string, dto: UpdateJournalDto): Promise<JournalEntry> {
    return apiClient<JournalEntry>(`/journal/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
      requiresAuth: true,
    });
  },

  /**
   * Delete a journal entry by ID
   */
  async delete(id: string): Promise<JournalEntry> {
    return apiClient<JournalEntry>(`/journal/${id}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
  },
};