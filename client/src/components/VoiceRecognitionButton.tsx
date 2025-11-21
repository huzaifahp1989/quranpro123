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

// Remove all diacritics and normalize Arabic text
function normalizeArabic(text: string): string {
  // Unicode range for Arabic diacritics
  const diacritics = /[\u064B-\u0652\u0640\u061C\u200E\u200F]/g;
  return text.replace(diacritics, '').trim();
}

// Simple Levenshtein distance for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const track = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(0));

  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }

  return track[str2.length][str1.length];
}

// Calculate similarity score (0-1) using multiple strategies
function calculateMatchScore(transcript: string, verseText: string): number {
  const t = normalizeArabic(transcript);
  const v = normalizeArabic(verseText);

  if (!t || !v) return 0;

  // Exact match
  if (v.includes(t)) {
    return 0.95;
  }

  // Inverse exact match - transcript contains verse start
  if (t.includes(v.substring(0, Math.min(v.length, Math.ceil(v.length * 0.3))))) {
    return 0.85;
  }

  // Check if verse contains most of transcript
  const tWords = t.split(/\s+/);
  const vWords = v.split(/\s+/);
  
  let matchedWords = 0;
  for (const tWord of tWords) {
    if (tWord.length < 2) continue; // Skip very short words
    for (const vWord of vWords) {
      if (vWord.includes(tWord) || tWord.includes(vWord)) {
        matchedWords++;
        break;
      }
    }
  }

  const wordMatchRatio = tWords.filter(w => w.length >= 2).length > 0 
    ? matchedWords / tWords.filter(w => w.length >= 2).length 
    : 0;

  if (wordMatchRatio >= 0.6) {
    return 0.7 + wordMatchRatio * 0.2;
  }

  // Levenshtein-based scoring for close matches
  const maxLen = Math.max(t.length, v.length);
  const distance = levenshteinDistance(t, v);
  const similarity = Math.max(0, 1 - distance / maxLen);

  // Only return score if it's reasonably high
  if (similarity > 0.4 && t.length > 10) {
    return similarity * 0.8;
  }

  return 0;
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
  const [debugInfo, setDebugInfo] = useState("");

  // Search for matching ayah when transcript changes and it's final
  useEffect(() => {
    if (transcript && !isListening && verses && verses.length > 0) {
      let bestMatch: any = null;
      let bestScore = 0;
      
      // Search through all verses for the best match
      for (const verse of verses) {
        const score = calculateMatchScore(transcript, verse.ayah.text);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = verse.ayah;
        }
      }

      // Debug: log the matching process
      console.log('Transcript:', transcript);
      console.log('Best score:', bestScore);
      console.log('Best match:', bestMatch?.text?.substring(0, 50));

      setDebugInfo(`Searched ${verses.length} verses. Best match score: ${(bestScore * 100).toFixed(1)}%`);

      if (bestScore > 0.35) {
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
      setDebugInfo("");
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
            setDebugInfo("");
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
              Recite any verse from the Quran and we'll find it for you
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
                  : "Click the microphone to start reciting"}
              </p>
            </div>

            {/* Transcript Display */}
            {transcript && (
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground mb-2">Recognized:</p>
                <p className="text-sm font-medium dir-rtl line-clamp-3">{transcript}</p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Debug Info */}
            {debugInfo && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <p className="text-xs text-blue-700 dark:text-blue-400">{debugInfo}</p>
              </div>
            )}

            {/* Match Result */}
            {!isListening && matchedAyah && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-xs text-muted-foreground mb-2">Found Match (Confidence: {Math.round(matchScore * 100)}%):</p>
                <p className="text-sm font-medium dir-rtl mb-3 line-clamp-4">{matchedAyah.text}</p>
                <p className="text-xs text-muted-foreground">
                  {matchedAyah.surah?.name || `Surah ${currentSurah}`} : {matchedAyah.numberInSurah}
                </p>
              </div>
            )}

            {!isListening && !matchedAyah && transcript && (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  No matching verse found. Tips for better results:
                </p>
                <ul className="text-xs text-amber-700 dark:text-amber-400 mt-2 list-disc list-inside space-y-1">
                  <li>Speak the verse clearly and slowly</li>
                  <li>Make sure you're in the correct Surah</li>
                  <li>Try reciting a longer portion of the verse</li>
                  <li>Avoid background noise</li>
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
                  setDebugInfo("");
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
