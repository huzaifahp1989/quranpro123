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

// Remove diacritics and extra characters from Arabic text
function normalizeText(text: string): string {
  // Remove Arabic diacritics
  let normalized = text.replace(/[\u064B-\u0652\u0640]/g, '');
  // Remove extra spaces and trim
  normalized = normalized.trim().replace(/\s+/g, ' ');
  return normalized.toLowerCase();
}

// Search for verse in text - very lenient matching
function findBestMatch(
  transcript: string,
  verses: VerseWithTranslations[]
): { verse: VerseWithTranslations | null; score: number } {
  const normalizedTranscript = normalizeText(transcript);
  
  if (!normalizedTranscript || normalizedTranscript.length < 3) {
    return { verse: null, score: 0 };
  }

  let bestMatch: VerseWithTranslations | null = null;
  let bestScore = 0;
  const words = normalizedTranscript.split(/\s+/);

  for (const verse of verses) {
    const normalizedVerse = normalizeText(verse.ayah.text);
    const verseWords = normalizedVerse.split(/\s+/);
    
    let score = 0;

    // Strategy 1: Exact substring match (best score)
    if (normalizedVerse.includes(normalizedTranscript)) {
      score = 1.0;
    } 
    // Strategy 2: Verse starts with transcript
    else if (normalizedVerse.startsWith(normalizedTranscript)) {
      score = 0.95;
    }
    // Strategy 3: Transcript is substantial portion of beginning
    else if (normalizedVerse.includes(words[0]) && words.length >= 2) {
      // Check if first 2+ words match in order
      let matchCount = 0;
      let verseWordIndex = 0;
      
      for (const word of words) {
        if (word.length < 2) continue; // Skip short words
        
        for (let i = verseWordIndex; i < verseWords.length; i++) {
          if (verseWords[i].includes(word) || word.includes(verseWords[i])) {
            matchCount++;
            verseWordIndex = i + 1;
            break;
          }
        }
      }
      
      const validWords = words.filter(w => w.length >= 2).length;
      if (validWords > 0 && matchCount > 0) {
        score = (matchCount / validWords) * 0.8;
      }
    }
    // Strategy 4: Check if most common words match
    else if (words.length > 0) {
      let wordMatches = 0;
      for (const word of words) {
        if (word.length < 2) continue;
        if (normalizedVerse.includes(word)) {
          wordMatches++;
        }
      }
      
      const validWords = words.filter(w => w.length >= 2).length;
      if (validWords > 0) {
        score = (wordMatches / validWords) * 0.6;
      }
    }

    console.log(`Verse ${verse.ayah.numberInSurah}:`, score, verse.ayah.text.substring(0, 50));

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

  // Search for matching ayah when transcript changes and it's final
  useEffect(() => {
    if (transcript && !isListening && verses && verses.length > 0) {
      const { verse, score } = findBestMatch(transcript, verses);
      
      console.log('Final transcript:', transcript);
      console.log('Best match score:', score);
      console.log('Match found:', verse?.ayah.numberInSurah);

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

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => {
          if (isListening) {
            stopListening();
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

            {/* Match Result */}
            {!isListening && matchedVerse && matchScore > 0.2 && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-xs text-muted-foreground mb-2">
                  Found Match (Match: {Math.round(matchScore * 100)}%):
                </p>
                <p className="text-sm font-medium dir-rtl mb-3 line-clamp-4">
                  {matchedVerse.ayah.text}
                </p>
                <p className="text-xs text-muted-foreground">
                  {matchedVerse.ayah.surah?.name || `Surah ${currentSurah}`} : {matchedVerse.ayah.numberInSurah}
                </p>
              </div>
            )}

            {!isListening && !matchedVerse && transcript && (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  No matching verse found. Try speaking more clearly or recite a longer portion.
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
                  Go to Ayah
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  stopListening();
                  setMatchedVerse(null);
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
