export interface SkillModule {
  id: string;
  skillId: string;
  title: string;
  order: number;
  theoryText: string;
  videoUrl?: string | null;
  practiceTask: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Skill {
  id: string;
  userId: string;
  title: string;
  targetHours: number;
  loggedHours: number;
  level?: string | null;
  createdAt: string;
  updatedAt: string;
  modules?: SkillModule[];
  _count?: {
    modules: number;
  };
}

export interface CreateSkillDto {
  title: string;
  targetHours: number;
  level?: string;
}

export interface GenerateSkillRoadmapDto {
  title: string;
  targetHours: number;
  level?: string;
  resources?: string;
}

export interface UpdateSkillDto {
  title?: string;
  targetHours?: number;
  level?: string;
}

export interface LogSkillTimeDto {
  hours: number;
}

export interface DeleteSkillResponse {
  success: boolean;
  message: string;
}