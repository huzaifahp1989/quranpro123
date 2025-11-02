import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { availableReciters, Reciter } from "@shared/schema";

interface AudioPlayerProps {
  audioUrl: string | null;
  currentVerse: number;
  totalVerses: number;
  onPrevious: () => void;
  onNext: () => void;
  onVerseChange: (verse: number) => void;
  selectedReciter: string;
  onReciterChange: (reciter: string) => void;
  isLoading?: boolean;
  onPlayingChange?: (isPlaying: boolean) => void;
}

export function AudioPlayer({
  audioUrl,
  currentVerse,
  totalVerses,
  onPrevious,
  onNext,
  onVerseChange,
  selectedReciter,
  onReciterChange,
  isLoading,
  onPlayingChange
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isRepeating, setIsRepeating] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
      
      // Auto-play if we were playing before
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log("Auto-play prevented:", error);
            setIsPlaying(false);
            onPlayingChange?.(false);
          });
        }
      }
    }
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (isRepeating) {
        // Repeat the same verse
        audio.currentTime = 0;
        audio.play();
      } else if (currentVerse < totalVerses) {
        // Keep isPlaying true so auto-play continues
        setTimeout(() => {
          onNext();
        }, 300);
      } else {
        // Only stop playing if we reached the end
        setIsPlaying(false);
        onPlayingChange?.(false);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentVerse, totalVerses, onNext, isRepeating]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlayPause = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      onPlayingChange?.(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      onPlayingChange?.(true);
    }
  };

  const handleStop = () => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
    onPlayingChange?.(false);
  };

  const toggleRepeat = () => {
    setIsRepeating(!isRepeating);
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const currentReciter = availableReciters.find(r => r.identifier === selectedReciter);

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-card border-t border-card-border z-40">
      <audio ref={audioRef} />
      
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col gap-2 sm:gap-3">
          {/* Header with verse info and reciter selector */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium truncate">
                  Verse {currentVerse} of {totalVerses}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground truncate">
                  {currentReciter?.name || "Select Reciter"}
                </span>
              </div>
            </div>

            <Select
              value={selectedReciter}
              onValueChange={onReciterChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full sm:w-[180px] md:w-[200px] h-9" data-testid="select-reciter">
                <SelectValue placeholder="Select Reciter" />
              </SelectTrigger>
              <SelectContent>
                {availableReciters.map((reciter) => (
                  <SelectItem
                    key={reciter.identifier}
                    value={reciter.identifier}
                    data-testid={`option-reciter-${reciter.identifier}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{reciter.name}</span>
                      {reciter.style && (
                        <span className="text-xs text-muted-foreground">{reciter.style}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Progress slider */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs text-muted-foreground w-8 sm:w-10 text-right">
              {formatTime(currentTime)}
            </span>
            
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="flex-1"
              disabled={!audioUrl}
              data-testid="slider-audio-progress"
            />
            
            <span className="text-xs text-muted-foreground w-8 sm:w-10">
              {formatTime(duration)}
            </span>
          </div>

          {/* Controls - stacked on mobile, inline on desktop */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Main playback controls */}
            <div className="flex items-center justify-center gap-1 sm:gap-2 flex-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={onPrevious}
                disabled={currentVerse <= 1 || isLoading}
                data-testid="button-previous-verse"
                aria-label="Previous verse"
                className="h-9 w-9 sm:h-10 sm:w-10"
              >
                <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>

              <Button
                size="icon"
                variant="default"
                onClick={togglePlayPause}
                disabled={!audioUrl || isLoading}
                className="h-11 w-11 sm:h-12 sm:w-12"
                data-testid="button-play-pause"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" />
                )}
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={handleStop}
                disabled={!audioUrl || isLoading}
                data-testid="button-stop"
                aria-label="Stop"
                className="h-9 w-9 sm:h-10 sm:w-10"
              >
                <Square className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={onNext}
                disabled={currentVerse >= totalVerses || isLoading}
                data-testid="button-next-verse"
                aria-label="Next verse"
                className="h-9 w-9 sm:h-10 sm:w-10"
              >
                <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>

              <Button
                size="icon"
                variant={isRepeating ? "default" : "ghost"}
                onClick={toggleRepeat}
                disabled={!audioUrl || isLoading}
                data-testid="button-repeat"
                aria-label={isRepeating ? "Repeat on" : "Repeat off"}
                className="h-9 w-9 sm:h-10 sm:w-10"
              >
                <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>

            {/* Volume control */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
              <Volume2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <Slider
                value={[volume * 100]}
                max={100}
                step={1}
                onValueChange={(value) => setVolume(value[0] / 100)}
                className="w-20 sm:w-24"
                data-testid="slider-volume"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
