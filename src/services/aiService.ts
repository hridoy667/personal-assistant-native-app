import { apiClient } from "@/lib/client";
import {
  GenerateSuggestionDto,
  SuggestionResponse,
  ClearCacheResponse, // Ensure this interface is added to your '../types/ai' file
} from '../types/ai';

export const aiService = {
  /**
   * Triggers the AI pipeline to generate context-driven suggestions (Uses 1.5h Redis cache)
   */
  async generateSuggestion(
    dto: GenerateSuggestionDto
  ): Promise<SuggestionResponse> {
    return apiClient<SuggestionResponse>('/ai/suggestions', {
      method: 'POST',
      body: JSON.stringify(dto),
      requiresAuth: true,
    });
  },

  /**
   * Clears the Redis cache and triggers the AI pipeline to fetch a fresh suggestion
   */
  async refreshSuggestion(
    dto: GenerateSuggestionDto
  ): Promise<SuggestionResponse> {
    return apiClient<SuggestionResponse>('/ai/suggestions/refresh', {
      method: 'POST',
      body: JSON.stringify(dto),
      requiresAuth: true,
    });
  },

  /**
   * Purges the Redis cache for the given context without triggering an AI generation call
   */
  async clearCache(
    dto: GenerateSuggestionDto
  ): Promise<ClearCacheResponse> {
    return apiClient<ClearCacheResponse>('/ai/suggestions/cache', {
      method: 'DELETE',
      body: JSON.stringify(dto),
      requiresAuth: true,
    });
  },
};