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

// Remove all diacritics from Arabic text
function normalizeArabic(text: string): string {
  return text.replace(/[\u064B-\u0652\u0640\u061C\u200E\u200F]/g, '').trim();
}

// Find Surah by number or name
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
      }, 800);
    }
  }, [targetSurah, isListening, navigating, targetAyah, onNavigate]);

  // Process transcript when received
  useEffect(() => {
    if (transcript && !isListening) {
      const numbers = extractNumbers(transcript);
      
      if (numbers.length > 0) {
        const firstNum = numbers[0];
        const secondNum = numbers.length > 1 ? numbers[1] : 1;
        
        // Check if first number is a valid Surah (1-114)
        if (firstNum >= 1 && firstNum <= 114) {
          setTargetSurah(firstNum);
          setTargetAyah(Math.max(1, secondNum));
          return;
        }
      }
    }
  }, [transcript, isListening]);

  const handleDialogOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      stopListening();
      setTargetSurah(null);
      setTargetAyah(1);
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
        title="Click to search by voice"
      >
        <Mic className={`w-4 h-4 ${isListening ? "animate-pulse" : ""}`} />
      </Button>

      <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Voice Search</DialogTitle>
            <DialogDescription>
              Say a Surah number (1-114) and optionally a verse number
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
                    ? `Going to Surah ${targetSurah}${surahName ? ` (${surahName})` : ""}...`
                    : isListening 
                    ? "Listening..." 
                    : "Ready"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {navigating
                  ? "Navigating to your selection..."
                  : isListening
                  ? "Say Surah number (e.g., 'Surah 2' or just '2')"
                  : "Click microphone to start"}
              </p>
            </div>

            {/* Transcript Display */}
            {transcript && (
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground mb-2">You said:</p>
                <p className="text-sm font-medium">{transcript}</p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Result Display */}
            {targetSurah && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-xs text-muted-foreground mb-2">Found:</p>
                <p className="text-sm font-medium">
                  Surah {targetSurah} {surahName && `(${surahName})`} - Verse {targetAyah}
                </p>
              </div>
            )}

            {!isListening && !targetSurah && transcript && (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Invalid Surah number. Please say a number between 1-114.
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
              {!isListening && !targetSurah && transcript && (
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
