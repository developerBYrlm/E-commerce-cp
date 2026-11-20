import { motion } from "framer-motion";
import { ShieldCheck, Compass } from "lucide-react";

export default function ModernAuthLoader({ mode = "login", step = 1 }) {
  const isRegister = mode === "register";
  const progressDuration = mode === "login" ? 1.95 : 1.45;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-forest/25 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative flex w-full max-w-sm flex-col items-center overflow-hidden rounded-[28px] border border-emerald-100/90 bg-white/95 p-7 text-center shadow-[0_25px_60px_-15px_rgba(22,42,32,0.25)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95"
      >
        {/* Ambient background glow inside modal */}
        <div className="pointer-events-none absolute -top-12 h-44 w-44 rounded-full bg-gradient-to-tr from-lime/30 via-emerald-400/25 to-teal-400/20 blur-3xl animate-pulse" />

        {/* Floating modern emblem */}
        <motion.div
          initial={{ scale: 0.85, y: 5 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-forest via-emerald-800 to-forest p-0.5 shadow-lg shadow-forest/20"
        >
          <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-forest text-lime">
            {isRegister ? (
              <Compass className="h-7 w-7 text-lime animate-pulse" />
            ) : (
              <ShieldCheck className="h-7 w-7 text-lime animate-pulse" />
            )}
          </div>
          {/* Shimmering outer aura */}
          <span className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-lime via-emerald-400 to-cyan-400 opacity-40 blur-md animate-pulse" />
        </motion.div>

        {/* Modern animated frequency / wave bars */}
        <div className="mb-3.5 flex h-9 items-center justify-center gap-1.5">
          {[
            { h: [8, 28, 12, 24, 8], dur: 0.75, color: "from-emerald-500 to-lime" },
            { h: [20, 10, 32, 14, 20], dur: 0.65, color: "from-lime to-emerald-300" },
            { h: [12, 34, 18, 30, 12], dur: 0.85, color: "from-cyan-400 to-emerald-400" },
            { h: [24, 12, 26, 10, 24], dur: 0.7, color: "from-emerald-300 to-lime" },
            { h: [10, 24, 14, 28, 10], dur: 0.8, color: "from-lime to-cyan-400" },
          ].map((bar, i) => (
            <motion.div
              key={i}
              animate={{ height: bar.h }}
              transition={{
                repeat: Infinity,
                duration: bar.dur,
                ease: "easeInOut",
                repeatType: "mirror",
              }}
              className={`w-1.5 rounded-full bg-gradient-to-t ${bar.color} shadow-sm shadow-emerald-500/40`}
            />
          ))}
        </div>

        {/* Main Title */}
        <h3 className="text-base font-extrabold tracking-tight text-forest dark:text-white">
          {mode === "login"
            ? "Signing you in..."
            : isRegister
              ? "Setting up your account..."
              : "Processing your request..."}
        </h3>

        {/* Laser Sweep Progress Bar */}
        <div className="mt-3.5 h-1.5 w-52 overflow-hidden rounded-full bg-slate-200/80 p-0 shadow-inner dark:bg-slate-800">
          <motion.div
            initial={{ width: "8%" }}
            animate={{ width: "98%" }}
            transition={{ duration: progressDuration, ease: "easeInOut" }}
            className="relative h-full rounded-full bg-gradient-to-r from-lime via-emerald-400 to-cyan-400 shadow-sm shadow-emerald-400/50"
          >
            <div className="absolute right-0 top-0 bottom-0 w-3 rounded-full bg-white blur-[1px]" />
          </motion.div>
        </div>

        {/* Status step indicator */}
        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <motion.span
            key={step}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {step === 1
              ? (mode === "login" ? "Verifying secure credentials..." : "Creating your profile...")
              : (mode === "login" ? "Opening your neighborhood space..." : "Finalizing! Redirecting to login...")}
          </motion.span>
        </div>
      </motion.div>
    </motion.div>
  );
}
