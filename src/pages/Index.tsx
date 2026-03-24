import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/BottomNav";
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

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const goToPlan = useCallback(() => setActiveTab("plan"), []);

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
      default:
        return <HomePage />;
    }
  };

  return (
    <EveningReminderProvider>
      <SleepPlanProvider>
        <StandReminderPreviewProvider>
          <AppTabProvider goToPlan={goToPlan}>
            <div className="min-h-screen bg-background overflow-x-hidden">
              <ThemeToggle />

              <div className="fixed inset-0 pointer-events-none">
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-20"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 20%, hsl(250 85% 65% / 0.2) 0%, transparent 50%), radial-gradient(circle at 70% 60%, hsl(310 80% 65% / 0.12) 0%, transparent 50%)",
                  }}
                />
              </div>

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

              <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
          </AppTabProvider>
        </StandReminderPreviewProvider>
      </SleepPlanProvider>
    </EveningReminderProvider>
  );
};

export default Index;
