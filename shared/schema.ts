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

// Available Reciters
export const availableReciters: Reciter[] = [
  { identifier: "ar.alafasy", name: "Mishari Alafasy", style: "Modern" },
  { identifier: "ar.abdulbasitmurattal", name: "Abdul Basit Murratal", style: "Murratal" },
  { identifier: "ar.minshawi", name: "Muhammad Minshawi", style: "Murattal" },
  { identifier: "ar.husary", name: "Mahmoud Al-Hussary", style: "Murattal" },
  { identifier: "ar.shaatree", name: "Abu Bakr Al-Shatri", style: "Tajweed" },
  { identifier: "ar.abdulsamad", name: "Abdul Samad", style: "Murattal" },
  { identifier: "ar.parhizgar", name: "Hani Rifai", style: "Tajweed" },
  { identifier: "ar.maher", name: "Muhammad al-Mahir", style: "Tajweed" },
  { identifier: "ar.quraishi", name: "Muhammad al-Quraishi", style: "Modern" },
];

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
  { number: 1, name: "Alif Lām Mīm", startSurah: 1, startAyah: 1, endSurah: 2, endAyah: 141, arabicName: "الف لام ميم" },
  { number: 2, name: "Sayaqūl", startSurah: 2, startAyah: 142, endSurah: 2, endAyah: 252, arabicName: "سيقول" },
  { number: 3, name: "Tilka ar-Rusul", startSurah: 2, startAyah: 253, endSurah: 3, endAyah: 91, arabicName: "تلك الرسل" },
  { number: 4, name: "Lan Tanālu", startSurah: 3, startAyah: 92, endSurah: 4, endAyah: 23, arabicName: "لن تنالوا" },
  { number: 5, name: "Wal-Muḥsanāt", startSurah: 4, startAyah: 24, endSurah: 4, endAyah: 147, arabicName: "والمحصنات" },
  { number: 6, name: "Lā Yuḥibbullāh", startSurah: 4, startAyah: 148, endSurah: 5, endAyah: 81, arabicName: "لا يحب" },
  { number: 7, name: "Wa Idhā Samiʿū", startSurah: 5, startAyah: 82, endSurah: 6, endAyah: 110, arabicName: "وإذا سمعوا" },
  { number: 8, name: "Walaw Annanā", startSurah: 6, startAyah: 111, endSurah: 7, endAyah: 87, arabicName: "ولو أنا" },
  { number: 9, name: "Qāla al-Malāʼ", startSurah: 7, startAyah: 88, endSurah: 8, endAyah: 40, arabicName: "قال الملأ" },
  { number: 10, name: "Waʿlamū", startSurah: 8, startAyah: 41, endSurah: 9, endAyah: 92, arabicName: "واعلموا" },
  { number: 11, name: "Yatawafā", startSurah: 9, startAyah: 93, endSurah: 11, endAyah: 5, arabicName: "يتوفى" },
  { number: 12, name: "Wa Mā Ubrīʼu Nafsi", startSurah: 11, startAyah: 6, endSurah: 12, endAyah: 52, arabicName: "وما أبرئ نفسي" },
  { number: 13, name: "Wa Mā Ubrīʼu Nafsi", startSurah: 12, startAyah: 53, endSurah: 14, endAyah: 52, arabicName: "وما أبرئ نفسي" },
  { number: 14, name: "Rubamā", startSurah: 15, startAyah: 1, endSurah: 16, endAyah: 128, arabicName: "ربما" },
  { number: 15, name: "Subḥānalladhī", startSurah: 17, startAyah: 1, endSurah: 18, endAyah: 74, arabicName: "سبحان الذي" },
  { number: 16, name: "Qāl Alam", startSurah: 18, startAyah: 75, endSurah: 20, endAyah: 135, arabicName: "قال الم" },
  { number: 17, name: "Iqtaraba", startSurah: 21, startAyah: 1, endSurah: 22, endAyah: 78, arabicName: "اقترب" },
  { number: 18, name: "Qadd Aflaha", startSurah: 23, startAyah: 1, endSurah: 25, endAyah: 20, arabicName: "قد أفلح" },
  { number: 19, name: "Wa Qāla", startSurah: 25, startAyah: 21, endSurah: 27, endAyah: 55, arabicName: "وقال" },
  { number: 20, name: "Aʿman Khalāq", startSurah: 27, startAyah: 56, endSurah: 29, endAyah: 45, arabicName: "أمن خلق" },
  { number: 21, name: "Uttlu Mā Uhiya", startSurah: 29, startAyah: 46, endSurah: 33, endAyah: 30, arabicName: "اتلُ ما أوحي" },
  { number: 22, name: "Wa Man Yaqnut", startSurah: 33, startAyah: 31, endSurah: 36, endAyah: 27, arabicName: "ومن يقنت" },
  { number: 23, name: "Wa Mā Liya", startSurah: 36, startAyah: 28, endSurah: 39, endAyah: 31, arabicName: "وما لي" },
  { number: 24, name: "Faman Aẓlamu", startSurah: 39, startAyah: 32, endSurah: 41, endAyah: 46, arabicName: "فمن أظلم" },
  { number: 25, name: "Ilayhi Yuraddu", startSurah: 41, startAyah: 47, endSurah: 45, endAyah: 37, arabicName: "إليه يرد" },
  { number: 26, name: "Ḥāʾ Mīm", startSurah: 46, startAyah: 1, endSurah: 51, endAyah: 30, arabicName: "حاميم" },
  { number: 27, name: "Qāla Fama Khatbukum", startSurah: 51, startAyah: 31, endSurah: 57, endAyah: 29, arabicName: "قال فما خطبكم" },
  { number: 28, name: "Qadd Samiʿa", startSurah: 58, startAyah: 1, endSurah: 66, endAyah: 12, arabicName: "قد سمع" },
  { number: 29, name: "Tabārakalladhī", startSurah: 67, startAyah: 1, endSurah: 77, endAyah: 50, arabicName: "تبارك الذي" },
  { number: 30, name: "ʿAmma Yatasaʼalūn", startSurah: 78, startAyah: 1, endSurah: 114, endAyah: 6, arabicName: "عم يتساءلون" },
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
  number: z.number(),
  arabicText: z.string().optional(),
  englishText: z.string().optional(),
  urduText: z.string().optional(),
  hadithNumber: z.string(),
  narrator: z.string().optional(),
  book: z.string(),
  collection: z.string(),
  reference: z.string().optional(),
  grade: z.string().optional(),
});

export type Hadith = z.infer<typeof hadithSchema>;

// Users table
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

// Books Schema
export const bookCategories = [
  "Quran",
  "Hadith",
  "Tafseer",
  "Seerah",
  "Akhlaq",
  "Sahabah",
  "Kid Stories"
] as const;

export const booksTable = pgTable(
  "books",
  {
    id: serial("id").primaryKey(),
    title: varchar("title").notNull(),
    category: varchar("category").notNull(),
    description: varchar("description"),
    pdfUrl: varchar("pdf_url"),
    uploadedAt: timestamp("uploaded_at").defaultNow(),
  },
  (table) => [
    index("idx_books_category").on(table.category),
  ]
);

export const booksInsertSchema = createInsertSchema(booksTable).omit({
  id: true,
  uploadedAt: true,
});

export type Book = typeof booksTable.$inferSelect;
export type BookInsert = z.infer<typeof booksInsertSchema>;
