import { Sun, Moon, Stars } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";

const ThemeToggle = () => {
  const { isDark, toggle } = useTheme();

  return (
    <motion.button
      onClick={toggle}
      className="fixed top-4 right-4 z-50 w-11 h-11 rounded-full glass-card flex items-center justify-center overflow-hidden"
      aria-label="Toggle theme"
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9, rotate: 15 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      style={{
        boxShadow: isDark
          ? "0 0 16px 3px hsl(var(--primary) / 0.35), 0 0 32px 6px hsl(var(--sleep-pink) / 0.15)"
          : "0 0 16px 3px hsl(var(--sleep-warning) / 0.3), 0 0 32px 6px hsl(var(--primary) / 0.1)",
      }}
    >
      <AnimatePresence mode="wait">
        {isDark ? (
          <motion.div
            key="moon"
            className="flex items-center justify-center"
            initial={{ y: 20, opacity: 0, rotate: -60 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -20, opacity: 0, rotate: 60 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
          >
            <Moon className="w-5 h-5 text-primary" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            className="flex items-center justify-center"
            initial={{ y: -20, opacity: 0, rotate: 60 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 20, opacity: 0, rotate: -60 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
          >
            <Sun className="w-5 h-5 text-primary" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default ThemeToggle;
