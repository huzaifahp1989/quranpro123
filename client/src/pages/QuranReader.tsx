import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, BookOpen, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SurahSelector } from "@/components/SurahSelector";
import { VerseDisplay } from "@/components/VerseDisplay";
import { AudioPlayer } from "@/components/AudioPlayer";
import { TafseerPanel } from "@/components/TafseerPanel";
import { VoiceRecognitionButton } from "@/components/VoiceRecognitionButton";
import { TopNav } from "@/components/TopNav";
import { Surah, VerseWithTranslations, Tafseer, availableReciters, allJuz } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuranReader() {
  const [mode, setMode] = useState<'surah' | 'juz'>('surah');
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [selectedJuz, setSelectedJuz] = useState(1);
  const [currentVerse, setCurrentVerse] = useState(1);
  const [selectedReciter, setSelectedReciter] = useState(availableReciters[0].identifier);
  const [isTafseerOpen, setIsTafseerOpen] = useState(false);
  const [selectedVerseForTafseer, setSelectedVerseForTafseer] = useState<number | null>(null);
  const [tafsirEdition, setTafsirEdition] = useState<string>(() => {
    return localStorage.getItem("tafsirEdition") || "en-tafisr-ibn-kathir";
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{ surah: number; ayah: number } | null>(null);
  const [bookmarkedVerses, setBookmarkedVerses] = useState<{ surah: number; ayah: number }[]>([]);
  const [isAudioPlayerOpen, setIsAudioPlayerOpen] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const { data: surahs, isLoading: isSurahsLoading } = useQuery<Surah[]>({
    queryKey: ['/api/surahs'],
  });

  const { data: verses, isLoading: isVersesLoading, error: versesError } = useQuery<VerseWithTranslations[]>({
    queryKey: ['/api/surah', selectedSurah, selectedReciter],
    enabled: selectedSurah > 0,
  });

  const { data: tafseer, isLoading: isTafseerLoading, error: tafseerError } = useQuery<Tafseer>({
    queryKey: ['/api/tafseer', selectedSurah, selectedVerseForTafseer, tafsirEdition],
    queryFn: async () => {
      const response = await fetch(
        `/api/tafseer/${selectedSurah}/${selectedVerseForTafseer}?edition=${tafsirEdition}`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch tafseer' }));
        throw new Error(errorData.error || 'Failed to fetch tafseer');
      }
      return response.json();
    },
    enabled: selectedVerseForTafseer !== null && isTafseerOpen,
  });

  const handleTafsirEditionChange = (edition: string) => {
    setTafsirEdition(edition);
    localStorage.setItem("tafsirEdition", edition);
  };

  const currentSurah = surahs?.find(s => s.number === selectedSurah);
  const currentVerseData = verses?.[currentVerse - 1];
  const audioUrl = currentVerseData?.ayah?.audio || null;

  const handleSurahChange = (surahNumber: number) => {
    setSelectedSurah(surahNumber);
    setCurrentVerse(1);
    setSelectedVerseForTafseer(null);
    setIsAudioPlaying(false);
    setShouldAutoPlay(false);
  };

  const handleJuzChange = (juzNumber: number) => {
    const juz = allJuz.find(j => j.number === juzNumber);
    if (juz) {
      setSelectedJuz(juzNumber);
      setSelectedSurah(juz.startSurah);
      setCurrentVerse(juz.startAyah);
      setSelectedVerseForTafseer(null);
      setIsAudioPlaying(false);
      setShouldAutoPlay(false);
    }
  };

  const toggleBookmark = (surah: number, ayah: number) => {
    const isBookmarked = bookmarkedVerses.some(v => v.surah === surah && v.ayah === ayah);
    if (isBookmarked) {
      setBookmarkedVerses(bookmarkedVerses.filter(v => !(v.surah === surah && v.ayah === ayah)));
    } else {
      setBookmarkedVerses([...bookmarkedVerses, { surah, ayah }]);
    }
    localStorage.setItem('bookmarkedVerses', JSON.stringify([...bookmarkedVerses, { surah, ayah }]));
  };

  useEffect(() => {
    const saved = localStorage.getItem('bookmarkedVerses');
    if (saved) {
      setBookmarkedVerses(JSON.parse(saved));
    }
  }, []);

  const handlePreviousVerse = () => {
    if (currentVerse > 1) {
      setCurrentVerse(currentVerse - 1);
    } else if (selectedSurah > 1) {
      const previousSurah = surahs?.find(s => s.number === selectedSurah - 1);
      if (previousSurah) {
        setSelectedSurah(selectedSurah - 1);
        setCurrentVerse(previousSurah.numberOfAyahs);
      }
    }
  };

  const handleNextVerse = () => {
    if (verses && currentVerse < verses.length) {
      const nextVerse = currentVerse + 1;
      setCurrentVerse(nextVerse);
      // Continue playing with auto-play enabled
      setShouldAutoPlay(true);
    } else if (selectedSurah < 114) {
      // Move to next surah and start at verse 1
      setSelectedSurah(selectedSurah + 1);
      setCurrentVerse(1);
      // Enable auto-play for the next surah's first verse
      setShouldAutoPlay(true);
    } else {
      // Reached end of Quran
      setIsAudioPlaying(false);
    }
  };

  const handleVerseClick = (verseNumberInSurah: number) => {
    // Also open tafseer for the clicked verse
    setSelectedVerseForTafseer(verseNumberInSurah);
    setIsTafseerOpen(true);
    
    // Play the verse
    if (verseNumberInSurah !== currentVerse) {
      setIsAudioPlaying(false);
    }
    setCurrentVerse(verseNumberInSurah);
    setShouldAutoPlay(true);
  };

  const handlePlayVerseClick = (verseNumberInSurah: number) => {
    if (verseNumberInSurah !== currentVerse) {
      setIsAudioPlaying(false);
    }
    setCurrentVerse(verseNumberInSurah);
    setShouldAutoPlay(true);
  };

  useEffect(() => {
    if (shouldAutoPlay) {
      const timer = setTimeout(() => setShouldAutoPlay(false), 100);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoPlay]);

  // Handle pending navigation after verses load
  useEffect(() => {
    if (pendingNavigation && !isVersesLoading && verses && verses.length > 0) {
      const { surah, ayah } = pendingNavigation;
      
      // Verify we're on the correct Surah
      if (selectedSurah === surah) {
        // Set the verse
        setCurrentVerse(Math.min(ayah, verses.length));
        
        // Scroll to the verse
        setTimeout(() => {
          const verseElement = document.querySelector(`[data-verse-number="${ayah}"]`);
          if (verseElement) {
            verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        
        // Clear pending navigation
        setPendingNavigation(null);
      }
    }
  }, [pendingNavigation, isVersesLoading, verses, selectedSurah]);

  if (isSurahsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Quran...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopNav title="Al-Quran Al-Kareem" subtitle="The Noble Quran" theme={theme} onThemeToggle={toggleTheme} pageIcon="quran" />
      
      {surahs && (
        <div className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b border-border">
          <div className="max-w-4xl mx-auto px-3 sm:px-6 py-3">
            <div className="flex items-center gap-2 mb-3">
              <Button 
                size="sm" 
                variant={mode === 'surah' ? 'default' : 'outline'}
                onClick={() => setMode('surah')}
                data-testid="btn-mode-surah"
              >
                Surah
              </Button>
              <Button 
                size="sm" 
                variant={mode === 'juz' ? 'default' : 'outline'}
                onClick={() => setMode('juz')}
                data-testid="btn-mode-juz"
              >
                Juz
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                {mode === 'surah' ? (
                  <SurahSelector
                    surahs={surahs}
                    selectedSurah={selectedSurah}
                    onSurahChange={handleSurahChange}
                    isLoading={isVersesLoading}
                  />
                ) : (
                  <Select value={selectedJuz.toString()} onValueChange={(val) => handleJuzChange(parseInt(val))}>
                    <SelectTrigger className="border-primary/50" data-testid="select-juz">
                      <SelectValue placeholder="Choose a Juz" />
                    </SelectTrigger>
                    <SelectContent>
                      {allJuz.map((juz) => (
                        <SelectItem key={juz.number} value={juz.number.toString()}>
                          <span className="font-semibold">Juz {juz.number}: {juz.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <VoiceRecognitionButton
                verses={verses}
                surahs={surahs}
                currentSurah={selectedSurah}
                onNavigate={(surah: number, ayah: number) => {
                  console.log(`🎯 Voice Navigation: Surah ${surah}, Verse ${ayah}`);
                  
                  // Reset state like handleSurahChange
                  setSelectedVerseForTafseer(null);
                  setIsAudioPlaying(false);
                  setShouldAutoPlay(false);
                  
                  if (surah !== selectedSurah) {
                    // Changing Surah - set pending navigation to apply after verses load
                    setSelectedSurah(surah);
                    setPendingNavigation({ surah, ayah });
                  } else {
                    // Same Surah - just set verse and scroll
                    setCurrentVerse(ayah);
                    setTimeout(() => {
                      const verseElement = document.querySelector(`[data-verse-number="${ayah}"]`);
                      if (verseElement) {
                        verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }, 100);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-12 py-4 sm:py-8 lg:py-12">
          {currentSurah && (
            <div className="mb-6 sm:mb-8 text-center">
              {mode === 'juz' && allJuz[selectedJuz - 1] && (
                <p className="text-xs sm:text-sm text-primary font-semibold mb-2">
                  Juz {selectedJuz}: {allJuz[selectedJuz - 1].name}
                </p>
              )}
              <h2 className="font-arabic text-3xl sm:text-4xl mb-2" data-testid="text-surah-name-arabic">
                {currentSurah.name}
              </h2>
              <p className="text-lg sm:text-xl font-semibold mb-1" data-testid="text-surah-name-english">
                {currentSurah.englishName}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {currentSurah.englishNameTranslation} • {currentSurah.numberOfAyahs} Verses • {currentSurah.revelationType}
              </p>
            </div>
          )}

          {isVersesLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-6 rounded-lg border border-border">
                  <Skeleton className="h-6 w-12 mb-4" />
                  <Skeleton className="h-20 w-full mb-4" />
                  <Skeleton className="h-16 w-full mb-3" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : verses && verses.length > 0 ? (
            <div data-testid="container-verses">
              {verses.map((verse) => {
                const isBookmarked = bookmarkedVerses.some(v => v.surah === selectedSurah && v.ayah === verse.ayah.numberInSurah);
                return (
                  <div key={verse.ayah.number} className="relative group">
                    <VerseDisplay
                      verse={verse}
                      isHighlighted={verse.ayah.numberInSurah === currentVerse}
                      onVerseClick={handleVerseClick}
                      onPlayClick={handlePlayVerseClick}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => toggleBookmark(selectedSurah, verse.ayah.numberInSurah)}
                      data-testid={`btn-bookmark-${selectedSurah}-${verse.ayah.numberInSurah}`}
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="w-16 h-16 text-muted-foreground/50 mb-4" />
              {versesError ? (
                <>
                  <p className="text-lg font-medium mb-2 text-destructive">Failed to load verses</p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    {versesError instanceof Error ? versesError.message : "Unable to load Quran verses. Please check your internet connection and try again."}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => window.location.reload()}
                    data-testid="button-retry"
                  >
                    Reload Page
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium mb-2">No verses found</p>
                  <p className="text-sm text-muted-foreground">
                    Please select a surah to start reading
                  </p>
                </>
              )}
            </div>
          )}
        </main>

      {verses && verses.length > 0 && (
        <>
          {isAudioPlayerOpen ? (
            <AudioPlayer
              audioUrl={audioUrl}
              currentVerse={currentVerse}
              totalVerses={verses.length}
              onPrevious={handlePreviousVerse}
              onNext={handleNextVerse}
              onVerseChange={setCurrentVerse}
              selectedReciter={selectedReciter}
              onReciterChange={setSelectedReciter}
              isLoading={isVersesLoading}
              onPlayingChange={setIsAudioPlaying}
              shouldAutoPlay={shouldAutoPlay}
              isPlaying={isAudioPlaying}
              onClose={() => setIsAudioPlayerOpen(false)}
            />
          ) : (
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAudioPlayerOpen(true)}
                className="w-full rounded-none"
                data-testid="button-open-player"
              >
                Show Player
              </Button>
            </div>
          )}
          {/* Hidden audio element for continuous playback when player is closed */}
          {!isAudioPlayerOpen && (
            <div className="hidden">
              <AudioPlayer
                audioUrl={audioUrl}
                currentVerse={currentVerse}
                totalVerses={verses.length}
                onPrevious={handlePreviousVerse}
                onNext={handleNextVerse}
                onVerseChange={setCurrentVerse}
                selectedReciter={selectedReciter}
                onReciterChange={setSelectedReciter}
                isLoading={isVersesLoading}
                onPlayingChange={setIsAudioPlaying}
                shouldAutoPlay={shouldAutoPlay}
                isPlaying={isAudioPlaying}
              />
            </div>
          )}
        </>
      )}

      <TafseerPanel
        tafseer={tafseer || null}
        isOpen={isTafseerOpen}
        onToggle={() => setIsTafseerOpen(!isTafseerOpen)}
        isLoading={isTafseerLoading}
        verseNumber={selectedVerseForTafseer || undefined}
        surahNumber={selectedSurah}
        selectedEdition={tafsirEdition}
        onEditionChange={handleTafsirEditionChange}
        error={tafseerError?.message || null}
      />
    </div>
  );
}
