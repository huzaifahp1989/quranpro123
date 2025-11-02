import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, BookOpen, Moon, Sun, Book } from "lucide-react";
import { Link } from "wouter";
import { SurahSelector } from "@/components/SurahSelector";
import { VerseDisplay } from "@/components/VerseDisplay";
import { AudioPlayer } from "@/components/AudioPlayer";
import { TafseerPanel } from "@/components/TafseerPanel";
import { Button } from "@/components/ui/button";
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

  const { data: verses, isLoading: isVersesLoading } = useQuery<VerseWithTranslations[]>({
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
  };

  const handlePreviousVerse = () => {
    if (currentVerse > 1) {
      setCurrentVerse(currentVerse - 1);
    }
  };

  const handleNextVerse = () => {
    if (verses && currentVerse < verses.length) {
      const nextVerse = currentVerse + 1;
      setCurrentVerse(nextVerse);
      // Auto-play will be handled by AudioPlayer useEffect when audioUrl changes
    }
  };

  const handleVerseClick = (verseNumber: number) => {
    const verseIndex = verses?.findIndex(v => v.ayah.number === verseNumber);
    if (verseIndex !== undefined && verseIndex >= 0) {
      setSelectedVerseForTafseer(verses[verseIndex].ayah.numberInSurah);
      setIsTafseerOpen(true);
    }
  };

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
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Al-Quran Al-Kareem</h1>
                <p className="text-sm text-muted-foreground">The Noble Quran</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/hadith">
                <Button
                  variant="outline"
                  size="default"
                  data-testid="button-nav-hadith"
                  className="gap-2"
                >
                  <Book className="w-4 h-4" />
                  <span className="hidden sm:inline">Browse Hadith</span>
                  <span className="sm:hidden">Hadith</span>
                </Button>
              </Link>
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleTheme}
                data-testid="button-theme-toggle"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
          
          {surahs && (
            <SurahSelector
              surahs={surahs}
              selectedSurah={selectedSurah}
              onSurahChange={handleSurahChange}
              isLoading={isVersesLoading}
            />
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 sm:px-12 py-8 sm:py-12">
        {currentSurah && (
          <div className="mb-8 text-center">
            <h2 className="font-arabic text-4xl mb-2" data-testid="text-surah-name-arabic">
              {currentSurah.name}
            </h2>
            <p className="text-xl font-semibold mb-1" data-testid="text-surah-name-english">
              {currentSurah.englishName}
            </p>
            <p className="text-sm text-muted-foreground">
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
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium mb-2">No verses found</p>
            <p className="text-sm text-muted-foreground">
              Please select a surah to start reading
            </p>
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
