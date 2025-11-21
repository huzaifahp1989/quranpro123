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

// Extract numbers from text
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

// Remove all diacritics and normalize Arabic text
function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u0652\u0640\u061C\u200E\u200F]/g, '') // Remove diacritics
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

// Levenshtein distance for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[len2][len1];
}

// Find matching verse by Arabic text
function findArabicVerseMatch(
  transcript: string,
  verses: VerseWithTranslations[]
): { verse: VerseWithTranslations; score: number } | null {
  const normalizedTranscript = normalizeArabic(transcript);
  
  if (normalizedTranscript.length < 4) return null;

  let bestMatch: { verse: VerseWithTranslations; score: number } | null = null;

  for (const verse of verses) {
    const normalizedVerse = normalizeArabic(verse.ayah.text);
    let score = 0;

    // Exact match (best)
    if (normalizedVerse === normalizedTranscript) {
      score = 1.0;
    }
    // Verse contains transcript
    else if (normalizedVerse.includes(normalizedTranscript)) {
      score = 0.95;
    }
    // Transcript contains beginning of verse
    else if (normalizedVerse.startsWith(normalizedTranscript)) {
      score = 0.9;
    }
    // Check word-by-word match
    else {
      const transcriptWords = normalizedTranscript.split(/\s+/).filter(w => w.length > 1);
      const verseWords = normalizedVerse.split(/\s+/).filter(w => w.length > 1);
      
      if (transcriptWords.length === 0) return null;

      let matchedWords = 0;
      let verseIdx = 0;

      for (const tWord of transcriptWords) {
        let found = false;
        for (let i = verseIdx; i < verseWords.length && i < verseIdx + 3; i++) {
          const vWord = verseWords[i];
          
          // Exact word match
          if (vWord === tWord) {
            matchedWords++;
            verseIdx = i + 1;
            found = true;
            break;
          }
          // Fuzzy match if similar
          else if (tWord.length > 2 && vWord.length > 2) {
            const distance = levenshteinDistance(tWord, vWord);
            const similarity = 1 - distance / Math.max(tWord.length, vWord.length);
            if (similarity > 0.75) {
              matchedWords += similarity;
              verseIdx = i + 1;
              found = true;
              break;
            }
          }
        }

        if (!found && tWord.length > 2) {
          // Strong word mismatch for long words = low score
          break;
        }
      }

      score = (matchedWords / transcriptWords.length) * 0.85;
    }

    // Update best match
    if (score > 0.4 && (!bestMatch || score > bestMatch.score)) {
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

  // Process transcript when received
  useEffect(() => {
    if (transcript && !isListening) {
      // First try to extract numbers (Surah numbers)
      const numbers = extractNumbers(transcript);
      
      if (numbers.length > 0) {
        const firstNum = numbers[0];
        
        // Check if it's a valid Surah number (1-114)
        if (firstNum >= 1 && firstNum <= 114) {
          const secondNum = numbers.length > 1 ? numbers[1] : 1;
          setTargetSurah(firstNum);
          setTargetAyah(Math.max(1, secondNum));
          setMatchedVerseText(`Surah ${firstNum}${secondNum > 1 ? `, Verse ${secondNum}` : ""}`);
          setMatchScore(1.0);
          return;
        }
      }

      // Otherwise try to match Arabic verse text in current Surah
      if (verses && verses.length > 0) {
        const match = findArabicVerseMatch(transcript, verses);
        
        if (match && match.score > 0.4) {
          setTargetSurah(currentSurah);
          setTargetAyah(match.verse.ayah.numberInSurah);
          setMatchedVerseText(match.verse.ayah.text);
          setMatchScore(match.score);
          return;
        }
      }

      // No valid match
      setTargetSurah(null);
      setTargetAyah(1);
      setMatchedVerseText("");
      setMatchScore(0);
    }
  }, [transcript, isListening, verses, currentSurah]);

  const handleDialogOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      stopListening();
      setTargetSurah(null);
      setTargetAyah(1);
      setMatchedVerseText("");
      setMatchScore(0);
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
        title="Voice search - say a Surah number or recite an Ayah"
      >
        <Mic className={`w-4 h-4 ${isListening ? "animate-pulse" : ""}`} />
      </Button>

      <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Voice Search</DialogTitle>
            <DialogDescription>
              Say a Surah number (1-114) or recite an Ayah from the current Surah
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
                  ? "Speak clearly - say Surah number or recite an Ayah"
                  : "Click to start listening"}
              </p>
            </div>

            {/* Transcript Display */}
            {transcript && (
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground mb-2">You said:</p>
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
                <p className="text-xs text-muted-foreground mb-2">
                  Found {matchScore > 0.8 ? "(Exact Match)" : `(${Math.round(matchScore * 100)}% Match)`}:
                </p>
                <p className="text-sm font-medium dir-rtl mb-3 line-clamp-3">
                  {matchedVerseText}
                </p>
                <p className="text-xs text-muted-foreground">
                  {targetSurah && `Surah ${targetSurah}${surahName ? ` (${surahName})` : ""}, Verse ${targetAyah}`}
                </p>
              </div>
            )}

            {!isListening && !matchedVerseText && transcript && (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  No match found. Please:
                </p>
                <ul className="text-xs text-amber-700 dark:text-amber-400 list-disc list-inside space-y-1 mt-2">
                  <li>Say a Surah number (1-114), e.g., "Surah 5"</li>
                  <li>Or recite an Ayah clearly from the current Surah</li>
                  <li>Speak in Standard Arabic (Fusha)</li>
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
                  onClick={() => startListening()}
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
