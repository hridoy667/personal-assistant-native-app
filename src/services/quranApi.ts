import { apiClient } from '@/lib/client';
import { QuranAyatResponse } from '../types/quran';

export const fetchDailyQuranAyat = async (): Promise<QuranAyatResponse> => {
  return await apiClient<QuranAyatResponse>('/dashboard/ayat');
};