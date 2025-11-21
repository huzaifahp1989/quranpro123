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
  
  if (normalizedTranscript.length < 2) {
    return null;
  }

  let bestMatch: { verse: VerseWithTranslations; score: number } | null = null;

  for (const verse of verses) {
    const normalizedVerse = normalizeArabic(verse.ayah.text);
    let score = 0;

    if (normalizedVerse.includes(normalizedTranscript)) {
      score = 1.0;
    }
    else if (normalizedVerse.startsWith(normalizedTranscript)) {
      score = 0.95;
    }
    else if (normalizedVerse.substring(0, Math.ceil(normalizedVerse.length * 0.7)).includes(normalizedTranscript)) {
      score = 0.90;
    }
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

        for (let j = 0; j < verseWords.length; j++) {
          const vWord = verseWords[j];
          
          if (vWord === tWord) {
            bestWordScore = 1.0;
            break;
          }
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
      }
    }

    if (score > 0.5 && (!bestMatch || score > bestMatch.score)) {
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
    if (!transcript || transcript === lastProcessedTranscript || isListening) {
      return;
    }

    setLastProcessedTranscript(transcript);

    const numbers = extractNumbers(transcript);
    
    if (numbers.length > 0) {
      const firstNum = numbers[0];
      
      if (firstNum >= 1 && firstNum <= 114) {
        const secondNum = numbers.length > 1 ? numbers[1] : 1;
        setNavigating(true);
        setMatchedVerseText(`Surah ${firstNum}${secondNum > 1 ? `, Verse ${secondNum}` : ""}`);
        setMatchScore(1.0);
        
        onNavigate(firstNum, Math.max(1, secondNum));
        
        setTimeout(() => {
          setIsOpen(false);
          setNavigating(false);
          setMatchedVerseText("");
          setMatchScore(0);
          setLastProcessedTranscript("");
        }, 2000);
        return;
      }
    }

    if (verses && verses.length > 0) {
      const match = findArabicVerseMatch(transcript, verses);
      
      if (match && match.score > 0.5) {
        setNavigating(true);
        setMatchedVerseText(match.verse.ayah.text);
        setMatchScore(match.score);
        
        onNavigate(currentSurah, match.verse.ayah.numberInSurah);
        
        setTimeout(() => {
          setIsOpen(false);
          setNavigating(false);
          setMatchedVerseText("");
          setMatchScore(0);
          setLastProcessedTranscript("");
        }, 2000);
        return;
      }
    }

    setMatchedVerseText("");
    setMatchScore(0);
  }, [transcript, isListening, verses, currentSurah, lastProcessedTranscript, onNavigate]);

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
    setNavigating(true);
    setMatchedVerseText(verse.ayah.text);
    setMatchScore(1.0);
    
    onNavigate(currentSurah, verse.ayah.numberInSurah);
    
    setTimeout(() => {
      setIsOpen(false);
      setNavigating(false);
      setMatchedVerseText("");
      setMatchScore(0);
      setTextSearchInput("");
      setTextSearchResults([]);
    }, 2000);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      stopListening();
      setMatchedVerseText("");
      setMatchScore(0);
      setLastProcessedTranscript("");
      setTextSearchInput("");
      setTextSearchResults([]);
      setNavigating(false);
    }
  };

  const surahName = surahs?.find(s => s.number === currentSurah)?.englishName || "";

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        data-testid="button-voice-recognition"
        title="Voice search"
      >
        <Mic className={`w-4 h-4 ${isListening || navigating ? "animate-pulse" : ""}`} />
      </Button>

      <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Search Ayah</DialogTitle>
            <DialogDescription>
              Say Surah number or recite an Ayah
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" disabled={navigating}>
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
                    <CheckCircle className="w-5 h-5 text-green-500 animate-pulse" />
                  ) : (
                    <Volume2
                      className={`w-5 h-5 ${isListening ? "animate-pulse text-primary" : ""}`}
                    />
                  )}
                  <span className="font-medium">
                    {navigating 
                      ? "Navigating to verse..." 
                      : isListening 
                      ? "Listening..." 
                      : "Ready"}
                  </span>
                </div>
              </div>

              {transcript && !navigating && (
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

              {matchedVerseText && navigating && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <p className="text-xs text-muted-foreground mb-2">Found ({Math.round(matchScore * 100)}%):</p>
                  <p className="text-sm font-medium dir-rtl mb-2 line-clamp-2">
                    {matchedVerseText}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                {isListening && !navigating && (
                  <Button
                    variant="destructive"
                    onClick={stopListening}
                    className="flex-1 gap-2"
                  >
                    <X className="w-4 h-4" />
                    Stop
                  </Button>
                )}
                {!isListening && !navigating && !matchedVerseText && transcript && (
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
                  disabled={navigating}
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
                    disabled={navigating}
                  />
                </div>

                {textSearchResults.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {textSearchResults.map((verse) => (
                      <button
                        key={verse.ayah.number}
                        onClick={() => handleSelectVerse(verse)}
                        disabled={navigating}
                        className="w-full p-3 rounded-lg border border-border hover:bg-secondary/50 text-left transition-colors disabled:opacity-50"
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
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
