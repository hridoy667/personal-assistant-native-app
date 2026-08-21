import { apiClient } from "@/lib/client";
import {
  Habit,
  CreateHabitDto,
  UpdateHabitDto,
  StreakResponse,
  DeleteHabitResponse,
} from '@/types/habits';

export const HabitsApiService = {
  /**
   * Create a new scheduled habit
   */
  async create(dto: CreateHabitDto): Promise<Habit> {
    return apiClient<Habit>('/habits', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Fetch all active habits with recent tasks
   */
  async findAll(): Promise<Habit[]> {
    return apiClient<Habit[]>('/habits', {
      method: 'GET',
    });
  },

  /**
   * Fetch streak statistics and total completions for a specific habit
   */
  async getStreaks(id: string): Promise<StreakResponse> {
    return apiClient<StreakResponse>(`/habits/${id}/streaks`, {
      method: 'GET',
    });
  },

  /**
   * Update settings or schedule for a habit
   */
  async update(id: string, dto: UpdateHabitDto): Promise<Habit> {
    return apiClient<Habit>(`/habits/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Delete a habit
   */
  async delete(id: string): Promise<DeleteHabitResponse> {
    return apiClient<DeleteHabitResponse>(`/habits/${id}`, {
      method: 'DELETE',
    });
  },
};