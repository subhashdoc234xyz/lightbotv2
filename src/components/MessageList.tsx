import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Copy, Check, RotateCw, ThumbsUp, ThumbsDown, User, Image as ImageIcon } from "lucide-react";
import { Message } from "../types";
import { FormattedContent } from "./FormattedContent";

interface MessageListProps {
  messages: Message[];
  isGenerating: boolean;
  onRegenerate?: (messageId: string) => void;
  onFeedback?: (messageId: string, feedback: "positive" | "negative") => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isGenerating,
  onRegenerate,
  onFeedback,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  const handleCopyResponse = async (message: Message) => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedId(message.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 custom-scrollbar pb-36">
      {messages.map((message, idx) => {
        const isUser = message.role === "user";
        const isLastAi = !isUser && idx === messages.length - 1;

        return (
          <div
            key={message.id || idx}
            className={`flex flex-col ${isUser ? "items-end" : "items-start"} animate-in fade-in slide-in-from-bottom-3 duration-300`}
          >
            <div className={`flex items-start gap-3 max-w-[94%] sm:max-w-[85%] md:max-w-[75%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
              {/* Avatar */}
              {!isUser ? (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(14,165,233,0.4)] border border-sky-300/40 mt-1">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-300 mt-1 shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}

              {/* Message Bubble Container */}
              <div className="flex flex-col gap-1.5 min-w-0">
                {/* Bubble */}
                <div
                  className={`p-5 rounded-2xl shadow-lg relative group ${
                    isUser
                      ? "bg-[#131b2e] border border-indigo-500/30 text-white rounded-tr-sm shadow-[0_4px_25px_rgba(0,0,0,0.3)]"
                      : "glass-card bg-slate-900/70 border border-sky-400/25 text-slate-100 rounded-tl-sm shadow-[0_10px_35px_rgba(0,0,0,0.25)] backdrop-blur-xl"
                  }`}
                >
                  {/* Optional uploaded image attachment preview */}
                  {message.image && (
                    <div className="mb-3 rounded-xl overflow-hidden border border-white/10 max-w-sm">
                      <img
                        src={message.image.previewUrl || `data:${message.image.mimeType};base64,${message.image.data}`}
                        alt="Uploaded context"
                        className="w-full h-auto object-cover max-h-60"
                      />
                    </div>
                  )}

                  {/* Message Content */}
                  <FormattedContent content={message.content} isStreaming={isLastAi && isGenerating} />
                </div>

                {/* Sub-bar / Hover Toolbar for AI messages */}
                {!isUser && (
                  <div className="flex items-center gap-1 px-2 pt-1 text-slate-400 text-xs">
                    {/* Copy Response Button */}
                    <button
                      onClick={() => handleCopyResponse(message)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-sky-300 transition-colors flex items-center gap-1.5 cursor-pointer text-[11px] font-mono-code"
                      title="Copy response"
                    >
                      {copiedId === message.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {/* Regenerate Button */}
                    {onRegenerate && (
                      <button
                        onClick={() => onRegenerate(message.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-sky-300 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Regenerate response"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Thumbs Up Feedback */}
                    {onFeedback && (
                      <button
                        onClick={() => onFeedback(message.id, "positive")}
                        className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer ${
                          message.feedback === "positive" ? "text-emerald-400 bg-emerald-950/40" : "hover:text-emerald-300"
                        }`}
                        title="Good response"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Thumbs Down Feedback */}
                    {onFeedback && (
                      <button
                        onClick={() => onFeedback(message.id, "negative")}
                        className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer ${
                          message.feedback === "negative" ? "text-rose-400 bg-rose-950/40" : "hover:text-rose-300"
                        }`}
                        title="Bad response"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Timestamp */}
                    <span className="ml-auto text-[10px] font-mono-code text-slate-500">
                      {formatTimestamp(message.createdAt)}
                    </span>
                  </div>
                )}

                {/* User message timestamp */}
                {isUser && (
                  <div className="text-right px-1">
                    <span className="text-[10px] font-mono-code text-slate-500">
                      {formatTimestamp(message.createdAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Typing indicator when model is thinking / before first token arrives */}
      {isGenerating && messages[messages.length - 1]?.role === "user" && (
        <div className="flex items-start gap-3 animate-in fade-in duration-300">
          <div className="w-8 h-8 rounded-full bg-sky-950/80 border border-sky-400/40 flex items-center justify-center shrink-0 text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.3)]">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div className="glass-panel-dark px-5 py-3.5 rounded-2xl rounded-tl-sm border border-sky-400/30 flex items-center gap-1.5 shadow-[0_0_20px_rgba(14,165,233,0.15)]">
            <div className="soundwave-bar" />
            <div className="soundwave-bar" />
            <div className="soundwave-bar" />
            <div className="soundwave-bar" />
            <div className="soundwave-bar" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
