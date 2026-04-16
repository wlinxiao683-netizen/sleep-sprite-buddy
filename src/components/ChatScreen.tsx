// import { AnimatePresence, motion } from "framer-motion";
// import { X } from "lucide-react";
// import { useEffect, useState } from "react";

// import yawnVideo from "@/assets/sprites/4月12日 (5)(2).mp4";
// import answerVideo from "@/assets/sprites/4123.mp4"; // 这里改成你的 answer 视频
// import awakeVideo from "@/assets/sprites/4121.mp4";
// import talkVideo from "@/assets/sprites/4122.mp4";

// type VideoPhase = "awake" | "talk" | "answer" | "yawn";

// const PALETTE = ["#e8b4ff", "#c4a3ff", "#a0e8ff", "#ffe0a0", "#ffb4d0", "#b4ffe8"];
// const PARTICLES = Array.from({ length: 28 }, (_, i) => {
//   const edge = i % 4;
//   const rnd = Math.random();
//   const x = edge === 0 ? rnd * 100 : edge === 1 ? 82 + rnd * 18 : edge === 2 ? rnd * 100 : rnd * 18;
//   const y = edge === 0 ? rnd * 16 : edge === 1 ? rnd * 100 : edge === 2 ? 84 + rnd * 16 : rnd * 100;

//   return {
//     id: i,
//     x,
//     y,
//     size: 2 + Math.random() * 5,
//     dur: 3 + Math.random() * 4,
//     delay: Math.random() * 3,
//     color: PALETTE[i % PALETTE.length],
//   };
// });

// export interface ChatScreenProps {
//   open: boolean;
//   isLandscape: boolean;
//   onClose: () => void;
// }

// const ChatScreen = ({ open, isLandscape, onClose }: ChatScreenProps) => {
//   const [videoPhase, setVideoPhase] = useState<VideoPhase>("awake");

//   useEffect(() => {
//     setVideoPhase("awake");
//   }, [open]);

//   const currentVideoSrc =
//     videoPhase === "awake"
//       ? awakeVideo
//       : videoPhase === "talk"
//       ? talkVideo
//       : videoPhase === "answer"
//       ? answerVideo
//       : yawnVideo;

//   return (
//     <AnimatePresence>
//       {open && (
//         <>
//           <motion.div
//             className="fixed inset-0 z-50"
//             style={{ background: "#000" }}
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.25 }}
//           />

//           <motion.div
//             className="fixed inset-0 z-50 overflow-hidden"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.25 }}
//           >
//             {PARTICLES.map((p) => (
//               <motion.div
//                 key={p.id}
//                 className="absolute rounded-full pointer-events-none"
//                 style={{
//                   left: `${p.x}%`,
//                   top: `${p.y}%`,
//                   width: p.size,
//                   height: p.size,
//                   background: p.color,
//                   boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
//                 }}
//                 animate={{ opacity: [0.2, 0.85, 0.2], scale: [0.7, 1.4, 0.7] }}
//                 transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
//               />
//             ))}

//             <motion.div
//               className="absolute"
//               style={{
//                 top: 0,
//                 left: 0,
//                 right: 0,
//                 bottom: 0,
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 pointerEvents: "none",
//               }}
//               initial={{ scale: 1.2, opacity: 0 }}
//               animate={{ scale: 1.2, opacity: 1 }}
//               exit={{ scale: 1.2, opacity: 0 }}
//               transition={{ type: "spring", stiffness: 240, damping: 20 }}
//             >
//               <video
//                 key={videoPhase}
//                 src={currentVideoSrc}
//                 autoPlay
//                 muted={false}
//                 loop={videoPhase === "yawn"}
//                 playsInline
//                 onEnded={() => {
//                   if (videoPhase === "awake") setVideoPhase("talk");
//                   else if (videoPhase === "talk") setVideoPhase("answer");
//                   else if (videoPhase === "answer") setVideoPhase("yawn");
//                 }}
//                 style={{
//                   maxHeight: "100%",
//                   maxWidth: isLandscape ? "65%" : "92%",
//                   objectFit: "contain",
//                   borderRadius: 20,
//                 }}
//               />
//             </motion.div>

//             <div
//               style={{
//                 position: "absolute",
//                 top: "max(14px, env(safe-area-inset-top))",
//                 right: "max(14px, env(safe-area-inset-right))",
//                 display: "flex",
//                 gap: 8,
//                 zIndex: 10,
//               }}
//             >
//               <motion.button
//                 onClick={onClose}
//                 whileTap={{ scale: 0.82 }}
//                 initial={{ scale: 0.5, opacity: 0 }}
//                 animate={{ scale: 1, opacity: 1 }}
//                 exit={{ scale: 0.5, opacity: 0 }}
//                 transition={{ delay: 0.18, type: "spring", stiffness: 360, damping: 22 }}
//                 style={{
//                   width: 34,
//                   height: 34,
//                   borderRadius: "50%",
//                   background: "rgba(255,255,255,0.1)",
//                   border: "1px solid rgba(255,255,255,0.18)",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   cursor: "pointer",
//                   backdropFilter: "blur(8px)",
//                 }}
//                 aria-label="Close"
//               >
//                 <X size={16} color="rgba(255,255,255,0.85)" strokeWidth={2.5} />
//               </motion.button>
//             </div>
//           </motion.div>
//         </>
//       )}
//     </AnimatePresence>
//   );
// };

// export default ChatScreen;


import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Mic, PhoneOff, Sparkles, Volume2, X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

import yawnVideo from "@/assets/sprites/4月12日 (5)(2).mp4";
import answerVideo from "@/assets/sprites/4123.mp4";
import awakeVideo from "@/assets/sprites/4121.mp4";
import talkVideo from "@/assets/sprites/4122.mp4";

type VideoPhase = "awake" | "talk" | "answer" | "yawn";
type ScreenMode = "animation" | "voice";
type VoiceStatus = "idle" | "recording" | "processing" | "speaking" | "error";
type ChatHistoryItem = {
  role: "user" | "model";
  text: string;
};

const PALETTE = ["#e8b4ff", "#c4a3ff", "#a0e8ff", "#ffe0a0", "#ffb4d0", "#b4ffe8"];
const PARTICLES = Array.from({ length: 28 }, (_, i) => {
  const edge = i % 4;
  const rnd = Math.random();
  const x = edge === 0 ? rnd * 100 : edge === 1 ? 82 + rnd * 18 : edge === 2 ? rnd * 100 : rnd * 18;
  const y = edge === 0 ? rnd * 16 : edge === 1 ? rnd * 100 : edge === 2 ? 84 + rnd * 16 : rnd * 100;

  return {
    id: i,
    x,
    y,
    size: 2 + Math.random() * 5,
    dur: 3 + Math.random() * 4,
    delay: Math.random() * 3,
    color: PALETTE[i % PALETTE.length],
  };
});

export interface ChatScreenProps {
  open: boolean;
  isLandscape: boolean;
  onClose: () => void;
}

function getVoiceVideoPhase(status: VoiceStatus): VideoPhase {
  if (status === "recording") return "talk";
  if (status === "processing" || status === "speaking") return "answer";
  if (status === "error") return "awake";
  return "yawn";
}

function getStatusText(status: VoiceStatus) {
  switch (status) {
    case "recording":
      return "Listening... tap again when you finish.";
    case "processing":
      return "Lulu is thinking...";
    case "speaking":
      return "Lulu is replying...";
    case "error":
      return "Voice mode hit an error.";
    default:
      return "Tap the mic once to start, tap again to stop.";
  }
}

function getSupportedAudioMimeType() {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return "audio/webm";
  }

  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  for (const candidate of candidates) {
    if (typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }

  return "audio/webm";
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Failed to read audio data."));
        return;
      }

      const base64 = reader.result.split(",")[1];
      if (!base64) {
        reject(new Error("Failed to encode audio."));
        return;
      }

      resolve(base64);
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error("Failed to read audio data."));
    };

    reader.readAsDataURL(blob);
  });
}

function pickBestVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) {
    return null;
  }

  return (
    voices.find((voice) => /en/i.test(voice.lang) && /female|samantha|zira|aria|ava|serena/i.test(voice.name)) ??
    voices.find((voice) => /^en/i.test(voice.lang)) ??
    voices[0] ??
    null
  );
}

const ChatScreen = ({ open, isLandscape, onClose }: ChatScreenProps) => {
  const [videoPhase, setVideoPhase] = useState<VideoPhase>("awake");
  const [screenMode, setScreenMode] = useState<ScreenMode>("animation");
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle");
  const [error, setError] = useState<string>("");
  const [inputTranscript, setInputTranscript] = useState("");
  const [outputTranscript, setOutputTranscript] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const historyRef = useRef<ChatHistoryItem[]>([]);
  const aliveRef = useRef(true);
  const skipNextBlobRef = useRef(false);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  useEffect(() => {
    setVideoPhase("awake");
    setScreenMode("animation");
    setVoiceStatus("idle");
    setError("");
    setInputTranscript("");
    setOutputTranscript("");
    historyRef.current = [];
  }, [open]);

  useEffect(() => {
    if (!open) {
      void cleanupVoiceResources();
    }
  }, [open]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.getVoices();
    const handleVoicesChanged = () => {
      window.speechSynthesis.getVoices();
    };

    window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
    };
  }, []);

  const currentPhase = useMemo(() => {
    return screenMode === "animation" ? videoPhase : getVoiceVideoPhase(voiceStatus);
  }, [screenMode, videoPhase, voiceStatus]);

  const currentVideoSrc =
    currentPhase === "awake"
      ? awakeVideo
      : currentPhase === "talk"
      ? talkVideo
      : currentPhase === "answer"
      ? answerVideo
      : yawnVideo;

  const stopRecorderTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const stopSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    speechUtteranceRef.current = null;
  };

  const cleanupVoiceResources = async () => {
    stopSpeech();

    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      skipNextBlobRef.current = true;
      recorderRef.current.stop();
    }

    recorderRef.current = null;
    stopRecorderTracks();
    chunksRef.current = [];
  };

  const speakText = async (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    await new Promise<void>((resolve) => {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = pickBestVoice();
      utterance.rate = 1;
      utterance.pitch = 1.05;
      utterance.volume = 1;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      speechUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    });
  };

  const sendAudioToBackend = async (audioBlob: Blob) => {
    const audioBase64 = await blobToBase64(audioBlob);

    const response = await fetch("/api/voice-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audioBase64,
        mimeType: audioBlob.type || getSupportedAudioMimeType(),
        history: historyRef.current.slice(-6),
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Voice request failed.");
    }

    const data = (await response.json()) as {
      userText?: string;
      replyText?: string;
    };

    if (!data.replyText) {
      throw new Error("Lulu did not return a reply.");
    }

    return {
      userText: data.userText?.trim() || "",
      replyText: data.replyText.trim(),
    };
  };

  const handleRecordedBlob = async (audioBlob: Blob) => {
    try {
      if (!aliveRef.current) return;
      setVoiceStatus("processing");
      setError("");

      const { userText, replyText } = await sendAudioToBackend(audioBlob);
      if (!aliveRef.current) return;

      setInputTranscript(userText || "(No transcription returned)");
      setOutputTranscript(replyText);

      if (userText) {
        historyRef.current.push({ role: "user", text: userText });
      }
      historyRef.current.push({ role: "model", text: replyText });
      historyRef.current = historyRef.current.slice(-10);

      setVoiceStatus("speaking");
      await speakText(replyText);

      if (!aliveRef.current) return;
      setVoiceStatus("idle");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Voice mode failed.";
      if (!aliveRef.current) return;
      setError(message);
      setVoiceStatus("error");
    }
  };

  const startRecording = async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setVoiceStatus("error");
      setError("This browser does not support microphone recording.");
      return;
    }

    try {
      setError("");
      stopSpeech();
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const mimeType = getSupportedAudioMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      skipNextBlobRef.current = false;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const shouldSkip = skipNextBlobRef.current;
        skipNextBlobRef.current = false;

        const blobType = recorder.mimeType || mimeType || "audio/webm";
        const audioBlob = new Blob(chunksRef.current, { type: blobType });
        chunksRef.current = [];
        stopRecorderTracks();

        if (shouldSkip) {
          if (aliveRef.current) {
            setVoiceStatus("idle");
          }
          return;
        }

        if (audioBlob.size > 0) {
          void handleRecordedBlob(audioBlob);
        } else if (aliveRef.current) {
          setVoiceStatus("error");
          setError("No audio was captured. Please try again.");
        }
      };

      recorder.onerror = () => {
        stopRecorderTracks();
        if (!aliveRef.current) return;
        setVoiceStatus("error");
        setError("Recording failed. Please try again.");
      };

      recorder.start();
      setVoiceStatus("recording");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not access the microphone.";
      setVoiceStatus("error");
      setError(message);
      stopRecorderTracks();
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
      return;
    }

    stopRecorderTracks();
    setVoiceStatus("idle");
  };

  const handleToggleVoiceMode = async () => {
    if (screenMode === "animation") {
      setScreenMode("voice");
      setVoiceStatus("idle");
      setError("");
      return;
    }

    await cleanupVoiceResources();
    setScreenMode("animation");
    setVideoPhase("awake");
    setVoiceStatus("idle");
    setError("");
  };

  const handleMicClick = async () => {
    if (voiceStatus === "processing") {
      return;
    }

    if (voiceStatus === "recording") {
      stopRecording();
      return;
    }

    await startRecording();
  };

  const handleClose = async () => {
    await cleanupVoiceResources();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50"
            style={{ background: "#000" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />

          <motion.div
            className="fixed inset-0 z-50 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {PARTICLES.map((p) => (
              <motion.div
                key={p.id}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: p.size,
                  height: p.size,
                  background: p.color,
                  boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                }}
                animate={{ opacity: [0.2, 0.85, 0.2], scale: [0.7, 1.4, 0.7] }}
                transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}

            <motion.div
              className="absolute"
              style={{
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 20 }}
            >
              <video
                key={`${screenMode}-${currentPhase}`}
                src={currentVideoSrc}
                autoPlay
                muted={screenMode === "voice"}
                loop={screenMode === "voice" ? currentPhase !== "answer" : videoPhase === "yawn"}
                playsInline
                onEnded={() => {
                  if (screenMode === "voice") return;
                  if (videoPhase === "awake") setVideoPhase("talk");
                  else if (videoPhase === "talk") setVideoPhase("answer");
                  else if (videoPhase === "answer") setVideoPhase("yawn");
                }}
                style={{
                  maxHeight: "100%",
                  maxWidth: isLandscape ? "65%" : "92%",
                  objectFit: "contain",
                  borderRadius: 20,
                }}
              />
            </motion.div>

            <div
              style={{
                position: "absolute",
                top: "max(14px, env(safe-area-inset-top))",
                right: "max(14px, env(safe-area-inset-right))",
                display: "flex",
                gap: 8,
                zIndex: 10,
              }}
            >
              <motion.button
                onClick={() => void handleToggleVoiceMode()}
                whileTap={{ scale: 0.82 }}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ delay: 0.12, type: "spring", stiffness: 360, damping: 22 }}
                style={{
                  minWidth: 86,
                  height: 34,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "rgba(255,255,255,0.92)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  cursor: "pointer",
                  backdropFilter: "blur(8px)",
                  padding: "0 12px",
                  fontSize: 13,
                  fontWeight: 600,
                }}
                aria-label="Toggle voice mode"
              >
                <Sparkles size={14} />
                {screenMode === "voice" ? "Animation" : "Voice"}
              </motion.button>

              <motion.button
                onClick={() => void handleClose()}
                whileTap={{ scale: 0.82 }}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ delay: 0.18, type: "spring", stiffness: 360, damping: 22 }}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  backdropFilter: "blur(8px)",
                }}
                aria-label="Close"
              >
                <X size={16} color="rgba(255,255,255,0.85)" strokeWidth={2.5} />
              </motion.button>
            </div>

            {screenMode === "voice" && (
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
                style={{
                  position: "absolute",
                  left: 16,
                  right: 16,
                  bottom: "max(16px, env(safe-area-inset-bottom))",
                  zIndex: 15,
                  borderRadius: 24,
                  padding: 16,
                  background: "rgba(12,12,18,0.72)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
                  color: "white",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    {/* <div style={{ fontSize: 15, fontWeight: 700 }}>Lulu Voice Mode</div> */}
                    <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{getStatusText(voiceStatus)}</div>
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => void handleMicClick()}
                      disabled={voiceStatus === "processing"}
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: "50%",
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: voiceStatus === "recording" ? "rgba(255,120,120,0.28)" : "rgba(255,255,255,0.12)",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: voiceStatus === "processing" ? "not-allowed" : "pointer",
                      }}
                      aria-label={voiceStatus === "recording" ? "Stop talking" : "Start talking"}
                    >
                      {voiceStatus === "processing" ? <Loader2 size={20} className="animate-spin" /> : <Mic size={20} />}
                    </button>

                    {/* <button
                      onClick={() => void handleToggleVoiceMode()}
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: "50%",
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "rgba(255,255,255,0.08)",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                      aria-label="Exit voice mode"
                    >
                      <PhoneOff size={20} />
                    </button> */}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                  <div
                    style={{
                      borderRadius: 18,
                      background: "rgba(255,255,255,0.06)",
                      padding: "10px 12px",
                      minHeight: 58,
                    }}
                  >
                    {/* <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, opacity: 0.65 }}>
                      <Mic size={12} />
                      You
                    </div> */}
                    <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.45, opacity: inputTranscript ? 0.96 : 0.55 }}>
                      {inputTranscript || "Your speech transcription will appear here."}
                    </div>
                  </div>

                  <div
                    style={{
                      borderRadius: 18,
                      background: "rgba(255,255,255,0.08)",
                      padding: "10px 12px",
                      minHeight: 58,
                    }}
                  >
                    {/* <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, opacity: 0.65 }}>
                      <Volume2 size={12} />
                      Lulu
                    </div> */}
                    <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.45, opacity: outputTranscript ? 0.96 : 0.55 }}>
                      {outputTranscript || "Lulu's reply will appear here."}
                    </div>
                  </div>
                </div>

                {error && <div style={{ marginTop: 12, fontSize: 12, color: "#ffb4b4" }}>{error}</div>}
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChatScreen;
