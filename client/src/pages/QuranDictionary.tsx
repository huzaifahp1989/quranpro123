import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Play, Pause, Volume2, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { VoiceRecognitionButton } from "@/components/VoiceRecognitionButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Surah, VerseWithTranslations, availableReciters } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuranDictionary() {
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [selectedReciter, setSelectedReciter] = useState(availableReciters[0].identifier);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isPlaying, setIsPlaying] = useState(false);
  const [expandedVerses, setExpandedVerses] = useState<Set<number>>(new Set());
  const audioRef = useRef<HTMLAudioElement>(null);

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

  const ALQURAN_CLOUD_API = 'https://api.alquran.cloud/v1';

  const { data: surahs, isLoading: isSurahsLoading } = useQuery<Surah[]>({
    queryKey: ['dict-surahs'],
    queryFn: async () => {
      const res = await fetch(`${ALQURAN_CLOUD_API}/surah`);
      const json = await res.json();
      if (json.code !== 200 || !json.data) {
        throw new Error('Failed to fetch surahs');
      }
      return json.data.map((surah: any) => ({
        number: surah.number,
        name: surah.name,
        englishName: surah.englishName,
        englishNameTranslation: surah.englishNameTranslation,
        numberOfAyahs: surah.numberOfAyahs,
        revelationType: surah.revelationType,
      }));
    },
  });

  const { data: verses, isLoading: isVersesLoading } = useQuery<VerseWithTranslations[]>({
    queryKey: ['dict-surah', selectedSurah, selectedReciter],
    queryFn: async () => {
      const editions = `quran-uthmani,${selectedReciter},ur.jalandhry,en.sahih`;
      const res = await fetch(`${ALQURAN_CLOUD_API}/surah/${selectedSurah}/editions/${editions}`);
      const json = await res.json();
      if (json.code !== 200 || !json.data) {
        throw new Error('Failed to fetch surah data');
      }
      const [arabicData, audioData, urduData, englishData] = json.data;
      return arabicData.ayahs.map((ayah: any, index: number) => ({
        ayah: {
          number: ayah.number,
          numberInSurah: ayah.numberInSurah,
          text: ayah.text,
          audio: (() => {
            const raw = audioData.ayahs[index]?.audio || undefined;
            if (!raw) return undefined;
            return import.meta.env.DEV
              ? raw.replace(
                  "https://cdn.islamic.network/quran/audio",
                  "/quran-audio"
                )
              : raw;
          })(),
          surah: {
            number: arabicData.number,
            name: arabicData.name,
            englishName: arabicData.englishName,
          },
        },
        urduTranslation: urduData?.ayahs?.[index]
          ? {
              text: urduData.ayahs[index].text || '',
              language: 'Urdu',
              translator: 'Fateh Muhammad Jalandhry',
            }
          : undefined,
        englishTranslation: englishData?.ayahs?.[index]
          ? {
              text: englishData.ayahs[index].text || '',
              language: 'English',
              translator: 'Sahih International',
            }
          : undefined,
      }));
    },
    enabled: selectedSurah > 0,
  });

  const currentSurah = surahs?.find(s => s.number === selectedSurah);

  const toggleVerse = (verseIndex: number) => {
    const newExpanded = new Set(expandedVerses);
    if (newExpanded.has(verseIndex)) {
      newExpanded.delete(verseIndex);
    } else {
      newExpanded.add(verseIndex);
    }
    setExpandedVerses(newExpanded);
  };

  const playVerse = (audioUrl: string | undefined) => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(err => console.error('Play error:', err));
      setIsPlaying(true);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
      <TopNav title="Quran Dictionary" subtitle="Word by Word Meanings" theme={theme} onThemeToggle={toggleTheme} pageIcon="quran" />

      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quran Dictionary</CardTitle>
            <CardDescription>Explore complete verse meanings in English and Urdu with audio recitation</CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Surah Selection */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Select Surah</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedSurah.toString()} onValueChange={(val) => {
                setSelectedSurah(parseInt(val));
                setExpandedVerses(new Set());
              }}>
                <SelectTrigger className="border-primary/50" data-testid="select-dict-surah">
                  <SelectValue placeholder="Choose a Surah" />
                </SelectTrigger>
                <SelectContent>
                  {surahs?.map((surah) => (
                    <SelectItem key={surah.number} value={surah.number.toString()}>
                      <span className="font-semibold">{surah.number}. <span className="font-arabic">{surah.name}</span></span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Reciter Selection */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Select Reciter</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedReciter} onValueChange={setSelectedReciter}>
                <SelectTrigger className="border-primary/50" data-testid="select-dict-reciter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableReciters.map((reciter) => (
                    <SelectItem key={reciter.identifier} value={reciter.identifier}>
                      <span className="text-sm">{reciter.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Voice Recognition Card */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Voice Search</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end h-full pb-3">
              {verses && (
                <VoiceRecognitionButton
                  verses={verses}
                  surahs={surahs}
                  currentSurah={selectedSurah}
                  onNavigate={(surah, ayah) => {
                    setSelectedSurah(surah);
                    setExpandedVerses(new Set([ayah - 1]));
                  }}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Surah Info */}
        {currentSurah && (
          <Card className="mb-6 bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-lg font-semibold">{currentSurah.number}. <span className="font-arabic">{currentSurah.name}</span></p>
                <p className="text-sm text-muted-foreground mt-1">{currentSurah.numberOfAyahs} verses • {currentSurah.revelationType}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verses Dictionary */}
        {isVersesLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-6 w-12 mb-4" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : verses && verses.length > 0 ? (
          <div className="space-y-3">
            {verses.map((verse, index) => (
              <Card key={verse.ayah.number} className="hover-elevate">
                <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleVerse(index)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm font-semibold text-muted-foreground">Verse {verse.ayah.numberInSurah}</p>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            playVerse(verse.ayah.audio);
                          }}
                          data-testid={`btn-play-verse-${verse.ayah.numberInSurah}`}
                        >
                          <Volume2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="font-arabic text-2xl leading-loose text-right">{verse.ayah.text}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={() => toggleVerse(index)}
                    >
                      {expandedVerses.has(index) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                {/* Expanded Content */}
                {expandedVerses.has(index) && (
                  <CardContent className="border-t pt-4 space-y-4">
                    {/* English Translation */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">English Translation</p>
                      <p className="text-sm leading-relaxed text-foreground">
                        {verse.englishTranslation?.text || "Translation not available"}
                      </p>
                      {verse.englishTranslation?.translator && (
                        <p className="text-xs text-muted-foreground mt-1">
                          — {verse.englishTranslation.translator}
                        </p>
                      )}
                    </div>

                    {/* Urdu Translation */}
                    {verse.urduTranslation?.text && (
                      <div className="border-t pt-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">اردو ترجمہ (Urdu)</p>
                        <p className="text-sm leading-relaxed text-right font-urdu">
                          {verse.urduTranslation.text}
                        </p>
                        {verse.urduTranslation?.translator && (
                          <p className="text-xs text-muted-foreground mt-1 text-right">
                            — {verse.urduTranslation.translator}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Recitation Button */}
                    <div className="border-t pt-4">
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => playVerse(verse.ayah.audio)}
                      >
                        <Volume2 className="w-4 h-4" />
                        Listen to Recitation
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium mb-2">No verses found</p>
            <p className="text-sm text-muted-foreground">Please select a surah to view the dictionary</p>
          </div>
        )}
      </main>
    </div>
  );
}
