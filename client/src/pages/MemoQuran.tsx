import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Play, Pause, Volume2, Zap, RotateCcw, BookOpen } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { VoiceRecognitionButton } from "@/components/VoiceRecognitionButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Surah, VerseWithTranslations, availableReciters, allJuz } from "@shared/schema";
import { useVoiceRecognition } from "@/hooks/use-voice-recognition";

export default function MemoQuran() {
  const [mode, setMode] = useState<'surah' | 'juz'>('surah');
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [selectedJuz, setSelectedJuz] = useState(1);
  const [startVerse, setStartVerse] = useState(1);
  const [endVerse, setEndVerse] = useState(7);
  const [selectedReciter, setSelectedReciter] = useState(availableReciters[0].identifier);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [repeatCount, setRepeatCount] = useState(1);
  const [repeatAfterReciter, setRepeatAfterReciter] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [mainTab, setMainTab] = useState('lesson');
  const [continueMode, setContinueMode] = useState(true); // Auto-play next verse
  const [audioMode, setAudioMode] = useState<'recitation' | 'translation'>('recitation'); // Recitation or translation audio
  const [pausePerVerse, setPausePerVerse] = useState(false); // Pause after each verse
  const [currentRepeatCount, setCurrentRepeatCount] = useState(1); // Track repeats for current verse
  const audioRef = useRef<HTMLAudioElement>(null);
  const { isListening, transcript, interimTranscript, error: voiceError, startListening, stopListening, requestPermission } = useVoiceRecognition("ar-SA", { autoRestart: true });
  const [reciteModeOn, setReciteModeOn] = useState(false);
  const [audioFeedbackOn, setAudioFeedbackOn] = useState(true);
  const [reciteFontScale, setReciteFontScale] = useState(1.0);
  const [wordStatuses, setWordStatuses] = useState<{ index: number; status: "ok" | "pronunciation" | "omission" | "addition" | "sequence" }[]>([]);
  const [errorLog, setErrorLog] = useState<{ ts: number; surah: number; ayah: number; type: string; expected: string; spoken?: string }[]>([]);
  const [autoDetectGlobal, setAutoDetectGlobal] = useState(true);
  const surahCacheRef = useRef<Map<number, VerseWithTranslations[]>>(new Map());
  const globalSearchInFlightRef = useRef(false);
  const [autoDetectBusy, setAutoDetectBusy] = useState(false);
  const [autoDetectError, setAutoDetectError] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectLog, setDetectLog] = useState<{ ts: number; message: string; level: "info" | "error" }[]>([]);
  const indexRef = useRef<Map<string, { surah: number; ayah: number }[]>>(new Map());
  const [tajweedOn, setTajweedOn] = useState(true);
  const [qiraat, setQiraat] = useState<'Hafs' | 'Warsh' | 'Qaloon' | 'Bayn'>("Hafs");
  const isMobileDevice = useMemo(() => {
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera || "";
    const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const narrow = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
    return mobileUA || narrow;
  }, []);
  const clearErrorLog = () => {
    setErrorLog([]);
    try { localStorage.removeItem("memoErrorLog"); } catch {}
  };
  const report = (() => {
    const freq: Record<string, number> = {};
    const types: Record<string, number> = {};
    for (const e of errorLog) {
      const key = normalizeArabic(e.expected || "");
      freq[key] = (freq[key] || 0) + 1;
      types[e.type] = (types[e.type] || 0) + 1;
    }
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { top, types };
  })();

  // Handle Juz selection
  const handleJuzChange = (juzNumber: number) => {
    const juz = allJuz.find(j => j.number === juzNumber);
    if (juz) {
      setSelectedJuz(juzNumber);
      setSelectedSurah(juz.startSurah);
      setStartVerse(juz.startAyah);
      setEndVerse(Math.min(juz.endAyah, 286)); // Max verses in any surah
      setCurrentVerseIndex(0); // Reset to first verse when switching Juz
      setIsPlaying(false); // Stop any ongoing playback
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const { data: surahs, isLoading: isSurahsLoading } = useQuery<Surah[]>({
    queryKey: ['surahs'],
    queryFn: async () => {
      const ALQURAN_CLOUD_API = 'https://api.alquran.cloud/v1';
      const res = await fetch(`${ALQURAN_CLOUD_API}/surah`);
      const json = await res.json();
      const data = json?.data || [];
      return data.map((surah: any) => ({
        number: surah.number,
        name: surah.name,
        englishName: surah.englishName,
        englishNameTranslation: surah.englishNameTranslation,
        numberOfAyahs: surah.numberOfAyahs,
        revelationType: surah.revelationType,
      })) as Surah[];
    }
  });

  // For Juz mode: fetch multiple surahs if needed
  const shouldFetchMultipleSurahs = mode === 'juz';
  const juzData = allJuz[selectedJuz - 1];
  const surahsToFetch = shouldFetchMultipleSurahs && juzData 
    ? Array.from({ length: juzData.endSurah - juzData.startSurah + 1 }, (_, i) => juzData.startSurah + i)
    : [selectedSurah];

  // Fetch first surah verses
  const { data: verses, isLoading: isVersesLoading } = useQuery<VerseWithTranslations[]>({
    queryKey: ['surah', surahsToFetch[0], selectedReciter],
    enabled: surahsToFetch.length > 0,
    queryFn: async () => {
      const ALQURAN_CLOUD_API = 'https://api.alquran.cloud/v1';
      const editions = `quran-uthmani,${selectedReciter},ur.jalandhry,en.sahih`;
      const res = await fetch(`${ALQURAN_CLOUD_API}/surah/${surahsToFetch[0]}/editions/${editions}`);
      const json = await res.json();
      const [arabicData, audioData, urduData, englishData] = json.data;
      return arabicData.ayahs.map((ayah: any, index: number) => ({
        ayah: {
          number: ayah.number,
          numberInSurah: ayah.numberInSurah,
          text: ayah.text,
          audio: (() => {
            const raw = audioData.ayahs[index]?.audio || undefined;
            if (!raw) return undefined;
            const normalized = raw.replace(/^http:\/\//, 'https://');
            return normalized;
          })(),
          surah: {
            number: arabicData.number,
            name: arabicData.name,
            englishName: arabicData.englishName,
          },
        },
        urduTranslation: urduData?.ayahs?.[index]
          ? { text: urduData.ayahs[index].text || '', language: 'Urdu', translator: 'Fateh Muhammad Jalandhry' }
          : undefined,
        englishTranslation: englishData?.ayahs?.[index]
          ? { text: englishData.ayahs[index].text || '', language: 'English', translator: 'Sahih International' }
          : undefined,
      }));
    }
  });

  // Fetch second surah if needed
  const { data: verses2, isLoading: isVerses2Loading } = useQuery<VerseWithTranslations[]>({
    queryKey: ['surah', surahsToFetch[1], selectedReciter],
    enabled: surahsToFetch.length > 1,
    queryFn: async () => {
      const ALQURAN_CLOUD_API = 'https://api.alquran.cloud/v1';
      const editions = `quran-uthmani,${selectedReciter},ur.jalandhry,en.sahih`;
      const res = await fetch(`${ALQURAN_CLOUD_API}/surah/${surahsToFetch[1]}/editions/${editions}`);
      const json = await res.json();
      const [arabicData, audioData, urduData, englishData] = json.data;
      return arabicData.ayahs.map((ayah: any, index: number) => ({
        ayah: {
          number: ayah.number,
          numberInSurah: ayah.numberInSurah,
          text: ayah.text,
          audio: (() => {
            const raw = audioData.ayahs[index]?.audio || undefined;
            if (!raw) return undefined;
            const normalized = raw.replace(/^http:\/\//, 'https://');
            return normalized;
          })(),
          surah: {
            number: arabicData.number,
            name: arabicData.name,
            englishName: arabicData.englishName,
          },
        },
        urduTranslation: urduData?.ayahs?.[index]
          ? { text: urduData.ayahs[index].text || '', language: 'Urdu', translator: 'Fateh Muhammad Jalandhry' }
          : undefined,
        englishTranslation: englishData?.ayahs?.[index]
          ? { text: englishData.ayahs[index].text || '', language: 'English', translator: 'Sahih International' }
          : undefined,
      }));
    }
  });

  // Fetch third surah if needed
  const { data: verses3, isLoading: isVerses3Loading } = useQuery<VerseWithTranslations[]>({
    queryKey: ['surah', surahsToFetch[2], selectedReciter],
    enabled: surahsToFetch.length > 2,
    queryFn: async () => {
      const ALQURAN_CLOUD_API = 'https://api.alquran.cloud/v1';
      const editions = `quran-uthmani,${selectedReciter},ur.jalandhry,en.sahih`;
      const res = await fetch(`${ALQURAN_CLOUD_API}/surah/${surahsToFetch[2]}/editions/${editions}`);
      const json = await res.json();
      const [arabicData, audioData, urduData, englishData] = json.data;
      return arabicData.ayahs.map((ayah: any, index: number) => ({
        ayah: {
          number: ayah.number,
          numberInSurah: ayah.numberInSurah,
          text: ayah.text,
          audio: (() => {
            const raw = audioData.ayahs[index]?.audio || undefined;
            if (!raw) return undefined;
            const normalized = raw.replace(/^http:\/\//, 'https://');
            return normalized;
          })(),
          surah: {
            number: arabicData.number,
            name: arabicData.name,
            englishName: arabicData.englishName,
          },
        },
        urduTranslation: urduData?.ayahs?.[index]
          ? { text: urduData.ayahs[index].text || '', language: 'Urdu', translator: 'Fateh Muhammad Jalandhry' }
          : undefined,
        englishTranslation: englishData?.ayahs?.[index]
          ? { text: englishData.ayahs[index].text || '', language: 'English', translator: 'Sahih International' }
          : undefined,
      }));
    }
  });

  // Combine all verses for Juz mode
  const allVerses = shouldFetchMultipleSurahs && juzData
    ? [
        ...(verses || []),
        ...(verses2 || []),
        ...(verses3 || []),
      ]
    : verses;

  const isVersesLoading_all = shouldFetchMultipleSurahs 
    ? isVersesLoading || (surahsToFetch.length > 1 && isVerses2Loading) || (surahsToFetch.length > 2 && isVerses3Loading)
    : isVersesLoading;

  const currentSurah = surahs?.find(s => s.number === selectedSurah);
  const maxVerses = currentSurah?.numberOfAyahs || 7;

  useEffect(() => {
    if (endVerse > maxVerses && mode === 'surah') {
      setEndVerse(maxVerses);
    }
  }, [maxVerses, mode]);

  // Reset playback state when switching modes or changing Juz/Surah
  useEffect(() => {
    setCurrentVerseIndex(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    // Reset verse range when switching to Surah mode
    if (mode === 'surah') {
      setStartVerse(1);
      setEndVerse(7);
    }
  }, [mode, selectedJuz, selectedSurah]);

  const getVerseRange = () => {
    if (!allVerses) return [];
    if (mode === 'juz' && juzData) {
      // For Juz: filter verses to only include those within Juz boundaries
      const filtered = allVerses.filter(verse => {
        const surahNum = verse.ayah.surah?.number || 0;
        const ayahNum = verse.ayah.numberInSurah;
        
        // Check if verse is within Juz boundaries
        if (surahNum < juzData.startSurah || surahNum > juzData.endSurah) {
          return false;
        }
        
        // Check ayah boundaries
        if (surahNum === juzData.startSurah && ayahNum < juzData.startAyah) {
          return false;
        }
        if (surahNum === juzData.endSurah && ayahNum > juzData.endAyah) {
          return false;
        }
        
        return true;
      });
      
      
      return filtered;
    }
    // For Surah: use startVerse and endVerse
    const start = Math.max(0, startVerse - 1);
    const end = Math.min(allVerses.length, endVerse);
    return allVerses.slice(start, end);
  };

  const verseRange = getVerseRange();
  const lastJumpAtRef = useRef<number>(0);

  function verseScore(expectedText: string, spokenText: string): number {
    const eToks = tokenize(expectedText);
    const sToks = tokenize(spokenText);
    if (eToks.length === 0 || sToks.length === 0) return 0;
    const n = Math.min(eToks.length, sToks.length);
    let sum = 0;
    for (let i = 0; i < n; i++) sum += similarity(eToks[i], sToks[i]);
    return sum / n;
  }

  async function loadSurahVerses(num: number): Promise<VerseWithTranslations[] | undefined> {
    if (surahCacheRef.current.has(num)) return surahCacheRef.current.get(num);
    try {
      const ctl = new AbortController();
      const to = setTimeout(() => ctl.abort(), 3500);
      const ALQURAN_CLOUD_API = 'https://api.alquran.cloud/v1';
      const editions = `quran-uthmani,${selectedReciter},ur.jalandhry,en.sahih`;
      const res = await fetch(`${ALQURAN_CLOUD_API}/surah/${num}/editions/${editions}`, { signal: ctl.signal });
      clearTimeout(to);
      const json = await res.json();
      const [arabicData, audioData, urduData, englishData] = json.data;
      const data: VerseWithTranslations[] = arabicData.ayahs.map((ayah: any, index: number) => ({
        ayah: {
          number: ayah.number,
          numberInSurah: ayah.numberInSurah,
          text: ayah.text,
          audio: (() => {
            const raw = audioData.ayahs[index]?.audio || undefined;
            if (!raw) return undefined;
            const normalized = raw.replace(/^http:\/\//, 'https://');
            return normalized;
          })(),
          surah: {
            number: arabicData.number,
            name: arabicData.name,
            englishName: arabicData.englishName,
          },
        },
        urduTranslation: urduData?.ayahs?.[index]
          ? { text: urduData.ayahs[index].text || '', language: 'Urdu', translator: 'Fateh Muhammad Jalandhry' }
          : undefined,
        englishTranslation: englishData?.ayahs?.[index]
          ? { text: englishData.ayahs[index].text || '', language: 'English', translator: 'Sahih International' }
          : undefined,
      }));
      surahCacheRef.current.set(num, data);
      addToIndex(num, data);
      return data;
    } catch (err) {
      setDetectLog(prev => [...prev, { ts: Date.now(), message: `Fetch failed for surah ${num}`, level: 'error' }]);
      return undefined;
    }
  }

  async function progressiveGlobalDetect(spoken: string) {
    if (globalSearchInFlightRef.current) return;
    globalSearchInFlightRef.current = true;
    setAutoDetectBusy(true);
    setAutoDetectError(null);
    setIsDetecting(true);
    try {
      const maxSurahs = 114;
      const tokens = keyTokens(spoken);
      const candidateSurahs = new Set<number>();
      for (const t of tokens) {
        const arr = indexRef.current.get(t) || [];
        for (const hit of arr) candidateSurahs.add(hit.surah);
      }
      const order: number[] = candidateSurahs.size > 0
        ? Array.from(candidateSurahs).slice(0, 25)
        : Array.from({ length: maxSurahs }, (_, i) => i + 1);
      let best = { score: 0, surah: -1, ayah: -1 };
      for (const num of order) {
        const versesX = await loadSurahVerses(num);
        if (!versesX || versesX.length === 0) continue;
        for (let i = 0; i < versesX.length; i++) {
          const sc = verseScore(versesX[i].ayah?.text || '', spoken);
          if (sc > best.score) {
            best = { score: sc, surah: num, ayah: versesX[i].ayah.numberInSurah };
          }
        }
        if (best.score >= 0.62) break;
      }
      const now = Date.now();
      if (best.surah > 0 && best.ayah > 0 && best.score >= 0.6 && now - (lastJumpAtRef.current || 0) > 900) {
        lastJumpAtRef.current = now;
        setSelectedSurah(best.surah);
        setStartVerse(best.ayah);
        const surahMeta = surahs?.find(s => s.number === best.surah);
        const maxV = surahMeta?.numberOfAyahs || 7;
        setEndVerse(Math.min(best.ayah + 10, maxV));
        setCurrentVerseIndex(0);
        setDetectLog(prev => [...prev, { ts: Date.now(), message: `Auto-detected ${best.surah}:${best.ayah} (score ${best.score.toFixed(2)})`, level: 'info' }]);
      } else {
        setAutoDetectError('Could not auto-detect verse. Please speak a longer segment or check mic/background noise.');
        setDetectLog(prev => [...prev, { ts: Date.now(), message: 'Auto-detect failed', level: 'error' }]);
      }
    } finally {
      globalSearchInFlightRef.current = false;
      setAutoDetectBusy(false);
      setIsDetecting(false);
    }
  }

  function normalizeArabic(text: string): string {
    return (text || "")
      .replace(/[\u064B-\u0652]/g, "")
      .replace(/[\u0640\u061C\u200E\u200F]/g, "")
      .replace(/[ًٌٍَُِّْ]/g, "")
      .replace(/أ/g, "ا")
      .replace(/إ/g, "ا")
      .replace(/آ/g, "ا")
      .replace(/ٱ/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/ئ/g, "ي")
      .replace(/ؤ/g, "و")
      .replace(/ء/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(text: string): string[] {
    const n = normalizeArabic(text);
    return n.split(/\s+/).filter(w => w.length > 0);
  }

  function tokenDisplay(text: string): string[] {
    return (text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  }

  function keyTokens(spoken: string): string[] {
    const toks = tokenize(spoken).filter(t => t.length >= 2);
    const uniq: string[] = [];
    for (const t of toks) { if (!uniq.includes(t)) uniq.push(t); }
    return uniq.slice(0, 5);
  }

  function addToIndex(num: number, verses: VerseWithTranslations[]) {
    for (const v of verses) {
      const ay = v.ayah;
      const toks = tokenize(ay?.text || "");
      const unique = new Set<string>(toks);
      for (const t of Array.from(unique)) {
        const arr = indexRef.current.get(t) || [];
        arr.push({ surah: ay?.surah?.number || num, ayah: ay?.numberInSurah || 1 });
        indexRef.current.set(t, arr);
      }
    }
  }

  function firstArabicLetter(word: string): string | null {
    for (const ch of word) {
      const code = ch.charCodeAt(0);
      if (code >= 0x0621 && code <= 0x064A) return ch;
    }
    return null;
  }

  function analyzeTajweed(tokens: string[]): Record<number, string> {
    const res: Record<number, string> = {};
    const ikhfaSet = new Set(["ت","ث","ج","د","ذ","ز","س","ش","ص","ض","ط","ظ","ف","ق","ك"]);
    const idghamGhunnahSet = new Set(["ي","ن","م","و"]);
    const idghamNoGhunnahSet = new Set(["ر","ل"]);
    const izharSet = new Set(["ء","ا","ه","ح","خ","ع","غ"]);
    for (let i = 0; i < tokens.length; i++) {
      const cur = tokens[i] || "";
      const next = tokens[i + 1] || "";
      const nextInit = firstArabicLetter(next) || "";
      const hasNunSukun = /نْ/.test(cur) || /[\u064B-\u064D]$/.test(cur);
      if (hasNunSukun && nextInit) {
        if (ikhfaSet.has(nextInit)) res[i] = "ikhfa";
        else if (idghamGhunnahSet.has(nextInit)) res[i] = "idgham_ghunnah";
        else if (idghamNoGhunnahSet.has(nextInit)) res[i] = "idgham_no_ghunnah";
        else if (izharSet.has(nextInit)) res[i] = "izhar";
      }
      const hasMeemSukun = /مْ/.test(cur);
      const nextMeemOrBa = nextInit === "م" || nextInit === "ب";
      if (hasMeemSukun && nextMeemOrBa) {
        if (nextInit === "ب") res[i] = res[i] ? res[i] : "ikhfa_shafawi";
        else if (nextInit === "م") res[i] = res[i] ? res[i] : "idgham_shafawi";
      }
      const hasQalqalah = /[قطبجد]ْ/.test(cur) || /[قطبجد]$/.test(cur);
      if (hasQalqalah) res[i] = res[i] ? res[i] : "qalqalah";
      const maddMark = /\u0653/.test(cur);
      const maddLetters = /[اوي]/.test(cur);
      const hamzahNext = /ء/.test(next) || /أ|إ/.test(next);
      if (maddMark || maddLetters) {
        res[i] = res[i] ? res[i] : hamzahNext ? "madd_hamzah" : "madd";
      }
    }
    return res;
  }

  function similarity(a: string, b: string): number {
    if (!a || !b) return 0;
    if (a === b) return 1;
    const len = Math.max(a.length, b.length);
    let match = 0;
    const m = Math.min(a.length, b.length);
    for (let i = 0; i < m; i++) {
      if (a[i] === b[i]) match++;
    }
    return match / len;
  }

  function alignAndDetect(expectedText: string, spokenText: string) {
    const expected = tokenize(expectedText);
    const spoken = tokenize(spokenText);
    let j = 0;
    const statuses: { index: number; status: "ok" | "pronunciation" | "omission" | "addition" | "sequence" }[] = [];
    for (let i = 0; i < expected.length; i++) {
      const e = expected[i];
      const s = spoken[j];
      if (s === undefined) {
        statuses.push({ index: i, status: "omission" });
        continue;
      }
      if (s === e) {
        statuses.push({ index: i, status: "ok" });
        j++;
        continue;
      }
      const sim = similarity(e, s);
      if (sim >= 0.6) {
        statuses.push({ index: i, status: "pronunciation" });
        j++;
        continue;
      }
      if (j + 1 < spoken.length && spoken[j + 1] === e) {
        statuses.push({ index: i, status: "sequence" });
        j += 2;
        continue;
      }
      statuses.push({ index: i, status: "omission" });
    }
    const additions: number[] = [];
    if (spoken.length > 0) {
      let consumed = 0;
      for (const st of statuses) consumed += st.status !== "omission" ? 1 : 0;
      for (let k = consumed; k < spoken.length; k++) additions.push(k);
    }
    return { statuses, additions };
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem("memoErrorLog");
      if (saved) setErrorLog(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    if (!reciteModeOn) return;
    const current = verseRange[currentVerseIndex];
    if (!current) return;
    const spoken = interimTranscript || transcript;
    if (!spoken) return;

    const candidates = allVerses || [];
    let bestIdx = -1;
    let bestScore = 0;
    for (let i = 0; i < candidates.length; i++) {
      const sc = verseScore(candidates[i]?.ayah?.text || "", spoken);
      if (sc > bestScore) { bestScore = sc; bestIdx = i; }
    }
    const now = Date.now();
    if (bestIdx >= 0 && bestScore >= 0.55 && now - (lastJumpAtRef.current || 0) > 800) {
      lastJumpAtRef.current = now;
      if (mode === 'surah') {
        const ayahNum = candidates[bestIdx]?.ayah?.numberInSurah || 1;
        setStartVerse(ayahNum);
        const maxV = maxVerses;
        setEndVerse(Math.min(ayahNum + 10, maxV));
        setCurrentVerseIndex(0);
      } else {
        setCurrentVerseIndex(bestIdx);
      }
    } else if (autoDetectGlobal && (interimTranscript?.split(/\s+/).filter(Boolean).length || transcript?.split(/\s+/).filter(Boolean).length || 0) >= 3) {
      progressiveGlobalDetect(spoken);
    }

    const res = alignAndDetect(current.ayah?.text || "", spoken);
    setWordStatuses(res.statuses);
    const surahNum = current.ayah.surah?.number || selectedSurah;
    const ayahNum = current.ayah.numberInSurah;
    for (const st of res.statuses) {
      if (st.status === "ok") continue;
      const eWord = tokenize(current.ayah?.text || "")[st.index] || "";
      const sWord = tokenize(spoken)[st.index] || "";
      const entry = { ts: Date.now(), surah: surahNum, ayah: ayahNum, type: st.status, expected: eWord, spoken: sWord };
      setErrorLog(prev => {
        const next = [...prev, entry];
        try { localStorage.setItem("memoErrorLog", JSON.stringify(next)); } catch {}
        return next;
      });
      if (audioFeedbackOn && audioRef.current) {
        const url = current.ayah?.audio;
        if (url) {
          audioRef.current.src = url;
          audioRef.current.playbackRate = playbackSpeed;
          audioRef.current.play().catch(() => {});
        }
      }
    }
  }, [interimTranscript, transcript, reciteModeOn, currentVerseIndex, verseRange, audioFeedbackOn, playbackSpeed, selectedSurah]);

  const exportErrorsCSV = () => {
    const header = "timestamp,surah,ayah,type,expected,spoken";
    const rows = errorLog.map(e => [new Date(e.ts).toISOString(), e.surah, e.ayah, e.type, (e.expected || "").replace(/,/g, " "), (e.spoken || "").replace(/,/g, " ")].join(","));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recitation-errors.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const playCurrentVerse = useCallback(() => {
    // Check if verses are loaded
    if (!allVerses || allVerses.length === 0) {
      console.warn('Verses not loaded yet');
      return;
    }
    
    if (currentVerseIndex >= verseRange.length) {
      setCurrentVerseIndex(0);
      setIsPlaying(false);
      return;
    }
    
    const verse = verseRange[currentVerseIndex];
    let audioUrl: string | undefined;
    
    // Select audio based on audioMode
    if (audioMode === 'recitation') {
      audioUrl = verse?.ayah?.audio;
    } else {
      // Translation audio not available, use recitation instead
      audioUrl = verse?.ayah?.audio;
    }
    
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play().catch(err => console.error('Play error:', err));
      setIsPlaying(true);
    }
  }, [allVerses, verseRange, currentVerseIndex, playbackSpeed, audioMode]);

  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    const handleEnded = () => {
      if (currentRepeatCount > 1) {
        setCurrentRepeatCount(prev => prev - 1);
        setTimeout(() => playCurrentVerse(), 500);
      } else {
        // Verse finished - decide what to do next
        setCurrentRepeatCount(repeatCount);
        
        if (pausePerVerse) {
          // Stop and pause on each verse
          setIsPlaying(false);
        } else if (continueMode) {
          // Auto-play next verse
          const newIndex = currentVerseIndex + 1;
          if (newIndex >= verseRange.length) {
            setIsPlaying(false);
            return;
          }
          setCurrentVerseIndex(newIndex);
        } else {
          // Stop at end of verse
          setIsPlaying(false);
        }
      }
    };
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [currentVerseIndex, repeatCount, pausePerVerse, continueMode, verseRange.length, playCurrentVerse]);

  const handlePlayClick = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      // Check if verses are loaded before playing
      if (!allVerses || allVerses.length === 0) {
        console.warn('Please wait for verses to load');
        return;
      }
      
      // Validate verse range before playing
      if (verseRange.length === 0) {
        console.warn('Verse range is empty, cannot play');
        return;
      }
      
      setCurrentVerseIndex(0);
      setCurrentRepeatCount(repeatCount);
      // Store repeat count for auto-progression
      localStorage.setItem('lastRepeatCount', repeatCount.toString());
      playCurrentVerse();
    }
  };

  const handleVerseClick = (verseIndex: number) => {
    setCurrentVerseIndex(verseIndex);
    localStorage.setItem('lastRepeatCount', repeatCount.toString());
    // Play the clicked verse immediately
    setTimeout(() => {
      const verse = verseRange[verseIndex];
      const audioUrl = verse?.ayah?.audio;
      if (audioUrl && audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.playbackRate = playbackSpeed;
        audioRef.current.play().catch(err => console.error('Play error:', err));
        setIsPlaying(true);
      }
    }, 100);
  };

  const handleStopClick = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
    setCurrentVerseIndex(0);
  };

  const increaseSpeed = () => {
    const newSpeed = Math.min(playbackSpeed + 0.25, 2.0);
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) audioRef.current.playbackRate = newSpeed;
  };

  const decreaseSpeed = () => {
    const newSpeed = Math.max(playbackSpeed - 0.25, 0.5);
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) audioRef.current.playbackRate = newSpeed;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <audio ref={audioRef} />
      <TopNav title="Memorize Quran" subtitle="Learn & Practice" theme={theme} onThemeToggle={toggleTheme} pageIcon="quran" />

      <main className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {/* Tabs */}
        <Tabs value={mainTab} onValueChange={setMainTab} className="w-full mb-6">
          <div className="flex items-center justify-between gap-2 mb-6">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="lesson" className="flex items-center gap-2">
                <span>Lesson</span>
              </TabsTrigger>
              <TabsTrigger value="guide" className="flex items-center gap-2">
                <span>Guide</span>
              </TabsTrigger>
            </TabsList>
            {allVerses && surahs && (
              <VoiceRecognitionButton
                verses={allVerses}
                surahs={surahs}
                currentSurah={selectedSurah}
                onNavigate={(surah, ayah) => {
                  setSelectedSurah(surah);
                  setStartVerse(ayah);
                  setEndVerse(Math.min(ayah + 10, surahs?.find(s => s.number === surah)?.numberOfAyahs || ayah + 10));
                  setCurrentVerseIndex(0);
                }}
              />
            )}
          </div>

          <TabsContent value="lesson" className="space-y-4">
            {/* Mode Toggle */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant={mode === 'surah' ? 'default' : 'outline'}
                    onClick={() => setMode('surah')}
                    className="flex-1"
                    data-testid="btn-mode-surah"
                  >
                    Surah Mode
                  </Button>
                  <Button 
                    size="sm" 
                    variant={mode === 'juz' ? 'default' : 'outline'}
                    onClick={() => setMode('juz')}
                    className="flex-1"
                    data-testid="btn-mode-juz"
                  >
                    Juz Mode
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Reciter Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Select Reciter</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedReciter} onValueChange={setSelectedReciter}>
                  <SelectTrigger className="border-primary/50" data-testid="select-reciter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableReciters.map((reciter) => (
                      <SelectItem key={reciter.identifier} value={reciter.identifier}>
                        {reciter.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Surah or Juz Selection */}
            {mode === 'surah' ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Select Surah</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={selectedSurah.toString()} onValueChange={(val) => {
                    setSelectedSurah(parseInt(val));
                    setStartVerse(1);
                    setEndVerse(7);
                  }}>
                    <SelectTrigger className="border-primary/50 h-10" data-testid="select-surah">
                      <SelectValue placeholder="Choose a Surah" />
                    </SelectTrigger>
                    <SelectContent>
                      {surahs?.map((surah) => (
                        <SelectItem key={surah.number} value={surah.number.toString()}>
                          <span className="font-semibold">{surah.number}. <span className="font-arabic">{surah.name}</span></span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentSurah && (
                    <div className="bg-primary/10 border border-primary/20 rounded-md p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Selected Surah</p>
                      <p className="text-base font-semibold">{currentSurah.number}. <span className="font-arabic">{currentSurah.name}</span></p>
                      <p className="text-xs text-muted-foreground mt-1">{currentSurah.numberOfAyahs} verses • {currentSurah.revelationType}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Select Juz (Para)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={selectedJuz.toString()} onValueChange={(val) => handleJuzChange(parseInt(val))}>
                    <SelectTrigger className="border-primary/50 h-10" data-testid="select-juz">
                      <SelectValue placeholder="Choose a Juz" />
                    </SelectTrigger>
                    <SelectContent>
                      {allJuz.map((juz) => (
                        <SelectItem key={juz.number} value={juz.number.toString()}>
                          <span className="font-semibold">Juz {juz.number}: {juz.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {allJuz[selectedJuz - 1] && (
                    <div className="bg-primary/10 border border-primary/20 rounded-md p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Selected Juz</p>
                      <p className="text-base font-semibold">Juz {selectedJuz}: {allJuz[selectedJuz - 1].name}</p>
                      <p className="text-xs text-muted-foreground mt-1">Surah {allJuz[selectedJuz - 1].startSurah} - {allJuz[selectedJuz - 1].endSurah}</p>
                      {allJuz[selectedJuz - 1].arabicName && <p className="text-xs font-arabic mt-1">{allJuz[selectedJuz - 1].arabicName}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Verse Range Selection - Only for Surah mode */}
            {mode === 'surah' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Verse Range</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Start Verse</label>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => setStartVerse(Math.max(1, startVerse - 1))} data-testid="btn-start-down">−</Button>
                      <input type="number" value={startVerse} onChange={(e) => setStartVerse(parseInt(e.target.value) || 1)} className="flex-1 text-center border rounded-md bg-background text-sm py-1" min="1" max={maxVerses} data-testid="input-start-verse" />
                      <Button size="sm" variant="outline" onClick={() => setStartVerse(Math.min(maxVerses, startVerse + 1))} data-testid="btn-start-up">+</Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">End Verse</label>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => setEndVerse(Math.max(startVerse, endVerse - 1))} data-testid="btn-end-down">−</Button>
                      <input type="number" value={endVerse} onChange={(e) => setEndVerse(parseInt(e.target.value) || startVerse)} className="flex-1 text-center border rounded-md bg-background text-sm py-1" min={startVerse} max={maxVerses} data-testid="input-end-verse" />
                      <Button size="sm" variant="outline" onClick={() => setEndVerse(Math.min(maxVerses, endVerse + 1))} data-testid="btn-end-up">+</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Loading indicator for Juz mode */}
            {mode === 'juz' && isVersesLoading_all && (
              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-4 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">Loading Juz verses...</p>
                </CardContent>
              </Card>
            )}

            {/* Playback Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Playback Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Repeat each Verse</label>
                  <Select value={repeatCount.toString()} onValueChange={(val) => setRepeatCount(parseInt(val))}>
                    <SelectTrigger className="border-primary/50" data-testid="select-repeat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 3, 5, 7, 10].map((num) => (
                        <SelectItem key={num} value={num.toString()}>{num}x</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-xs">Repeat after Reciter</label>
                  <Button size="sm" variant={repeatAfterReciter ? "default" : "outline"} onClick={() => setRepeatAfterReciter(!repeatAfterReciter)} data-testid="btn-repeat-after">
                    {repeatAfterReciter ? 'On' : 'Off'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-xs">Continue to Next Verse</label>
                  <Button size="sm" variant={continueMode ? "default" : "outline"} onClick={() => setContinueMode(!continueMode)} data-testid="btn-continue-mode">
                    {continueMode ? 'On' : 'Off'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-xs">Pause After Each Verse</label>
                  <Button size="sm" variant={pausePerVerse ? "default" : "outline"} onClick={() => setPausePerVerse(!pausePerVerse)} data-testid="btn-pause-per-verse">
                    {pausePerVerse ? 'On' : 'Off'}
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Audio Source</label>
                  <div className="p-2 bg-muted/50 rounded-md">
                    <p className="text-xs font-semibold text-foreground">Quranic Recitation</p>
                    <p className="text-xs text-muted-foreground mt-1">Translation audio available in Quran Dictionary</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Recitation Correction</CardTitle>
                <CardDescription className="text-xs">Real-time detection and feedback</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" className={isMobileDevice ? 'flex-1' : ''} variant={reciteModeOn ? "default" : "outline"} onClick={() => { setReciteModeOn(!reciteModeOn); if (!reciteModeOn) { try { requestPermission(); } catch {} startListening(); } else { stopListening(); } }} data-testid="btn-recite-mode">{reciteModeOn ? "Listening" : "Start Recitation"}</Button>
                  <Button size="sm" className={isMobileDevice ? 'flex-1' : ''} variant={audioFeedbackOn ? "default" : "outline"} onClick={() => setAudioFeedbackOn(!audioFeedbackOn)} data-testid="btn-audio-feedback">{audioFeedbackOn ? "Audio Feedback On" : "Audio Feedback Off"}</Button>
                  <Button size="sm" className={isMobileDevice ? 'flex-1' : ''} variant={autoDetectGlobal ? "default" : "outline"} onClick={() => setAutoDetectGlobal(!autoDetectGlobal)} data-testid="btn-auto-detect-global">{autoDetectGlobal ? "Auto Detect Quran" : "Detect Current Only"}</Button>
                  <Button size="sm" className={isMobileDevice ? 'flex-1' : ''} variant="destructive" onClick={() => { stopListening(); setReciteModeOn(false); setIsDetecting(false); }} data-testid="btn-stop-detection">Stop Detection</Button>
                  <Button size="sm" className={isMobileDevice ? 'flex-1' : ''} variant="outline" onClick={() => { try { setAutoDetectBusy(true); exportErrorsCSV(); } finally { setAutoDetectBusy(false); } }} aria-busy={autoDetectBusy} data-testid="btn-export-errors">{autoDetectBusy ? 'Exporting…' : 'Export CSV'}</Button>
                  <Button size="sm" className={isMobileDevice ? 'flex-1' : ''} variant={tajweedOn ? 'default' : 'outline'} onClick={() => setTajweedOn(!tajweedOn)} data-testid="btn-tajweed-toggle">{tajweedOn ? 'Tajweed On' : 'Tajweed Off'}</Button>
                  <Select value={qiraat} onValueChange={(v) => setQiraat(v as any)}>
                    <SelectTrigger className="h-8" data-testid="select-qiraat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['Hafs','Warsh','Qaloon','Bayn'].map((q) => (
                        <SelectItem key={q} value={q}>{q}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs">Font Size</label>
                  <Button size="sm" variant="outline" onClick={() => setReciteFontScale(Math.max(0.8, reciteFontScale - 0.1))} data-testid="btn-font-down">−</Button>
                  <span className="text-xs font-semibold">{reciteFontScale.toFixed(1)}x</span>
                  <Button size="sm" variant="outline" onClick={() => setReciteFontScale(Math.min(2.0, reciteFontScale + 0.1))} data-testid="btn-font-up">+</Button>
                </div>
                <div className="p-3 rounded bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Recognized</p>
                  <p className="text-sm dir-rtl" aria-live="polite">{interimTranscript || transcript}</p>
                  {voiceError && <p className="text-xs text-destructive mt-1">{voiceError}</p>}
                  {autoDetectBusy && <p className="text-xs text-muted-foreground mt-1">Auto-detecting best match…</p>}
                  {isDetecting && <p className="text-xs text-muted-foreground mt-1">Processing…</p>}
                  {autoDetectError && <p className="text-xs text-destructive mt-1">{autoDetectError}</p>}
                </div>
                <div className="p-3 rounded bg-muted/30">
                  <p className="text-xs font-semibold">Troubleshooting</p>
                  <ul className="text-xs list-disc pl-4 mt-1 space-y-1">
                    <li>Speak 3–5 words from the verse</li>
                    <li>Reduce background noise and hold phone close</li>
                    <li>Check microphone permission in browser settings</li>
                    <li>Switch to Wi‑Fi or stronger network if detection is slow</li>
                  </ul>
                </div>
                {verseRange[currentVerseIndex] && (
                  <div className="space-y-2">
                    <div className="text-center p-3 rounded bg-background border">
                      <div className="font-arabic antialiased dir-rtl text-right whitespace-normal break-words leading-relaxed sm:leading-loose" style={{ fontSize: `${reciteFontScale}em` }}>
                        {(() => {
                          const toks = tokenDisplay(verseRange[currentVerseIndex].ayah?.text || "");
                          const tj = tajweedOn ? analyzeTajweed(toks) : {};
                          return toks.map((w, i) => {
                            const st = wordStatuses.find(s => s.index === i)?.status || "ok";
                            const cls = st === "ok"
                              ? ""
                              : st === "pronunciation"
                                ? "bg-yellow-100 dark:bg-yellow-900/40 ring-1 ring-yellow-300/60"
                                : st === "omission"
                                  ? "bg-red-100 dark:bg-red-900/40 ring-1 ring-red-400/60"
                                  : st === "sequence"
                                    ? "bg-orange-100 dark:bg-orange-900/40 ring-1 ring-orange-300/60"
                                    : "bg-purple-100 dark:bg-purple-900/40 ring-1 ring-purple-300/60";
                          const tcls = tj[i] === 'ikhfa'
                            ? 'ring-2 ring-orange-500'
                            : tj[i] === 'idgham_ghunnah'
                              ? 'ring-2 ring-purple-500'
                              : tj[i] === 'idgham_no_ghunnah'
                                ? 'ring-2 ring-purple-700'
                                : tj[i] === 'izhar'
                                  ? 'ring-2 ring-sky-500'
                                  : tj[i] === 'qalqalah'
                                    ? 'ring-2 ring-blue-500'
                                    : tj[i] === 'madd_hamzah'
                                      ? 'ring-2 ring-green-600'
                                      : tj[i] === 'madd'
                                        ? 'ring-2 ring-green-500'
                                        : tj[i] === 'ikhfa_shafawi'
                                          ? 'ring-2 ring-orange-700'
                                          : tj[i] === 'idgham_shafawi'
                                            ? 'ring-2 ring-purple-400'
                                            : '';
                            return (
                              <span key={i} className={`px-1.5 py-0.5 mx-0.5 rounded-md ${cls} ${tcls}`}>{w}</span>
                            );
                          });
                        })()}
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">Surah {verseRange[currentVerseIndex].ayah.surah?.number}:{verseRange[currentVerseIndex].ayah.numberInSurah}</div>
                    </div>
                    {tajweedOn && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded bg-muted/30 text-xs">
                          <p className="font-semibold">Tajweed Legend</p>
                          <div className="mt-1 space-y-1">
                            <div className="flex items-center justify-between"><span>Ikhfa</span><span className="inline-block w-4 h-4 ring-2 ring-orange-500 rounded"></span></div>
                            <div className="flex items-center justify-between"><span>Idgham (Ghunnah)</span><span className="inline-block w-4 h-4 ring-2 ring-purple-500 rounded"></span></div>
                            <div className="flex items-center justify-between"><span>Idgham (No Ghunnah)</span><span className="inline-block w-4 h-4 ring-2 ring-purple-700 rounded"></span></div>
                            <div className="flex items-center justify-between"><span>Izhar</span><span className="inline-block w-4 h-4 ring-2 ring-sky-500 rounded"></span></div>
                            <div className="flex items-center justify-between"><span>Qalqalah</span><span className="inline-block w-4 h-4 ring-2 ring-blue-500 rounded"></span></div>
                            <div className="flex items-center justify-between"><span>Madd</span><span className="inline-block w-4 h-4 ring-2 ring-green-500 rounded"></span></div>
                            <div className="flex items-center justify-between"><span>Madd (Hamzah)</span><span className="inline-block w-4 h-4 ring-2 ring-green-600 rounded"></span></div>
                            <div className="flex items-center justify-between"><span>Ikhfa Shafawi</span><span className="inline-block w-4 h-4 ring-2 ring-orange-700 rounded"></span></div>
                            <div className="flex items-center justify-between"><span>Idgham Shafawi</span><span className="inline-block w-4 h-4 ring-2 ring-purple-400 rounded"></span></div>
                          </div>
                        </div>
                        <div className="p-2 rounded bg-muted/30 text-xs">
                          <p className="font-semibold">Recitation Style</p>
                          <p>{qiraat}</p>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded bg-muted/30">
                        <p className="text-xs font-semibold">Errors</p>
                        <p className="text-xs">{wordStatuses.filter(s => s.status !== "ok").length}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/30">
                        <p className="text-xs font-semibold">Pronunciation</p>
                        <p className="text-xs">{wordStatuses.filter(s => s.status === "pronunciation").length}</p>
                      </div>
                    </div>
                    <div className="p-3 rounded bg-muted/30">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold">Practice Report</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={clearErrorLog} data-testid="btn-clear-errors">Clear</Button>
                          <Button size="sm" variant="outline" onClick={exportErrorsCSV} data-testid="btn-export-errors-2">Export CSV</Button>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="text-xs">
                          <p className="text-muted-foreground">Top Mistakes</p>
                          {report.top.map(([w, c], i) => (
                            <div key={i} className="flex items-center justify-between"><span className="font-arabic">{w}</span><span>{c}</span></div>
                          ))}
                        </div>
                        <div className="text-xs">
                          <p className="text-muted-foreground">By Type</p>
                          {Object.entries(report.types).map(([t, c], i) => (
                            <div key={i} className="flex items-center justify-between"><span>{t}</span><span>{c}</span></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Speed & Control */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Playback Speed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <Button size="sm" variant="outline" onClick={decreaseSpeed} data-testid="btn-speed-down">−</Button>
                  <span className="text-center font-semibold text-sm min-w-12">{playbackSpeed.toFixed(2)}x</span>
                  <Button size="sm" variant="outline" onClick={increaseSpeed} data-testid="btn-speed-up">+</Button>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="lg" 
                    className="flex-1 gap-2" 
                    onClick={handlePlayClick} 
                    data-testid="btn-play-pause"
                    disabled={isVersesLoading}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    {isPlaying ? 'Pause' : 'Play'}
                  </Button>
                  <Button size="lg" variant="outline" onClick={handleStopClick} data-testid="btn-stop">Stop</Button>
                </div>
              </CardContent>
            </Card>

            {/* Current Verse Display */}
            {isVersesLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}

            {verseRange.length > 0 && !isVersesLoading_all && (
              <>
                <Card>
                  <CardHeader className="pb-2 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        {mode === 'juz' ? (
                          <>
                            <CardTitle className="text-sm">Juz {selectedJuz} • Surah {verseRange[currentVerseIndex]?.ayah.surah?.number} • Verse {verseRange[currentVerseIndex]?.ayah.numberInSurah}/{verseRange.length}</CardTitle>
                            <CardDescription className="text-xs mt-1">{currentVerseIndex + 1}/{verseRange.length}</CardDescription>
                          </>
                        ) : (
                          <>
                            <CardTitle className="text-sm">Surah {currentSurah?.name} • Verse {currentVerseIndex + startVerse}/{endVerse}</CardTitle>
                            <CardDescription className="text-xs mt-1">{verseRange[currentVerseIndex + 1] ? `Verse ${currentVerseIndex + 1}/${verseRange.length}` : 'Last verse'}</CardDescription>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-4">
                    {verseRange[currentVerseIndex] && (
                      <div className="text-center space-y-3 bg-muted/50 p-4 rounded-md">
                        <p className="font-arabic dir-rtl text-xl sm:text-3xl leading-loose break-words">{verseRange[currentVerseIndex].ayah?.text}</p>
                        {mode === 'juz' ? (
                          <p className="text-xs text-muted-foreground font-semibold">Surah {verseRange[currentVerseIndex].ayah.surah?.number}:{verseRange[currentVerseIndex].ayah.numberInSurah}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground font-semibold">Ayah {currentVerseIndex + startVerse}</p>
                        )}
                        {verseRange[currentVerseIndex].urduTranslation && <p className="text-xs text-foreground/80 mt-2">{verseRange[currentVerseIndex].urduTranslation.text}</p>}
                        {verseRange[currentVerseIndex].englishTranslation && <p className="text-xs text-foreground/70 mt-2">{verseRange[currentVerseIndex].englishTranslation.text}</p>}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* All Verses List */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">All Verses ({verseRange.length})</CardTitle>
                    <CardDescription className="text-xs">Click any verse to play from there</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {verseRange.map((verse, index) => (
                        <button
                          key={index}
                          onClick={() => handleVerseClick(index)}
                          data-testid={`btn-verse-${index}`}
                          className={`w-full text-left p-3 rounded-md border-2 transition-all ${
                            currentVerseIndex === index
                              ? 'border-primary bg-primary/10'
                              : 'border-muted hover-elevate hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-arabic dir-rtl text-right text-base sm:text-lg leading-relaxed break-words">{verse.ayah?.text}</p>
                              {verse.englishTranslation && <p className="text-xs text-muted-foreground mt-1">{verse.englishTranslation.text}</p>}
                            </div>
                            <span className="text-xs font-semibold shrink-0 whitespace-nowrap px-2 py-1 bg-muted rounded">
                              {mode === 'juz' ? `${verse.ayah.surah?.number}:${verse.ayah.numberInSurah}` : index + startVerse}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="guide" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>How to Use This Tool</CardTitle>
                <CardDescription>Tips for effective Quran memorization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">1. Select Your Reciter</h4>
                    <p className="text-muted-foreground">Choose from authentic Quranic reciters with clear, accurate pronunciations.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">2. Choose Surah & Verses</h4>
                    <p className="text-muted-foreground">Select the Surah and set the verse range you want to memorize. Start with shorter ranges.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">3. Adjust Speed</h4>
                    <p className="text-muted-foreground">Slow down the recitation to catch every word. Gradually increase speed as you memorize.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">4. Use Repeat Function</h4>
                    <p className="text-muted-foreground">Repeat each verse multiple times (3x-7x recommended) to reinforce memorization.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">5. Practice Consistently</h4>
                    <p className="text-muted-foreground">Regular daily practice is key. Start with small portions and gradually expand your memorization.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Memorization Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>• Listen to the pronunciation multiple times before attempting to memorize</p>
                <p>• Try to follow along with the Arabic text</p>
                <p>• Understand the meaning with the translation provided</p>
                <p>• Practice reciting out loud after listening</p>
                <p>• Review previously memorized verses regularly</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
