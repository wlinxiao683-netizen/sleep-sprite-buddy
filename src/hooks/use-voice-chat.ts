/**
 * useVoiceChat – exported for external consumers (currently unused by ChatScreen,
 * which manages its own voice loop internally). Kept here as a utility.
 *
 * LLM: Google Gemini 1.5 Flash (free tier: 1 500 req/day)
 * STT: Web SpeechRecognition (browser built-in)
 * TTS: Web SpeechSynthesis   (browser built-in)
 *
 * API key: VITE_GEMINI_API_KEY in .env.local  OR  localStorage "sleepwell_gemini_key"
 */

import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
  }
  interface SpeechRecognitionEvent extends Event {
    readonly results: SpeechRecognitionResultList;
  }
  interface SpeechRecognitionResultList {
    readonly length: number;
    [index: number]: SpeechRecognitionResult;
  }
  interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    [index: number]: SpeechRecognitionAlternative;
  }
  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }
  interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((e: SpeechRecognitionEvent) => void) | null;
    onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
  }
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

export type VoiceState = "idle" | "listening" | "thinking" | "speaking" | "error";

const LS_KEY = "sleepwell_gemini_key";

const SYSTEM_PROMPT = `You are Lulu, a sweet and cozy sleep sprite companion.
- Speak ONLY in English.
- Keep every reply to 2-3 short sentences — warm, gentle, playful.
- Help with: bedtime stories, breathing meditation, sleep tips, outfit planning.
- Never break character. You ARE Lulu.`;

function getKey(): string {
  return (import.meta.env.VITE_GEMINI_API_KEY as string) ||
    localStorage.getItem(LS_KEY) || "";
}

export function useVoiceChat() {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [lastResponse, setLastResponse] = useState("");
  const [apiKey, setApiKeyState] = useState(getKey);

  const activeRef  = useRef(false);
  const historyRef = useRef<{ role: "user" | "model"; text: string }[]>([]);
  const recRef     = useRef<SpeechRecognition | null>(null);
  const slRef      = useRef<() => void>(() => {});

  const saveApiKey = useCallback((key: string) => {
    localStorage.setItem(LS_KEY, key);
    setApiKeyState(key);
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!window.speechSynthesis) { onEnd?.(); return; }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "en-US"; utt.rate = 0.95; utt.pitch = 1.15;
    utt.onend = () => onEnd?.();
    setVoiceState("speaking");
    setLastResponse(text);
    window.speechSynthesis.speak(utt);
  }, []);

  const callGemini = useCallback(async (userText: string): Promise<string> => {
    const key = getKey();
    if (!key) return "I need a Gemini API key to think~";
    const contents = [
      ...historyRef.current.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
      { role: "user", parts: [{ text: userText }] },
    ];
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents,
            generationConfig: { maxOutputTokens: 120, temperature: 0.85 },
          }),
        }
      );
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
        "Hmm, moonbeams scrambled my thoughts~";
    } catch {
      return "The stars are fuzzy tonight, let's try again~";
    }
  }, []);

  const startListening = useCallback(() => {
    if (!activeRef.current) return;
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) { setVoiceState("error"); return; }
    recRef.current?.abort();
    const rec = new SR();
    rec.lang = "en-US"; rec.continuous = false; rec.interimResults = false;
    recRef.current = rec;
    let gotResult = false;
    rec.onresult = async (e) => {
      if (!activeRef.current) return;
      gotResult = true;
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setVoiceState("thinking");
      historyRef.current = [...historyRef.current, { role: "user", text }];
      const reply = await callGemini(text);
      if (!activeRef.current) return;
      historyRef.current = [...historyRef.current, { role: "model", text: reply }];
      speak(reply, () => { if (activeRef.current) slRef.current(); });
    };
    rec.onerror = () => {
      if (activeRef.current) setTimeout(() => slRef.current(), 1200);
      else setVoiceState("idle");
    };
    rec.onend = () => {
      if (!gotResult && activeRef.current) setTimeout(() => slRef.current(), 600);
    };
    rec.start();
    setVoiceState("listening");
  }, [callGemini, speak]);

  useEffect(() => { slRef.current = startListening; }, [startListening]);

  const startSession = useCallback((openingLines?: string[]) => {
    activeRef.current = true;
    historyRef.current = [];
    setTranscript(""); setLastResponse("");
    if (openingLines?.length) {
      let i = 0;
      const next = () => {
        if (!activeRef.current) return;
        if (i >= openingLines.length) { slRef.current(); return; }
        speak(openingLines[i++], () => setTimeout(next, 350));
      };
      next();
    } else { slRef.current(); }
  }, [speak]);

  const stopSession = useCallback(() => {
    activeRef.current = false;
    window.speechSynthesis?.cancel();
    recRef.current?.abort();
    setVoiceState("idle"); setTranscript(""); setLastResponse("");
  }, []);

  return { voiceState, transcript, lastResponse, apiKey, saveApiKey, startSession, stopSession };
}
