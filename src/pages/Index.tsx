import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import ChatScreen from "@/components/ChatScreen";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalEveningReminder from "@/components/GlobalEveningReminder";
import GlobalStandReminder from "@/components/GlobalStandReminder";
import { AppTabProvider } from "@/contexts/app-tab-context";
import { EveningReminderProvider } from "@/contexts/evening-reminder-context";
import { SleepPlanProvider } from "@/contexts/sleep-plan-context";
import { StandReminderPreviewProvider } from "@/contexts/stand-reminder-preview-context";
import HomePage from "@/pages/HomePage";
import PlanPage from "@/pages/PlanPage";
import InsightsPage from "@/pages/StatsPage";
import ProfilePage from "@/pages/SettingsPage";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function checkLandscape(): boolean {
  if (typeof screen !== "undefined" && screen.orientation?.type) {
    return screen.orientation.type.startsWith("landscape");
  }
  return window.innerWidth > window.innerHeight;
}

/** Request landscape lock (works on Android PWA; silently fails on iOS/desktop). */
async function lockLandscape() {
  try {
    // ScreenOrientation.lock is not in all TS libs — cast to any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (screen.orientation as any)?.lock?.("landscape");
  } catch { /* not supported — user rotates manually */ }
}

/** Release orientation lock. */
function unlockOrientation() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  try { (screen.orientation as any)?.unlock?.(); } catch { /* ignore */ }
}

// ─── Shell ────────────────────────────────────────────────────────────────────

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const goToPlan = useCallback(() => setActiveTab("plan"), []);

  const [chatOpen, setChatOpen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(checkLandscape);

  // Track previous orientation so we only react to actual transitions
  const prevLandRef = useRef(checkLandscape());
  // Was the chat opened by the landscape auto-trigger (vs. manual button)?
  const fromLandRef = useRef(false);

  // ── Orientation watcher ───────────────────────────────────────────────────
  useEffect(() => {
    const handle = () => {
      // Brief delay lets the browser finish rotating before reading dimensions
      setTimeout(() => {
        const land = checkLandscape();
        const prev = prevLandRef.current;
        prevLandRef.current = land;
        setIsLandscape(land);

        if (land && !prev) {
          // portrait → landscape: auto-open chat
          fromLandRef.current = true;
          setChatOpen(true);
        } else if (!land && prev && fromLandRef.current) {
          // landscape → portrait: close chat + unlock orientation
          fromLandRef.current = false;
          setChatOpen(false);
          unlockOrientation();
        }
      }, 150);
    };

    window.addEventListener("resize", handle);
    window.addEventListener("orientationchange", handle);
    try { screen.orientation?.addEventListener("change", handle); } catch { /* ignore */ }

    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("orientationchange", handle);
      try { screen.orientation?.removeEventListener("change", handle); } catch { /* ignore */ }
    };
  }, []); // intentionally empty — reads everything via refs

  // ── Manual open from chat icon button ────────────────────────────────────
  const handleOpenChat = useCallback(async () => {
    fromLandRef.current = false; // manual open, not orientation-triggered
    // Try to lock landscape so the screen stays sideways during chat
    await lockLandscape();
    setChatOpen(true);
  }, []);

  // ── Close (X button or portrait flip) ────────────────────────────────────
  const handleCloseChat = useCallback(() => {
    fromLandRef.current = false;
    setChatOpen(false);
    // Only unlock if we locked (manual open path); landscape-triggered closes
    // already unlock in the orientation handler above.
    unlockOrientation();
  }, []);

  // ── Tab renderer ──────────────────────────────────────────────────────────
  const renderPage = () => {
    switch (activeTab) {
      case "home":     return <HomePage onOpenChat={handleOpenChat} />;
      case "plan":     return <PlanPage />;
      case "insights": return <InsightsPage />;
      case "profile":  return <ProfilePage />;
      default:         return <HomePage onOpenChat={handleOpenChat} />;
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <EveningReminderProvider>
      <SleepPlanProvider>
        <StandReminderPreviewProvider>
          <AppTabProvider goToPlan={goToPlan}>
            <div className="min-h-screen bg-background overflow-x-hidden">
              <ThemeToggle />

              {/* Ambient background glow */}
              <div className="fixed inset-0 pointer-events-none">
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-20"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 20%, hsl(250 85% 65% / 0.2) 0%, transparent 50%)," +
                      "radial-gradient(circle at 70% 60%, hsl(310 80% 65% / 0.12) 0%, transparent 50%)",
                  }}
                />
              </div>

              {/* Page content */}
              <div className="relative max-w-lg mx-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderPage()}
                  </motion.div>
                </AnimatePresence>
              </div>

              <GlobalEveningReminder />
              <GlobalStandReminder />

              {/* Bottom nav — hidden while chat is open */}
              {!chatOpen && (
                <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
              )}
            </div>

            {/* Chat overlay — outside max-w-lg so it's truly 100vw × 100vh */}
            <ChatScreen
              open={chatOpen}
              isLandscape={isLandscape}
              onClose={handleCloseChat}
            />
          </AppTabProvider>
        </StandReminderPreviewProvider>
      </SleepPlanProvider>
    </EveningReminderProvider>
  );
};

export default Index;
