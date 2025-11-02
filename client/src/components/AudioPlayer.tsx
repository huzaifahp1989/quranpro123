import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
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
      // Keep isPlaying true so auto-play continues
      if (currentVerse < totalVerses) {
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
  }, [currentVerse, totalVerses, onNext]);

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
      
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">
                  Verse {currentVerse} of {totalVerses}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {currentReciter?.name || "Select Reciter"}
                </span>
              </div>
            </div>

            <Select
              value={selectedReciter}
              onValueChange={onReciterChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[200px] h-9" data-testid="select-reciter">
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
                      <span className="font-medium">{reciter.name}</span>
                      {reciter.style && (
                        <span className="text-xs text-muted-foreground">{reciter.style}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-10 text-right">
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
            
            <span className="text-xs text-muted-foreground w-10">
              {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center justify-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={onPrevious}
              disabled={currentVerse <= 1 || isLoading}
              data-testid="button-previous-verse"
              aria-label="Previous verse"
            >
              <SkipBack className="w-5 h-5" />
            </Button>

            <Button
              size="icon"
              variant="default"
              onClick={togglePlayPause}
              disabled={!audioUrl || isLoading}
              className="h-12 w-12"
              data-testid="button-play-pause"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-0.5" />
              )}
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={onNext}
              disabled={currentVerse >= totalVerses || isLoading}
              data-testid="button-next-verse"
              aria-label="Next verse"
            >
              <SkipForward className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-2 ml-4">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[volume * 100]}
                max={100}
                step={1}
                onValueChange={(value) => setVolume(value[0] / 100)}
                className="w-24"
                data-testid="slider-volume"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
