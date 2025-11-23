import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Square, Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { availableReciters, Reciter } from "@shared/schema";
import { toast } from "@/hooks/use-toast";

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
  shouldAutoPlay?: boolean;
  isPlaying?: boolean; // External playing state from parent
  onClose?: () => void; // Close button callback
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
  onPlayingChange,
  shouldAutoPlay,
  isPlaying: externalIsPlaying,
  onClose
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Sync internal playing state with external state from parent
  useEffect(() => {
    if (externalIsPlaying === undefined) return;
    if (externalIsPlaying === isPlaying) return;

    setIsPlaying(externalIsPlaying);
    const audio = audioRef.current;
    if (!audio) return;

    if (externalIsPlaying) {
      // Only attempt to play if we have a source
      if (!audio.src) {
        setIsPlaying(false);
        onPlayingChange?.(false);
        return;
      }
      audio.play().catch(() => {
        setIsPlaying(false);
        onPlayingChange?.(false);
      });
    } else {
      audio.pause();
    }
  }, [externalIsPlaying, isPlaying, onPlayingChange]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isRepeating, setIsRepeating] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const attemptedFallbackReciterRef = useRef<boolean>(false);
  const fallbackCandidatesRef = useRef<string[]>([]);
  const fallbackIndexRef = useRef<number>(0);
  const silentUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (audioRef.current && audioUrl) {
      fallbackCandidatesRef.current = buildFallbackCandidates(audioUrl);
      fallbackIndexRef.current = 0;
      audioRef.current.src = fallbackCandidatesRef.current[0] || audioUrl;
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

  function buildFallbackCandidates(url: string | null): string[] {
    if (!url) return [];
    const candidates = [url];
    // Try lower bitrates if the URL is from islamic.network
    // Replace /128/ with /64/ and /32/ where applicable
    if (url.includes('/128/')) {
      candidates.push(url.replace('/128/', '/64/'));
      candidates.push(url.replace('/128/', '/32/'));
    }
    return Array.from(new Set(candidates));
  }

  function createSilentWavUrl(durationMs: number): string {
    const sampleRate = 44100;
    const numChannels = 1;
    const bytesPerSample = 2;
    const numSamples = Math.floor((durationMs / 1000) * sampleRate);

    const headerSize = 44;
    const dataSize = numSamples * numChannels * bytesPerSample;
    const buffer = new ArrayBuffer(headerSize + dataSize);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
    view.setUint16(32, numChannels * bytesPerSample, true);
    view.setUint16(34, bytesPerSample * 8, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    for (let i = 0; i < numSamples; i++) {
      const offset = headerSize + i * bytesPerSample;
      view.setInt16(offset, 0, true);
    }

    const blob = new Blob([view], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }

  function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

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
      } else {
        // Always call onNext - let parent (QuranReader) decide if there's more content
        // This enables continuous playback across surahs
        setTimeout(() => {
          onNext();
        }, 300);
      }
    };

    const handleError = () => {
      setIsPlaying(false);
      onPlayingChange?.(false);
      // Try next fallback candidate (lower bitrate variants) first
      const nextIdx = fallbackIndexRef.current + 1;
      const nextUrl = fallbackCandidatesRef.current[nextIdx];
      if (nextUrl && audioRef.current) {
        fallbackIndexRef.current = nextIdx;
        audioRef.current.src = nextUrl;
        audioRef.current.load();
        audioRef.current.play().catch(() => {
          // If play fails, let the error event fire again and proceed
        });
        return;
      }
      const localPlaceholder = "/audio/letters/alif.mp3";
      if (audioRef.current) {
        audioRef.current.src = localPlaceholder;
        audioRef.current.load();
      }

      toast({
        title: "Audio unavailable",
        description: "The recitation stream could not be loaded. Try another reciter or retry later.",
      });
    };

    const handleAbort = () => {
      setIsPlaying(false);
      onPlayingChange?.(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('abort', handleAbort);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('abort', handleAbort);
    };
  }, [currentVerse, totalVerses, onNext, isRepeating]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const increaseSpeed = () => {
    const newSpeed = Math.min(playbackSpeed + 0.25, 2.0);
    setPlaybackSpeed(newSpeed);
  };

  const decreaseSpeed = () => {
    const newSpeed = Math.max(playbackSpeed - 0.25, 0.5);
    setPlaybackSpeed(newSpeed);
  };

  // Handle auto-play trigger from parent (e.g., when clicking play on a verse)
  useEffect(() => {
    if (shouldAutoPlay && audioRef.current && audioUrl) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        onPlayingChange?.(true);
      }).catch(error => {
        console.log("Auto-play prevented:", error);
      });
    }
  }, [shouldAutoPlay, audioUrl]);

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

  // Manual navigation should pause playback
  const handleManualNext = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    onPlayingChange?.(false);
    onNext();
  };

  const handleManualPrevious = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    onPlayingChange?.(false);
    onPrevious();
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
      <audio ref={audioRef} crossOrigin="anonymous" />
      
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

            <div className="flex items-center gap-2">
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

              <Button
                size="icon"
                variant="ghost"
                onClick={onClose}
                data-testid="button-close-player"
                aria-label="Close player"
                className="h-9 w-9"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
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
                onClick={handleManualPrevious}
                disabled={isLoading}
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
                onClick={handleManualNext}
                disabled={isLoading}
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

            {/* Speed and Volume controls */}
            <div className="flex items-center gap-4 w-full sm:w-auto justify-center sm:justify-start">
              {/* Speed control */}
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={decreaseSpeed}
                  disabled={!audioUrl || isLoading}
                  data-testid="button-speed-decrease"
                  aria-label="Decrease speed"
                  className="h-9 w-9"
                >
                  <Zap className="w-4 h-4" />
                </Button>
                <span className="text-xs font-semibold min-w-9 text-center">{playbackSpeed.toFixed(2)}x</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={increaseSpeed}
                  disabled={!audioUrl || isLoading}
                  data-testid="button-speed-increase"
                  aria-label="Increase speed"
                  className="h-9 w-9"
                >
                  <Zap className="w-4 h-4" />
                </Button>
              </div>

              {/* Volume control */}
              <div className="flex items-center gap-2">
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
    </div>
  );
}
