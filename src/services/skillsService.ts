import { apiClient } from "@/lib/client";
import {
  Skill,
  SkillModule,
  GenerateSkillRoadmapDto,
  UpdateSkillDto,
  LogSkillTimeDto,
  DeleteSkillResponse,
} from '@/types/skills';

export const SkillsApiService = {
  /**
   * POST /skills/generate
   * Generates a skill with an AI roadmap (modules, video links, practice tasks) via Groq
   */
  generateSkill: async (dto: GenerateSkillRoadmapDto): Promise<Skill> => {
    return apiClient<Skill>('/skills/generate', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  /**
   * GET /skills
   * Fetches all skills for the current user (includes module counts)
   */
  findAll: async (): Promise<Skill[]> => {
    return apiClient<Skill[]>('/skills', {
      method: 'GET',
    });
  },

  /**
   * GET /skills/:id
   * Fetches a single skill by ID along with its full ordered list of modules
   */
  findOne: async (id: string): Promise<Skill> => {
    return apiClient<Skill>(`/skills/${id}`, {
      method: 'GET',
    });
  },

  /**
   * PATCH /skills/:id
   * Updates basic skill details (title, target hours, level)
   */
  update: async (id: string, dto: UpdateSkillDto): Promise<Skill> => {
    return apiClient<Skill>(`/skills/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  /**
   * PATCH /skills/:id/log
   * Manually logs practice hours for a skill (increments existing hours)
   */
  logHours: async (id: string, dto: LogSkillTimeDto): Promise<Skill> => {
    return apiClient<Skill>(`/skills/${id}/log`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  /**
   * PATCH /skills/modules/:moduleId/toggle
   * Toggles the completion status (isCompleted) of a single module
   */
  toggleModule: async (moduleId: string): Promise<SkillModule> => {
    return apiClient<SkillModule>(`/skills/modules/${moduleId}/toggle`, {
      method: 'PATCH',
    });
  },

  /**
   * DELETE /skills/:id
   * Deletes a skill and cascade-deletes all associated modules
   */
  delete: async (id: string): Promise<DeleteSkillResponse> => {
    return apiClient<DeleteSkillResponse>(`/skills/${id}`, {
      method: 'DELETE',
    });
  },
};