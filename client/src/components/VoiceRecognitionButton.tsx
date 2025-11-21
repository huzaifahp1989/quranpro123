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

// Normalize Arabic text by removing diacritics
function normalizeArabic(text: string): string {
  // Remove all Arabic diacritics (tashkeel)
  const diacritics = /[\u064B-\u0652\u0640]/g;
  let normalized = text.replace(diacritics, '');
  // Remove extra spaces
  normalized = normalized.trim().replace(/\s+/g, ' ');
  return normalized;
}

// Calculate similarity score between two strings (0-1)
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeArabic(str1).toLowerCase();
  const s2 = normalizeArabic(str2).toLowerCase();
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    const longer = Math.max(s1.length, s2.length);
    const shorter = Math.min(s1.length, s2.length);
    return shorter / longer;
  }
  
  // Word-based matching
  const words1 = s1.split(' ');
  const words2 = s2.split(' ');
  
  let matchedWords = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2 || (word1.length > 3 && word2.includes(word1)) || (word2.length > 3 && word1.includes(word2))) {
        matchedWords++;
        break;
      }
    }
  }
  
  return matchedWords / Math.max(words1.length, words2.length);
}

export function VoiceRecognitionButton({
  verses,
  currentSurah,
  onNavigate,
}: VoiceRecognitionButtonProps) {
  const { isListening, transcript, error, startListening, stopListening } =
    useVoiceRecognition();
  const [isOpen, setIsOpen] = useState(false);
  const [matchedAyah, setMatchedAyah] = useState<any | null>(null);
  const [matchScore, setMatchScore] = useState(0);

  // Search for matching ayah when transcript changes and it's final
  useEffect(() => {
    if (transcript && !isListening && verses && verses.length > 0) {
      let bestMatch: any = null;
      let bestScore = 0.3; // Minimum threshold for a match
      
      // Search through all verses for the best match
      for (const verse of verses) {
        const score = calculateSimilarity(transcript, verse.ayah.text);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = verse.ayah;
        }
      }

      if (bestMatch) {
        setMatchedAyah(bestMatch);
        setMatchScore(bestScore);
      } else {
        setMatchedAyah(null);
        setMatchScore(0);
      }
    }
  }, [transcript, isListening, verses]);

  const handleNavigate = () => {
    if (matchedAyah) {
      onNavigate(currentSurah, matchedAyah.numberInSurah);
      setIsOpen(false);
      setMatchedAyah(null);
      setMatchScore(0);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => {
          if (isListening) {
            stopListening();
            setIsOpen(false);
          } else {
            setIsOpen(true);
            startListening();
          }
        }}
        data-testid="button-voice-recognition"
        title="Recite to find Ayah"
      >
        <Mic className={`w-4 h-4 ${isListening ? "animate-pulse" : ""}`} />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recite the Quran</DialogTitle>
            <DialogDescription>
              Recite the Quranic text you're looking for and we'll find the matching ayah
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
                  {isListening ? "Listening..." : "Ready to listen"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {isListening
                  ? "Speak clearly in Arabic for best results"
                  : "Click the microphone button or say something"}
              </p>
            </div>

            {/* Transcript Display */}
            {transcript && (
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground mb-2">Recognized:</p>
                <p className="text-sm font-medium dir-rtl">{transcript}</p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Match Result */}
            {!isListening && matchedAyah && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-xs text-muted-foreground mb-2">Found (Confidence: {Math.round(matchScore * 100)}%):</p>
                <p className="text-sm font-medium dir-rtl mb-3">{matchedAyah.text}</p>
                <p className="text-xs text-muted-foreground">
                  {matchedAyah.surah?.name || `Surah ${currentSurah}`} : {matchedAyah.numberInSurah}
                </p>
              </div>
            )}

            {!isListening && !matchedAyah && transcript && (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  No matching verse found. Try speaking the text again more clearly or try a different part of the verse.
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
              {!isListening && matchedAyah && (
                <Button
                  onClick={handleNavigate}
                  className="flex-1"
                  data-testid="button-go-to-ayah"
                >
                  Go to Ayah
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  stopListening();
                  setMatchedAyah(null);
                  setMatchScore(0);
                }}
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
