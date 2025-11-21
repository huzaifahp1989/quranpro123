import { z } from "zod";
import { pgTable, serial, varchar, integer, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

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

// Juz (Para) Schema
export const juzSchema = z.object({
  number: z.number(),
  name: z.string(),
  startSurah: z.number(),
  startAyah: z.number(),
  endSurah: z.number(),
  endAyah: z.number(),
  arabicName: z.string().optional(),
});

export type Juz = z.infer<typeof juzSchema>;

// All 30 Juz with their details
export const allJuz: Juz[] = [
  { number: 1, name: "Alif Laam Meem", startSurah: 1, startAyah: 1, endSurah: 2, endAyah: 141, arabicName: "الف لام ميم" },
  { number: 2, name: "Sayqul", startSurah: 2, startAyah: 142, endSurah: 2, endAyah: 252, arabicName: "سيقول" },
  { number: 3, name: "Tilka Ar-Rusul", startSurah: 2, startAyah: 253, endSurah: 3, endAyah: 91, arabicName: "تلك الرسل" },
  { number: 4, name: "Li-l-Ilah", startSurah: 3, startAyah: 92, endSurah: 4, endAyah: 23, arabicName: "للّه" },
  { number: 5, name: "Al-Ma'ida", startSurah: 4, startAyah: 24, endSurah: 4, endAyah: 147, arabicName: "المائدة" },
  { number: 6, name: "La Yanhu", startSurah: 4, startAyah: 148, endSurah: 5, endAyah: 81, arabicName: "لا ينهاكم" },
  { number: 7, name: "Wa Idha Samiu", startSurah: 5, startAyah: 82, endSurah: 6, endAyah: 110, arabicName: "وإذا سمعوا" },
  { number: 8, name: "Wa Lu Inna", startSurah: 6, startAyah: 111, endSurah: 7, endAyah: 87, arabicName: "ولو أنّا" },
  { number: 9, name: "Qalat Al-A'raf", startSurah: 7, startAyah: 88, endSurah: 8, endAyah: 40, arabicName: "قالت الأعراف" },
  { number: 10, name: "Wa A'lamu", startSurah: 8, startAyah: 41, endSurah: 9, endAyah: 92, arabicName: "واعلموا" },
  { number: 11, name: "Ya'tazerun", startSurah: 9, startAyah: 93, endSurah: 11, endAyah: 5, arabicName: "يعتذرون" },
  { number: 12, name: "Wa Ma Min Dabbah", startSurah: 11, startAyah: 6, endSurah: 12, endAyah: 52, arabicName: "وما من دابة" },
  { number: 13, name: "Wa Ishtihat", startSurah: 12, startAyah: 53, endSurah: 14, endAyah: 52, arabicName: "واشتعل" },
  { number: 14, name: "Rubama", startSurah: 15, startAyah: 1, endSurah: 16, endAyah: 128, arabicName: "ربما" },
  { number: 15, name: "Subhana", startSurah: 17, startAyah: 1, endSurah: 18, endAyah: 74, arabicName: "سبحان" },
  { number: 16, name: "Qala Alama", startSurah: 18, startAyah: 75, endSurah: 20, endAyah: 135, arabicName: "قالَ ألم" },
  { number: 17, name: "Aqtarabu", startSurah: 21, startAyah: 1, endSurah: 22, endAyah: 78, arabicName: "اقتربَ" },
  { number: 18, name: "Wa Man Yadlil", startSurah: 23, startAyah: 1, endSurah: 25, endAyah: 20, arabicName: "ومن يضلل" },
  { number: 19, name: "Wa Qala Al-Ladhina", startSurah: 25, startAyah: 21, endSurah: 27, endAyah: 55, arabicName: "وقالَ الذين" },
  { number: 20, name: "Amma Yastafikkun", startSurah: 27, startAyah: 56, endSurah: 29, endAyah: 45, arabicName: "آمّا يستفكّون" },
  { number: 21, name: "A'man Yastajeebu", startSurah: 29, startAyah: 46, endSurah: 33, endAyah: 30, arabicName: "أمّن يستجيب" },
  { number: 22, name: "Wa Ma Li", startSurah: 33, startAyah: 31, endSurah: 36, endAyah: 27, arabicName: "وما لي" },
  { number: 23, name: "Ha Meem", startSurah: 36, startAyah: 28, endSurah: 39, endAyah: 31, arabicName: "حاميم" },
  { number: 24, name: "Fa Taalallah", startSurah: 39, startAyah: 32, endSurah: 41, endAyah: 46, arabicName: "فتعالَ الله" },
  { number: 25, name: "Ilayhi Yurjau", startSurah: 41, startAyah: 47, endSurah: 45, endAyah: 37, arabicName: "إليه يُرجع" },
  { number: 26, name: "Ha Meem As-Sajdah", startSurah: 46, startAyah: 1, endSurah: 51, endAyah: 30, arabicName: "حاميم السجدة" },
  { number: 27, name: "Qala Fa-Inna", startSurah: 51, startAyah: 31, endSurah: 57, endAyah: 29, arabicName: "قالَ فَإِنّ" },
  { number: 28, name: "Qad Samia", startSurah: 58, startAyah: 1, endSurah: 66, endAyah: 12, arabicName: "قد سمع" },
  { number: 29, name: "Tabaraka", startSurah: 67, startAyah: 1, endSurah: 77, endAyah: 50, arabicName: "تبارك" },
  { number: 30, name: "Amma", startSurah: 78, startAyah: 1, endSurah: 114, endAyah: 6, arabicName: "عمّ" },
];

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
  { identifier: "ar.huzaifi", name: "Sheikh Muhammad Huzaifi", style: "Hafs" },
];

// Translation identifiers for AlQuran Cloud API
export const translationIdentifiers = {
  urdu: "ur.jalandhry", // Fateh Muhammad Jalandhry
  english: "en.sahih", // Sahih International
};

// ============================================================================
// Database Tables (Drizzle ORM)
// ============================================================================

// Users table (for tracking anonymous and authenticated users)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Bookmarks table
export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  surahNumber: integer("surah_number").notNull(),
  ayahNumber: integer("ayah_number").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("bookmarks_user_id_idx").on(table.userId),
  userSurahAyahUnique: uniqueIndex("bookmarks_user_surah_ayah_unique").on(table.userId, table.surahNumber, table.ayahNumber),
}));

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({ id: true, createdAt: true });
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;

// Reading position table (one per user)
export const readingPosition = pgTable("reading_position", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  surahNumber: integer("surah_number").notNull(),
  ayahNumber: integer("ayah_number").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("reading_position_user_id_idx").on(table.userId),
}));

export const insertReadingPositionSchema = createInsertSchema(readingPosition).omit({ id: true, updatedAt: true });
export type InsertReadingPosition = z.infer<typeof insertReadingPositionSchema>;
export type ReadingPosition = typeof readingPosition.$inferSelect;

// User preferences table
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  reciterIdentifier: varchar("reciter_identifier", { length: 100 }).default("ar.alafasy").notNull(),
  theme: varchar("theme", { length: 20 }).default("light").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_preferences_user_id_idx").on(table.userId),
}));

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ id: true, updatedAt: true });
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
