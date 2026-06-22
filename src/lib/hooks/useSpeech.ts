"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Minimal local typings for the Web Speech API (recognition side), which is
 * not part of the default TS DOM libs. We only declare what we actually use.
 */
interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionResultListLike {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}
interface SpeechRecognitionErrorEventLike {
  error: string;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

interface SpeechWindow extends Window {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
}

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as SpeechWindow;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function synthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export interface UseSpeechReturn {
  supported: { recognition: boolean; synthesis: boolean };
  listening: boolean;
  startListening: (
    onFinal: (text: string) => void,
    onInterim?: (text: string) => void
  ) => void;
  stopListening: () => void;
  speaking: boolean;
  speak: (text: string) => void;
  cancelSpeak: () => void;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setVoice: (v: SpeechSynthesisVoice | null) => void;
}

export function useSpeech(): UseSpeechReturn {
  const [supported, setSupported] = useState({
    recognition: false,
    synthesis: false,
  });
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] =
    useState<SpeechSynthesisVoice | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef<((text: string) => void) | null>(null);
  const onInterimRef = useRef<((text: string) => void) | null>(null);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Keep a ref of the selected voice for use inside speak() callbacks.
  useEffect(() => {
    selectedVoiceRef.current = selectedVoice;
  }, [selectedVoice]);

  // Feature detection + voice loading (client only). Detection must run after
  // mount to stay SSR-safe, so setState here is intentional.
  useEffect(() => {
    const recognition = getRecognitionCtor() !== null;
    const synthesis = synthesisSupported();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported({ recognition, synthesis });

    if (!synthesis) return;

    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices();
      if (list.length === 0) return;
      setVoices(list);
      setSelectedVoice((prev) => {
        if (prev) return prev;
        // Prefer an English voice for the interview coach.
        return list.find((v) => v.lang.startsWith("en")) ?? list[0] ?? null;
      });
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      // Stop any in-flight speech on unmount.
      if (synthesisSupported()) window.speechSynthesis.cancel();
    };
  }, []);

  // Clean up recognition on unmount.
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch {
      // ignore
    }
  }, []);

  const startListening = useCallback(
    (onFinal: (text: string) => void, onInterim?: (text: string) => void) => {
      const Ctor = getRecognitionCtor();
      if (!Ctor) return;

      // If an instance is already running, restart cleanly.
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }

      onFinalRef.current = onFinal;
      onInterimRef.current = onInterim ?? null;

      const rec = new Ctor();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (event: SpeechRecognitionEventLike) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0]?.transcript ?? "";
          if (result.isFinal) {
            final += text;
          } else {
            interim += text;
          }
        }
        if (interim && onInterimRef.current) {
          onInterimRef.current(interim);
        }
        if (final) {
          onFinalRef.current?.(final.trim());
        }
      };

      rec.onerror = () => {
        setListening(false);
      };

      rec.onend = () => {
        setListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = rec;
      try {
        rec.start();
        setListening(true);
      } catch {
        setListening(false);
        recognitionRef.current = null;
      }
    },
    []
  );

  const cancelSpeak = useCallback(() => {
    if (!synthesisSupported()) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (!synthesisSupported() || !text.trim()) return;
    // Cancel anything already queued/speaking first.
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    if (selectedVoiceRef.current) {
      utterance.voice = selectedVoiceRef.current;
    }
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const setVoice = useCallback((v: SpeechSynthesisVoice | null) => {
    setSelectedVoice(v);
  }, []);

  return {
    supported,
    listening,
    startListening,
    stopListening,
    speaking,
    speak,
    cancelSpeak,
    voices,
    selectedVoice,
    setVoice,
  };
}
