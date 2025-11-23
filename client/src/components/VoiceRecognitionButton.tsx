import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, X, Volume2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useVoiceRecognition } from "@/hooks/use-voice-recognition";
import { VerseWithTranslations, Surah } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface VoiceRecognitionButtonProps {
  verses: VerseWithTranslations[] | undefined;
  surahs: Surah[] | undefined;
  currentSurah: number;
  onNavigate: (surah: number, ayah: number) => void;
  mode?: "quran" | "hadith";
  onHadithSearch?: (query: string) => void;
}

function extractNumbers(text: string): number[] {
  const numberMatches = text.match(/[\d٠-٩۰-۹]+/g) || [];
  
  return numberMatches.map(match => {
    return parseInt(
      match
        .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660))
        .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x06F0))
    );
  });
}

function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u0652]/g, '')
    .replace(/[\u0640\u061C\u200E\u200F]/g, '')
    .replace(/[ًٌٍَُِّْ]/g, '')
    .replace(/أ/g, 'ا')
    .replace(/إ/g, 'ا')
    .replace(/آ/g, 'ا')
    .replace(/ٱ/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ئ/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ء/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function arabicWordToNumber(word: string): number | null {
  const map: Record<string, number> = {
    'واحد': 1, 'احد': 1, 'إحدى': 1, 'احدى': 1,
    'اثنان': 2, 'اثنين': 2, 'اثنتان': 2,
    'ثلاث': 3, 'ثلاثة': 3,
    'اربعة': 4, 'أربع': 4, 'أربعة': 4,
    'خمسة': 5, 'خمس': 5,
    'ستة': 6, 'ست': 6,
    'سبعة': 7, 'سبع': 7,
    'ثمانية': 8, 'ثمان': 8,
    'تسعة': 9, 'تسع': 9,
    'عشرة': 10, 'عشر': 10,
    'احد عشر': 11, 'إحدى عشر': 11, 'احدى عشر': 11,
    'اثنا عشر': 12, 'اثني عشر': 12,
    'ثلاثة عشر': 13,
    'اربعة عشر': 14, 'أربعة عشر': 14,
    'خمسة عشر': 15,
    'ستة عشر': 16,
    'سبعة عشر': 17,
    'ثمانية عشر': 18,
    'تسعة عشر': 19,
    'عشرون': 20, 'عشرين': 20,
    'ثلاثون': 30, 'ثلاثين': 30,
    'اربعون': 40, 'أربعون': 40, 'اربعين': 40, 'أربعين': 40,
    'خمسون': 50, 'خمسين': 50,
    'ستون': 60, 'ستين': 60,
    'سبعون': 70, 'سبعين': 70,
    'ثمانون': 80, 'ثمانين': 80,
    'تسعون': 90, 'تسعين': 90,
    'مئة': 100, 'مائه': 100, 'مائة': 100,
    'مئة واربعة عشر': 114, 'مائة واربعة عشر': 114,
  };
  return map[word] ?? null;
}

function extractNumbersFromWords(text: string): number[] {
  const n = normalizeArabic(text);
  const words = n.split(/\s+/);
  let results: number[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const val = arabicWordToNumber(w);
    if (val != null) {
      results.push(val);
      continue;
    }
    if (i + 2 < words.length) {
      const phrase = `${w} ${words[i+1]} ${words[i+2]}`;
      const v3 = arabicWordToNumber(phrase);
      if (v3 != null) { results.push(v3); i += 2; continue; }
    }
    if (i + 1 < words.length) {
      const phrase2 = `${w} ${words[i+1]}`;
      const v2 = arabicWordToNumber(phrase2);
      if (v2 != null) { results.push(v2); i += 1; continue; }
    }
    // Handle compositions like "خمسة وعشرون"
    if (i + 2 < words.length && words[i+1] === 'و') {
      const a = arabicWordToNumber(w);
      const b = arabicWordToNumber(words[i+2]);
      if (a != null && b != null) { results.push(a + b); i += 2; continue; }
    }
  }
  return results;
}

function findSurahByNameInTranscript(surahs: Surah[] | undefined, text: string): number | null {
  if (!surahs) return null;
  const nt = normalizeArabic(text);
  for (const s of surahs) {
    const ns = normalizeArabic(s.name || '');
    if (ns && nt.includes(ns)) {
      return s.number;
    }
  }
  return null;
}

function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

function transliterateBasic(input: string): string {
  const t = input.toLowerCase();
  const words = t.split(/\s+/).filter(Boolean);
  const map: Record<string, string> = {
    qul: 'قل',
    kul: 'قل',
    ya: 'يا',
    ayyuhal: 'أيها',
    ayuhal: 'أيها',
    ayyuha: 'أيها',
    ayyohal: 'أيها',
    kafirun: 'الكافرون',
    kafiroon: 'الكافرون',
    kafiron: 'الكافرون',
    huwallahu: 'هو الله',
    huwa: 'هو',
    allahu: 'الله',
    allah: 'الله',
    ahad: 'أحد',
  };
  const out: string[] = [];
  for (const w of words) {
    if (map[w]) {
      out.push(map[w]);
      continue;
    }
    out.push(w);
  }
  return out.join(' ');
}

export function VoiceRecognitionButton({
  verses,
  surahs,
  currentSurah,
  onNavigate,
  mode = "quran",
  onHadithSearch,
}: VoiceRecognitionButtonProps) {
  const { isListening, transcript, finalTranscript, interimTranscript, error, startListening, stopListening, requestPermission } =
    useVoiceRecognition(mode === "hadith" ? "en-US" : "ar-SA", { autoRestart: true });
  const [isOpen, setIsOpen] = useState(false);
  const [matchedVerseText, setMatchedVerseText] = useState<string>("");
  const [matchScore, setMatchScore] = useState(0);
  const [matchedSurah, setMatchedSurah] = useState<number | null>(null);
  const [matchedAyah, setMatchedAyah] = useState<number | null>(null);
  const [lastProcessedTranscript, setLastProcessedTranscript] = useState("");
  const [textSearchInput, setTextSearchInput] = useState("");
  const [textSearchResults, setTextSearchResults] = useState<{ s: number; a: number; t: string }[]>([]);
  const [activeTab, setActiveTab] = useState("voice");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (isOpen && !isListening && activeTab === "voice") {
      startListening();
    }
  }, [isOpen, isListening, startListening, activeTab]);

  // Process transcript when received
  useEffect(() => {
    const t = finalTranscript || transcript;
    if (!t || t === lastProcessedTranscript) {
      return;
    }

    console.log("\n=== PROCESSING TRANSCRIPT ===");
    console.log("Raw transcript:", t);
    setLastProcessedTranscript(t);

    // Try extracting numbers first (Surah navigation)
    let numbers = extractNumbers(t);
    if (numbers.length === 0) {
      numbers = extractNumbersFromWords(t);
    }
    const surahFromName = findSurahByNameInTranscript(surahs, containsArabic(t) ? t : transliterateBasic(t));
    
    if (surahFromName || numbers.length > 0) {
      const firstNum = numbers[0];
      const targetSurah = surahFromName || firstNum;
      if (targetSurah && targetSurah >= 1 && targetSurah <= 114) {
        const secondNum = numbers.length > 1 ? numbers[1] : 1;
        setMatchedVerseText(`Surah ${firstNum}${secondNum > 1 ? `, Verse ${secondNum}` : ""}`);
        setMatchScore(1.0);
        setMatchedSurah(targetSurah);
        setMatchedAyah(secondNum);
        
        onNavigate(targetSurah, Math.max(1, secondNum));
        try { console.log('[voice-ui] navigate numbers/name', { surah: targetSurah, ayah: secondNum }); } catch {}
        try { stopListening(); } catch {}
        setTimeout(() => {
          setIsOpen(false);
          setMatchedVerseText("");
          setMatchScore(0);
          setMatchedSurah(null);
          setMatchedAyah(null);
          setLastProcessedTranscript("");
        }, 500);
        return;
      }
    }

    const searchGlobal = async () => {
      setIsSearching(true);
      try {
        if (mode === "hadith") {
          const q = t.trim();
          if (onHadithSearch && q.length > 0) {
            const nums = extractNumbers(q);
            const query = nums.length > 0 ? String(nums[0]) : q;
            onHadithSearch(query);
            setIsOpen(false);
            setMatchedVerseText("");
            setMatchScore(0);
            setMatchedSurah(null);
            setMatchedAyah(null);
            setLastProcessedTranscript("");
          }
          return;
        }
        const normalizedSearch = normalizeArabic(containsArabic(t) ? t : transliterateBasic(t));
        const corpusKey = "quran-corpus-uthmani-v1";
        let corpus: { s: number; a: number; t: string; n: string }[] | null = null;
        const cached = localStorage.getItem(corpusKey);
        if (cached) {
          corpus = JSON.parse(cached);
        } else {
          const res = await fetch("https://api.alquran.cloud/v1/quran/quran-uthmani");
          const json = await res.json();
          const surahs = json?.data?.surahs || [];
          const arr: { s: number; a: number; t: string; n: string }[] = [];
          for (const surah of surahs) {
            for (const ayah of surah.ayahs) {
              const text = ayah.text || "";
              const n = normalizeArabic(text);
              arr.push({ s: surah.number, a: ayah.numberInSurah, t: text, n });
            }
          }
          corpus = arr;
          try { localStorage.setItem(corpusKey, JSON.stringify(arr)); } catch {}
        }

        let bestScore = 0;
        let best: { s: number; a: number; t: string } | null = null;
        const words = normalizedSearch.split(/\s+/).filter(w => w.length > 1);
        for (const item of corpus || []) {
          const normalizedAyah = item.n;
          let score = 0;
          if (normalizedAyah === normalizedSearch) {
            score = 1.0;
          } else if (normalizedAyah.includes(normalizedSearch)) {
            score = 0.95;
          } else if (normalizedAyah.startsWith(normalizedSearch)) {
            score = 0.9;
          } else if (words.length > 0) {
            const ayahWords = normalizedAyah.split(/\s+/);
            let matchedWords = 0;
            let partialMatches = 0;
            for (const w of words) {
              if (ayahWords.includes(w)) matchedWords++;
              else if (ayahWords.some((aw: string) => aw.startsWith(w) || w.startsWith(aw) || aw.includes(w))) partialMatches++;
            }
            const exactRatio = matchedWords / words.length;
            const partialRatio = partialMatches / words.length;
            score = exactRatio * 0.8 + partialRatio * 0.4;
          }
          if (score > 0.4 && score > bestScore) {
            bestScore = score;
            best = { s: item.s, a: item.a, t: item.t };
            if (bestScore >= 0.98) break;
          }
        }

        if (best) {
          setMatchedVerseText(best.t);
          setMatchScore(bestScore);
          setMatchedSurah(best.s);
          setMatchedAyah(best.a);
          onNavigate(best.s, best.a);
          try { console.log('[voice-ui] navigate global', { surah: best.s, ayah: best.a, score: bestScore }); } catch {}
          try { stopListening(); } catch {}
          setTimeout(() => {
            setIsOpen(false);
            setMatchedVerseText("");
            setMatchScore(0);
            setMatchedSurah(null);
            setMatchedAyah(null);
            setLastProcessedTranscript("");
          }, 500);
        }
      } catch (error: any) {
        try { console.error('[voice-ui] error', error?.message || error); } catch {}
        setMatchedVerseText("");
        setMatchScore(0);
        setMatchedSurah(null);
        setMatchedAyah(null);
      } finally {
        setIsSearching(false);
      }
    };

    searchGlobal();
  }, [finalTranscript, transcript, lastProcessedTranscript, onNavigate, mode, onHadithSearch]);

  const handleTextSearch = async (value: string) => {
    setTextSearchInput(value);

    const q = value.trim();
    if (q.length < 2) {
      setTextSearchResults([]);
      return;
    }

    const normalizedSearch = normalizeArabic(containsArabic(q) ? q : transliterateBasic(q));
    const corpusKey = "quran-corpus-uthmani-v1";
    let corpus: { s: number; a: number; t: string; n: string }[] | null = null;
    try {
      const cached = localStorage.getItem(corpusKey);
      if (cached) {
        corpus = JSON.parse(cached);
      } else {
        const res = await fetch("https://api.alquran.cloud/v1/quran/quran-uthmani");
        const json = await res.json();
        const surahs = json?.data?.surahs || [];
        const arr: { s: number; a: number; t: string; n: string }[] = [];
        for (const surah of surahs) {
          for (const ayah of surah.ayahs) {
            const text = ayah.text || "";
            const n = normalizeArabic(text);
            arr.push({ s: surah.number, a: ayah.numberInSurah, t: text, n });
          }
        }
        corpus = arr;
        try { localStorage.setItem(corpusKey, JSON.stringify(arr)); } catch {}
      }
    } catch {}

    let ranked: { s: number; a: number; t: string; score: number }[] = [];
    const words = normalizedSearch.split(/\s+/).filter(w => w.length > 1);
    for (const item of corpus || []) {
      const normalizedAyah = item.n;
      let score = 0;
      if (normalizedAyah === normalizedSearch) {
        score = 1.0;
      } else if (normalizedAyah.includes(normalizedSearch)) {
        score = 0.95;
      } else if (normalizedAyah.startsWith(normalizedSearch)) {
        score = 0.9;
      } else if (words.length > 0) {
        const ayahWords = normalizedAyah.split(/\s+/);
        let matchedWords = 0;
        let partialMatches = 0;
        for (const w of words) {
          if (ayahWords.includes(w)) matchedWords++;
          else if (ayahWords.some((aw: string) => aw.startsWith(w) || w.startsWith(aw) || aw.includes(w))) partialMatches++;
        }
        const exactRatio = matchedWords / words.length;
        const partialRatio = partialMatches / words.length;
        score = exactRatio * 0.8 + partialRatio * 0.4;
      }
      if (score > 0.4) {
        ranked.push({ s: item.s, a: item.a, t: item.t, score });
      }
    }
    ranked.sort((a, b) => b.score - a.score);
    const top = ranked.slice(0, 10).map(r => ({ s: r.s, a: r.a, t: r.t }));
    setTextSearchResults(top);
  };

  const handleSelectGlobalResult = (res: { s: number; a: number; t: string }) => {
    setMatchedVerseText(res.t);
    setMatchScore(1.0);
    setMatchedSurah(res.s);
    setMatchedAyah(res.a);
    onNavigate(res.s, res.a);
    try { console.log('[voice-ui] navigate selection', { surah: res.s, ayah: res.a }); } catch {}
    try { stopListening(); } catch {}
    setTimeout(() => {
      setIsOpen(false);
      setMatchedVerseText("");
      setMatchScore(0);
      setMatchedSurah(null);
      setMatchedAyah(null);
      setTextSearchInput("");
      setTextSearchResults([]);
    }, 500);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setActiveTab("voice");
      setLastProcessedTranscript("");
      setMatchedVerseText("");
      setMatchScore(0);
      setMatchedSurah(null);
      setMatchedAyah(null);
      setTextSearchInput("");
      setTextSearchResults([]);
      setIsSearching(false);
      try { requestPermission(); } catch {}
    } else {
      stopListening();
      setMatchedVerseText("");
      setMatchScore(0);
      setMatchedSurah(null);
      setMatchedAyah(null);
      setLastProcessedTranscript("");
      setTextSearchInput("");
      setTextSearchResults([]);
      setIsSearching(false);
    }
  };

  const surahName = matchedSurah && surahs ? surahs.find(s => s.number === matchedSurah)?.englishName : "";

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => { setActiveTab("voice"); setIsOpen(true); try { requestPermission(); } catch {} }}
        data-testid="button-voice-recognition"
        title="Voice search"
      >
        <Mic className={`w-4 h-4 ${isListening ? "animate-pulse" : ""}`} />
      </Button>

      <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="w-[96vw] max-w-md sm:max-w-lg sm:w-auto p-4">
          <DialogHeader>
            <DialogTitle>{mode === "hadith" ? "Search Hadith" : "Search Ayah"}</DialogTitle>
            <DialogDescription>
              {mode === "hadith" ? "Speak the hadith text or number" : "Say Surah number or recite any Ayah"}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); if (val === 'voice') { try { requestPermission(); } catch {} startListening(); } else { stopListening(); } }} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="voice">Voice</TabsTrigger>
              <TabsTrigger value="search">Text Search</TabsTrigger>
            </TabsList>

            <TabsContent value="voice" className="space-y-4">
              <div
                className={`p-6 rounded-lg border-2 transition-all ${
                  isSearching
                    ? "border-primary bg-primary/5"
                    : isListening
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  {isSearching ? (
                    <Volume2 className="w-5 h-5 animate-pulse text-primary" />
                  ) : (
                    <Volume2
                      className={`w-5 h-5 ${isListening ? "animate-pulse text-primary" : ""}`}
                    />
                  )}
                  <span className="font-medium">
                    {isSearching 
                      ? "Searching..." 
                      : isListening 
                      ? "Listening..." 
                      : "Ready"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isSearching
                    ? (mode === "hadith" ? "Searching hadith..." : "Searching across all 114 Surahs...")
                    : (mode === "hadith" ? "Speak hadith text or number" : "Say Surah number or recite any Ayah")}
                </p>
              </div>

              {(interimTranscript || transcript) && (
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-2">Recognized:</p>
                  <p className="text-sm font-medium line-clamp-3 dir-rtl">{interimTranscript || transcript}</p>
                </div>
              )}

              {error && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {matchedVerseText && matchedSurah && matchedAyah && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <p className="text-xs text-muted-foreground mb-2">Found ({Math.round(matchScore * 100)}%):</p>
                  <p className="text-sm font-medium dir-rtl mb-3 line-clamp-3">
                    {matchedVerseText}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Surah {matchedSurah}{surahName ? ` (${surahName})` : ""}, Verse {matchedAyah}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                {isListening && (
                  <Button
                    variant="destructive"
                    onClick={stopListening}
                    className="flex-1 gap-2"
                  >
                    <X className="w-4 h-4" />
                    Stop
                  </Button>
                )}
                {!isListening && !matchedVerseText && transcript && !isSearching && (
                  <Button
                    onClick={() => {
                      setLastProcessedTranscript("");
                      startListening();
                    }}
                    className="flex-1"
                  >
                    Try Again
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => handleDialogOpenChange(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="search" className="space-y-4">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Type Arabic text..."
                    value={textSearchInput}
                    onChange={(e) => handleTextSearch(e.target.value)}
                    className="pl-10"
                    dir="rtl"
                  />
                </div>

                {textSearchResults.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {textSearchResults.map((res, i) => (
                      <button
                        key={`${res.s}-${res.a}-${i}`}
                        onClick={() => handleSelectGlobalResult(res)}
                        className="w-full p-3 rounded-lg border border-border hover:bg-secondary/50 text-left transition-colors"
                      >
                        <p className="text-sm font-medium dir-rtl line-clamp-2 mb-1">
                          {res.t}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Surah {res.s}{surahs ? (() => { const s = surahs.find(x => x.number === res.s); return s ? ` (${s.englishName})` : ""; })() : ""}, Verse {res.a}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : textSearchInput.trim().length >= 2 ? (
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      No verses found
                    </p>
                  </div>
                ) : null}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
