import { Sun, Calendar, Lightbulb, User } from "lucide-react";
import { motion } from "framer-motion";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const leftTabs = [
    { id: "home", icon: Sun, label: "Today" },
    { id: "plan", icon: Calendar, label: "Plan" },
  ];
  const rightTabs = [
    { id: "insights", icon: Lightbulb, label: "Insights" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  const isChatActive = activeTab === "chat";

  const renderTab = (tab: { id: string; icon: React.ElementType; label: string }) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;
    return (
      <button
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        className="relative flex flex-col items-center gap-0.5 px-4 py-1.5"
      >
        {isActive && (
          <motion.div
            layoutId="activeTab"
            className="absolute inset-0 rounded-2xl bg-primary/10 dark:bg-primary/15"
            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
          />
        )}
        <motion.div
          animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -1 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="relative"
        >
          <Icon
            className={`w-5 h-5 transition-colors duration-300 ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
          />
        </motion.div>
        <span
          className={`text-[10px] font-medium transition-colors duration-300 ${
            isActive ? "text-primary" : "text-muted-foreground"
          }`}
        >
          {tab.label}
        </span>
      </button>
    );
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-lg mx-auto">
      <nav className="relative flex justify-around items-center px-2 py-2.5 rounded-[1.5rem] bg-card/90 dark:bg-card/80 backdrop-blur-xl border border-border/40 shadow-lg dark:shadow-[0_4px_30px_-4px_hsl(var(--primary)/0.15)]">
        {/* Left tabs */}
        {leftTabs.map(renderTab)}

        {/* Center Chat button */}
        <div className="flex flex-col items-center relative" style={{ marginTop: -20 }}>
          <motion.button
            onClick={() => onTabChange("chat")}
            className="flex flex-col items-center gap-0.5"
            whileTap={{ scale: 0.88, transition: { type: "spring", stiffness: 700, damping: 10 } }}
            whileHover={{ scale: 1.08 }}
          >
            {/* Floating circle button */}
            <motion.div
              className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center relative overflow-hidden"
              animate={{
                background: isChatActive
                  ? ["hsl(250,85%,65%)", "hsl(300,70%,60%)", "hsl(250,85%,65%)"]
                  : ["hsl(250,85%,60%)", "hsl(280,75%,65%)", "hsl(250,85%,60%)"],
                scale: isChatActive ? [1, 1.08, 1] : 1,
                boxShadow: isChatActive
                  ? [
                      "0 4px 20px hsl(250 85% 65% / 0.5)",
                      "0 6px 28px hsl(300 70% 60% / 0.6)",
                      "0 4px 20px hsl(250 85% 65% / 0.5)",
                    ]
                  : "0 4px 16px hsl(250 85% 65% / 0.35)",
              }}
              transition={
                isChatActive
                  ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.3 }
              }
            >
              {/* Animated face SVG */}
              <svg viewBox="0 0 36 36" width={32} height={32}>
                {/* Head */}
                <circle cx={18} cy={18} r={15} fill="rgba(255,255,255,0.15)" />
                {/* Eyes */}
                <motion.ellipse
                  cx={13}
                  cy={16}
                  rx={2.5}
                  ry={2.5}
                  fill="white"
                  animate={isChatActive ? { scaleY: [1, 0.15, 1], scaleX: [1, 1.3, 1] } : {}}
                  transition={isChatActive ? { duration: 3, repeat: Infinity, delay: 1 } : {}}
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                />
                <motion.ellipse
                  cx={23}
                  cy={16}
                  rx={2.5}
                  ry={2.5}
                  fill="white"
                  animate={isChatActive ? {} : {}}
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                />
                {/* Smile */}
                <motion.path
                  d={isChatActive ? "M 12 21 Q 18 26 24 21" : "M 13 21 Q 18 24 23 21"}
                  stroke="white"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  fill="none"
                  animate={{ d: isChatActive ? "M 12 21 Q 18 26 24 21" : "M 13 21 Q 18 24 23 21" }}
                  transition={softSpring}
                />
              </svg>
            </motion.div>

            <span
              className={`text-[10px] font-medium mt-1 transition-colors duration-300 ${
                isChatActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Chat
            </span>
          </motion.button>
        </div>

        {/* Right tabs */}
        {rightTabs.map(renderTab)}
      </nav>
    </div>
  );
};

const softSpring = {
  type: "spring" as const,
  stiffness: 300,
  damping: 15,
};

export default BottomNav;
