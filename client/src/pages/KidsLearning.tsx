import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Play, Pause, RotateCcw, Volume2, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { VerseWithTranslations } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface LearningSection {
  id: string;
  name: string;
  arabicName: string;
  description: string;
  surahs: number[]; // Surah numbers to fetch
}

const learningSections: LearningSection[] = [
  {
    id: "juz-amma",
    name: "Juz Amma",
    arabicName: "جزء عمّ",
    description: "The 30th Part of the Quran - Perfect for beginners",
    surahs: [78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114],
  },
  {
    id: "yasin",
    name: "Surah Yasin",
    arabicName: "سورة يس",
    description: "The Heart of the Quran",
    surahs: [36],
  },
  {
    id: "mulk",
    name: "Surah Al-Mulk",
    arabicName: "سورة الملك",
    description: "Protection from the Punishment of the Grave",
    surahs: [67],
  },
  {
    id: "waqiah",
    name: "Surah Al-Waqiah",
    arabicName: "سورة الواقعة",
    description: "The Inevitable Event",
    surahs: [56],
  },
];

const reciters = [
  { id: "ar.minshawi", name: "Mohamed Siddiq al-Minshawi (Murattal)", shortName: "Minshawi" },
  { id: "ar.huzaify", name: "Ali Bin Abdur-Rahman Al-Huthaify", shortName: "Huzaify" },
];

export default function KidsLearning() {
  const [selectedSection, setSelectedSection] = useState<string>("juz-amma");
  const [selectedReciter, setSelectedReciter] = useState(reciters[0].id);
  const [currentSurahIndex, setCurrentSurahIndex] = useState(0);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const [volume, setVolume] = useState([80]);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentSection = learningSections.find(s => s.id === selectedSection);
  const currentSurahNumber = currentSection?.surahs[currentSurahIndex];

  const { data: verses, isLoading } = useQuery<VerseWithTranslations[]>({
    queryKey: ['/api/surah', currentSurahNumber, selectedReciter],
    enabled: !!currentSurahNumber,
  });

  const currentVerse = verses?.[currentVerseIndex];
  const audioUrl = currentVerse?.ayah?.audio;

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (isRepeating) {
        // Replay the same verse
        audio.currentTime = 0;
        audio.play();
      } else if (verses && currentVerseIndex < verses.length - 1) {
        // Move to next verse
        setCurrentVerseIndex(prev => prev + 1);
      } else if (currentSection && currentSurahIndex < currentSection.surahs.length - 1) {
        // Move to next surah
        setCurrentSurahIndex(prev => prev + 1);
        setCurrentVerseIndex(0);
      } else {
        // Finished all
        setIsPlaying(false);
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [isRepeating, currentVerseIndex, currentSurahIndex, currentSection, verses]);

  // Update audio source
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && audioUrl) {
      audio.src = audioUrl;
      if (isPlaying) {
        audio.play().catch(() => setIsPlaying(false));
      }
    }
  }, [audioUrl, isPlaying]);

  // Update volume
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume[0] / 100;
    }
  }, [volume]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleStop = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
  };

  const handleRepeatToggle = () => {
    setIsRepeating(!isRepeating);
  };

  const handlePreviousVerse = () => {
    if (currentVerseIndex > 0) {
      setCurrentVerseIndex(prev => prev - 1);
    } else if (currentSurahIndex > 0) {
      setCurrentSurahIndex(prev => prev - 1);
      setCurrentVerseIndex(0);
    }
  };

  const handleNextVerse = () => {
    if (verses && currentVerseIndex < verses.length - 1) {
      setCurrentVerseIndex(prev => prev + 1);
    } else if (currentSection && currentSurahIndex < currentSection.surahs.length - 1) {
      setCurrentSurahIndex(prev => prev + 1);
      setCurrentVerseIndex(0);
    }
  };

  const handleSectionChange = (sectionId: string) => {
    setSelectedSection(sectionId);
    setCurrentSurahIndex(0);
    setCurrentVerseIndex(0);
    handleStop();
  };

  return (
    <div className="min-h-screen bg-background">
      <audio ref={audioRef} preload="auto" />
      
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Learn Quran for Kids</h1>
                <p className="text-sm text-muted-foreground">Listen, Learn, and Repeat</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline" size="default" data-testid="button-back-home">
                <BookOpen className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Back to Quran</span>
                <span className="sm:hidden">Quran</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Tabs value={selectedSection} onValueChange={handleSectionChange} className="mb-8">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6">
            {learningSections.map(section => (
              <TabsTrigger key={section.id} value={section.id} data-testid={`tab-${section.id}`}>
                {section.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {learningSections.map(section => (
            <TabsContent key={section.id} value={section.id}>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{section.name}</span>
                    <span className="font-arabic text-2xl">{section.arabicName}</span>
                  </CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Select Reciter</label>
                      <Select value={selectedReciter} onValueChange={setSelectedReciter}>
                        <SelectTrigger data-testid="select-reciter">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {reciters.map(reciter => (
                            <SelectItem key={reciter.id} value={reciter.id}>
                              {reciter.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : currentVerse ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  {currentVerse.ayah.surah?.englishName} • Verse {currentVerse.ayah.numberInSurah}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center font-arabic text-4xl leading-loose mb-6" dir="rtl">
                  {currentVerse.ayah.text}
                </div>
                
                <div className="space-y-3">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-2">English Translation</p>
                    <p className="text-sm leading-relaxed">{currentVerse.englishTranslation?.text}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Urdu Translation</p>
                    <p className="text-sm leading-relaxed" dir="rtl">{currentVerse.urduTranslation?.text}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5" />
                  Audio Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handlePreviousVerse}
                    disabled={currentSurahIndex === 0 && currentVerseIndex === 0}
                    data-testid="button-previous-verse"
                  >
                    Previous
                  </Button>
                  
                  <Button
                    size="lg"
                    onClick={handlePlayPause}
                    data-testid="button-play-pause"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </Button>
                  
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleStop}
                    data-testid="button-stop"
                  >
                    Stop
                  </Button>
                  
                  <Button
                    size="lg"
                    variant={isRepeating ? "default" : "outline"}
                    onClick={handleRepeatToggle}
                    data-testid="button-repeat"
                    aria-pressed={isRepeating}
                    aria-label={isRepeating ? "Disable repeat mode" : "Enable repeat mode"}
                  >
                    <RotateCcw className="w-6 h-6" />
                  </Button>
                  
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleNextVerse}
                    disabled={currentSection && currentSurahIndex === currentSection.surahs.length - 1 && verses && currentVerseIndex === verses.length - 1}
                    data-testid="button-next-verse"
                  >
                    Next
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    Volume: {volume[0]}%
                  </label>
                  <Slider
                    value={volume}
                    onValueChange={setVolume}
                    max={100}
                    step={1}
                    data-testid="slider-volume"
                  />
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  {isRepeating && (
                    <span className="inline-flex items-center gap-1 text-primary">
                      <RotateCcw className="w-3 h-3" />
                      Repeat Mode On
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 animate-spin text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Loading verses...</p>
          </div>
        )}
      </main>
    </div>
  );
}
