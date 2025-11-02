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
      const { search } = req.query;

      // Validate collection
      const validCollections = ['bukhari', 'muslim'];
      if (!validCollections.includes(collection)) {
        return res.status(400).json({ 
          error: "Invalid collection. Must be 'bukhari' or 'muslim'" 
        });
      }

      // Sample hadith data (in production, this would come from an API or database)
      const sampleHadiths = {
        bukhari: [
          {
            collection: "Sahih al-Bukhari",
            bookNumber: "1",
            hadithNumber: "1",
            arabicText: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
            englishText: "The deeds are considered by the intentions, and a person will get the reward according to his intention.",
            urduText: "اعمال کا دارومدار نیتوں پر ہے اور ہر شخص کو وہی ملے گا جو اس نے نیت کی ہے۔",
            narrator: "Umar ibn Al-Khattab",
            grade: "Sahih",
            reference: "Sahih al-Bukhari 1",
          },
          {
            collection: "Sahih al-Bukhari",
            bookNumber: "2",
            hadithNumber: "8",
            arabicText: "أُمِرْتُ أَنْ أُقَاتِلَ النَّاسَ حَتَّى يَشْهَدُوا أَنْ لاَ إِلَهَ إِلاَّ اللَّهُ",
            englishText: "I have been ordered to fight against the people until they testify that none has the right to be worshipped but Allah.",
            urduText: "مجھے حکم دیا گیا ہے کہ لوگوں سے اس وقت تک جنگ کروں جب تک وہ گواہی نہ دیں کہ اللہ کے سوا کوئی معبود نہیں۔",
            narrator: "Abdullah bin Umar",
            grade: "Sahih",
            reference: "Sahih al-Bukhari 25",
          },
          {
            collection: "Sahih al-Bukhari",
            bookNumber: "2",
            hadithNumber: "13",
            arabicText: "لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
            englishText: "None of you truly believes until he loves for his brother what he loves for himself.",
            urduText: "تم میں سے کوئی شخص مومن نہیں ہو سکتا جب تک کہ وہ اپنے بھائی کے لیے وہی پسند نہ کرے جو اپنے لیے پسند کرتا ہے۔",
            narrator: "Anas",
            grade: "Sahih",
            reference: "Sahih al-Bukhari 13",
          },
          {
            collection: "Sahih al-Bukhari",
            bookNumber: "8",
            hadithNumber: "76",
            arabicText: "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ",
            englishText: "Whoever believes in Allah and the Last Day should speak good or remain silent.",
            urduText: "جو شخص اللہ اور آخرت کے دن پر ایمان رکھتا ہے اسے چاہیے کہ بھلائی کی بات کرے یا خاموش رہے۔",
            narrator: "Abu Hurairah",
            grade: "Sahih",
            reference: "Sahih al-Bukhari 6018",
          },
        ],
        muslim: [
          {
            collection: "Sahih Muslim",
            bookNumber: "1",
            hadithNumber: "1",
            arabicText: "الدِّينُ النَّصِيحَةُ",
            englishText: "Religion is sincerity and sincere advice.",
            urduText: "دین خیرخواہی کا نام ہے۔",
            narrator: "Tamim al-Dari",
            grade: "Sahih",
            reference: "Sahih Muslim 55",
          },
          {
            collection: "Sahih Muslim",
            bookNumber: "1",
            hadithNumber: "5",
            arabicText: "مَنْ غَشَّنَا فَلَيْسَ مِنَّا",
            englishText: "Whoever deceives us is not one of us.",
            urduText: "جو ہمیں دھوکہ دے وہ ہم میں سے نہیں۔",
            narrator: "Abu Hurairah",
            grade: "Sahih",
            reference: "Sahih Muslim 101",
          },
          {
            collection: "Sahih Muslim",
            bookNumber: "1",
            hadithNumber: "9",
            arabicText: "الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ",
            englishText: "The Muslim is the one from whose tongue and hand the Muslims are safe.",
            urduText: "مسلمان وہ ہے جس کی زبان اور ہاتھ سے دوسرے مسلمان محفوظ رہیں۔",
            narrator: "Abdullah bin Amr",
            grade: "Sahih",
            reference: "Sahih Muslim 40",
          },
          {
            collection: "Sahih Muslim",
            bookNumber: "33",
            hadithNumber: "6370",
            arabicText: "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ صَدَقَةٌ",
            englishText: "Your smile in the face of your brother is charity.",
            urduText: "اپنے بھائی کے چہرے پر مسکرانا صدقہ ہے۔",
            narrator: "Abu Dharr",
            grade: "Sahih",
            reference: "Sahih Muslim 2626",
          },
        ],
      };

      let hadiths = sampleHadiths[collection as keyof typeof sampleHadiths] || [];

      // Filter by search query if provided
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        hadiths = hadiths.filter((hadith: any) =>
          hadith.englishText.toLowerCase().includes(searchLower) ||
          hadith.arabicText.includes(search) ||
          hadith.urduText.includes(search) ||
          hadith.narrator.toLowerCase().includes(searchLower)
        );
      }

      res.json(hadiths);
    } catch (error) {
      console.error("Error fetching hadiths:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
