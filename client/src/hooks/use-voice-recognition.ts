import { useEffect, useState, useCallback } from "react";

interface VoiceRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

export function useVoiceRecognition(lang: string = "ar-SA", options?: { autoRestart?: boolean }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<any>(null);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const isAndroidWebView = /Android/i.test(ua) && /(wv|WebView)/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const shouldContinueRef = (typeof window !== 'undefined') ? (window as any)._voiceShouldContinueRef || { current: false } : { current: false };
  if (typeof window !== 'undefined') { (window as any)._voiceShouldContinueRef = shouldContinueRef; }
  const lastEventAtRef = (typeof window !== 'undefined') ? (window as any)._voiceLastEventAtRef || { current: 0 } : { current: 0 };
  if (typeof window !== 'undefined') { (window as any)._voiceLastEventAtRef = lastEventAtRef; }

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech Recognition not supported in your browser");
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = isAndroidWebView ? false : true;
    recognitionInstance.interimResults = isAndroidWebView ? false : true;
    recognitionInstance.lang = lang || (isAndroidWebView ? 'ar-SA' : 'ar-SA');

    recognitionInstance.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript("");
      try { console.log('[voice] onstart'); } catch {}
      lastEventAtRef.current = Date.now();
    };

    recognitionInstance.onresult = (event: any) => {
      let interim = "";
      let final = "";
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        let best = event.results[i][0];
        for (let j = 1; j < event.results[i].length; j++) {
          if (event.results[i][j].confidence > best.confidence) {
            best = event.results[i][j];
          }
        }
        const text = best.transcript;
        if (event.results[i].isFinal) {
          final += text + " ";
        } else {
          interim += text + " ";
        }
      }
      
      // Prioritize final results, but show interim for real-time feedback
      if (final.trim()) {
        setTranscript(final.trim());
        setFinalTranscript(final.trim());
        setInterimTranscript("");
      } else if (interim.trim()) {
        setTranscript(interim.trim());
        setInterimTranscript(interim.trim());
      }
      try { console.log('[voice] onresult', { final: final.trim(), interim: interim.trim() }); } catch {}
      lastEventAtRef.current = Date.now();
    };

    recognitionInstance.onerror = (event: any) => {
      try { console.error('[voice] onerror', event.error); } catch {}
      if (event.error !== 'aborted') {
        setError(`Error: ${event.error}. Please check your microphone.`);
      }
      setIsListening(false);
      const autoRestart = options?.autoRestart ?? true;
      if (autoRestart && shouldContinueRef.current) {
        const recoverable = ['no-speech', 'network', 'audio-capture'];
        if (recoverable.includes(event.error)) {
          try {
            setTimeout(() => { try { recognitionInstance.start(); } catch {} }, 300);
          } catch {}
        }
      }
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
      const autoRestart = options?.autoRestart ?? true;
      if (autoRestart && shouldContinueRef.current) {
        try { recognitionInstance.start(); } catch {}
      }
      try { console.log('[voice] onend'); } catch {}
    };

    if ((recognitionInstance as any).onaudioend !== undefined) {
      (recognitionInstance as any).onaudioend = () => {
        try { console.log('[voice] onaudioend'); } catch {}
      };
    }

    setRecognition(recognitionInstance);
  }, [lang]);

  const requestPermission = useCallback(async () => {
    setPermissionRequested(true);
    if (isAndroidWebView) {
      return true;
    }
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        return true;
      } catch (err: any) {
        setError("Microphone permission denied");
        return false;
      }
    }
    return true;
  }, [isAndroidWebView]);

  const startListening = useCallback(async () => {
    if (recognition) {
      try {
        setTranscript("");
        setError(null);
        if (!permissionRequested) {
          await requestPermission();
        }
        shouldContinueRef.current = true;
        try { console.log('[voice] startListening'); } catch {}
        recognition.start();
      } catch (err) {
        try { console.error('[voice] startListening error', err); } catch {}
      }
    }
  }, [recognition, permissionRequested, requestPermission]);

  const stopListening = useCallback(() => {
    if (recognition) {
      try {
        shouldContinueRef.current = false;
        try { console.log('[voice] stopListening'); } catch {}
        recognition.stop();
      } catch (err) {
        try { console.error('[voice] stopListening error', err); } catch {}
      }
    }
  }, [recognition]);

  useEffect(() => {
    const id = setInterval(() => {
      if (recognition && isListening && shouldContinueRef.current) {
        const now = Date.now();
        const delta = now - (lastEventAtRef.current || 0);
        if (delta > 6000) {
          try {
            try { console.log('[voice] inactivity restart'); } catch {}
            recognition.stop();
            setTimeout(() => { try { recognition.start(); } catch {} }, 200);
          } catch {}
        }
      }
    }, 3000);
    return () => clearInterval(id);
  }, [recognition, isListening]);

  const restartListening = useCallback(() => {
    if (recognition) {
      try {
        shouldContinueRef.current = true;
        lastEventAtRef.current = Date.now();
        try { console.log('[voice] restartListening'); } catch {}
        recognition.stop();
        setTimeout(() => { try { recognition.start(); } catch {} }, 200);
      } catch (err) {
        try { console.error('[voice] restartListening error', err); } catch {}
      }
    }
  }, [recognition]);

  return {
    isListening,
    transcript,
    finalTranscript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    requestPermission,
    restartListening,
  };
}
