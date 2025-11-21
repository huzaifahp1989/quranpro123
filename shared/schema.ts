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
  { identifier: "ar.huzaify", name: "Sheikh Muhammad Huzaify", style: "Hafs" },
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
