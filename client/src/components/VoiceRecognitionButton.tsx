import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, X, Volume2, CheckCircle, Search } from "lucide-react";
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
  let normalized = text
    .replace(/[\u064B-\u0652]/g, '') // Fatha, Damma, Sukun, etc
    .replace(/[\u0640\u061C\u200E\u200F]/g, '') // Special Quran chars
    .replace(/أ/g, 'ا') // Alef with hamza
    .replace(/إ/g, 'ا') // Alef with hamza below
    .replace(/آ/g, 'ا') // Alef with madda
    .replace(/ة/g, 'ه') // Teh marbuta
    .replace(/ى/g, 'ي') // Alef maksura
    .replace(/\s+/g, ' ')
    .trim();
  
  return normalized;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

function stringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function findArabicVerseMatch(
  transcript: string,
  verses: VerseWithTranslations[]
): { verse: VerseWithTranslations; score: number } | null {
  const normalizedTranscript = normalizeArabic(transcript);
  
  console.log("🎙️ Searching with transcript:", transcript);
  console.log("📝 Normalized transcript:", normalizedTranscript);
  
  if (normalizedTranscript.length < 2) {
    console.log("⚠️ Transcript too short");
    return null;
  }

  let bestMatch: { verse: VerseWithTranslations; score: number } | null = null;
  let matchAttempts = 0;

  for (const verse of verses) {
    const normalizedVerse = normalizeArabic(verse.ayah.text);
    let score = 0;

    // Check 1: Exact substring match
    if (normalizedVerse.includes(normalizedTranscript)) {
      score = 1.0;
      console.log(`✅ EXACT MATCH - Verse ${verse.ayah.numberInSurah}: ${score}`);
    }
    // Check 2: Verse starts with transcript
    else if (normalizedVerse.startsWith(normalizedTranscript)) {
      score = 0.95;
      console.log(`✅ STARTS WITH - Verse ${verse.ayah.numberInSurah}: ${score}`);
    }
    // Check 3: Transcript is within first 70% of verse
    else if (normalizedVerse.substring(0, Math.ceil(normalizedVerse.length * 0.7)).includes(normalizedTranscript)) {
      score = 0.90;
      console.log(`✅ IN FIRST PART - Verse ${verse.ayah.numberInSurah}: ${score}`);
    }
    // Check 4: Word-by-word matching
    else {
      const transcriptWords = normalizedTranscript
        .split(/\s+/)
        .filter(w => w.length > 0);
      
      const verseWords = normalizedVerse
        .split(/\s+/)
        .filter(w => w.length > 0);
      
      if (transcriptWords.length === 0) continue;

      let matchedWords = 0;
      let totalSimilarity = 0;

      for (let i = 0; i < transcriptWords.length; i++) {
        const tWord = transcriptWords[i];
        let bestWordScore = 0;

        // Look for this word in the verse
        for (let j = 0; j < verseWords.length; j++) {
          const vWord = verseWords[j];
          
          // Exact word match
          if (vWord === tWord) {
            bestWordScore = 1.0;
            break;
          }
          // Fuzzy match
          else if (tWord.length > 1 && vWord.length > 1) {
            const similarity = stringSimilarity(tWord, vWord);
            if (similarity > bestWordScore) {
              bestWordScore = similarity;
            }
          }
        }

        if (bestWordScore > 0.6) {
          matchedWords++;
          totalSimilarity += bestWordScore;
        }
      }

      if (matchedWords > 0) {
        score = (totalSimilarity / transcriptWords.length) * 0.85;
        console.log(`📊 WORD MATCH - Verse ${verse.ayah.numberInSurah}: ${score.toFixed(2)} (matched ${matchedWords}/${transcriptWords.length} words)`);
      }
    }

    matchAttempts++;

    if (score > 0.5 && (!bestMatch || score > bestMatch.score)) {
      console.log(`🎯 NEW BEST MATCH - Verse ${verse.ayah.numberInSurah}: ${score.toFixed(2)}`);
      bestMatch = { verse, score };
    }
  }

  console.log(`\n📈 Final Result - Checked ${matchAttempts} verses, Best score: ${bestMatch?.score.toFixed(2) || 'none'}`);
  
  return bestMatch;
}

function findSurahByNumber(number: number, surahs: Surah[] | undefined): Surah | undefined {
  if (!surahs) return undefined;
  return surahs.find(s => s.number === number);
}

export function VoiceRecognitionButton({
  verses,
  surahs,
  currentSurah,
  onNavigate,
}: VoiceRecognitionButtonProps) {
  const { isListening, transcript, error, startListening, stopListening } =
    useVoiceRecognition();
  const [isOpen, setIsOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [targetSurah, setTargetSurah] = useState<number | null>(null);
  const [targetAyah, setTargetAyah] = useState<number>(1);
  const [matchedVerseText, setMatchedVerseText] = useState<string>("");
  const [matchScore, setMatchScore] = useState(0);
  const [lastProcessedTranscript, setLastProcessedTranscript] = useState("");
  const [textSearchInput, setTextSearchInput] = useState("");
  const [textSearchResults, setTextSearchResults] = useState<VerseWithTranslations[]>([]);
  const [activeTab, setActiveTab] = useState("voice");

  useEffect(() => {
    if (isOpen && !isListening && activeTab === "voice") {
      startListening();
    }
  }, [isOpen, isListening, startListening, activeTab]);

  useEffect(() => {
    if (targetSurah && !navigating && !isListening) {
      setNavigating(true);
      onNavigate(targetSurah, targetAyah);
      
      setTimeout(() => {
        setIsOpen(false);
        setNavigating(false);
        setTargetSurah(null);
        setTargetAyah(1);
        setMatchedVerseText("");
        setMatchScore(0);
      }, 800);
    }
  }, [targetSurah, isListening, navigating, targetAyah, onNavigate]);

  useEffect(() => {
    if (!transcript || transcript === lastProcessedTranscript || isListening) {
      return;
    }

    console.log("\n=== PROCESSING TRANSCRIPT ===");
    console.log("Raw transcript:", transcript);
    setLastProcessedTranscript(transcript);

    const numbers = extractNumbers(transcript);
    
    if (numbers.length > 0) {
      const firstNum = numbers[0];
      
      if (firstNum >= 1 && firstNum <= 114) {
        console.log(`✅ Detected Surah number: ${firstNum}`);
        const secondNum = numbers.length > 1 ? numbers[1] : 1;
        setTargetSurah(firstNum);
        setTargetAyah(Math.max(1, secondNum));
        setMatchedVerseText(`Surah ${firstNum}${secondNum > 1 ? `, Verse ${secondNum}` : ""}`);
        setMatchScore(1.0);
        return;
      }
    }

    if (verses && verses.length > 0) {
      console.log(`🔍 Searching among ${verses.length} verses...`);
      const match = findArabicVerseMatch(transcript, verses);
      
      if (match && match.score > 0.5) {
        console.log(`✅ FOUND MATCH - Verse ${match.verse.ayah.numberInSurah} with score ${match.score.toFixed(2)}`);
        setTargetSurah(currentSurah);
        setTargetAyah(match.verse.ayah.numberInSurah);
        setMatchedVerseText(match.verse.ayah.text);
        setMatchScore(match.score);
        return;
      } else {
        console.log("❌ No match found");
      }
    }

    setTargetSurah(null);
    setTargetAyah(1);
    setMatchedVerseText("");
    setMatchScore(0);
  }, [transcript, isListening, verses, currentSurah, lastProcessedTranscript]);

  const handleTextSearch = (value: string) => {
    setTextSearchInput(value);

    if (value.trim().length < 2) {
      setTextSearchResults([]);
      return;
    }

    const normalized = normalizeArabic(value);
    const results = verses?.filter(v => 
      normalizeArabic(v.ayah.text).includes(normalized)
    ).slice(0, 5) || [];

    setTextSearchResults(results);
  };

  const handleSelectVerse = (verse: VerseWithTranslations) => {
    setTargetSurah(currentSurah);
    setTargetAyah(verse.ayah.numberInSurah);
    setMatchedVerseText(verse.ayah.text);
    setMatchScore(1.0);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      stopListening();
      setTargetSurah(null);
      setTargetAyah(1);
      setMatchedVerseText("");
      setMatchScore(0);
      setLastProcessedTranscript("");
      setTextSearchInput("");
      setTextSearchResults([]);
      setNavigating(false);
    }
  };

  const surahName = targetSurah && surahs ? findSurahByNumber(targetSurah, surahs)?.englishName : "";

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        data-testid="button-voice-recognition"
        title="Voice search"
      >
        <Mic className={`w-4 h-4 ${isListening ? "animate-pulse" : ""}`} />
      </Button>

      <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Search Ayah</DialogTitle>
            <DialogDescription>
              Say Surah number or recite an Ayah
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="voice">Voice</TabsTrigger>
              <TabsTrigger value="search">Text Search</TabsTrigger>
            </TabsList>

            <TabsContent value="voice" className="space-y-4">
              <div
                className={`p-6 rounded-lg border-2 transition-all ${
                  navigating
                    ? "border-green-500 bg-green-500/5"
                    : isListening
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  {navigating ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Volume2
                      className={`w-5 h-5 ${isListening ? "animate-pulse text-primary" : ""}`}
                    />
                  )}
                  <span className="font-medium">
                    {navigating 
                      ? "Navigating..."
                      : isListening 
                      ? "Listening..." 
                      : "Ready"}
                  </span>
                </div>
              </div>

              {transcript && (
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-2">Recognized:</p>
                  <p className="text-sm font-medium line-clamp-3 dir-rtl">{transcript}</p>
                </div>
              )}

              {error && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {matchedVerseText && targetSurah && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <p className="text-xs text-muted-foreground mb-2">Found ({Math.round(matchScore * 100)}%):</p>
                  <p className="text-sm font-medium dir-rtl mb-3 line-clamp-3">
                    {matchedVerseText}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Surah {targetSurah}${surahName ? ` (${surahName})` : ""}, Verse {targetAyah}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                {isListening && (
                  <Button
                    variant="destructive"
                    onClick={stopListening}
                    className="flex-1 gap-2"
                    data-testid="button-stop-listening"
                  >
                    <X className="w-4 h-4" />
                    Stop
                  </Button>
                )}
                {!isListening && !matchedVerseText && transcript && (
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
                    {textSearchResults.map((verse) => (
                      <button
                        key={verse.ayah.number}
                        onClick={() => handleSelectVerse(verse)}
                        className="w-full p-3 rounded-lg border border-border hover:bg-secondary/50 text-left transition-colors"
                      >
                        <p className="text-sm font-medium dir-rtl line-clamp-2 mb-1">
                          {verse.ayah.text}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Verse {verse.ayah.numberInSurah}
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

                {matchedVerseText && targetSurah && (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                    <p className="text-xs text-muted-foreground mb-2">Selected:</p>
                    <p className="text-sm font-medium dir-rtl mb-2 line-clamp-2">
                      {matchedVerseText}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Verse {targetAyah}
                    </p>
                    <Button
                      onClick={() => handleDialogOpenChange(false)}
                      className="w-full"
                    >
                      Go to Verse
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
