import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, X, Volume2 } from "lucide-react";
import { useVoiceRecognition } from "@/hooks/use-voice-recognition";
import { VerseWithTranslations } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface VoiceRecognitionButtonProps {
  verses: VerseWithTranslations[] | undefined;
  currentSurah: number;
  onNavigate: (surah: number, ayah: number) => void;
}

// Remove ALL diacritics and normalize Arabic text ONLY
function normalizeArabicOnly(text: string): string {
  // Remove all Arabic diacritics (tashkeel)
  let normalized = text.replace(/[\u064B-\u0652\u0640\u061C\u200E\u200F]/g, '');
  // Remove extra spaces
  normalized = normalized.trim().replace(/\s+/g, ' ');
  // Keep as is - don't lowercase for better Arabic matching
  return normalized;
}

// Check if transcribed text matches Quranic Arabic
function findArabicMatch(
  transcript: string,
  verses: VerseWithTranslations[]
): { verse: VerseWithTranslations | null; score: number } {
  const normalizedTranscript = normalizeArabicOnly(transcript);
  
  // Only search if we have meaningful Arabic text
  if (!normalizedTranscript || normalizedTranscript.length < 3) {
    return { verse: null, score: 0 };
  }

  let bestMatch: VerseWithTranslations | null = null;
  let bestScore = 0;

  for (const verse of verses) {
    const normalizedVerse = normalizeArabicOnly(verse.ayah.text);
    let score = 0;

    // Perfect match: transcript is substring of verse
    if (normalizedVerse.includes(normalizedTranscript)) {
      score = 1.0;
    }
    // Good match: verse starts with transcript
    else if (normalizedVerse.startsWith(normalizedTranscript)) {
      score = 0.95;
    }
    // Good match: first 70%+ of verses matches start of transcript
    else if (normalizedTranscript.startsWith(normalizedVerse.substring(0, normalizedVerse.length * 0.7))) {
      score = 0.85;
    }
    // Partial match: multiple consecutive words match
    else {
      const transcriptWords = normalizedTranscript.split(/\s+/);
      const verseWords = normalizedVerse.split(/\s+/);
      
      // Check if first N words of transcript match verse
      let consecutiveMatches = 0;
      let verseIdx = 0;
      
      for (const transcriptWord of transcriptWords) {
        if (transcriptWord.length < 2) continue;
        
        let foundMatch = false;
        for (let i = verseIdx; i < verseWords.length; i++) {
          if (verseWords[i] === transcriptWord || 
              (verseWords[i].length > 3 && transcriptWord.length > 3 && verseWords[i].startsWith(transcriptWord.substring(0, 3)))) {
            consecutiveMatches++;
            verseIdx = i + 1;
            foundMatch = true;
            break;
          }
        }
        
        if (!foundMatch) {
          break; // Stop counting consecutive matches
        }
      }
      
      const minWords = Math.min(transcriptWords.length, 3);
      if (consecutiveMatches >= minWords && minWords > 0) {
        score = (consecutiveMatches / transcriptWords.length) * 0.75;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = verse;
    }
  }

  return { verse: bestMatch, score: bestScore };
}

export function VoiceRecognitionButton({
  verses,
  currentSurah,
  onNavigate,
}: VoiceRecognitionButtonProps) {
  const { isListening, transcript, error, startListening, stopListening } =
    useVoiceRecognition();
  const [isOpen, setIsOpen] = useState(false);
  const [matchedVerse, setMatchedVerse] = useState<VerseWithTranslations | null>(null);
  const [matchScore, setMatchScore] = useState(0);

  // Auto-start listening when dialog opens
  useEffect(() => {
    if (isOpen && !isListening) {
      startListening();
    }
  }, [isOpen, isListening, startListening]);

  // Search for matching ayah when transcript changes and it's final
  useEffect(() => {
    if (transcript && !isListening && verses && verses.length > 0) {
      const { verse, score } = findArabicMatch(transcript, verses);

      // Accept any meaningful match (threshold: 20%)
      if (score > 0.2) {
        setMatchedVerse(verse);
        setMatchScore(score);
      } else {
        setMatchedVerse(null);
        setMatchScore(0);
      }
    }
  }, [transcript, isListening, verses]);

  const handleNavigate = () => {
    if (matchedVerse) {
      onNavigate(currentSurah, matchedVerse.ayah.numberInSurah);
      setIsOpen(false);
      setMatchedVerse(null);
      setMatchScore(0);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      stopListening();
      setMatchedVerse(null);
      setMatchScore(0);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        data-testid="button-voice-recognition"
        title="Click to recite Quran"
      >
        <Mic className={`w-4 h-4 ${isListening ? "animate-pulse" : ""}`} />
      </Button>

      <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recite the Quran</DialogTitle>
            <DialogDescription>
              Speak the Arabic verse clearly - listening has started
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Listening Indicator */}
            <div
              className={`p-6 rounded-lg border-2 transition-all ${
                isListening
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <Volume2
                  className={`w-5 h-5 ${isListening ? "animate-pulse text-primary" : ""}`}
                />
                <span className="font-medium">
                  {isListening ? "Listening now..." : "Starting to listen..."}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {isListening
                  ? "Recite the verse clearly in Arabic"
                  : "Preparing to listen..."}
              </p>
            </div>

            {/* Transcript Display */}
            {transcript && (
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground mb-2">Your recitation:</p>
                <p className="text-sm font-medium dir-rtl line-clamp-4">{transcript}</p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Match Result - ONLY show when high confidence match */}
            {!isListening && matchedVerse && matchScore > 0.2 && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-xs text-muted-foreground mb-2">
                  Match Found ({Math.round(matchScore * 100)}% confidence):
                </p>
                <p className="text-sm font-medium dir-rtl mb-3 line-clamp-4">
                  {matchedVerse.ayah.text}
                </p>
                <p className="text-xs text-muted-foreground">
                  Surah {currentSurah}, Verse {matchedVerse.ayah.numberInSurah}
                </p>
              </div>
            )}

            {!isListening && !matchedVerse && transcript && (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-sm text-amber-700 dark:text-amber-400 mb-2">
                  No match found
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Try speaking more clearly or reciting a longer portion of the verse. Click "Try Again" to retry.
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
              {!isListening && matchedVerse && matchScore > 0.2 && (
                <Button
                  onClick={handleNavigate}
                  className="flex-1"
                  data-testid="button-go-to-ayah"
                >
                  Go to Verse
                </Button>
              )}
              {!isListening && !matchedVerse && transcript && (
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
