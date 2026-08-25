import React, { useState } from "react";
import { X, Copy, Check, Globe, Eye, Lock, ShieldCheck } from "lucide-react";
import { Chat } from "../types";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: Chat | null;
  onToggleShared: (chatId: string, isShared: boolean) => void;
  onOpenPublicPreview: (chatId: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  chat,
  onToggleShared,
  onOpenPublicPreview,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !chat) return null;

  const isShared = Boolean(chat.isShared);
  const shareUrl = `${window.location.origin}/#share=${chat.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    onToggleShared(chat.id, e.target.checked);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[460px] bg-slate-900/90 backdrop-blur-3xl rounded-[28px] border border-sky-400/30 p-7 shadow-[0_0_50px_rgba(14,165,233,0.3)] z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          id="share-close-btn"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 mb-3 shadow-[0_0_15px_rgba(14,165,233,0.3)]">
            <Globe className="w-5 h-5" />
          </div>
          <h2 className="font-headline text-xl font-bold text-white tracking-tight">
            Share this chat
          </h2>
          <p className="font-body text-xs text-slate-400 mt-0.5 truncate">
            {chat.title}
          </p>
        </div>

        {/* Toggle Switch */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${isShared ? "bg-sky-500/20 text-sky-400 border-sky-400/40" : "bg-slate-800 text-slate-500 border-slate-700"}`}>
              {isShared ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs font-semibold text-white">
                Public Link Access
              </div>
              <div className="text-[11px] text-slate-400">
                Anyone with the link can view this chat
              </div>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isShared}
              onChange={handleToggle}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500 shadow-inner"></div>
          </label>
        </div>

        {/* Link Input Section */}
        {isShared ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950/90 border border-sky-400/30">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-transparent px-3 py-1.5 text-xs text-slate-300 font-mono-code select-all focus:outline-none"
              />
              <button
                id="share-copy-link-btn"
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded-lg text-xs font-mono-code font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 ${
                  copied
                    ? "bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                    : "bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-[0_0_15px_rgba(14,165,233,0.4)]"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>Read-only view; personal info hidden.</span>
              </div>

              <button
                onClick={() => onOpenPublicPreview(chat.id)}
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center text-xs text-slate-500">
            Enable the toggle above to generate an active public share link.
          </div>
        )}
      </div>
    </div>
  );
};
