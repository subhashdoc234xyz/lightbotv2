import React, { useState, useEffect } from "react";
import {
  X,
  Sliders,
  Sparkles,
  Trash2,
  Download,
  Key,
  Database,
  Check,
  Copy,
  Zap,
  Info,
  ExternalLink,
} from "lucide-react";
import { ChatSettings, GroqModelId } from "../types";
import { getSupabaseConfig, resetSupabaseClient } from "../lib/supabase";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ChatSettings;
  onUpdateSettings: (settings: ChatSettings) => void;
  onClearAllChats: () => void;
  onExportAllChats: () => void;
}

const SUPABASE_SCHEMA_SQL = `-- 🌟 Light AI Supabase Schema
-- Run this in your Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS public.chats (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  is_shared BOOLEAN DEFAULT FALSE,
  model TEXT DEFAULT 'llama-3.3-70b-versatile'
);

CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  feedback TEXT,
  image_data TEXT,
  image_mime TEXT
);

-- Enable Row Level Security
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Security Policies
CREATE POLICY "Users can access their own chats or shared ones" ON public.chats
  FOR ALL USING (auth.uid()::text = user_id OR is_shared = true);

CREATE POLICY "Users can access messages of their chats" ON public.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id 
      AND (chats.user_id = auth.uid()::text OR chats.is_shared = true)
    )
  );
`;

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onClearAllChats,
  onExportAllChats,
}) => {
  const [activeTab, setActiveTab] = useState<"general" | "groq" | "supabase">("general");
  const [groqKey, setGroqKey] = useState(settings.customGroqKey || "");
  const [supabaseUrl, setSupabaseUrl] = useState(
    localStorage.getItem("light_ai_supabase_url") || import.meta.env.VITE_SUPABASE_URL || ""
  );
  const [supabaseKey, setSupabaseKey] = useState(
    localStorage.getItem("light_ai_supabase_key") || import.meta.env.VITE_SUPABASE_ANON_KEY || ""
  );
  const [hasCopiedSQL, setHasCopiedSQL] = useState(false);
  const [serverHealth, setServerHealth] = useState<{ provider?: string; hasGroq?: boolean }>({});

  useEffect(() => {
    if (isOpen) {
      fetch("/api/health")
        .then((r) => r.json())
        .then((d) => setServerHealth(d))
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveGroqKey = () => {
    onUpdateSettings({
      ...settings,
      customGroqKey: groqKey.trim(),
    });
  };

  const handleSaveSupabase = () => {
    if (supabaseUrl.trim()) {
      localStorage.setItem("light_ai_supabase_url", supabaseUrl.trim());
    } else {
      localStorage.removeItem("light_ai_supabase_url");
    }
    if (supabaseKey.trim()) {
      localStorage.setItem("light_ai_supabase_key", supabaseKey.trim());
    } else {
      localStorage.removeItem("light_ai_supabase_key");
    }
    resetSupabaseClient();
    onUpdateSettings({
      ...settings,
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseKey.trim(),
    });
  };

  const copySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setHasCopiedSQL(true);
    setTimeout(() => setHasCopiedSQL(false), 2000);
  };

  const { isConfigured: isSupabaseConfigured } = getSupabaseConfig();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[540px] max-h-[90vh] overflow-y-auto custom-scrollbar bg-slate-900/95 backdrop-blur-3xl rounded-[28px] border border-sky-400/30 p-6 md:p-7 shadow-[0_0_60px_rgba(14,165,233,0.35)] z-10 animate-in fade-in zoom-in-95 duration-300">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.3)]">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-headline text-xl font-bold text-white tracking-tight">
              Settings & Integrations
            </h2>
            <p className="font-body text-xs text-slate-400">
              Configure Groq high-speed AI, Supabase cloud auth & schema.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 p-1 bg-slate-950/80 rounded-xl border border-white/5 mb-5 text-xs font-mono-code">
          <button
            onClick={() => setActiveTab("general")}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === "general"
                ? "bg-sky-500 text-slate-950 shadow-[0_0_12px_rgba(14,165,233,0.4)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            General & Models
          </button>
          <button
            onClick={() => setActiveTab("groq")}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "groq"
                ? "bg-sky-500 text-slate-950 shadow-[0_0_12px_rgba(14,165,233,0.4)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Groq Engine</span>
          </button>
          <button
            onClick={() => setActiveTab("supabase")}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "supabase"
                ? "bg-sky-500 text-slate-950 shadow-[0_0_12px_rgba(14,165,233,0.4)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Supabase Cloud</span>
          </button>
        </div>

        {/* TAB 1: General & Models */}
        {activeTab === "general" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Default Model */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-2">
                Default Groq / AI Model
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: "llama-3.3-70b-versatile", name: "Groq Llama 3.3 70B", desc: "Top reasoning & versatility" },
                  { id: "llama-3.1-8b-instant", name: "Groq Llama 3.1 8B", desc: "Blistering ~700 tokens/sec" },
                  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", desc: "32k context & balanced" },
                  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", desc: "Multimodal Google fallback" },
                ].map((m) => {
                  const isSelected = settings.model === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() =>
                        onUpdateSettings({
                          ...settings,
                          model: m.id as GroqModelId,
                        })
                      }
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-sky-500/20 border-sky-400 text-white shadow-[0_0_15px_rgba(14,165,233,0.25)]"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                      }`}
                    >
                      <div className="text-xs font-semibold text-sky-300">{m.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{m.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Persona Preset */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-2">
                AI Persona Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "default", label: "Default Light AI", desc: "Balanced & luminous" },
                  { id: "technical", label: "Deep Architect", desc: "Dense code & logic" },
                  { id: "concise", label: "Concise & Fast", desc: "Direct key answers" },
                  { id: "creative", label: "Visionary", desc: "Expansive & poetic" },
                ].map((p) => {
                  const isSelected = settings.systemPromptPreset === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() =>
                        onUpdateSettings({
                          ...settings,
                          systemPromptPreset: p.id as any,
                        })
                      }
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-sky-500/20 border-sky-400 text-white"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="text-xs font-semibold text-sky-300">{p.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{p.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Meteor Shower Background Intensity */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-2">
                Galaxy Visual Animation
              </label>
              <div className="flex gap-2">
                {(["full", "subtle", "off"] as const).map((mode) => {
                  const isSelected = settings.meteorIntensity === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() =>
                        onUpdateSettings({
                          ...settings,
                          meteorIntensity: mode,
                        })
                      }
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-mono-code uppercase font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-sky-500 text-slate-950 border-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.35)]"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Temperature Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-200 mb-1.5">
                <span>Creativity (Temperature)</span>
                <span className="font-mono-code text-sky-400">{settings.temperature}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={settings.temperature}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    temperature: parseFloat(e.target.value),
                  })
                }
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
            </div>

            {/* Data Actions */}
            <div className="pt-3 border-t border-white/5 space-y-2">
              <button
                onClick={onExportAllChats}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono-code transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export All Conversations (JSON)</span>
              </button>

              <button
                onClick={onClearAllChats}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs font-mono-code transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Chat History</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Groq Engine */}
        {activeTab === "groq" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-500/30 flex items-start gap-3">
              <Zap className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed">
                Groq provides low-latency Llama-3.3 70B & 8B inference at up to 700 tokens per second.
                You can configure <code className="text-sky-300">GROQ_API_KEY</code> in <code className="text-sky-300">.env</code> or enter your custom key below.
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Groq API Key (gsk_...)
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  placeholder="gsk_xxxxxxxxxxxxxxxxxxxx"
                  className="flex-1 bg-slate-950/80 border border-slate-700 focus:border-sky-400 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono-code focus:outline-none focus:ring-1 focus:ring-sky-400"
                />
                <button
                  onClick={handleSaveGroqKey}
                  className="px-4 py-2.5 bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-slate-950 font-mono-code font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1.5 text-xs font-mono-code text-slate-400">
              <div className="flex justify-between items-center">
                <span>Active Server Provider:</span>
                <span className="text-sky-300 font-semibold uppercase">{serverHealth.provider || "detecting..."}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Environment GROQ_API_KEY:</span>
                <span className={serverHealth.hasGroq ? "text-emerald-400" : "text-amber-400"}>
                  {serverHealth.hasGroq ? "Configured in .env" : "Not Set (Fallback Ready)"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Supabase Cloud */}
        {activeTab === "supabase" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 flex items-start gap-3">
              <Database className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed">
                Supabase provides Postgres database persistence and user authentication.
                {isSupabaseConfigured ? (
                  <span className="text-emerald-400 font-semibold block mt-1">
                    ✓ Connected to Supabase Cloud
                  </span>
                ) : (
                  <span className="text-amber-300 block mt-1">
                    Running in local per-user isolated storage mode.
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyzproject.supabase.co"
                  className="w-full bg-slate-950/80 border border-slate-700 focus:border-emerald-400 rounded-xl px-3.5 py-2 text-xs text-white font-mono-code focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Supabase Anon Key
                </label>
                <input
                  type="password"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  className="w-full bg-slate-950/80 border border-slate-700 focus:border-emerald-400 rounded-xl px-3.5 py-2 text-xs text-white font-mono-code focus:outline-none"
                />
              </div>

              <button
                onClick={handleSaveSupabase}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-mono-code font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                Save Supabase Credentials
              </button>
            </div>

            {/* Copyable SQL Schema */}
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-200">
                  Supabase SQL Database Schema
                </span>
                <button
                  onClick={copySQL}
                  className="flex items-center gap-1 text-[11px] font-mono-code text-sky-400 hover:text-sky-300 cursor-pointer"
                >
                  {hasCopiedSQL ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{hasCopiedSQL ? "Copied!" : "Copy SQL Script"}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-mono-code text-slate-400 max-h-36 overflow-y-auto custom-scrollbar">
                {SUPABASE_SCHEMA_SQL}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
