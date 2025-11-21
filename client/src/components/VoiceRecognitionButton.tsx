import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, X, Volume2, CheckCircle } from "lucide-react";
import { useVoiceRecognition } from "@/hooks/use-voice-recognition";
import { VerseWithTranslations, Surah } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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

// Comprehensive Arabic normalization
function normalizeArabic(text: string): string {
  return text
    // Remove all diacritical marks
    .replace(/[\u064B-\u0652]/g, '')
    // Remove Quranic special characters
    .replace(/[\u0640\u061C\u200E\u200F]/g, '')
    // Normalize hamza variations
    .replace(/أ/g, 'ا')
    .replace(/إ/g, 'ا')
    .replace(/آ/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    // Normalize spaces
    .replace(/\s+/g, ' ')
    .trim();
}

// Calculate similarity score between two strings (0-1)
function stringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

// Levenshtein distance algorithm
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

// Find matching verse by Arabic text with multiple strategies
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

    // Strategy 1: Exact substring match (strongest signal)
    if (normalizedVerse.includes(normalizedTranscript)) {
      const ratio = normalizedTranscript.length / normalizedVerse.length;
      score = 0.95 + Math.min(ratio * 0.05, 0.05); // 0.95-1.0 for substring matches
    }
    // Strategy 2: Verse starts with transcript
    else if (normalizedVerse.startsWith(normalizedTranscript)) {
      score = 0.90;
    }
    // Strategy 3: Transcript starts with beginning of verse
    else if (normalizedTranscript.startsWith(normalizedVerse.substring(0, Math.min(normalizedVerse.length, normalizedTranscript.length)))) {
      score = 0.85;
    }
    // Strategy 4: Word-by-word matching
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

        // Search for word match in nearby verse words
        for (let i = Math.max(0, verseIdx - 2); i < Math.min(verseWords.length, verseIdx + 4); i++) {
          const vWord = verseWords[i];
          
          // Exact match
          if (vWord === tWord) {
            bestWordMatch = 1.0;
            bestVIdx = i;
            break;
          }
          // Fuzzy match for longer words
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
        // Weight by consecutiveness and overall match rate
        const matchRate = (totalMatches / transcriptWords.length);
        const consecutiveBonus = (consecutiveMatches / transcriptWords.length) * 0.15;
        score = Math.min(matchRate * 0.75 + consecutiveBonus, 0.85);
      }
    }

    // Update best match if this is better
    if (score > 0.3 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { verse, score };
    }
  }

  return bestMatch;
}

// Find Surah by number
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

  // Auto-start listening when dialog opens
  useEffect(() => {
    if (isOpen && !isListening) {
      startListening();
    }
  }, [isOpen, isListening, startListening]);

  // Auto-navigate when target is set
  useEffect(() => {
    if (targetSurah && !navigating && !isListening) {
      setNavigating(true);
      onNavigate(targetSurah, targetAyah);
      
      // Close dialog after navigation
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

  // Process transcript when received (only process new transcripts)
  useEffect(() => {
    // Don't reprocess same transcript
    if (!transcript || transcript === lastProcessedTranscript || isListening) {
      return;
    }

    setLastProcessedTranscript(transcript);

    // Try to extract Surah numbers first
    const numbers = extractNumbers(transcript);
    
    if (numbers.length > 0) {
      const firstNum = numbers[0];
      
      // Surah number must be 1-114
      if (firstNum >= 1 && firstNum <= 114) {
        const secondNum = numbers.length > 1 ? numbers[1] : 1;
        setTargetSurah(firstNum);
        setTargetAyah(Math.max(1, secondNum));
        setMatchedVerseText(`Surah ${firstNum}${secondNum > 1 ? `, Verse ${secondNum}` : ""}`);
        setMatchScore(1.0);
        return;
      }
    }

    // Try to match Arabic verse text in current Surah
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

    // No valid match found
    setTargetSurah(null);
    setTargetAyah(1);
    setMatchedVerseText("");
    setMatchScore(0);
  }, [transcript, isListening, verses, currentSurah, lastProcessedTranscript]);

  const handleDialogOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      stopListening();
      setTargetSurah(null);
      setTargetAyah(1);
      setMatchedVerseText("");
      setMatchScore(0);
      setLastProcessedTranscript("");
      setNavigating(false);
    }
  };

  const surahName = targetSurah && surahs ? findSurahByNumber(targetSurah, surahs)?.englishName : "";
  const matchQuality = matchScore > 0.85 ? "Excellent" : matchScore > 0.65 ? "Good" : matchScore > 0.45 ? "Fair" : "Low";

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        data-testid="button-voice-recognition"
        title="Voice search - say a Surah number or recite an Ayah"
      >
        <Mic className={`w-4 h-4 ${isListening ? "animate-pulse" : ""}`} />
      </Button>

      <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Voice Search</DialogTitle>
            <DialogDescription>
              Say a Surah number (1-114) or recite an Ayah clearly
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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
                  ? "Speak clearly - recite the Ayah or say a Surah number"
                  : "Click to start listening"}
              </p>
            </div>

            {/* Transcript Display */}
            {transcript && (
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground mb-2">Recognized:</p>
                <p className="text-sm font-medium line-clamp-4 dir-rtl">{transcript}</p>
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
                <p className="text-xs text-muted-foreground mb-2">
                  Match Found ({matchQuality} - {Math.round(matchScore * 100)}%):
                </p>
                <p className="text-sm font-medium dir-rtl mb-3 line-clamp-4">
                  {matchedVerseText}
                </p>
                <p className="text-xs text-muted-foreground">
                  {targetSurah && `Surah ${targetSurah}${surahName ? ` (${surahName})` : ""}, Verse ${targetAyah}`}
                </p>
              </div>
            )}

            {!isListening && !matchedVerseText && transcript && (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-sm text-amber-700 dark:text-amber-400 font-medium mb-2">
                  No match found
                </p>
                <ul className="text-xs text-amber-700 dark:text-amber-400 list-disc list-inside space-y-1">
                  <li>Try speaking more clearly and slowly</li>
                  <li>Ensure you're in the correct Surah</li>
                  <li>Use Standard Arabic (Fusha) pronunciation</li>
                  <li>Or say a Surah number (1-114) instead</li>
                </ul>
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
