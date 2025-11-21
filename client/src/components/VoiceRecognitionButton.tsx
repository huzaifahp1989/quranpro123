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

// Remove all diacritics from Arabic text
function normalizeArabic(text: string): string {
  return text.replace(/[\u064B-\u0652\u0640\u061C\u200E\u200F]/g, '').trim();
}

// Extract numbers from text (handles English numbers and Arabic-Indic numerals)
function extractNumbers(text: string): number[] {
  // English numbers: 0-9
  // Arabic-Indic numerals: ٠-٩
  // Extended Arabic-Indic: ۰-۹
  const numberMatches = text.match(/[\d٠-٩۰-۹]+/g) || [];
  
  return numberMatches.map(match => {
    // Convert Arabic-Indic numerals to English numbers
    return parseInt(
      match
        .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660))
        .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x06F0))
    );
  });
}

// Check if transcribed text matches Quranic Arabic
function findArabicMatch(
  transcript: string,
  verses: VerseWithTranslations[]
): { verse: VerseWithTranslations | null; score: number } {
  const normalizedTranscript = normalizeArabic(transcript);
  
  if (!normalizedTranscript || normalizedTranscript.length < 3) {
    return { verse: null, score: 0 };
  }

  let bestMatch: VerseWithTranslations | null = null;
  let bestScore = 0;

  for (const verse of verses) {
    const normalizedVerse = normalizeArabic(verse.ayah.text);
    let score = 0;

    if (normalizedVerse.includes(normalizedTranscript)) {
      score = 1.0;
    } else if (normalizedVerse.startsWith(normalizedTranscript)) {
      score = 0.95;
    } else if (normalizedTranscript.startsWith(normalizedVerse.substring(0, Math.max(10, normalizedVerse.length * 0.7)))) {
      score = 0.85;
    } else {
      const transcriptWords = normalizedTranscript.split(/\s+/);
      const verseWords = normalizedVerse.split(/\s+/);
      
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
        
        if (!foundMatch) break;
      }
      
      const validWords = transcriptWords.filter(w => w.length >= 2).length;
      if (validWords > 0 && consecutiveMatches > 0) {
        score = (consecutiveMatches / validWords) * 0.75;
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
  const [suggestionType, setSuggestionType] = useState<"verse" | "number" | null>(null);
  const [suggestedAyah, setSuggestedAyah] = useState<number | null>(null);

  // Auto-start listening when dialog opens
  useEffect(() => {
    if (isOpen && !isListening) {
      startListening();
    }
  }, [isOpen, isListening, startListening]);

  // Search for matching ayah when transcript changes
  useEffect(() => {
    if (transcript && !isListening && verses && verses.length > 0) {
      // Try to extract verse numbers first
      const numbers = extractNumbers(transcript);
      
      if (numbers.length > 0) {
        // User said a number - try to navigate to that verse
        const ayahNumber = numbers[0];
        const verseExists = verses.find(v => v.ayah.numberInSurah === ayahNumber);
        
        if (verseExists && ayahNumber <= verses.length) {
          setMatchedVerse(verseExists);
          setMatchScore(1.0);
          setSuggestionType("number");
          setSuggestedAyah(ayahNumber);
          return;
        }
      }

      // Otherwise, try Arabic text matching
      const { verse, score } = findArabicMatch(transcript, verses);

      if (score > 0.3) {
        setMatchedVerse(verse);
        setMatchScore(score);
        setSuggestionType("verse");
        setSuggestedAyah(verse?.ayah.numberInSurah || null);
      } else {
        setMatchedVerse(null);
        setMatchScore(0);
        setSuggestionType(null);
        setSuggestedAyah(null);
      }
    }
  }, [transcript, isListening, verses]);

  const handleNavigate = () => {
    if (matchedVerse) {
      onNavigate(currentSurah, matchedVerse.ayah.numberInSurah);
      setIsOpen(false);
      resetState();
    }
  };

  const resetState = () => {
    setMatchedVerse(null);
    setMatchScore(0);
    setSuggestionType(null);
    setSuggestedAyah(null);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      stopListening();
      resetState();
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        data-testid="button-voice-recognition"
        title="Click to search by voice"
      >
        <Mic className={`w-4 h-4 ${isListening ? "animate-pulse" : ""}`} />
      </Button>

      <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Voice Search</DialogTitle>
            <DialogDescription>
              Say a verse number or recite Arabic text to find it
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
                  {isListening ? "Listening..." : "Ready"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {isListening
                  ? "Say a verse number (e.g., 'verse 5') or recite Arabic text"
                  : "Click microphone to start listening"}
              </p>
            </div>

            {/* Transcript Display */}
            {transcript && (
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground mb-2">You said:</p>
                <p className="text-sm font-medium line-clamp-4">{transcript}</p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Match Result */}
            {!isListening && matchedVerse && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-xs text-muted-foreground mb-2">
                  {suggestionType === "number" 
                    ? `Verse ${suggestedAyah} Found:`
                    : `Match Found (${Math.round(matchScore * 100)}% match):`}
                </p>
                <p className="text-sm font-medium dir-rtl mb-3 line-clamp-4">
                  {matchedVerse.ayah.text}
                </p>
                <p className="text-xs text-muted-foreground">
                  Verse {matchedVerse.ayah.numberInSurah}
                </p>
              </div>
            )}

            {!isListening && !matchedVerse && transcript && (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-sm text-amber-700 dark:text-amber-400 mb-2">
                  No match found
                </p>
                <ul className="text-xs text-amber-700 dark:text-amber-400 list-disc list-inside space-y-1">
                  <li>Try saying the verse number (e.g., "verse 5")</li>
                  <li>Or recite the Arabic verse clearly</li>
                  <li>Make sure you're in the correct Surah</li>
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
              {!isListening && matchedVerse && (
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
