import React, { useState } from "react";
import {
  Sparkles,
  Share2,
  MoreVertical,
  Edit3,
  Trash2,
  Download,
  PanelLeft,
  Check,
  X,
  Layers,
  Zap,
  ChevronDown,
} from "lucide-react";
import { Chat, GroqModelId } from "../types";

interface ChatHeaderProps {
  chat: Chat | null;
  selectedModel: GroqModelId;
  onSelectModel: (model: GroqModelId) => void;
  onOpenSidebar: () => void;
  onOpenShareModal: () => void;
  onRenameChat: (chatId: string, title: string) => void;
  onDeleteChat: (chatId: string) => void;
  onExportChat: (format: "json" | "markdown") => void;
}

const MODEL_LABELS: Record<GroqModelId, { name: string; speed: string; tag: string }> = {
  "llama-3.3-70b-versatile": {
    name: "Groq Llama 3.3 70B",
    speed: "~350 t/s",
    tag: "Groq Ultra",
  },
  "llama-3.1-8b-instant": {
    name: "Groq Llama 3.1 8B",
    speed: "~700 t/s",
    tag: "Instant",
  },
  "mixtral-8x7b-32768": {
    name: "Mixtral 8x7B 32k",
    speed: "~400 t/s",
    tag: "Context",
  },
  "gemini-2.5-flash": {
    name: "Gemini 2.5 Flash",
    speed: "Standard",
    tag: "Multimodal",
  },
};

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  chat,
  selectedModel,
  onSelectModel,
  onOpenSidebar,
  onOpenShareModal,
  onRenameChat,
  onDeleteChat,
  onExportChat,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  const startEdit = () => {
    if (!chat) return;
    setTitleText(chat.title);
    setIsEditingTitle(true);
  };

  const saveEdit = () => {
    if (chat && titleText.trim()) {
      onRenameChat(chat.id, titleText.trim());
    }
    setIsEditingTitle(false);
  };

  const activeModelInfo = MODEL_LABELS[selectedModel] || MODEL_LABELS["llama-3.3-70b-versatile"];

  return (
    <header className="h-16 px-4 md:px-8 border-b border-sky-400/15 bg-black/40 backdrop-blur-xl flex items-center justify-between z-30 sticky top-0">
      {/* Left section: Sidebar toggle & Model Pill & Chat Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          id="header-sidebar-toggle-btn"
          onClick={onOpenSidebar}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
          title="Toggle sidebar"
        >
          <PanelLeft className="w-5 h-5" />
        </button>

        {/* Model Selector Pill Dropdown */}
        <div className="relative">
          <button
            id="model-selector-btn"
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-sky-400/30 hover:border-sky-400/60 text-sky-300 text-xs font-mono-code shadow-[0_0_15px_rgba(14,165,233,0.25)] transition-all cursor-pointer select-none"
          >
            <Zap className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span className="font-semibold">{activeModelInfo.name}</span>
            <span className="hidden md:inline text-[10px] text-sky-400/70">({activeModelInfo.speed})</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showModelDropdown ? "rotate-180" : ""}`} />
          </button>

          {showModelDropdown && (
            <div className="absolute left-0 top-11 w-64 bg-slate-900/95 backdrop-blur-2xl border border-sky-400/30 rounded-2xl p-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.7)] z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-1.5 text-[10px] font-mono-code uppercase text-slate-400 tracking-wider">
                Groq & Fallback AI Engines
              </div>
              {(Object.keys(MODEL_LABELS) as GroqModelId[]).map((mId) => {
                const info = MODEL_LABELS[mId];
                const isSelected = selectedModel === mId;
                return (
                  <button
                    key={mId}
                    onClick={() => {
                      onSelectModel(mId);
                      setShowModelDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-sky-500/20 text-white font-medium border border-sky-400/40"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-medium">{info.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono-code">{info.speed}</div>
                    </div>
                    <span className="text-[9px] font-mono-code px-1.5 py-0.5 rounded bg-sky-950 border border-sky-500/30 text-sky-300">
                      {info.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Chat Title (Editable) */}
        {chat && (
          <div className="hidden sm:flex items-center gap-2 min-w-0">
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={titleText}
                  onChange={(e) => setTitleText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") setIsEditingTitle(false);
                  }}
                  autoFocus
                  className="bg-slate-900 border border-sky-400 rounded-lg px-2.5 py-1 text-xs text-white font-medium focus:outline-none"
                />
                <button onClick={saveEdit} className="p-1 text-emerald-400 hover:text-emerald-300 cursor-pointer">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsEditingTitle(false)}
                  className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={startEdit}
                className="flex items-center gap-1.5 group cursor-pointer hover:bg-white/5 px-2 py-1 rounded-lg transition-colors max-w-xs sm:max-w-md"
              >
                <h1 className="text-xs sm:text-sm font-semibold text-slate-200 truncate group-hover:text-sky-300 transition-colors">
                  {chat.title}
                </h1>
                <Edit3 className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right section: Share button & Overflow Menu */}
      <div className="flex items-center gap-2.5">
        <button
          id="header-share-btn"
          onClick={onOpenShareModal}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-sky-400/30 text-sky-300 hover:text-white hover:border-sky-400/60 hover:bg-sky-950/60 text-xs font-mono-code uppercase tracking-wider transition-all duration-300 shadow-[0_0_15px_rgba(14,165,233,0.2)] hover:shadow-[0_0_25px_rgba(14,165,233,0.4)] cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Share Link</span>
        </button>

        {/* Overflow Menu */}
        <div className="relative">
          <button
            id="header-menu-btn"
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            title="Chat actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-11 w-48 bg-slate-900/95 backdrop-blur-2xl border border-sky-400/30 rounded-2xl p-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.6)] z-50 animate-in fade-in slide-in-from-top-2">
              <button
                onClick={() => {
                  setShowMenu(false);
                  startEdit();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                <span>Rename Chat</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  onExportChat("markdown");
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Export as Markdown</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  onExportChat("json");
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>Export JSON</span>
              </button>

              <div className="h-px bg-white/5 my-1" />

              {chat && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDeleteChat(chat.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-950/40 transition-colors text-left cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Chat</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
