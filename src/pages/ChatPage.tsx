import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
import SpriteAvatar, { Expression } from "@/components/SpriteAvatar";

interface Message {
  id: string;
  role: "user" | "sprite";
  text: string;
  expression: Expression;
}

const spriteReplies: { text: string; expression: Expression }[] = [
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

const bouncyIn = {
  initial: { scale: 0.5, opacity: 0, y: 20 },
  animate: { scale: 1, opacity: 1, y: 0 },
  exit: { scale: 0.8, opacity: 0, y: -10 },
  transition: { type: "spring" as const, stiffness: 500, damping: 14 },
};

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "sprite",
      text: "嗨！我是小精灵，你的睡眠小伙伴！有什么想聊的吗？✨",
      expression: "normal",
    },
  ]);
  const [input, setInput] = useState("");
  const [currentExpression, setCurrentExpression] = useState<Expression>("normal");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text,
      expression: "normal",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate sprite thinking then replying
    setTimeout(() => {
      const reply = spriteReplies[replyIndex % spriteReplies.length];
      replyIndex++;

      setCurrentExpression(reply.expression);
      setIsTyping(false);

      const spriteMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "sprite",
        text: reply.text,
        expression: reply.expression,
      };
      setMessages((prev) => [...prev, spriteMsg]);

      // Return to normal expression after a delay
      setTimeout(() => setCurrentExpression("normal"), 3000);
    }, 900 + Math.random() * 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      {/* Header */}
      <motion.div
        className="sticky top-0 z-10 px-6 pt-8 pb-4 bg-background/80 backdrop-blur-xl border-b border-border/30"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          小精灵对话
        </h1>
        <p className="text-muted-foreground text-sm">和你的睡眠小伙伴聊聊天</p>
      </motion.div>

      {/* Sprite section */}
      <motion.div
        className="flex flex-col items-center pt-6 pb-2 px-6"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
      >
        {/* Ambient glow behind sprite */}
        <div className="relative">
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, hsl(var(--primary) / 0.25) 0%, transparent 70%)",
              width: 220,
              height: 220,
              top: -10,
              left: -10,
            }}
            animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <SpriteAvatar
            expression={currentExpression}
            size={200}
            autoAnimate={false}
          />
        </div>

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              className="flex gap-1.5 items-center px-4 py-2 rounded-2xl bg-muted/60 mt-2"
              initial={{ opacity: 0, scale: 0.7, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 6 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ y: [0, -5, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              {...bouncyIn}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card border border-border/40 text-foreground rounded-bl-md"
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Input bar */}
      <motion.div
        className="fixed bottom-20 left-0 right-0 px-4 max-w-lg mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 bg-card border border-border/50 rounded-2xl px-4 py-2.5 shadow-lg backdrop-blur-xl">
          <input
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="和小精灵说说话..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
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
