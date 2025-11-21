import type { Express } from "express";
import { createServer, type Server } from "http";
import axios from "axios";
import { storage } from "./storage";
import { insertBookmarkSchema } from "@shared/schema";
import { randomUUID } from "crypto";

const ALQURAN_CLOUD_API = "http://api.alquran.cloud/v1";
const QURAN_TAFSEER_API = "http://api.quran-tafseer.com";

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

function getFromCache(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

// Pre-load entire Quran into cache for instant voice search
async function preloadQuranData() {
  console.log("🕋 Pre-loading Quran data for voice search...");
  const startTime = Date.now();
  let successCount = 0;
  
  try {
    for (let surahNumber = 1; surahNumber <= 114; surahNumber++) {
      try {
        const cacheKey = `surah-${surahNumber}-text`;
        
        // Skip if already cached
        if (getFromCache(cacheKey)) {
          successCount++;
          continue;
        }

        // Fetch just Arabic text (fastest endpoint)
        const response = await axios.get(
          `${ALQURAN_CLOUD_API}/surah/${surahNumber}/editions/quran-uthmani`,
          { timeout: 8000 }
        );
        
        if (response.data.code === 200 && response.data.data && response.data.data[0]) {
          const surahData = response.data.data[0];
          setCache(cacheKey, {
            number: surahData.number,
            name: surahData.name,
            englishName: surahData.englishName,
            ayahs: surahData.ayahs.map((a: any) => ({
              number: a.number,
              numberInSurah: a.numberInSurah,
              text: a.text
            }))
          });
          successCount++;
        }
        
        // Small delay to avoid overwhelming API
        if (surahNumber % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (err) {
        console.error(`Failed to load Surah ${surahNumber}:`, err);
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Pre-loaded ${successCount}/114 Surahs in ${duration}s`);
  } catch (error) {
    console.error("Error during Quran pre-loading:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all Surahs (chapters)
  app.get("/api/surahs", async (req, res) => {
    try {
      const cacheKey = "surahs";
      const cached = getFromCache(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const response = await axios.get(`${ALQURAN_CLOUD_API}/surah`);
      
      if (response.data.code === 200 && response.data.data) {
        const surahs = response.data.data.map((surah: any) => ({
          number: surah.number,
          name: surah.name,
          englishName: surah.englishName,
          englishNameTranslation: surah.englishNameTranslation,
          numberOfAyahs: surah.numberOfAyahs,
          revelationType: surah.revelationType,
        }));
        
        setCache(cacheKey, surahs);
        res.json(surahs);
      } else {
        res.status(500).json({ error: "Failed to fetch surahs" });
      }
    } catch (error) {
      console.error("Error fetching surahs:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get Surah with verses, translations, and audio
  app.get("/api/surah/:surahNumber/:reciterEdition", async (req, res) => {
    try {
      const { surahNumber, reciterEdition } = req.params;
      
      // Validate surah number
      const surahNum = parseInt(surahNumber);
      if (isNaN(surahNum) || surahNum < 1 || surahNum > 114) {
        return res.status(400).json({ error: "Invalid surah number. Must be between 1 and 114" });
      }

      const cacheKey = `surah-${surahNumber}-${reciterEdition}`;
      const cached = getFromCache(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // Fetch Arabic text, audio, and translations in one request
      const editions = `quran-uthmani,${reciterEdition},ur.jalandhry,en.sahih`;
      const response = await axios.get(
        `${ALQURAN_CLOUD_API}/surah/${surahNumber}/editions/${editions}`,
        { timeout: 15000 }
      );

      if (response.data.code === 200 && response.data.data) {
        const [arabicData, audioData, urduData, englishData] = response.data.data;

        const verses = arabicData.ayahs.map((ayah: any, index: number) => ({
          ayah: {
            number: ayah.number,
            numberInSurah: ayah.numberInSurah,
            text: ayah.text,
            audio: audioData.ayahs[index]?.audio || "",
            surah: {
              number: arabicData.number,
              name: arabicData.name,
              englishName: arabicData.englishName,
            },
          },
          urduTranslation: {
            text: urduData.ayahs[index]?.text || "",
            language: "Urdu",
            translator: "Fateh Muhammad Jalandhry",
          },
          englishTranslation: {
            text: englishData.ayahs[index]?.text || "",
            language: "English",
            translator: "Sahih International",
          },
        }));

        setCache(cacheKey, verses);
        res.json(verses);
      } else {
        res.status(500).json({ error: "Failed to fetch surah data" });
      }
    } catch (error: any) {
      console.error("Error fetching surah:", error.message);
      if (error.response?.status === 404) {
        res.status(404).json({ error: "Surah not found" });
      } else if (error.code === 'ECONNABORTED') {
        res.status(504).json({ error: "Request timeout - please try again" });
      } else {
        res.status(500).json({ error: "Failed to load surah. Please try again." });
      }
    }
  });

  // Get Tafseer for a specific verse
  app.get("/api/tafseer/:surahNumber/:ayahNumber", async (req, res) => {
    try {
      const { surahNumber, ayahNumber } = req.params;
      
      // Validate input
      const surahNum = parseInt(surahNumber);
      const ayahNum = parseInt(ayahNumber);
      
      if (isNaN(surahNum) || isNaN(ayahNum) || surahNum < 1 || surahNum > 114 || ayahNum < 1) {
        return res.status(400).json({ error: "Invalid surah or ayah number" });
      }

      const tafseerID = 1; // Al-Tafsir Al-Muyassar (simple tafseer)
      const cacheKey = `tafseer-${surahNumber}-${ayahNumber}`;
      const cached = getFromCache(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const response = await axios.get(
        `${QURAN_TAFSEER_API}/tafseer/${tafseerID}/${surahNumber}/${ayahNumber}`,
        { timeout: 10000 }
      );

      if (response.data && response.data.text) {
        const tafseer = {
          ayahNumber: ayahNum,
          text: response.data.text,
          tafseerName: "التفسير الميسر (Al-Tafsir Al-Muyassar)",
          language: "Arabic",
        };
        
        setCache(cacheKey, tafseer);
        res.json(tafseer);
      } else {
        res.status(404).json({ error: "Tafseer not found for this verse" });
      }
    } catch (error: any) {
      console.error("Error fetching tafseer:", error.message);
      if (error.response?.status === 404) {
        res.status(404).json({ error: "Tafseer not available for this verse" });
      } else if (error.code === 'ECONNABORTED') {
        res.status(504).json({ error: "Request timeout - please try again" });
      } else {
        res.status(500).json({ error: "Failed to fetch tafseer" });
      }
    }
  });

  // Search for an Ayah across all Surahs by Arabic text
  app.post("/api/search-ayah", async (req, res) => {
    try {
      const { searchText } = req.body;
      
      if (!searchText || typeof searchText !== 'string' || searchText.trim().length < 2) {
        return res.status(400).json({ error: "Search text must be at least 2 characters" });
      }

      // Normalize Arabic function - enhanced for speech recognition
      const normalizeArabic = (text: string) => {
        return text
          .replace(/[\u064B-\u0652]/g, '') // Remove diacritics (tashkeel)
          .replace(/[\u0640\u061C\u200E\u200F]/g, '') // Remove tatweel, directional marks
          .replace(/[ًٌٍَُِّْ]/g, '') // Remove all harakat
          .replace(/أ/g, 'ا') // Normalize hamza variations
          .replace(/إ/g, 'ا')
          .replace(/آ/g, 'ا')
          .replace(/ٱ/g, 'ا') // Alef wasla
          .replace(/ة/g, 'ه') // Teh marbuta to heh
          .replace(/ى/g, 'ي') // Alef maksura to yeh
          .replace(/ئ/g, 'ي') // Hamza on yeh
          .replace(/ؤ/g, 'و') // Hamza on waw
          .replace(/ء/g, '') // Remove standalone hamza
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim();
      };

      const normalizedSearch = normalizeArabic(searchText);
      const searchWords = normalizedSearch.split(/\s+/).filter((w: string) => w.length > 1);
      
      let bestMatch: any = null;
      let bestScore = 0;

      // Search through pre-loaded Surahs (instant!)
      for (let surahNumber = 1; surahNumber <= 114; surahNumber++) {
        const cacheKey = `surah-${surahNumber}-text`;
        const surahData = getFromCache(cacheKey);

        // Use pre-loaded data if available
        if (surahData && surahData.ayahs && Array.isArray(surahData.ayahs)) {
          for (const ayah of surahData.ayahs) {
            const normalizedAyah = normalizeArabic(ayah.text);
            let score = 0;

            // 1. Exact match
            if (normalizedAyah === normalizedSearch) {
              score = 1.0;
            }
            // 2. Contains full search text
            else if (normalizedAyah.includes(normalizedSearch)) {
              score = 0.95;
            }
            // 3. Starts with search text
            else if (normalizedAyah.startsWith(normalizedSearch)) {
              score = 0.9;
            }
            // 4. Word-by-word fuzzy matching (handles speech recognition errors)
            else if (searchWords.length > 0) {
              const ayahWords = normalizedAyah.split(/\s+/);
              let matchedWords = 0;
              let partialMatches = 0;
              
              for (const searchWord of searchWords) {
                // Exact word match
                if (ayahWords.includes(searchWord)) {
                  matchedWords++;
                }
                // Partial match (word starts with or contains)
                else if (ayahWords.some((aw: string) => 
                  aw.startsWith(searchWord) || 
                  searchWord.startsWith(aw) ||
                  aw.includes(searchWord)
                )) {
                  partialMatches++;
                }
              }
              
              const exactRatio = matchedWords / searchWords.length;
              const partialRatio = partialMatches / searchWords.length;
              score = (exactRatio * 0.8) + (partialRatio * 0.4);
            }

            // Update best match if this score is higher
            if (score > 0.4 && score > bestScore) {
              bestScore = score;
              bestMatch = {
                surahNumber: surahData.number,
                ayahNumber: ayah.numberInSurah,
                text: ayah.text,
                surahName: surahData.name,
                surahEnglishName: surahData.englishName,
                score: score
              };
            }
          }
        }
      }

      if (bestMatch) {
        console.log(`✅ Voice Search Match: Surah ${bestMatch.surahNumber}:${bestMatch.ayahNumber} (score: ${bestMatch.score.toFixed(2)})`);
        res.json(bestMatch);
      } else {
        console.log(`❌ Voice Search: No match for "${searchText}"`);
        res.status(404).json({ error: "No matching Ayah found" });
      }
    } catch (error: any) {
      console.error("Error searching Ayah:", error.message);
      res.status(500).json({ error: "Failed to search Ayah" });
    }
  });

  // Get Hadiths from a collection
  app.get("/api/hadiths/:collection", async (req, res) => {
    try {
      const { collection } = req.params;
      const { search, page = 1 } = req.query;

      // Validate collection
      const validCollections = ['bukhari', 'muslim', 'abudawud', 'tirmidhi', 'ibnmajah', 'nasai', 'malik'];
      if (!validCollections.includes(collection)) {
        return res.status(400).json({ 
          error: "Invalid collection. Must be one of: bukhari, muslim, abudawud, tirmidhi, ibnmajah, nasai, malik" 
        });
      }

      const pageNum = parseInt(page as string) || 1;
      const pageSize = 20;
      
      const cacheKey = `hadiths-v2-${collection}-${pageNum}-${search || ''}`;
      const cached = getFromCache(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // Use fawazahmed0 Hadith API (CDN-hosted, no auth required)
      // https://github.com/fawazahmed0/hadith-api
      const HADITH_CDN = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1';
      const editionName = `eng-${collection}`; // English editions
      const url = `${HADITH_CDN}/editions/${editionName}.json`;
      
      const response = await axios.get(url, { timeout: 15000 });

      if (response.data && response.data.hadiths) {
        let allHadiths = response.data.hadiths;
        
        // Apply search filter if provided
        if (search && typeof search === 'string') {
          const searchLower = search.toLowerCase();
          allHadiths = allHadiths.filter((h: any) => 
            h.text?.toLowerCase().includes(searchLower) ||
            h.arabicnumber?.toString().includes(search) ||
            h.hadithnumber?.toString().includes(search)
          );
        }

        // Paginate results
        const start = (pageNum - 1) * pageSize;
        const end = start + pageSize;
        const paginatedHadiths = allHadiths.slice(start, end);

        const result = {
          collection: collection,
          hadiths: paginatedHadiths.map((h: any) => ({
            number: h.hadithnumber || h.arabicnumber,
            arabicText: '', // API doesn't provide Arabic in English edition
            englishText: h.text || '',
            hadithNumber: (h.hadithnumber || h.arabicnumber || '').toString(),
            narrator: '',
            book: collection,
            collection: collection,
            urduText: '', // Not available in English edition
            reference: `${collection.charAt(0).toUpperCase() + collection.slice(1)} ${h.hadithnumber || h.arabicnumber || ''}`,
            // Serialize grades: if array has objects, map to readable strings; if empty, undefined
            grade: h.grades && h.grades.length > 0 
              ? h.grades.map((g: any) => typeof g === 'object' ? `${g.name || ''}: ${g.grade || ''}`.trim() : String(g)).join(', ')
              : undefined
          })),
          page: pageNum,
          pageSize: pageSize,
          hasMore: end < allHadiths.length,
          total: allHadiths.length
        };

        // Cache for longer (data is static on CDN)
        setCache(cacheKey, result);
        res.json(result);
      } else {
        res.status(500).json({ error: "Failed to fetch hadiths" });
      }
    } catch (error: any) {
      console.error("Error fetching hadiths:", error.message);
      if (error.response?.status === 404) {
        res.status(404).json({ error: "Hadith collection not found. Try: bukhari, muslim, abudawud, tirmidhi, ibnmajah" });
      } else if (error.code === 'ECONNABORTED') {
        res.status(504).json({ error: "Request timeout - please try again" });
      } else {
        res.status(500).json({ error: "Failed to load hadiths. Please try again." });
      }
    }
  });

  // ============================================================================
  // User Session & Bookmarks API
  // ============================================================================

  // Get or create user by session ID
  app.post("/api/user/session", async (req, res) => {
    try {
      const { sessionId } = req.body;

      if (!sessionId || typeof sessionId !== 'string' || sessionId.length === 0) {
        return res.status(400).json({ error: "Session ID is required" });
      }

      // Try to find existing user
      let user = await storage.getUserBySessionId(sessionId);

      // Create new user if doesn't exist
      if (!user) {
        user = await storage.createUser({ sessionId });
      }

      res.json(user);
    } catch (error: any) {
      console.error("Error managing user session:", error.message);
      res.status(500).json({ error: "Failed to manage user session" });
    }
  });

  // Get all bookmarks for a user
  app.get("/api/bookmarks/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const bookmarks = await storage.getBookmarks(userId);
      res.json(bookmarks);
    } catch (error: any) {
      console.error("Error fetching bookmarks:", error.message);
      res.status(500).json({ error: "Failed to fetch bookmarks" });
    }
  });

  // Create a new bookmark
  app.post("/api/bookmarks", async (req, res) => {
    try {
      const parsed = insertBookmarkSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid bookmark data", details: parsed.error.errors });
      }

      const { userId, surahNumber, ayahNumber } = parsed.data;

      // Check if bookmark already exists
      const exists = await storage.checkBookmarkExists(userId, surahNumber, ayahNumber);
      if (exists) {
        return res.status(409).json({ error: "Bookmark already exists" });
      }

      const bookmark = await storage.createBookmark(parsed.data);
      res.status(201).json(bookmark);
    } catch (error: any) {
      console.error("Error creating bookmark:", error.message);
      res.status(500).json({ error: "Failed to create bookmark" });
    }
  });

  // Delete a bookmark
  app.delete("/api/bookmarks/:bookmarkId/:userId", async (req, res) => {
    try {
      const bookmarkId = parseInt(req.params.bookmarkId);
      const userId = parseInt(req.params.userId);

      if (isNaN(bookmarkId) || isNaN(userId)) {
        return res.status(400).json({ error: "Invalid bookmark ID or user ID" });
      }

      await storage.deleteBookmark(bookmarkId, userId);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting bookmark:", error.message);
      res.status(500).json({ error: "Failed to delete bookmark" });
    }
  });

  // Get all books
  app.get("/api/books", async (req, res) => {
    try {
      const books = await storage.getAllBooks();
      res.json(books);
    } catch (error: any) {
      console.error("Error fetching books:", error.message);
      res.status(500).json({ error: "Failed to fetch books" });
    }
  });

  const httpServer = createServer(app);
  
  // Pre-load Quran data in background for instant voice search
  preloadQuranData().catch(err => {
    console.error("Failed to pre-load Quran data:", err);
  });
  
  return httpServer;
}
