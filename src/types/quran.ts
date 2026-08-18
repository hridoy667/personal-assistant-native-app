export interface QuranAyatSuccessResponse {
  success: true;
  surahName: string;
  surahArabic: string;
  verseKey: string;
  arabic: string;
  translation: string;
  bengaliTranslation: string;
  audioUrl: string | null;
}

export interface QuranAyatDisabledResponse {
  success: true;
  message: string;
}

export type QuranAyatResponse = QuranAyatSuccessResponse | QuranAyatDisabledResponse;