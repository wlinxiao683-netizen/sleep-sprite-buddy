// // /**
// //  * ChatScreen – full-viewport voice-chat overlay.
// //  *
// //  * Video (landscape open):
// //  *   1. awake1.mp4 plays once (no loop)
// //  *   2. onEnded → tallk1.mp4 loops for the rest of the session
// //  *
// //  * Voice loop:
// //  *   open → TTS GREETING_A → TTS GREETING_B
// //  *   → listen → user → Gemini → TTS reply → listen → …
// //  *
// //  * Gemini notes:
// //  *   - Model IDs change; we try several known v1beta IDs (404 fallback).
// //  *   - Contents must strictly alternate user/model — never two model turns in a row.
// //  */

// // import { AnimatePresence, motion } from "framer-motion";
// // import { Mic, MicOff, Settings, X } from "lucide-react";
// // import { useCallback, useEffect, useRef, useState } from "react";

// // import awakeVideo from "@/assets/sprites/awake1.mp4";
// // import talkVideo  from "@/assets/sprites/tallk1.mp4";

// // // ─── Types ────────────────────────────────────────────────────────────────────
// // type VS = "idle" | "listening" | "thinking" | "speaking" | "error";
// // interface Msg { role: "user" | "model"; parts: [{ text: string }]; }

// // // ─── Constants ────────────────────────────────────────────────────────────────
// // // eslint-disable-next-line @typescript-eslint/no-explicit-any
// // const ENV_KEY: string = (import.meta as any).env?.VITE_GEMINI_API_KEY ?? "";

// // const SYSTEM_PROMPT = `You are Lulu, an adorable cozy bedtime sprite.
// // - Speak ONLY in English.
// // - Keep every reply to 2-3 short sentences — warm, gentle, playful.
// // - Help with: calming bedtime blogs, breathing exercises, sleep tips, outfit ideas.
// // - You ARE Lulu — never break character.`;

// // const GREETING_A = "Ah~ it feels so good to have a body back!";
// // const GREETING_B = "Would you like a bedtime story, some meditation, or shall we plan tomorrow's outfit?";

// // /** Single model turn for Gemini (API forbids two consecutive `model` messages). */
// // const GREETING_COMBINED = `${GREETING_A}\n\n${GREETING_B}`;

// // /**
// //  * Prefer currently supported models first.
// //  * Google now recommends Gemini 2.5 Flash for standard generateContent calls,
// //  * while Gemini 2.0 Flash may be unavailable to new API keys.
// //  */
// // const GEMINI_MODEL_IDS = [
// //   "gemini-2.5-flash",
// //   "gemini-2.5-flash-lite",
// //   "gemini-3-flash-preview",
// //   "gemini-3.1-flash-lite-preview",
// // ] as const;

// // // Particles — generated once, stable across renders
// // const PALETTE = ["#e8b4ff", "#c4a3ff", "#a0e8ff", "#ffe0a0", "#ffb4d0", "#b4ffe8"];
// // const PARTICLES = Array.from({ length: 28 }, (_, i) => {
// //   const edge = i % 4;
// //   const rnd  = Math.random();
// //   const x = edge === 0 ? rnd * 100 : edge === 1 ? 82 + rnd * 18 : edge === 2 ? rnd * 100 : rnd * 18;
// //   const y = edge === 0 ? rnd * 16  : edge === 1 ? rnd * 100     : edge === 2 ? 84 + rnd * 16 : rnd * 100;
// //   return { id: i, x, y, size: 2 + Math.random() * 5, dur: 3 + Math.random() * 4, delay: Math.random() * 3, color: PALETTE[i % PALETTE.length] };
// // });

// // // ─── Sub-components ───────────────────────────────────────────────────────────
// // const Waveform = () => (
// //   <div className="flex items-center gap-[3px]" style={{ height: 26 }}>
// //     {[0.4, 0.7, 1, 0.8, 0.5, 0.9, 0.6, 1, 0.7, 0.45].map((h, i) => (
// //       <motion.div
// //         key={i}
// //         style={{ width: 3, borderRadius: 2, background: "linear-gradient(to top,#c4a3ff,#a0e8ff)" }}
// //         animate={{ height: [h * 9, h * 22, h * 7, h * 18, h * 9] }}
// //         transition={{ duration: 0.85 + i * 0.06, repeat: Infinity, ease: "easeInOut", delay: i * 0.06 }}
// //       />
// //     ))}
// //   </div>
// // );

// // const ThinkingDots = () => (
// //   <div className="flex gap-2 items-center">
// //     {[0, 1, 2].map((i) => (
// //       <motion.div
// //         key={i}
// //         style={{ width: 7, height: 7, borderRadius: "50%", background: "#c4a3ff" }}
// //         animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
// //         transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
// //       />
// //     ))}
// //   </div>
// // );

// // const ApiKeyPrompt = ({ onSave }: { onSave: (k: string) => void }) => {
// //   const [val, setVal] = useState("");
// //   return (
// //     <motion.div
// //       className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 px-8"
// //       style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(6px)" }}
// //       initial={{ opacity: 0 }} animate={{ opacity: 1 }}
// //     >
// //       <p style={{ color: "#c4a3ff", fontWeight: 700, fontSize: 16, textAlign: "center" }}>Gemini API Key Required</p>
// //       <p style={{ color: "rgba(200,180,255,0.6)", fontSize: 12, textAlign: "center", lineHeight: 1.6 }}>
// //         Get a free key at <span style={{ color: "#a0e8ff" }}>aistudio.google.com/apikey</span>{"\n"}(1 500 requests / day)
// //       </p>
// //       <input
// //         type="password" placeholder="AIza..." value={val}
// //         onChange={e => setVal(e.target.value)}
// //         onKeyDown={e => { if (e.key === "Enter" && val.trim()) onSave(val.trim()); }}
// //         style={{ width: "100%", maxWidth: 320, padding: "10px 14px", borderRadius: 12,
// //           background: "rgba(255,255,255,0.08)", border: "1px solid rgba(196,163,255,0.4)",
// //           color: "white", fontSize: 14, outline: "none" }}
// //       />
// //       <button
// //         onClick={() => { if (val.trim()) onSave(val.trim()); }}
// //         style={{ padding: "10px 28px", borderRadius: 24,
// //           background: "linear-gradient(135deg,#c4a3ff,#a0e8ff)",
// //           color: "#000", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}
// //       >
// //         Save & Start
// //       </button>
// //     </motion.div>
// //   );
// // };

// // // ─── Props ────────────────────────────────────────────────────────────────────
// // export interface ChatScreenProps {
// //   open: boolean;
// //   isLandscape: boolean;
// //   onClose: () => void;
// // }

// // // ─── Main ─────────────────────────────────────────────────────────────────────
// // const ChatScreen = ({ open, isLandscape, onClose }: ChatScreenProps) => {
// //   const [storedKey, setStoredKey] = useState(() => ENV_KEY || localStorage.getItem("gemini_api_key") || "");
// //   const [showApiPrompt, setShowApiPrompt] = useState(false);
// //   const [vs, setVsState] = useState<VS>("idle");
// //   const [transcript, setTranscript] = useState("");
// //   const [lastReply, setLastReply] = useState("");
// //   /** Intro video: awake plays once, then talk loops until close. */
// //   const [videoPhase, setVideoPhase] = useState<"awake" | "talk">("awake");

// //   const vsRef      = useRef<VS>("idle");
// //   const convoRef   = useRef<Msg[]>([]);
// //   const keyRef     = useRef(storedKey);
// //   const recRef     = useRef<SpeechRecognition | null>(null);
// //   const greetedRef = useRef(false);
// //   const alive      = useRef(true);
// //   const slRef      = useRef<() => void>(() => {});

// //   useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
// //   useEffect(() => { keyRef.current = storedKey; }, [storedKey]);

// //   const setVS = useCallback((s: VS) => { vsRef.current = s; setVsState(s); }, []);

// //   // ── Stop everything ─────────────────────────────────────────────────────────
// //   const stopAll = useCallback(() => {
// //     window.speechSynthesis?.cancel();
// //     try { recRef.current?.stop(); } catch { /* ignore */ }
// //     recRef.current = null;
// //   }, []);

// //   // ── TTS voice selection ─────────────────────────────────────────────────────
// //   const pickVoice = useCallback((): SpeechSynthesisVoice | null => {
// //     const voices = window.speechSynthesis.getVoices();
// //     return (
// //       voices.find(v => v.lang.startsWith("en") && /samantha|karen|moira|tessa|victoria|female/i.test(v.name)) ||
// //       voices.find(v => v.lang.startsWith("en-US")) ||
// //       voices.find(v => v.lang.startsWith("en")) ||
// //       null
// //     );
// //   }, []);

// //   // ── TTS ─────────────────────────────────────────────────────────────────────
// //   const speakText = useCallback((text: string, onEnd?: () => void) => {
// //     if (!alive.current) return;
// //     window.speechSynthesis?.cancel();
// //     const utt = new SpeechSynthesisUtterance(text);
// //     utt.lang = "en-US"; utt.rate = 0.95; utt.pitch = 1.1;
// //     const assign = () => { const v = pickVoice(); if (v) utt.voice = v; };
// //     if (window.speechSynthesis.getVoices().length > 0) assign();
// //     else window.speechSynthesis.addEventListener("voiceschanged", assign, { once: true });
// //     utt.onend   = () => { if (alive.current) onEnd?.(); };
// //     utt.onerror = () => { if (alive.current) setVS("idle"); };
// //     setVS("speaking");
// //     if (alive.current) setLastReply(text);
// //     window.speechSynthesis.speak(utt);
// //   }, [pickVoice, setVS]);

// //   // ── Gemini (multi-model fallback for retired / unavailable model IDs)
// //   const callGemini = useCallback(async (msgs: Msg[]): Promise<string> => {
// //     const key = keyRef.current;
// //     if (!key) {
// //       setShowApiPrompt(true);
// //       return "I need an API key to think properly~";
// //     }

// //     const body = {
// //       systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
// //       contents: msgs,
// //       generationConfig: { maxOutputTokens: 150, temperature: 0.9 },
// //     };

// //     let lastErr = "";
// //     for (const modelId of GEMINI_MODEL_IDS) {
// //       try {
// //         const res = await fetch(
// //           `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${key}`,
// //           {
// //             method: "POST",
// //             headers: { "Content-Type": "application/json" },
// //             body: JSON.stringify(body),
// //           }
// //         );
// //         const data = await res.json();
// //         const errMsg = data.error?.message ?? (!res.ok ? `HTTP ${res.status}` : "");
// //         if (data.error || !res.ok) {
// //           lastErr = errMsg || String(data.error ?? res.status);

// //           // Retired / unavailable model → try the next candidate.
// //           if (
// //             /not found|404|NOT_FOUND|no longer available|retired|deprecated|unsupported/i.test(lastErr)
// //           ) {
// //             console.warn(`[Gemini] model ${modelId} unavailable, trying next…`, lastErr);
// //             continue;
// //           }

// //           // Quota / auth / safety / transient server issue → stop fallback and surface once.
// //           console.error("[Gemini] API error:", lastErr);
// //           return "Hmm, the dream channel glitched — try again in a moment~";
// //         }

// //         const text = data.candidates
// //           ?.flatMap((c: { content?: { parts?: Array<{ text?: string }> } }) => c.content?.parts ?? [])
// //           ?.map((p: { text?: string }) => p.text ?? "")
// //           ?.join("")
// //           ?.trim();

// //         if (text) return text;
// //       } catch (e) {
// //         lastErr = String(e);
// //         console.warn(`[Gemini] fetch failed for ${modelId}:`, e);
// //       }
// //     }
// //     console.error("[Gemini] all models failed:", lastErr);
// //     return "Hmm, something went fuzzy — let me try again~";
// //   }, []);

// //   // ── STT ─────────────────────────────────────────────────────────────────────
// //   const startListening = useCallback(() => {
// //     if (!alive.current) return;
// //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
// //     const w = window as any;
// //     const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
// //     if (!SR) { setVS("error"); return; }

// //     try { recRef.current?.stop(); } catch { /* ignore */ }
// //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
// //     const rec: any = new SR();
// //     rec.lang = "en-US"; rec.interimResults = false; rec.continuous = false;
// //     recRef.current = rec as SpeechRecognition;
// //     let gotResult = false;

// //     rec.onstart = () => { if (alive.current) setVS("listening"); };

// //     rec.onresult = async (e: SpeechRecognitionEvent) => {
// //       if (!alive.current) return;
// //       gotResult = true;
// //       const text = e.results[0][0].transcript;
// //       setTranscript(text);
// //       setVS("thinking");
// //       const userMsg: Msg = { role: "user", parts: [{ text }] };
// //       const updated = [...convoRef.current, userMsg];
// //       convoRef.current = updated;
// //       const reply = await callGemini(updated);
// //       if (!alive.current) return;
// //       convoRef.current = [...updated, { role: "model", parts: [{ text: reply }] }];
// //       speakText(reply, () => {
// //         if (!alive.current) return;
// //         setVS("idle");
// //         setTimeout(() => { if (alive.current) slRef.current(); }, 350);
// //       });
// //     };

// //     rec.onerror = (e: SpeechRecognitionErrorEvent) => {
// //       if (!alive.current) return;
// //       if (e.error === "no-speech") {
// //         setTimeout(() => { if (alive.current) slRef.current(); }, 400);
// //       } else if (e.error === "not-allowed" || e.error === "service-not-allowed") {
// //         setVS("error");
// //       } else {
// //         setTimeout(() => { if (alive.current) slRef.current(); }, 1000);
// //       }
// //     };

// //     rec.onend = () => {
// //       if (!gotResult && alive.current && vsRef.current === "listening")
// //         setTimeout(() => { if (alive.current) slRef.current(); }, 400);
// //     };

// //     try { rec.start(); } catch { /* if already running */ }
// //   // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [callGemini, setVS, speakText]);

// //   useEffect(() => { slRef.current = startListening; }, [startListening]);

// //   // ── Mic button: interrupt TTS and start listening immediately ────────────────
// //   const handleMicPress = useCallback(() => {
// //     if (vsRef.current === "thinking") return;
// //     window.speechSynthesis?.cancel();
// //     slRef.current();
// //   }, []);

// //   const [awakeVideoFinished, setAwakeVideoFinished] = useState(false);
  
// //   // ── BUG FIX 3: Open/Close lifecycle was entirely commented out ───────────────
// //   // This is what starts the greeting sequence and voice loop when chat opens.
  

// //   useEffect(() => {
// //     if (open) {
// //       setVideoPhase("awake");
// //       setAwakeVideoFinished(false); // 确保开始时是未完成状态
// //       greetedRef.current = false;
  
// //       // 预热麦克风权限（不阻塞视频播放）
// //       navigator.mediaDevices?.getUserMedia({ audio: true })
// //         .then(stream => {
// //           stream.getTracks().forEach(t => t.stop());
// //         })
// //         .catch(() => {
// //           /* 权限拒绝由 STT 错误处理逻辑展示 */
// //         });
// //     } else {
// //       // 关闭时的彻底重置
// //       stopAll();
// //       setVS("idle");
// //       setTranscript("");
// //       setLastReply("");
// //       setVideoPhase("awake");
// //       setAwakeVideoFinished(false);
// //       convoRef.current = [];
// //       greetedRef.current = false;
// //     }
// //   }, [open, setVS, stopAll]);
  
// //   // 2. 核心：监听视频结束信号，触发语音逻辑
// //   useEffect(() => {
// //     // 只有当：窗口开启、awake视频放完（切换到了talk）、且还没打过招呼时触发
// //     if (open && videoPhase === "talk" && !greetedRef.current) {
// //       greetedRef.current = true;
  
// //       // 视频刚切到 talk 循环，给 150ms 缓冲让画面转场更平滑
// //       const timer = setTimeout(() => {
// //         if (!alive.current) return;
  
// //         speakText(GREETING_A, () => {
// //           if (!alive.current) return;
  
// //           // A 说完后停顿 250ms 再说 B
// //           setTimeout(() => {
// //             speakText(GREETING_B, () => {
// //               if (!alive.current) return;
  
// //               // 初始化对话历史（合并 A 和 B 以符合 Gemini 的轮次要求）
// //               convoRef.current = [{ role: "model", parts: [{ text: GREETING_COMBINED }] }];
// //               setVS("idle");
  
// //               // 进入循环监听模式
// //               setTimeout(() => {
// //                 if (alive.current) slRef.current();
// //               }, 350);
// //             });
// //           }, 250);
// //         });
// //       }, 150);
  
// //       return () => clearTimeout(timer);
// //     }
// //   }, [open, videoPhase, speakText, setVS]);
  
// //   // useEffect(() => {
// //   //   if (open) {
// //   //     setVideoPhase("awake");
// //   //     if (greetedRef.current) return; // already running — don't re-greet
// //   //     greetedRef.current = true;

// //   //     // Pre-warm mic permission so the browser dialog appears during the
// //   //     // entry animation, not mid-speech
// //   //     navigator.mediaDevices?.getUserMedia({ audio: true })
// //   //       .then(stream => stream.getTracks().forEach(t => t.stop()))
// //   //       .catch(() => { /* permission denied — SpeechRecognition will surface the error */ });

// //   //     // Wait for the entry spring animation (~700 ms), then greet
// //   //     setTimeout(() => {
// //   //       if (!alive.current) return;
// //   //       speakText(GREETING_A, () => {
// //   //         if (!alive.current) return;
// //   //         setTimeout(() => {
// //   //           speakText(GREETING_B, () => {
// //   //             if (!alive.current) return;
// //   //             // One model turn — Gemini requires alternating user/model (no back-to-back model).
// //   //             convoRef.current = [{ role: "model", parts: [{ text: GREETING_COMBINED }] }];
// //   //             setVS("idle");
// //   //             // Start the perpetual listen → think → speak loop
// //   //             setTimeout(() => { if (alive.current) slRef.current(); }, 350);
// //   //           });
// //   //         }, 250);
// //   //       });
// //   //     }, 700);

// //   //   } else {
// //   //     // Portrait flip or X → stop everything silently and reset
// //   //     stopAll();
// //   //     setVS("idle");
// //   //     setTranscript("");
// //   //     setLastReply("");
// //   //     setVideoPhase("awake");
// //   //     convoRef.current   = [];
// //   //     greetedRef.current = false; // allow greeting on next open
// //   //   }
// //   // // speakText, stopAll, setVS are stable — safe to omit from deps
// //   // // eslint-disable-next-line react-hooks/exhaustive-deps
// //   // }, [open]);

// //   // ── Save API key ─────────────────────────────────────────────────────────────
// //   const handleSaveKey = (key: string) => {
// //     localStorage.setItem("gemini_api_key", key);
// //     setStoredKey(key);
// //     setShowApiPrompt(false);
// //     setTimeout(() => { if (alive.current) slRef.current(); }, 300);
// //   };

// //   // ── Status label ─────────────────────────────────────────────────────────────
// //   const statusLabel =
// //     vs === "listening" ? "I'm listening…"
// //     : vs === "thinking"  ? "Let me think…"
// //     : vs === "speaking"  ? lastReply
// //     : vs === "error"     ? "Mic access denied — check browser settings"
// //     : "Tap the mic to talk";

// //   // ─── Render ──────────────────────────────────────────────────────────────────
// //   return (
// //     <AnimatePresence>
// //       {open && (
// //         <>
// //           {/* Black backdrop */}
// //           <motion.div
// //             className="fixed inset-0 z-50"
// //             style={{ background: "#000" }}
// //             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
// //             transition={{ duration: 0.25 }}
// //           />

// //           {/* Full-screen layer */}
// //           <motion.div
// //             className="fixed inset-0 z-50 overflow-hidden"
// //             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
// //             transition={{ duration: 0.25 }}
// //           >
// //             {/* ── Sparkle particles (edge-only, full perimeter) ─────────────── */}
// //             {PARTICLES.map((p) => (
// //               <motion.div
// //                 key={p.id}
// //                 className="absolute rounded-full pointer-events-none"
// //                 style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
// //                          background: p.color, boxShadow: `0 0 ${p.size * 2}px ${p.color}` }}
// //                 animate={{ opacity: [0.2, 0.85, 0.2], scale: [0.7, 1.4, 0.7] }}
// //                 transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
// //               />
// //             ))}

// //             {/* ── Sprite video: awake once → talk loops (independent of voice state) ─ */}
// //             <motion.div
// //               className="absolute"
// //               style={{
// //                 top: 0, left: 0, right: 0, bottom: 0,
// //                 display: "flex", alignItems: "center", justifyContent: "center",
// //               }}
// //               initial={{ scale: 0.88, opacity: 0 }}
// //               animate={{ scale: 1, opacity: 1 }}
// //               exit={{ scale: 0.88, opacity: 0 }}
// //               transition={{ type: "spring", stiffness: 240, damping: 20 }}
// //             >
// //               {/* <video
// //                 key={videoPhase}
// //                 src={videoPhase === "awake" ? awakeVideo : talkVideo}
// //                 autoPlay
// //                 loop={videoPhase === "talk"}
// //                 muted
// //                 playsInline
// //                 onEnded={() => {
// //                   setVideoPhase((p) => (p === "awake" ? "talk" : p));
// //                 }}
// //                 style={{
// //                   maxHeight: "100%",
// //                   maxWidth: isLandscape ? "65%" : "92%",
// //                   objectFit: "contain",
// //                   borderRadius: 20,
// //                 }}
// //               /> */}
// //               <video
// //   key={videoPhase}
// //   src={videoPhase === "awake" ? awakeVideo : talkVideo}
// //   autoPlay
// //   loop={videoPhase === "talk"}
// //   muted
// //   playsInline
// //   onEnded={() => {
// //     if (videoPhase === "awake") {
// //       setVideoPhase("talk");
// //       // 注意：这里的 setVideoPhase("talk") 会触发上面的第二个 useEffect
// //     }
// //   }}
// //   style={{
// //     maxHeight: "100%",
// //     maxWidth: isLandscape ? "65%" : "92%",
// //     objectFit: "contain",
// //     borderRadius: 20,
// //   }}
// // />
// //             </motion.div>

// //             {/* ── Voice panel (bottom overlay) ─────────────────────────────── */}
// //             <motion.div
// //               className="absolute bottom-0 left-0 right-0"
// //               style={{
// //                 display: "flex",
// //                 alignItems: "center",
// //                 justifyContent: "space-between",
// //                 gap: 12,
// //                 padding: "14px 24px",
// //                 paddingBottom: "max(14px, env(safe-area-inset-bottom))",
// //                 background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 100%)",
// //               }}
// //               initial={{ opacity: 0, y: 20 }}
// //               animate={{ opacity: 1, y: 0 }}
// //               exit={{ opacity: 0, y: 20 }}
// //               transition={{ delay: 0.2, duration: 0.3 }}
// //             >
// //               {/* Status / waveform / dots */}
// //               <div style={{ flex: 1, minHeight: 28, display: "flex", alignItems: "center" }}>
// //                 {vs === "listening" && <Waveform />}
// //                 {vs === "thinking"  && <ThinkingDots />}
// //                 {(vs === "idle" || vs === "speaking" || vs === "error") && (
// //                   <motion.p
// //                     key={statusLabel}
// //                     initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
// //                     style={{
// //                       color: vs === "error" ? "#ff8080" : "rgba(210,190,255,0.85)",
// //                       fontSize: 13, fontWeight: 500, lineHeight: 1.5, maxWidth: 260,
// //                     }}
// //                   >
// //                     {statusLabel}
// //                   </motion.p>
// //                 )}
// //               </div>

// //               {/* User transcript (italic, smaller) */}
// //               <AnimatePresence>
// //                 {transcript && vs !== "idle" && (
// //                   <motion.p
// //                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
// //                     style={{ color: "rgba(160,232,255,0.55)", fontSize: 11, fontStyle: "italic",
// //                              maxWidth: 180, textAlign: "right" }}
// //                   >
// //                     "{transcript}"
// //                   </motion.p>
// //                 )}
// //               </AnimatePresence>

// //               {/* Mic button */}
// //               <motion.button
// //                 onClick={vs === "thinking" ? undefined : handleMicPress}
// //                 whileTap={vs !== "thinking" ? { scale: 0.85 } : {}}
// //                 style={{
// //                   flexShrink: 0,
// //                   width: 56, height: 56, borderRadius: "50%",
// //                   background: vs === "listening"
// //                     ? "linear-gradient(135deg,#c4a3ff,#a0e8ff)"
// //                     : "rgba(255,255,255,0.1)",
// //                   border: "2px solid rgba(196,163,255,0.45)",
// //                   display: "flex", alignItems: "center", justifyContent: "center",
// //                   cursor: vs === "thinking" ? "default" : "pointer",
// //                 }}
// //                 animate={vs === "listening"
// //                   ? { boxShadow: ["0 0 0 0 rgba(196,163,255,0.6)", "0 0 0 14px rgba(196,163,255,0)"] }
// //                   : { boxShadow: "0 0 0 0 rgba(196,163,255,0)" }
// //                 }
// //                 transition={{ duration: 1.1, repeat: vs === "listening" ? Infinity : 0 }}
// //                 aria-label={vs === "listening" ? "Listening" : "Tap to talk"}
// //               >
// //                 {vs === "listening"
// //                   ? <Mic    size={22} color="#000"                    strokeWidth={2.5} />
// //                   : <MicOff size={20} color="rgba(200,180,255,0.75)" strokeWidth={2}   />
// //                 }
// //               </motion.button>
// //             </motion.div>

// //             {/* ── Top-right controls ───────────────────────────────────────── */}
// //             <div
// //               style={{
// //                 position: "absolute",
// //                 top: "max(14px, env(safe-area-inset-top))",
// //                 right: "max(14px, env(safe-area-inset-right))",
// //                 display: "flex", gap: 8, zIndex: 10,
// //               }}
// //             >
// //               {/* API key settings */}
// //               <motion.button
// //                 onClick={() => setShowApiPrompt(true)}
// //                 whileTap={{ scale: 0.82 }}
// //                 style={{
// //                   width: 34, height: 34, borderRadius: "50%",
// //                   background: "rgba(255,255,255,0.07)",
// //                   border: "1px solid rgba(255,255,255,0.12)",
// //                   display: "flex", alignItems: "center", justifyContent: "center",
// //                   cursor: "pointer",
// //                 }}
// //                 aria-label="API key settings"
// //               >
// //                 <Settings size={14} color="rgba(255,255,255,0.45)" />
// //               </motion.button>

// //               {/* Close */}
// //               <motion.button
// //                 onClick={onClose}
// //                 whileTap={{ scale: 0.82 }}
// //                 initial={{ scale: 0.5, opacity: 0 }}
// //                 animate={{ scale: 1, opacity: 1 }}
// //                 exit={{ scale: 0.5, opacity: 0 }}
// //                 transition={{ delay: 0.18, type: "spring", stiffness: 360, damping: 22 }}
// //                 style={{
// //                   width: 34, height: 34, borderRadius: "50%",
// //                   background: "rgba(255,255,255,0.1)",
// //                   border: "1px solid rgba(255,255,255,0.18)",
// //                   display: "flex", alignItems: "center", justifyContent: "center",
// //                   cursor: "pointer", backdropFilter: "blur(8px)",
// //                 }}
// //                 aria-label="Close"
// //               >
// //                 <X size={16} color="rgba(255,255,255,0.85)" strokeWidth={2.5} />
// //               </motion.button>
// //             </div>

// //             {/* API key prompt */}
// //             {showApiPrompt && <ApiKeyPrompt onSave={handleSaveKey} />}
// //           </motion.div>
// //         </>
// //       )}
// //     </AnimatePresence>
// //   );
// // };

// // export default ChatScreen;


// /**
//  * ChatScreen – full-viewport voice-chat overlay.
//  *
//  * Video (landscape open):
//  *   1. awake1.mp4 plays once (no loop)
//  *   2. onEnded → tallk1.mp4 loops for the rest of the session
//  *
//  * Voice loop:
//  *   open → TTS GREETING_A → TTS GREETING_B
//  *   → listen → user → Gemini → TTS reply → listen → …
//  *
//  * Gemini notes:
//  *   - Model IDs change; we try several known v1beta IDs (404 fallback).
//  *   - Contents must strictly alternate user/model — never two model turns in a row.
//  *
//  * Cross-platform mic fix:
//  *   - iOS Safari requires SpeechRecognition.start() inside a direct user-gesture
//  *     handler. Auto-starting from setTimeout (after TTS) triggers "not-allowed".
//  *     Fix: on iOS we never auto-restart; the user taps the mic button each turn.
//  *   - Android / desktop: we pre-warm getUserMedia in the mic-button handler so the
//  *     permission dialog appears before SpeechRecognition tries to open the device.
//  */

// import { AnimatePresence, motion } from "framer-motion";
// import { Mic, MicOff, Settings, X } from "lucide-react";
// import { useCallback, useEffect, useRef, useState } from "react";

// import awakeVideo from "@/assets/sprites/awake1.mp4";
// import talkVideo  from "@/assets/sprites/tallk1.mp4";

// // ─── Types ────────────────────────────────────────────────────────────────────
// type VS = "idle" | "listening" | "thinking" | "speaking" | "error";
// interface Msg { role: "user" | "model"; parts: [{ text: string }]; }

// // ─── Constants ────────────────────────────────────────────────────────────────
// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// const ENV_KEY: string = (import.meta as any).env?.VITE_GEMINI_API_KEY ?? "";

// const SYSTEM_PROMPT = `You are Lulu, an adorable cozy bedtime sprite.
// - Speak ONLY in English.
// - Keep every reply to 2-3 short sentences — warm, gentle, playful.
// - Help with: calming bedtime blogs, breathing exercises, sleep tips, outfit ideas.
// - You ARE Lulu — never break character.`;

// const GREETING_A = "Ah~ it feels so good to have a body back!";
// const GREETING_B = "Would you like a bedtime story, some meditation, or shall we plan tomorrow's outfit?";

// /** Single model turn for Gemini (API forbids two consecutive `model` messages). */
// const GREETING_COMBINED = `${GREETING_A}\n\n${GREETING_B}`;

// /**
//  * Prefer currently supported models first.
//  */
// const GEMINI_MODEL_IDS = [
//   "gemini-2.5-flash",
//   "gemini-2.5-flash-lite",
//   "gemini-3-flash-preview",
//   "gemini-3.1-flash-lite-preview",
// ] as const;

// // ─── Platform helpers ─────────────────────────────────────────────────────────
// /**
//  * Returns true on iOS (iPhone / iPad / iPod) regardless of which browser.
//  * Also catches iPad pretending to be macOS (navigator.platform === "MacIntel"
//  * but with touch points).
//  */
// const isIOS = (): boolean =>
//   /ipad|iphone|ipod/i.test(navigator.userAgent) ||
//   (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

// /** Any mobile device — used for tighter permission UX. */
// const isMobile = (): boolean =>
//   isIOS() || /android/i.test(navigator.userAgent);

// // Particles — generated once, stable across renders
// const PALETTE = ["#e8b4ff", "#c4a3ff", "#a0e8ff", "#ffe0a0", "#ffb4d0", "#b4ffe8"];
// const PARTICLES = Array.from({ length: 28 }, (_, i) => {
//   const edge = i % 4;
//   const rnd  = Math.random();
//   const x = edge === 0 ? rnd * 100 : edge === 1 ? 82 + rnd * 18 : edge === 2 ? rnd * 100 : rnd * 18;
//   const y = edge === 0 ? rnd * 16  : edge === 1 ? rnd * 100     : edge === 2 ? 84 + rnd * 16 : rnd * 100;
//   return { id: i, x, y, size: 2 + Math.random() * 5, dur: 3 + Math.random() * 4, delay: Math.random() * 3, color: PALETTE[i % PALETTE.length] };
// });

// // ─── Sub-components ───────────────────────────────────────────────────────────
// const Waveform = () => (
//   <div className="flex items-center gap-[3px]" style={{ height: 26 }}>
//     {[0.4, 0.7, 1, 0.8, 0.5, 0.9, 0.6, 1, 0.7, 0.45].map((h, i) => (
//       <motion.div
//         key={i}
//         style={{ width: 3, borderRadius: 2, background: "linear-gradient(to top,#c4a3ff,#a0e8ff)" }}
//         animate={{ height: [h * 9, h * 22, h * 7, h * 18, h * 9] }}
//         transition={{ duration: 0.85 + i * 0.06, repeat: Infinity, ease: "easeInOut", delay: i * 0.06 }}
//       />
//     ))}
//   </div>
// );

// const ThinkingDots = () => (
//   <div className="flex gap-2 items-center">
//     {[0, 1, 2].map((i) => (
//       <motion.div
//         key={i}
//         style={{ width: 7, height: 7, borderRadius: "50%", background: "#c4a3ff" }}
//         animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
//         transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
//       />
//     ))}
//   </div>
// );

// const ApiKeyPrompt = ({ onSave }: { onSave: (k: string) => void }) => {
//   const [val, setVal] = useState("");
//   return (
//     <motion.div
//       className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 px-8"
//       style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(6px)" }}
//       initial={{ opacity: 0 }} animate={{ opacity: 1 }}
//     >
//       <p style={{ color: "#c4a3ff", fontWeight: 700, fontSize: 16, textAlign: "center" }}>Gemini API Key Required</p>
//       <p style={{ color: "rgba(200,180,255,0.6)", fontSize: 12, textAlign: "center", lineHeight: 1.6 }}>
//         Get a free key at <span style={{ color: "#a0e8ff" }}>aistudio.google.com/apikey</span>{"\n"}(1 500 requests / day)
//       </p>
//       <input
//         type="password" placeholder="AIza..." value={val}
//         onChange={e => setVal(e.target.value)}
//         onKeyDown={e => { if (e.key === "Enter" && val.trim()) onSave(val.trim()); }}
//         style={{ width: "100%", maxWidth: 320, padding: "10px 14px", borderRadius: 12,
//           background: "rgba(255,255,255,0.08)", border: "1px solid rgba(196,163,255,0.4)",
//           color: "white", fontSize: 14, outline: "none" }}
//       />
//       <button
//         onClick={() => { if (val.trim()) onSave(val.trim()); }}
//         style={{ padding: "10px 28px", borderRadius: 24,
//           background: "linear-gradient(135deg,#c4a3ff,#a0e8ff)",
//           color: "#000", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}
//       >
//         Save & Start
//       </button>
//     </motion.div>
//   );
// };

// // ─── Props ────────────────────────────────────────────────────────────────────
// export interface ChatScreenProps {
//   open: boolean;
//   isLandscape: boolean;
//   onClose: () => void;
// }

// // ─── Main ─────────────────────────────────────────────────────────────────────
// const ChatScreen = ({ open, isLandscape, onClose }: ChatScreenProps) => {
//   const [storedKey, setStoredKey] = useState(() => ENV_KEY || localStorage.getItem("gemini_api_key") || "");
//   const [showApiPrompt, setShowApiPrompt] = useState(false);
//   const [vs, setVsState] = useState<VS>("idle");
//   const [transcript, setTranscript] = useState("");
//   const [lastReply, setLastReply] = useState("");
//   const [errorMsg, setErrorMsg] = useState("");
//   /** Intro video: awake plays once, then talk loops until close. */
//   const [videoPhase, setVideoPhase] = useState<"awake" | "talk">("awake");

//   const vsRef      = useRef<VS>("idle");
//   const convoRef   = useRef<Msg[]>([]);
//   const keyRef     = useRef(storedKey);
//   const recRef     = useRef<SpeechRecognition | null>(null);
//   const greetedRef = useRef(false);
//   const alive      = useRef(true);
//   const slRef      = useRef<() => void>(() => {});
//   /**
//    * Tracks whether getUserMedia has already succeeded this session.
//    * Avoids redundant permission dialogs on Android.
//    */
//   const micUnlockedRef = useRef(false);

//   useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
//   useEffect(() => { keyRef.current = storedKey; }, [storedKey]);

//   const setVS = useCallback((s: VS) => { vsRef.current = s; setVsState(s); }, []);

//   // ── Stop everything ─────────────────────────────────────────────────────────
//   const stopAll = useCallback(() => {
//     window.speechSynthesis?.cancel();
//     try { recRef.current?.stop(); } catch { /* ignore */ }
//     recRef.current = null;
//   }, []);

//   // ── TTS voice selection ─────────────────────────────────────────────────────
//   const pickVoice = useCallback((): SpeechSynthesisVoice | null => {
//     const voices = window.speechSynthesis.getVoices();
//     return (
//       voices.find(v => v.lang.startsWith("en") && /samantha|karen|moira|tessa|victoria|female/i.test(v.name)) ||
//       voices.find(v => v.lang.startsWith("en-US")) ||
//       voices.find(v => v.lang.startsWith("en")) ||
//       null
//     );
//   }, []);

//   // ── TTS ─────────────────────────────────────────────────────────────────────
//   const speakText = useCallback((text: string, onEnd?: () => void) => {
//     if (!alive.current) return;
//     window.speechSynthesis?.cancel();
//     const utt = new SpeechSynthesisUtterance(text);
//     utt.lang = "en-US"; utt.rate = 0.95; utt.pitch = 1.1;
//     const assign = () => { const v = pickVoice(); if (v) utt.voice = v; };
//     if (window.speechSynthesis.getVoices().length > 0) assign();
//     else window.speechSynthesis.addEventListener("voiceschanged", assign, { once: true });
//     utt.onend   = () => { if (alive.current) onEnd?.(); };
//     utt.onerror = () => { if (alive.current) setVS("idle"); };
//     setVS("speaking");
//     if (alive.current) setLastReply(text);
//     window.speechSynthesis.speak(utt);
//   }, [pickVoice, setVS]);

//   // ── Gemini (multi-model fallback for retired / unavailable model IDs)
//   const callGemini = useCallback(async (msgs: Msg[]): Promise<string> => {
//     const key = keyRef.current;
//     if (!key) {
//       setShowApiPrompt(true);
//       return "I need an API key to think properly~";
//     }

//     const body = {
//       systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
//       contents: msgs,
//       generationConfig: { maxOutputTokens: 150, temperature: 0.9 },
//     };

//     let lastErr = "";
//     for (const modelId of GEMINI_MODEL_IDS) {
//       try {
//         const res = await fetch(
//           `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${key}`,
//           {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(body),
//           }
//         );
//         const data = await res.json();
//         const errMsg = data.error?.message ?? (!res.ok ? `HTTP ${res.status}` : "");
//         if (data.error || !res.ok) {
//           lastErr = errMsg || String(data.error ?? res.status);

//           // Retired / unavailable model → try the next candidate.
//           if (
//             /not found|404|NOT_FOUND|no longer available|retired|deprecated|unsupported/i.test(lastErr)
//           ) {
//             console.warn(`[Gemini] model ${modelId} unavailable, trying next…`, lastErr);
//             continue;
//           }

//           // Quota / auth / safety / transient server issue → stop fallback and surface once.
//           console.error("[Gemini] API error:", lastErr);
//           return "Hmm, the dream channel glitched — try again in a moment~";
//         }

//         const text = data.candidates
//           ?.flatMap((c: { content?: { parts?: Array<{ text?: string }> } }) => c.content?.parts ?? [])
//           ?.map((p: { text?: string }) => p.text ?? "")
//           ?.join("")
//           ?.trim();

//         if (text) return text;
//       } catch (e) {
//         lastErr = String(e);
//         console.warn(`[Gemini] fetch failed for ${modelId}:`, e);
//       }
//     }
//     console.error("[Gemini] all models failed:", lastErr);
//     return "Hmm, something went fuzzy — let me try again~";
//   }, []);

//   // ── Request mic permission via getUserMedia ──────────────────────────────────
//   /**
//    * On mobile, explicitly calling getUserMedia() before SpeechRecognition.start()
//    * ensures the system-level permission has been granted and the audio device is
//    * "unlocked".  We stop the tracks immediately — we only need the permission.
//    *
//    * Returns true if permission was granted (or was already granted), false if denied.
//    */
//   const requestMicPermission = useCallback(async (): Promise<boolean> => {
//     if (micUnlockedRef.current) return true;
//     if (!navigator.mediaDevices?.getUserMedia) return true; // fallback — let SR handle it
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       stream.getTracks().forEach(t => t.stop());
//       micUnlockedRef.current = true;
//       return true;
//     } catch (err: unknown) {
//       const name = (err as DOMException)?.name ?? "";
//       if (name === "NotAllowedError" || name === "PermissionDeniedError") {
//         return false; // user explicitly denied
//       }
//       // Other errors (NotFoundError, etc.) — still let SpeechRecognition try
//       return true;
//     }
//   }, []);

//   // ── STT ─────────────────────────────────────────────────────────────────────
//   /**
//    * startListening — wraps SpeechRecognition with cross-platform fixes.
//    *
//    * ⚠️  iOS rule: this function MUST be called synchronously from a user-gesture
//    * handler (i.e. a click/tap callback) OR from within a SpeechRecognition event
//    * handler (onend/onerror).  setTimeout-based auto-restart does NOT count as a
//    * user gesture on iOS and will produce a "not-allowed" error.
//    *
//    * Solution: `autoRestart` is only set to true on non-iOS browsers.
//    */
//   const startListening = useCallback((autoRestart = false) => {
//     if (!alive.current) return;
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const w = window as any;
//     const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
//     if (!SR) {
//       setErrorMsg("Speech recognition is not supported in this browser.");
//       setVS("error");
//       return;
//     }

//     try { recRef.current?.stop(); } catch { /* ignore */ }
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const rec: any = new SR();
//     rec.lang = "en-US"; rec.interimResults = false; rec.continuous = false;
//     recRef.current = rec as SpeechRecognition;
//     let gotResult = false;

//     rec.onstart = () => { if (alive.current) setVS("listening"); };

//     rec.onresult = async (e: SpeechRecognitionEvent) => {
//       if (!alive.current) return;
//       gotResult = true;
//       const text = e.results[0][0].transcript;
//       setTranscript(text);
//       setVS("thinking");
//       const userMsg: Msg = { role: "user", parts: [{ text }] };
//       const updated = [...convoRef.current, userMsg];
//       convoRef.current = updated;
//       const reply = await callGemini(updated);
//       if (!alive.current) return;
//       convoRef.current = [...updated, { role: "model", parts: [{ text: reply }] }];
//       speakText(reply, () => {
//         if (!alive.current) return;
//         setVS("idle");
//         // Auto-restart the listen loop — but only on non-iOS platforms.
//         // On iOS the user must tap the mic button (gesture requirement).
//         if (autoRestart && !isIOS()) {
//           setTimeout(() => { if (alive.current) slRef.current(); }, 350);
//         }
//       });
//     };

//     rec.onerror = (e: SpeechRecognitionErrorEvent) => {
//       if (!alive.current) return;
//       console.warn("[STT] error:", e.error);

//       if (e.error === "no-speech") {
//         // Nothing was said — restart silently if allowed.
//         if (autoRestart && !isIOS()) {
//           setTimeout(() => { if (alive.current) slRef.current(); }, 400);
//         } else {
//           setVS("idle");
//         }
//         return;
//       }

//       if (e.error === "not-allowed" || e.error === "service-not-allowed") {
//         // iOS fires this when start() is not in a user-gesture context.
//         // Show a friendly, actionable message instead of the generic one.
//         if (isIOS()) {
//           setErrorMsg("Tap the mic button to speak — iOS requires a tap each time.");
//         } else {
//           setErrorMsg("Mic access denied. Please allow microphone in your browser settings.");
//         }
//         setVS("error");
//         return;
//       }

//       if (e.error === "network") {
//         setErrorMsg("Network error — check your connection and try again.");
//         setVS("error");
//         return;
//       }

//       // Other transient errors — retry if auto-restart is allowed.
//       if (autoRestart && !isIOS()) {
//         setTimeout(() => { if (alive.current) slRef.current(); }, 1000);
//       } else {
//         setVS("idle");
//       }
//     };

//     rec.onend = () => {
//       if (!gotResult && alive.current && vsRef.current === "listening") {
//         if (autoRestart && !isIOS()) {
//           setTimeout(() => { if (alive.current) slRef.current(); }, 400);
//         } else {
//           setVS("idle");
//         }
//       }
//     };

//     try { rec.start(); } catch { /* if already running */ }
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [callGemini, setVS, speakText]);

//   useEffect(() => { slRef.current = () => startListening(true); }, [startListening]);

//   // ── Mic button ───────────────────────────────────────────────────────────────
//   /**
//    * Called from a user tap — always a valid gesture context on every platform.
//    *
//    * We call getUserMedia() first so that:
//    *  1. On Android/desktop: the permission dialog (if not yet granted) appears
//    *     synchronously before SpeechRecognition.start().
//    *  2. On iOS: the audio session is activated, reducing SR "not-allowed" races.
//    *
//    * Note: on iOS we pass autoRestart=false so the loop stops after each reply
//    * and the user must tap again — this keeps every .start() inside a gesture.
//    */
//   const handleMicPress = useCallback(async () => {
//     if (vsRef.current === "thinking") return;

//     // Stop any ongoing TTS / recognition first.
//     window.speechSynthesis?.cancel();
//     try { recRef.current?.stop(); } catch { /* ignore */ }

//     // Clear any previous error state.
//     setErrorMsg("");
//     setVS("idle");

//     // On mobile, request permission explicitly inside this gesture handler.
//     if (isMobile()) {
//       const granted = await requestMicPermission();
//       if (!granted) {
//         setErrorMsg("Mic access denied. Please allow microphone in your browser settings, then tap again.");
//         setVS("error");
//         return;
//       }
//     }

//     // On iOS: no auto-restart (each turn must be manually triggered).
//     // On other platforms: auto-restart for hands-free loop.
//     startListening(!isIOS());
//   }, [requestMicPermission, startListening, setVS]);

//   const [awakeVideoFinished, setAwakeVideoFinished] = useState(false);

//   // ── Open/close lifecycle ─────────────────────────────────────────────────────
//   useEffect(() => {
//     if (open) {
//       setVideoPhase("awake");
//       setAwakeVideoFinished(false);
//       greetedRef.current = false;
//       micUnlockedRef.current = false;
//       setErrorMsg("");

//       // Pre-warm mic permission on non-iOS platforms.
//       // On iOS we skip this because getUserMedia() outside a gesture is unreliable.
//       if (!isIOS()) {
//         navigator.mediaDevices?.getUserMedia({ audio: true })
//           .then(stream => {
//             stream.getTracks().forEach(t => t.stop());
//             micUnlockedRef.current = true;
//           })
//           .catch(() => { /* permission denied — handled later */ });
//       }
//     } else {
//       stopAll();
//       setVS("idle");
//       setTranscript("");
//       setLastReply("");
//       setErrorMsg("");
//       setVideoPhase("awake");
//       setAwakeVideoFinished(false);
//       convoRef.current = [];
//       greetedRef.current = false;
//       micUnlockedRef.current = false;
//     }
//   }, [open, setVS, stopAll]);

//   // ── Greeting sequence — fires once when awake video finishes ────────────────
//   useEffect(() => {
//     if (open && videoPhase === "talk" && !greetedRef.current) {
//       greetedRef.current = true;

//       const timer = setTimeout(() => {
//         if (!alive.current) return;

//         speakText(GREETING_A, () => {
//           if (!alive.current) return;

//           setTimeout(() => {
//             speakText(GREETING_B, () => {
//               if (!alive.current) return;

//               convoRef.current = [{ role: "model", parts: [{ text: GREETING_COMBINED }] }];
//               setVS("idle");

//               // Auto-start listen loop only on non-iOS (iOS needs user tap).
//               if (!isIOS()) {
//                 setTimeout(() => { if (alive.current) slRef.current(); }, 350);
//               }
//             });
//           }, 250);
//         });
//       }, 150);

//       return () => clearTimeout(timer);
//     }
//   }, [open, videoPhase, speakText, setVS]);

//   // ── Save API key ─────────────────────────────────────────────────────────────
//   const handleSaveKey = (key: string) => {
//     localStorage.setItem("gemini_api_key", key);
//     setStoredKey(key);
//     setShowApiPrompt(false);
//     if (!isIOS()) {
//       setTimeout(() => { if (alive.current) slRef.current(); }, 300);
//     }
//   };

//   // ── Status label ─────────────────────────────────────────────────────────────
//   const statusLabel =
//     vs === "listening" ? "I'm listening…"
//     : vs === "thinking"  ? "Let me think…"
//     : vs === "speaking"  ? lastReply
//     : vs === "error"     ? (errorMsg || "Mic access denied — check browser settings")
//     : "Tap the mic to talk";

//   // ─── Render ──────────────────────────────────────────────────────────────────
//   return (
//     <AnimatePresence>
//       {open && (
//         <>
//           {/* Black backdrop */}
//           <motion.div
//             className="fixed inset-0 z-50"
//             style={{ background: "#000" }}
//             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//             transition={{ duration: 0.25 }}
//           />

//           {/* Full-screen layer */}
//           <motion.div
//             className="fixed inset-0 z-50 overflow-hidden"
//             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//             transition={{ duration: 0.25 }}
//           >
//             {/* ── Sparkle particles (edge-only, full perimeter) ─────────────── */}
//             {PARTICLES.map((p) => (
//               <motion.div
//                 key={p.id}
//                 className="absolute rounded-full pointer-events-none"
//                 style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
//                          background: p.color, boxShadow: `0 0 ${p.size * 2}px ${p.color}` }}
//                 animate={{ opacity: [0.2, 0.85, 0.2], scale: [0.7, 1.4, 0.7] }}
//                 transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
//               />
//             ))}

//             {/* ── Sprite video: awake once → talk loops ────────────────────── */}
//             <motion.div
//               className="absolute"
//               style={{
//                 top: 0, left: 0, right: 0, bottom: 0,
//                 display: "flex", alignItems: "center", justifyContent: "center",
//               }}
//               initial={{ scale: 0.88, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               exit={{ scale: 0.88, opacity: 0 }}
//               transition={{ type: "spring", stiffness: 240, damping: 20 }}
//             >
//               <video
//                 key={videoPhase}
//                 src={videoPhase === "awake" ? awakeVideo : talkVideo}
//                 autoPlay
//                 loop={videoPhase === "talk"}
//                 muted
//                 playsInline
//                 onEnded={() => {
//                   if (videoPhase === "awake") {
//                     setVideoPhase("talk");
//                   }
//                 }}
//                 style={{
//                   maxHeight: "100%",
//                   maxWidth: isLandscape ? "65%" : "92%",
//                   objectFit: "contain",
//                   borderRadius: 20,
//                 }}
//               />
//             </motion.div>

//             {/* ── Voice panel (bottom overlay) ─────────────────────────────── */}
//             <motion.div
//               className="absolute bottom-0 left-0 right-0"
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 gap: 12,
//                 padding: "14px 24px",
//                 paddingBottom: "max(14px, env(safe-area-inset-bottom))",
//                 background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 100%)",
//               }}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: 20 }}
//               transition={{ delay: 0.2, duration: 0.3 }}
//             >
//               {/* Status / waveform / dots */}
//               <div style={{ flex: 1, minHeight: 28, display: "flex", alignItems: "center" }}>
//                 {vs === "listening" && <Waveform />}
//                 {vs === "thinking"  && <ThinkingDots />}
//                 {(vs === "idle" || vs === "speaking" || vs === "error") && (
//                   <motion.p
//                     key={statusLabel}
//                     initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
//                     style={{
//                       color: vs === "error" ? "#ff8080" : "rgba(210,190,255,0.85)",
//                       fontSize: 13, fontWeight: 500, lineHeight: 1.5, maxWidth: 260,
//                     }}
//                   >
//                     {statusLabel}
//                   </motion.p>
//                 )}
//               </div>

//               {/* User transcript (italic, smaller) */}
//               <AnimatePresence>
//                 {transcript && vs !== "idle" && (
//                   <motion.p
//                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//                     style={{ color: "rgba(160,232,255,0.55)", fontSize: 11, fontStyle: "italic",
//                              maxWidth: 180, textAlign: "right" }}
//                   >
//                     "{transcript}"
//                   </motion.p>
//                 )}
//               </AnimatePresence>

//               {/* Mic button */}
//               <motion.button
//                 onClick={vs === "thinking" ? undefined : handleMicPress}
//                 whileTap={vs !== "thinking" ? { scale: 0.85 } : {}}
//                 style={{
//                   flexShrink: 0,
//                   width: 56, height: 56, borderRadius: "50%",
//                   background: vs === "listening"
//                     ? "linear-gradient(135deg,#c4a3ff,#a0e8ff)"
//                     : "rgba(255,255,255,0.1)",
//                   border: "2px solid rgba(196,163,255,0.45)",
//                   display: "flex", alignItems: "center", justifyContent: "center",
//                   cursor: vs === "thinking" ? "default" : "pointer",
//                 }}
//                 animate={vs === "listening"
//                   ? { boxShadow: ["0 0 0 0 rgba(196,163,255,0.6)", "0 0 0 14px rgba(196,163,255,0)"] }
//                   : { boxShadow: "0 0 0 0 rgba(196,163,255,0)" }
//                 }
//                 transition={{ duration: 1.1, repeat: vs === "listening" ? Infinity : 0 }}
//                 aria-label={vs === "listening" ? "Listening" : "Tap to talk"}
//               >
//                 {vs === "listening"
//                   ? <Mic    size={22} color="#000"                    strokeWidth={2.5} />
//                   : <MicOff size={20} color="rgba(200,180,255,0.75)" strokeWidth={2}   />
//                 }
//               </motion.button>
//             </motion.div>

//             {/* ── Top-right controls ───────────────────────────────────────── */}
//             <div
//               style={{
//                 position: "absolute",
//                 top: "max(14px, env(safe-area-inset-top))",
//                 right: "max(14px, env(safe-area-inset-right))",
//                 display: "flex", gap: 8, zIndex: 10,
//               }}
//             >
//               {/* API key settings */}
//               <motion.button
//                 onClick={() => setShowApiPrompt(true)}
//                 whileTap={{ scale: 0.82 }}
//                 style={{
//                   width: 34, height: 34, borderRadius: "50%",
//                   background: "rgba(255,255,255,0.07)",
//                   border: "1px solid rgba(255,255,255,0.12)",
//                   display: "flex", alignItems: "center", justifyContent: "center",
//                   cursor: "pointer",
//                 }}
//                 aria-label="API key settings"
//               >
//                 <Settings size={14} color="rgba(255,255,255,0.45)" />
//               </motion.button>

//               {/* Close */}
//               <motion.button
//                 onClick={onClose}
//                 whileTap={{ scale: 0.82 }}
//                 initial={{ scale: 0.5, opacity: 0 }}
//                 animate={{ scale: 1, opacity: 1 }}
//                 exit={{ scale: 0.5, opacity: 0 }}
//                 transition={{ delay: 0.18, type: "spring", stiffness: 360, damping: 22 }}
//                 style={{
//                   width: 34, height: 34, borderRadius: "50%",
//                   background: "rgba(255,255,255,0.1)",
//                   border: "1px solid rgba(255,255,255,0.18)",
//                   display: "flex", alignItems: "center", justifyContent: "center",
//                   cursor: "pointer", backdropFilter: "blur(8px)",
//                 }}
//                 aria-label="Close"
//               >
//                 <X size={16} color="rgba(255,255,255,0.85)" strokeWidth={2.5} />
//               </motion.button>
//             </div>

//             {/* API key prompt */}
//             {showApiPrompt && <ApiKeyPrompt onSave={handleSaveKey} />}
//           </motion.div>
//         </>
//       )}
//     </AnimatePresence>
//   );
// };

// export default ChatScreen;


import { AnimatePresence, motion } from "framer-motion";
import { Mic, MicOff, Settings, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import awakeVideo from "@/assets/sprites/awake1.mp4";
import talkVideo from "@/assets/sprites/tallk1.mp4";

type VS = "idle" | "listening" | "thinking" | "speaking" | "error";

type MsgPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

interface Msg {
  role: "user" | "model";
  parts: MsgPart[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ENV_KEY: string = (import.meta as any).env?.VITE_GEMINI_API_KEY ?? "";
const MAX_HISTORY_MSGS = 12;
const TARGET_SAMPLE_RATE = 16000;

const SYSTEM_PROMPT = `You are Lulu, an adorable cozy bedtime sprite.
- Speak ONLY in English.
- Keep every reply to 2-3 short sentences — warm, gentle, playful.
- Help with: calming bedtime blogs, breathing exercises, sleep tips, outfit ideas.
- You ARE Lulu — never break character.`;

const GREETING_A = "Ah~ it feels so good to have a body back!";
const GREETING_B = "Would you like a bedtime story, some meditation, or shall we plan tomorrow's outfit?";
const GREETING_COMBINED = `${GREETING_A}\n\n${GREETING_B}`;

const GEMINI_MODEL_IDS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite-preview",
] as const;

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

const Waveform = () => (
  <div className="flex items-center gap-[3px]" style={{ height: 26 }}>
    {[0.4, 0.7, 1, 0.8, 0.5, 0.9, 0.6, 1, 0.7, 0.45].map((h, i) => (
      <motion.div
        key={i}
        style={{ width: 3, borderRadius: 2, background: "linear-gradient(to top,#c4a3ff,#a0e8ff)" }}
        animate={{ height: [h * 9, h * 22, h * 7, h * 18, h * 9] }}
        transition={{ duration: 0.85 + i * 0.06, repeat: Infinity, ease: "easeInOut", delay: i * 0.06 }}
      />
    ))}
  </div>
);

const ThinkingDots = () => (
  <div className="flex gap-2 items-center">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        style={{ width: 7, height: 7, borderRadius: "50%", background: "#c4a3ff" }}
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
      />
    ))}
  </div>
);

const ApiKeyPrompt = ({ onSave }: { onSave: (k: string) => void }) => {
  const [val, setVal] = useState("");
  return (
    <motion.div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 px-8"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(6px)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <p style={{ color: "#c4a3ff", fontWeight: 700, fontSize: 16, textAlign: "center" }}>Gemini API Key Required</p>
      <p style={{ color: "rgba(200,180,255,0.6)", fontSize: 12, textAlign: "center", lineHeight: 1.6 }}>
        Get a free key at <span style={{ color: "#a0e8ff" }}>aistudio.google.com/apikey</span>
      </p>
      <input
        type="password"
        placeholder="AIza..."
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && val.trim()) onSave(val.trim());
        }}
        style={{
          width: "100%",
          maxWidth: 320,
          padding: "10px 14px",
          borderRadius: 12,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(196,163,255,0.4)",
          color: "white",
          fontSize: 14,
          outline: "none",
        }}
      />
      <button
        onClick={() => {
          if (val.trim()) onSave(val.trim());
        }}
        style={{
          padding: "10px 28px",
          borderRadius: 24,
          background: "linear-gradient(135deg,#c4a3ff,#a0e8ff)",
          color: "#000",
          fontWeight: 700,
          fontSize: 14,
          border: "none",
          cursor: "pointer",
        }}
      >
        Save & Start
      </button>
    </motion.div>
  );
};

export interface ChatScreenProps {
  open: boolean;
  isLandscape: boolean;
  onClose: () => void;
}

const mergeFloat32 = (chunks: Float32Array[]): Float32Array => {
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Float32Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
};

const downsampleBuffer = (buffer: Float32Array, inputRate: number, outputRate: number): Float32Array => {
  if (outputRate >= inputRate) return buffer;

  const ratio = inputRate / outputRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);

  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;

    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i += 1) {
      accum += buffer[i];
      count += 1;
    }

    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult += 1;
    offsetBuffer = nextOffsetBuffer;
  }

  return result;
};

const floatTo16BitPCM = (view: DataView, offset: number, input: Float32Array) => {
  for (let i = 0; i < input.length; i += 1, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
};

const writeString = (view: DataView, offset: number, str: string) => {
  for (let i = 0; i < str.length; i += 1) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
};

const encodeWav = (samples: Float32Array, sampleRate: number): Blob => {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);
  floatTo16BitPCM(view, 44, samples);

  return new Blob([view], { type: "audio/wav" });
};

const blobToBase64 = async (blob: Blob): Promise<string> => {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
};

const ChatScreen = ({ open, isLandscape, onClose }: ChatScreenProps) => {
  const [storedKey, setStoredKey] = useState(() => ENV_KEY || localStorage.getItem("gemini_api_key") || "");
  const [showApiPrompt, setShowApiPrompt] = useState(false);
  const [vs, setVsState] = useState<VS>("idle");
  const [transcript, setTranscript] = useState("");
  const [lastReply, setLastReply] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [videoPhase, setVideoPhase] = useState<"awake" | "talk">("awake");

  const keyRef = useRef(storedKey);
  const convoRef = useRef<Msg[]>([]);
  const greetedRef = useRef(false);
  const alive = useRef(true);
  const vsRef = useRef<VS>("idle");

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const inputSampleRateRef = useRef<number>(TARGET_SAMPLE_RATE);
  const isRecordingRef = useRef(false);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    keyRef.current = storedKey;
  }, [storedKey]);

  const setVS = useCallback((s: VS) => {
    vsRef.current = s;
    setVsState(s);
  }, []);

  const destroyRecordingGraph = useCallback(async () => {
    try {
      processorRef.current?.disconnect();
    } catch {
      // ignore
    }
    try {
      sourceNodeRef.current?.disconnect();
    } catch {
      // ignore
    }

    processorRef.current = null;
    sourceNodeRef.current = null;

    if (audioContextRef.current) {
      try {
        await audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }
  }, []);

  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const stopAll = useCallback(async () => {
    window.speechSynthesis?.cancel();
    isRecordingRef.current = false;
    pcmChunksRef.current = [];
    await destroyRecordingGraph();
    stopTracks();
  }, [destroyRecordingGraph, stopTracks]);

  const pickVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find((v) => v.lang.startsWith("en") && /samantha|karen|moira|tessa|victoria|female/i.test(v.name)) ||
      voices.find((v) => v.lang.startsWith("en-US")) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      null
    );
  }, []);

  const speakText = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!alive.current) return;
      window.speechSynthesis?.cancel();

      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = "en-US";
      utt.rate = 0.95;
      utt.pitch = 1.1;

      const assignVoice = () => {
        const voice = pickVoice();
        if (voice) utt.voice = voice;
      };

      if (window.speechSynthesis.getVoices().length > 0) assignVoice();
      else window.speechSynthesis.addEventListener("voiceschanged", assignVoice, { once: true });

      utt.onend = () => {
        if (!alive.current) return;
        onEnd?.();
      };
      utt.onerror = () => {
        if (!alive.current) return;
        setVS("idle");
      };

      setVS("speaking");
      setLastReply(text);
      window.speechSynthesis.speak(utt);
    },
    [pickVoice, setVS],
  );

  const fetchGeminiText = useCallback(
    async (body: Record<string, unknown>): Promise<string> => {
      const key = keyRef.current;
      if (!key) {
        setShowApiPrompt(true);
        return "";
      }

      let lastErr = "";

      for (const modelId of GEMINI_MODEL_IDS) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${key}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            },
          );

          const data: {
            error?: { message?: string };
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
          } = await res.json();

          const errMsg = data.error?.message ?? (!res.ok ? `HTTP ${res.status}` : "");
          if (data.error || !res.ok) {
            lastErr = errMsg || `HTTP ${res.status}`;
            if (/not found|404|NOT_FOUND|no longer available|retired|deprecated|unsupported/i.test(lastErr)) {
              continue;
            }
            console.error("[Gemini] API error:", lastErr);
            return "";
          }

          const text = data.candidates
            ?.flatMap((c) => c.content?.parts ?? [])
            .map((p) => p.text ?? "")
            .join("")
            .trim();

          if (text) return text;
        } catch (error) {
          lastErr = String(error);
          console.warn(`[Gemini] fetch failed for ${modelId}:`, error);
        }
      }

      console.error("[Gemini] all models failed:", lastErr);
      return "";
    },
    [],
  );

  const transcribeAudio = useCallback(
    async (audioBase64: string): Promise<string> => {
      const body = {
        contents: [
          {
            role: "user",
            parts: [
              { text: "Transcribe the speech in this audio. Return only the transcript text, with no quotes or extra explanation." },
              { inline_data: { mime_type: "audio/wav", data: audioBase64 } },
            ],
          },
        ],
        generationConfig: { maxOutputTokens: 180, temperature: 0 },
      };

      const text = await fetchGeminiText(body);
      return text.trim();
    },
    [fetchGeminiText],
  );

  const callGeminiReply = useCallback(
    async (msgs: Msg[]): Promise<string> => {
      const body = {
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: msgs,
        generationConfig: { maxOutputTokens: 150, temperature: 0.9 },
      };

      const text = await fetchGeminiText(body);
      return text || "Hmm, something went fuzzy — try again~";
    },
    [fetchGeminiText],
  );

  const startRecording = useCallback(async () => {
    if (!alive.current || isRecordingRef.current) return;
    if (!window.isSecureContext) {
      setErrorMsg("Microphone needs HTTPS or localhost.");
      setVS("error");
      return;
    }

    const AudioCtx =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioCtx) {
      setErrorMsg("Audio recording is not supported in this browser.");
      setVS("error");
      return;
    }

    try {
      window.speechSynthesis?.cancel();
      await stopAll();
      setErrorMsg("");
      setTranscript("");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const audioContext = new AudioCtx();
      audioContextRef.current = audioContext;
      inputSampleRateRef.current = audioContext.sampleRate;

      const source = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      pcmChunksRef.current = [];

      processor.onaudioprocess = (event) => {
        if (!isRecordingRef.current) return;
        const input = event.inputBuffer.getChannelData(0);
        pcmChunksRef.current.push(new Float32Array(input));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
      if (audioContext.state === "suspended") await audioContext.resume();

      isRecordingRef.current = true;
      setVS("listening");
    } catch (error) {
      console.error("[Audio] startRecording failed:", error);
      const name = (error as DOMException)?.name ?? "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setErrorMsg("Mic access denied. Please allow microphone in your browser settings.");
      } else {
        setErrorMsg("I couldn't start the microphone. Please try again.");
      }
      setVS("error");
      await stopAll();
    }
  }, [setVS, stopAll]);

  const stopRecordingAndSend = useCallback(async () => {
    if (!alive.current || !isRecordingRef.current) return;

    isRecordingRef.current = false;
    setVS("thinking");

    const chunks = pcmChunksRef.current;
    pcmChunksRef.current = [];

    await destroyRecordingGraph();
    stopTracks();

    const merged = mergeFloat32(chunks);
    if (merged.length < 2048) {
      setErrorMsg("I couldn't hear enough audio. Please try again.");
      setVS("error");
      return;
    }

    try {
      const mono16k = downsampleBuffer(merged, inputSampleRateRef.current, TARGET_SAMPLE_RATE);
      const wavBlob = encodeWav(mono16k, TARGET_SAMPLE_RATE);
      const base64Audio = await blobToBase64(wavBlob);

      const userTranscript = await transcribeAudio(base64Audio);
      const normalizedTranscript = userTranscript.trim();

      if (!normalizedTranscript) {
        setErrorMsg("I couldn't understand the audio. Please try again.");
        setVS("error");
        return;
      }

      setTranscript(normalizedTranscript);

      const userMsg: Msg = { role: "user", parts: [{ text: normalizedTranscript }] };
      const updated: Msg[] = [...convoRef.current, userMsg].slice(-MAX_HISTORY_MSGS);
      convoRef.current = updated;

      const reply = await callGeminiReply(updated);
      if (!alive.current) return;

      const modelMsg: Msg = { role: "model", parts: [{ text: reply }] };
      convoRef.current = [...updated, modelMsg].slice(-MAX_HISTORY_MSGS);

      speakText(reply, () => {
        if (!alive.current) return;
        setVS("idle");
      });
    } catch (error) {
      console.error("[Audio] stopRecordingAndSend failed:", error);
      setErrorMsg("Something went fuzzy while sending your voice. Please try again.");
      setVS("error");
    }
  }, [callGeminiReply, destroyRecordingGraph, setVS, speakText, stopTracks, transcribeAudio]);

  const handleMicPress = useCallback(async () => {
    if (vsRef.current === "thinking") return;
    if (isRecordingRef.current) {
      await stopRecordingAndSend();
      return;
    }
    await startRecording();
  }, [startRecording, stopRecordingAndSend]);

  useEffect(() => {
    if (open) {
      setVideoPhase("awake");
      greetedRef.current = false;
      setTranscript("");
      setLastReply("");
      setErrorMsg("");
      setVS("idle");
    } else {
      void stopAll();
      setTranscript("");
      setLastReply("");
      setErrorMsg("");
      setVideoPhase("awake");
      convoRef.current = [];
      greetedRef.current = false;
      setVS("idle");
    }
  }, [open, setVS, stopAll]);

  useEffect(() => {
    if (open && videoPhase === "talk" && !greetedRef.current) {
      greetedRef.current = true;

      const timer = setTimeout(() => {
        if (!alive.current) return;
        speakText(GREETING_A, () => {
          if (!alive.current) return;
          setTimeout(() => {
            speakText(GREETING_B, () => {
              if (!alive.current) return;
              convoRef.current = [{ role: "model", parts: [{ text: GREETING_COMBINED }] }];
              setVS("idle");
            });
          }, 250);
        });
      }, 150);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [open, videoPhase, speakText, setVS]);

  const handleSaveKey = (key: string) => {
    localStorage.setItem("gemini_api_key", key);
    setStoredKey(key);
    setShowApiPrompt(false);
  };

  const statusLabel =
    vs === "listening"
      ? "Recording… tap again to send"
      : vs === "thinking"
        ? "Transcribing and thinking…"
        : vs === "speaking"
          ? lastReply
          : vs === "error"
            ? errorMsg || "Something went wrong"
            : "Tap the mic to start";

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
              }}
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 20 }}
            >
              <video
                key={videoPhase}
                src={videoPhase === "awake" ? awakeVideo : talkVideo}
                autoPlay
                loop={videoPhase === "talk"}
                muted
                playsInline
                onEnded={() => {
                  if (videoPhase === "awake") setVideoPhase("talk");
                }}
                style={{
                  maxHeight: "100%",
                  maxWidth: isLandscape ? "65%" : "92%",
                  objectFit: "contain",
                  borderRadius: 20,
                }}
              />
            </motion.div>

            <motion.div
              className="absolute bottom-0 left-0 right-0"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "14px 24px",
                paddingBottom: "max(14px, env(safe-area-inset-bottom))",
                background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 100%)",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <div style={{ flex: 1, minHeight: 28, display: "flex", alignItems: "center" }}>
                {vs === "listening" && <Waveform />}
                {vs === "thinking" && <ThinkingDots />}
                {(vs === "idle" || vs === "speaking" || vs === "error") && (
                  <motion.p
                    key={statusLabel}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      color: vs === "error" ? "#ff8080" : "rgba(210,190,255,0.85)",
                      fontSize: 13,
                      fontWeight: 500,
                      lineHeight: 1.5,
                      maxWidth: 260,
                    }}
                  >
                    {statusLabel}
                  </motion.p>
                )}
              </div>

              <AnimatePresence>
                {transcript && (vs === "thinking" || vs === "speaking") && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      color: "rgba(160,232,255,0.55)",
                      fontSize: 11,
                      fontStyle: "italic",
                      maxWidth: 180,
                      textAlign: "right",
                    }}
                  >
                    "{transcript}"
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button
                onClick={vs === "thinking" ? undefined : handleMicPress}
                whileTap={vs !== "thinking" ? { scale: 0.85 } : {}}
                style={{
                  flexShrink: 0,
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background:
                    vs === "listening"
                      ? "linear-gradient(135deg,#c4a3ff,#a0e8ff)"
                      : "rgba(255,255,255,0.1)",
                  border: "2px solid rgba(196,163,255,0.45)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: vs === "thinking" ? "default" : "pointer",
                }}
                animate={
                  vs === "listening"
                    ? { boxShadow: ["0 0 0 0 rgba(196,163,255,0.6)", "0 0 0 14px rgba(196,163,255,0)"] }
                    : { boxShadow: "0 0 0 0 rgba(196,163,255,0)" }
                }
                transition={{ duration: 1.1, repeat: vs === "listening" ? Infinity : 0 }}
                aria-label={vs === "listening" ? "Recording - tap again to send" : "Tap to talk"}
              >
                {vs === "listening" ? (
                  <Mic size={22} color="#000" strokeWidth={2.5} />
                ) : (
                  <MicOff size={20} color="rgba(200,180,255,0.75)" strokeWidth={2} />
                )}
              </motion.button>
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
                onClick={() => setShowApiPrompt(true)}
                whileTap={{ scale: 0.82 }}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
                aria-label="API key settings"
              >
                <Settings size={14} color="rgba(255,255,255,0.45)" />
              </motion.button>

              <motion.button
                onClick={onClose}
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

            {showApiPrompt && <ApiKeyPrompt onSave={handleSaveKey} />}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChatScreen;
