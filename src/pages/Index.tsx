import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import ThemeToggle from "@/components/ThemeToggle";
import HomePage from "@/pages/HomePage";
import PlanPage from "@/pages/PlanPage";
import InsightsPage from "@/pages/StatsPage";
import ProfilePage from "@/pages/SettingsPage";
import ChatPage from "@/pages/ChatPage";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [isLandscape, setIsLandscape] = useState(false);

  const toggleLandscape = () => setIsLandscape((v) => !v);

  // When entering landscape, ensure chat tab is active
  const handleToggleLandscape = () => {
    if (!isLandscape) setActiveTab("chat");
    toggleLandscape();
  };

  const renderPage = () => {
    switch (activeTab) {
      case "home":
        return <HomePage />;
      case "plan":
        return <PlanPage />;
      case "insights":
        return <InsightsPage />;
      case "profile":
        return <ProfilePage />;
      case "chat":
        return (
          <ChatPage
            isLandscape={isLandscape}
            onToggleLandscape={handleToggleLandscape}
          />
        );
      default:
        return <HomePage />;
    }
  };

  // In landscape chat mode, ChatPage renders as a fixed full-screen overlay.
  // We still render the shell below (it's hidden behind the overlay).
  const hideChrome = isLandscape && activeTab === "chat";

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Theme toggle – hidden in landscape */}
      {!hideChrome && <ThemeToggle />}

      {/* Background gradient */}
      {!hideChrome && (
        <div className="fixed inset-0 pointer-events-none">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-20"
            style={{
              background:
                "radial-gradient(circle at 30% 20%, hsl(250 85% 65% / 0.2) 0%, transparent 50%), radial-gradient(circle at 70% 60%, hsl(310 80% 65% / 0.12) 0%, transparent 50%)",
            }}
          />
        </div>
      )}

      {/* Main content */}
      <div className="relative max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + String(isLandscape)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation – hidden in landscape mode */}
      {!hideChrome && (
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}
    </div>
  );
};

export default Index;
