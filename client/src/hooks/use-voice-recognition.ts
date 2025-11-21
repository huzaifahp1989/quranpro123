import { useEffect, useState, useCallback } from "react";

interface VoiceRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

export function useVoiceRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech Recognition not supported in your browser");
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = true;
    // Try Arabic first, but let browser auto-detect if it fails
    recognitionInstance.lang = "ar-SA";

    recognitionInstance.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript("");
    };

    recognitionInstance.onresult = (event: any) => {
      let interim = "";
      let final = "";
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += text + " ";
        } else {
          interim += text + " ";
        }
      }
      
      // Show final result when available, otherwise show interim
      if (final.trim()) {
        setTranscript(final.trim());
      } else if (interim.trim()) {
        setTranscript(interim.trim());
      }
    };

    recognitionInstance.onerror = (event: any) => {
      console.error("Speech Recognition Error:", event.error);
      setError(`Error: ${event.error}. Please check your microphone and try again.`);
      setIsListening(false);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
    };

    setRecognition(recognitionInstance);
  }, []);

  const startListening = useCallback(() => {
    if (recognition) {
      try {
        setTranscript("");
        setError(null);
        recognition.start();
      } catch (err) {
        console.error("Error starting recognition:", err);
      }
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      try {
        recognition.stop();
      } catch (err) {
        console.error("Error stopping recognition:", err);
      }
    }
  }, [recognition]);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
  };
}
