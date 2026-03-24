import { motion } from "framer-motion";
import {
  User, Palette, Bell, Shield, FileText, ChevronRight, Moon, Volume2,
  Star, Clock, Smartphone, BellRing,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useEveningReminderSettings } from "@/contexts/evening-reminder-context";
import { useSleepPlanContext } from "@/contexts/sleep-plan-context";
import { useStandReminderPreview } from "@/contexts/stand-reminder-preview-context";

const REMINDER_HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const REMINDER_MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

function splitReminderTime(s: string): { h: string; m: string } {
  const [a, b] = s.split(":");
  const hNum = Math.min(23, Math.max(0, parseInt(a ?? "20", 10) || 20));
  const mNum = Math.min(59, Math.max(0, parseInt(b ?? "0", 10) || 0));
  return { h: String(hNum).padStart(2, "0"), m: String(mNum).padStart(2, "0") };
}

const ProfilePage = () => {
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const {
    eveningReminderEnabled,
    setEveningReminderEnabled,
    eveningReminderTime,
    setEveningReminderTime,
  } = useEveningReminderSettings();
  const { loaded } = useSleepPlanContext();
  const { requestStandReminderPreview } = useStandReminderPreview();
  const [sleepPoints] = useState(1280);
  const [browserNotifPermission, setBrowserNotifPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setBrowserNotifPermission(Notification.permission);
    }
  }, []);

  const handleEnableBrowserNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("This browser does not support notifications.");
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setBrowserNotifPermission(Notification.permission);
      if (result === "granted") {
        toast.success(
          "Notifications enabled — you’ll get alerts for your sleep-time reminder and the stand reminder (30 min before bed), even when this tab is in the background."
        );
      } else if (result === "denied") {
        toast.message(
          "Notifications are blocked. Allow this site in your browser settings if you want reminders while using other tabs."
        );
      }
    } catch {
      toast.error("Could not request notification permission.");
    }
  };

  const { h: reminderHour, m: reminderMinute } = useMemo(
    () => splitReminderTime(eveningReminderTime),
    [eveningReminderTime]
  );

  const colorOptions = [
    { id: "purple", label: "Lavender", color: "hsl(var(--primary))" },
    { id: "blue", label: "Ocean", color: "hsl(220, 80%, 55%)" },
    { id: "orange", label: "Sunset", color: "hsl(30, 90%, 55%)" },
    { id: "green", label: "Forest", color: "hsl(150, 60%, 45%)" },
  ];

  const spriteSkins = [
    { id: "pajamas", name: "Starry Pajamas", cost: 200, emoji: "🌟", owned: true },
    { id: "nightcap", name: "Moon Nightcap", cost: 350, emoji: "🧢", owned: true },
    { id: "blanket", name: "Cloud Blanket", cost: 500, emoji: "☁️", owned: false },
    { id: "slippers", name: "Cozy Slippers", cost: 800, emoji: "🥿", owned: false },
  ];

  const settingsSections = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Personal Information", subtitle: "Name, email, avatar" },
        { icon: Shield, label: "Privacy", subtitle: "Data and permissions" },
      ],
    },
    {
      title: "Appearance",
      items: [
        { icon: Palette, label: "Theme", subtitle: "Dark mode" },
        { icon: Moon, label: "Night Mode", subtitle: "Auto-enable at bedtime" },
      ],
    },
    {
      title: "Legal",
      items: [
        { icon: FileText, label: "Privacy Policy", subtitle: "" },
        { icon: FileText, label: "Terms of Service", subtitle: "" },
      ],
    },
  ];

  const Toggle = ({
    value,
    onChange,
  }: {
    value: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <button
      onClick={() => onChange(!value)}
      className={`w-12 h-7 rounded-full transition-colors duration-300 ${
        value ? "bg-primary" : "bg-muted"
      }`}
    >
      <motion.div
        className="w-5 h-5 bg-white rounded-full shadow-lg"
        animate={{ x: value ? 24 : 4 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );

  return (
    <div className="min-h-screen pb-24 px-6">
      {/* Header */}
      <motion.div
        className="pt-8 pb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <User className="w-6 h-6 text-primary" />
          Profile
        </h1>
        <p className="text-muted-foreground">Manage your account & devices</p>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        className="glass-card p-4 mb-6 flex items-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="text-2xl">🌙</span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">Sleep Explorer</h3>
          <p className="text-sm text-muted-foreground">Member since Jan 2026</p>
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3.5 h-3.5 text-sleep-warning" />
            <span className="text-xs font-medium text-sleep-warning">{sleepPoints} pts</span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </motion.div>

      {/* Quick Toggles */}
      <motion.div
        className="glass-card p-4 mb-6 space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="space-y-3 pb-4 border-b border-border/50">
          <div className="flex items-start gap-3">
            <BellRing className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-2 min-w-0 flex-1">
              <p className="font-medium text-foreground">Browser notifications</p>
              <p className="text-xs text-muted-foreground leading-snug">
                Tap below to allow. When granted, your <span className="text-foreground/90">daily sleep-time reminder</span>{" "}
                and <span className="text-foreground/90">stand reminder</span> (30 minutes before your Plan bedtime) can
                show as system alerts while you browse other sites — keep this tab open in the background.
              </p>
              <p className="text-[10px] text-muted-foreground">
                Status:{" "}
                <span className="font-medium text-foreground capitalize">
                  {browserNotifPermission === "granted"
                    ? "allowed"
                    : browserNotifPermission === "denied"
                      ? "blocked"
                      : "not set"}
                </span>
              </p>
              <Button
                type="button"
                variant="secondary"
                className="w-full rounded-xl h-11"
                disabled={
                  typeof window !== "undefined" &&
                  "Notification" in window &&
                  Notification.permission === "granted"
                }
                onClick={handleEnableBrowserNotifications}
              >
                {browserNotifPermission === "granted"
                  ? "Browser notifications enabled"
                  : "Enable browser notifications"}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Notifications</p>
              <p className="text-xs text-muted-foreground">Sleep reminders & tips</p>
            </div>
          </div>
          <Toggle value={notifications} onChange={setNotifications} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Sounds</p>
              <p className="text-xs text-muted-foreground">Alarm & ambient sounds</p>
            </div>
          </div>
          <Toggle value={sounds} onChange={setSounds} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Daily sleep reminder</p>
              <p className="text-xs text-muted-foreground">Popup to plan tonight&apos;s sleep</p>
            </div>
          </div>
          <Toggle value={eveningReminderEnabled} onChange={setEveningReminderEnabled} />
        </div>

        {eveningReminderEnabled && (
          <div className="pl-8 space-y-3 relative z-20 -mt-1">
            <p className="text-[10px] text-muted-foreground leading-snug">
              Pick hour and minute below. Changes preview the reminder after a short delay.
            </p>
            <span className="text-xs text-muted-foreground block">Reminder time (24h)</span>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5 w-[min(100%,7.5rem)]">
                <Label htmlFor="evening-reminder-hour" className="text-[10px] text-muted-foreground">
                  Hour
                </Label>
                <Select
                  value={reminderHour}
                  onValueChange={(h) => setEveningReminderTime(`${h}:${reminderMinute}`)}
                >
                  <SelectTrigger
                    id="evening-reminder-hour"
                    className="rounded-xl bg-background/90 h-11 touch-manipulation"
                  >
                    <SelectValue placeholder="Hour" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 z-[200]">
                    {REMINDER_HOURS.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 w-[min(100%,7.5rem)]">
                <Label htmlFor="evening-reminder-minute" className="text-[10px] text-muted-foreground">
                  Minute
                </Label>
                <Select
                  value={reminderMinute}
                  onValueChange={(m) => setEveningReminderTime(`${reminderHour}:${m}`)}
                >
                  <SelectTrigger
                    id="evening-reminder-minute"
                    className="rounded-xl bg-background/90 h-11 touch-manipulation"
                  >
                    <SelectValue placeholder="Min" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 z-[200]">
                    {REMINDER_MINUTES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            </div>
        )}

        <div className="pt-4 border-t border-border/50 space-y-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground leading-snug">
              About 30 minutes before your Plan bedtime, a popup shows: “Lulu&apos;s a bit tired — could you put me on
              the stand?” plus the image (requires a saved Plan).
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="w-full rounded-xl h-11"
            disabled={!loaded}
            onClick={() => requestStandReminderPreview()}
          >
            Preview stand reminder popup
          </Button>
        </div>
      </motion.div>

      {/* Settings Sections */}
      {settingsSections.map((section, sectionIndex) => (
        <motion.div
          key={section.title}
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + sectionIndex * 0.1 }}
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">
            {section.title}
          </h3>
          <div className="glass-card overflow-hidden">
            {section.items.map((item, itemIndex) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors ${
                    itemIndex < section.items.length - 1 ? "border-b border-border/50" : ""
                  }`}
                >
                  <Icon className="w-5 h-5 text-primary" />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">{item.label}</p>
                    {item.subtitle && (
                      <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </motion.div>
      ))}

      {/* App Info */}
      <motion.div
        className="text-center py-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <p className="text-sm text-muted-foreground">SleepWell v1.0.0</p>
        <p className="text-xs text-muted-foreground mt-1">Made with 💜 for better sleep</p>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
