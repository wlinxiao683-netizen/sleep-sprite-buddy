import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Maximize2, Minimize2, Sparkles } from "lucide-react";
import SpriteFaceFrames, { type Expression } from "@/components/SpriteFaceFrames";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Message {
  id: string;
  role: "user" | "sprite";
  text: string;
  expression: Expression;
}

// ---------------------------------------------------------------------------
// Sample sprite replies
// ---------------------------------------------------------------------------
const REPLIES: { text: string; expression: Expression }[] = [
  { text: "嗨！今天睡得怎么样呀？✨", expression: "normal" },
  { text: "哇，听起来不错！继续保持哦！", expression: "wink" },
  { text: "累了就好好休息，小精灵陪着你呢~", expression: "sleepy" },
  { text: "记得今晚早点睡觉哦！🌙", expression: "normal" },
  { text: "你真棒！睡眠质量超厉害的！", expression: "wink" },
  { text: "困困的... 我也想睡觉了... zzz", expression: "sleepy" },
  { text: "我在这里！有什么想聊的都可以告诉我！", expression: "normal" },
  { text: "嘿嘿，你来啦！今天状态怎么样？", expression: "wink" },
];
let replyIndex = 0;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Bouncing dots while sprite is "thinking" */
const TypingIndicator = () => (
  <motion.div
    className="flex gap-1.5 items-center px-4 py-2 rounded-2xl bg-white/10"
    initial={{ opacity: 0, scale: 0.7 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.7 }}
    transition={{ type: "spring", stiffness: 500, damping: 15 }}
  >
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-2 h-2 rounded-full bg-white/70"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.14, ease: "easeInOut" }}
      />
    ))}
  </motion.div>
);

/** A single chat bubble */
const Bubble = ({ msg }: { msg: Message }) => (
  <motion.div
    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
    initial={{ scale: 0.6, opacity: 0, y: 12 }}
    animate={{ scale: 1, opacity: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 500, damping: 14 }}
  >
    <div
      className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
        msg.role === "user"
          ? "bg-primary text-primary-foreground rounded-br-md"
          : "bg-white/10 text-white rounded-bl-md border border-white/10"
      }`}
    >
      {msg.text}
    </div>
  </motion.div>
);

// ---------------------------------------------------------------------------
// Main ChatPage
// ---------------------------------------------------------------------------
interface ChatPageProps {
  /** Passed from parent so Index can control landscape state globally */
  isLandscape: boolean;
  onToggleLandscape: () => void;
}

const ChatPage = ({ isLandscape, onToggleLandscape }: ChatPageProps) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: "0", role: "sprite", text: "嗨！我是小精灵，你的睡眠小伙伴！有什么想聊的吗？✨", expression: "normal" },
  ]);
  const [input, setInput] = useState("");
  const [currentExpression, setCurrentExpression] = useState<Expression | undefined>(undefined);
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", text, expression: "normal" }]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const reply = REPLIES[replyIndex % REPLIES.length];
      replyIndex++;
      setCurrentExpression(reply.expression);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "sprite", text: reply.text, expression: reply.expression },
      ]);
      setTimeout(() => setCurrentExpression(undefined), 3200);
    }, 800 + Math.random() * 500);
  }, [input]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // -------------------------------------------------------------------------
  // LANDSCAPE layout – immersive black full-screen
  // -------------------------------------------------------------------------
  if (isLandscape) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col z-50">
        {/* Toggle button */}
        <button
          onClick={onToggleLandscape}
          className="absolute top-3 right-3 z-50 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 transition-colors"
        >
          <Minimize2 className="w-4 h-4" />
        </button>

        {/* Sprite face – fills the screen vertically */}
        <div className="flex-1 flex items-center justify-center">
          <SpriteFaceFrames
            expression={currentExpression}
            size={Math.min(window.innerHeight * 0.55, 360)}
            dark={true}
          />
        </div>

        {/* Chat messages – translucent strip at the bottom */}
        <div className="flex-shrink-0 w-full max-h-[38vh] flex flex-col">
          {/* Message list */}
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
            <AnimatePresence initial={false}>
              {messages.slice(-6).map((msg) => (
                <Bubble key={msg.id} msg={msg} />
              ))}
              {isTyping && <TypingIndicator key="typing" />}
            </AnimatePresence>
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-white/10 bg-black/60 backdrop-blur-sm flex items-center gap-2">
            <input
              ref={inputRef}
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/40 transition-colors"
              placeholder="和小精灵说说话..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
            />
            <motion.button
              className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-40 flex-shrink-0"
              onClick={sendMessage}
              disabled={!input.trim()}
              whileTap={{ scale: 0.82, transition: { type: "spring", stiffness: 700, damping: 10 } }}
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // PORTRAIT layout – standard chat page
  // -------------------------------------------------------------------------
  return (
    <div className="flex flex-col min-h-screen bg-background pb-28">
      {/* Header */}
      <motion.div
        className="sticky top-0 z-10 px-6 pt-8 pb-4 bg-background/80 backdrop-blur-xl border-b border-border/30 flex items-start justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            小精灵对话
          </h1>
          <p className="text-muted-foreground text-sm">和你的睡眠小伙伴聊聊天</p>
        </div>
        {/* Toggle landscape button */}
        <motion.button
          onClick={onToggleLandscape}
          className="mt-1 w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          whileTap={{ scale: 0.88 }}
          title="横屏沉浸模式"
        >
          <Maximize2 className="w-4 h-4" />
        </motion.button>
      </motion.div>

      {/* Sprite avatar */}
      <motion.div
        className="flex flex-col items-center pt-4 pb-2"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
      >
        <div className="relative">
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.2) 0%, transparent 70%)",
              width: 600, height: 600,
              top: -15, left: -15,
            }}
            animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <SpriteFaceFrames expression={currentExpression} size={220} dark={false} />
        </div>

        <AnimatePresence>
          {isTyping && (
            <div className="mt-2">
              <TypingIndicator />
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <Bubble key={msg.id} msg={msg} />
          ))}
          {isTyping && <TypingIndicator key="typing" />}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Input bar – sits above BottomNav */}
      <motion.div
        className="fixed bottom-[4.5rem] left-0 right-0 px-4 max-w-lg mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 bg-card border border-border/50 rounded-2xl px-4 py-2.5 shadow-lg backdrop-blur-xl">
          <input
            ref={inputRef}
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="和小精灵说说话..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
          />
          <motion.button
            className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0 disabled:opacity-40"
            onClick={sendMessage}
            disabled={!input.trim()}
            whileTap={{ scale: 0.82, transition: { type: "spring", stiffness: 700, damping: 10 } }}
            whileHover={{ scale: 1.1 }}
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatPage;
