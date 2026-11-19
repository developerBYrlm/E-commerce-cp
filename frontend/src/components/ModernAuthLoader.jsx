import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, Compass } from "lucide-react";

export default function ModernAuthLoader({ mode = "login", step = 1 }) {
  const isRegister = mode === "register";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-[32px] bg-white/95 p-6 backdrop-blur-xl dark:bg-slate-900/95 shadow-2xl border border-emerald-100/80 dark:border-white/10"
    >
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute h-52 w-52 rounded-full bg-gradient-to-tr from-lime/30 via-emerald-400/25 to-teal-400/20 blur-3xl animate-pulse" />

      <div className="relative flex flex-col items-center text-center">
        {/* Floating modern emblem */}
        <motion.div
          initial={{ scale: 0.85, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-forest via-emerald-800 to-forest p-0.5 shadow-xl shadow-forest/20"
        >
          <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-forest text-lime">
            {isRegister ? (
              <Compass className="h-8 w-8 text-lime animate-pulse" />
            ) : (
              <ShieldCheck className="h-8 w-8 text-lime animate-pulse" />
            )}
          </div>
          {/* Shimmering outer aura */}
          <span className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-lime via-emerald-400 to-cyan-400 opacity-40 blur-md animate-pulse" />
        </motion.div>

        {/* Modern animated frequency / wave bars (NOT a spinning circle) */}
        <div className="mb-4 flex items-center justify-center gap-1.5 h-10">
          {[
            { h: [10, 32, 14, 28, 10], dur: 0.75, color: "from-emerald-500 to-lime" },
            { h: [22, 12, 36, 16, 22], dur: 0.65, color: "from-lime to-emerald-300" },
            { h: [14, 38, 20, 34, 14], dur: 0.85, color: "from-cyan-400 to-emerald-400" },
            { h: [26, 14, 30, 12, 26], dur: 0.7, color: "from-emerald-300 to-lime" },
            { h: [12, 28, 16, 32, 12], dur: 0.8, color: "from-lime to-cyan-400" },
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
        <h3 className="text-lg font-extrabold tracking-tight text-forest dark:text-white">
          {mode === "login"
            ? "Signing you in..."
            : isRegister
              ? "Setting up your account..."
              : "Processing your request..."}
        </h3>

        {/* Laser Sweep Progress Bar (1.5 seconds) */}
        <div className="mt-4 h-1.5 w-64 overflow-hidden rounded-full bg-slate-200/80 p-0 dark:bg-slate-800 shadow-inner">
          <motion.div
            initial={{ width: "8%" }}
            animate={{ width: "98%" }}
            transition={{ duration: 1.45, ease: "easeInOut" }}
            className="relative h-full rounded-full bg-gradient-to-r from-lime via-emerald-400 to-cyan-400 shadow-sm shadow-emerald-400/50"
          >
            <div className="absolute right-0 top-0 bottom-0 w-3 rounded-full bg-white blur-[1px]" />
          </motion.div>
        </div>

        {/* Status step indicator */}
        <div className="mt-3.5 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
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
              ? (mode === "login" ? "Verifying secure credentials..." : "Validating local information...")
              : (mode === "login" ? "Connecting to your neighborhood space..." : "Finalizing your new account...")}
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}
