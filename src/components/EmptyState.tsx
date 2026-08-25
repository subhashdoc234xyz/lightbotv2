import React from "react";
import { Sparkles, Atom, Code, Palette, Zap } from "lucide-react";

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onSelectPrompt }) => {
  const suggestions = [
    {
      icon: Atom,
      title: "Quantum Physics",
      prompt: "Explain the concept of quantum entanglement simply.",
    },
    {
      icon: Code,
      title: "Architecture & Code",
      prompt: "Write a high-performance React component with custom hooks and debounce caching.",
    },
    {
      icon: Palette,
      title: "UI/UX Synthesis",
      prompt: "Design a deep space galaxy glassmorphism theme system with luminous glowing tokens.",
    },
    {
      icon: Zap,
      title: "Future Science",
      prompt: "What are the theoretical physics limits on faster-than-light communication and warp metrics?",
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center select-none animate-in fade-in duration-500">
      {/* Floating Center Badge */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-500/10 border border-sky-400/30 flex items-center justify-center shadow-[0_0_30px_rgba(14,165,233,0.3)] mb-6 glow-pulse">
        <Sparkles className="w-8 h-8 text-sky-400" />
      </div>

      <h2 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2 drop-shadow-[0_0_20px_rgba(137,206,255,0.4)]">
        Light AI
      </h2>
      <p className="font-body text-sm text-slate-400 max-w-md mb-8">
        Your luminous intelligence core. Ask a question, explore deep ideas, or synthesize code.
      </p>

      {/* Suggestion Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
        {suggestions.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectPrompt(item.prompt)}
              className="glass-card hover:bg-slate-900/80 p-4 rounded-2xl border border-sky-400/20 hover:border-sky-400/50 hover:shadow-[0_0_25px_rgba(14,165,233,0.25)] transition-all duration-300 group cursor-pointer text-left flex items-start gap-3.5 hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="w-8 h-8 rounded-xl bg-sky-950/80 border border-sky-400/30 flex items-center justify-center shrink-0 text-sky-400 group-hover:scale-110 transition-transform duration-300">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-mono-code text-sky-300 font-semibold uppercase tracking-wider mb-1">
                  {item.title}
                </div>
                <div className="text-xs text-slate-300 group-hover:text-white transition-colors line-clamp-2">
                  {item.prompt}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
