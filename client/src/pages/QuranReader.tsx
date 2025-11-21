import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, BookOpen } from "lucide-react";
import { SurahSelector } from "@/components/SurahSelector";
import { VerseDisplay } from "@/components/VerseDisplay";
import { AudioPlayer } from "@/components/AudioPlayer";
import { TafseerPanel } from "@/components/TafseerPanel";
import { TopNav } from "@/components/TopNav";
import { Surah, VerseWithTranslations, Tafseer, availableReciters } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuranReader() {
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [currentVerse, setCurrentVerse] = useState(1);
  const [selectedReciter, setSelectedReciter] = useState(availableReciters[0].identifier);
  const [isTafseerOpen, setIsTafseerOpen] = useState(false);
  const [selectedVerseForTafseer, setSelectedVerseForTafseer] = useState<number | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);

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

  const { data: tafseer, isLoading: isTafseerLoading } = useQuery<Tafseer>({
    queryKey: ['/api/tafseer', selectedSurah, selectedVerseForTafseer],
    enabled: selectedVerseForTafseer !== null && isTafseerOpen,
  });

  const currentSurah = surahs?.find(s => s.number === selectedSurah);
  const currentVerseData = verses?.[currentVerse - 1];
  const audioUrl = currentVerseData?.ayah?.audio || null;

  const handleSurahChange = (surahNumber: number) => {
    setSelectedSurah(surahNumber);
    setCurrentVerse(1);
    setSelectedVerseForTafseer(null);
    // Pause playback when user manually changes surah
    setIsAudioPlaying(false);
    setShouldAutoPlay(false);
  };

  const handlePreviousVerse = () => {
    if (currentVerse > 1) {
      setCurrentVerse(currentVerse - 1);
    } else if (selectedSurah > 1) {
      // Go to previous surah's last verse
      const previousSurah = surahs?.find(s => s.number === selectedSurah - 1);
      if (previousSurah) {
        setSelectedSurah(selectedSurah - 1);
        // Will be set to last verse once data loads
        setCurrentVerse(previousSurah.numberOfAyahs);
      }
    }
  };

  const handleNextVerse = () => {
    if (verses && currentVerse < verses.length) {
      const nextVerse = currentVerse + 1;
      setCurrentVerse(nextVerse);
      // Auto-play will be handled by AudioPlayer useEffect when audioUrl changes
    } else if (selectedSurah < 114) {
      // Move to next surah when current surah finishes
      setSelectedSurah(selectedSurah + 1);
      setCurrentVerse(1);
      // Keep audio playing when auto-advancing to next surah
    } else {
      // Reached the end of the entire Quran (Surah 114, last verse)
      setIsAudioPlaying(false);
    }
  };

  const handleVerseClick = (verseNumber: number) => {
    const verseIndex = verses?.findIndex(v => v.ayah.number === verseNumber);
    if (verses && verseIndex !== undefined && verseIndex >= 0) {
      setSelectedVerseForTafseer(verses[verseIndex].ayah.numberInSurah);
      setIsTafseerOpen(true);
    }
  };

  const handlePlayVerseClick = (verseNumberInSurah: number) => {
    // Pause if clicking on a different verse
    if (verseNumberInSurah !== currentVerse) {
      setIsAudioPlaying(false);
    }
    setCurrentVerse(verseNumberInSurah);
    setShouldAutoPlay(true);
  };

  // Reset shouldAutoPlay after it's been used
  useEffect(() => {
    if (shouldAutoPlay) {
      const timer = setTimeout(() => setShouldAutoPlay(false), 100);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoPlay]);

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
      <TopNav title="Al-Quran Al-Kareem" subtitle="The Noble Quran" theme={theme} onThemeToggle={toggleTheme} pageIcon={<BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />} />
      
      {surahs && (
        <div className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b border-border">
          <div className="max-w-4xl mx-auto px-3 sm:px-6 py-3">
            <SurahSelector
              surahs={surahs}
              selectedSurah={selectedSurah}
              onSurahChange={handleSurahChange}
              isLoading={isVersesLoading}
            />
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-12 py-4 sm:py-8 lg:py-12">
        {currentSurah && (
          <div className="mb-6 sm:mb-8 text-center">
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
            {verses.map((verse) => (
              <VerseDisplay
                key={verse.ayah.number}
                verse={verse}
                isHighlighted={verse.ayah.numberInSurah === currentVerse}
                onVerseClick={handleVerseClick}
                onPlayClick={handlePlayVerseClick}
              />
            ))}
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
      )}

      <TafseerPanel
        tafseer={tafseer || null}
        isOpen={isTafseerOpen}
        onToggle={() => setIsTafseerOpen(!isTafseerOpen)}
        isLoading={isTafseerLoading}
        verseNumber={selectedVerseForTafseer || undefined}
      />
    </div>
  );
}
