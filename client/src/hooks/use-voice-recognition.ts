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
    recognitionInstance.continuous = true; // Keep listening for longer speech
    recognitionInstance.interimResults = true;
    
    // Try generic "ar" first, then ar-SA, then let browser try both
    // Chrome/Firefox handle "ar" better for Quranic recitation
    recognitionInstance.lang = "ar";

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
      
      // Prioritize final results, but show interim for real-time feedback
      if (final.trim()) {
        setTranscript(final.trim());
      } else if (interim.trim()) {
        setTranscript(interim.trim());
      }
    };

    recognitionInstance.onerror = (event: any) => {
      console.error("Speech Recognition Error:", event.error);
      // Don't show error for "aborted" - that's normal when user stops
      if (event.error !== "aborted") {
        setError(`Error: ${event.error}. Please check your microphone.`);
      }
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
