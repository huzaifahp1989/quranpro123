import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, X, Volume2, Search } from "lucide-react";
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

export function VoiceRecognitionButton({
  verses,
  surahs,
  currentSurah,
  onNavigate,
}: VoiceRecognitionButtonProps) {
  const { isListening, transcript, error, startListening, stopListening } =
    useVoiceRecognition();
  const [isOpen, setIsOpen] = useState(false);
  const [matchedVerseText, setMatchedVerseText] = useState<string>("");
  const [matchScore, setMatchScore] = useState(0);
  const [matchedSurah, setMatchedSurah] = useState<number | null>(null);
  const [matchedAyah, setMatchedAyah] = useState<number | null>(null);
  const [lastProcessedTranscript, setLastProcessedTranscript] = useState("");
  const [textSearchInput, setTextSearchInput] = useState("");
  const [textSearchResults, setTextSearchResults] = useState<VerseWithTranslations[]>([]);
  const [activeTab, setActiveTab] = useState("voice");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (isOpen && !isListening && activeTab === "voice") {
      startListening();
    }
  }, [isOpen, isListening, startListening, activeTab]);

  // Process transcript when received
  useEffect(() => {
    if (!transcript || transcript === lastProcessedTranscript || isListening) {
      return;
    }

    console.log("\n=== PROCESSING TRANSCRIPT ===");
    console.log("Raw transcript:", transcript);
    setLastProcessedTranscript(transcript);

    // Try extracting numbers first (Surah navigation)
    const numbers = extractNumbers(transcript);
    
    if (numbers.length > 0) {
      const firstNum = numbers[0];
      
      if (firstNum >= 1 && firstNum <= 114) {
        console.log(`✅ Detected Surah number: ${firstNum}`);
        const secondNum = numbers.length > 1 ? numbers[1] : 1;
        setMatchedVerseText(`Surah ${firstNum}${secondNum > 1 ? `, Verse ${secondNum}` : ""}`);
        setMatchScore(1.0);
        setMatchedSurah(firstNum);
        setMatchedAyah(secondNum);
        
        console.log(`🚀 NAVIGATING TO: Surah ${firstNum}, Verse ${secondNum}`);
        onNavigate(firstNum, Math.max(1, secondNum));
        
        setTimeout(() => {
          setIsOpen(false);
          setMatchedVerseText("");
          setMatchScore(0);
          setMatchedSurah(null);
          setMatchedAyah(null);
          setLastProcessedTranscript("");
        }, 500);
        return;
      }
    }

    // Call global search API
    const searchGlobal = async () => {
      setIsSearching(true);
      try {
        console.log(`🔍 Searching globally for: ${transcript}`);
        const response = await fetch("/api/search-ayah", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ searchText: transcript })
        });

        if (response.ok) {
          const data: {
            surahNumber: number;
            ayahNumber: number;
            text: string;
            surahName: string;
            surahEnglishName: string;
            score: number;
          } = await response.json();

          console.log(`✅ FOUND MATCH - Surah ${data.surahNumber}, Verse ${data.ayahNumber} with score ${data.score.toFixed(2)}`);
          setMatchedVerseText(data.text);
          setMatchScore(data.score);
          setMatchedSurah(data.surahNumber);
          setMatchedAyah(data.ayahNumber);
          
          console.log(`🚀 NAVIGATING TO: Surah ${data.surahNumber}, Verse ${data.ayahNumber}`);
          onNavigate(data.surahNumber, data.ayahNumber);
          
          setTimeout(() => {
            setIsOpen(false);
            setMatchedVerseText("");
            setMatchScore(0);
            setMatchedSurah(null);
            setMatchedAyah(null);
            setLastProcessedTranscript("");
          }, 500);
        } else {
          console.log("❌ No match found");
        }
      } catch (error: any) {
        console.log("❌ Error searching:", error);
        setMatchedVerseText("");
        setMatchScore(0);
        setMatchedSurah(null);
        setMatchedAyah(null);
      } finally {
        setIsSearching(false);
      }
    };

    searchGlobal();
  }, [transcript, isListening, lastProcessedTranscript, onNavigate]);

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
    setMatchedVerseText(verse.ayah.text);
    setMatchScore(1.0);
    setMatchedSurah(currentSurah);
    setMatchedAyah(verse.ayah.numberInSurah);
    
    console.log(`🚀 NAVIGATING TO: Surah ${currentSurah}, Verse ${verse.ayah.numberInSurah}`);
    onNavigate(currentSurah, verse.ayah.numberInSurah);
    
    setTimeout(() => {
      setIsOpen(false);
      setMatchedVerseText("");
      setMatchScore(0);
      setMatchedSurah(null);
      setMatchedAyah(null);
      setTextSearchInput("");
      setTextSearchResults([]);
    }, 500);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      stopListening();
      setMatchedVerseText("");
      setMatchScore(0);
      setMatchedSurah(null);
      setMatchedAyah(null);
      setLastProcessedTranscript("");
      setTextSearchInput("");
      setTextSearchResults([]);
      setIsSearching(false);
    }
  };

  const surahName = matchedSurah && surahs ? surahs.find(s => s.number === matchedSurah)?.englishName : "";

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        data-testid="button-voice-recognition"
        title="Voice search"
      >
        <Mic className={`w-4 h-4 ${isListening ? "animate-pulse" : ""}`} />
      </Button>

      <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Search Ayah</DialogTitle>
            <DialogDescription>
              Say Surah number or recite any Ayah from any Surah
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="voice">Voice</TabsTrigger>
              <TabsTrigger value="search">Text Search</TabsTrigger>
            </TabsList>

            <TabsContent value="voice" className="space-y-4">
              <div
                className={`p-6 rounded-lg border-2 transition-all ${
                  isSearching
                    ? "border-primary bg-primary/5"
                    : isListening
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  {isSearching ? (
                    <Volume2 className="w-5 h-5 animate-pulse text-primary" />
                  ) : (
                    <Volume2
                      className={`w-5 h-5 ${isListening ? "animate-pulse text-primary" : ""}`}
                    />
                  )}
                  <span className="font-medium">
                    {isSearching 
                      ? "Searching..." 
                      : isListening 
                      ? "Listening..." 
                      : "Ready"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isSearching
                    ? "Searching across all 114 Surahs..."
                    : "Say Surah number or recite any Ayah"}
                </p>
              </div>

              {transcript && (
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

              {matchedVerseText && matchedSurah && matchedAyah && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <p className="text-xs text-muted-foreground mb-2">Found ({Math.round(matchScore * 100)}%):</p>
                  <p className="text-sm font-medium dir-rtl mb-3 line-clamp-3">
                    {matchedVerseText}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Surah {matchedSurah}{surahName ? ` (${surahName})` : ""}, Verse {matchedAyah}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                {isListening && (
                  <Button
                    variant="destructive"
                    onClick={stopListening}
                    className="flex-1 gap-2"
                  >
                    <X className="w-4 h-4" />
                    Stop
                  </Button>
                )}
                {!isListening && !matchedVerseText && transcript && !isSearching && (
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
                  />
                </div>

                {textSearchResults.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {textSearchResults.map((verse) => (
                      <button
                        key={verse.ayah.number}
                        onClick={() => handleSelectVerse(verse)}
                        className="w-full p-3 rounded-lg border border-border hover:bg-secondary/50 text-left transition-colors"
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
