import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type VoiceStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "listening"
  | "speaking"
  | "error";

interface UseGeminiLiveVoiceOptions {
  voiceName?: string;
  systemPrompt?: string;
}

interface GeminiTokenResponse {
  token: string;
  expireTime?: string;
  newSessionExpireTime?: string;
}

const MODEL_NAME = "gemini-3.1-flash-live-preview";
const LIVE_WS_URL =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained";

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function float32ToPCM16(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, input[i]));
    output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return output;
}

function downsampleTo16k(input: Float32Array, sourceRate: number): Int16Array {
  if (!input.length) {
    return new Int16Array();
  }

  if (sourceRate === 16000) {
    return float32ToPCM16(input);
  }

  const ratio = sourceRate / 16000;
  const newLength = Math.max(1, Math.round(input.length / ratio));
  const result = new Int16Array(newLength);

  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.min(input.length, Math.round((offsetResult + 1) * ratio));
    let accum = 0;
    let count = 0;

    for (let i = offsetBuffer; i < nextOffsetBuffer; i += 1) {
      accum += input[i];
      count += 1;
    }

    const average = count > 0 ? accum / count : 0;
    const clipped = Math.max(-1, Math.min(1, average));
    result[offsetResult] = clipped < 0 ? clipped * 0x8000 : clipped * 0x7fff;

    offsetResult += 1;
    offsetBuffer = nextOffsetBuffer;
  }

  return result;
}

function int16ToUint8Array(input: Int16Array): Uint8Array {
  return new Uint8Array(input.buffer.slice(0));
}

function pcm16BytesToAudioBuffer(audioContext: AudioContext, bytes: Uint8Array, sampleRate: number): AudioBuffer {
  const int16 = new Int16Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  const audioBuffer = audioContext.createBuffer(1, int16.length, sampleRate);
  const channel = audioBuffer.getChannelData(0);

  for (let i = 0; i < int16.length; i += 1) {
    channel[i] = int16[i] / 0x8000;
  }

  return audioBuffer;
}

export function useGeminiLiveVoice(options: UseGeminiLiveVoiceOptions = {}) {
  const {
    voiceName = "Puck",
    systemPrompt =
      "You are Lulu, a tiny bedtime sprite inside a phone. Speak with a warm, cute, gentle tone. Keep replies short, natural, and soothing, usually within 1 to 3 sentences. If the user sounds sleepy, encourage them softly. You may speak Chinese or English to match the user, but keep the tone playful and comforting.",
  } = options;

  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [error, setError] = useState("");
  const [inputTranscript, setInputTranscript] = useState("");
  const [outputTranscript, setOutputTranscript] = useState("");
  const [isSessionReady, setIsSessionReady] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const zeroGainRef = useRef<GainNode | null>(null);
  const playbackSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextPlaybackTimeRef = useRef(0);
  const hasPendingTurnCompleteRef = useRef(false);
  const hasSentActivityStartRef = useRef(false);
  const connectPromiseRef = useRef<Promise<void> | null>(null);

  const isActive = useMemo(
    () => status === "connecting" || status === "connected" || status === "listening" || status === "speaking",
    [status],
  );

  const stopPlayback = useCallback(async () => {
    playbackSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch {
        // noop
      }
    });
    playbackSourcesRef.current.clear();
    nextPlaybackTimeRef.current = 0;
    hasPendingTurnCompleteRef.current = false;

    if (outputAudioContextRef.current) {
      try {
        await outputAudioContextRef.current.close();
      } catch {
        // noop
      }
      outputAudioContextRef.current = null;
    }
  }, []);

  const stopCapture = useCallback(async () => {
    const ws = wsRef.current;

    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      try {
        processorRef.current.disconnect();
      } catch {
        // noop
      }
      processorRef.current = null;
    }

    if (mediaSourceRef.current) {
      try {
        mediaSourceRef.current.disconnect();
      } catch {
        // noop
      }
      mediaSourceRef.current = null;
    }

    if (zeroGainRef.current) {
      try {
        zeroGainRef.current.disconnect();
      } catch {
        // noop
      }
      zeroGainRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    if (inputAudioContextRef.current) {
      try {
        await inputAudioContextRef.current.close();
      } catch {
        // noop
      }
      inputAudioContextRef.current = null;
    }

    if (ws && ws.readyState === WebSocket.OPEN && hasSentActivityStartRef.current) {
      ws.send(JSON.stringify({ realtimeInput: { activityEnd: {} } }));
    }

    hasSentActivityStartRef.current = false;
  }, []);

  const ensureOutputAudioContext = useCallback(async () => {
    if (!outputAudioContextRef.current) {
      outputAudioContextRef.current = new AudioContext();
    }

    if (outputAudioContextRef.current.state === "suspended") {
      await outputAudioContextRef.current.resume();
    }

    return outputAudioContextRef.current;
  }, []);

  const queueModelAudio = useCallback(
    async (base64Audio: string) => {
      const audioContext = await ensureOutputAudioContext();
      const bytes = base64ToBytes(base64Audio);
      const audioBuffer = pcm16BytesToAudioBuffer(audioContext, bytes, 24000);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      const startAt = Math.max(audioContext.currentTime + 0.02, nextPlaybackTimeRef.current);
      nextPlaybackTimeRef.current = startAt + audioBuffer.duration;
      playbackSourcesRef.current.add(source);

      setStatus("speaking");

      source.onended = () => {
        playbackSourcesRef.current.delete(source);
        if (playbackSourcesRef.current.size === 0) {
          nextPlaybackTimeRef.current = Math.max(audioContext.currentTime, 0);
          if (hasPendingTurnCompleteRef.current) {
            hasPendingTurnCompleteRef.current = false;
            setStatus("connected");
          }
        }
      };

      source.start(startAt);
    },
    [ensureOutputAudioContext],
  );

  const handleServerMessage = useCallback(
    async (rawData: string) => {
      const message = JSON.parse(rawData);
      const serverContent = message.serverContent;

      if (serverContent?.inputTranscription?.text) {
        setInputTranscript(serverContent.inputTranscription.text);
      }

      if (serverContent?.outputTranscription?.text) {
        setOutputTranscript(serverContent.outputTranscription.text);
      }

      const parts = serverContent?.modelTurn?.parts;
      if (Array.isArray(parts)) {
        for (const part of parts) {
          if (part?.inlineData?.data) {
            await queueModelAudio(part.inlineData.data);
          }
        }
      }

      if (serverContent?.turnComplete) {
        hasPendingTurnCompleteRef.current = true;
        if (playbackSourcesRef.current.size === 0) {
          hasPendingTurnCompleteRef.current = false;
          setStatus("connected");
        }
      }
    },
    [queueModelAudio],
  );

  const connect = useCallback(async () => {
    if (connectPromiseRef.current) {
      return connectPromiseRef.current;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setIsSessionReady(true);
      setStatus((prev) => (prev === "idle" ? "connected" : prev));
      return;
    }

    const work = (async () => {
      try {
        setError("");
        setStatus("connecting");

        const response = await fetch("/api/gemini-live-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voiceName }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error || "Failed to create Gemini ephemeral token.");
        }

        const payload = (await response.json()) as GeminiTokenResponse;
        if (!payload?.token) {
          throw new Error("Server did not return a Gemini token.");
        }

        await stopPlayback();

        await new Promise<void>((resolve, reject) => {
          const ws = new WebSocket(`${LIVE_WS_URL}?access_token=${encodeURIComponent(payload.token)}`);
          wsRef.current = ws;

          ws.onopen = () => {
            const configMessage = {
              config: {
                model: `models/${MODEL_NAME}`,
                generationConfig: {
                  temperature: 0.7,
                },
                systemInstruction: {
                  parts: [{ text: systemPrompt }],
                },
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName,
                    },
                  },
                },
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                sessionResumption: {},
                realtimeInputConfig: {
                  automaticActivityDetection: {
                    disabled: true,
                  },
                },
              },
            };

            ws.send(JSON.stringify(configMessage));
            setIsSessionReady(true);
            setStatus("connected");
            resolve();
          };

          ws.onmessage = (event) => {
            void handleServerMessage(event.data);
          };

          ws.onerror = () => {
            setError("Gemini Live connection failed.");
            setStatus("error");
            setIsSessionReady(false);
            reject(new Error("Gemini Live connection failed."));
          };

          ws.onclose = () => {
            wsRef.current = null;
            setIsSessionReady(false);
            setStatus((prev) => (prev === "error" ? "error" : "idle"));
          };
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection failed.";
        setError(message);
        setStatus("error");
        setIsSessionReady(false);
        throw err;
      } finally {
        connectPromiseRef.current = null;
      }
    })();

    connectPromiseRef.current = work;
    return work;
  }, [handleServerMessage, stopPlayback, systemPrompt, voiceName]);

  const startListening = useCallback(async () => {
    try {
      await connect();

      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        throw new Error("Gemini Live session is not ready.");
      }

      await stopCapture();
      await stopPlayback();
      setError("");
      setStatus("listening");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      micStreamRef.current = stream;

      const audioContext = new AudioContext();
      inputAudioContextRef.current = audioContext;
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      const zeroGain = audioContext.createGain();
      zeroGain.gain.value = 0;

      mediaSourceRef.current = source;
      processorRef.current = processor;
      zeroGainRef.current = zeroGain;
      hasSentActivityStartRef.current = false;

      source.connect(processor);
      processor.connect(zeroGain);
      zeroGain.connect(audioContext.destination);

      processor.onaudioprocess = (event) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          return;
        }

        const inputData = event.inputBuffer.getChannelData(0);
        const pcm16 = downsampleTo16k(new Float32Array(inputData), audioContext.sampleRate);
        if (!pcm16.length) {
          return;
        }

        if (!hasSentActivityStartRef.current) {
          ws.send(JSON.stringify({ realtimeInput: { activityStart: {} } }));
          hasSentActivityStartRef.current = true;
        }

        const bytes = int16ToUint8Array(pcm16);
        ws.send(
          JSON.stringify({
            realtimeInput: {
              audio: {
                data: bytesToBase64(bytes),
                mimeType: "audio/pcm;rate=16000",
              },
            },
          }),
        );
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to start microphone.";
      setError(message);
      setStatus("error");
    }
  }, [connect, stopCapture, stopPlayback]);

  const stopListening = useCallback(async () => {
    try {
      await stopCapture();
      setStatus((prev) => (prev === "error" ? prev : "connected"));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to stop microphone.";
      setError(message);
      setStatus("error");
    }
  }, [stopCapture]);

  const disconnect = useCallback(async () => {
    await stopCapture();
    await stopPlayback();

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // noop
      }
      wsRef.current = null;
    }

    setIsSessionReady(false);
    setStatus("idle");
    hasSentActivityStartRef.current = false;
  }, [stopCapture, stopPlayback]);

  useEffect(() => {
    return () => {
      void disconnect();
    };
  }, [disconnect]);

  return {
    status,
    error,
    inputTranscript,
    outputTranscript,
    isActive,
    isSessionReady,
    connect,
    disconnect,
    startListening,
    stopListening,
  };
}
