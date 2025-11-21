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

// Extract numbers from text (both English and Arabic numerals)
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

// Normalize Arabic text
function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u0652]/g, '')
    .replace(/[\u0640\u061C\u200E\u200F]/g, '')
    .replace(/أ/g, 'ا')
    .replace(/إ/g, 'ا')
    .replace(/آ/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}

// Levenshtein distance
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

// Calculate similarity
function stringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

// Find matching verse by Arabic text
function findArabicVerseMatch(
  transcript: string,
  verses: VerseWithTranslations[]
): { verse: VerseWithTranslations; score: number } | null {
  const normalizedTranscript = normalizeArabic(transcript);
  
  if (normalizedTranscript.length < 3) return null;

  let bestMatch: { verse: VerseWithTranslations; score: number } | null = null;

  for (const verse of verses) {
    const normalizedVerse = normalizeArabic(verse.ayah.text);
    let score = 0;

    if (normalizedVerse.includes(normalizedTranscript)) {
      const ratio = normalizedTranscript.length / normalizedVerse.length;
      score = 0.95 + Math.min(ratio * 0.05, 0.05);
    }
    else if (normalizedVerse.startsWith(normalizedTranscript)) {
      score = 0.90;
    }
    else if (normalizedTranscript.startsWith(normalizedVerse.substring(0, Math.min(normalizedVerse.length, normalizedTranscript.length)))) {
      score = 0.85;
    }
    else {
      const transcriptWords = normalizedTranscript
        .split(/\s+/)
        .filter(w => w.length > 1);
      
      const verseWords = normalizedVerse
        .split(/\s+/)
        .filter(w => w.length > 1);
      
      if (transcriptWords.length === 0) continue;

      let consecutiveMatches = 0;
      let totalMatches = 0;
      let verseIdx = 0;

      for (const tWord of transcriptWords) {
        let bestWordMatch = 0;
        let bestVIdx = -1;

        for (let i = Math.max(0, verseIdx - 2); i < Math.min(verseWords.length, verseIdx + 4); i++) {
          const vWord = verseWords[i];
          
          if (vWord === tWord) {
            bestWordMatch = 1.0;
            bestVIdx = i;
            break;
          }
          else if (tWord.length > 2 && vWord.length > 2) {
            const similarity = stringSimilarity(tWord, vWord);
            if (similarity > bestWordMatch && similarity > 0.7) {
              bestWordMatch = similarity;
              bestVIdx = i;
            }
          }
        }

        if (bestWordMatch > 0.7) {
          totalMatches += bestWordMatch;
          if (bestVIdx >= verseIdx - 1) {
            consecutiveMatches++;
          }
          verseIdx = bestVIdx + 1;
        }
      }

      if (totalMatches > 0 && transcriptWords.length > 0) {
        const matchRate = (totalMatches / transcriptWords.length);
        const consecutiveBonus = (consecutiveMatches / transcriptWords.length) * 0.15;
        score = Math.min(matchRate * 0.75 + consecutiveBonus, 0.85);
      }
    }

    if (score > 0.3 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { verse, score };
    }
  }

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

  // Auto-start listening when dialog opens and voice tab is active
  useEffect(() => {
    if (isOpen && !isListening && activeTab === "voice") {
      startListening();
    }
  }, [isOpen, isListening, startListening, activeTab]);

  // Auto-navigate when target is set
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

  // Process transcript when received
  useEffect(() => {
    if (!transcript || transcript === lastProcessedTranscript || isListening) {
      return;
    }

    setLastProcessedTranscript(transcript);

    const numbers = extractNumbers(transcript);
    
    if (numbers.length > 0) {
      const firstNum = numbers[0];
      
      if (firstNum >= 1 && firstNum <= 114) {
        const secondNum = numbers.length > 1 ? numbers[1] : 1;
        setTargetSurah(firstNum);
        setTargetAyah(Math.max(1, secondNum));
        setMatchedVerseText(`Surah ${firstNum}${secondNum > 1 ? `, Verse ${secondNum}` : ""}`);
        setMatchScore(1.0);
        return;
      }
    }

    if (verses && verses.length > 0) {
      const match = findArabicVerseMatch(transcript, verses);
      
      if (match && match.score > 0.35) {
        setTargetSurah(currentSurah);
        setTargetAyah(match.verse.ayah.numberInSurah);
        setMatchedVerseText(match.verse.ayah.text);
        setMatchScore(match.score);
        return;
      }
    }

    setTargetSurah(null);
    setTargetAyah(1);
    setMatchedVerseText("");
    setMatchScore(0);
  }, [transcript, isListening, verses, currentSurah, lastProcessedTranscript]);

  // Handle text search
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
        title="Voice search or text search"
      >
        <Mic className={`w-4 h-4 ${isListening ? "animate-pulse" : ""}`} />
      </Button>

      <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Search Ayah</DialogTitle>
            <DialogDescription>
              Use voice to say a Surah number, or search by text
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="voice">Voice</TabsTrigger>
              <TabsTrigger value="search">Text Search</TabsTrigger>
            </TabsList>

            {/* Voice Tab */}
            <TabsContent value="voice" className="space-y-4">
              {/* Listening Indicator */}
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
                <p className="text-sm text-muted-foreground">
                  {navigating
                    ? "Going to your selection..."
                    : isListening
                    ? "Say a Surah number (e.g., 'Surah 2')"
                    : "Click to start listening"}
                </p>
              </div>

              {/* Transcript Display */}
              {transcript && (
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-2">Recognized:</p>
                  <p className="text-sm font-medium line-clamp-3">{transcript}</p>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Match Result */}
              {matchedVerseText && targetSurah && (
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                  <p className="text-xs text-muted-foreground mb-2">Found:</p>
                  <p className="text-sm font-medium dir-rtl mb-3 line-clamp-3">
                    {matchedVerseText}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Surah {targetSurah}${surahName ? ` (${surahName})` : ""}, Verse ${targetAyah}
                  </p>
                </div>
              )}

              {/* Actions */}
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
                    data-testid="button-try-again"
                  >
                    Try Again
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => handleDialogOpenChange(false)}
                  className="flex-1"
                  data-testid="button-close-voice"
                >
                  Close
                </Button>
              </div>
            </TabsContent>

            {/* Text Search Tab */}
            <TabsContent value="search" className="space-y-4">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Type Arabic text to search..."
                    value={textSearchInput}
                    onChange={(e) => handleTextSearch(e.target.value)}
                    className="pl-10"
                    dir="rtl"
                    data-testid="input-ayah-search"
                  />
                </div>

                {/* Search Results */}
                {textSearchResults.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {textSearchResults.map((verse) => (
                      <button
                        key={verse.ayah.number}
                        onClick={() => handleSelectVerse(verse)}
                        className="w-full p-3 rounded-lg border border-border hover:bg-secondary/50 text-left transition-colors"
                        data-testid={`button-verse-result-${verse.ayah.numberInSurah}`}
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
                      No verses found. Try searching with different Arabic text.
                    </p>
                  </div>
                ) : null}

                {/* Match Result */}
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
                      data-testid="button-go-to-verse"
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
