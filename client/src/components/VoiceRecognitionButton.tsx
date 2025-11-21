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

export function VoiceRecognitionButton({
  verses,
  currentSurah,
  onNavigate,
}: VoiceRecognitionButtonProps) {
  const { isListening, transcript, error, startListening, stopListening } =
    useVoiceRecognition();
  const [isOpen, setIsOpen] = useState(false);
  const [matchedAyah, setMatchedAyah] = useState<any | null>(null);

  // Search for matching ayah when transcript changes and it's final
  useEffect(() => {
    if (transcript && !isListening && verses) {
      const cleanTranscript = transcript.trim().toLowerCase();
      
      // Search through all verses for a match
      let found: any = null;
      for (const verse of verses) {
        const verseText = verse.ayah.text.toLowerCase();
        // Simple matching: check if transcript contains significant portion of verse
        if (verseText.includes(cleanTranscript) || cleanTranscript.includes(verseText.substring(0, 20))) {
          found = verse.ayah;
          break;
        }
      }

      if (found) {
        setMatchedAyah(found);
      } else {
        // If no exact match in current surah, try partial matching
        for (const verse of verses) {
          const verseText = verse.ayah.text.toLowerCase();
          const words = cleanTranscript.split(" ");
          if (words.some(word => word.length > 2 && verseText.includes(word))) {
            found = verse.ayah;
            break;
          }
        }
        setMatchedAyah(found || null);
      }
    }
  }, [transcript, isListening, verses]);

  const handleNavigate = () => {
    if (matchedAyah) {
      onNavigate(currentSurah, matchedAyah.numberInSurah);
      setIsOpen(false);
      setMatchedAyah(null);
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
                <p className="text-xs text-muted-foreground mb-2">Found:</p>
                <p className="text-sm font-medium dir-rtl mb-3">{matchedAyah.text}</p>
                <p className="text-xs text-muted-foreground">
                  {matchedAyah.surah?.name || `Surah ${currentSurah}`} : {matchedAyah.numberInSurah}
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
