import type { Express } from "express";
import { createServer, type Server } from "http";
import axios from "axios";

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

  // Alternative: Use random hadith API for variety
  app.get("/api/hadiths/:collection/random", async (req, res) => {
    try {
      const { collection } = req.params;
      
      const validCollections = ['bukhari', 'muslim', 'abudawud', 'tirmidhi', 'ibnmajah'];
      if (!validCollections.includes(collection)) {
        return res.status(400).json({ error: "Invalid collection" });
      }

      const RANDOM_HADITH_API = 'https://random-hadith-generator.vercel.app';
      const response = await axios.get(`${RANDOM_HADITH_API}/${collection}/`, { timeout: 10000 });

      if (response.data?.data) {
        const hadith = response.data.data;
        res.json({
          hadithNumber: '1',
          arabicText: '',
          englishText: hadith.hadith_english || '',
          narrator: hadith.narrator || '',
          book: collection,
          urduText: ''
        });
      } else {
        res.status(500).json({ error: "Failed to fetch random hadith" });
      }
    } catch (error: any) {
      console.error("Error fetching random hadith:", error.message);
      res.status(500).json({ error: "Failed to load hadith" });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}
