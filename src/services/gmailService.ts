import { apiClient } from '@/lib/client'
import {
  IngestSyncedEmailPayload,
  ConvertEmailToTaskPayload,
  SyncedEmailItem,
  SyncedEmailsResponse,
} from '../types/gmail';

export const gmailApiService = {
  /**
   * Ingest an inbound email (e.g. pushed from mobile client / local inbox)
   */
  async ingestEmail(payload: IngestSyncedEmailPayload): Promise<SyncedEmailItem> {
    return apiClient<SyncedEmailItem>('/gmail/ingest', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Fetch paginated list of synced emails
   */
  async getSyncedEmails(params?: {
    cursor?: string;
    limit?: number;
    search?: string;
  }): Promise<SyncedEmailsResponse> {
    const query = new URLSearchParams();
    if (params?.cursor) query.append('cursor', params.cursor);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);

    const queryString = query.toString();
    const endpoint = `/gmail/emails${queryString ? `?${queryString}` : ''}`;

    return apiClient<SyncedEmailsResponse>(endpoint, {
      method: 'GET',
    });
  },

  /**
   * Convert an email into a actionable Task
   */
  async convertToTask(
    emailId: string,
    payload: ConvertEmailToTaskPayload = {},
  ) {
    return apiClient<any>(`/gmail/emails/${emailId}/convert-task`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};