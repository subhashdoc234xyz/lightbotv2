import React from "react";
import { Sparkles, ArrowLeft, MessageSquare, Shield } from "lucide-react";
import { Chat } from "../types";
import { MessageList } from "./MessageList";

interface PublicShareViewProps {
  chat: Chat | null;
  onBackToApp: () => void;
}

export const PublicShareView: React.FC<PublicShareViewProps> = ({
  chat,
  onBackToApp,
}) => {
  if (!chat) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="w-12 h-12 rounded-2xl bg-sky-950/80 border border-sky-400/30 flex items-center justify-center text-sky-400 mb-4 shadow-[0_0_25px_rgba(14,165,233,0.3)]">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h2 className="font-headline text-2xl font-bold mb-2">Shared Chat Not Found</h2>
        <p className="font-body text-xs text-slate-400 max-w-sm mb-6">
          This conversation may be private, expired, or removed by its owner.
        </p>
        <button
          onClick={onBackToApp}
          className="px-6 py-2.5 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono-code text-xs font-bold uppercase tracking-wider transition-all duration-200"
        >
          Open Light AI
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#05070f] text-white relative">
      {/* Top Header */}
      <header className="h-16 px-6 md:px-12 border-b border-sky-400/20 bg-black/50 backdrop-blur-xl flex items-center justify-between z-30 sticky top-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToApp}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors flex items-center gap-1 text-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="h-5 w-px bg-white/10 mx-1 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.3)]">
              <Sparkles className="w-3.5 h-3.5 text-sky-300" />
            </div>
            <span className="font-headline font-bold text-sm tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-sky-400">
              LIGHT AI
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-slate-400 text-[11px] font-mono-code select-none">
            <Shield className="w-3 h-3 text-sky-400" />
            <span>Read-Only</span>
          </div>

          <button
            onClick={onBackToApp}
            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-slate-950 font-mono-code text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-[0_0_15px_rgba(14,165,233,0.35)] cursor-pointer"
          >
            Start Chatting
          </button>
        </div>
      </header>

      {/* Main Thread Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto flex flex-col p-4 md:p-8">
        <div className="mb-6 p-4 rounded-2xl bg-slate-900/60 border border-sky-400/20 backdrop-blur-xl">
          <h1 className="font-headline text-xl sm:text-2xl font-bold text-white mb-1">
            {chat.title}
          </h1>
          <p className="font-body text-xs text-slate-400">
            Shared on {new Date(chat.createdAt).toLocaleDateString()} • {chat.messages.length} messages
          </p>
        </div>

        <div className="flex-1">
          <MessageList messages={chat.messages} isGenerating={false} />
        </div>
      </main>
    </div>
  );
};
