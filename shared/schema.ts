import { z } from "zod";

// Surah (Chapter) Schema
export const surahSchema = z.object({
  number: z.number(),
  name: z.string(),
  englishName: z.string(),
  englishNameTranslation: z.string(),
  numberOfAyahs: z.number(),
  revelationType: z.enum(['Meccan', 'Medinan']),
});

export type Surah = z.infer<typeof surahSchema>;

// Ayah (Verse) Schema
export const ayahSchema = z.object({
  number: z.number(),
  numberInSurah: z.number(),
  text: z.string(),
  audio: z.string().optional(),
  surah: z.object({
    number: z.number(),
    name: z.string(),
    englishName: z.string(),
  }).optional(),
});

export type Ayah = z.infer<typeof ayahSchema>;

// Translation Schema
export const translationSchema = z.object({
  text: z.string(),
  language: z.string(),
  translator: z.string().optional(),
});

export type Translation = z.infer<typeof translationSchema>;

// Verse with Translations Schema
export const verseWithTranslationsSchema = z.object({
  ayah: ayahSchema,
  urduTranslation: translationSchema.optional(),
  englishTranslation: translationSchema.optional(),
});

export type VerseWithTranslations = z.infer<typeof verseWithTranslationsSchema>;

// Tafseer (Commentary) Schema
export const tafseerSchema = z.object({
  ayahNumber: z.number(),
  text: z.string(),
  tafseerName: z.string(),
  language: z.string(),
});

export type Tafseer = z.infer<typeof tafseerSchema>;

// Reciter Schema
export const reciterSchema = z.object({
  identifier: z.string(),
  name: z.string(),
  style: z.string().optional(),
});

export type Reciter = z.infer<typeof reciterSchema>;

// Hadith Collection Schema
export const hadithCollectionSchema = z.object({
  name: z.string(),
  englishName: z.string(),
  numberOfHadiths: z.number(),
});

export type HadithCollection = z.infer<typeof hadithCollectionSchema>;

// Hadith Schema
export const hadithSchema = z.object({
  collection: z.string(),
  bookNumber: z.string().optional(),
  hadithNumber: z.string(),
  arabicText: z.string(),
  englishText: z.string(),
  urduText: z.string().optional(),
  narrator: z.string().optional(),
  grade: z.string().optional(),
  reference: z.string(),
});

export type Hadith = z.infer<typeof hadithSchema>;

// API Response schemas for external APIs
export const quranApiResponseSchema = z.object({
  code: z.number(),
  status: z.string(),
  data: z.any(),
});

export type QuranApiResponse = z.infer<typeof quranApiResponseSchema>;

// Reading state (for UI)
export const readingStateSchema = z.object({
  currentSurah: z.number(),
  currentAyah: z.number(),
  isPlaying: z.boolean(),
  selectedReciter: z.string(),
});

export type ReadingState = z.infer<typeof readingStateSchema>;

// Available reciters with their identifiers for AlQuran Cloud API
export const availableReciters: Reciter[] = [
  { identifier: "ar.alafasy", name: "Mishary Rashid Alafasy", style: "Hafs" },
  { identifier: "ar.abdulbasitmurattal", name: "Abdul Basit (Murattal)", style: "Hafs" },
  { identifier: "ar.minshawi", name: "Mohamed Siddiq al-Minshawi (Murattal)", style: "Hafs" },
  { identifier: "ar.husary", name: "Mahmoud Khalil Al-Hussary", style: "Hafs" },
  { identifier: "ar.shaatree", name: "Abu Bakr al-Shatri", style: "Hafs" },
];

// Translation identifiers for AlQuran Cloud API
export const translationIdentifiers = {
  urdu: "ur.jalandhry", // Fateh Muhammad Jalandhry
  english: "en.sahih", // Sahih International
};
