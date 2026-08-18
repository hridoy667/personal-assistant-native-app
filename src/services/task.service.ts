import { apiClient } from "@/lib/client";
import {
  Task,
  CreateTaskPayload,
  UpdateTaskPayload,
  PaginationQuery,
  PaginatedTaskResponse,
  GetSingleTaskResponse,
  ApiResponse,
} from '../types/task';

export const taskService = {
  /**
   * Fetch paginated tasks using cursor pagination
   */
  async getTasks(params?: PaginationQuery): Promise<PaginatedTaskResponse> {
    const queryParams: string[] = [];
    if (params?.limit !== undefined) {
      queryParams.push(`limit=${params.limit}`);
    }
    if (params?.cursor) {
      queryParams.push(`cursor=${encodeURIComponent(params.cursor)}`);
    }
    if (params?.search) {
      queryParams.push(`search=${encodeURIComponent(params.search)}`);
    }
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    const endpoint = `/tasks${queryString}`;
    return apiClient<PaginatedTaskResponse>(endpoint, { method: 'GET' });
  },

  /**
   * Fetch a single task by ID
   */
  async getTaskById(id: string): Promise<GetSingleTaskResponse> {
    return apiClient<GetSingleTaskResponse>(`/tasks/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Create a new task
   */
  async createTask(payload: CreateTaskPayload): Promise<ApiResponse> {
    return apiClient<ApiResponse>('/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Toggle completed status of a task
   */
  async toggleTask(id: string): Promise<Task> {
    return apiClient<Task>(`/tasks/${id}/toggle`, {
      method: 'PATCH',
    });
  },

  /**
   * Update details of a task
   */
  async updateTask(id: string, payload: UpdateTaskPayload): Promise<ApiResponse> {
    return apiClient<ApiResponse>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<ApiResponse> {
    return apiClient<ApiResponse>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  },
};