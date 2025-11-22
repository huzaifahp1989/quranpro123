import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Play, Pause, Volume2, Zap, RotateCcw, BookOpen } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { VoiceRecognitionButton } from "@/components/VoiceRecognitionButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Surah, VerseWithTranslations, availableReciters, allJuz } from "@shared/schema";

export default function MemoQuran() {
  const [mode, setMode] = useState<'surah' | 'juz'>('surah');
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [selectedJuz, setSelectedJuz] = useState(1);
  const [startVerse, setStartVerse] = useState(1);
  const [endVerse, setEndVerse] = useState(7);
  const [selectedReciter, setSelectedReciter] = useState(availableReciters[0].identifier);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [repeatCount, setRepeatCount] = useState(1);
  const [repeatAfterReciter, setRepeatAfterReciter] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [mainTab, setMainTab] = useState('lesson');
  const [continueMode, setContinueMode] = useState(true); // Auto-play next verse
  const [audioMode, setAudioMode] = useState<'recitation' | 'translation'>('recitation'); // Recitation or translation audio
  const [pausePerVerse, setPausePerVerse] = useState(false); // Pause after each verse
  const [currentRepeatCount, setCurrentRepeatCount] = useState(1); // Track repeats for current verse
  const audioRef = useRef<HTMLAudioElement>(null);

  // Handle Juz selection
  const handleJuzChange = (juzNumber: number) => {
    const juz = allJuz.find(j => j.number === juzNumber);
    if (juz) {
      setSelectedJuz(juzNumber);
      setSelectedSurah(juz.startSurah);
      setStartVerse(juz.startAyah);
      setEndVerse(Math.min(juz.endAyah, 286)); // Max verses in any surah
      setCurrentVerseIndex(0); // Reset to first verse when switching Juz
      setIsPlaying(false); // Stop any ongoing playback
    }
  };

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

  // For Juz mode: fetch multiple surahs if needed
  const shouldFetchMultipleSurahs = mode === 'juz';
  const juzData = allJuz[selectedJuz - 1];
  const surahsToFetch = shouldFetchMultipleSurahs && juzData 
    ? Array.from({ length: juzData.endSurah - juzData.startSurah + 1 }, (_, i) => juzData.startSurah + i)
    : [selectedSurah];

  // Fetch first surah verses
  const { data: verses, isLoading: isVersesLoading } = useQuery<VerseWithTranslations[]>({
    queryKey: ['/api/surah', surahsToFetch[0], selectedReciter],
    enabled: surahsToFetch.length > 0,
  });

  // Fetch second surah if needed
  const { data: verses2, isLoading: isVerses2Loading } = useQuery<VerseWithTranslations[]>({
    queryKey: ['/api/surah', surahsToFetch[1], selectedReciter],
    enabled: surahsToFetch.length > 1,
  });

  // Fetch third surah if needed
  const { data: verses3, isLoading: isVerses3Loading } = useQuery<VerseWithTranslations[]>({
    queryKey: ['/api/surah', surahsToFetch[2], selectedReciter],
    enabled: surahsToFetch.length > 2,
  });

  // Combine all verses for Juz mode
  const allVerses = shouldFetchMultipleSurahs && juzData
    ? [
        ...(verses || []),
        ...(verses2 || []),
        ...(verses3 || []),
      ]
    : verses;

  const isVersesLoading_all = shouldFetchMultipleSurahs 
    ? isVersesLoading || (surahsToFetch.length > 1 && isVerses2Loading) || (surahsToFetch.length > 2 && isVerses3Loading)
    : isVersesLoading;

  const currentSurah = surahs?.find(s => s.number === selectedSurah);
  const maxVerses = currentSurah?.numberOfAyahs || 7;

  useEffect(() => {
    if (endVerse > maxVerses && mode === 'surah') {
      setEndVerse(maxVerses);
    }
  }, [maxVerses, mode]);

  const getVerseRange = () => {
    if (!allVerses) return [];
    if (mode === 'juz' && juzData) {
      // For Juz: filter verses to only include those within Juz boundaries
      return allVerses.filter(verse => {
        const surahNum = verse.ayah.surah?.number || 0;
        const ayahNum = verse.ayah.numberInSurah;
        
        // Check if verse is within Juz boundaries
        if (surahNum < juzData.startSurah || surahNum > juzData.endSurah) {
          return false;
        }
        
        // Check ayah boundaries
        if (surahNum === juzData.startSurah && ayahNum < juzData.startAyah) {
          return false;
        }
        if (surahNum === juzData.endSurah && ayahNum > juzData.endAyah) {
          return false;
        }
        
        return true;
      });
    }
    // For Surah: use startVerse and endVerse
    const start = Math.max(0, startVerse - 1);
    const end = Math.min(allVerses.length, endVerse);
    return allVerses.slice(start, end);
  };

  const verseRange = getVerseRange();

  const playCurrentVerse = useCallback(() => {
    // Check if verses are loaded
    if (!allVerses || allVerses.length === 0) {
      console.warn('Verses not loaded yet');
      return;
    }
    
    if (currentVerseIndex >= verseRange.length) {
      setCurrentVerseIndex(0);
      setIsPlaying(false);
      return;
    }
    
    const verse = verseRange[currentVerseIndex];
    let audioUrl: string | undefined;
    
    // Select audio based on audioMode
    if (audioMode === 'recitation') {
      audioUrl = verse?.ayah?.audio;
    } else {
      // Translation audio not available, use recitation instead
      audioUrl = verse?.ayah?.audio;
    }
    
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play().catch(err => console.error('Play error:', err));
      setIsPlaying(true);
    }
  }, [allVerses, verseRange, currentVerseIndex, playbackSpeed, audioMode]);

  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    const handleEnded = () => {
      if (currentRepeatCount > 1) {
        setCurrentRepeatCount(prev => prev - 1);
        setTimeout(() => playCurrentVerse(), 500);
      } else {
        // Verse finished - decide what to do next
        setCurrentRepeatCount(repeatCount);
        
        if (pausePerVerse) {
          // Stop and pause on each verse
          setIsPlaying(false);
        } else if (continueMode) {
          // Auto-play next verse
          const newIndex = currentVerseIndex + 1;
          if (newIndex >= verseRange.length) {
            setIsPlaying(false);
            return;
          }
          setCurrentVerseIndex(newIndex);
        } else {
          // Stop at end of verse
          setIsPlaying(false);
        }
      }
    };
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [currentVerseIndex, repeatCount, pausePerVerse, continueMode, verseRange.length, playCurrentVerse]);

  const handlePlayClick = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      // Check if verses are loaded before playing
      if (!verses || verses.length === 0) {
        console.warn('Please wait for verses to load');
        return;
      }
      setCurrentVerseIndex(0);
      setCurrentRepeatCount(repeatCount);
      // Store repeat count for auto-progression
      localStorage.setItem('lastRepeatCount', repeatCount.toString());
      playCurrentVerse();
    }
  };

  const handleVerseClick = (verseIndex: number) => {
    setCurrentVerseIndex(verseIndex);
    localStorage.setItem('lastRepeatCount', repeatCount.toString());
    // Play the clicked verse immediately
    setTimeout(() => {
      const verse = verseRange[verseIndex];
      const audioUrl = verse?.ayah?.audio;
      if (audioUrl && audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.playbackRate = playbackSpeed;
        audioRef.current.play().catch(err => console.error('Play error:', err));
        setIsPlaying(true);
      }
    }, 100);
  };

  const handleStopClick = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
    setCurrentVerseIndex(0);
  };

  const increaseSpeed = () => {
    const newSpeed = Math.min(playbackSpeed + 0.25, 2.0);
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) audioRef.current.playbackRate = newSpeed;
  };

  const decreaseSpeed = () => {
    const newSpeed = Math.max(playbackSpeed - 0.25, 0.5);
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) audioRef.current.playbackRate = newSpeed;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <audio ref={audioRef} />
      <TopNav title="Memorize Quran" subtitle="Learn & Practice" theme={theme} onThemeToggle={toggleTheme} pageIcon="quran" />

      <main className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {/* Tabs */}
        <Tabs value={mainTab} onValueChange={setMainTab} className="w-full mb-6">
          <div className="flex items-center justify-between gap-2 mb-6">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="lesson" className="flex items-center gap-2">
                <span>Lesson</span>
              </TabsTrigger>
              <TabsTrigger value="guide" className="flex items-center gap-2">
                <span>Guide</span>
              </TabsTrigger>
            </TabsList>
            {allVerses && surahs && (
              <VoiceRecognitionButton
                verses={allVerses}
                surahs={surahs}
                currentSurah={selectedSurah}
                onNavigate={(surah, ayah) => {
                  setSelectedSurah(surah);
                  setStartVerse(ayah);
                  setEndVerse(Math.min(ayah + 10, surahs?.find(s => s.number === surah)?.numberOfAyahs || ayah + 10));
                  setCurrentVerseIndex(0);
                }}
              />
            )}
          </div>

          <TabsContent value="lesson" className="space-y-4">
            {/* Mode Toggle */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant={mode === 'surah' ? 'default' : 'outline'}
                    onClick={() => setMode('surah')}
                    className="flex-1"
                    data-testid="btn-mode-surah"
                  >
                    Surah Mode
                  </Button>
                  <Button 
                    size="sm" 
                    variant={mode === 'juz' ? 'default' : 'outline'}
                    onClick={() => setMode('juz')}
                    className="flex-1"
                    data-testid="btn-mode-juz"
                  >
                    Juz Mode
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Reciter Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Select Reciter</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedReciter} onValueChange={setSelectedReciter}>
                  <SelectTrigger className="border-primary/50" data-testid="select-reciter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableReciters.map((reciter) => (
                      <SelectItem key={reciter.identifier} value={reciter.identifier}>
                        {reciter.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Surah or Juz Selection */}
            {mode === 'surah' ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Select Surah</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={selectedSurah.toString()} onValueChange={(val) => {
                    setSelectedSurah(parseInt(val));
                    setStartVerse(1);
                    setEndVerse(7);
                  }}>
                    <SelectTrigger className="border-primary/50 h-10" data-testid="select-surah">
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
                  {currentSurah && (
                    <div className="bg-primary/10 border border-primary/20 rounded-md p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Selected Surah</p>
                      <p className="text-base font-semibold">{currentSurah.number}. <span className="font-arabic">{currentSurah.name}</span></p>
                      <p className="text-xs text-muted-foreground mt-1">{currentSurah.numberOfAyahs} verses • {currentSurah.revelationType}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Select Juz (Para)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={selectedJuz.toString()} onValueChange={(val) => handleJuzChange(parseInt(val))}>
                    <SelectTrigger className="border-primary/50 h-10" data-testid="select-juz">
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
                  {allJuz[selectedJuz - 1] && (
                    <div className="bg-primary/10 border border-primary/20 rounded-md p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Selected Juz</p>
                      <p className="text-base font-semibold">Juz {selectedJuz}: {allJuz[selectedJuz - 1].name}</p>
                      <p className="text-xs text-muted-foreground mt-1">Surah {allJuz[selectedJuz - 1].startSurah} - {allJuz[selectedJuz - 1].endSurah}</p>
                      {allJuz[selectedJuz - 1].arabicName && <p className="text-xs font-arabic mt-1">{allJuz[selectedJuz - 1].arabicName}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Verse Range Selection - Only for Surah mode */}
            {mode === 'surah' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Verse Range</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Start Verse</label>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => setStartVerse(Math.max(1, startVerse - 1))} data-testid="btn-start-down">−</Button>
                      <input type="number" value={startVerse} onChange={(e) => setStartVerse(parseInt(e.target.value) || 1)} className="flex-1 text-center border rounded-md bg-background text-sm py-1" min="1" max={maxVerses} data-testid="input-start-verse" />
                      <Button size="sm" variant="outline" onClick={() => setStartVerse(Math.min(maxVerses, startVerse + 1))} data-testid="btn-start-up">+</Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">End Verse</label>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => setEndVerse(Math.max(startVerse, endVerse - 1))} data-testid="btn-end-down">−</Button>
                      <input type="number" value={endVerse} onChange={(e) => setEndVerse(parseInt(e.target.value) || startVerse)} className="flex-1 text-center border rounded-md bg-background text-sm py-1" min={startVerse} max={maxVerses} data-testid="input-end-verse" />
                      <Button size="sm" variant="outline" onClick={() => setEndVerse(Math.min(maxVerses, endVerse + 1))} data-testid="btn-end-up">+</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Loading indicator for Juz mode */}
            {mode === 'juz' && isVersesLoading_all && (
              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-4 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">Loading Juz verses...</p>
                </CardContent>
              </Card>
            )}

            {/* Playback Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Playback Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Repeat each Verse</label>
                  <Select value={repeatCount.toString()} onValueChange={(val) => setRepeatCount(parseInt(val))}>
                    <SelectTrigger className="border-primary/50" data-testid="select-repeat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 3, 5, 7, 10].map((num) => (
                        <SelectItem key={num} value={num.toString()}>{num}x</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-xs">Repeat after Reciter</label>
                  <Button size="sm" variant={repeatAfterReciter ? "default" : "outline"} onClick={() => setRepeatAfterReciter(!repeatAfterReciter)} data-testid="btn-repeat-after">
                    {repeatAfterReciter ? 'On' : 'Off'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-xs">Continue to Next Verse</label>
                  <Button size="sm" variant={continueMode ? "default" : "outline"} onClick={() => setContinueMode(!continueMode)} data-testid="btn-continue-mode">
                    {continueMode ? 'On' : 'Off'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-xs">Pause After Each Verse</label>
                  <Button size="sm" variant={pausePerVerse ? "default" : "outline"} onClick={() => setPausePerVerse(!pausePerVerse)} data-testid="btn-pause-per-verse">
                    {pausePerVerse ? 'On' : 'Off'}
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Audio Source</label>
                  <div className="p-2 bg-muted/50 rounded-md">
                    <p className="text-xs font-semibold text-foreground">Quranic Recitation</p>
                    <p className="text-xs text-muted-foreground mt-1">Translation audio available in Quran Dictionary</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Speed & Control */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Playback Speed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <Button size="sm" variant="outline" onClick={decreaseSpeed} data-testid="btn-speed-down">−</Button>
                  <span className="text-center font-semibold text-sm min-w-12">{playbackSpeed.toFixed(2)}x</span>
                  <Button size="sm" variant="outline" onClick={increaseSpeed} data-testid="btn-speed-up">+</Button>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="lg" 
                    className="flex-1 gap-2" 
                    onClick={handlePlayClick} 
                    data-testid="btn-play-pause"
                    disabled={isVersesLoading}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    {isPlaying ? 'Pause' : 'Play'}
                  </Button>
                  <Button size="lg" variant="outline" onClick={handleStopClick} data-testid="btn-stop">Stop</Button>
                </div>
              </CardContent>
            </Card>

            {/* Current Verse Display */}
            {isVersesLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}

            {verseRange.length > 0 && !isVersesLoading_all && (
              <>
                <Card>
                  <CardHeader className="pb-2 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        {mode === 'juz' ? (
                          <>
                            <CardTitle className="text-sm">Juz {selectedJuz} • Surah {verseRange[currentVerseIndex]?.ayah.surah?.number} • Verse {verseRange[currentVerseIndex]?.ayah.numberInSurah}/{verseRange.length}</CardTitle>
                            <CardDescription className="text-xs mt-1">{currentVerseIndex + 1}/{verseRange.length}</CardDescription>
                          </>
                        ) : (
                          <>
                            <CardTitle className="text-sm">Surah {currentSurah?.name} • Verse {currentVerseIndex + startVerse}/{endVerse}</CardTitle>
                            <CardDescription className="text-xs mt-1">{verseRange[currentVerseIndex + 1] ? `Verse ${currentVerseIndex + 1}/${verseRange.length}` : 'Last verse'}</CardDescription>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-4">
                    {verseRange[currentVerseIndex] && (
                      <div className="text-center space-y-3 bg-muted/50 p-4 rounded-md">
                        <p className="font-arabic text-3xl leading-loose">{verseRange[currentVerseIndex].ayah?.text}</p>
                        {mode === 'juz' ? (
                          <p className="text-xs text-muted-foreground font-semibold">Surah {verseRange[currentVerseIndex].ayah.surah?.number}:{verseRange[currentVerseIndex].ayah.numberInSurah}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground font-semibold">Ayah {currentVerseIndex + startVerse}</p>
                        )}
                        {verseRange[currentVerseIndex].urduTranslation && <p className="text-xs text-foreground/80 mt-2">{verseRange[currentVerseIndex].urduTranslation.text}</p>}
                        {verseRange[currentVerseIndex].englishTranslation && <p className="text-xs text-foreground/70 mt-2">{verseRange[currentVerseIndex].englishTranslation.text}</p>}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* All Verses List */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">All Verses ({verseRange.length})</CardTitle>
                    <CardDescription className="text-xs">Click any verse to play from there</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {verseRange.map((verse, index) => (
                        <button
                          key={index}
                          onClick={() => handleVerseClick(index)}
                          data-testid={`btn-verse-${index}`}
                          className={`w-full text-left p-3 rounded-md border-2 transition-all ${
                            currentVerseIndex === index
                              ? 'border-primary bg-primary/10'
                              : 'border-muted hover-elevate hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-arabic text-lg leading-relaxed text-left">{verse.ayah?.text}</p>
                              {verse.englishTranslation && <p className="text-xs text-muted-foreground mt-1">{verse.englishTranslation.text}</p>}
                            </div>
                            <span className="text-xs font-semibold shrink-0 whitespace-nowrap px-2 py-1 bg-muted rounded">
                              {mode === 'juz' ? `${verse.ayah.surah?.number}:${verse.ayah.numberInSurah}` : index + startVerse}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="guide" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>How to Use This Tool</CardTitle>
                <CardDescription>Tips for effective Quran memorization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">1. Select Your Reciter</h4>
                    <p className="text-muted-foreground">Choose from authentic Quranic reciters with clear, accurate pronunciations.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">2. Choose Surah & Verses</h4>
                    <p className="text-muted-foreground">Select the Surah and set the verse range you want to memorize. Start with shorter ranges.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">3. Adjust Speed</h4>
                    <p className="text-muted-foreground">Slow down the recitation to catch every word. Gradually increase speed as you memorize.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">4. Use Repeat Function</h4>
                    <p className="text-muted-foreground">Repeat each verse multiple times (3x-7x recommended) to reinforce memorization.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">5. Practice Consistently</h4>
                    <p className="text-muted-foreground">Regular daily practice is key. Start with small portions and gradually expand your memorization.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Memorization Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>• Listen to the pronunciation multiple times before attempting to memorize</p>
                <p>• Try to follow along with the Arabic text</p>
                <p>• Understand the meaning with the translation provided</p>
                <p>• Practice reciting out loud after listening</p>
                <p>• Review previously memorized verses regularly</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
