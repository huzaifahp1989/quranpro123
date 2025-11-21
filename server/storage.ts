import { 
  type User, 
  type InsertUser,
  type Bookmark,
  type InsertBookmark,
  type ReadingPosition,
  type InsertReadingPosition,
  type UserPreferences,
  type InsertUserPreferences,
  type Book,
  type BookInsert,
  users,
  bookmarks,
  readingPosition,
  userPreferences,
  booksTable,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserBySessionId(sessionId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Bookmark methods
  getBookmarks(userId: number): Promise<Bookmark[]>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  deleteBookmark(id: number, userId: number): Promise<void>;
  checkBookmarkExists(userId: number, surahNumber: number, ayahNumber: number): Promise<boolean>;

  // Reading position methods
  getReadingPosition(userId: number): Promise<ReadingPosition | undefined>;
  upsertReadingPosition(position: InsertReadingPosition): Promise<ReadingPosition>;

  // User preferences methods
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  upsertUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;

  // Books methods
  getAllBooks(): Promise<Book[]>;
  createBook(book: BookInsert): Promise<Book>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserBySessionId(sessionId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.sessionId, sessionId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Bookmark methods
  async getBookmarks(userId: number): Promise<Bookmark[]> {
    return await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt));
  }

  async createBookmark(bookmark: InsertBookmark): Promise<Bookmark> {
    const [newBookmark] = await db
      .insert(bookmarks)
      .values(bookmark)
      .returning();
    return newBookmark;
  }

  async deleteBookmark(id: number, userId: number): Promise<void> {
    await db
      .delete(bookmarks)
      .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, userId)));
  }

  async checkBookmarkExists(userId: number, surahNumber: number, ayahNumber: number): Promise<boolean> {
    const [bookmark] = await db
      .select()
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, userId),
          eq(bookmarks.surahNumber, surahNumber),
          eq(bookmarks.ayahNumber, ayahNumber)
        )
      );
    return !!bookmark;
  }

  // Reading position methods
  async getReadingPosition(userId: number): Promise<ReadingPosition | undefined> {
    const [position] = await db
      .select()
      .from(readingPosition)
      .where(eq(readingPosition.userId, userId));
    return position || undefined;
  }

  async upsertReadingPosition(position: InsertReadingPosition): Promise<ReadingPosition> {
    // Try to insert, on conflict update
    const [result] = await db
      .insert(readingPosition)
      .values({
        ...position,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: readingPosition.userId,
        set: {
          surahNumber: position.surahNumber,
          ayahNumber: position.ayahNumber,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  // User preferences methods
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return preferences || undefined;
  }

  async upsertUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const [result] = await db
      .insert(userPreferences)
      .values({
        ...preferences,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          reciterIdentifier: preferences.reciterIdentifier,
          theme: preferences.theme,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  // Books methods
  async getAllBooks(): Promise<Book[]> {
    return await db
      .select()
      .from(booksTable)
      .orderBy(desc(booksTable.uploadedAt));
  }

  async createBook(book: BookInsert): Promise<Book> {
    const [newBook] = await db
      .insert(booksTable)
      .values(book)
      .returning();
    return newBook;
  }
}

export const storage = new DatabaseStorage();
