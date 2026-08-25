import React from "react";
import { Sparkles, ArrowRight, Shield, Zap, Lock } from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onSignIn,
}) => {
  return (
    <div className="relative min-h-screen flex flex-col justify-between text-white select-none">
      {/* Top Glass Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-black/40 backdrop-blur-xl border-b border-white/10 z-50 px-6 md:px-12 flex items-center justify-between transition-all duration-300">
        <div
          id="landing-logo"
          onClick={onGetStarted}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.35)] group-hover:scale-105 transition-transform duration-300">
            <Sparkles className="w-4 h-4 text-sky-300 animate-pulse" />
          </div>
          <span className="font-headline text-lg md:text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-200 to-sky-400 drop-shadow-[0_0_20px_rgba(137,206,255,0.4)]">
            LIGHT AI
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <button
            onClick={onGetStarted}
            className="hover:text-sky-300 transition-colors cursor-pointer"
          >
            Intelligence
          </button>
          <button
            onClick={onGetStarted}
            className="hover:text-sky-300 transition-colors cursor-pointer"
          >
            Architecture
          </button>
          <button
            onClick={onGetStarted}
            className="hover:text-sky-300 transition-colors cursor-pointer"
          >
            Security
          </button>
        </nav>

        <button
          id="landing-sign-in-btn"
          onClick={onSignIn}
          className="px-5 py-2 rounded-full bg-gradient-to-r from-sky-600 to-cyan-500 text-white text-xs font-mono-code font-semibold uppercase tracking-wider hover:from-sky-500 hover:to-cyan-400 shadow-[0_0_20px_rgba(14,165,233,0.4)] hover:shadow-[0_0_30px_rgba(14,165,233,0.7)] transition-all duration-300 active:scale-95 cursor-pointer border border-sky-300/30"
        >
          Sign In
        </button>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center z-10">
        <div className="floating w-full max-w-2xl flex flex-col items-center">
          {/* Glass Hero Panel */}
          <div className="w-full glass-panel-dark rounded-3xl p-8 md:p-12 border border-sky-400/20 shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex flex-col items-center relative overflow-hidden group">
            {/* Subtle iridescent glow flare */}
            <div className="absolute -top-24 -left-24 w-60 h-60 bg-sky-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-sky-500/30 transition-colors duration-700"></div>
            <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/30 transition-colors duration-700"></div>

            {/* AI Sparkle Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-950/70 border border-sky-400/30 text-sky-300 text-xs font-mono-code mb-6 shadow-[0_0_15px_rgba(14,165,233,0.2)]">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Next-Gen Neural Synthesis</span>
            </div>

            {/* Main Title */}
            <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-3 drop-shadow-[0_0_30px_rgba(137,206,255,0.45)]">
              Light AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-200">Chatbot</span>
            </h1>

            {/* Subtitle */}
            <p className="font-headline text-xl sm:text-2xl text-slate-300 font-light mb-8 tracking-wide">
              Light Agent
            </p>

            {/* Breathing Glow CTA Button */}
            <button
              id="landing-get-started-btn"
              onClick={onGetStarted}
              className="breathing-glow px-9 py-4 rounded-full bg-gradient-to-r from-sky-400 via-cyan-400 to-sky-300 text-slate-950 font-mono-code text-sm font-bold tracking-widest uppercase hover:brightness-110 active:scale-95 transition-all duration-300 flex items-center gap-3 shadow-[0_0_35px_rgba(56,189,248,0.5)] cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick value props pill row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 w-full max-w-xl text-left">
            <div className="glass-panel-dark px-4 py-3 rounded-xl border border-white/10 flex items-center gap-3">
              <Zap className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="text-xs text-slate-300">Real-Time Streaming</span>
            </div>
            <div className="glass-panel-dark px-4 py-3 rounded-xl border border-white/10 flex items-center gap-3">
              <Lock className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="text-xs text-slate-300">Private User History</span>
            </div>
            <div className="glass-panel-dark px-4 py-3 rounded-xl border border-white/10 flex items-center gap-3">
              <Shield className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="text-xs text-slate-300">Read-Only Link Share</span>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="glass-panel-dark border-t border-white/10 py-5 px-6 md:px-12 text-slate-400 text-xs z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>© 2026 Light AI. Premium Intelligence.</p>
          <div className="flex items-center gap-6">
            <button onClick={onGetStarted} className="hover:text-white transition-colors cursor-pointer">
              Privacy
            </button>
            <button onClick={onGetStarted} className="hover:text-white transition-colors cursor-pointer">
              Terms
            </button>
            <button onClick={onGetStarted} className="hover:text-white transition-colors cursor-pointer">
              Security
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
