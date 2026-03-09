import { motion } from "framer-motion";
import {
  User, Palette, Bell, Shield, FileText, ChevronRight, Moon, Volume2,
  Bluetooth, BatteryMedium, Wifi, Sparkles, CloudRain, Wind, VolumeX,
  Lightbulb, Star, Lock,
} from "lucide-react";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";

const ProfilePage = () => {
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [selectedNoise, setSelectedNoise] = useState<string>("rain");
  const [selectedColor, setSelectedColor] = useState<string>("purple");
  const [sleepPoints] = useState(1280);

  const noiseOptions = [
    { id: "rain", label: "Rain", icon: CloudRain },
    { id: "wind", label: "Wind", icon: Wind },
    { id: "silent", label: "Silent", icon: VolumeX },
  ];

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

      {/* Hardware Connection & Status */}
      <motion.div
        className="glass-card p-5 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Hardware Status</h3>

        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center">
            <Bluetooth className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">SleepWell Lamp</p>
            <div className="flex items-center gap-2 mt-1">
              <Wifi className="w-3.5 h-3.5 text-sleep-success" />
              <span className="text-xs text-sleep-success font-medium">Connected</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/30 rounded-xl p-3 flex items-center gap-3">
            <BatteryMedium className="w-5 h-5 text-sleep-success" />
            <div>
              <p className="text-xs text-muted-foreground">Battery</p>
              <p className="text-sm font-bold text-foreground">72%</p>
            </div>
          </div>
          <div className="bg-muted/30 rounded-xl p-3 flex items-center gap-3">
            <Wifi className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Signal</p>
              <p className="text-sm font-bold text-foreground">Strong</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Sprite Skins */}
      <motion.div
        className="glass-card p-5 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Sprite Wardrobe</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Redeem sleep points for new outfits
        </p>

        <div className="grid grid-cols-2 gap-3">
          {spriteSkins.map((skin) => (
            <div
              key={skin.id}
              className={`relative p-4 rounded-xl border transition-all ${
                skin.owned
                  ? "bg-primary/10 border-primary/30"
                  : "bg-muted/20 border-border/50"
              }`}
            >
              <span className="text-2xl">{skin.emoji}</span>
              <p className="text-sm font-medium text-foreground mt-2">{skin.name}</p>
              {skin.owned ? (
                <span className="text-xs text-sleep-success font-medium">Owned</span>
              ) : (
                <div className="flex items-center gap-1 mt-1">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{skin.cost} pts</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* White Noise Preference */}
      <motion.div
        className="glass-card p-5 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Sleep Sound</h3>
        <p className="text-xs text-muted-foreground mb-4">
          White noise type for your hardware
        </p>

        <div className="grid grid-cols-3 gap-3">
          {noiseOptions.map((option) => {
            const Icon = option.icon;
            const isActive = selectedNoise === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setSelectedNoise(option.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  isActive
                    ? "bg-primary/15 border-primary/40 shadow-sm shadow-primary/10"
                    : "bg-muted/20 border-border/50 hover:border-primary/20"
                }`}
              >
                <Icon
                  className={`w-6 h-6 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                />
                <span
                  className={`text-xs font-medium ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Light Effect Settings */}
      <motion.div
        className="glass-card p-5 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          Light Effect
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Hardware lamp color during wind-down
        </p>

        <div className="flex gap-3">
          {colorOptions.map((option) => {
            const isActive = selectedColor === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setSelectedColor(option.id)}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className={`w-12 h-12 rounded-full transition-all duration-300 ${
                    isActive ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110" : "opacity-60 hover:opacity-80"
                  }`}
                  style={{ backgroundColor: option.color }}
                />
                <span
                  className={`text-xs ${
                    isActive ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}
                >
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Quick Toggles */}
      <motion.div
        className="glass-card p-4 mb-6 space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
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
